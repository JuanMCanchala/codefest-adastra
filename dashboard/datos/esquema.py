"""Esquema SQLite del tablero: DDL, indices y utilidades de escritura."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterable, Sequence

TABLAS: dict[str, str] = {
    "documentos": """
        CREATE TABLE documentos (
            doc_id        TEXT PRIMARY KEY,
            fenomeno      INTEGER NOT NULL,
            organizacion  TEXT,
            formato       TEXT,
            titulo        TEXT,
            fecha         TEXT,
            anio          INTEGER,
            fecha_origen  TEXT,
            idioma        TEXT,
            n_fragmentos  INTEGER NOT NULL
        )""",
    "fragmentos": """
        CREATE TABLE fragmentos (
            chunk_id    INTEGER PRIMARY KEY,
            doc_id      TEXT NOT NULL REFERENCES documentos(doc_id),
            posicion    INTEGER NOT NULL,
            num_tokens  INTEGER
        )""",
    "entidades": """
        CREATE TABLE entidades (
            entidad       TEXT PRIMARY KEY,
            tipo          TEXT,
            n_documentos  INTEGER NOT NULL,
            n_fragmentos  INTEGER NOT NULL
        )""",
    "menciones": """
        CREATE TABLE menciones (
            entidad   TEXT NOT NULL REFERENCES entidades(entidad),
            doc_id    TEXT NOT NULL REFERENCES documentos(doc_id),
            chunk_id  INTEGER NOT NULL REFERENCES fragmentos(chunk_id),
            PRIMARY KEY (entidad, chunk_id)
        ) WITHOUT ROWID""",
    "relaciones": """
        CREATE TABLE relaciones (
            origen    TEXT NOT NULL,
            destino   TEXT NOT NULL,
            relacion  TEXT NOT NULL,
            peso      INTEGER,
            doc_id    TEXT NOT NULL REFERENCES documentos(doc_id),
            chunk_id  INTEGER NOT NULL REFERENCES fragmentos(chunk_id),
            PRIMARY KEY (origen, destino, relacion)
        ) WITHOUT ROWID""",
    "paises": """
        CREATE TABLE paises (
            entidad    TEXT PRIMARY KEY,
            iso3       TEXT NOT NULL,
            nombre_es  TEXT NOT NULL
        )""",
    "menciones_pais": """
        CREATE TABLE menciones_pais (
            iso3      TEXT NOT NULL,
            doc_id    TEXT NOT NULL REFERENCES documentos(doc_id),
            chunk_id  INTEGER NOT NULL REFERENCES fragmentos(chunk_id),
            fenomeno  INTEGER NOT NULL,
            PRIMARY KEY (iso3, chunk_id)
        ) WITHOUT ROWID""",
    "alertas": """
        CREATE TABLE alertas (
            codigo              TEXT NOT NULL,
            doc_id              TEXT NOT NULL REFERENCES documentos(doc_id),
            chunk_id            INTEGER NOT NULL REFERENCES fragmentos(chunk_id),
            tipo                TEXT,
            fecha               TEXT,
            anio                INTEGER,
            departamento        TEXT,
            municipio           TEXT,
            divipola_mpio       TEXT,
            divipola_dpto       TEXT,
            grupos_armados      TEXT,
            economias_ilicitas  TEXT,
            poblaciones         TEXT,
            PRIMARY KEY (codigo, departamento, municipio)
        ) WITHOUT ROWID""",
    "amazonia": """
        CREATE TABLE amazonia (
            clave              TEXT PRIMARY KEY,
            fid                INTEGER,
            pais               TEXT,
            nivel1             TEXT,
            nivel2             TEXT,
            adm1_pcode         TEXT,
            adm2_pcode         TEXT,
            area_km2           REAL,
            poblacion          INTEGER,
            con_presencia      INTEGER,
            sin_informacion    INTEGER,
            total_grupos       INTEGER,
            grupos_detalle     TEXT,
            grupo_emc          INTEGER,
            grupo_embf         INTEGER,
            grupo_eln          INTEGER,
            grupo_cdf_agc      INTEGER,
            grupo_seg_marq     INTEGER,
            grupo_los_lobos    INTEGER,
            grupo_los_choneros INTEGER,
            grupo_cv           INTEGER,
            grupo_pcc          INTEGER,
            grupo_otros        INTEGER,
            divipola_mpio      TEXT,
            divipola_dpto      TEXT,
            doc_id             TEXT NOT NULL REFERENCES documentos(doc_id),
            chunk_id           INTEGER NOT NULL REFERENCES fragmentos(chunk_id)
        )""",
    "sql_documentos": """
        CREATE TABLE sql_documentos (
            id         INTEGER PRIMARY KEY,
            doc_id     TEXT NOT NULL REFERENCES documentos(doc_id),
            fuente     TEXT,
            titulo     TEXT,
            fecha      TEXT,
            anio       INTEGER,
            origen     TEXT,
            paginas    INTEGER,
            n_temas    INTEGER
        )""",
    "sql_entidades": """
        CREATE TABLE sql_entidades (
            entidad_id  INTEGER NOT NULL,
            nombre      TEXT NOT NULL,
            tipo        TEXT,
            doc_id      TEXT NOT NULL REFERENCES documentos(doc_id),
            chunk_id    INTEGER NOT NULL REFERENCES fragmentos(chunk_id),
            menciones   INTEGER,
            PRIMARY KEY (entidad_id, chunk_id)
        ) WITHOUT ROWID""",
    "metadatos": """
        CREATE TABLE metadatos (
            clave  TEXT PRIMARY KEY,
            valor  TEXT
        )""",
}

INDICES: tuple[str, ...] = (
    "CREATE INDEX ix_fragmentos_doc ON fragmentos(doc_id)",
    "CREATE INDEX ix_menciones_doc ON menciones(doc_id)",
    "CREATE INDEX ix_relaciones_doc ON relaciones(doc_id)",
    "CREATE INDEX ix_menciones_pais_doc ON menciones_pais(doc_id)",
    "CREATE INDEX ix_alertas_mpio ON alertas(divipola_mpio)",
    "CREATE INDEX ix_alertas_anio ON alertas(anio)",
    "CREATE INDEX ix_amazonia_mpio ON amazonia(divipola_mpio)",
    "CREATE INDEX ix_documentos_fenomeno ON documentos(fenomeno, anio)",
)


def abrir(ruta) -> sqlite3.Connection:
    """Abre la base y la deja lista para una carga masiva."""
    con = sqlite3.connect(ruta)
    con.execute("PRAGMA journal_mode = OFF")
    con.execute("PRAGMA synchronous = OFF")
    return con


def crear_esquema(con: sqlite3.Connection) -> None:
    """Recrea todas las tablas del tablero (hace el script idempotente)."""
    for nombre in TABLAS:
        con.execute(f"DROP TABLE IF EXISTS {nombre}")
    for ddl in TABLAS.values():
        con.execute(ddl)
    con.commit()


def crear_indices(con: sqlite3.Connection) -> None:
    for ddl in INDICES:
        con.execute(ddl)
    con.commit()


def insertar(
    con: sqlite3.Connection, tabla: str, columnas: Sequence[str], filas: Iterable[Sequence]
) -> int:
    """Inserta filas ignorando duplicados de clave primaria y devuelve el total en la tabla."""
    marcas = ",".join("?" * len(columnas))
    sql = f"INSERT OR IGNORE INTO {tabla} ({','.join(columnas)}) VALUES ({marcas})"  # noqa: S608
    con.executemany(sql, filas)
    con.commit()
    return con.execute(f"SELECT COUNT(*) FROM {tabla}").fetchone()[0]  # noqa: S608


def conteos(con: sqlite3.Connection) -> dict[str, int]:
    return {
        tabla: con.execute(f"SELECT COUNT(*) FROM {tabla}").fetchone()[0]  # noqa: S608
        for tabla in TABLAS
    }
