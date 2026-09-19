"""Memoria conversacional por sesión, opcional y sin llamadas al modelo.

Por qué es opcional
-------------------
La evaluación de ADL manda cada pregunta por separado, sin identificador de sesión
(§2.4: el contrato no tiene ese campo). Si la memoria estuviera siempre activa, la
respuesta a la pregunta 7 podría depender de la 6 y las métricas de calidad dejarían de
medir lo que creen medir. Por eso la memoria **solo existe cuando el cliente manda
``sesion``**: el frontend propio lo manda, la evaluación automática no, y el
comportamiento medido no cambia.

Qué resuelve
------------
El seguimiento con referencia al turno anterior: "¿y en Colombia?", "¿cómo se compara
con eso?". Sin memoria, esa consulta llega sola al índice y no recupera nada útil, porque
el sujeto está en el turno anterior. Aquí se reescribe la consulta de búsqueda
—determinista, sin gastar una interacción— antepo­niendo el tema del turno previo.

Límites deliberados
-------------------
En memoria del proceso, no en disco: si el contenedor se reinicia, las sesiones se
pierden y no pasa nada grave. Acotada en turnos y en número de sesiones, con caducidad,
para que no sea un canal de fuga ni una vía de agotar memoria enviando sesiones nuevas.
"""

from __future__ import annotations

import re
import threading
import time
from collections import OrderedDict, deque
from dataclasses import dataclass

MAX_SESIONES = 500
MAX_TURNOS = 4
TTL_SEGUNDOS = 30 * 60
MAX_CHARS_PREGUNTA = 300

# Una pregunta de seguimiento: corta y encabezada por un conector o un pronombre sin
# antecedente en la propia frase. Se exige que sea breve para no reescribir una pregunta
# nueva y autocontenida que simplemente empiece por "¿Y".
_SEGUIMIENTO = re.compile(
    r"^[¿\s]*(?:y|e|entonces|además|entonces\s+qué|ahora)\b"
    r"|^[¿\s]*(?:cómo|qué|cuál|cuáles|cuánto|cuántos)\s+"
    r"(?:se\s+compara|es\s+eso|son\s+esos|lo\s+anterior|de\s+eso|con\s+eso)\b"
    r"|\b(?:eso|ello|lo\s+anterior|dicho\s+fenómeno|ese\s+caso)\b",
    re.IGNORECASE,
)
_MAX_PALABRAS_SEGUIMIENTO = 12


@dataclass(frozen=True)
class Turno:
    pregunta: str
    ruta: str


def es_seguimiento(pregunta: str) -> bool:
    """¿La pregunta depende del turno anterior para entenderse?"""
    limpia = pregunta.strip()
    if len(limpia.split()) > _MAX_PALABRAS_SEGUIMIENTO:
        return False
    return bool(_SEGUIMIENTO.search(limpia))


class Memoria:
    """Turnos recientes por sesión, acotada y con caducidad. Segura entre hilos."""

    def __init__(
        self,
        max_sesiones: int = MAX_SESIONES,
        max_turnos: int = MAX_TURNOS,
        ttl: float = TTL_SEGUNDOS,
    ) -> None:
        self._max_sesiones = max_sesiones
        self._max_turnos = max_turnos
        self._ttl = ttl
        self._lock = threading.Lock()
        # OrderedDict como LRU: la sesión más vieja se descarta al desbordar.
        self._sesiones: OrderedDict[str, tuple[float, deque[Turno]]] = OrderedDict()

    def _purgar(self, ahora: float) -> None:
        caducadas = [s for s, (t, _) in self._sesiones.items() if ahora - t > self._ttl]
        for s in caducadas:
            del self._sesiones[s]

    def recordar(self, sesion: str, pregunta: str, ruta: str) -> None:
        ahora = time.monotonic()
        with self._lock:
            self._purgar(ahora)
            _, turnos = self._sesiones.get(sesion, (ahora, deque(maxlen=self._max_turnos)))
            turnos.append(Turno(pregunta=pregunta[:MAX_CHARS_PREGUNTA], ruta=ruta))
            self._sesiones[sesion] = (ahora, turnos)
            self._sesiones.move_to_end(sesion)
            while len(self._sesiones) > self._max_sesiones:
                self._sesiones.popitem(last=False)

    def ultimo(self, sesion: str) -> Turno | None:
        ahora = time.monotonic()
        with self._lock:
            self._purgar(ahora)
            entrada = self._sesiones.get(sesion)
            if not entrada or not entrada[1]:
                return None
            return entrada[1][-1]

    def expandir(self, sesion: str | None, pregunta: str) -> tuple[str, str | None]:
        """Devuelve (consulta_para_buscar, motivo). El motivo es None si no se tocó nada.

        Solo reescribe la **consulta de búsqueda**. La pregunta que ve el redactor sigue
        siendo la original, de modo que ``evaluacion.input`` no se altera.
        """
        if not sesion or not es_seguimiento(pregunta):
            return pregunta, None
        previo = self.ultimo(sesion)
        if previo is None:
            return pregunta, None
        return f"{previo.pregunta} {pregunta}", f"seguimiento de: {previo.pregunta[:80]}"
