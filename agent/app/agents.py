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
from .escaneo import clave_chunk, sanear_fragmentos
from .guard import datamarcar, delimitar
from .llm import LLM
from .planner import descomponer, intercalar
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
