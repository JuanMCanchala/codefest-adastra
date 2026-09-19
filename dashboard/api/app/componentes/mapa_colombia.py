"""Coropleta de Colombia: alertas tempranas de la Defensoría por departamento o municipio."""

from __future__ import annotations

from typing import Literal

from pydantic import Field

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from .base import FiltrosBase, Salida, evidencia, refs, resolver_filtros

ALERTAS = """
WITH base AS (
  SELECT CASE :nivel WHEN 'municipio' THEN a.divipola_mpio ELSE a.divipola_dpto END AS divipola,
         CASE :nivel WHEN 'municipio' THEN a.municipio ELSE a.departamento END AS nombre,
         a.departamento AS departamento, a.doc_id AS doc_id, a.chunk_id AS chunk_id
    FROM alertas a
   WHERE CASE :nivel WHEN 'municipio' THEN a.divipola_mpio ELSE a.divipola_dpto END IS NOT NULL
     AND (:economia IS NULL OR a.economias_ilicitas LIKE '%' || :economia || '%')
     AND (:tipo_alerta IS NULL OR a.tipo = :tipo_alerta)
     AND (a.anio IS NULL OR a.anio BETWEEN :desde AND :hasta)
), numeradas AS (
  SELECT divipola, nombre, departamento, doc_id, chunk_id,
         ROW_NUMBER() OVER (PARTITION BY divipola ORDER BY chunk_id) AS rn,
         COUNT(*) OVER (PARTITION BY divipola) AS alertas
    FROM base
)
SELECT divipola, nombre, departamento, alertas, doc_id, chunk_id
  FROM numeradas WHERE rn <= 20 ORDER BY alertas DESC, nombre
"""

TOTAL = """
SELECT COUNT(*) FROM alertas a
 WHERE CASE :nivel WHEN 'municipio' THEN a.divipola_mpio ELSE a.divipola_dpto END IS NOT NULL
   AND (:economia IS NULL OR a.economias_ilicitas LIKE '%' || :economia || '%')
   AND (:tipo_alerta IS NULL OR a.tipo = :tipo_alerta)
   AND (a.anio IS NULL OR a.anio BETWEEN :desde AND :hasta)
"""


class Filtros(FiltrosBase):
    nivel: Literal["departamento", "municipio"] = "departamento"
    economia: str | None = None
    tipo_alerta: str | None = None
    desde: int = Field(default=2017, ge=1900, le=2026)
    hasta: int = Field(default=2026, ge=1900, le=2026)


def calcular(bd: BaseDatos, filtros: dict, _textos: IndiceTextos) -> tuple[Salida, Filtros, list]:
    f, ignorados = resolver_filtros(Filtros, filtros)
    if f.desde > f.hasta:
        f = f.model_copy(update={"desde": f.hasta, "hasta": f.desde})
    params = f.model_dump()

    unidades: dict[str, dict] = {}
    pares: list[tuple[str, int]] = []
    for fila in bd.consultar(ALERTAS, params):
        unidad = unidades.get(fila["divipola"])
        if unidad is None:
            unidad = {
                "divipola": fila["divipola"],
                "nombre": fila["nombre"],
                "departamento": fila["departamento"],
                "alertas": fila["alertas"],
                "_pares": [],
            }
            unidades[fila["divipola"]] = unidad
        unidad["_pares"].append((fila["doc_id"], fila["chunk_id"]))

    datos = []
    for unidad in unidades.values():
        pares.extend(unidad["_pares"])
        datos.append(
            {
                "divipola": unidad["divipola"],
                "nombre": unidad["nombre"],
                "departamento": unidad["departamento"],
                "alertas": unidad["alertas"],
                "refs": refs(unidad["_pares"]),
            }
        )
    lista, total = evidencia(pares, int(bd.valor(TOTAL, params) or 0))
    detalle = f" con mención de «{f.economia}»" if f.economia else ""
    salida = Salida(
        titulo=f"Alertas tempranas por {f.nivel}{detalle}",
        datos=datos,
        evidencia=lista,
        total_evidencia=total,
        nota_metodo=(
            f"Número de alertas tempranas (una fila por alerta y municipio alcanzado) "
            f"agregadas por {f.nivel} entre {f.desde} y {f.hasta}"
            f"{detalle}; conteo directo de la tabla alertas."
        ),
    )
    return salida, f, ignorados
