"""Catálogo cerrado de componentes visuales (Reto 2, §3.3 y Anexo B).

El agente de visualización solo puede elegir uno de estos componentes y rellenar sus
filtros; los valores los calcula el backend del tablero a partir del corpus, con
trazabilidad a ``doc_id`` y ``chunk_id``. Nunca se muestran puntajes inventados (B.2.5).
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator

CATALOGO: dict[str, str] = {
    "composicion_corpus": "Barras apiladas: documentos por fenómeno, fuente, formato o idioma.",
    "linea_tiempo": "Evolución de documentos o menciones por periodo; marca reapariciones.",
    "matriz_calor": "Cruce de dos categóricas (entidad × documento, país × fenómeno).",
    "red_entidades": "Grafo de entidades (formal o co-ocurrencia) con vecinos expandibles.",
    "mapa_colombia": "Coropleta por departamento o municipio (alertas tempranas, economías).",
    "mapa_mundo": "Menciones de países por fenómeno sobre un mapa mundial.",
    "cuadrante_priorizacion": "Intensidad (conteo) frente a tendencia (variación del conteo).",
    "panel_evidencia": "Fragmentos originales con doc_id y chunk_id que sustentan un hallazgo.",
}


class SpecVisualizacion(BaseModel):
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


def describir_catalogo() -> str:
    return "\n".join(f"- {k}: {v}" for k, v in CATALOGO.items())
