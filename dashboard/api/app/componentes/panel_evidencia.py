"""Panel de evidencia: fragmentos originales con doc_id y chunk_id."""

from __future__ import annotations

from pydantic import Field

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from .base import FiltrosBase, Salida, evidencia, normalizar_entidades, resolver_filtros

MAX_FRAGMENTO = 800


def _contraer(texto: str) -> str:
    """«de el» → «del», «a el» → «al».

    El criterio de selección se incrusta en el título y en la nota de método, que son dos
    frases con preposiciones distintas. Sin esto el panel rotulaba «Fragmentos de el
    corpus completo», y el repliegue —que es justo cuando más se lee— era el caso que más
    lo enseñaba.
    """
    return texto.replace("de el ", "del ").replace("a el ", "al ")


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


def _seleccionar(bd: BaseDatos, f: Filtros, params: dict) -> tuple[list, str, str, str | None]:
    """Fragmentos y con qué criterio se eligieron.

    El cuarto elemento es el filtro que hubo que descartar por no encontrar nada. La
    búsqueda mira los nombres de entidad y los títulos de documento, no el texto de los
    fragmentos, así que un tema perfectamente real del corpus —«tala ilegal»— puede no
    casar con ninguno de los dos. Antes eso devolvía un panel sin una sola cita; ahora cae
    al corpus y el tablero avisa de que la búsqueda no se aplicó.
    """
    if f.doc_id:
        filas = bd.consultar(POR_DOC, params)
        if filas:
            return filas, TOTAL_DOC, f"el documento {f.doc_id}", None
        return bd.consultar(DEFECTO, params), TOTAL_DEFECTO, "el corpus completo", "doc_id"
    if f.entidad:
        filas = bd.consultar(POR_ENTIDAD, params)
        if filas:
            return filas, TOTAL_ENTIDAD, f"la entidad «{f.entidad}»", None
        return bd.consultar(DEFECTO, params), TOTAL_DEFECTO, "el corpus completo", "entidad"
    if f.consulta:
        filas = bd.consultar(POR_CONSULTA, params)
        if filas:
            return filas, TOTAL_CONSULTA, f"la búsqueda «{f.consulta}»", None
        filas = bd.consultar(POR_TITULO, params)
        if filas:
            return filas, TOTAL_TITULO, f"la búsqueda «{f.consulta}»", None
        return bd.consultar(DEFECTO, params), TOTAL_DEFECTO, "el corpus completo", "consulta"
    return bd.consultar(DEFECTO, params), TOTAL_DEFECTO, "el corpus completo", None


def calcular(bd: BaseDatos, filtros: dict, textos: IndiceTextos) -> tuple[Salida, Filtros, list]:
    f, ignorados = resolver_filtros(Filtros, filtros)
    f, ignorados = normalizar_entidades(bd, f, ignorados)
    params = f.model_dump()
    filas, total_sql, criterio, descartado = _seleccionar(bd, f, params)
    if descartado is not None:
        ignorados = sorted({*ignorados, descartado})

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
        titulo=_contraer(f"Fragmentos de {criterio}"),
        datos=datos,
        evidencia=lista,
        total_evidencia=total,
        nota_metodo=_contraer(
            f"Fragmentos del corpus asociados a {criterio}, en orden de chunk_id; el texto se "
            "lee de metadata.jsonl, la base vectorial de la Etapa 1, sin modificarlo."
        ),
    )
    return salida, f, ignorados
