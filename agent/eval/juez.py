"""Juez del harness (decisión B0): un modelo del gateway de ADL, de otra familia que
los generadores de producción.

Los generadores son Qwen3-Next-80B (orquestador y visualización) y Llama 3.3 70B
(corpus). La literatura de LLM-as-judge documenta autopreferencia: un juez tiende a
puntuar mejor las respuestas de su propia familia. Por defecto el juez es
``gemma-3-27b`` (familia Google, ninguna relación con Qwen ni Llama).

Nota verificada contra el gateway: ``gpt-4o``, ``gpt-4o-mini`` y ``claude-3-haiku``
están listados en ``/v1/models`` pero el gateway no tiene configurada la key de esos
proveedores (401 "You didn't provide an API key" / "x-api-key header is required") —
no sirven como juez hasta que ADL los habilite. ``gpt-oss-120b`` sí responde, pero es
un modelo de razonamiento que gasta tokens de "thinking" antes del texto final y
puede devolver contenido vacío si ``max_tokens`` es bajo.
"""

from __future__ import annotations

import os

from deepeval.models.base_model import DeepEvalBaseLLM
from openai import OpenAI

MODELO_POR_DEFECTO = "gemma-3-27b"
MODELO_BARATO = "mixtral-8x7b-instruct"


class JuezGateway(DeepEvalBaseLLM):
    """Cliente OpenAI-compatible apuntado al gateway de ADL (``LLM_BASE_URL``)."""

    def __init__(
        self,
        modelo: str = MODELO_POR_DEFECTO,
        base_url: str | None = None,
        api_key: str | None = None,
    ) -> None:
        self._modelo = modelo
        self._cliente = OpenAI(
            base_url=base_url or os.environ["LLM_BASE_URL"],
            api_key=api_key or os.environ["LLM_API_KEY"],
        )
        super().__init__(model=modelo)

    def load_model(self) -> OpenAI:
        return self._cliente

    def generate(self, prompt: str) -> str:
        resp = self._cliente.chat.completions.create(
            model=self._modelo,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
        )
        return resp.choices[0].message.content or ""

    async def a_generate(self, prompt: str) -> str:
        # Sin cliente async propio: el volumen del harness (100 preguntas) no lo
        # justifica y así se evita duplicar la configuración del cliente.
        return self.generate(prompt)

    def get_model_name(self) -> str:
        return f"gateway:{self._modelo}"
