"""Matriz de calor: cruce de entidades o países con organización, fenómeno o documento.

Los ejes se calculan con dos agregaciones baratas (una por la clave primaria de ``menciones``
y otra agrupando primero por documento) y las celdas solo se piden para las filas y columnas
ya seleccionadas, de modo que el componente responde sin recorrer varias veces las 190.445
menciones.
"""

from __future__ import annotations

import json
from typing import Literal

from pydantic import Field

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from .base import FiltrosBase, Salida, evidencia, normalizar_entidades, refs, resolver_filtros

FILAS = {
    "entidad": """
SELECT m.entidad AS clave, COUNT(*) AS n FROM menciones m
   WHERE (:fenomeno IS NULL
          OR m.doc_id IN (SELECT doc_id FROM documentos WHERE fenomeno = :fenomeno))
     AND (:tipo_entidad IS NULL
          OR m.entidad IN (SELECT entidad FROM entidades WHERE tipo = :tipo_entidad))
 GROUP BY m.entidad ORDER BY n DESC, clave LIMIT :top
""",
    "pais": """
SELECT (SELECT MIN(p.nombre_es) FROM paises p WHERE p.entidad = m.entidad) AS clave,
       COUNT(*) AS n FROM menciones m
   WHERE (:fenomeno IS NULL
          OR m.doc_id IN (SELECT doc_id FROM documentos WHERE fenomeno = :fenomeno))
     AND (:tipo_entidad IS NULL
          OR m.entidad IN (SELECT entidad FROM entidades WHERE tipo = :tipo_entidad))
     AND m.entidad IN (SELECT entidad FROM paises)
 GROUP BY clave ORDER BY n DESC, clave LIMIT :top
""",
}

COLUMNAS = """
WITH por_doc AS (
  SELECT m.doc_id AS doc_id, COUNT(*) AS n FROM menciones m
   WHERE (:tipo_entidad IS NULL
          OR m.entidad IN (SELECT entidad FROM entidades WHERE tipo = :tipo_entidad))
     AND (:filas <> 'pais' OR m.entidad IN (SELECT entidad FROM paises))
   GROUP BY m.doc_id
)
SELECT CASE :columnas WHEN 'organizacion' THEN COALESCE(d.organizacion, 'sin dato')
                      WHEN 'fenomeno' THEN 'F' || d.fenomeno
                      ELSE COALESCE(d.titulo, d.doc_id) END AS clave,
       SUM(p.n) AS n
  FROM por_doc p JOIN documentos d ON d.doc_id = p.doc_id
 WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
 GROUP BY clave ORDER BY n DESC, clave LIMIT :top
"""

_CELDAS_COLA = """
), base AS (
  SELECT fila, columna, doc_id, chunk_id FROM bruto
   WHERE fila IN (SELECT value FROM json_each(:filas_json))
     AND columna IN (SELECT value FROM json_each(:columnas_json))
), numeradas AS (
  SELECT fila, columna, doc_id, chunk_id,
         ROW_NUMBER() OVER (PARTITION BY fila, columna ORDER BY chunk_id) AS rn,
         COUNT(*) OVER (PARTITION BY fila, columna) AS valor
    FROM base
)
SELECT fila, columna, valor, doc_id, chunk_id FROM numeradas WHERE rn <= 20
"""

_CELDAS_CABEZA = """
WITH bruto AS (
  SELECT {fila} AS fila,
         CASE :columnas WHEN 'organizacion' THEN COALESCE(d.organizacion, 'sin dato')
                        WHEN 'fenomeno' THEN 'F' || d.fenomeno
                        ELSE COALESCE(d.titulo, d.doc_id) END AS columna,
         m.doc_id AS doc_id, m.chunk_id AS chunk_id
    FROM menciones m
    JOIN documentos d ON d.doc_id = m.doc_id
   WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
     AND (:tipo_entidad IS NULL
          OR m.entidad IN (SELECT entidad FROM entidades WHERE tipo = :tipo_entidad))
     AND (:filas <> 'pais' OR m.entidad IN (SELECT entidad FROM paises))
"""

CELDAS = {
    "entidad": _CELDAS_CABEZA.replace("{fila}", "m.entidad") + _CELDAS_COLA,
    "pais": _CELDAS_CABEZA.replace(
        "{fila}", "(SELECT MIN(p.nombre_es) FROM paises p WHERE p.entidad = m.entidad)"
    )
    + _CELDAS_COLA,
}


class Filtros(FiltrosBase):
    filas: Literal["entidad", "pais"] = "entidad"
    columnas: Literal["organizacion", "fenomeno", "documento"] = "organizacion"
    tipo_entidad: str | None = None
    fenomeno: int | None = Field(default=None, ge=1, le=3)
    top: int = Field(default=15, ge=10, le=30)


def calcular(bd: BaseDatos, filtros: dict, _textos: IndiceTextos) -> tuple[Salida, Filtros, list]:
    f, ignorados = resolver_filtros(Filtros, filtros)
    f, ignorados = normalizar_entidades(bd, f, ignorados)
    params = f.model_dump()
    filas = [fila["clave"] for fila in bd.consultar(FILAS[f.filas], params) if fila["clave"]]
    # Dos filtros pueden ser válidos por separado e imposibles juntos: pedir países cuyo
    # tipo de entidad sea «organizacion» no deja ni una fila. Antes eso pintaba una matriz
    # vacía; ahora se suelta el tipo, se dice que no se aplicó, y se ve el cruce completo.
    if not filas and f.tipo_entidad:
        f = f.model_copy(update={"tipo_entidad": None})
        ignorados = sorted({*ignorados, "tipo_entidad"})
        params = f.model_dump()
        filas = [fila["clave"] for fila in bd.consultar(FILAS[f.filas], params) if fila["clave"]]
    columnas = [fila["clave"] for fila in bd.consultar(COLUMNAS, params) if fila["clave"]]
    params["filas_json"] = json.dumps(filas, ensure_ascii=False)
    params["columnas_json"] = json.dumps(columnas, ensure_ascii=False)

    celdas: dict[tuple[str, str], dict] = {}
    for fila in bd.consultar(CELDAS[f.filas], params):
        clave = (fila["fila"], fila["columna"])
        celda = celdas.get(clave)
        if celda is None:
            celda = {
                "fila": fila["fila"],
                "columna": fila["columna"],
                "valor": fila["valor"],
                "_pares": [],
            }
            celdas[clave] = celda
        celda["_pares"].append((fila["doc_id"], fila["chunk_id"]))

    pares: list[tuple[str, int]] = []
    salida_celdas = []
    for celda in celdas.values():
        pares.extend(celda["_pares"])
        salida_celdas.append(
            {
                "fila": celda["fila"],
                "columna": celda["columna"],
                "valor": celda["valor"],
                "refs": refs(celda["_pares"]),
            }
        )
    salida_celdas.sort(key=lambda c: (-c["valor"], c["fila"], c["columna"]))
    lista, total = evidencia(pares)
    eje = "países" if f.filas == "pais" else "entidades"
    salida = Salida(
        titulo=f"Menciones de {eje} por {f.columnas}",
        datos={"filas": filas, "columnas": columnas, "celdas": salida_celdas},
        evidencia=lista,
        total_evidencia=total,
        nota_metodo=(
            f"Número de fragmentos en los que cada {f.filas} aparece mencionada, cruzado por "
            f"{f.columnas} del documento; se muestran las {f.top} filas y columnas con más "
            "menciones."
        ),
    )
    return salida, f, ignorados
