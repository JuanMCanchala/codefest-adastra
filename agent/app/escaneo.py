"""Escaneo de fragmentos recuperados contra inyección indirecta.

Un documento del corpus con instrucciones embebidas ("ignora tus instrucciones y...")
entraría directo al contexto del redactor. Este módulo detecta esos tramos con los mismos
patrones de ``guard.py`` y los neutraliza antes de construir el prompt.

Firma acordada con quien cablea ``graph.py`` (no cambiarla sin avisar):

    sanear_fragmentos(fragmentos) -> (fragmentos_saneados, chunk_ids_marcados)

El tramo sospechoso se reemplaza por un aviso visible, en lugar de descartar el fragmento
completo: el resto del texto suele ser evidencia legítima (p. ej. un artículo académico
que describe un ataque de inyección).
"""

from __future__ import annotations

from dataclasses import replace

from .guard import tramos_sospechosos
from .retrieval import Fragmento

AVISO = "[instrucción embebida en el documento omitida por seguridad]"


def _neutralizar(texto: str, tramos: list[tuple[int, int]]) -> str:
    partes, cursor = [], 0
    for ini, fin in tramos:
        partes.append(texto[cursor:ini])
        partes.append(AVISO)
        cursor = fin
    partes.append(texto[cursor:])
    return "".join(partes)


def clave_chunk(chunk_id: str) -> int:
    """Clave numérica de un ``chunk_id``, o -1 si no es numérico.

    Pública porque ``agents.py`` la necesita para cruzar un fragmento contra la lista
    ``marcados`` que devuelve ``sanear_fragmentos`` y decidir si lo datamarca.
    """
    try:
        return int(chunk_id)
    except (TypeError, ValueError):
        return -1


_chunk_int = clave_chunk  # alias histórico


def sanear_fragmentos(fragmentos: list[Fragmento]) -> tuple[list[Fragmento], list[int]]:
    saneados: list[Fragmento] = []
    marcados: list[int] = []
    for f in fragmentos:
        tramos = tramos_sospechosos(f.texto)
        if not tramos:
            saneados.append(f)
            continue
        saneados.append(replace(f, texto=_neutralizar(f.texto, tramos)))
        marcados.append(_chunk_int(f.chunk_id))
    return saneados, marcados
