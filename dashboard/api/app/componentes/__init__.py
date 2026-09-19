"""Catálogo cerrado de componentes (el mismo de ``agent/app/catalogo.py``) y su despacho.

Cada módulo expone ``Filtros`` (pydantic) y ``calcular(bd, filtros, textos)``. Los filtros
desconocidos o con valores imposibles no rompen la respuesta: se devuelven en
``filtros_ignorados``.
"""

from __future__ import annotations

from types import ModuleType
from typing import Any, Literal, get_args, get_origin

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from . import (
    composicion_corpus,
    cuadrante_priorizacion,
    distribucion,
    linea_tiempo,
    mapa_colombia,
    mapa_mundo,
    matriz_calor,
    panel_evidencia,
    red_entidades,
)

CATALOGO: dict[str, str] = {
    "composicion_corpus": "Barras apiladas: documentos por fenómeno, fuente, formato o idioma.",
    "linea_tiempo": "Evolución de documentos o menciones por periodo; marca reapariciones.",
    "matriz_calor": "Cruce de dos categóricas (entidad × documento, país × fenómeno).",
    "red_entidades": "Grafo de entidades (formal o co-ocurrencia) con vecinos expandibles.",
    "mapa_colombia": "Coropleta por departamento o municipio (alertas tempranas, economías).",
    "mapa_mundo": "Menciones de países por fenómeno sobre un mapa mundial.",
    "cuadrante_priorizacion": "Intensidad (conteo) frente a tendencia (variación del conteo).",
    "panel_evidencia": "Fragmentos originales con doc_id y chunk_id que sustentan un hallazgo.",
    # Accesible desde el selector del tablero. El catálogo del agente (agent/app/catalogo.py)
    # quedó congelado al abrir la evaluación del Reto 1, así que el agente no lo propone.
    "distribucion": "Histograma de una variable contada (fragmentos por documento, alertas "
    "por municipio, menciones por entidad…): la tarea «distribución» del Anexo B.2.1.",
}

MODULOS: dict[str, ModuleType] = {
    "composicion_corpus": composicion_corpus,
    "linea_tiempo": linea_tiempo,
    "matriz_calor": matriz_calor,
    "red_entidades": red_entidades,
    "mapa_colombia": mapa_colombia,
    "mapa_mundo": mapa_mundo,
    "cuadrante_priorizacion": cuadrante_priorizacion,
    "panel_evidencia": panel_evidencia,
    "distribucion": distribucion,
}


def _describir_filtro(campo: Any) -> dict[str, Any]:
    anotacion = campo.annotation
    opciones = None
    if get_origin(anotacion) is Literal:
        opciones = list(get_args(anotacion))
    defecto = campo.get_default(call_default_factory=True)
    return {
        "tipo": str(anotacion).replace("typing.", ""),
        "opciones": opciones,
        "defecto": defecto,
    }


def describir_catalogo() -> list[dict[str, Any]]:
    return [
        {
            "componente": nombre,
            "descripcion": CATALOGO[nombre],
            "filtros": {
                clave: _describir_filtro(campo)
                for clave, campo in MODULOS[nombre].Filtros.model_fields.items()
            },
        }
        for nombre in CATALOGO
    ]


def ejecutar(
    bd: BaseDatos,
    textos: IndiceTextos,
    componente: str,
    fenomeno: int | None = None,
    filtros: dict[str, Any] | None = None,
    titulo: str = "",
) -> dict[str, Any]:
    modulo = MODULOS[componente]
    entrada = dict(filtros or {})
    if fenomeno is not None and "fenomeno" in modulo.Filtros.model_fields:
        entrada.setdefault("fenomeno", fenomeno)
    salida, aplicados, ignorados = modulo.calcular(bd, entrada, textos)
    return {
        "componente": componente,
        "titulo": titulo or salida.titulo,
        "fenomeno": getattr(aplicados, "fenomeno", None) if fenomeno is None else fenomeno,
        "filtros_aplicados": aplicados.model_dump(exclude_none=True),
        "datos": salida.datos,
        "evidencia": salida.evidencia,
        "nota_metodo": salida.nota_metodo,
        "total_evidencia": salida.total_evidencia,
        "filtros_ignorados": ignorados,
    }
