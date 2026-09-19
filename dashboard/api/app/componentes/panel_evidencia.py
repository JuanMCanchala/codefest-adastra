"""Panel de evidencia: fragmentos originales con doc_id y chunk_id."""

from __future__ import annotations

from pydantic import Field

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from .base import FiltrosBase, Salida, evidencia, normalizar_entidades, resolver_filtros

MAX_FRAGMENTO = 800

POR_DOC = """
SELECT f.doc_id AS doc_id, f.chunk_id AS chunk_id, d.titulo AS titulo,
       d.organizacion AS organizacion
  FROM fragmentos f JOIN documentos d ON d.doc_id = f.doc_id
 WHERE f.doc_id = :doc_id AND (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
 ORDER BY f.posicion LIMIT :limite
"""
TOTAL_DOC = """
SELECT COUNT(*) FROM fragmentos f JOIN documentos d ON d.doc_id = f.doc_id
 WHERE f.doc_id = :doc_id AND (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
"""

POR_ENTIDAD = """
SELECT m.doc_id AS doc_id, m.chunk_id AS chunk_id, d.titulo AS titulo,
       d.organizacion AS organizacion
  FROM menciones m JOIN documentos d ON d.doc_id = m.doc_id
 WHERE m.entidad = :entidad AND (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
 ORDER BY m.chunk_id LIMIT :limite
"""
TOTAL_ENTIDAD = """
SELECT COUNT(*) FROM menciones m JOIN documentos d ON d.doc_id = m.doc_id
 WHERE m.entidad = :entidad AND (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
"""

POR_CONSULTA = """
SELECT m.doc_id AS doc_id, m.chunk_id AS chunk_id, d.titulo AS titulo,
       d.organizacion AS organizacion
  FROM menciones m JOIN documentos d ON d.doc_id = m.doc_id
 WHERE m.entidad IN (SELECT entidad FROM entidades
                      WHERE entidad LIKE '%' || :consulta || '%'
                      ORDER BY n_fragmentos DESC LIMIT 5)
   AND (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
 ORDER BY m.chunk_id LIMIT :limite
"""
TOTAL_CONSULTA = """
SELECT COUNT(*) FROM menciones m JOIN documentos d ON d.doc_id = m.doc_id
 WHERE m.entidad IN (SELECT entidad FROM entidades
                      WHERE entidad LIKE '%' || :consulta || '%'
                      ORDER BY n_fragmentos DESC LIMIT 5)
   AND (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
"""

POR_TITULO = """
SELECT f.doc_id AS doc_id, f.chunk_id AS chunk_id, d.titulo AS titulo,
       d.organizacion AS organizacion
  FROM documentos d JOIN fragmentos f ON f.doc_id = d.doc_id AND f.posicion = 0
 WHERE (d.titulo LIKE '%' || :consulta || '%' OR d.organizacion LIKE '%' || :consulta || '%'
        OR d.doc_id LIKE '%' || :consulta || '%')
   AND (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
 ORDER BY f.chunk_id LIMIT :limite
"""
TOTAL_TITULO = """
SELECT COUNT(*) FROM documentos d JOIN fragmentos f ON f.doc_id = d.doc_id AND f.posicion = 0
 WHERE (d.titulo LIKE '%' || :consulta || '%' OR d.organizacion LIKE '%' || :consulta || '%'
        OR d.doc_id LIKE '%' || :consulta || '%')
   AND (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
"""

DEFECTO = """
SELECT f.doc_id AS doc_id, f.chunk_id AS chunk_id, d.titulo AS titulo,
       d.organizacion AS organizacion
  FROM documentos d JOIN fragmentos f ON f.doc_id = d.doc_id AND f.posicion = 0
 WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
 ORDER BY d.n_fragmentos DESC, f.chunk_id LIMIT :limite
"""
TOTAL_DEFECTO = """
SELECT COUNT(*) FROM documentos d JOIN fragmentos f ON f.doc_id = d.doc_id AND f.posicion = 0
 WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
"""


class Filtros(FiltrosBase):
    entidad: str | None = None
    doc_id: str | None = None
    consulta: str | None = None
    fenomeno: int | None = Field(default=None, ge=1, le=3)
    limite: int = Field(default=10, ge=1, le=20)


def _seleccionar(bd: BaseDatos, f: Filtros, params: dict) -> tuple[list, str, str]:
    if f.doc_id:
        return bd.consultar(POR_DOC, params), TOTAL_DOC, f"documento {f.doc_id}"
    if f.entidad:
        return bd.consultar(POR_ENTIDAD, params), TOTAL_ENTIDAD, f"la entidad «{f.entidad}»"
    if f.consulta:
        filas = bd.consultar(POR_CONSULTA, params)
        if filas:
            return filas, TOTAL_CONSULTA, f"la búsqueda «{f.consulta}»"
        return bd.consultar(POR_TITULO, params), TOTAL_TITULO, f"la búsqueda «{f.consulta}»"
    return bd.consultar(DEFECTO, params), TOTAL_DEFECTO, "el corpus completo"


def calcular(bd: BaseDatos, filtros: dict, textos: IndiceTextos) -> tuple[Salida, Filtros, list]:
    f, ignorados = resolver_filtros(Filtros, filtros)
    f = normalizar_entidades(bd, f)
    params = f.model_dump()
    filas, total_sql, criterio = _seleccionar(bd, f, params)

    hay_texto = textos.disponible
    datos = []
    for fila in filas:
        registro = textos.registro(fila["chunk_id"]) if hay_texto else None
        datos.append(
            {
                "doc_id": fila["doc_id"],
                "chunk_id": fila["chunk_id"],
                "titulo": fila["titulo"] or fila["doc_id"],
                "fuente": (registro or {}).get("fuente") or fila["organizacion"] or "",
                "fragmento": str((registro or {}).get("texto", ""))[:MAX_FRAGMENTO],
            }
        )
    lista, total = evidencia(
        ((d["doc_id"], d["chunk_id"]) for d in datos), int(bd.valor(total_sql, params) or 0)
    )
    salida = Salida(
        titulo=f"Fragmentos de {criterio}",
        datos=datos,
        evidencia=lista,
        total_evidencia=total,
        nota_metodo=(
            f"Fragmentos del corpus asociados a {criterio}, en orden de chunk_id; el texto se "
            "lee de metadata.jsonl, la base vectorial de la Etapa 1, sin modificarlo."
        ),
    )
    return salida, f, ignorados
