"""Distribución de una variable numérica del corpus: la sexta tarea analítica del Anexo B.2.1.

Las otras cinco (comparación, relación, tendencia, composición, espacial) ya tienen
componente. Esta responde a «¿cómo se reparten los valores?»: cuántos documentos son cortos
y cuántos larguísimos, si las alertas se concentran en pocos municipios o se reparten, qué
tan larga es la cola de entidades mencionadas una sola vez. Todo son conteos sobre tablas
existentes (B.2.5): no hay ninguna variable estimada.
"""

from __future__ import annotations

import statistics
from typing import Literal

from pydantic import Field

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from .base import FiltrosBase, Salida, evidencia, refs, resolver_filtros

Variable = Literal[
    "fragmentos_por_documento",
    "entidades_por_documento",
    "paises_por_documento",
    "alertas_por_municipio",
    "menciones_por_entidad",
]

# Cada consulta devuelve un sujeto, su valor y la referencia que lo sustenta.
VALORES: dict[str, str] = {
    "fragmentos_por_documento": """
        SELECT d.doc_id AS sujeto, d.n_fragmentos AS valor, d.doc_id AS doc_id,
               (SELECT MIN(f.chunk_id) FROM fragmentos f WHERE f.doc_id = d.doc_id) AS chunk_id
          FROM documentos d
         WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno) AND d.n_fragmentos > 0
    """,
    "entidades_por_documento": """
        SELECT m.doc_id AS sujeto, COUNT(DISTINCT m.entidad) AS valor, m.doc_id AS doc_id,
               MIN(m.chunk_id) AS chunk_id
          FROM menciones m JOIN documentos d ON d.doc_id = m.doc_id
         WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
         GROUP BY m.doc_id
    """,
    "paises_por_documento": """
        SELECT p.doc_id AS sujeto, COUNT(DISTINCT p.iso3) AS valor, p.doc_id AS doc_id,
               MIN(p.chunk_id) AS chunk_id
          FROM menciones_pais p
         WHERE (:fenomeno IS NULL OR p.fenomeno = :fenomeno)
         GROUP BY p.doc_id
    """,
    "alertas_por_municipio": """
        SELECT a.municipio || ' (' || a.departamento || ')' AS sujeto, COUNT(*) AS valor,
               MIN(a.doc_id) AS doc_id, MIN(a.chunk_id) AS chunk_id
          FROM alertas a JOIN documentos d ON d.doc_id = a.doc_id
         WHERE a.divipola_mpio IS NOT NULL AND (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
         GROUP BY a.divipola_mpio
    """,
    "menciones_por_entidad": """
        SELECT m.entidad AS sujeto, COUNT(*) AS valor, MIN(m.doc_id) AS doc_id,
               MIN(m.chunk_id) AS chunk_id
          FROM menciones m JOIN documentos d ON d.doc_id = m.doc_id
         WHERE (:fenomeno IS NULL OR d.fenomeno = :fenomeno)
         GROUP BY m.entidad
    """,
}

DESCRIPCION: dict[str, tuple[str, str, str]] = {
    # variable → (título, qué es el sujeto, qué mide el valor)
    "fragmentos_por_documento": ("fragmentos por documento", "documentos", "fragmentos"),
    "entidades_por_documento": ("entidades por documento", "documentos", "entidades distintas"),
    "paises_por_documento": ("países por documento", "documentos", "países distintos"),
    "alertas_por_municipio": ("alertas por municipio", "municipios", "alertas tempranas"),
    "menciones_por_entidad": ("menciones por entidad", "entidades", "fragmentos que la mencionan"),
}


class Filtros(FiltrosBase):
    variable: Variable = "fragmentos_por_documento"
    fenomeno: int | None = Field(default=None, ge=1, le=3)
    # Barras del histograma. Pocas esconden la forma; muchas la fragmentan.
    barras: int = Field(default=12, ge=4, le=30)


def _miles(n: int) -> str:
    return f"{n:,}".replace(",", ".")


def _percentil(valores: list[int], p: float) -> int:
    """Percentil por posición, sin interpolar: un valor que existe de verdad en la serie."""
    indice = min(len(valores) - 1, max(0, round(p * (len(valores) - 1))))
    return valores[indice]


