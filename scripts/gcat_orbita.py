"""Población de objetos en órbita, ensayos antisatélite y satélites de inspección (F2).

**Qué hueco llena.** F2 (seguridad del entorno espacial) es el único de los tres fenómenos
sin componente propio en el tablero: solo reutiliza los genéricos (mapa mundial, línea de
tiempo, red de entidades). El corpus habla de ensayos ASAT y del síndrome de Kessler (SWF,
CSIS), pero ningún componente cuenta objetos en órbita con datos duros externos.

**Fuente.** GCAT — General Catalog of Artificial Space Objects (Jonathan C. McDowell),
https://planet4589.org/space/gcat. Licencia CC BY 4.0. El TSV entero (~19 MB, 69.999
objetos) no se versiona: solo el agregado que produce este script.

**Qué agrega.**
- ``serie``: objetos catalogados por año de lanzamiento × tipo (P carga útil, R etapa,
  C componente, D desecho) × país, limitado a los ~12 países con más objetos + OTROS.
- ``en_orbita_por_regimen``: objetos con estado ``O`` (en órbita hoy) por régimen orbital
  (LEO, LLEO, MEO, GEO, HEO, GTO...) × tipo.
- ``asat``: desechos de ensayo antisatélite (tipo ``D`` con origen ``W``) agrupados por el
  satélite destruido (campo ``Parent``). GCAT distingue 26 padres, pero 5 llevan el sufijo
  ``*`` con el que marca una identificación incierta (conteos de 1 a 5 objetos cada uno,
  10 en total); se descartan y quedan **21 ensayos** con padre cierto.
- ``colombia``: los tres objetos con ``State = CO`` (Libertad-1, FACSAT, FACSAT-2).
- ``inspectores``: lista **curada** de satélites de inspección y proximidad (RPO) —
  Luch/Olymp-K, GSSAP, TJS-3, Kosmos-2542/2543/2576/2588 — con su referencia pública y sus
  hijos catalogados (fragmentos, proyectiles). Se declara curada: la inclusión es una
  decisión del equipo con fuente, no un dato de GCAT.
- ``procedencia``: fuente, URL, licencia, cita, fecha de actualización del TSV (línea
  ``# Updated``), fecha de descarga y filas leídas.

Uso:
    python scripts/gcat_orbita.py
    python scripts/gcat_orbita.py --salida dashboard/datos/orbita
"""

from __future__ import annotations

import argparse
import collections
import csv
import datetime
import json
import logging
import pathlib
import re
import urllib.request

RAIZ = pathlib.Path(__file__).resolve().parents[1]
SALIDA = RAIZ / "dashboard" / "datos" / "orbita"

FUENTE = "https://planet4589.org/space/gcat/tsv/cat/satcat.tsv"
LICENCIA = "CC BY 4.0"
CITA = "McDowell, J. C., General Catalog of Artificial Space Objects, https://planet4589.org/space/gcat"

COLUMNAS = [
    "JCAT",
    "Satcat",
    "Launch_Tag",
    "Piece",
    "Type",
    "Name",
    "PLName",
    "LDate",
    "Parent",
    "SDate",
    "Primary",
    "DDate",
    "Status",
    "Dest",
    "Owner",
    "State",
    "Manufacturer",
    "Bus",
    "Motor",
    "Mass",
    "MassFlag",
    "DryMass",
    "DryFlag",
    "TotMass",
    "TotFlag",
    "Length",
    "LFlag",
    "Diameter",
    "DFlag",
    "Span",
    "SpanFlag",
    "Shape",
    "ODate",
    "Perigee",
    "PF",
    "Apogee",
    "AF",
    "Inc",
    "IF",
    "OpOrbit",
    "OQUAL",
    "AltNames",
]

# Cuántos países se nombran en `serie`; el resto se agrupa en OTROS para que el JSON no
# crezca con 106 países, la mayoría con un puñado de objetos.
TOP_PAISES = 12

