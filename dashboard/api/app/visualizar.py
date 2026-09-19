"""Puente con el agente del Reto 1: instrucción en lenguaje natural → especificación."""

from __future__ import annotations

from typing import Any

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field, ValidationError, field_validator

from .componentes import CATALOGO


class Instruccion(BaseModel):
    instruccion: str = Field(min_length=1, max_length=2000)


class Especificacion(BaseModel):
    componente: str
    fenomeno: int | None = Field(default=None, ge=1, le=3)
    filtros: dict[str, Any] = Field(default_factory=dict)
    titulo: str = Field(default="", max_length=120)
    justificacion: str = Field(default="", max_length=300)

    @field_validator("componente")
    @classmethod
    def _en_catalogo(cls, valor: str) -> str:
        if valor not in CATALOGO:
            raise ValueError(f"componente fuera del catálogo: {valor}")
        return valor


async def preguntar_al_agente(url: str, instruccion: str, timeout_s: float) -> dict[str, Any]:
    destino = url.rstrip("/") + "/chat"
    try:
        async with httpx.AsyncClient(timeout=timeout_s) as cliente:
            respuesta = await cliente.post(
                destino, json={"pregunta": instruccion, "incluir_extras": True}
            )
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=504, detail=f"el agente no respondió en {timeout_s:.0f} s"
        ) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"no se pudo contactar al agente en {destino}"
        ) from exc
    if respuesta.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"el agente respondió {respuesta.status_code} en {destino}",
        )
    try:
        cuerpo = respuesta.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="el agente no devolvió JSON") from exc
    if not isinstance(cuerpo, dict):
        raise HTTPException(status_code=502, detail="el agente no devolvió un objeto JSON")
    return cuerpo


def leer_especificacion(cuerpo: dict[str, Any]) -> Especificacion | None:
    extras = cuerpo.get("extras") or {}
    cruda = extras.get("visualizacion") if isinstance(extras, dict) else None
    if not isinstance(cruda, dict):
        return None
    try:
        return Especificacion(**cruda)
    except ValidationError:
        return None


def leer_citas(cuerpo: dict[str, Any]) -> list[dict[str, Any]]:
    extras = cuerpo.get("extras") or {}
    citas = extras.get("citas") if isinstance(extras, dict) else None
    if not isinstance(citas, list):
        return []
    return [
        {"n": c.get("n"), "doc_id": c.get("doc_id"), "chunk_id": c.get("chunk_id")}
        for c in citas
        if isinstance(c, dict)
    ]


def leer_traza(cuerpo: dict[str, Any]) -> dict[str, Any]:
    metadata = cuerpo.get("metadata") or {}
    if not isinstance(metadata, dict):
        return {"agentes_invocados": [], "tokens": {}, "latencia_ms": 0}
    return {
        "agentes_invocados": metadata.get("agentes_invocados") or [],
        "tokens": metadata.get("tokens") or {},
        "latencia_ms": metadata.get("latencia_ms") or 0,
    }
