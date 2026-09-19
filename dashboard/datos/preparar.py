"""Genera dashboard.db: capa de datos del tablero del Reto 2, trazable a doc_id y chunk_id.

Uso: python dashboard/datos/preparar.py [--opciones]
Todas las variables provienen de conteos y agregaciones del corpus real; no se estiman datos.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

AQUI = Path(__file__).resolve().parent
if str(AQUI) not in sys.path:
    sys.path.insert(0, str(AQUI))

import corpus as mod_corpus  # noqa: E402
import esquema  # noqa: E402
import geo  # noqa: E402
import grafo as mod_grafo  # noqa: E402
import sql_adl  # noqa: E402
import territorio  # noqa: E402

ANDES = Path("C:/Programacion/ANDES")
METADATA = ANDES / "entrega/base_vectorial/encoder_bge-m3/metadata.jsonl"
GRAFO = ANDES / "entrega/base_vectorial/grafo/grafo.graphml"
FECHA_MAXIMA = "2026-09-18"


def argumentos(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--metadata", type=Path, default=METADATA)
    p.add_argument("--grafo", type=Path, default=GRAFO)
    p.add_argument("--docs", type=Path, default=ANDES / "data/processed/docs.jsonl")
    p.add_argument("--corpus", type=Path, default=ANDES / "data/adl/corpus")
    p.add_argument("--inventario", type=Path, default=ANDES / "data/adl/Indice_Datos_Codefest.xlsx")
    p.add_argument("--sql-adl", type=Path, default=ANDES / "data/space_corpus.db")
    p.add_argument("--salida", type=Path, default=AQUI / "dashboard.db")
    p.add_argument("--geo", type=Path, default=AQUI / "geo")
    p.add_argument("--cache", type=Path, default=AQUI / ".cache")
    return p.parse_args(argv)


def docs_con_texto(ruta_docs: Path) -> set[str]:
    """doc_id cuyos textos hay que retener para anclar alertas, CSV y base SQL a un chunk."""
    necesarios = set(sql_adl.DOC_POR_ID.values())
    with ruta_docs.open(encoding="utf-8") as fh:
        for linea in fh:
            if not linea.strip():
                continue
            reg = json.loads(linea)
            fuente = reg["fuente"]
            if "/alertas/" in fuente or fuente.endswith("AMAZONUW_amazonunderworld-data.csv"):
                necesarios.add(reg["doc_id"])
    return necesarios


def _filas_paises(grafo: mod_grafo.Grafo, indice: dict) -> tuple[list[tuple], dict[str, str], int]:
    filas, por_entidad, sin_iso3 = [], {}, 0
    for entidad, tipo in grafo.tipos.items():
        if tipo != "pais":
            continue
        encontrado = geo.resolver_pais(indice, entidad)
        if encontrado is None:
            sin_iso3 += 1
            continue
        iso3, nombre_es = encontrado
        filas.append((entidad, iso3, nombre_es))
        por_entidad[entidad] = iso3
    return filas, por_entidad, sin_iso3


def _filas_menciones_pais(menciones, por_entidad: dict[str, str], documentos: dict) -> list[tuple]:
    filas = []
    for entidad, doc_id, chunk_id in menciones:
        iso3 = por_entidad.get(entidad)
        if iso3 is None:
            continue
        doc = documentos.get(doc_id)
        if doc is None:
            continue
        filas.append((iso3, doc_id, chunk_id, doc["fenomeno"]))
    return filas


def _sin_fecha(documentos: dict) -> tuple[int, int]:
    sin_fecha = sum(1 for d in documentos.values() if not d["fecha"])
    sin_anio = sum(1 for d in documentos.values() if not d["anio"])
    return sin_fecha, sin_anio


def construir(args: argparse.Namespace) -> dict[str, int]:
    indice_paises, bytes_paises = geo.preparar_paises(args.cache, args.geo)
    municipios, bytes_mpio, bytes_dpto = geo.preparar_colombia(args.cache, args.geo)
    por_par, unicos = geo.indice_municipios(municipios)

    datos = mod_corpus.cargar_corpus(
        args.metadata, args.docs, args.corpus, args.inventario, docs_con_texto(args.docs)
    )
    grafo = mod_grafo.leer_grafo(args.grafo)
    menciones = mod_grafo.menciones(grafo, datos.doc_por_chunk)

    con = esquema.abrir(args.salida)
    esquema.crear_esquema(con)

    esquema.insertar(
        con,
        "documentos",
        (
            "doc_id",
            "fenomeno",
            "organizacion",
            "formato",
            "titulo",
            "fecha",
            "anio",
            "fecha_origen",
            "idioma",
            "n_fragmentos",
        ),
        mod_corpus.filas_documentos(datos),
    )
    esquema.insertar(con, "fragmentos", ("chunk_id", "doc_id", "posicion", "num_tokens"), datos.fragmentos)
    esquema.insertar(
        con,
        "entidades",
        ("entidad", "tipo", "n_documentos", "n_fragmentos"),
        mod_grafo.filas_entidades(grafo, menciones),
    )
    esquema.insertar(con, "menciones", ("entidad", "doc_id", "chunk_id"), sorted(menciones))
    esquema.insertar(
        con,
        "relaciones",
        ("origen", "destino", "relacion", "peso", "doc_id", "chunk_id"),
        mod_grafo.filas_relaciones(grafo, datos.doc_por_chunk),
    )

    filas_paises, por_entidad, sin_iso3 = _filas_paises(grafo, indice_paises)
    esquema.insertar(con, "paises", ("entidad", "iso3", "nombre_es"), filas_paises)
    esquema.insertar(
        con,
        "menciones_pais",
        ("iso3", "doc_id", "chunk_id", "fenomeno"),
        _filas_menciones_pais(menciones, por_entidad, datos.documentos),
    )

    alertas, alertas_sin_divipola = territorio.filas_alertas(
        args.corpus / "F3_Dinamicas_Territoriales/Alertas_Tempranas/alertas", datos, por_par, unicos
    )
    esquema.insertar(con, "alertas", territorio.COLUMNAS_ALERTAS, alertas)

    amazonia, amz_sin_chunk, amz_sin_divipola = territorio.filas_amazonia(
        args.corpus / "F3_Dinamicas_Territoriales/Amazon_Underworld/AMAZONUW_amazonunderworld-data.csv",
        datos,
        municipios,
    )
    esquema.insertar(con, "amazonia", territorio.COLUMNAS_AMAZONIA, amazonia)

    sql_docs, sql_ents, sql_sin_chunk = sql_adl.filas_sql(args.sql_adl, datos)
    esquema.insertar(con, "sql_documentos", sql_adl.COLUMNAS_DOCUMENTOS, sql_docs)
    esquema.insertar(con, "sql_entidades", sql_adl.COLUMNAS_ENTIDADES, sql_ents)

    esquema.crear_indices(con)

    sin_fecha, sin_anio = _sin_fecha(datos.documentos)
    metadatos = {
        "generado_en": datetime.now(UTC).isoformat(timespec="seconds"),
        "fecha_maxima_admitida": FECHA_MAXIMA,
        "fuente_metadata": str(args.metadata),
        "fuente_grafo": str(args.grafo),
        "fuente_docs": str(args.docs),
        "fuente_sql_adl": str(args.sql_adl),
        "docs_sin_fecha": str(sin_fecha),
        "docs_sin_anio": str(sin_anio),
        "docs_total": str(len(datos.documentos)),
        "pct_docs_sin_fecha": f"{100 * sin_fecha / max(len(datos.documentos), 1):.1f}",
        "alertas_filas_sin_divipola": str(alertas_sin_divipola),
        "amazonia_filas_sin_chunk_exacto": str(amz_sin_chunk),
        "amazonia_filas_co_sin_divipola": str(amz_sin_divipola),
        "paises_grafo_sin_iso3": str(sin_iso3),
        "sql_entidades_sin_chunk_exacto": str(sql_sin_chunk),
        "geo_paises_bytes": str(bytes_paises),
        "geo_municipios_bytes": str(bytes_mpio),
        "geo_departamentos_bytes": str(bytes_dpto),
    }
    esquema.insertar(con, "metadatos", ("clave", "valor"), sorted(metadatos.items()))

    con.execute("VACUUM")
    totales = esquema.conteos(con)
    con.close()
    return totales


def main(argv: list[str] | None = None) -> int:
    args = argumentos(argv)
    for ruta in (args.metadata, args.grafo, args.docs, args.corpus, args.sql_adl):
        if not ruta.exists():
            print(f"ERROR: no existe la fuente {ruta}", file=sys.stderr)
            return 2
    args.salida.parent.mkdir(parents=True, exist_ok=True)
    totales = construir(args)
    print("Tabla                filas")
    for tabla, n in totales.items():
        print(f"{tabla:<20} {n:>9,}")
    tamano = args.salida.stat().st_size
    print(f"\n{args.salida.name}: {tamano / 1e6:.1f} MB")
    for nombre in ("paises.geojson", "municipios.geojson", "departamentos.geojson"):
        ruta = args.geo / nombre
        if ruta.exists():
            print(f"geo/{nombre}: {ruta.stat().st_size / 1e6:.2f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
