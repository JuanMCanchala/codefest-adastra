"""Población de objetos en órbita, ensayos antisatélite y satélites de inspección (F2).

**Qué hueco llena.** F2 (seguridad del entorno espacial) es el único de los tres fenómenos
sin componente propio: el tablero solo reutiliza los genéricos (mapa mundial, línea de
tiempo, red de entidades). El corpus habla de ensayos ASAT y del síndrome de Kessler (SWF,
CSIS), pero ningún componente contaba objetos en órbita con datos duros externos.

No consulta la base analítica para tres de sus cuatro vistas: lee el JSON que precalcula
`scripts/gcat_orbita.py` a partir de GCAT (McDowell, CC BY 4.0). Su trazabilidad tampoco es
`doc_id`/`chunk_id` en esas vistas, sino la del catálogo de origen —`jcat`/`satcat`/`cospar`
por objeto—. La vista `asat` y la vista `inspectores` sí citan el corpus: resuelven una
lista de alias contra `menciones` y devuelven fragmentos reales.
"""

from __future__ import annotations

import json
import logging
import pathlib
from typing import Any, Literal

from pydantic import Field

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from ..settings import get_settings
from .base import FiltrosBase, Salida, evidencia, refs, resolver_filtros

log = logging.getLogger(__name__)

# El JSON viaja en la imagen junto a la base analítica y las geometrías.
EN_REPOSITORIO = pathlib.Path(__file__).resolve().parents[3] / "datos" / "orbita"
ARCHIVO = "orbita.json"

Vista = Literal["crecimiento", "asat", "colombia", "inspectores"]

# Alias por los que cada ensayo ASAT aparece en el grafo de entidades de la Etapa 1 (en
# minúsculas, como los guarda `menciones`). Solo los ensayos con evidencia real en el corpus
# llevan alias: el resto se muestra igual, pero sin fragmentos, en vez de inventar un vínculo.
ALIAS_ASAT: dict[str, list[str]] = {
    "S25730": ["fengyun 1c", "fengyun-1c", "chinese fengyun-1c engagement"],  # Feng Yun 1C
    "S13552": ["cosmos 1408", "kosmos 1408 anti-satellite missile test"],  # Kosmos-1408
    "S43947": ["mission shakti"],  # Microsat-R
}

RESOLVER_MENCIONES = "SELECT DISTINCT doc_id, chunk_id FROM menciones WHERE entidad IN ({claves})"


class Filtros(FiltrosBase):
    vista: Vista = "crecimiento"
    #: Código GCAT del país (`US`, `CN`, `RU`, `SU`, `CO`...). El que no casa se descarta.
    pais: str | None = None
    desde: int = Field(default=1957, ge=1957, le=2100)
    hasta: int = Field(default=2026, ge=1957, le=2100)
    #: Cuántos ensayos ASAT devolver, de más a menos catalogados.
    top: int = Field(default=10, ge=3, le=26)


def _directorio() -> pathlib.Path:
    """Carpeta de datos precalculados: la de la imagen, o la del repositorio en desarrollo."""
    ruta = get_settings().db_path.parent / "orbita"
    return ruta if ruta.is_dir() else EN_REPOSITORIO


