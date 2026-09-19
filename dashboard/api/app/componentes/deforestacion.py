"""Pérdida de bosque del Chocó con la causa atribuida a cada polígono.

**Qué hueco llena.** El agente satelital mide minería con Amazon Mining Watch, que solo cubre
la cuenca amazónica y lo declara: el Chocó queda fuera. Este componente lo llena con datos
oficiales —`AREAS DEFORESTADAS CHOCO`, del portal de Datos Abiertos— y añade lo que ninguna
de las otras fuentes tiene: **por qué** se perdió el bosque. Cada uno de los 7.937 polígonos
viene atribuido a minería, incendio, cultivo, ganadería u obras civiles.

Eso es lo que permite el cruce que sostiene el fenómeno 3: Río Quito aparece en las alertas
tempranas del corpus por minería ilegal, y aquí aparece con el 99,9 % de su deforestación
atribuida a minería. Dos fuentes independientes, el mismo municipio.

No consulta la base: lee el JSON que precalcula `scripts/deforestacion_choco.py`. Su
trazabilidad tampoco es `doc_id`/`chunk_id`, sino la del conjunto de origen —identificador,
recuento de polígonos, método y periodo— más el código DIVIPOLA de cada municipio, que es
lo que lo empalma con las alertas del corpus.
"""

from __future__ import annotations

import json
import logging
import pathlib
from typing import Any

from pydantic import Field

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from ..settings import get_settings
from .base import FiltrosBase, Salida, resolver_filtros

log = logging.getLogger(__name__)

# El JSON viaja en la imagen junto a la base analítica y las geometrías.
EN_REPOSITORIO = pathlib.Path(__file__).resolve().parents[3] / "datos" / "deforestacion"
ARCHIVO = "choco.json"


class Filtros(FiltrosBase):
    #: Restringe a una causa (`Minería`, `Incendio`, `Cultivo`…). Sin valor, todas.
    causa: str | None = None
    desde: int = Field(default=2014, ge=1990, le=2100)
    hasta: int = Field(default=2021, ge=1990, le=2100)
    #: Cuántos municipios devolver, de mayor a menor superficie perdida.
    top: int = Field(default=15, ge=3, le=30)


def _directorio() -> pathlib.Path:
    """Carpeta de datos precalculados: la de la imagen, o la del repositorio en desarrollo."""
    ruta = get_settings().db_path.parent / "deforestacion"
    return ruta if ruta.is_dir() else EN_REPOSITORIO


