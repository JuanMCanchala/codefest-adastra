"""Orden de observación: de la mención en el corpus al sobrevuelo del satélite.

Una sola ficha por municipio que cierra el ciclo inteligencia → espacio → territorio, y que
convierte los tres fenómenos del corpus en tres etapas del mismo trabajo:

1. **Territorio (F3).** Qué dicen de ese municipio las alertas tempranas de la Defensoría
   (cuántas, de qué tipo, con qué economías ilícitas y grupos armados) y la ficha de presencia
   armada de Amazon Underworld si el municipio está en la cuenca amazónica.
2. **Lo que ya se midió (F1).** Las hectáreas de minería aurífera que Amazon Mining Watch
   detectó ahí sobre Sentinel-2, y la serie de su departamento; o la constancia de que el
   municipio queda fuera del área monitoreada.
3. **Observación (F2).** El punto de referencia para calcular, en el navegador y con los TLE
   embebidos, cuándo lo miró y cuándo lo volverá a mirar cada satélite. Ese cálculo no vive
   aquí: la API solo entrega el punto y quién lo pide (Anexo B.2.5: ninguna pasada se guarda
   como dato, se propaga desde los elementos orbitales publicados).

Cada cifra sale de una tabla o de un archivo con procedencia declarada, y la evidencia son
los mismos `doc_id`/`chunk_id` de siempre. El punto de referencia es el centro del polígono
municipal del Marco Geoestadístico Nacional: no es una coordenada medida y se declara como
tal; la franja del sensor más estrecho que se propaga (185 km) cubre el municipio entero, así
que basta para decidir si una pasada lo fotografía.
"""

from __future__ import annotations

import json
import logging
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import Field

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from ..settings import get_settings
from .base import FiltrosBase, Salida, evidencia, normalizar_vocabulario, refs, resolver_filtros

log = logging.getLogger(__name__)

# Los municipios con alertas, para resolver un nombre escrito a mano y para ofrecer a dónde
# saltar desde la ficha.
MUNICIPIOS = """
SELECT a.divipola_mpio AS divipola, a.municipio AS municipio, a.departamento AS departamento,
       a.divipola_dpto AS divipola_dpto, COUNT(*) AS alertas
  FROM alertas a
 WHERE a.divipola_mpio IS NOT NULL
   AND (:economia IS NULL OR a.economias_ilicitas LIKE '%' || :economia || '%')
   AND (a.anio IS NULL OR a.anio BETWEEN :desde AND :hasta)
 GROUP BY a.divipola_mpio
 ORDER BY alertas DESC, a.municipio
"""

ALERTAS = """
SELECT a.codigo, a.tipo, a.fecha, a.anio, a.grupos_armados, a.economias_ilicitas,
       a.poblaciones, a.doc_id, a.chunk_id
  FROM alertas a
 WHERE a.divipola_mpio = :divipola
   AND (:economia IS NULL OR a.economias_ilicitas LIKE '%' || :economia || '%')
   AND (a.anio IS NULL OR a.anio BETWEEN :desde AND :hasta)
 ORDER BY a.fecha DESC, a.codigo
"""

AMAZONIA = """
SELECT nivel1, nivel2, area_km2, poblacion, con_presencia, sin_informacion, total_grupos,
       grupos_detalle, doc_id, chunk_id
  FROM amazonia
 WHERE divipola_mpio = :divipola
 ORDER BY total_grupos DESC
 LIMIT 1
"""

# El municipio como entidad del grafo: en cuántos documentos del corpus aparece por nombre.
MENCIONES = """
SELECT e.entidad, e.n_documentos, e.n_fragmentos
  FROM entidades e
 WHERE e.entidad = :nombre
 LIMIT 1
"""

MENCIONES_REFS = """
SELECT m.doc_id, m.chunk_id
  FROM menciones m JOIN documentos d ON d.doc_id = m.doc_id
 WHERE m.entidad = :nombre
 ORDER BY d.anio DESC, m.chunk_id
 LIMIT 20
"""