# Satélites de inspección y proximidad (RPO): lista curada del equipo, no un dato de GCAT.
# `alias_corpus` son los nombres tal como los normalizó el grafo de la Etapa 1 (minúsculas);
# se resuelven contra `entidades` en tiempo de consulta, igual que en la vista `asat`.
INSPECTORES = [
    {
        "jcat": "S40258",
        "alias_corpus": ["luch", "olymp-k"],
        "referencia": "https://www.rand.org/pubs/commentary/2026/03/how-russia-is-intercepting-communications-from-european.html",
    },
    {
        "jcat": "S55841",
        "alias_corpus": ["luch (olymp) 2", "olymp-k"],
        "referencia": "https://sattrackcam.blogspot.com/2025/03/the-russian-eavesdropping-satellite.html",
    },
    {
        "jcat": "S40099",
        "alias_corpus": ["gssap", "gssap satellites"],
        "referencia": "https://space.skyrocket.de/doc_sdat/gssap-1.htm",
    },
    {
        "jcat": "S40100",
        "alias_corpus": ["gssap", "gssap satellites"],
        "referencia": "https://space.skyrocket.de/doc_sdat/gssap-1.htm",
    },
    {
        "jcat": "S41744",
        "alias_corpus": ["gssap", "gssap satellites"],
        "referencia": "https://space.skyrocket.de/doc_sdat/gssap-3.htm",
    },
    {
        "jcat": "S41745",
        "alias_corpus": ["gssap", "gssap satellites"],
        "referencia": "https://space.skyrocket.de/doc_sdat/gssap-3.htm",
    },
    {
        "jcat": "S43917",
        "alias_corpus": ["tjs-3", "tjs-3 akm"],
        "referencia": "https://space.skyrocket.de/doc_sdat/tjs-3.htm",
    },
    {
        "jcat": "S44797",
        "alias_corpus": ["cosmos 2542"],
        "referencia": "https://space.skyrocket.de/doc_sdat/kosmos-2542.htm",
    },
    {
        "jcat": "S44835",
        "alias_corpus": ["cosmos 2543"],
        "referencia": "https://space.skyrocket.de/doc_sdat/kosmos-2543.htm",
    },
    {
        "jcat": "S59773",
        "alias_corpus": ["cosmos 2576"],
        "referencia": "https://space.skyrocket.de/doc_sdat/kosmos-2576.htm",
    },
    {
        "jcat": "S64095",
        "alias_corpus": ["cosmos 2588"],
        "referencia": "https://space.skyrocket.de/doc_sdat/kosmos-2588.htm",
    },
]

log = logging.getLogger("gcat_orbita")


def descargar() -> list[str]:
    """Trae el TSV entero en memoria. Sin clave: es un recurso público."""
    if not FUENTE.startswith("https://planet4589.org/"):
        raise ValueError(f"origen no permitido: {FUENTE}")
    log.info("descargando %s", FUENTE)
    with urllib.request.urlopen(FUENTE, timeout=120) as respuesta:  # nosec B310
        return respuesta.read().decode("utf-8").splitlines()


def parsear(lineas: list[str]) -> tuple[list[dict[str, str]], str]:
    """Filas del catálogo y la fecha de actualización declarada en la cabecera."""
    if not lineas or not lineas[0].startswith("#JCAT"):
        raise SystemExit("cabecera inesperada; ¿cambió el formato del TSV?")
    actualizado = "?"
    if len(lineas) > 1:
        m = re.match(r"#\s*Updated\s+(\d{4})\s+(\w{3})\s+(\d{1,2})", lineas[1])
        if m:
            anio, mes_txt, dia = m.groups()
            mes = {
                "Jan": 1,
                "Feb": 2,
                "Mar": 3,
                "Apr": 4,
                "May": 5,
                "Jun": 6,
                "Jul": 7,
                "Aug": 8,
                "Sep": 9,
                "Oct": 10,
                "Nov": 11,
                "Dec": 12,
            }[mes_txt]
            actualizado = datetime.date(int(anio), mes, int(dia)).isoformat()
    lector = csv.reader(lineas[2:], delimiter="\t")
    filas = [
        dict(zip(COLUMNAS, [c.strip() for c in fila]))
        for fila in lector
        if len(fila) == len(COLUMNAS)
    ]
    if not filas:
        raise SystemExit("el TSV no trae filas; ¿cambió el formato?")
    return filas, actualizado


