"""Construye la evidencia colombiana de minería ilegal a partir de Amazon Mining Watch.

Amazon Mining Watch (`earthrise-media/mining-detector`, licencia MIT) detecta minería
aurífera artesanal con un ensamble de redes convolucionales sobre parches de Sentinel-2.
A diferencia de ELDOR —que se entrenó con ortomosaicos de dron a 5 cm/px y no tolera la
resolución de la imagen satelital disponible en Colombia— este modelo está hecho para los
10 m/px de Sentinel-2, que sí hay para todo el país.

Aquí no se corre el modelo: se leen sus **detecciones publicadas** y se reorganizan en la
forma que consume el agente. Dos productos del repositorio de origen:

1. `mined_areas_by_jurisdiction.csv`: área minada acumulada por jurisdicción y periodo.
   De aquí salen la serie nacional de Colombia, los departamentos, los resguardos
   indígenas y las áreas protegidas.
2. El GeoJSON de polígonos disueltos de la cuenca amazónica. Se cruza el centroide de
   cada polígono contra los municipios colombianos para atribuirle un código DIVIPOLA,
   que es lo que permite unir esta evidencia con las alertas del corpus.

Uso:
    pip install -r scripts/requirements-amw.txt
    python scripts/amw_colombia.py
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import math
import pathlib
import sys
import urllib.request

RAIZ = pathlib.Path(__file__).resolve().parents[1]
SALIDA = RAIZ / "agent" / "datos" / "amw"
MUNICIPIOS = RAIZ / "dashboard" / "datos" / "geo" / "municipios.geojson"

# Commit fijo: el repositorio se actualiza con frecuencia (la reconstrucción de agosto de
# 2026 cambió modelos y datos), así que las cifras publicadas aquí deben apuntar a una
# revisión concreta y no a `main`.
COMMIT = "eb89719a4eb5566f1c7f7d5e57bf8380edc675e6"
BASE = f"https://raw.githubusercontent.com/earthrise-media/mining-detector/{COMMIT}"
CSV_JURISDICCIONES = "data/public/mined_areas_by_jurisdiction.csv"
GEOJSON_POLIGONOS = (
    "data/outputs/48px_v3.7a-i_ensemble/"
    "amazon_basin_48px_v3.7-ensemble_0.50_2023-01-01_2023-12-31-dissolved-0.6.geojson"
)

MODELO = "48px_v3.7a-i_ensemble (ensamble de CNN sobre parches de Sentinel-2)"
LICENCIA = "MIT"

log = logging.getLogger("amw")


def descargar(ruta_rel: str, destino: pathlib.Path) -> pathlib.Path:
    if destino.exists():
        log.info("%s ya estaba descargado", destino.name)
        return destino
    destino.parent.mkdir(parents=True, exist_ok=True)
    url = f"{BASE}/{ruta_rel}"
    # `urlopen` acepta file:// y esquemas propios. La URL se arma con constantes de este
    # módulo, pero se comprueba igual para que no haya forma de leer disco por aquí.
    if not url.startswith("https://raw.githubusercontent.com/"):
        raise ValueError(f"origen no permitido: {url}")
    log.info("descargando %s", url)
    with urllib.request.urlopen(url, timeout=300) as r, destino.open("wb") as fh:  # nosec B310
        fh.write(r.read())
    return destino


def periodo(admin_year: str) -> dict[str, object]:
    """`AAAATT` -> año y trimestre. `TT = 00` significa el año completo."""
    anio, tt = int(admin_year[:4]), int(admin_year[4:])
    return {
        "anio": anio,
        "trimestre": tt or None,
        "etiqueta": f"{anio}" if not tt else f"{anio}T{tt}",
    }


def series_por_tipo(filas: list[dict], tipo: str) -> dict[str, list[dict]]:
    """Agrupa las filas de un tipo de jurisdicción por nombre, ordenadas en el tiempo."""
    salida: dict[str, list[dict]] = {}
    for f in sorted(filas, key=lambda x: x["admin_year"]):
        if f["type"] != tipo:
            continue
        registro = periodo(f["admin_year"]) | {
            "nuevo_ha": round(float(f["intersected_area_ha"]), 2),
            "acumulado_ha": round(float(f["intersected_area_ha_cumulative"]), 2),
        }
        if f["status"]:
            registro["estado_juridico"] = f["status"]
        salida.setdefault(f["name"], []).append(registro)
    return salida


def hectareas(poligono) -> float:
    """Área en hectáreas con una proyección equirectangular local.

    Basta para un polígono de pocas hectáreas cerca del ecuador; no sustituye una
    reproyección a un CRS de área igual.
    """
    from shapely.ops import transform

    lat = poligono.centroid.y
    m_lon = 111_320 * math.cos(math.radians(lat))
    return (
        transform(lambda x, y, z=None: (x * m_lon, y * 110_540), poligono).area / 10_000
    )


def atribuir_municipios(
    ruta_geojson: pathlib.Path,
) -> tuple[list[dict], dict[str, int]]:
    """Asigna cada polígono de minería al municipio colombiano que contiene su centroide."""
    from shapely.geometry import shape
    from shapely.strtree import STRtree

    poligonos = json.loads(ruta_geojson.read_text(encoding="utf-8"))["features"]
    municipios = json.loads(MUNICIPIOS.read_text(encoding="utf-8"))["features"]
    formas = [shape(m["geometry"]) for m in municipios]
    props = [m["properties"] for m in municipios]
    arbol = STRtree(formas)

    acumulado: dict[str, dict] = {}
    nulos = fuera = 0
    for rasgo in poligonos:
        if not rasgo.get("geometry"):
            nulos += 1
            continue
        p = shape(rasgo["geometry"])
        centro = p.centroid
        for i in arbol.query(centro):
            if not formas[i].contains(centro):
                continue
            pr = props[i]
            reg = acumulado.setdefault(
                pr["divipola_mpio"],
                {
                    "divipola_mpio": pr["divipola_mpio"],
                    "municipio": pr["municipio"].title(),
                    "departamento": pr["departamento"].title(),
                    "area_ha": 0.0,
                    "poligonos": 0,
                },
            )
            reg["area_ha"] += hectareas(p)
            reg["poligonos"] += 1
            break
        else:
            fuera += 1

    for reg in acumulado.values():
        reg["area_ha"] = round(reg["area_ha"], 2)
    filas = sorted(acumulado.values(), key=lambda r: -r["area_ha"])
    return filas, {
        "poligonos_totales": len(poligonos),
        "geometrias_nulas": nulos,
        "fuera_de_colombia": fuera,
        "en_colombia": sum(r["poligonos"] for r in filas),
    }


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--cache", type=pathlib.Path, default=RAIZ / ".cache" / "amw")
    args = p.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

    ruta_csv = descargar(
        CSV_JURISDICCIONES, args.cache / "mined_areas_by_jurisdiction.csv"
    )
    ruta_geo = descargar(GEOJSON_POLIGONOS, args.cache / "poligonos_amazonia.geojson")

    with ruta_csv.open(encoding="utf-8", newline="") as fh:
        filas = [f for f in csv.DictReader(fh) if f["country_code"] == "CO"]
    if not filas:
        raise SystemExit("el CSV no trae filas de Colombia; ¿cambió el formato?")
    log.info("%d filas de Colombia en el CSV", len(filas))

    municipios, conteos = atribuir_municipios(ruta_geo)
    log.info("%d municipios colombianos con detecciones (%s)", len(municipios), conteos)

    nacional = series_por_tipo(filas, "national_admin").get("Colombia", [])
    registro = {
        "procedencia": {
            "fuente": "Amazon Mining Watch — earthrise-media/mining-detector",
            "url": "https://github.com/earthrise-media/mining-detector",
            "commit": COMMIT,
            "modelo": MODELO,
            "licencia": LICENCIA,
            "fecha_publicacion": filas[0]["date_published"],
            "sensor": "Sentinel-2 (10 m/px)",
            "cobertura": "cuenca amazónica; no incluye el Bajo Cauca antioqueño",
            "archivos": [CSV_JURISDICCIONES, GEOJSON_POLIGONOS],
        },
        "nacional": nacional,
        "departamentos": series_por_tipo(filas, "subnational_admin"),
        "resguardos_indigenas": series_por_tipo(filas, "indigenous_territories"),
        "areas_protegidas": series_por_tipo(filas, "protected_areas"),
        "municipios": municipios,
        "conteos_poligonos": conteos,
    }

    SALIDA.mkdir(parents=True, exist_ok=True)
    destino = SALIDA / "colombia.json"
    destino.write_text(
        json.dumps(registro, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    log.info("escrito %s", destino)
    if nacional:
        log.info(
            "Colombia: %s ha acumuladas a %s",
            nacional[-1]["acumulado_ha"],
            nacional[-1]["etiqueta"],
        )


if __name__ == "__main__":
    sys.exit(main())
