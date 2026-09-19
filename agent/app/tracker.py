"""Contabilidad de una petición: llamadas a modelos, tokens, herramientas y contexto.

Alimenta el bloque ``metadata`` y ``evaluacion.tools_called`` / ``retrieval_context``
(§2.4). ``tokens.total`` suma todos los modelos invocados, no solo el orquestador
(requisito obligatorio de §2.4).
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

from .contract import Metadata, Tokens, TokensAgente, ToolCall

MAX_TOOL_OUTPUT_CHARS = 600


@dataclass
class _UsoAgente:
    modelo: str
    input: int = 0
    output: int = 0


@dataclass
class Tracker:
    inicio: float = field(default_factory=time.perf_counter)
    interacciones: int = 0
    agentes: list[str] = field(default_factory=list)
    uso: dict[str, _UsoAgente] = field(default_factory=dict)
    tools: list[ToolCall] = field(default_factory=list)
    contexto: list[str] = field(default_factory=list)

    def agente(self, nombre: str) -> None:
        """Registra que un agente participó, aunque no haya llamado a un modelo."""
        if nombre not in self.agentes:
            self.agentes.append(nombre)

    def llamada_modelo(self, agente: str, modelo: str, tokens_in: int, tokens_out: int) -> None:
        self.agente(agente)
        self.interacciones += 1
        uso = self.uso.setdefault(agente, _UsoAgente(modelo=modelo))
        uso.input += tokens_in
        uso.output += tokens_out

    def herramienta(self, nombre: str, parametros: dict[str, Any], salida: str) -> None:
        if len(salida) > MAX_TOOL_OUTPUT_CHARS:
            salida = salida[:MAX_TOOL_OUTPUT_CHARS] + "…"
        self.tools.append(ToolCall(name=nombre, input_parameters=parametros, output=salida))

    def recuperado(self, fragmentos: list[str]) -> None:
        self.contexto.extend(fragmentos)

    @property
    def tokens_totales(self) -> int:
        return sum(u.input + u.output for u in self.uso.values())

    def metadata(self, estado: str = "ok") -> Metadata:
        por_agente = [
            TokensAgente(
                agente=a, modelo=u.modelo, input=u.input, output=u.output, total=u.input + u.output
            )
            for a, u in self.uso.items()
        ]
        tin = sum(u.input for u in self.uso.values())
        tout = sum(u.output for u in self.uso.values())
        return Metadata(
            num_interacciones=self.interacciones,
            agentes_invocados=list(self.agentes),
            tokens=Tokens(input=tin, output=tout, total=tin + tout),
            tokens_por_agente=por_agente,
            latencia_ms=int((time.perf_counter() - self.inicio) * 1000),
            estado=estado,
        )
