"""Construye la evidencia de deforestación del Chocó a partir de los datos abiertos del país.

**Por qué el Chocó y no todo el país.** Amazon Mining Watch —la fuente colombiana del agente
satelital— solo cubre la cuenca amazónica, y lo declara. El Chocó queda fuera, y es una de
las dos fronteras de deforestación del país. Este conjunto lo llena con datos oficiales:
`AREAS DEFORESTADAS CHOCO` del portal de Datos Abiertos, 7.937 polígonos fotointerpretados
sobre imagen Sentinel-2 entre 2014 y 2021.

**Qué aporta que las otras fuentes no tienen: la causa.** Cada polígono viene atribuido a
minería, cultivo, incendio, ganadería, frontera agropecuaria u obras civiles. AMW mide
minería y ELDOR mide cobertura, pero ninguno dice *por qué* se perdió el bosque. Aquí sí, y
eso es lo que permite cruzar la pérdida de bosque con las economías ilícitas del corpus.

**Trazabilidad.** Cada cifra se ancla al identificador del conjunto, al recuento de polígonos
que la componen y al periodo. Los municipios llevan su código DIVIPOLA —resuelto contra las
geometrías del propio tablero—, que es lo que permite cruzarlos con las alertas tempranas.

Uso:
    python scripts/deforestacion_choco.py
    python scripts/deforestacion_choco.py --salida dashboard/datos/deforestacion
"""

from __future__ import annotations

import argparse
import collections
import datetime
import json
import logging
import pathlib
import unicodedata
import urllib.parse
import urllib.request

RAIZ = pathlib.Path(__file__).resolve().parents[1]
SALIDA = RAIZ / "dashboard" / "datos" / "deforestacion"
GEOMETRIAS = RAIZ / "dashboard" / "datos" / "geo" / "municipios.geojson"

DATASET = "iczg-dyt3"
PORTAL = "https://www.datos.gov.co/resource"
FICHA = f"https://www.datos.gov.co/d/{DATASET}"
# El portal pagina a 1.000 filas por defecto; el conjunto entero son menos de 8.000.
PAGINA = 5000
DIVIPOLA_CHOCO = "27"

log = logging.getLogger("deforestacion")


def normalizar(texto: str) -> str:
    """Mayúsculas sin tildes ni dobles espacios, que es como casan los dos catálogos."""
    plano = unicodedata.normalize("NFD", (texto or "").upper())
    plano = "".join(c for c in plano if unicodedata.category(c) != "Mn")
    return " ".join(plano.replace("-", " ").split())


def descargar(limite: int = PAGINA) -> list[dict]:
    """Trae el conjunto entero, paginando. Sin clave: es un recurso público."""
    filas: list[dict] = []
    while True:
        consulta = urllib.parse.urlencode({"$limit": limite, "$offset": len(filas)})
        url = f"{PORTAL}/{DATASET}.json?{consulta}"
        log.info("descargando %s (offset %d)", DATASET, len(filas))
        with urllib.request.urlopen(url, timeout=120) as respuesta:
            lote = json.loads(respuesta.read().decode("utf-8"))
        filas.extend(lote)
        if len(lote) < limite:
            return filas


def catalogo_divipola() -> dict[str, tuple[str, str]]:
    """Municipios del Chocó de las geometrías del tablero: nombre normalizado -> (código, nombre)."""
    geo = json.loads(GEOMETRIAS.read_text(encoding="utf-8"))
    return {
        normalizar(p["municipio"]): (p["divipola_mpio"], p["municipio"])
        for f in geo["features"]
        if (p := f["properties"])["divipola_dpto"] == DIVIPOLA_CHOCO
    }


def resolver_municipio(nombre: str, catalogo: dict[str, tuple[str, str]]):
    """Código DIVIPOLA del municipio, o ``None`` si no hay una única coincidencia.

    El conjunto escribe «CARMEN DE ATRATO» donde el DANE pone «EL CARMEN DE ATRATO», así que
    tras fallar la igualdad se admite que el nombre oficial acabe en el del conjunto **con
    frontera de palabra**: solo se le puede haber caído un artículo por delante. Sin esa
    frontera, «CARMEN DE ATRATO» también casaría con «ATRATO», que es otro municipio. Y solo
    vale si el candidato es único: con dos, se prefiere no atribuir a atribuir mal.
    """
    plano = normalizar(nombre)
    if plano in catalogo:
        return catalogo[plano]
    candidatos = [v for k, v in catalogo.items() if k.endswith(f" {plano}")]
    if len(candidatos) == 1:
        log.info("«%s» resuelto como «%s»", nombre, candidatos[0][1])
        return candidatos[0]
    log.warning("municipio sin DIVIPOLA: %s (%d candidatos)", nombre, len(candidatos))
    return None


def _ha(fila: dict) -> float:
    try:
        return float(fila.get("area_ha") or 0.0)
    except (TypeError, ValueError):
        return 0.0


