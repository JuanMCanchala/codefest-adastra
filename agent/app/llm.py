"""Cliente de modelos: Amazon Bedrock (API Converse) con conteo de tokens y tope de gasto.

La autenticación usa la API Key de Bedrock entregada por ADL, que boto3 toma de la
variable de entorno ``AWS_BEARER_TOKEN_BEDROCK``. Cada llamada queda registrada en el
``Tracker`` de la petición con los tokens que reporta Bedrock (no estimados).
"""

from __future__ import annotations

import logging
import threading
from typing import Protocol

from .settings import get_settings
from .tracker import Tracker

log = logging.getLogger(__name__)


class PresupuestoAgotado(RuntimeError):
    """Se alcanzó el tope de tokens configurado para proteger la bolsa de USD 100."""


class ErrorModelo(RuntimeError):
    """El proveedor de modelos falló o devolvió una respuesta vacía."""


class LLM(Protocol):
    def completar(
        self,
        *,
        tracker: Tracker,
        agente: str,
        modelo: str,
        sistema: str,
        mensaje: str,
        max_tokens: int,
        temperatura: float = 0.2,
    ) -> str: ...


class _Presupuesto:
    def __init__(self, tope: int) -> None:
        self._tope = tope
        self._usado = 0
        self._lock = threading.Lock()

    def verificar(self) -> None:
        with self._lock:
            if self._usado >= self._tope:
                raise PresupuestoAgotado("presupuesto de tokens agotado")

    def sumar(self, tokens: int) -> None:
        with self._lock:
            self._usado += tokens

    @property
    def usado(self) -> int:
        return self._usado


class BedrockLLM:
    def __init__(self) -> None:
        import boto3
        from botocore.config import Config

        cfg = get_settings()
        self._cliente = boto3.client(
            "bedrock-runtime",
            region_name=cfg.aws_region,
            config=Config(read_timeout=cfg.llm_timeout_s, retries={"max_attempts": 2}),
        )
        self.presupuesto = _Presupuesto(cfg.presupuesto_tokens)

    def completar(
        self,
        *,
        tracker: Tracker,
        agente: str,
        modelo: str,
        sistema: str,
        mensaje: str,
        max_tokens: int,
        temperatura: float = 0.2,
    ) -> str:
        self.presupuesto.verificar()
        try:
            resp = self._cliente.converse(
                modelId=modelo,
                system=[{"text": sistema}],
                messages=[{"role": "user", "content": [{"text": mensaje}]}],
                inferenceConfig={"maxTokens": max_tokens, "temperature": temperatura},
            )
        except Exception as exc:  # botocore agrupa aquí errores de red, cuota y validación
            log.exception("fallo llamando a Bedrock (%s)", modelo)
            raise ErrorModelo(str(exc)) from exc

        uso = resp.get("usage", {})
        tin, tout = int(uso.get("inputTokens", 0)), int(uso.get("outputTokens", 0))
        tracker.llamada_modelo(agente, modelo, tin, tout)
        self.presupuesto.sumar(tin + tout)

        # Algunos modelos (gpt-oss) devuelven también bloques de razonamiento; solo
        # se usa el texto final.
        bloques = resp.get("output", {}).get("message", {}).get("content", [])
        texto = "".join(b["text"] for b in bloques if "text" in b).strip()
        if not texto:
            raise ErrorModelo(f"respuesta vacía de {modelo}")
        return texto