def _bordes(valores: list[int], barras: int) -> list[int]:
    """Bordes enteros de las barras. La cola larga se recoge en la última.

    Estas variables son muy asimétricas (la mediana de fragmentos por documento es 17 y el
    máximo 3.000): con anchos iguales hasta el máximo casi todo cae en la primera barra y el
    resto queda vacío. Se recorta el eje en el percentil 99 cuando el máximo se le va lejos, y
    la última barra acumula lo que queda; la etiqueta dice «≥ X» para que no parezca un rango
    normal.
    """
    minimo = valores[0]
    maximo = valores[-1]
    p99 = _percentil(valores, 0.99)
    tope = p99 if maximo > p99 * 1.5 else maximo
    ancho = max(1, -(-(tope - minimo + 1) // barras))  # techo entero
    bordes = [minimo + ancho * i for i in range(barras)]
    return [b for b in bordes if b <= tope] or [minimo]


def calcular(bd: BaseDatos, filtros: dict, _textos: IndiceTextos) -> tuple[Salida, Filtros, list]:
    f, ignorados = resolver_filtros(Filtros, filtros)
    titulo_variable, sujetos, unidad = DESCRIPCION[f.variable]
    filas = bd.consultar(VALORES[f.variable], {"fenomeno": f.fenomeno})
    medidas = sorted(
        (int(fila["valor"]), fila["sujeto"], fila["doc_id"], fila["chunk_id"]) for fila in filas
    )

    if not medidas:
        salida = Salida(
            titulo=f"Distribución de {titulo_variable}",
            datos={
                "variable": f.variable,
                "sujetos": sujetos,
                "unidad": unidad,
                "total": 0,
                "resumen": None,
                "barras": [],
            },
            evidencia=[],
            total_evidencia=0,
            nota_metodo="No hay sujetos con esta variable para el fenómeno pedido.",
        )
        return salida, f, ignorados

    valores = [m[0] for m in medidas]
    bordes = _bordes(valores, f.barras)
    cubos: list[dict] = []
    pares_totales: list[tuple[str, int]] = []
    for i, desde in enumerate(bordes):
        ultimo = i == len(bordes) - 1
        hasta = None if ultimo else bordes[i + 1] - 1
        miembros = [m for m in medidas if m[0] >= desde and (hasta is None or m[0] <= hasta)]
        # La evidencia de la barra: los sujetos con más valor primero, que son los que se
        # quieren comprobar («¿qué documento tiene 3.000 fragmentos?»).
        pares = [(m[2], int(m[3])) for m in reversed(miembros) if m[3] is not None]
        pares_totales.extend(pares[:5])
        if ultimo:
            etiqueta = f"≥ {desde}" if hasta is None and desde < valores[-1] else str(desde)
        elif hasta == desde:
            etiqueta = str(desde)
        else:
            etiqueta = f"{desde}–{hasta}"
        cubos.append(
            {
                "desde": desde,
                "hasta": hasta,
                "etiqueta": etiqueta,
                "cuenta": len(miembros),
                "ejemplos": [m[1] for m in list(reversed(miembros))[:3]],
                "refs": refs(pares),
            }
        )

    resumen = {
        "minimo": valores[0],
        "mediana": int(statistics.median(valores)),
        "media": round(statistics.fmean(valores), 1),
        "maximo": valores[-1],
        "p90": _percentil(valores, 0.90),
    }
    lista, total_evidencia = evidencia(pares_totales, len(medidas))
    recortado = bordes[-1] < valores[-1]
    salida = Salida(
        titulo=f"Distribución de {titulo_variable}",
        datos={
            "variable": f.variable,
            "sujetos": sujetos,
            "unidad": unidad,
            "total": len(medidas),
            "resumen": resumen,
            "barras": cubos,
        },
        evidencia=lista,
        total_evidencia=total_evidencia,
        nota_metodo=(
            f"Histograma de {titulo_variable}: {_miles(len(medidas))} {sujetos} contados sobre "
            f"las tablas de la base, repartidos en {len(cubos)} barras de ancho igual"
            + (
                f"; la última acumula la cola desde {_miles(bordes[-1])} hasta el máximo "
                f"({_miles(valores[-1])}), "
                "recortada en el percentil 99 para que la forma se vea"
                if recortado
                else ""
            )
            + ". Mediana, media y percentiles calculados sobre los mismos conteos; "
            "la evidencia de cada barra apunta a los sujetos de mayor valor."
        ),
    )
    return salida, f, ignorados
