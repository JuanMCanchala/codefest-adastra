"""Agentes del sistema: orquestador, agente de corpus y agente de visualización.

Cada agente hace como máximo una llamada al modelo: la eficiencia (tokens, número de
interacciones y latencia) se puntúa frente a los demás equipos (§2.5.2).
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from typing import Any

from pydantic import ValidationError

from . import prompts
from .catalogo import SpecVisualizacion, describir_catalogo
from .escaneo import clave_chunk, sanear_fragmentos
from .guard import datamarcar, delimitar
from .llm import LLM
from .planner import descomponer, intercalar
from .retrieval import Fragmento, Recuperador
from .settings import Settings
from .tracker import Tracker

log = logging.getLogger(__name__)

RUTAS = {"corpus", "visualizacion", "ambos", "fuera_de_alcance"}
_JSON = re.compile(r"\{.*\}", re.DOTALL)


def extraer_json(texto: str) -> dict[str, Any]:
    """Toma el primer objeto JSON de la salida del modelo (tolera texto alrededor)."""
    m = _JSON.search(texto)
    if not m:
        raise ValueError("el modelo no devolvió JSON")
    return json.loads(m.group(0))


@dataclass
class Decision:
    ruta: str
    fenomeno: int | None
    consulta: str


@dataclass
class RespuestaCorpus:
    texto: str
    fragmentos: list[Fragmento] = field(default_factory=list)


class Orquestador:
    nombre = "orquestador"

    def __init__(self, llm: LLM, cfg: Settings) -> None:
        self._llm, self._cfg = llm, cfg

    def decidir(self, pregunta: str, tracker: Tracker) -> Decision:
        salida = self._llm.completar(
            tracker=tracker,
            agente=self.nombre,
            modelo=self._cfg.modelo_orquestador,
            sistema=prompts.ORQUESTADOR,
            mensaje=delimitar("PREGUNTA", pregunta),
            max_tokens=160,
            temperatura=0.0,
        )
        try:
            datos = extraer_json(salida)
            ruta = datos.get("ruta") if datos.get("ruta") in RUTAS else "corpus"
            fen = datos.get("fenomeno") if datos.get("fenomeno") in (1, 2, 3) else None
            consulta = str(datos.get("consulta") or pregunta)[:500]
        except (ValueError, json.JSONDecodeError):
            # Ante una salida malformada se asume la ruta más útil: buscar en el corpus.
            log.warning("orquestador devolvió una salida no parseable; ruta por defecto")
            ruta, fen, consulta = "corpus", None, pregunta
        return Decision(ruta=ruta, fenomeno=fen, consulta=consulta)


class AgenteCorpus:
    nombre = "agente_corpus"

    def __init__(self, llm: LLM, recuperador: Recuperador, cfg: Settings) -> None:
        self._llm, self._rec, self._cfg = llm, recuperador, cfg

    def responder(self, pregunta: str, decision: Decision, tracker: Tracker) -> RespuestaCorpus:
        tracker.agente(self.nombre)
        k = self._cfg.fragmentos_contexto
        # Planner determinista (planner.py): una pregunta compuesta se busca por partes y
        # los fragmentos se reparten por turnos entre ellas. Cuesta una búsqueda extra por
        # subpregunta —décimas de segundo, cero tokens, cero interacciones— y el contexto
        # sigue acotado a `k`. Una pregunta simple devuelve [pregunta] y el flujo es el de
        # siempre.
        subpreguntas = descomponer(decision.consulta)
        if len(subpreguntas) > 1:
            rankings = [self._rec.buscar(s, k) for s in subpreguntas]
            fragmentos = intercalar(rankings, k, lambda f: f.chunk_id)
            tracker.herramienta(
                "planificar_consulta",
                {"consulta": decision.consulta},
                f"{len(subpreguntas)} subpreguntas: " + " | ".join(subpreguntas),
            )
        else:
            fragmentos = self._rec.buscar(decision.consulta, k)
        tracker.herramienta(
            "buscar_corpus",
            {"query": decision.consulta, "k": k},
            "; ".join(f"{f.doc_id}#{f.chunk_id}" for f in fragmentos) or "sin resultados",
        )
        if not fragmentos:
            return RespuestaCorpus(texto=prompts.SIN_EVIDENCIA)

        # Escaneo de inyección indirecta (decisión S2/S3): un documento del corpus con
        # instrucciones embebidas no entra crudo al prompt del redactor. Se neutraliza el
        # tramo, no se descarta el fragmento completo, porque el resto suele ser
        # evidencia legítima. retrieval_context (contrato §2.4) refleja lo que
        # efectivamente se le entregó al modelo, ya saneado.
        fragmentos, marcados = sanear_fragmentos(fragmentos)
        if marcados:
            tracker.herramienta(
                "escanear_fragmentos",
                {"num_fragmentos": len(fragmentos)},
                f"chunk_ids neutralizados: {marcados}",
            )

        # Calificación de evidencia (evidence gating). El score del cross-encoder separa
        # bien lo que el corpus sí cubre de lo que no: ver el umbral en settings.py. No
        # se abstiene —eso costaría relevancia, que vale 30 %—, se le pide cautela al
        # redactor para que no afirme más de lo que los fragmentos sostienen.
        mejor = max((f.score for f in fragmentos), default=0.0)
        evidencia_debil = mejor < self._cfg.umbral_evidencia
        if evidencia_debil:
            tracker.herramienta(
                "calificar_evidencia",
                {"umbral": self._cfg.umbral_evidencia},
                f"mejor_score={mejor:.3f} -> evidencia débil",
            )

        tracker.recuperado([f.texto for f in fragmentos])
        # Datamarking (S3, spotlighting) solo sobre los fragmentos que el escaneo marcó
        # como sospechosos, no sobre los seis.
        #
        # Medido el 19-sep-2026: intercalar la marca entre palabras multiplica por 2,14
        # los tokens del contexto (314 → 673 con el tokenizador de BGE-M3). Aplicado a
        # todos, subía el gasto de 2 627 a 4 328 tokens por pregunta: un +65 % en la
        # métrica que pesa el 40 % del bloque de Eficiencia y que se normaliza contra los
        # demás equipos. La defensa es contra inyección indirecta, y esa solo existe en un
        # fragmento que trae instrucciones embebidas: pagarla en los limpios es gasto sin
        # amenaza.
        #
        # En un fragmento sospechoso el escaneo ya sustituyó el tramo detectado por un
        # aviso; el datamarking se mantiene como segunda capa sobre el resto de ESE
        # fragmento, para los tramos que el regex no formuló. La marca va solo en el
        # texto, nunca en la numeración "[n] (doc_id)" que el agente debe citar limpia.
        sospechosos = set(marcados)
        contexto = "\n\n".join(
            f"[{i}] ({f.doc_id}) "
            + (datamarcar(f.texto) if clave_chunk(f.chunk_id) in sospechosos else f.texto)
            for i, f in enumerate(fragmentos, 1)
        )
        texto = self._llm.completar(
            tracker=tracker,
            agente=self.nombre,
            modelo=self._cfg.modelo_corpus,
            sistema=prompts.AGENTE_CORPUS,
            mensaje=delimitar("FRAGMENTOS", contexto)
            + ("\n\n" + prompts.AVISO_EVIDENCIA_DEBIL if evidencia_debil else "")
            + "\n\n"
            + delimitar("PREGUNTA", pregunta),
            max_tokens=self._cfg.llm_max_tokens_respuesta,
        )
        return RespuestaCorpus(texto=texto, fragmentos=fragmentos)


class AgenteVisualizacion:
    nombre = "agente_visualizacion"

    def __init__(self, llm: LLM, cfg: Settings) -> None:
        self._llm, self._cfg = llm, cfg

    def proponer(
        self, pregunta: str, decision: Decision, tracker: Tracker
    ) -> SpecVisualizacion | None:
        salida = self._llm.completar(
            tracker=tracker,
            agente=self.nombre,
            modelo=self._cfg.modelo_visualizacion,
            sistema=prompts.AGENTE_VISUALIZACION + "\nCatálogo:\n" + describir_catalogo(),
            mensaje=delimitar("SOLICITUD", pregunta),
            max_tokens=220,
            temperatura=0.0,
        )
        try:
            datos = extraer_json(salida)
            if datos.get("fenomeno") is None:
                datos["fenomeno"] = decision.fenomeno
            # Un valor con "|" es la lista de alternativas copiada del catálogo, no un filtro.
            datos["filtros"] = {
                k: v
                for k, v in (datos.get("filtros") or {}).items()
                if v not in (None, "") and not (isinstance(v, str) and "|" in v)
            }
            spec = SpecVisualizacion(**datos)
        except (ValueError, json.JSONDecodeError, ValidationError, TypeError):
            log.warning("especificación de visualización inválida")
            return None
        tracker.herramienta(
            "seleccionar_componente",
            {"componente": spec.componente, "fenomeno": spec.fenomeno, "filtros": spec.filtros},
            spec.justificacion or spec.titulo,
        )
        return spec
