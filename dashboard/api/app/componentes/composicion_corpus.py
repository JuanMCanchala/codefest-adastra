"""Composición del corpus: documentos y fragmentos por fenómeno y dimensión."""

from __future__ import annotations

from typing import Literal

from pydantic import Field

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from .base import FiltrosBase, Salida, evidencia, refs, resolver_filtros

CONTEOS = """
SELECT d.fenomeno AS fenomeno,
       COALESCE(CASE :dimension WHEN 'organizacion' THEN d.organizacion
                                WHEN 'formato' THEN d.formato
                                ELSE d.idioma END, 'sin dato') AS categoria,
       COUNT(*) AS documentos, SUM(d.n_fragmentos) AS fragmentos
  FROM documentos d
 WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
 GROUP BY fenomeno, categoria
 ORDER BY documentos DESC, categoria
"""

REFS = """
WITH base AS (
  SELECT d.fenomeno AS fenomeno,
         COALESCE(CASE :dimension WHEN 'organizacion' THEN d.organizacion
                                  WHEN 'formato' THEN d.formato
                                  ELSE d.idioma END, 'sin dato') AS categoria,
         f.doc_id AS doc_id, f.chunk_id AS chunk_id
    FROM documentos d
    JOIN fragmentos f ON f.doc_id = d.doc_id AND f.posicion = 0
   WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
), numeradas AS (
  SELECT fenomeno, categoria, doc_id, chunk_id,
         ROW_NUMBER() OVER (PARTITION BY fenomeno, categoria ORDER BY chunk_id) AS rn
    FROM base
)
SELECT fenomeno, categoria, doc_id, chunk_id FROM numeradas WHERE rn <= 20
"""

TOTAL = """
SELECT COUNT(*) FROM documentos d
  JOIN fragmentos f ON f.doc_id = d.doc_id AND f.posicion = 0
 WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
"""


class Filtros(FiltrosBase):
    dimension: Literal["organizacion", "formato", "idioma"] = "organizacion"
    fenomeno: int | None = Field(default=None, ge=1, le=3)


def calcular(bd: BaseDatos, filtros: dict, _textos: IndiceTextos) -> tuple[Salida, Filtros, list]:
    f, ignorados = resolver_filtros(Filtros, filtros)
    params = f.model_dump()
    por_grupo: dict[tuple[int, str], list[tuple[str, int]]] = {}
    for fila in bd.consultar(REFS, params):
        clave = (fila["fenomeno"], fila["categoria"])
        por_grupo.setdefault(clave, []).append((fila["doc_id"], fila["chunk_id"]))

    datos = []
    pares: list[tuple[str, int]] = []
    for fila in bd.consultar(CONTEOS, params):
        propias = por_grupo.get((fila["fenomeno"], fila["categoria"]), [])
        pares.extend(propias)
        datos.append(
            {
                "fenomeno": fila["fenomeno"],
                "categoria": fila["categoria"],
                "documentos": fila["documentos"],
                "fragmentos": fila["fragmentos"] or 0,
                "refs": refs(propias),
            }
        )
    total = int(bd.valor(TOTAL, params) or 0)
    lista, total_evidencia = evidencia(pares, total)
    salida = Salida(
        titulo=f"Documentos por fenómeno y {f.dimension}",
        datos=datos,
        evidencia=lista,
        total_evidencia=total_evidencia,
        nota_metodo=(
            f"Número de documentos y suma de sus fragmentos por fenómeno y {f.dimension}, "
            "contados sobre la tabla documentos; la evidencia apunta al primer fragmento "
            "de cada documento contado."
        ),
    )
    return salida, f, ignorados