class Filtros(FiltrosBase):
    #: Nombre del municipio («Tumaco», «La Montañita») o su código DIVIPOLA («52835»). Sin
    #: valor, el municipio con más alertas en el periodo.
    municipio: str | None = None
    economia: str | None = None
    desde: int = Field(default=2017, ge=1900, le=2026)
    hasta: int = Field(default=2026, ge=1900, le=2026)


def _plano(texto: str) -> str:
    descompuesto = unicodedata.normalize("NFD", texto.strip().lower())
    return "".join(c for c in descompuesto if unicodedata.category(c) != "Mn")


def _recorrer(nodo: Any, lngs: list[float], lats: list[float]) -> None:
    """Acumula todos los vértices de una geometría GeoJSON, sea polígono o multipolígono."""
    if isinstance(nodo, list) and nodo and isinstance(nodo[0], (int, float)):
        lngs.append(float(nodo[0]))
        lats.append(float(nodo[1]))
    elif isinstance(nodo, list):
        for hijo in nodo:
            _recorrer(hijo, lngs, lats)


@lru_cache(maxsize=1)
def _centros(ruta: str) -> dict[str, tuple[float, float, float | None]]:
    """Centro de la caja de cada polígono municipal y su área, por DIVIPOLA.

    Se lee una vez del GeoJSON que la propia API sirve para el mapa; si no está, la ficha
    sale sin punto de referencia y lo dice.
    """
    archivo = Path(ruta)
    if not archivo.is_file():
        return {}
    try:
        coleccion = json.loads(archivo.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        log.warning("no se pudo leer %s", archivo)
        return {}
    salida: dict[str, tuple[float, float, float | None]] = {}
    for rasgo in coleccion.get("features", []):
        props = rasgo.get("properties") or {}
        clave = props.get("divipola_mpio")
        geometria = rasgo.get("geometry") or {}
        if not clave or not geometria:
            continue
        lngs: list[float] = []
        lats: list[float] = []
        _recorrer(geometria.get("coordinates"), lngs, lats)
        if lngs and lats:
            area = props.get("area_km2")
            salida[str(clave)] = (
                round((min(lngs) + max(lngs)) / 2, 4),
                round((min(lats) + max(lats)) / 2, 4),
                float(area) if isinstance(area, (int, float)) else None,
            )
    return salida


@lru_cache(maxsize=1)
def _amw(ruta: str) -> dict[str, Any]:
    """Detecciones de Amazon Mining Watch reorganizadas por `scripts/amw_colombia.py`."""
    archivo = Path(ruta)
    if not archivo.is_file():
        return {}
    try:
        return json.loads(archivo.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        log.warning("no se pudo leer %s", archivo)
        return {}


def _contar(valores: list[str | None], separador: str | None) -> list[dict[str, Any]]:
    """Valores distintos con su frecuencia, de mayor a menor."""
    cuenta: dict[str, int] = {}
    for bruto in valores:
        if not bruto:
            continue
        partes = bruto.split(separador) if separador else [bruto]
        for parte in partes:
            limpio = parte.strip()
            if limpio:
                cuenta[limpio] = cuenta.get(limpio, 0) + 1
    return [
        {"valor": v, "n": n} for v, n in sorted(cuenta.items(), key=lambda par: (-par[1], par[0]))
    ]


def _resolver_municipio(
    pedido: str | None, candidatos: list[dict[str, Any]]
) -> dict[str, Any] | None:
    if not pedido or not pedido.strip():
        return None
    objetivo = _plano(pedido)
    if objetivo.isdigit():
        return next((c for c in candidatos if c["divipola"] == objetivo), None)
    exacto = next((c for c in candidatos if _plano(c["municipio"]) == objetivo), None)
    if exacto:
        return exacto
    # «tumaco» también debe encontrar «San Andrés de Tumaco»: el candidato con más alertas.
    return next((c for c in candidatos if objetivo in _plano(c["municipio"])), None)


def calcular(bd: BaseDatos, filtros: dict, _textos: IndiceTextos) -> tuple[Salida, Filtros, list]:
    f, ignorados = resolver_filtros(Filtros, filtros)
    f, ignorados = normalizar_vocabulario(bd, f, ("economia",), ignorados)
    if f.desde > f.hasta:
        f = f.model_copy(update={"desde": f.hasta, "hasta": f.desde})
    params = {"economia": f.economia, "desde": f.desde, "hasta": f.hasta}

    candidatos = [dict(fila) for fila in bd.consultar(MUNICIPIOS, params)]
    elegido = _resolver_municipio(f.municipio, candidatos)
    if elegido is None:
        if f.municipio:
            # El nombre no casa con ningún municipio con alertas: se dice y se abre el que más
            # tiene, que es mejor que una ficha en blanco (mismo criterio que en el mapa).
            ignorados = sorted({*ignorados, "municipio"})
            f = f.model_copy(update={"municipio": None})
        elegido = candidatos[0] if candidatos else None
    if elegido is None:
        salida = Salida(
            titulo="Orden de observación",
            datos=None,
            evidencia=[],
            total_evidencia=0,
            nota_metodo="No hay municipios con alertas tempranas para los filtros pedidos.",
        )
        return salida, f, ignorados
    f = f.model_copy(update={"municipio": elegido["municipio"]})
    divipola = str(elegido["divipola"])

    # 1. Territorio: las alertas del municipio.
    filas = [dict(fila) for fila in bd.consultar(ALERTAS, {**params, "divipola": divipola})]
    pares = [(fila["doc_id"], int(fila["chunk_id"])) for fila in filas]
    por_anio: dict[int, list[tuple[str, int]]] = {}
    for fila in filas:
        if fila["anio"] is not None:
            por_anio.setdefault(int(fila["anio"]), []).append(
                (fila["doc_id"], int(fila["chunk_id"]))
            )
    alertas = {
        "total": len(filas),
        "ultima_fecha": max((fila["fecha"] for fila in filas if fila["fecha"]), default=None),
        "por_anio": [
            {"anio": anio, "alertas": len(lista), "refs": refs(lista)}
            for anio, lista in sorted(por_anio.items())
        ],
        "tipos": _contar([fila["tipo"] for fila in filas], None),
        "economias": _contar([fila["economias_ilicitas"] for fila in filas], ";"),
        # La ficha guarda los grupos tal y como los escribe la Defensoría, sin separador
        # fiable: se muestran esos textos, no se parten a ciegas.
        "grupos_armados": _contar([fila["grupos_armados"] for fila in filas], None)[:6],
        "poblaciones": _contar([fila["poblaciones"] for fila in filas], ";")[:8],
        "codigos": [fila["codigo"] for fila in filas][:12],
        "refs": refs(pares),
    }

    # 1b. Presencia armada en la cuenca amazónica (Amazon Underworld), si la hay.
    presencia = None
    fila_amazonia = bd.consultar(AMAZONIA, {"divipola": divipola})
    if fila_amazonia:
        a = dict(fila_amazonia[0])
        grupos = [g.strip() for g in (a["grupos_detalle"] or "").split("|") if g.strip()]
        presencia = {
            "total_grupos": a["total_grupos"],
            "grupos": grupos,
            "con_presencia": a["con_presencia"],
            "sin_informacion": a["sin_informacion"],
            "poblacion": a["poblacion"],
            "area_km2": a["area_km2"],
            "refs": refs([(a["doc_id"], int(a["chunk_id"]))]),
        }
        pares.append((a["doc_id"], int(a["chunk_id"])))

    # 2. Lo que ya se midió: Amazon Mining Watch.
    cfg = get_settings()
    amw = _amw(str(cfg.amw_path))
    municipal = next(
        (m for m in amw.get("municipios", []) if str(m.get("divipola_mpio")) == divipola), None
    )
    serie_dpto = None
    for nombre, serie in amw.get("departamentos", {}).items():
        if _plano(nombre) == _plano(elegido["departamento"]):
            serie_dpto = [
                {
                    "etiqueta": p["etiqueta"],
                    "nuevo_ha": p["nuevo_ha"],
                    "acumulado_ha": p["acumulado_ha"],
                }
                for p in serie
            ]
            break
    mineria = {
        "municipal": (
            {"area_ha": municipal["area_ha"], "poligonos": municipal["poligonos"]}
            if municipal
            else None
        ),
        "departamental": serie_dpto,
        "nacional_acumulado_ha": (
            amw["nacional"][-1]["acumulado_ha"] if amw.get("nacional") else None
        ),
        "en_cobertura": bool(municipal or serie_dpto),
        "cobertura": amw.get("procedencia", {}).get("cobertura"),
        "procedencia": {
            k: amw.get("procedencia", {}).get(k)
            for k in ("fuente", "sensor", "modelo", "commit", "fecha_publicacion", "licencia")
        }
        if amw
        else None,
    }

    # 3. El municipio como entidad del corpus.
    menciones = None
    nombre_plano = elegido["municipio"].strip().lower()
    fila_entidad = bd.consultar(MENCIONES, {"nombre": nombre_plano})
    if fila_entidad:
        e = dict(fila_entidad[0])
        pares_menciones = [
            (fila["doc_id"], int(fila["chunk_id"]))
            for fila in bd.consultar(MENCIONES_REFS, {"nombre": nombre_plano})
        ]
        menciones = {
            "entidad": e["entidad"],
            "documentos": e["n_documentos"],
            "fragmentos": e["n_fragmentos"],
            "refs": refs(pares_menciones),
        }
        pares.extend(pares_menciones)

    # Punto de referencia para las pasadas.
    centro = _centros(str(cfg.geo_dir / "municipios.geojson")).get(divipola)
    territorio = {
        "divipola": divipola,
        "municipio": elegido["municipio"],
        "departamento": elegido["departamento"],
        "divipola_dpto": elegido["divipola_dpto"],
        "centro": [centro[0], centro[1]] if centro else None,
        "area_km2": centro[2] if centro else None,
        "fuente_geometria": "MGN 2018 (DANE), centro de la caja del polígono municipal",
    }

    lista, total = evidencia(pares)
    salida = Salida(
        titulo=f"Orden de observación · {elegido['municipio']} ({elegido['departamento']})",
        datos={
            "territorio": territorio,
            "alertas": alertas,
            "presencia_armada": presencia,
            "mineria_detectada": mineria,
            "menciones": menciones,
            "candidatos": [
                {
                    "divipola": c["divipola"],
                    "municipio": c["municipio"],
                    "departamento": c["departamento"],
                    "alertas": c["alertas"],
                }
                for c in candidatos[:8]
            ],
        },
        evidencia=lista,
        total_evidencia=total,
        nota_metodo=(
            f"Alertas tempranas de la Defensoría con {elegido['municipio']} entre {f.desde} y "
            f"{f.hasta}"
            + (f" y mención de «{f.economia}»" if f.economia else "")
            + ", contadas sobre la tabla alertas; presencia armada de la fila de Amazon "
            "Underworld del municipio, si existe; hectáreas de minería de Amazon Mining Watch "
            "(detecciones sobre Sentinel-2, procedencia declarada en la ficha) o constancia de "
            "que el municipio está fuera de su cobertura; menciones del municipio como entidad "
            "del grafo. Las pasadas satelitales se propagan en el navegador desde los TLE "
            "embebidos (SGP4) sobre el centro del polígono municipal del MGN: son una "
            "predicción orbital, no un dato del corpus, y se rotulan con la edad de sus "
            "elementos."
        ),
    )
    return salida, f, ignorados
