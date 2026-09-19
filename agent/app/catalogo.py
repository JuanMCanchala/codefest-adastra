"""Catálogo cerrado de componentes visuales (Reto 2, §3.3 y Anexo B).

El agente de visualización solo puede elegir uno de estos componentes y rellenar sus
filtros; los valores los calcula el backend del tablero a partir del corpus, con
trazabilidad a ``doc_id`` y ``chunk_id``. Nunca se muestran puntajes inventados (B.2.5).
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator

# Descripción y filtros admitidos, idénticos al contrato de dashboard/API.md: el agente
# debe usar exactamente estos nombres de filtro para que el tablero los aplique.
CATALOGO: dict[str, str] = {
    "composicion_corpus": (
        "Composición del corpus (comparación/composición). "
        "Filtros: dimension=organizacion|formato|idioma."
    ),
    "linea_tiempo": (
        "Evolución de documentos por año y reaparición de una entidad (tendencia). "
        "Filtros: entidad, desde, hasta (años)."
    ),
    "matriz_calor": (
        "Cruce de dos categóricas, p. ej. entidad × organización o país × fenómeno. "
        "Filtros: filas=entidad|pais, columnas=organizacion|fenomeno|documento, "
        "tipo_entidad, top."
    ),
    "red_entidades": (
        "Red de entidades relacionadas (relación). "
        "Filtros: entidad (centro), tipo_entidad, top, min_peso."
    ),
    "mapa_colombia": (
        "Mapa de Colombia con alertas tempranas por territorio (espacial). "
        "Filtros: nivel=departamento|municipio, economia, tipo_alerta, desde, hasta."
    ),
    "mapa_mundo": "Mapa mundial de menciones de países (espacial). Filtros: top.",
    "cuadrante_priorizacion": (
        "Intensidad (conteo total) frente a tendencia (cambio del conteo) para priorizar. "
        "Filtros: sujeto=departamento|entidad, anio_corte."
    ),
    "panel_evidencia": (
        "Fragmentos originales que sustentan un hallazgo. "
        "Filtros: entidad | doc_id | consulta, limite."
    ),
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
