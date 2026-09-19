"""API del tablero (Reto 2) y SPA compilada en un único puerto (Anexo A.4).

Todos los valores salen de ``dashboard.db`` (conteos y agregaciones, nunca puntajes) y son
trazables a ``doc_id`` y ``chunk_id``; el texto de cada fragmento se lee de ``metadata.jsonl``.
"""

from __future__ import annotations

import logging
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator
from starlette.exceptions import HTTPException as StarletteHTTPException

from .componentes import CATALOGO, describir_catalogo, ejecutar
from .componentes.evidencia_satelital import buscar_triptico
from .db import BaseDatos
from .evidencia import MAX_LOTE, IndiceTextos
from .lectura import PeticionLectura, configurada, resumir
from .settings import Settings, get_settings
from .visualizar import (
    Instruccion,
    leer_citas,
    leer_especificacion,
    leer_traza,
    preguntar_al_agente,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("tablero")

GEOMETRIAS = {"departamentos", "municipios", "paises"}

DOCUMENTO_DEL_FRAGMENTO = """
SELECT d.doc_id AS doc_id, d.titulo AS titulo, d.organizacion AS organizacion,
       d.fenomeno AS fenomeno, d.fecha AS fecha
  FROM fragmentos f JOIN documentos d ON d.doc_id = f.doc_id
 WHERE f.chunk_id = :chunk_id
"""


class PeticionComponente(BaseModel):
    componente: str
    fenomeno: int | None = Field(default=None, ge=1, le=3)
    filtros: dict[str, Any] = Field(default_factory=dict)

    @field_validator("componente")
    @classmethod
    def _en_catalogo(cls, valor: str) -> str:
        if valor not in CATALOGO:
            raise ValueError(f"componente fuera del catálogo: {valor}")
        return valor


class SPA(StaticFiles):
    """Sirve la SPA y devuelve ``index.html`` para las rutas del cliente."""

    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code == 404:
                return await super().get_response("index.html", scope)
            raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    cfg = get_settings()
    app.state.cfg = cfg
    app.state.bd = BaseDatos(cfg.db_path)
    app.state.textos = IndiceTextos(cfg.metadata_path)
    log.info("base analítica: %s | metadata: %s", cfg.db_path, cfg.metadata_path)
    threading.Thread(target=app.state.bd.precalentar, daemon=True, name="precalentar").start()
    if app.state.textos.disponible:
        # El índice de offsets recorre metadata.jsonl una vez (~200 MB): se construye en
        # segundo plano para que la primera consulta de evidencia no pague ese costo.
        threading.Thread(
            target=app.state.textos.construir, daemon=True, name="indice-textos"
        ).start()
    yield


app = FastAPI(title="Tablero CODEFEST AD ASTRA 2026", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in get_settings().cors_origins.split(",")],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/salud")
def salud(request: Request) -> dict[str, Any]:
    bd: BaseDatos = request.app.state.bd
    textos: IndiceTextos = request.app.state.textos
    cfg: Settings = request.app.state.cfg
    return {
        "estado": "ok",
        "tablas": bd.conteos(),
        "textos": {"disponible": textos.disponible, "indexado": textos.listo},
        "vista_tecnica": cfg.vista_tecnica,
        "consola_url": cfg.consola_url.rstrip("/") or None,
        "corpus_disponible": _raiz_corpus(cfg) is not None,
        "lectura_disponible": configurada(cfg),
    }


@app.get("/api/catalogo")
def catalogo() -> dict[str, Any]:
    return {"componentes": describir_catalogo()}


@app.post("/api/componente")
def componente(peticion: PeticionComponente, request: Request) -> JSONResponse:
    resultado = ejecutar(
        request.app.state.bd,
        request.app.state.textos,
        peticion.componente,
        peticion.fenomeno,
        peticion.filtros,
    )
    return JSONResponse(resultado)


@app.post("/api/visualizar")
async def visualizar(peticion: Instruccion, request: Request) -> JSONResponse:
    cfg = request.app.state.cfg
    cuerpo = await preguntar_al_agente(cfg.agent_url, peticion.instruccion, cfg.agent_timeout_s)
    spec = leer_especificacion(cuerpo)
    resultado = None
    if spec is not None:
        resultado = ejecutar(
            request.app.state.bd,
            request.app.state.textos,
            spec.componente,
            spec.fenomeno,
            spec.filtros,
            spec.titulo,
        )
    return JSONResponse(
        {
            "respuesta_agente": str(cuerpo.get("respuesta") or ""),
            "especificacion": spec.model_dump() if spec else None,
            "resultado": resultado,
            "traza": leer_traza(cuerpo),
            "citas": leer_citas(cuerpo),
        }
    )


@app.post("/api/interpretar")
async def interpretar(peticion: PeticionLectura, request: Request) -> JSONResponse:
    """Resumen en prosa del tríptico que la vista tiene delante.

    El veredicto de minería no se pide aquí: ya viaja medido en `POST /api/componente`, y
    esta ruta solo añade las palabras. Si falla, la vista pierde el párrafo y nada más.
    """
    triptico = buscar_triptico(peticion.sitio, peticion.encuadre)
    if triptico is None:
        raise HTTPException(status_code=404, detail="no hay ningún tríptico renderizado")
    lectura, cifras = await resumir(request.app.state.cfg, triptico)
    return JSONResponse(
        {
            "lectura": lectura,
            "sitio": triptico["sitio"],
            "veredicto": triptico.get("veredicto"),
            "cifras": cifras,
            "modelo": request.app.state.cfg.llm_modelo,
        }
    )


def _fragmento(bd: BaseDatos, textos: IndiceTextos, chunk_id: int) -> dict[str, Any]:
    filas = bd.consultar(DOCUMENTO_DEL_FRAGMENTO, {"chunk_id": chunk_id})
    if not filas:
        raise HTTPException(status_code=404, detail=f"el fragmento {chunk_id} no existe")
    if not textos.disponible:
        raise HTTPException(
            status_code=503, detail="metadata.jsonl no está disponible en este despliegue"
        )
    doc = filas[0]
    registro = textos.registro(chunk_id) or {}
    return {
        "chunk_id": chunk_id,
        "doc_id": doc["doc_id"],
        "fuente": registro.get("fuente") or "",
        "titulo": doc["titulo"] or doc["doc_id"],
        "organizacion": doc["organizacion"],
        "fenomeno": doc["fenomeno"],
        "fecha": doc["fecha"],
        "texto": str(registro.get("texto", "")),
    }


def _raiz_corpus(cfg: Settings) -> Path | None:
    """Raíz del corpus original, si el despliegue la montó."""
    if str(cfg.corpus_dir) in {"", "."}:
        return None
    raiz = cfg.corpus_dir.resolve()
    return raiz if raiz.is_dir() else None


@app.get("/api/documento/{chunk_id}")
def documento(chunk_id: int, request: Request) -> FileResponse:
    """El archivo del que salió el fragmento: el PDF, el JSON o el CSV de la Etapa 0."""
    cfg: Settings = request.app.state.cfg
    raiz = _raiz_corpus(cfg)
    if raiz is None:
        raise HTTPException(status_code=404, detail="este despliegue no publica el corpus original")
    fragmento = _fragmento(request.app.state.bd, request.app.state.textos, chunk_id)
    relativa = str(fragmento["fuente"]).strip()
    if not relativa:
        raise HTTPException(status_code=404, detail="el fragmento no registra archivo fuente")
    # La ruta viene del corpus, no del navegador, pero se comprueba igual: un `..` en
    # metadata.jsonl no puede acabar sirviendo un archivo de fuera del corpus.
    destino = (raiz / relativa).resolve()
    if not destino.is_relative_to(raiz) or not destino.is_file():
        raise HTTPException(status_code=404, detail=f"no se encuentra el archivo {relativa}")
    return FileResponse(destino, filename=destino.name, content_disposition_type="inline")


@app.get("/api/evidencia")
def evidencia_lote(request: Request, chunk_ids: str = Query(...)) -> dict[str, Any]:
    crudos = [p.strip() for p in chunk_ids.split(",") if p.strip()]
    if not crudos:
        raise HTTPException(status_code=422, detail="chunk_ids no trae ningún identificador")
    if len(crudos) > MAX_LOTE:
        raise HTTPException(status_code=422, detail=f"el lote admite hasta {MAX_LOTE} fragmentos")
    identificadores = []
    for crudo in crudos:
        if not crudo.isdigit():
            raise HTTPException(status_code=422, detail=f"chunk_id inválido: {crudo}")
        identificadores.append(int(crudo))
    bd, textos = request.app.state.bd, request.app.state.textos
    # Un fragmento que falta no puede tumbar el lote entero. El panel pide de golpe las
    # citas de una respuesta, y las citas las numera el agente contra la base vectorial,
    # que no es la misma tubería que la tabla `fragmentos`: basta con que una no exista
    # para que, devolviendo 404, el lector se quedara sin ver ninguna de las demás. Los
    # que falten se nombran en `faltantes` y quien pregunta sabe cuál no se pudo abrir.
    hallados, faltantes = [], []
    for cid in identificadores:
        try:
            hallados.append(_fragmento(bd, textos, cid))
        except HTTPException as fallo:
            if fallo.status_code != 404:
                raise
            faltantes.append(cid)
    if not hallados and faltantes:
        raise HTTPException(status_code=404, detail=f"ningún fragmento existe: {faltantes}")
    return {"fragmentos": hallados, "faltantes": faltantes}


@app.get("/api/evidencia/{chunk_id}")
def evidencia_uno(chunk_id: int, request: Request) -> dict[str, Any]:
    return _fragmento(request.app.state.bd, request.app.state.textos, chunk_id)


@app.get("/geo/{nombre}.geojson")
def geometria(nombre: str) -> FileResponse:
    if nombre not in GEOMETRIAS:
        raise HTTPException(status_code=404, detail=f"geometría desconocida: {nombre}")
    ruta = get_settings().geo_dir / f"{nombre}.geojson"
    if not ruta.is_file():
        raise HTTPException(status_code=404, detail=f"falta el archivo {nombre}.geojson")
    return FileResponse(ruta, media_type="application/geo+json")


_web = get_settings().web_dist
if _web.is_dir():
    app.mount("/", SPA(directory=_web, html=True), name="spa")
else:
    log.warning("no hay SPA compilada en %s: solo se sirve /api", _web)