def _tipo(fila: dict[str, str]) -> str:
    """Primera letra del tipo (P carga útil, R etapa, C componente, D desecho)."""
    return fila["Type"][:1] if fila["Type"] else "?"


def _subtipo(fila: dict[str, str]) -> str:
    """Segundo código del tipo, separado por espacios (`D  W` -> `W`, origen del desecho)."""
    partes = fila["Type"].split()
    return partes[1] if len(partes) > 1 else ""


def _anio_lanzamiento(fila: dict[str, str]) -> int | None:
    m = re.match(r"(\d{4})", fila["LDate"])
    return int(m.group(1)) if m else None


def _fecha_gcat(texto: str) -> str | None:
    """`1957 Oct  4` -> `1957-10-04`. GCAT usa `-` para «sin dato» y a veces sufija hora/`?`."""
    m = re.match(r"(\d{4})\s+(\w{3})\s+(\d{1,2})", texto)
    if not m:
        return None
    anio, mes_txt, dia = m.groups()
    meses = {
        "Jan": 1,
        "Feb": 2,
        "Mar": 3,
        "Apr": 4,
        "May": 5,
        "Jun": 6,
        "Jul": 7,
        "Aug": 8,
        "Sep": 9,
        "Oct": 10,
        "Nov": 11,
        "Dec": 12,
    }
    mes = meses.get(mes_txt)
    if mes is None:
        return None
    return datetime.date(int(anio), mes, int(dia)).isoformat()


def agregar_serie(filas: list[dict[str, str]]) -> list[dict]:
    """Catalogados por año de lanzamiento × tipo × país, top 12 países + OTROS."""
    por_pais = collections.Counter(
        f["State"] for f in filas if f["State"] and f["State"] != "-"
    )
    principales = {pais for pais, _ in por_pais.most_common(TOP_PAISES)}

    conteo: dict[tuple[int, str, str], int] = collections.Counter()
    for f in filas:
        anio = _anio_lanzamiento(f)
        tipo = _tipo(f)
        if anio is None or tipo not in ("P", "R", "C", "D"):
            continue
        pais = f["State"] if f["State"] in principales else "OTROS"
        conteo[(anio, tipo, pais)] += 1

    return [
        {"anio": anio, "tipo": tipo, "pais": pais, "lanzados": n}
        for (anio, tipo, pais), n in sorted(conteo.items())
    ]


def agregar_regimen(filas: list[dict[str, str]]) -> list[dict]:
    """En órbita hoy (`Status == O`) por régimen orbital × tipo."""
    conteo: dict[tuple[str, str], int] = collections.Counter()
    for f in filas:
        if f["Status"] != "O":
            continue
        tipo = _tipo(f)
        if tipo not in ("P", "R", "C", "D"):
            continue
        regimen = (f["OpOrbit"].split("/")[0] or "?") if f["OpOrbit"] else "?"
        conteo[(regimen, tipo)] += 1
    return [
        {"regimen": regimen, "tipo": tipo, "n": n}
        for (regimen, tipo), n in sorted(conteo.items(), key=lambda x: -x[1])
    ]