def _cargar() -> dict[str, Any] | None:
    ruta = _directorio() / ARCHIVO
    if not ruta.is_file():
        return None
    try:
        return json.loads(ruta.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        log.warning("deforestación ilegible: %s", ruta)
        return None


def _en_rango(anio: str, desde: int, hasta: int) -> bool:
    return anio.isdigit() and desde <= int(anio) <= hasta


def calcular(
    bd: BaseDatos, filtros: dict[str, Any], textos: IndiceTextos
) -> tuple[Salida, Filtros, list[str]]:
    f, ignorados = resolver_filtros(Filtros, filtros)
    if f.desde > f.hasta:
        # Un rango del revés es un error de quien pregunta, no motivo para no responder.
        f = f.model_copy(update={"desde": f.hasta, "hasta": f.desde})
    datos = _cargar()

    if datos is None:
        return (
            Salida(
                titulo="Sin datos de deforestación",
                datos={
                    "serie": [],
                    "causas": [],
                    "municipios": [],
                    "municipios_totales": 0,
                    "procedencia": None,
                },
                evidencia=[],
                total_evidencia=0,
                nota_metodo=(
                    "No hay datos en disco. Se descargan con "
                    "`python scripts/deforestacion_choco.py`."
                ),
            ),
            f,
            ignorados,
        )

    causas_validas = {c["causa"] for c in datos["causas"]}
    if f.causa and f.causa not in causas_validas:
        # Igual que en los demás componentes: la causa que no casa se descarta y se avisa,
        # en vez de devolver un lienzo vacío.
        ignorados = sorted({*ignorados, "causa"})
        f = f.model_copy(update={"causa": None})

    # La serie por causa es la fuente de verdad cuando hay filtro: la serie total no se
    # puede recortar por causa sin volver a sumar.
    if f.causa:
        por_anio: dict[str, float] = {}
        for fila in datos["serie_por_causa"]:
            if fila["causa"] == f.causa and _en_rango(fila["anio"], f.desde, f.hasta):
                por_anio[fila["anio"]] = por_anio.get(fila["anio"], 0.0) + fila["ha"]
        serie = [{"anio": a, "ha": round(v, 2)} for a, v in sorted(por_anio.items())]
    else:
        serie = [
            {"anio": s["anio"], "ha": s["ha"], "poligonos": s["poligonos"]}
            for s in datos["serie"]
            if _en_rango(s["anio"], f.desde, f.hasta)
        ]

    # Los municipios se recalculan desde el desglose año × causa, no desde los totales del
    # conjunto: si no, al recortar los años la serie bajaba pero las barras seguían
    # mostrando 2014-2021 y el total contradecía al dibujo.
    municipios = []
    for m in datos["municipios"]:
        ha, poligonos = 0.0, 0
        por_causa: dict[str, float] = {}
        for celda in m["detalle"]:
            if not _en_rango(celda["anio"], f.desde, f.hasta):
                continue
            if f.causa and celda["causa"] != f.causa:
                continue
            ha += celda["ha"]
            poligonos += celda["poligonos"]
            por_causa[celda["causa"]] = por_causa.get(celda["causa"], 0.0) + celda["ha"]
        if ha <= 0:
            continue
        municipios.append(
            {
                "divipola": m["divipola"],
                "nombre": m["nombre"],
                "departamento": m["departamento"],
                "ha": round(ha, 2),
                "poligonos": poligonos,
                "por_causa": {
                    c: round(v, 2) for c, v in sorted(por_causa.items(), key=lambda x: -x[1])
                },
            }
        )
    municipios.sort(key=lambda m: -m["ha"])
    # Cuántos hay en total antes de recortar: el gráfico enseña los `top` primeros, y sus
    # barras suman menos que el total. La vista lo dice en vez de dejar la resta en el aire.
    municipios_con_datos = len(municipios)
    municipios = municipios[: f.top]

    total = round(sum(s["ha"] for s in serie), 2)
    causas_en_rango: dict[str, float] = {}
    for fila in datos["serie_por_causa"]:
        if _en_rango(fila["anio"], f.desde, f.hasta):
            causas_en_rango[fila["causa"]] = causas_en_rango.get(fila["causa"], 0.0) + fila["ha"]
    causas = [
        {"causa": c, "ha": round(v, 2)}
        for c, v in sorted(causas_en_rango.items(), key=lambda x: -x[1])
        if v > 0
    ]
    p = datos["procedencia"]
    nota = (
        f"{p['fuente']} (conjunto {p['dataset']}, {p['poligonos']} polígonos, {p['periodo']}). "
        f"Método: {p['metodo']}. Cobertura: {p['cobertura']} "
        "Los municipios llevan su código DIVIPOLA, resuelto contra las geometrías del DANE "
        "que ya usa el tablero, que es lo que permite cruzarlos con las alertas tempranas. "
        "La causa es la que declara la fuente; los polígonos que la traen vacía se agrupan "
        "aparte como «Sin atribuir» en vez de repartirse entre las demás."
    )
    if f.desde > 2014 or f.hasta < 2021:
        nota += f" Recortado a {f.desde}-{f.hasta}."

    titulo = "Deforestación del Chocó por municipio"
    if f.causa:
        titulo = f"Deforestación del Chocó atribuida a «{f.causa}»"

    return (
        Salida(
            titulo=titulo,
            datos={
                "serie": serie,
                "causas": causas,
                "municipios": municipios,
                "municipios_totales": municipios_con_datos,
                "total_ha": total,
                "causa": f.causa,
                "procedencia": p,
            },
            evidencia=[],
            total_evidencia=0,
            nota_metodo=nota,
        ),
        f,
        ignorados,
    )
