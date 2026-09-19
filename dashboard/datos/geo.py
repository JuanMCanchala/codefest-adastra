"""Descarga y preparación de geometrías: países (Natural Earth) y Colombia (MGN del DANE)."""

from __future__ import annotations

import json
import unicodedata
import urllib.request
from pathlib import Path

URL_PAISES = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
    "ne_50m_admin_0_countries.geojson"
)
URL_MUNICIPIOS = (
    "https://raw.githubusercontent.com/caticoa3/colombia_mapa/master/"
    "co_2018_MGN_MPIO_POLITICO.geojson"
)
URL_DEPARTAMENTOS = (
    "https://raw.githubusercontent.com/caticoa3/colombia_mapa/master/"
    "co_2018_MGN_DPTO_POLITICO.geojson"
)

CLAVES_NOMBRE_PAIS = (
    "NAME",
    "NAME_EN",
    "NAME_ES",
    "NAME_PT",
    "NAME_LONG",
    "BRK_NAME",
    "NAME_SORT",
    "NAME_CIAWF",
    "FORMAL_EN",
)

ALIAS_PAIS = {
    "us": "USA",
    "u s": "USA",
    "usa": "USA",
    "eeuu": "USA",
    "ee uu": "USA",
    "united states of america": "USA",
    "the united states": "USA",
    "america": "USA",
    "uk": "GBR",
    "u k": "GBR",
    "great britain": "GBR",
    "britain": "GBR",
    "england": "GBR",
    "russian": "RUS",
    "russian federation": "RUS",
    "prc": "CHN",
    "peoples republic of china": "CHN",
    "republic of china": "TWN",
    "korea": "KOR",
    "republic of korea": "KOR",
    "dprk": "PRK",
    "democratic peoples republic of korea": "PRK",
    "czechia": "CZE",
    "kyrgyz republic": "KGZ",
    "uae": "ARE",
    "emiratos arabes unidos": "ARE",
    "burma": "MMR",
    "turkiye": "TUR",
    "viet nam": "VNM",
    "holland": "NLD",
    "drc": "COD",
    "democratic republic of congo": "COD",
    "ivory coast": "CIV",
    "cabo verde": "CPV",
    "swaziland": "SWZ",
    "macedonia": "MKD",
    "brasil": "BRA",
    "peru": "PER",
    "mexico": "MEX",
}

# Tokens de nombres formales (ES/PT) que se retiran al no encontrar el nombre corto:
# "República Bolivariana de Venezuela" -> "venezuela".
TOKENS_FORMALES = frozenset(
    {
        "republica",
        "republic",
        "reino",
        "estado",
        "estados",
        "unidos",
        "federacion",
        "federativa",
        "bolivariana",
        "popular",
        "oriental",
        "plurinacional",
        "islamica",
        "arabe",
        "democratica",
        "socialista",
        "principado",
        "gran",
        "ducado",
        "commonwealth",
        "kingdom",
        "state",
        "states",
    }
)


def normalizar(texto: str) -> str:
    """Minúsculas sin acentos ni puntuación, para emparejar nombres de lugares."""
    base = unicodedata.normalize("NFKD", texto or "")
    base = "".join(c for c in base if not unicodedata.combining(c))
    base = base.lower().replace("&", " and ")
    base = "".join(c if c.isalnum() else " " for c in base)
    palabras = [p for p in base.split() if p not in {"the", "de", "del", "la", "el"}]
    return " ".join(palabras)


def resolver_pais(indice: dict[str, tuple[str, str]], nombre: str) -> tuple[str, str] | None:
    """Busca el nombre tal cual y, si falla, sin los tokens de nombre formal."""
    clave = normalizar(nombre)
    if not clave:
        return None
    encontrado = indice.get(clave)
    if encontrado:
        return encontrado
    palabras = clave.split()
    while palabras and palabras[0] in TOKENS_FORMALES:
        palabras.pop(0)
    corto = " ".join(palabras)
    return indice.get(corto) if corto and corto != clave else None


