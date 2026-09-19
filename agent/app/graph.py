"""Orquestación multiagente con LangGraph.

Flujo: guarda → enrutador → {orquestador} → {agente_corpus → verificador |
agente_visualizacion | ambos | fuera de alcance} → respuesta.

El enrutador por embeddings (decisión A2) intenta clasificar la pregunta sin gastar
ninguna llamada al modelo; si no hay confianza suficiente —o el encoder todavía no
cargó—, cae al orquestador LLM, que pasa a ser el camino de excepción. La ruta más
frecuente sin enrutador queda en dos llamadas (orquestador + especialista); con
enrutador puede quedar en una sola. Un intento de inyección se rechaza sin gastar
ninguna. El verificador de citas, determinista, es el cuarto agente: no llama a
ningún modelo.
"""

from __future__ import annotations

import logging
from dataclasses import replace
from typing import Any, Protocol, TypedDict

from langgraph.graph import END, StateGraph

from . import prompts
from .agents import AgenteCorpus, AgenteVisualizacion, Decision, Orquestador
from .contract import ChatResponse, Evaluacion
from .guard import RECHAZO, Nivel, evaluar, sanear_salida
from .llm import LLM, ErrorModelo, PresupuestoAgotado
from .memoria import Memoria
from .retrieval import Recuperador
from .router import Enrutador, RouterEmbeddings
from .settings import Settings
from .tracker import Tracker
from .verificador import verificar_citas

log = logging.getLogger(__name__)


class Clasificador(Protocol):
    def es_ataque(self, texto: str) -> bool: ...


class Estado(TypedDict, total=False):
    pregunta: str
    sesion: str | None
    consulta_memoria: str | None
    tracker: Tracker
    decision: Decision
    respuesta: str
    fragmentos: list
    visualizacion: dict[str, Any] | None


