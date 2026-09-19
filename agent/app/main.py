"""Servicio HTTP del agente (Reto 1). Un único puerto, desplegado en Coolify (Anexo A.4).

- ``POST /chat``: recibe la pregunta en texto plano o JSON y responde con el contrato de §2.4.
- ``GET /health``: healthcheck del contenedor.
- ``GET /agent-card``: ficha del sistema multiagente (§2.3).
"""

from __future__ import annotations

import json
import logging
import threading
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from .contract import MAX_PREGUNTA_CHARS, ChatRequest
from .graph import Sistema
from .settings import get_settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("agente")

AGENT_CARD = Path(__file__).resolve().parent.parent / "agent_card.json"
CLAVES_PREGUNTA = ("pregunta", "question", "input", "query", "message", "mensaje", "text", "prompt")


def _crear_sistema() -> tuple[Sistema, object]:
    from .llm import BedrockLLM
    from .retrieval import RecuperadorEtapa1

    cfg = get_settings()
    recuperador = RecuperadorEtapa1(cfg.base_vectorial_dir, cfg.retrieval_config)
    return Sistema(BedrockLLM(), recuperador, cfg), recuperador


@asynccontextmanager
async def lifespan(app: FastAPI):
    sistema, recuperador = _crear_sistema()
    app.state.sistema = sistema
    app.state.recuperador = recuperador
    # La base vectorial y los modelos de embeddings tardan en cargar: se precargan en
    # segundo plano para que la primera pregunta de la evaluación no pague ese costo.
    threading.Thread(target=recuperador.cargar, daemon=True, name="precarga").start()
    yield


app = FastAPI(title="Agente CODEFEST AD ASTRA 2026", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in get_settings().cors_origins.split(",")],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


async def _leer_pregunta(request: Request) -> ChatRequest:
    cuerpo = await request.body()
    if len(cuerpo) > MAX_PREGUNTA_CHARS * 4:
        raise HTTPException(status_code=413, detail="la solicitud es demasiado grande")
    texto = cuerpo.decode("utf-8", errors="replace").strip()
    extras = False
    if "json" in request.headers.get("content-type", "") or texto.startswith("{"):
        try:
            datos = json.loads(texto)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="JSON inválido") from exc
        if isinstance(datos, str):
            texto = datos
        elif isinstance(datos, dict):
            texto = next((str(datos[k]) for k in CLAVES_PREGUNTA if datos.get(k)), "")
            extras = bool(datos.get("incluir_extras", False))
        else:
            raise HTTPException(status_code=400, detail="formato de pregunta no soportado")
    try:
        return ChatRequest(pregunta=texto, incluir_extras=extras)
    except ValidationError as exc:
        raise HTTPException(
            status_code=422, detail="la pregunta está vacía o es demasiado larga"
        ) from exc


@app.post("/chat")
async def chat(request: Request) -> JSONResponse:
    peticion = await _leer_pregunta(request)
    sistema: Sistema = request.app.state.sistema
    respuesta = await run_in_threadpool(
        sistema.responder, peticion.pregunta, peticion.incluir_extras
    )
    return JSONResponse(respuesta.model_dump(exclude_none=True))


@app.get("/health")
def health(request: Request) -> dict:
    return {"estado": "ok", "base_cargada": request.app.state.recuperador.listo}


@app.get("/agent-card")
def agent_card() -> JSONResponse:
    return JSONResponse(json.loads(AGENT_CARD.read_text(encoding="utf-8")))
