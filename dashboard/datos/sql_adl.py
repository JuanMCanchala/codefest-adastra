"""Mapeo de la base SQL de ADL (space_corpus.db, solo F2) a doc_id y chunk_id."""

from __future__ import annotations

import sqlite3
from pathlib import Path

from geo import normalizar

# Emparejamiento uno a uno documentado en docs/investigacion/00_sintesis/base_sql_adl.md
DOC_POR_ID = {
    1: "F2-CSIS-115",
    2: "F2-CSIS-116",
    3: "F2-CSIS-117",
    4: "F2-CSIS-118",
    5: "F2-CSIS-119",
    6: "F2-CSIS-120",
    7: "F2-CSIS-121",
    8: "F2-CSIS-122",
    9: "F2-CSIS-123",
    10: "F2-CSIS-124",
    11: "F2-UNOOSA-019",
    12: "F2-UNOOSA-023",
    13: "F2-UNOOSA-024",
    14: "F2-UNOOSA-027",
    15: "F2-ESA-011",
    16: "F2-ESA-014",
    17: "F2-ESA-027",
    18: "F2-ESA-039",
    19: "F2-ESA-040",
}

COLUMNAS_DOCUMENTOS = (
    "id",
    "doc_id",
    "fuente",
    "titulo",
    "fecha",
    "anio",
    "origen",
    "paginas",
    "n_temas",
)
COLUMNAS_ENTIDADES = ("entidad_id", "nombre", "tipo", "doc_id", "chunk_id", "menciones")


def _fecha(valor) -> tuple[str | None, int | None]:
    if isinstance(valor, str) and len(valor) >= 10 and valor[4] == "-":
        return valor[:10], int(valor[:4])
    return None, None


def filas_sql(ruta: Path, corpus) -> tuple[list[tuple], list[tuple], int]:
    """Devuelve (sql_documentos, sql_entidades, entidades sin chunk emparejado)."""
    con = sqlite3.connect(f"file:{ruta}?mode=ro", uri=True)
    try:
        temas = dict(con.execute("SELECT document_id, COUNT(*) FROM document_topic GROUP BY document_id"))
        docs = []
        for fila in con.execute("SELECT id, source, title, published_at, origin, page_count FROM document"):
            doc_id = DOC_POR_ID.get(fila[0])
            if doc_id is None or doc_id not in corpus.documentos:
                continue
            fecha, anio = _fecha(fila[3])
            docs.append(
                (fila[0], doc_id, fila[1], fila[2], fecha, anio, fila[4], fila[5], temas.get(fila[0], 0))
            )
        entidades = []
        sin_chunk = 0
        consulta = (
            "SELECT de.document_id, e.id, e.name, e.type, de.mention_count "
            "FROM document_entity de JOIN entity e ON e.id = de.entity_id"
        )
        for doc_sql, ent_id, nombre, tipo, menciones in con.execute(consulta):
            doc_id = DOC_POR_ID.get(doc_sql)
            if doc_id is None or doc_id not in corpus.documentos:
                continue
            chunk_id = _chunk_con_entidad(corpus, doc_id, nombre)
            if chunk_id is None:
                sin_chunk += 1
                chunk_id = corpus.primer_chunk.get(doc_id)
            if chunk_id is None:
                continue
            entidades.append((ent_id, nombre, tipo, doc_id, chunk_id, menciones))
        return docs, entidades, sin_chunk
    finally:
        con.close()


def _chunk_con_entidad(corpus, doc_id: str, nombre: str) -> int | None:
    clave = normalizar(nombre)
    if not clave:
        return None
    for chunk_id, texto in corpus.textos.get(doc_id, []):
        if clave in normalizar(texto):
            return chunk_id
    return None
