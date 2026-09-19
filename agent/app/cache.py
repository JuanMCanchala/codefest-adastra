"""Caché de recuperación por hash de la consulta normalizada.

Envuelve cualquier ``Recuperador`` sin cambiar su interfaz (``buscar(consulta, k)``), así
que se conecta en ``main.py`` sin tocar ``retrieval.py``. Una misma consulta —misma
pregunta del evaluador o la misma reformulación del orquestador— se resuelve en
microsegundos en lugar de ~2 s de encoder + reranker en CPU.

Solo se cachea la recuperación, nunca la respuesta final: cada pregunta se responde con
el modelo y su traza de tokens y latencia refleja lo que realmente ocurrió.
"""

from __future__ import annotations

import hashlib
import threading
import unicodedata
from collections import OrderedDict

from .retrieval import Fragmento, Recuperador


def normalizar_consulta(consulta: str) -> str:
    texto = unicodedata.normalize("NFKC", consulta).casefold()
    return " ".join(texto.split())


class RecuperadorConCache:
    def __init__(self, base: Recuperador, capacidad: int = 512) -> None:
        self._base = base
        self._capacidad = capacidad
        self._cache: OrderedDict[str, list[Fragmento]] = OrderedDict()
        self._lock = threading.Lock()
        self.aciertos = 0
        self.fallos = 0

    @staticmethod
    def _clave(consulta: str, k: int) -> str:
        crudo = f"{k}\x00{normalizar_consulta(consulta)}".encode()
        return hashlib.sha256(crudo).hexdigest()

    def buscar(self, consulta: str, k: int) -> list[Fragmento]:
        clave = self._clave(consulta, k)
        with self._lock:
            if clave in self._cache:
                self._cache.move_to_end(clave)
                self.aciertos += 1
                return list(self._cache[clave])
        fragmentos = self._base.buscar(consulta, k)
        with self._lock:
            self.fallos += 1
            self._cache[clave] = list(fragmentos)
            self._cache.move_to_end(clave)
            while len(self._cache) > self._capacidad:
                self._cache.popitem(last=False)
        return fragmentos

    # Delegación de la carga y el estado al recuperador envuelto.
    def cargar(self) -> None:
        cargar = getattr(self._base, "cargar", None)
        if cargar is not None:
            cargar()

    @property
    def listo(self) -> bool:
        return bool(getattr(self._base, "listo", True))
