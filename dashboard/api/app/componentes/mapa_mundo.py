"""Mapa mundial: menciones de países por fenómeno."""

from __future__ import annotations

from pydantic import Field

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from .base import FiltrosBase, Salida, evidencia, refs, resolver_filtros

MENCIONES = """
WITH nombres AS (SELECT iso3, MIN(nombre_es) AS nombre FROM paises GROUP BY iso3),
base AS (
  SELECT mp.iso3 AS iso3, mp.doc_id AS doc_id, mp.chunk_id AS chunk_id
    FROM menciones_pais mp
   WHERE (:fenomeno IS NULL OR mp.fenomeno = :fenomeno)
), agregado AS (
  SELECT iso3, COUNT(*) AS menciones, COUNT(DISTINCT doc_id) AS documentos
    FROM base GROUP BY iso3 ORDER BY menciones DESC, iso3 LIMIT :top
), numeradas AS (
  SELECT b.iso3 AS iso3, b.doc_id AS doc_id, b.chunk_id AS chunk_id,
         ROW_NUMBER() OVER (PARTITION BY b.iso3 ORDER BY b.chunk_id) AS rn
    FROM base b JOIN agregado a ON a.iso3 = b.iso3
)
SELECT a.iso3 AS iso3, COALESCE(n.nombre, a.iso3) AS nombre, a.menciones AS menciones,
       a.documentos AS documentos, x.doc_id AS doc_id, x.chunk_id AS chunk_id
  FROM agregado a
  LEFT JOIN nombres n ON n.iso3 = a.iso3
  LEFT JOIN numeradas x ON x.iso3 = a.iso3 AND x.rn <= 20
 ORDER BY a.menciones DESC, a.iso3
"""

TOTAL = """
SELECT COUNT(*) FROM menciones_pais mp WHERE (:fenomeno IS NULL OR mp.fenomeno = :fenomeno)
"""


class Filtros(FiltrosBase):
    fenomeno: int | None = Field(default=None, ge=1, le=3)
    top: int = Field(default=40, ge=1, le=200)


def calcular(bd: BaseDatos, filtros: dict, _textos: IndiceTextos) -> tuple[Salida, Filtros, list]:
    f, ignorados = resolver_filtros(Filtros, filtros)
    params = f.model_dump()

    paises: dict[str, dict] = {}
    for fila in bd.consultar(MENCIONES, params):
        pais = paises.get(fila["iso3"])
        if pais is None:
            pais = {
                "iso3": fila["iso3"],
                "nombre": fila["nombre"],
                "menciones": fila["menciones"],
                "documentos": fila["documentos"],
                "_pares": [],
            }
            paises[fila["iso3"]] = pais
        if fila["chunk_id"] is not None:
            pais["_pares"].append((fila["doc_id"], fila["chunk_id"]))

    datos = []
    pares: list[tuple[str, int]] = []
    for pais in paises.values():
        pares.extend(pais["_pares"])
        datos.append(
            {
                "iso3": pais["iso3"],
                "nombre": pais["nombre"],
                "menciones": pais["menciones"],
                "documentos": pais["documentos"],
                "refs": refs(pais["_pares"]),
            }
        )
    lista, total = evidencia(pares, int(bd.valor(TOTAL, params) or 0))
    salida = Salida(
        titulo="Menciones de países en el corpus",
        datos=datos,
        evidencia=lista,
        total_evidencia=total,
        nota_metodo=(
            "Número de fragmentos que mencionan cada país (entidades de tipo país "
            "normalizadas a ISO3) y número de documentos distintos en que aparecen."
        ),
    )
    return salida, f, ignorados
