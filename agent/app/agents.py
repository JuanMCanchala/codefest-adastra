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
from .eldor.evidencia import Deteccion, agregado, cargar_detecciones
from .guard import delimitar
from .llm import LLM
from .retrieval import Fragmento, Recuperador
from .settings import Settings
from .tracker import Tracker

log = logging.getLogger(__name__)

RUTAS = {"corpus", "visualizacion", "satelital", "ambos", "fuera_de_alcance"}
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

        tracker.recuperado([f.texto for f in fragmentos])
        contexto = "\n\n".join(f"[{i}] ({f.doc_id}) {f.texto}" for i, f in enumerate(fragmentos, 1))
        texto = self._llm.completar(
            tracker=tracker,
            agente=self.nombre,
            modelo=self._cfg.modelo_corpus,
            sistema=prompts.AGENTE_CORPUS,
            mensaje=delimitar("FRAGMENTOS", contexto) + "\n\n" + delimitar("PREGUNTA", pregunta),
            max_tokens=self._cfg.llm_max_tokens_respuesta,
        )
        return RespuestaCorpus(texto=texto, fragmentos=fragmentos)


class AgenteSatelital:
    """Cuarto agente: mide minería ilegal y cobertura boscosa sobre imágenes de dron.

    A diferencia del agente de corpus, su evidencia no son fragmentos de texto sino
    áreas segmentadas con el modelo ELDOR (ver `app/eldor/`). La procedencia cumple el
    mismo papel que `doc_id`/`chunk_id`: sitio, CRS, bbox geográfico, fecha de vuelo y
    checkpoint. Las cifras se calculan fuera de línea; aquí solo se leen y se redactan.

    Si no hay detecciones en disco, `disponible` es False y el grafo no lo enruta.
    """

    nombre = "agente_satelital"

    def __init__(self, llm: LLM, cfg: Settings, detecciones: dict[str, Deteccion] | None = None):
        self._llm, self._cfg = llm, cfg
        self._det = cargar_detecciones() if detecciones is None else detecciones

    @property
    def disponible(self) -> bool:
        return bool(self._det)

    def _seleccionar(self, pregunta: str) -> list[Deteccion]:
        """Sitios nombrados en la pregunta; si no se nombra ninguno, todos."""
        texto = pregunta.lower()
        nombrados = [d for sid, d in self._det.items() if sid.lower() in texto]
        return nombrados or list(self._det.values())

    def responder(self, pregunta: str, tracker: Tracker) -> RespuestaCorpus:
        tracker.agente(self.nombre)
        elegidos = self._seleccionar(pregunta)
        total = agregado({d.sitio: d for d in elegidos})
        tracker.herramienta(
            "medir_cobertura_eldor",
            {"sitios": [d.sitio for d in elegidos]},
            f"{total.get('sitios', 0)} sitios, "
            f"{total.get('area_mineria_ha', 0)} ha de huella minera, "
            f"{total.get('area_bosque_ha', 0)} ha de bosque primario",
        )
        if not elegidos:
            return RespuestaCorpus(texto=prompts.SIN_EVIDENCIA)

        # El resumen de cada sitio entra a `retrieval_context`: es la evidencia contra la
        # que se mide la fidelidad de la respuesta (§2.5, bloque A).
        mediciones = [f"[{d.sitio}] {d.resumen()} Procedencia: {d.referencia()}" for d in elegidos]
        tracker.recuperado(mediciones)
        contexto = "\n\n".join(mediciones)
        if len(elegidos) > 1:
            contexto += (
                f"\n\nAGREGADO de los {total['sitios']} sitios: "
                f"{total['area_total_ha']} ha segmentadas, "
                f"{total['area_mineria_ha']} ha de huella minera, "
                f"{total['area_bosque_ha']} ha de bosque primario, "
                f"{total['area_intervenida_ha']} ha intervenidas."
            )
        texto = self._llm.completar(
            tracker=tracker,
            agente=self.nombre,
            modelo=self._cfg.modelo_satelital,
            sistema=prompts.AGENTE_SATELITAL,
            mensaje=delimitar("MEDICIONES", contexto) + "\n\n" + delimitar("PREGUNTA", pregunta),
            max_tokens=self._cfg.llm_max_tokens_respuesta,
        )
        return RespuestaCorpus(texto=texto)


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