class Sistema:
    def __init__(
        self,
        llm: LLM,
        recuperador: Recuperador,
        cfg: Settings,
        clasificador: Clasificador | None = None,
        router: Enrutador | None = None,
    ) -> None:
        self.clasificador = clasificador
        self.memoria = Memoria()
        self.orquestador = Orquestador(llm, cfg)
        self.corpus = AgenteCorpus(llm, recuperador, cfg)
        self.visual = AgenteVisualizacion(llm, cfg)
        # Router explícito para pruebas; si no se da, se activa solo cuando el
        # recuperador sabe codificar texto (RecuperadorEtapa1.codificar). Los dobles de
        # prueba sin ese método dejan el sistema tal como estaba: todo pasa por el
        # orquestador LLM.
        if router is not None:
            self.router: Enrutador | None = router
        elif hasattr(recuperador, "codificar"):
            self.router = RouterEmbeddings(recuperador)
        else:
            self.router = None
        self._grafo = self._construir()

    # ------------------------------------------------------------------ nodos
    def _n_guarda(self, s: Estado) -> Estado:
        # Dos niveles (decisión S1). Capa 1: patrones deterministas, ya separados en
        # rechazo (credenciales, ejecución de código: alto daño, alta precisión) y
        # aislar (todo lo demás: cambio de rol, jailbreak, exfiltración del prompt).
        # Capa 2: el clasificador solo corre si los patrones no vieron nada, y lo que
        # atrapa —lo que un regex no formuló— se trata igual que un aislamiento, no
        # como rechazo duro: no es de la categoría alto-daño/alta-precisión que
        # justifica bloquear sin más.
        nivel, motivo = evaluar(s["pregunta"])
        if (
            nivel is Nivel.LIMPIO
            and self.clasificador is not None
            and self.clasificador.es_ataque(s["pregunta"])
        ):
            nivel, motivo = Nivel.AISLAR, "clasificador de inyección"

        if nivel is Nivel.RECHAZO:
            s["tracker"].agente(self.orquestador.nombre)
            s["tracker"].herramienta("filtro_seguridad", {"accion": "rechazo"}, motivo)
            return {"respuesta": RECHAZO}
        if nivel is Nivel.AISLAR:
            # No se bloquea: sigue el flujo normal. La pregunta ya viaja delimitada como
            # dato no confiable en los tres prompts (agents.py), rechazo/aislar aquí solo
            # decide si se corta antes de gastar una llamada o se deja seguir.
            s["tracker"].herramienta("filtro_seguridad", {"accion": "aislar"}, motivo)
        return {}

    def _n_memoria(self, s: Estado) -> Estado:
        # Sin `sesion` (el caso de la evaluación de ADL) esto es un no-op: ni consulta la
        # memoria ni la escribe, así que el comportamiento medido no cambia.
        consulta, motivo = self.memoria.expandir(s.get("sesion"), s["pregunta"])
        if motivo is None:
            return {}
        s["tracker"].herramienta("memoria_conversacion", {"sesion": "***"}, motivo)
        return {"consulta_memoria": consulta}

    def _n_enrutador(self, s: Estado) -> Estado:
        # Cero llamadas al modelo. Si no hay router, o el router se abstiene por baja
        # confianza o encoder no listo, el estado queda sin "decision" y la arista
        # condicional cae al orquestador LLM.
        if self.router is None:
            return {}
        d = self.router.enrutar(s["pregunta"])
        if d.ruta is None:
            return {}
        s["tracker"].agente("enrutador_embeddings")
        s["tracker"].herramienta(
            "enrutar_por_embeddings",
            {"pregunta": s["pregunta"][:200]},
            f"ruta={d.ruta} confianza={d.confianza:.2f} margen={d.margen:.2f}",
        )
        return {"decision": Decision(ruta=d.ruta, fenomeno=None, consulta=s["pregunta"])}

    def _n_orquestador(self, s: Estado) -> Estado:
        return {"decision": self.orquestador.decidir(s["pregunta"], s["tracker"])}

    def _n_corpus(self, s: Estado) -> Estado:
        decision = s["decision"]
        expandida = s.get("consulta_memoria")
        if expandida:
            # Solo la consulta de búsqueda hereda el turno anterior; `pregunta` —y por
            # tanto `evaluacion.input`— sigue siendo la que escribió el usuario.
            decision = replace(decision, consulta=expandida)
        r = self.corpus.responder(s["pregunta"], decision, s["tracker"])
        return {"respuesta": r.texto, "fragmentos": r.fragmentos}

    def _n_verificador(self, s: Estado) -> Estado:
        fragmentos = s.get("fragmentos") or []
        r = verificar_citas(s.get("respuesta", ""), len(fragmentos))
        s["tracker"].agente("verificador_citas")
        s["tracker"].herramienta(
            "verificar_citas",
            {"num_fragmentos": len(fragmentos)},
            f"validas={r.citas_validas} invalidas={r.citas_invalidas}",
        )
        return {"respuesta": r.texto}

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
    @staticmethod
    def _nodo_por_ruta(ruta: str) -> str:
        # ``ruta`` ya viene acotada a RUTAS por Orquestador.decidir y por RouterEmbeddings;
        # una clave fuera de ese conjunto es un error de programación y debe fallar aquí.
        # `visualizacion` tambien entra por el corpus: sin eso `retrieval_context` iba
        # vacio y la fidelidad (30 % del bloque de Calidad) no se puede medir contra un
        # contexto vacio, ademas de que una pregunta de corpus mal enrutada se perdia
        # entera. De paso el tablero recibe la evidencia que sustenta el grafico, que el
        # Anexo B.1.3 exige trazable hasta doc_id y chunk_id.
        return {
            "corpus": "corpus",
            "ambos": "corpus",
            "visualizacion": "corpus",
            "fuera_de_alcance": "fuera",
        }[ruta]

    def _construir(self):
        g = StateGraph(Estado)
        g.add_node("guarda", self._n_guarda)
        g.add_node("memoria", self._n_memoria)
        g.add_node("enrutador", self._n_enrutador)
        g.add_node("orquestador", self._n_orquestador)
        g.add_node("corpus", self._n_corpus)
        g.add_node("verificador", self._n_verificador)
        g.add_node("visualizacion", self._n_visual)
        g.add_node("fuera", self._n_fuera)
        g.set_entry_point("guarda")
        g.add_conditional_edges("guarda", lambda s: END if s.get("respuesta") else "memoria")
        g.add_edge("memoria", "enrutador")
        g.add_conditional_edges(
            "enrutador",
            lambda s: (
                self._nodo_por_ruta(s["decision"].ruta) if s.get("decision") else "orquestador"
            ),
        )
        g.add_conditional_edges(
            "orquestador",
            lambda s: self._nodo_por_ruta(s["decision"].ruta),
        )
        g.add_edge("corpus", "verificador")
        g.add_conditional_edges(
            "verificador",
            lambda s: "visualizacion" if s["decision"].ruta in {"ambos", "visualizacion"} else END,
        )
        g.add_edge("visualizacion", END)
        g.add_edge("fuera", END)
        return g.compile()

    # ------------------------------------------------------------------ API
    def responder(
        self, pregunta: str, incluir_extras: bool = False, sesion: str | None = None
    ) -> ChatResponse:
        tracker = Tracker()
        estado_final = "ok"
        try:
            s = self._grafo.invoke({"pregunta": pregunta, "tracker": tracker, "sesion": sesion})
            respuesta = sanear_salida(s.get("respuesta") or prompts.SIN_EVIDENCIA)
        except PresupuestoAgotado:
            estado_final, s = "error_presupuesto", {}
            respuesta = "El servicio alcanzó su límite de uso. Intenta de nuevo más tarde."
        except ErrorModelo:
            estado_final, s = "error_modelo", {}
            respuesta = "No pude completar la respuesta por un problema temporal del modelo."

        # Se recuerda el turno solo si el cliente trajo sesión, y solo cuando hubo una
        # decisión de ruta: un rechazo del filtro de seguridad no entra en el historial.
        if sesion and s.get("decision"):
            self.memoria.recordar(sesion, pregunta, s["decision"].ruta)

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
