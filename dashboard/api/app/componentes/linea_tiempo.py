"""Línea de tiempo: documentos por año y reapariciones de entidades.

Solo entran documentos con año conocido (53,7 % del corpus no lo tiene, ver
``datos/README.md``); ``cobertura`` declara cuántos documentos quedaron fuera.
"""

from __future__ import annotations

from pydantic import Field

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from .base import FiltrosBase, Salida, evidencia, normalizar_entidades, resolver_filtros

SERIES = """
SELECT d.fenomeno AS fenomeno, d.anio AS anio, COUNT(*) AS documentos
  FROM documentos d
 WHERE d.anio IS NOT NULL AND d.anio BETWEEN :desde AND :hasta
   AND (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
 GROUP BY fenomeno, anio
 ORDER BY anio, fenomeno
"""

REFS_SERIES = """
WITH base AS (
  SELECT d.fenomeno AS fenomeno, d.anio AS anio, f.doc_id AS doc_id, f.chunk_id AS chunk_id,
         ROW_NUMBER() OVER (PARTITION BY d.fenomeno, d.anio ORDER BY f.chunk_id) AS rn
    FROM documentos d
    JOIN fragmentos f ON f.doc_id = d.doc_id AND f.posicion = 0
   WHERE d.anio IS NOT NULL AND d.anio BETWEEN :desde AND :hasta
     AND (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
)
SELECT fenomeno, anio, doc_id, chunk_id FROM base WHERE rn <= 20
"""

REAPARICIONES = """
WITH ventana AS (
  SELECT m.entidad AS entidad, d.anio AS anio, m.doc_id AS doc_id, m.chunk_id AS chunk_id
    FROM menciones m
    JOIN documentos d ON d.doc_id = m.doc_id
   WHERE d.anio IS NOT NULL AND d.anio BETWEEN :desde AND :hasta
     AND (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
     AND (:entidad IS NULL OR m.entidad = :entidad)
), elegidas AS (
  SELECT entidad FROM ventana
   GROUP BY entidad HAVING COUNT(DISTINCT anio) > 1
   ORDER BY COUNT(*) DESC, entidad LIMIT :top
), minimos AS (
  SELECT entidad, anio, MIN(chunk_id) AS chunk_id
    FROM ventana WHERE entidad IN (SELECT entidad FROM elegidas)
   GROUP BY entidad, anio
)
SELECT m.entidad AS entidad, m.anio AS anio, f.doc_id AS doc_id, m.chunk_id AS chunk_id
  FROM minimos m JOIN fragmentos f ON f.chunk_id = m.chunk_id
 ORDER BY m.entidad, m.anio
"""

COBERTURA = """
SELECT COUNT(*) AS total, SUM(CASE WHEN d.anio IS NULL THEN 1 ELSE 0 END) AS sin_anio
  FROM documentos d WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
"""


class Filtros(FiltrosBase):
    fenomeno: int | None = Field(default=None, ge=1, le=3)
    entidad: str | None = None
    desde: int = Field(default=1990, ge=1900, le=2026)
    hasta: int = Field(default=2026, ge=1900, le=2026)
    top: int = Field(default=12, ge=1, le=30)


def calcular(bd: BaseDatos, filtros: dict, _textos: IndiceTextos) -> tuple[Salida, Filtros, list]:
    f, ignorados = resolver_filtros(Filtros, filtros)
    if f.desde > f.hasta:
        f = f.model_copy(update={"desde": f.hasta, "hasta": f.desde})
    f = normalizar_entidades(bd, f)
    params = f.model_dump()

    series = [dict(fila) for fila in bd.consultar(SERIES, params)]
    reapariciones = [dict(fila) for fila in bd.consultar(REAPARICIONES, params)]

    pares = [(fila["doc_id"], fila["chunk_id"]) for fila in bd.consultar(REFS_SERIES, params)]
    pares += [(r["doc_id"], r["chunk_id"]) for r in reapariciones]
    lista, total = evidencia(pares)

    cobertura = bd.consultar(COBERTURA, {"fenomeno": f.fenomeno})[0]
    datos = {
        "series": series,
        "reapariciones": reapariciones,
        "cobertura": {
            "documentos": cobertura["total"],
            "sin_anio": cobertura["sin_anio"] or 0,
        },
    }
    salida = Salida(
        titulo=f"Documentos por año ({f.desde}–{f.hasta})",
        datos=datos,
        evidencia=lista,
        total_evidencia=total,
        nota_metodo=(
            "Número de documentos con año conocido por fenómeno y año; las reapariciones son "
            "las entidades mencionadas en más de un año dentro del rango, con el primer "
            "fragmento de cada año."
        ),
    )
    return salida, f, ignorados
