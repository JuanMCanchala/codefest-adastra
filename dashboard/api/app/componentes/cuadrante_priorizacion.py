"""Cuadrante de priorización: intensidad (conteo) frente a tendencia (variación del conteo)."""

from __future__ import annotations

from typing import Literal

from pydantic import Field

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from .base import FiltrosBase, Salida, evidencia, refs, resolver_filtros

_DEPARTAMENTO = """
  SELECT a.departamento AS item, a.anio AS anio, a.doc_id AS doc_id, a.chunk_id AS chunk_id
    FROM alertas a JOIN documentos d ON d.doc_id = a.doc_id
   WHERE a.departamento IS NOT NULL AND (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
"""
_ENTIDAD = """
  SELECT m.entidad AS item, d.anio AS anio, m.doc_id AS doc_id, m.chunk_id AS chunk_id
    FROM menciones m JOIN documentos d ON d.doc_id = m.doc_id
   WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
"""

_AGREGADO = """
), agregado AS (
  SELECT item, COUNT(*) AS intensidad,
         SUM(CASE WHEN anio >= :anio_corte THEN 1 ELSE 0 END)
         - SUM(CASE WHEN anio IS NOT NULL AND anio < :anio_corte THEN 1 ELSE 0 END) AS tendencia
    FROM base GROUP BY item ORDER BY intensidad DESC, item LIMIT :top
), numeradas AS (
  SELECT b.item AS item, b.doc_id AS doc_id, b.chunk_id AS chunk_id,
         ROW_NUMBER() OVER (PARTITION BY b.item ORDER BY b.chunk_id) AS rn
    FROM base b JOIN agregado a ON a.item = b.item
)
SELECT a.item AS item, a.intensidad AS intensidad, a.tendencia AS tendencia,
       x.doc_id AS doc_id, x.chunk_id AS chunk_id
  FROM agregado a LEFT JOIN numeradas x ON x.item = a.item AND x.rn <= 20
 ORDER BY a.intensidad DESC, a.item
"""

CONSULTAS = {
    "departamento": "WITH base AS (" + _DEPARTAMENTO + _AGREGADO,
    "entidad": "WITH base AS (" + _ENTIDAD + _AGREGADO,
}
TOTALES = {
    "departamento": """
        SELECT COUNT(*) FROM alertas a JOIN documentos d ON d.doc_id = a.doc_id
         WHERE a.departamento IS NOT NULL AND (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
    """,
    "entidad": """
        SELECT COUNT(*) FROM menciones m JOIN documentos d ON d.doc_id = m.doc_id
         WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
    """,
}
UNIDAD = {
    "departamento": "alertas tempranas",
    "entidad": "fragmentos que mencionan la entidad",
}


class Filtros(FiltrosBase):
    sujeto: Literal["departamento", "entidad"] = "departamento"
    fenomeno: int | None = Field(default=None, ge=1, le=3)
    anio_corte: int = Field(default=2022, ge=1900, le=2026)
    top: int = Field(default=25, ge=1, le=60)


def calcular(bd: BaseDatos, filtros: dict, _textos: IndiceTextos) -> tuple[Salida, Filtros, list]:
    f, ignorados = resolver_filtros(Filtros, filtros)
    params = f.model_dump()

    items: dict[str, dict] = {}
    for fila in bd.consultar(CONSULTAS[f.sujeto], params):
        item = items.get(fila["item"])
        if item is None:
            item = {
                "item": fila["item"],
                "intensidad": fila["intensidad"],
                "tendencia": fila["tendencia"],
                "_pares": [],
            }
            items[fila["item"]] = item
        if fila["chunk_id"] is not None:
            item["_pares"].append((fila["doc_id"], fila["chunk_id"]))

    datos = []
    pares: list[tuple[str, int]] = []
    for item in items.values():
        pares.extend(item["_pares"])
        datos.append(
            {
                "item": item["item"],
                "intensidad": item["intensidad"],
                "tendencia": item["tendencia"],
                "refs": refs(item["_pares"]),
            }
        )
    lista, total = evidencia(pares, int(bd.valor(TOTALES[f.sujeto], params) or 0))
    salida = Salida(
        titulo=f"Intensidad y tendencia por {f.sujeto} (corte {f.anio_corte})",
        datos=datos,
        evidencia=lista,
        total_evidencia=total,
        nota_metodo=(
            f"Intensidad: número de {UNIDAD[f.sujeto]} por {f.sujeto}. Tendencia: ese mismo "
            f"conteo desde {f.anio_corte} menos el conteo anterior a {f.anio_corte} "
            "(las filas sin año no entran en la tendencia). Sin ponderaciones ni puntajes."
        ),
    )
    return salida, f, ignorados