def _cargar() -> dict[str, Any] | None:
    ruta = _directorio() / ARCHIVO
    if not ruta.is_file():
        return None
    try:
        return json.loads(ruta.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        log.warning("población orbital ilegible: %s", ruta)
        return None


def _salida_vacia() -> Salida:
    return Salida(
        titulo="Sin datos de población orbital",
        datos={
            "vista": "crecimiento",
            "serie": [],
            "en_orbita_por_regimen": [],
            "asat": [],
            "colombia": [],
            "inspectores": [],
            "procedencia": None,
        },
        evidencia=[],
        total_evidencia=0,
        nota_metodo=("No hay datos en disco. Se descargan con `python scripts/gcat_orbita.py`."),
    )


def _resolver_fragmentos(bd: BaseDatos, alias: list[str]) -> list[tuple[str, int]]:
    """`(doc_id, chunk_id)` reales para una lista de alias, vía consulta parametrizada.

    El `IN (...)` se arma con nombres de parámetro dinámicos (`:a0`, `:a1`...): el texto SQL
    es siempre el mismo patrón fijo, y los valores de los alias nunca se interpolan.
    """
    if not alias:
        return []
    claves = {f"a{i}": a for i, a in enumerate(alias)}
    sql = RESOLVER_MENCIONES.format(claves=", ".join(f":{k}" for k in claves))
    filas = bd.consultar(sql, claves)
    return [(fila["doc_id"], fila["chunk_id"]) for fila in filas]


def _paises_en(filas: list[dict[str, Any]], campo: str = "pais") -> set[str]:
    return {f[campo] for f in filas if f.get(campo)}


def _vista_crecimiento(
    bd: BaseDatos, datos: dict[str, Any], f: Filtros, ignorados: list[str]
) -> tuple[Salida, list[str]]:
    serie = [s for s in datos["serie"] if f.desde <= s["anio"] <= f.hasta]
    if f.pais:
        paises_validos = _paises_en(datos["serie"])
        if f.pais not in paises_validos:
            ignorados = sorted({*ignorados, "pais"})
        else:
            serie = [s for s in serie if s["pais"] == f.pais]

    total_lanzados = sum(s["lanzados"] for s in serie)
    total_en_orbita = sum(r["n"] for r in datos["en_orbita_por_regimen"])
    p = datos["procedencia"]
    nota = (
        f"Objetos catalogados por GCAT ({p['fuente'].split('—')[0].strip()}, "
        f"{p['licencia']}, actualizado {p['actualizado']}), agrupados por año de lanzamiento, "
        "tipo (carga útil, etapa, componente, desecho) y país de responsabilidad. "
        "«En órbita hoy» son los objetos con estado activo en el catálogo a la fecha de "
        "actualización, por régimen orbital; no depende del rango de años elegido. "
        f"{p['filas']:,} objetos catalogados en total.".replace(",", ".")
    )
    if f.desde > 1957 or f.hasta < 2026:
        nota += f" Serie recortada a {f.desde}-{f.hasta}."

    salida = Salida(
        titulo="Población de objetos en órbita",
        datos={
            "vista": "crecimiento",
            "serie": serie,
            "en_orbita_por_regimen": datos["en_orbita_por_regimen"],
            "total_lanzados": total_lanzados,
            "total_en_orbita": total_en_orbita,
            "procedencia": p,
        },
        evidencia=[],
        total_evidencia=0,
        nota_metodo=nota,
    )
    return salida, ignorados


def _vista_asat(
    bd: BaseDatos, datos: dict[str, Any], f: Filtros, ignorados: list[str]
) -> tuple[Salida, list[str]]:
    ensayos = datos["asat"]
    if f.pais:
        paises_validos = _paises_en(ensayos)
        if f.pais not in paises_validos:
            ignorados = sorted({*ignorados, "pais"})
        else:
            ensayos = [e for e in ensayos if e["pais"] == f.pais]
    ensayos = ensayos[: f.top]

    pares_totales: list[tuple[str, int]] = []
    filas = []
    for e in ensayos:
        pares = _resolver_fragmentos(bd, ALIAS_ASAT.get(e["jcat"], []))
        pares_totales.extend(pares)
        filas.append({**e, "refs": refs(pares)})

    lista, total_evidencia = evidencia(pares_totales)
    p = datos["procedencia"]
    nota = (
        f"Desechos de ensayo antisatélite (GCAT, {p['licencia']}, actualizado "
        f"{p['actualizado']}): objeto tipo desecho con origen «ensayo de arma», agrupado por "
        "el satélite destruido (campo Parent del catálogo). «En órbita» es el estado activo a "
        "la fecha de actualización. Solo Feng Yun 1C, Kosmos-1408 y Microsat-R (Mission "
        "Shakti) tienen fragmentos citables del corpus indexado; los demás ensayos se "
        "muestran con sus cifras de GCAT y sin evidencia del corpus, en vez de inventar un "
        "vínculo."
    )

    salida = Salida(
        titulo="Desechos de ensayos antisatélite",
        datos={
            "vista": "asat",
            "asat": filas,
            "procedencia": p,
        },
        evidencia=lista,
        total_evidencia=total_evidencia,
        nota_metodo=nota,
    )
    return salida, ignorados


def _vista_colombia(datos: dict[str, Any], ignorados: list[str]) -> tuple[Salida, list[str]]:
    p = datos["procedencia"]
    nota = (
        f"Objetos catalogados por GCAT con responsabilidad de Colombia ({p['licencia']}, "
        f"actualizado {p['actualizado']}). La reentrada de FACSAT-2 Chiribiquete "
        "(2025-10-27) sale del catálogo tal cual; conviene confirmarla con la FAC antes de "
        "citarla en una demostración en vivo."
    )
    salida = Salida(
        titulo="Objetos de Colombia en órbita",
        datos={
            "vista": "colombia",
            "colombia": datos["colombia"],
            "procedencia": p,
        },
        evidencia=[],
        total_evidencia=0,
        nota_metodo=nota,
    )
    return salida, ignorados


def _vista_inspectores(
    bd: BaseDatos, datos: dict[str, Any], f: Filtros, ignorados: list[str]
) -> tuple[Salida, list[str]]:
    entradas = datos["inspectores"]
    if f.pais:
        paises_validos = _paises_en(entradas)
        if f.pais not in paises_validos:
            ignorados = sorted({*ignorados, "pais"})
        else:
            entradas = [e for e in entradas if e["pais"] == f.pais]

    pares_totales: list[tuple[str, int]] = []
    filas = []
    for e in entradas:
        pares = _resolver_fragmentos(bd, e.get("alias_corpus", []))
        pares_totales.extend(pares)
        filas.append({**e, "refs": refs(pares)})

    lista, total_evidencia = evidencia(pares_totales)
    p = datos["procedencia"]
    nota = (
        f"Lista curada de {len(datos['inspectores'])} satélites de inspección y proximidad "
        "(RPO) con referencia pública citada por entrada. Fechas, órbitas, estados y "
        f"fragmentos catalogados según GCAT ({p['licencia']}, actualizado {p['actualizado']}). "
        "Que un satélite esté en la lista no afirma una intención: resume lo que documentan "
        "las fuentes citadas."
    )

    salida = Salida(
        titulo="Satélites de inspección y proximidad",
        datos={
            "vista": "inspectores",
            "inspectores": filas,
            "procedencia": p,
        },
        evidencia=lista,
        total_evidencia=total_evidencia,
        nota_metodo=nota,
    )
    return salida, ignorados


def calcular(
    bd: BaseDatos, filtros: dict[str, Any], _textos: IndiceTextos
) -> tuple[Salida, Filtros, list[str]]:
    f, ignorados = resolver_filtros(Filtros, filtros)
    if f.desde > f.hasta:
        # Un rango del revés es un error de quien pregunta, no motivo para no responder.
        f = f.model_copy(update={"desde": f.hasta, "hasta": f.desde})

    datos = _cargar()
    if datos is None:
        return _salida_vacia(), f, ignorados

    if f.vista == "crecimiento":
        salida, ignorados = _vista_crecimiento(bd, datos, f, ignorados)
    elif f.vista == "asat":
        salida, ignorados = _vista_asat(bd, datos, f, ignorados)
    elif f.vista == "colombia":
        # `pais` no aplica a esta vista (siempre son los mismos 3 objetos de Colombia): se
        # ignora en silencio, no se reporta como descartado, porque es un filtro global que
        # simplemente no tiene efecto aquí, no un valor que el usuario pidió y no se cumplió.
        salida, ignorados = _vista_colombia(datos, ignorados)
    else:
        salida, ignorados = _vista_inspectores(bd, datos, f, ignorados)

    return salida, f, ignorados
