"""Texto de los fragmentos, leído de ``metadata.jsonl`` sin cargarlo en memoria.

El archivo pesa ~200 MB, así que al primer uso se recorre una sola vez en binario para
anotar el desplazamiento de byte de cada ``chunk_id``; después cada lectura es un
``seek`` a la línea exacta. El índice ocupa unos pocos MB (un entero por fragmento).
"""

from __future__ import annotations

import json
import re
import threading
from pathlib import Path
from typing import Any

MAX_LOTE = 50
CHUNK_ID = re.compile(rb'"chunk_id"\s*:\s*"?(\d+)"?')


class IndiceTextos:
    def __init__(self, ruta: Path) -> None:
        self.ruta = Path(ruta)
        self._offsets: dict[int, int] = {}
        self._lock = threading.Lock()
        self._listo = False

    @property
    def listo(self) -> bool:
        return self._listo

    @property
    def disponible(self) -> bool:
        return self.ruta.exists()

    def construir(self) -> int:
        with self._lock:
            if self._listo:
                return len(self._offsets)
            offsets: dict[int, int] = {}
            with self.ruta.open("rb") as fh:
                posicion = 0
                for linea in fh:
                    encontrado = CHUNK_ID.search(linea, 0, 400) or CHUNK_ID.search(linea)
                    if encontrado is not None:
                        offsets[int(encontrado.group(1))] = posicion
                    posicion += len(linea)
            self._offsets = offsets
            self._listo = True
            return len(offsets)

    def registro(self, chunk_id: int) -> dict[str, Any] | None:
        if not self._listo:
            self.construir()
        posicion = self._offsets.get(chunk_id)
        if posicion is None:
            return None
        with self.ruta.open("rb") as fh:
            fh.seek(posicion)
            linea = fh.readline()
        try:
            dato = json.loads(linea.decode("utf-8", errors="replace"))
        except json.JSONDecodeError:
            return None
        return dato if isinstance(dato, dict) else None

    def texto(self, chunk_id: int) -> str:
        dato = self.registro(chunk_id)
        return str(dato.get("texto", "")) if dato else ""

    def textos(self, chunk_ids: list[int]) -> dict[int, str]:
        return {cid: self.texto(cid) for cid in chunk_ids}
