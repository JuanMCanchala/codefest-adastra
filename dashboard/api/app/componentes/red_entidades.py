"""Red de entidades: co-ocurrencias del grafo de la Etapa 1."""

from __future__ import annotations

import json

from pydantic import Field

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from .base import FiltrosBase, Salida, evidencia, normalizar_entidades, resolver_filtros

MAX_NODOS = 60

ARISTAS = """
SELECT r.origen AS origen, r.destino AS destino, r.relacion AS relacion, r.peso AS peso,
       r.doc_id AS doc_id, r.chunk_id AS chunk_id
  FROM relaciones r
  JOIN documentos d ON d.doc_id = r.doc_id
  JOIN entidades eo ON eo.entidad = r.origen
  JOIN entidades ed ON ed.entidad = r.destino
 WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
   AND COALESCE(r.peso, 0) >= :min_peso
   -- Con entidad central, el tipo filtra solo a sus vecinos (si no, "drones", una
   -- tecnología, quedaría conectada solo a otras tecnologías).
   AND (:tipo_entidad IS NULL
        OR (:entidad IS NULL AND eo.tipo = :tipo_entidad AND ed.tipo = :tipo_entidad)
        OR (:entidad IS NOT NULL AND ((r.origen = :entidad AND ed.tipo = :tipo_entidad)
                                   OR (r.destino = :entidad AND eo.tipo = :tipo_entidad))))
   AND (:entidad IS NULL OR r.origen = :entidad OR r.destino = :entidad)
 ORDER BY r.peso DESC, r.origen, r.destino
 LIMIT :limite
"""

# Segundo salto: relaciones de los vecinos ya elegidos, para que una entidad con pocas
# aristas directas (p. ej. "drones", 16) muestre su contexto. Sigue siendo trazable.
SEGUNDO_SALTO = """
SELECT r.origen AS origen, r.destino AS destino, r.relacion AS relacion, r.peso AS peso,
       r.doc_id AS doc_id, r.chunk_id AS chunk_id
  FROM relaciones r
  JOIN documentos d ON d.doc_id = r.doc_id
 WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
   AND COALESCE(r.peso, 0) >= :min_peso
   AND (r.origen IN (SELECT value FROM json_each(:vecinos))
        OR r.destino IN (SELECT value FROM json_each(:vecinos)))
 ORDER BY r.peso DESC, r.origen, r.destino
 LIMIT :limite
"""

NODOS = """
SELECT e.entidad AS id, e.tipo AS tipo, e.n_fragmentos AS menciones
  FROM entidades e WHERE e.entidad IN (SELECT value FROM json_each(:seleccion))
"""


class Filtros(FiltrosBase):
    entidad: str | None = None
    tipo_entidad: str | None = None
    fenomeno: int | None = Field(default=None, ge=1, le=3)
    top: int = Field(default=40, ge=2, le=MAX_NODOS)
    min_peso: int = Field(default=1, ge=1, le=10_000)


def calcular(bd: BaseDatos, filtros: dict, _textos: IndiceTextos) -> tuple[Salida, Filtros, list]:
    f, ignorados = resolver_filtros(Filtros, filtros)
    f, ignorados = normalizar_entidades(bd, f, ignorados)
    params = {**f.model_dump(), "limite": f.top * 6}

    seleccion: list[str] = []
    if f.entidad:
        seleccion.append(f.entidad)
    aristas: list[dict] = []
    vistas: set[tuple[str, str]] = set()
    filas = list(bd.consultar(ARISTAS, params))
    if f.entidad and len(filas) < f.top:
        vecinos = {n for fila in filas for n in (fila["origen"], fila["destino"])} - {f.entidad}
        filas += bd.consultar(
            SEGUNDO_SALTO,
            {**params, "vecinos": json.dumps(sorted(vecinos), ensure_ascii=False)},
        )
    for fila in filas:
        par = (fila["origen"], fila["destino"])
        if par in vistas:
            continue
        vistas.add(par)
        nuevos = [n for n in (fila["origen"], fila["destino"]) if n not in seleccion]
        if len(seleccion) + len(nuevos) > f.top:
            continue
        seleccion.extend(nuevos)
        aristas.append(
            {
                "origen": fila["origen"],
                "destino": fila["destino"],
                "relacion": fila["relacion"],
                "peso": fila["peso"] or 0,
                "refs": [{"doc_id": fila["doc_id"], "chunk_id": fila["chunk_id"]}],
            }
        )

    nodos = [
        dict(fila)
        for fila in bd.consultar(NODOS, {"seleccion": json.dumps(seleccion, ensure_ascii=False)})
    ]
    nodos.sort(key=lambda n: (-(n["menciones"] or 0), n["id"]))
    lista, total = evidencia((a["refs"][0]["doc_id"], a["refs"][0]["chunk_id"]) for a in aristas)
    centro = f" alrededor de «{f.entidad}»" if f.entidad else ""
    salida = Salida(
        titulo=f"Red de co-ocurrencia de entidades{centro}",
        datos={"nodos": nodos, "aristas": aristas},
        evidencia=lista,
        total_evidencia=total,
        nota_metodo=(
            "Aristas del grafo de entidades de la Etapa 1: el peso es el número de "
            "co-ocurrencias que contó el grafo y las menciones de cada nodo son sus "
            "fragmentos registrados; no hay ninguna ponderación añadida."
        ),
    )
    return salida, f, ignorados
