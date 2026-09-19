"""Segunda capa contra prompt injection: clasificador multilingüe en CPU.

Modelo: ``proventra/mdeberta-v3-base-prompt-injection`` (mDeBERTa, licencia MIT, sin
acceso restringido). Medido en el contenedor sobre 20 preguntas legítimas del dominio
(ataques con drones, armas antisatélite, ciberataques...) y 20 ataques en español:
0 falsos positivos, 14/20 ataques detectados, ~27 ms por texto. Junto con el filtro de
patrones de ``guard.py`` cubre los 20 ataques de la batería.

Si el modelo no está disponible, el sistema sigue funcionando solo con los patrones.
"""

from __future__ import annotations

import logging
import threading

log = logging.getLogger(__name__)

MODELO = "proventra/mdeberta-v3-base-prompt-injection"
ETIQUETA_ATAQUE = "INJECTION"


class ClasificadorInyeccion:
    def __init__(self, umbral: float = 0.5, modelo: str = MODELO) -> None:
        self._umbral = umbral
        self._modelo = modelo
        self._pipe = None
        self._fallo = False
        self._lock = threading.Lock()

    def cargar(self) -> None:
        with self._lock:
            if self._pipe is not None or self._fallo:
                return
            try:
                from transformers import pipeline

                self._pipe = pipeline(
                    "text-classification",
                    model=self._modelo,
                    device=-1,
                    truncation=True,
                    max_length=512,
                )
                self._pipe("calentamiento")
                log.info("clasificador de inyección cargado: %s", self._modelo)
            except (OSError, ImportError, RuntimeError, ValueError):
                # Sin el modelo el agente sigue operativo con el filtro de patrones.
                log.exception("no se pudo cargar el clasificador de inyección")
                self._fallo = True

    def es_ataque(self, texto: str) -> bool:
        self.cargar()
        if self._pipe is None:
            return False
        r = self._pipe(texto)[0]
        return r["label"].upper() == ETIQUETA_ATAQUE and float(r["score"]) >= self._umbral