def descargar(url: str, destino: Path) -> Path:
    """Descarga con caché en disco: si el archivo ya existe no vuelve a pedirlo."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    if destino.exists() and destino.stat().st_size > 0:
        return destino
    with urllib.request.urlopen(url, timeout=180) as respuesta:  # noqa: S310
        contenido = respuesta.read()
    destino.write_bytes(contenido)
    return destino


def _redondear(coords, decimales: int):
    if isinstance(coords, (int, float)):
        return round(coords, decimales)
    return [_redondear(c, decimales) for c in coords]


def _escribir_geojson(destino: Path, rasgos: list[dict]) -> int:
    destino.parent.mkdir(parents=True, exist_ok=True)
    contenido = {"type": "FeatureCollection", "features": rasgos}
    destino.write_text(json.dumps(contenido, ensure_ascii=False, separators=(",", ":")), "utf-8")
    return destino.stat().st_size


def preparar_paises(cache: Path, salida: Path) -> tuple[dict[str, tuple[str, str]], int]:
    """Escribe geo/paises.geojson y devuelve el índice alias -> (iso3, nombre_es)."""
    origen = descargar(URL_PAISES, cache / "ne_50m_admin_0_countries.geojson")
    datos = json.loads(origen.read_text("utf-8"))
    indice: dict[str, tuple[str, str]] = {}
    rasgos = []
    for rasgo in datos["features"]:
        props = rasgo["properties"]
        iso3 = props.get("ISO_A3_EH") or props.get("ADM0_ISO") or props.get("ISO_A3")
        if not iso3 or iso3 in {"-99", ""}:
            continue
        nombre_es = props.get("NAME_ES") or props.get("NAME")
        rasgos.append(
            {
                "type": "Feature",
                "properties": {
                    "iso3": iso3,
                    "nombre_es": nombre_es,
                    "nombre_en": props.get("NAME"),
                },
                "geometry": {
                    "type": rasgo["geometry"]["type"],
                    "coordinates": _redondear(rasgo["geometry"]["coordinates"], 2),
                },
            }
        )
        alias = {props.get(clave) for clave in CLAVES_NOMBRE_PAIS}
        alias |= set((props.get("NAME_ALT") or "").split("|"))
        for nombre in alias:
            clave = normalizar(nombre or "")
            if clave:
                indice.setdefault(clave, (iso3, nombre_es))
        indice.setdefault(normalizar(iso3), (iso3, nombre_es))
    por_iso = {iso3: nombre for iso3, nombre in indice.values()}
    for alias_texto, iso3 in ALIAS_PAIS.items():
        if iso3 in por_iso:
            indice[normalizar(alias_texto)] = (iso3, por_iso[iso3])
    return indice, _escribir_geojson(salida / "paises.geojson", rasgos)


def preparar_colombia(cache: Path, salida: Path) -> tuple[dict, int, int]:
    """Escribe municipios y departamentos y devuelve el índice DIVIPOLA del MGN."""
    origen = descargar(URL_MUNICIPIOS, cache / "co_2018_MGN_MPIO_POLITICO.geojson")
    datos = json.loads(origen.read_text("utf-8"))
    rasgos = []
    municipios: dict[str, dict] = {}
    for rasgo in datos["features"]:
        props = rasgo["properties"]
        codigo = props["MPIO_CCNCT"]
        municipios[codigo] = {
            "divipola_mpio": codigo,
            "divipola_dpto": props["DPTO_CCDGO"],
            "municipio": props["MPIO_CNMBR"],
            "departamento": props["DPTO_CNMBR"],
        }
        rasgos.append(
            {
                "type": "Feature",
                "properties": {
                    "divipola_mpio": codigo,
                    "divipola_dpto": props["DPTO_CCDGO"],
                    "municipio": props["MPIO_CNMBR"],
                    "departamento": props["DPTO_CNMBR"],
                    "area_km2": round(float(props.get("MPIO_NAREA") or 0), 2),
                },
                "geometry": {
                    "type": rasgo["geometry"]["type"],
                    "coordinates": _redondear(rasgo["geometry"]["coordinates"], 3),
                },
            }
        )
    bytes_mpio = _escribir_geojson(salida / "municipios.geojson", rasgos)

    origen_dpto = descargar(URL_DEPARTAMENTOS, cache / "co_2018_MGN_DPTO_POLITICO.geojson")
    datos_dpto = json.loads(origen_dpto.read_text("utf-8"))
    rasgos_dpto = [
        {
            "type": "Feature",
            "properties": {
                "divipola_dpto": rasgo["properties"]["DPTO_CCDGO"],
                "departamento": rasgo["properties"]["DPTO_CNMBR"],
            },
            "geometry": {
                "type": rasgo["geometry"]["type"],
                "coordinates": _redondear(rasgo["geometry"]["coordinates"], 3),
            },
        }
        for rasgo in datos_dpto["features"]
    ]
    bytes_dpto = _escribir_geojson(salida / "departamentos.geojson", rasgos_dpto)
    return municipios, bytes_mpio, bytes_dpto


def indice_municipios(municipios: dict[str, dict]) -> tuple[dict, dict]:
    """Construye índices (departamento, municipio) -> código y municipio -> código único.

    Los nombres de departamento se registran también por prefijo de palabras cuando es
    inequívoco, para admitir formas abreviadas ('Archipiélago de San Andrés').
    """
    por_dpto: dict[str, list[tuple[str, str]]] = {}
    por_nombre: dict[str, set[str]] = {}
    for codigo, datos in municipios.items():
        clave_dpto = normalizar(datos["departamento"])
        clave_mpio = normalizar(datos["municipio"])
        por_dpto.setdefault(clave_dpto, []).append((clave_mpio, codigo))
        por_nombre.setdefault(clave_mpio, set()).add(codigo)

    prefijos: dict[str, set[str]] = {}
    for clave_dpto in por_dpto:
        palabras = clave_dpto.split()
        for n in range(1, len(palabras)):
            prefijos.setdefault(" ".join(palabras[:n]), set()).add(clave_dpto)

    por_par: dict[tuple[str, str], str] = {}
    for clave_dpto, pares in por_dpto.items():
        for clave_mpio, codigo in pares:
            por_par[(clave_dpto, clave_mpio)] = codigo
    for prefijo, candidatos in prefijos.items():
        if len(candidatos) != 1 or prefijo in por_dpto:
            continue
        for clave_mpio, codigo in por_dpto[next(iter(candidatos))]:
            por_par.setdefault((prefijo, clave_mpio), codigo)

    unicos = {
        nombre: next(iter(codigos)) for nombre, codigos in por_nombre.items() if len(codigos) == 1
    }
    return por_par, unicos