def _causa(fila: dict) -> str:
    """La causa declarada. 219 polígonos la traen vacía y se agrupan aparte, no se inventan."""
    return (fila.get("causa") or "Sin atribuir").strip() or "Sin atribuir"


def agregar(filas: list[dict], catalogo: dict[str, tuple[str, str]]) -> dict:
    """Series por año, por causa y por municipio, más el cruce año × causa."""
    por_anio: dict[str, list[float]] = collections.defaultdict(lambda: [0.0, 0])
    por_causa: dict[str, list[float]] = collections.defaultdict(lambda: [0.0, 0])
    por_anio_causa: dict[tuple[str, str], float] = collections.defaultdict(float)
    municipios: dict[str, dict] = {}
    sin_divipola: set[str] = set()

    for fila in filas:
        ha, causa = _ha(fila), _causa(fila)
        anio = (fila.get("a_o") or "").strip() or "?"

        por_anio[anio][0] += ha
        por_anio[anio][1] += 1
        por_causa[causa][0] += ha
        por_causa[causa][1] += 1
        por_anio_causa[(anio, causa)] += ha

        resuelto = resolver_municipio(fila.get("municipio", ""), catalogo)
        if resuelto is None:
            sin_divipola.add(fila.get("municipio", "?"))
            continue
        divipola, nombre = resuelto
        registro = municipios.setdefault(
            divipola,
            {
                "divipola": divipola,
                "nombre": nombre.title(),
                "departamento": "Chocó",
                "ha": 0.0,
                "poligonos": 0,
                "por_causa": collections.defaultdict(float),
                # Desglose año × causa del municipio. Sin esto, filtrar por años recortaría
                # la serie pero no las barras, y el total dejaría de cuadrar con el dibujo.
                "detalle": collections.defaultdict(lambda: [0.0, 0]),
            },
        )
        registro["ha"] += ha
        registro["poligonos"] += 1
        registro["por_causa"][causa] += ha
        celda = registro["detalle"][(anio, causa)]
        celda[0] += ha
        celda[1] += 1

    for registro in municipios.values():
        registro["ha"] = round(registro["ha"], 2)
        registro["por_causa"] = {
            c: round(v, 2)
            for c, v in sorted(registro["por_causa"].items(), key=lambda x: -x[1])
        }
        registro["detalle"] = [
            {"anio": a, "causa": c, "ha": round(v[0], 2), "poligonos": int(v[1])}
            for (a, c), v in sorted(registro["detalle"].items())
        ]

    if sin_divipola:
        log.warning("sin DIVIPOLA: %s", ", ".join(sorted(sin_divipola)))

    return {
        "serie": [
            {"anio": a, "ha": round(v[0], 2), "poligonos": int(v[1])}
            for a, v in sorted(por_anio.items())
        ],
        "causas": [
            {"causa": c, "ha": round(v[0], 2), "poligonos": int(v[1])}
            for c, v in sorted(por_causa.items(), key=lambda x: -x[1][0])
        ],
        "serie_por_causa": [
            {"anio": a, "causa": c, "ha": round(v, 2)}
            for (a, c), v in sorted(por_anio_causa.items())
        ],
        "municipios": sorted(municipios.values(), key=lambda m: -m["ha"]),
        "municipios_sin_divipola": sorted(sin_divipola),
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--salida", type=pathlib.Path, default=SALIDA)
    args = p.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    filas = descargar()
    log.info("%d polígonos descargados", len(filas))
    agregados = agregar(filas, catalogo_divipola())

    total_ha = round(sum(c["ha"] for c in agregados["causas"]), 2)
    anios = [s["anio"] for s in agregados["serie"] if s["anio"] != "?"]
    datos = {
        "procedencia": {
            "fuente": "AREAS DEFORESTADAS CHOCO — Datos Abiertos Colombia",
            "dataset": DATASET,
            "ficha": FICHA,
            "api": f"{PORTAL}/{DATASET}.json",
            "metodo": "fotointerpretación de polígonos sobre imagen Sentinel-2 (10 m/px)",
            "periodo": f"{min(anios)}-{max(anios)}" if anios else "?",
            "poligonos": len(filas),
            "descargado": datetime.datetime.now(tz=datetime.UTC).date().isoformat(),
            "cobertura": (
                "departamento del Chocó. Complementa a Amazon Mining Watch, que solo "
                "cubre la cuenca amazónica y deja el Pacífico fuera."
            ),
        },
        "total_ha": total_ha,
        **agregados,
    }

    args.salida.mkdir(parents=True, exist_ok=True)
    destino = args.salida / "choco.json"
    destino.write_text(
        json.dumps(datos, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    log.info(
        "escrito %s — %s ha, %d municipios, %d causas",
        destino,
        total_ha,
        len(agregados["municipios"]),
        len(agregados["causas"]),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
