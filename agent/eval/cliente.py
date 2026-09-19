"""Cliente HTTP contra el contrato ``POST /chat`` (spec §2.4).

Se llama por HTTP y no invocando ``Sistema`` en proceso a propósito: el evaluador de
ADL mide al equipo así, y de esta forma el mismo harness sirve igual contra el
agente en local, el servidor offline (fragmentos precalculados de la Etapa 1) y el
endpoint desplegado en Coolify, sin tocar una línea.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

import httpx


@dataclass
class RespuestaAgente:
    respuesta: str
    retrieval_context: list[str]
    tools_called: list[dict[str, Any]]
    num_interacciones: int
    agentes_invocados: list[str]
    tokens_total: int
    tokens_input: int
    tokens_output: int
    latencia_ms_reportada: int
    latencia_ms_medida: int
    estado: str
    crudo: dict[str, Any] = field(default_factory=dict)
    error: str | None = None


class ClienteAgente:
    """Cliente delgado sobre ``POST {endpoint}/chat``."""

    def __init__(self, endpoint: str, timeout_s: float = 90.0) -> None:
        self._base = endpoint.rstrip("/")
        self._cliente = httpx.Client(timeout=timeout_s)

    def preguntar(self, pregunta: str) -> RespuestaAgente:
        inicio = time.perf_counter()
        try:
            resp = self._cliente.post(f"{self._base}/chat", json={"pregunta": pregunta})
            resp.raise_for_status()
            datos = resp.json()
        except (httpx.HTTPError, ValueError) as exc:
            latencia = int((time.perf_counter() - inicio) * 1000)
            return RespuestaAgente(
                respuesta="",
                retrieval_context=[],
                tools_called=[],
                num_interacciones=0,
                agentes_invocados=[],
                tokens_total=0,
                tokens_input=0,
                tokens_output=0,
                latencia_ms_reportada=0,
                latencia_ms_medida=latencia,
                estado="error_cliente",
                error=str(exc),
            )
        latencia_medida = int((time.perf_counter() - inicio) * 1000)

        evaluacion = datos.get("evaluacion", {})
        metadata = datos.get("metadata", {})
        tokens = metadata.get("tokens", {})
        return RespuestaAgente(
            respuesta=datos.get("respuesta", ""),
            retrieval_context=evaluacion.get("retrieval_context", []),
            tools_called=evaluacion.get("tools_called", []),
            num_interacciones=metadata.get("num_interacciones", 0),
            agentes_invocados=metadata.get("agentes_invocados", []),
            tokens_total=tokens.get("total", 0),
            tokens_input=tokens.get("input", 0),
            tokens_output=tokens.get("output", 0),
            latencia_ms_reportada=metadata.get("latencia_ms", 0),
            latencia_ms_medida=latencia_medida,
            estado=metadata.get("estado", "desconocido"),
            crudo=datos,
        )

    def salud(self) -> dict[str, Any]:
        r = self._cliente.get(f"{self._base}/health")
        r.raise_for_status()
        return r.json()

    def cerrar(self) -> None:
        self._cliente.close()

    def __enter__(self) -> ClienteAgente:
        return self

    def __exit__(self, *_exc: object) -> None:
        self.cerrar()
