"""Contrato de datos del endpoint del agente (especificación Etapa 2, §2.4).

La respuesta tiene tres bloques: ``respuesta`` (texto para el chat), ``evaluacion``
(insumo de las métricas de calidad) y ``metadata`` (insumo de las métricas de
eficiencia). Los nombres de campo son los de la especificación y no deben cambiar.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator

MAX_PREGUNTA_CHARS = 4000


class ChatRequest(BaseModel):
    """Pregunta ya normalizada (el endpoint acepta texto plano o JSON, ver ``main``)."""

    pregunta: str = Field(min_length=1, max_length=MAX_PREGUNTA_CHARS)
    # El frontend propio pide los extras (citas enriquecidas, visualización); la
    # evaluación automática no los pide y recibe exactamente el contrato de §2.4.
    incluir_extras: bool = False
    # Identificador de conversación, opcional. Solo lo manda el frontend propio: sin él
    # el sistema es sin estado, que es como lo evalúa ADL (el contrato de §2.4 no tiene
    # este campo). Ver app/memoria.py.
    sesion: str | None = Field(default=None, max_length=128)
    # Lo manda el tablero del Reto 2, donde una respuesta sin gráfico no sirve de nada:
    # el experto escribe su pregunta contra un tablero, no contra un chat. Sin esto el
    # enrutador mandaba «¿dónde se concentran las alertas?» a la ruta de corpus —es una
    # pregunta legítima del corpus— y el tablero se quedaba con el texto y sin vista.
    exigir_visualizacion: bool = False

    @field_validator("pregunta")
    @classmethod
    def _no_vacia(cls, valor: str) -> str:
        limpio = valor.strip()
        if not limpio:
            raise ValueError("la pregunta no puede estar vacía")
        return limpio


class ToolCall(BaseModel):
    name: str
    input_parameters: dict[str, Any]
    output: str


class Evaluacion(BaseModel):
    input: str
    actual_output: str
    retrieval_context: list[str] = Field(default_factory=list)
    tools_called: list[ToolCall] = Field(default_factory=list)


class Tokens(BaseModel):
    input: int = 0
    output: int = 0
    total: int = 0


class TokensAgente(BaseModel):
    agente: str
    modelo: str
    input: int
    output: int
    total: int


class Metadata(BaseModel):
    num_interacciones: int
    agentes_invocados: list[str]
    tokens: Tokens
    tokens_por_agente: list[TokensAgente]
    latencia_ms: int
    estado: str


class ChatResponse(BaseModel):
    respuesta: str
    evaluacion: Evaluacion
    metadata: Metadata
    # Extensión propia para el frontend (citas y visualización). No la consume la
    # evaluación automática; se omite del JSON cuando está vacía.
    extras: dict[str, Any] | None = None
