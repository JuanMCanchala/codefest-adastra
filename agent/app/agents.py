"""Agentes del sistema: orquestador, agente de corpus, agente satelital y de visualización.

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
from .amw.colombia import Colombia
from .amw.colombia import cargar as cargar_colombia
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


#: Señales de que la pregunta es sobre Colombia y no sobre los sitios peruanos.
_SENAL_COLOMBIA = (
    "colombia",
    "colombiano",
    "colombiana",
    "putumayo",
    "guainía",
    "guainia",
    "caquetá",
    "caqueta",
    "vaupés",
    "vaupes",
    "inírida",
    "inirida",
    "resguardo",
    "divipola",
)


class AgenteSatelital:
    """Cuarto agente: mide minería ilegal y cobertura boscosa sobre imágenes.

    Su evidencia no son fragmentos de texto sino áreas medidas, y se apoya en **dos**
    fuentes porque ningún modelo cubre las dos cosas:

    - `app.amw` — **Colombia**. Detecciones sobre Sentinel-2 (10 m/px) de Amazon Mining
      Watch, con serie 2018-2026 por departamento, resguardo indígena, área protegida y
      municipio con DIVIPOLA.
    - `app.eldor` — **Perú**. Segmentación de ortomosaicos de dron (5 cm/px) del conjunto
      ELDOR. Es la única parte validada contra máscaras anotadas, así que sostiene la
      calidad del método; no sirve para Colombia, donde no existe imagen a esa resolución
      (la medición está en `docs/investigacion/03_arquitectura/deteccion_satelital_eldor.md`).

    La procedencia cumple el papel de `doc_id`/`chunk_id`: fuente, modelo, sensor, periodo
    y —según la fuente— sitio y bbox o código DIVIPOLA. Las cifras se calculan fuera de
    línea; aquí solo se leen y se redactan.

    Sin datos de ninguna de las dos fuentes, `disponible` es False y el grafo no lo enruta.
    """

    nombre = "agente_satelital"

    def __init__(
        self,
        llm: LLM,
        cfg: Settings,
        detecciones: dict[str, Deteccion] | None = None,
        colombia: Colombia | None = None,
    ):
        self._llm, self._cfg = llm, cfg
        self._det = cargar_detecciones() if detecciones is None else detecciones
        self._col = cargar_colombia() if colombia is None else colombia

    @property
    def disponible(self) -> bool:
        return bool(self._det) or self._col.disponible

    def _es_sobre_colombia(self, pregunta: str) -> bool:
        texto = pregunta.lower()
        return any(s in texto for s in _SENAL_COLOMBIA)

    def _seleccionar(self, pregunta: str) -> list[Deteccion]:
        """Sitios peruanos nombrados en la pregunta; si no se nombra ninguno, todos."""
        texto = pregunta.lower()
        nombrados = [d for sid, d in self._det.items() if sid.lower() in texto]
        return nombrados or list(self._det.values())

    def responder(self, pregunta: str, tracker: Tracker) -> RespuestaCorpus:
        tracker.agente(self.nombre)
        sobre_colombia = self._es_sobre_colombia(pregunta)
        # Una pregunta sobre Colombia no arrastra los sitios peruanos: mezclarlos
        # invitaría a presentar hectáreas de Madre de Dios como si fueran colombianas.
        elegidos = [] if sobre_colombia else self._seleccionar(pregunta)
        usar_colombia = self._col.disponible and (sobre_colombia or not elegidos)

        mediciones: list[str] = []
        if usar_colombia:
            mediciones.append(
                f"[Colombia] {self._col.resumen()} Procedencia: {self._col.referencia()}"
            )
        mediciones += [f"[{d.sitio}] {d.resumen()} Procedencia: {d.referencia()}" for d in elegidos]

        total = agregado({d.sitio: d for d in elegidos})
        tracker.herramienta(
            "medir_cobertura_satelital",
            {"colombia": usar_colombia, "sitios_peru": [d.sitio for d in elegidos]},
            (f"Colombia {self._col.acumulado_ha} ha acumuladas; " if usar_colombia else "")
            + f"{total.get('sitios', 0)} sitios de Perú, "
            f"{total.get('area_mineria_ha', 0)} ha de huella minera",
        )
        if not mediciones:
            return RespuestaCorpus(texto=prompts.SIN_EVIDENCIA)

        # Las mediciones entran a `retrieval_context`: es la evidencia contra la que se
        # mide la fidelidad de la respuesta (§2.5, bloque A).
        tracker.recuperado(mediciones)
        contexto = "\n\n".join(mediciones)
        if len(elegidos) > 1:
            contexto += (
                f"\n\nAGREGADO de los {total['sitios']} sitios de Perú: "
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
