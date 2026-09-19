"""Pruebas de integridad y trazabilidad de dashboard.db."""

from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

import pytest

DATOS = Path(__file__).resolve().parents[1]
if str(DATOS) not in sys.path:
    sys.path.insert(0, str(DATOS))

BASE = DATOS / "dashboard.db"
FECHA_MAXIMA = "2026-09-18"
TABLAS_TRAZABLES = ("menciones", "relaciones", "alertas", "menciones_pais", "amazonia", "sql_entidades")


@pytest.fixture(scope="module")
def con() -> sqlite3.Connection:
    if not BASE.exists():
        pytest.skip("falta dashboard.db: ejecute python dashboard/datos/preparar.py")
    conexion = sqlite3.connect(f"file:{BASE}?mode=ro", uri=True)
    yield conexion
    conexion.close()


def _uno(con: sqlite3.Connection, sql: str) -> int:
    return con.execute(sql).fetchone()[0]


def test_tablas_pobladas(con):
    for tabla in ("documentos", "fragmentos", "entidades", *TABLAS_TRAZABLES, "paises", "sql_documentos"):
        assert _uno(con, f"SELECT COUNT(*) FROM {tabla}") > 0, tabla


@pytest.mark.parametrize("tabla", TABLAS_TRAZABLES)
def test_chunk_id_existe_en_fragmentos(con, tabla):
    huerfanos = _uno(
        con,
        f"SELECT COUNT(*) FROM {tabla} t LEFT JOIN fragmentos f USING (chunk_id) WHERE f.chunk_id IS NULL",
    )
    assert huerfanos == 0


@pytest.mark.parametrize("tabla", TABLAS_TRAZABLES)
def test_doc_id_existe_en_documentos(con, tabla):
    huerfanos = _uno(
        con,
        f"SELECT COUNT(*) FROM {tabla} t LEFT JOIN documentos d USING (doc_id) WHERE d.doc_id IS NULL",
    )
    assert huerfanos == 0


@pytest.mark.parametrize("tabla", TABLAS_TRAZABLES)
def test_doc_id_coincide_con_el_del_fragmento(con, tabla):
    inconsistentes = _uno(
        con,
        f"SELECT COUNT(*) FROM {tabla} t JOIN fragmentos f USING (chunk_id) WHERE f.doc_id <> t.doc_id",
    )
    assert inconsistentes == 0


def test_fragmentos_pertenecen_a_documentos(con):
    assert (
        _uno(
            con,
            "SELECT COUNT(*) FROM fragmentos f LEFT JOIN documentos d USING (doc_id) WHERE d.doc_id IS NULL",
        )
        == 0
    )


def test_sin_fechas_futuras(con):
    assert _uno(con, f"SELECT COUNT(*) FROM documentos WHERE fecha > '{FECHA_MAXIMA}'") == 0
    assert _uno(con, f"SELECT COUNT(*) FROM alertas WHERE fecha > '{FECHA_MAXIMA}'") == 0
    assert _uno(con, f"SELECT COUNT(*) FROM sql_documentos WHERE fecha > '{FECHA_MAXIMA}'") == 0
    assert _uno(con, f"SELECT COUNT(*) FROM documentos WHERE anio > {FECHA_MAXIMA[:4]}") == 0


def test_alertas_con_divipola_valido_en_su_mayoria(con):
    total = _uno(con, "SELECT COUNT(*) FROM alertas")
    con_codigo = _uno(con, "SELECT COUNT(*) FROM alertas WHERE divipola_mpio IS NOT NULL")
    assert con_codigo / total >= 0.9
    largos = _uno(
        con,
        "SELECT COUNT(*) FROM alertas WHERE divipola_mpio IS NOT NULL AND LENGTH(divipola_mpio) <> 5",
    )
    assert largos == 0


def test_divipola_de_alertas_existe_en_geojson_de_municipios():
    import json

    ruta = DATOS / "geo" / "municipios.geojson"
    if not ruta.exists():
        pytest.skip("falta geo/municipios.geojson")
    with ruta.open(encoding="utf-8") as fh:
        codigos = {r["properties"]["divipola_mpio"] for r in json.load(fh)["features"]}
    con = sqlite3.connect(f"file:{BASE}?mode=ro", uri=True)
    consulta = "SELECT DISTINCT divipola_mpio FROM alertas WHERE divipola_mpio IS NOT NULL"
    try:
        usados = {fila[0] for fila in con.execute(consulta)}
    finally:
        con.close()
    assert usados <= codigos


def test_entidades_y_menciones_consistentes(con):
    assert (
        _uno(
            con,
            "SELECT COUNT(*) FROM menciones m LEFT JOIN entidades e USING (entidad) WHERE e.entidad IS NULL",
        )
        == 0
    )
    assert _uno(con, "SELECT COUNT(*) FROM entidades WHERE n_fragmentos <= 0") == 0


def test_paises_normalizados(con):
    assert _uno(con, "SELECT COUNT(*) FROM paises WHERE LENGTH(iso3) <> 3") == 0
    assert (
        _uno(
            con, "SELECT COUNT(*) FROM menciones_pais mp LEFT JOIN paises p USING (iso3) WHERE p.iso3 IS NULL"
        )
        == 0
    )


def test_tamano_de_la_base_bajo_control():
    if not BASE.exists():
        pytest.skip("falta dashboard.db")
    assert BASE.stat().st_size < 60 * 1024 * 1024
