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
from .escaneo import sanear_fragmentos
from .guard import datamarcar, delimitar
from .llm import LLM
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

        tracker.recuperado([f.texto for f in fragmentos])
        # Datamarking (S3, spotlighting) solo sobre el texto del fragmento: la marca se
        # intercala entre sus palabras, no en la numeración "[n] (doc_id)" que el agente
        # necesita citar limpia.
        contexto = "\n\n".join(
            f"[{i}] ({f.doc_id}) {datamarcar(f.texto)}" for i, f in enumerate(fragmentos, 1)
        )
        texto = self._llm.completar(
            tracker=tracker,
            agente=self.nombre,
            modelo=self._cfg.modelo_corpus,
            sistema=prompts.AGENTE_CORPUS,
            mensaje=delimitar("FRAGMENTOS", contexto) + "\n\n" + delimitar("PREGUNTA", pregunta),
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
