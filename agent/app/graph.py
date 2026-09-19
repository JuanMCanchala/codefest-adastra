"""Orquestación multiagente con LangGraph.

Flujo: guarda → orquestador → {agente_corpus | agente_visualizacion | ambos | fuera de
alcance} → respuesta. La ruta más frecuente usa dos llamadas a modelos (orquestador +
especialista); un intento de inyección se rechaza sin gastar ninguna.
"""

from __future__ import annotations

import logging
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from . import prompts
from .agents import AgenteCorpus, AgenteVisualizacion, Decision, Orquestador
from .contract import ChatResponse, Evaluacion
from .guard import RECHAZO, detectar_inyeccion, sanear_salida
from .llm import LLM, ErrorModelo, PresupuestoAgotado
from .retrieval import Recuperador
from .settings import Settings
from .tracker import Tracker

log = logging.getLogger(__name__)


class Estado(TypedDict, total=False):
    pregunta: str
    tracker: Tracker
    decision: Decision
    respuesta: str
    fragmentos: list
    visualizacion: dict[str, Any] | None


class Sistema:
    def __init__(self, llm: LLM, recuperador: Recuperador, cfg: Settings) -> None:
        self.orquestador = Orquestador(llm, cfg)
        self.corpus = AgenteCorpus(llm, recuperador, cfg)
        self.visual = AgenteVisualizacion(llm, cfg)
        self._grafo = self._construir()

    # ------------------------------------------------------------------ nodos
    def _n_guarda(self, s: Estado) -> Estado:
        if detectar_inyeccion(s["pregunta"]):
            s["tracker"].agente(self.orquestador.nombre)
            s["tracker"].herramienta(
                "filtro_seguridad", {"accion": "rechazo"}, "patrón de inyección"
            )
            return {"respuesta": RECHAZO}
        return {}

    def _n_orquestador(self, s: Estado) -> Estado:
        return {"decision": self.orquestador.decidir(s["pregunta"], s["tracker"])}

    def _n_corpus(self, s: Estado) -> Estado:
        r = self.corpus.responder(s["pregunta"], s["decision"], s["tracker"])
        return {"respuesta": r.texto, "fragmentos": r.fragmentos}

    def _n_visual(self, s: Estado) -> Estado:
        spec = self.visual.proponer(s["pregunta"], s["decision"], s["tracker"])
        nuevo: Estado = {"visualizacion": spec.model_dump() if spec else None}
        if not s.get("respuesta"):
            nuevo["respuesta"] = (
                f"Preparé la visualización «{spec.titulo or spec.componente}». {spec.justificacion}"
                if spec
                else "No pude definir una visualización adecuada para esa solicitud. "
                "¿Puedes precisar qué quieres comparar o explorar?"
            )
        return nuevo

    def _n_fuera(self, s: Estado) -> Estado:
        return {"respuesta": prompts.FUERA_DE_ALCANCE}

    # ------------------------------------------------------------------ grafo
    def _construir(self):
        g = StateGraph(Estado)
        g.add_node("guarda", self._n_guarda)
        g.add_node("orquestador", self._n_orquestador)
        g.add_node("corpus", self._n_corpus)
        g.add_node("visualizacion", self._n_visual)
        g.add_node("fuera", self._n_fuera)
        g.set_entry_point("guarda")
        g.add_conditional_edges("guarda", lambda s: END if s.get("respuesta") else "orquestador")
        g.add_conditional_edges(
            "orquestador",
            lambda s: {
                "corpus": "corpus",
                "ambos": "corpus",
                "visualizacion": "visualizacion",
                "fuera_de_alcance": "fuera",
            }[s["decision"].ruta],
        )
        g.add_conditional_edges(
            "corpus",
            lambda s: "visualizacion" if s["decision"].ruta == "ambos" else END,
        )
        g.add_edge("visualizacion", END)
        g.add_edge("fuera", END)
        return g.compile()

    # ------------------------------------------------------------------ API
    def responder(self, pregunta: str, incluir_extras: bool = False) -> ChatResponse:
        tracker = Tracker()
        estado_final = "ok"
        try:
            s = self._grafo.invoke({"pregunta": pregunta, "tracker": tracker})
            respuesta = sanear_salida(s.get("respuesta") or prompts.SIN_EVIDENCIA)
        except PresupuestoAgotado:
            estado_final, s = "error_presupuesto", {}
            respuesta = "El servicio alcanzó su límite de uso. Intenta de nuevo más tarde."
        except ErrorModelo:
            estado_final, s = "error_modelo", {}
            respuesta = "No pude completar la respuesta por un problema temporal del modelo."

        extras = None
        if incluir_extras:
            extras = {
                "ruta": s["decision"].ruta if s.get("decision") else None,
                "citas": [
                    {
                        "n": i,
                        "doc_id": f.doc_id,
                        "chunk_id": f.chunk_id,
                        "fuente": f.fuente,
                        "titulo": f.titulo,
                    }
                    for i, f in enumerate(s.get("fragmentos") or [], 1)
                ],
                "visualizacion": s.get("visualizacion"),
            }
        return ChatResponse(
            respuesta=respuesta,
            evaluacion=Evaluacion(
                input=pregunta,
                actual_output=respuesta,
                retrieval_context=tracker.contexto,
                tools_called=tracker.tools,
            ),
            metadata=tracker.metadata(estado_final),
            extras=extras,
        )