def agregar_asat(filas: list[dict[str, str]]) -> list[dict]:
    """Desechos de ensayo antisatélite (`D W`), agrupados por el satélite destruido."""
    por_jcat = {f["JCAT"]: f for f in filas}
    desechos = [f for f in filas if _tipo(f) == "D" and _subtipo(f) == "W"]

    catalogados: dict[str, int] = collections.Counter(d["Parent"] for d in desechos)
    en_orbita: dict[str, int] = collections.Counter(
        d["Parent"] for d in desechos if d["Status"] == "O"
    )

    ensayos = []
    for jcat, n_catalogados in catalogados.items():
        padre = por_jcat.get(jcat)
        if padre is None:
            continue
        ensayos.append(
            {
                "jcat": jcat,
                "satcat": padre["Satcat"],
                "cospar": padre["Piece"],
                "nombre": padre["Name"],
                "pais": padre["State"],
                "fecha_ensayo": _fecha_gcat(padre["DDate"]),
                "catalogados": n_catalogados,
                "en_orbita": en_orbita.get(jcat, 0),
            }
        )
    ensayos.sort(key=lambda e: -e["catalogados"])
    return ensayos


def agregar_colombia(filas: list[dict[str, str]]) -> list[dict]:
    objetos = []
    for f in filas:
        if f["State"] != "CO":
            continue
        objetos.append(
            {
                "jcat": f["JCAT"],
                "satcat": f["Satcat"],
                "cospar": f["Piece"],
                "nombre": f["Name"],
                "lanzamiento": _fecha_gcat(f["LDate"]),
                "estado": "En órbita" if f["Status"] == "O" else "Reentrado",
                "fin": _fecha_gcat(f["DDate"]),
            }
        )
    objetos.sort(key=lambda o: o["lanzamiento"] or "")
    return objetos


def agregar_inspectores(filas: list[dict[str, str]]) -> list[dict]:
    """Cada entrada curada, con sus datos reales de GCAT y sus hijos catalogados."""
    por_jcat = {f["JCAT"]: f for f in filas}
    resultado = []
    for entrada in INSPECTORES:
        f = por_jcat.get(entrada["jcat"])
        if f is None:
            log.warning("JCAT curado no encontrado en GCAT: %s", entrada["jcat"])
            continue
        hijos = [
            {
                "jcat": h["JCAT"],
                "nombre": h["Name"],
                "tipo": "fragmento" if _tipo(h) == "D" else "objeto",
                "en_orbita": h["Status"] == "O",
            }
            for h in filas
            if h["Parent"] == entrada["jcat"]
        ]
        resultado.append(
            {
                "jcat": f["JCAT"],
                "satcat": f["Satcat"],
                "cospar": f["Piece"],
                "nombre": f["Name"],
                "pais": f["State"],
                "lanzamiento": _fecha_gcat(f["LDate"]),
                "orbita": f["OpOrbit"],
                "estado": "En órbita" if f["Status"] == "O" else "Fuera de órbita",
                "fin": _fecha_gcat(f["DDate"]),
                "alias_corpus": entrada["alias_corpus"],
                "referencia": entrada["referencia"],
                "hijos": hijos,
            }
        )
    resultado.sort(key=lambda e: e["lanzamiento"] or "")
    return resultado


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--salida", type=pathlib.Path, default=SALIDA)
    args = p.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    lineas = descargar()
    filas, actualizado = parsear(lineas)
    log.info("%d objetos catalogados, actualizado %s", len(filas), actualizado)

    datos = {
        "procedencia": {
            "fuente": "GCAT — General Catalog of Artificial Space Objects (Jonathan C. McDowell)",
            "url": FUENTE,
            "licencia": LICENCIA,
            "cita": CITA,
            "actualizado": actualizado,
            "descargado": datetime.datetime.now(tz=datetime.UTC).date().isoformat(),
            "filas": len(filas),
        },
        "serie": agregar_serie(filas),
        "en_orbita_por_regimen": agregar_regimen(filas),
        "asat": agregar_asat(filas),
        "colombia": agregar_colombia(filas),
        "inspectores": agregar_inspectores(filas),
    }

    args.salida.mkdir(parents=True, exist_ok=True)
    destino = args.salida / "orbita.json"
    destino.write_text(
        json.dumps(datos, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    log.info(
        "escrito %s — %d filas de serie, %d ensayos ASAT, %d objetos de Colombia, %d inspectores",
        destino,
        len(datos["serie"]),
        len(datos["asat"]),
        len(datos["colombia"]),
        len(datos["inspectores"]),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
