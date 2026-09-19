"""Descomposición de preguntas compuestas, sin gastar una llamada al modelo.

Por qué existe
--------------
Las 50 preguntas del banco oficial son de un solo salto, así que un planner no cambia
esas cifras. Pero el sistema no se entrega para responder 50 preguntas conocidas: los
expertos escriben las suyas en vivo (§3.4) y en operación llegan preguntas compuestas
("¿qué capacidades antisatélite existen y cómo han evolucionado desde 2007?"). Sin
descomponer, esa pregunta se convierte en una sola consulta al índice, y el reranker
ordena por el promedio de los dos temas: el segundo suele quedarse sin fragmentos.

Qué NO hace
-----------
No llama al modelo. La descomposición es determinista, así que el planner **no suma
interacciones** (30 % del bloque de Eficiencia) ni tokens (40 %): solo suma una búsqueda
por subpregunta, que cuesta décimas de segundo y ningún token.

Tampoco amplía el contexto: ``fragmentos_contexto`` sigue siendo el tope, y los
fragmentos se toman por turnos entre subpreguntas (ver ``intercalar``). Una pregunta
compuesta reparte los mismos 6 huecos entre sus partes en vez de gastarlos todos en la
primera. Esto es la decisión de diseño, no un efecto secundario: cambiar cobertura por
profundidad solo cuando la pregunta tiene varias partes.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from typing import TypeVar

T = TypeVar("T")

# Máximo de subpreguntas. Con más, cada una recibe uno o dos fragmentos y ninguna queda
# sustentada: es peor que no descomponer.
MAX_SUBPREGUNTAS = 3

# Longitud mínima de una parte para considerarla una pregunta por derecho propio. Corta
# los falsos positivos del tipo "¿y eso?" o restos de puntuación.
_MIN_PALABRAS = 4

# Conectores que unen dos interrogantes dentro de una misma frase. Se exige que lo que
# siga tenga verbo interrogativo o un pronombre de pregunta, para no partir enumeraciones
# ("drones y satélites") que son un solo tema.
_CONECTOR = re.compile(
    r"\s*(?:,\s*)?\b(?:y|e|además|asimismo|también)\b\s+"
    r"(?=(?:cómo|como|cuál|cual|cuáles|cuales|qué|que|quién|quien|quiénes|quienes|"
    r"cuándo|cuando|dónde|donde|por\s+qué|porque|cuánto|cuanto|cuántos|cuantos|"
    r"en\s+qué|de\s+qué|a\s+qué|hasta\s+qué)\b)",
    re.IGNORECASE,
)


def _limpiar(texto: str) -> str:
    return texto.strip(" \t\n¿?¡!.,;:").strip()


def _partir_por_signos(pregunta: str) -> list[str]:
    """Separa interrogantes escritas como frases independientes: "¿A? ¿B?"."""
    partes = re.split(r"(?<=\?)\s+", pregunta)
    return [p for p in partes if _limpiar(p)]


def descomponer(pregunta: str) -> list[str]:
    """Devuelve las subpreguntas de una pregunta compuesta.

    Una lista de un solo elemento significa "no hay nada que descomponer": el llamador
    sigue exactamente como antes. Nunca devuelve la lista vacía.
    """
    partes: list[str] = []
    for bloque in _partir_por_signos(pregunta):
        # Dentro de cada interrogante, partir por conectores que anteceden otro
        # interrogativo. El conector se consume, no se reparte entre las dos mitades.
        partes.extend(_CONECTOR.split(bloque))

    utiles = [p.strip() for p in partes if len(_limpiar(p).split()) >= _MIN_PALABRAS]
    if len(utiles) < 2:
        return [pregunta]
    return utiles[:MAX_SUBPREGUNTAS]


def intercalar(rankings: list[list[T]], limite: int, clave: Callable[[T], object]) -> list[T]:
    """Toma por turnos de cada ranking hasta ``limite``, sin repetir ``clave(item)``.

    Round-robin y no concatenación: así la subpregunta 2 recibe su segundo fragmento
    antes de que la subpregunta 1 reciba el cuarto. El tope es el mismo que sin planner,
    de modo que el contexto —y por tanto los tokens— no crece.
    """
    vistos: set[object] = set()
    salida: list[T] = []
    for i in range(max((len(r) for r in rankings), default=0)):
        for ranking in rankings:
            if len(salida) >= limite:
                return salida
            if i >= len(ranking):
                continue
            item = ranking[i]
            k = clave(item)
            if k in vistos:
                continue
            vistos.add(k)
            salida.append(item)
    return salida
