"""Servidor offline: el mismo ``Sistema``, pero con un recuperador que sirve los
fragmentos ya calculados de la Etapa 1 en vez de cargar el índice FAISS real.

Sin torch, sin FAISS, arranque instantáneo. Sirve para iterar sobre prompts (Parte 4)
sin recargar ~2,5 GB de modelos en cada reinicio, y como plan B si la descarga del
índice o la instalación de torch fallan (Fase 0 del plan de desarrollo).

Solo cubre las 50 preguntas oficiales, indexadas por el texto exacto de la pregunta:
si el orquestador reformula la consulta, o la pregunta es de ``fuera_de_alcance`` o de
``ataques``, no hay fragmentos y el agente de corpus se abstiene — correcto para esos
dos casos, aproximado para el primero. Rutas configurables por env var porque el
repo ``ad-astra-retrieval`` que las produce es un checkout hermano, no un submódulo:
no se asume que exista en la máquina de quien lo corra.

Uso:
    LLM_API_KEY=... uvicorn eval.servidor_offline:app --port 8001
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from starlette.requests import Request

from app.contract import ChatRequest
from app.graph import Sistema
from app.llm import crear_llm
from app.retrieval import Fragmento
from app.settings import get_settings

_RAIZ_HERMANA = Path(__file__).resolve().parents[3] / "ad-astra-retrieval"
RUTA_RESULTADOS = Path(
    os.environ.get("EVAL_RESULTADOS_ETAPA1", _RAIZ_HERMANA / "entrega" / "resultados.jsonl")
)
RUTA_PREGUNTAS = Path(
    os.environ.get("EVAL_PREGUNTAS_ETAPA1", _RAIZ_HERMANA / "data" / "adl" / "queries.jsonl")
)


class RecuperadorOffline:
    """Sirve los fragmentos ya calculados por pregunta oficial. No sabe recuperar nada
    que no esté en ese conjunto: pensado solo para iterar sobre prompts, no para medir
    calidad de recuperación."""

    listo = True

    def __init__(
        self,
        ruta_resultados: Path = RUTA_RESULTADOS,
        ruta_preguntas: Path = RUTA_PREGUNTAS,
    ) -> None:
        self._por_texto: dict[str, list[Fragmento]] = {}
        if not ruta_resultados.exists() or not ruta_preguntas.exists():
            return

        preguntas: dict[str, str] = {}
        with ruta_preguntas.open(encoding="utf-8") as f:
            for linea in f:
                if linea.strip():
                    d = json.loads(linea)
                    preguntas[d["query_id"]] = d["text"]

        with ruta_resultados.open(encoding="utf-8") as f:
            for linea in f:
                if not linea.strip():
                    continue
                d = json.loads(linea)
                texto_pregunta = preguntas.get(d["query_id"])
                if not texto_pregunta:
                    continue
                self._por_texto[texto_pregunta] = [
                    Fragmento(
                        doc_id=fr["doc_id"],
                        chunk_id=str(fr["chunk_id"]),
                        texto=fr["text"],
                        fuente="",
                        fenomeno=None,
                    )
                    for fr in d.get("fragments", [])
                ]

    def cargar(self) -> None:
        pass

    def buscar(self, consulta: str, k: int) -> list[Fragmento]:
        return self._por_texto.get(consulta, [])[:k]

    @property
    def num_preguntas_disponibles(self) -> int:
        return len(self._por_texto)


def crear_app() -> FastAPI:
    cfg = get_settings()
    recuperador = RecuperadorOffline()
    sistema = Sistema(crear_llm(), recuperador, cfg)

    app = FastAPI(title="Agente CODEFEST — servidor offline (solo desarrollo)")

    @app.post("/chat")
    async def chat(request: Request) -> JSONResponse:
        cuerpo = await request.json()
        pregunta = cuerpo.get("pregunta") or cuerpo.get("question") or ""
        peticion = ChatRequest(pregunta=pregunta)
        respuesta = sistema.responder(peticion.pregunta)
        return JSONResponse(respuesta.model_dump(exclude_none=True))

    @app.get("/health")
    def health() -> dict[str, object]:
        return {
            "estado": "ok",
            "base_cargada": recuperador.num_preguntas_disponibles > 0,
            "modo": "offline",
            "preguntas_disponibles": recuperador.num_preguntas_disponibles,
        }

    return app


app = crear_app()
