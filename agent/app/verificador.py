"""Verificador determinista de citas — el cuarto agente de la decisión A2.

Comprueba que cada marca ``[n]`` de la respuesta del agente de corpus corresponda a un
fragmento realmente entregado en el contexto, y quita las que quedan fuera de rango
antes de devolver el texto. No llama a ningún modelo: suma un agente al diseño del
sistema (bloque D) sin gastar ninguna interacción (bloque B), y una cita inventada
fuera de rango es justo el tipo de afirmación sin respaldo que penaliza la fidelidad
del bloque A si llega intacta a la respuesta final.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

_MARCA = re.compile(r"\[(\d+)\]")


@dataclass(frozen=True)
class ResultadoVerificacion:
    texto: str
    citas_validas: list[int] = field(default_factory=list)
    citas_invalidas: list[int] = field(default_factory=list)

    @property
    def limpio(self) -> bool:
        return not self.citas_invalidas


def verificar_citas(texto: str, num_fragmentos: int) -> ResultadoVerificacion:
    """``num_fragmentos`` es el tamaño del contexto entregado al agente de corpus:
    las marcas válidas son ``[1]`` a ``[num_fragmentos]``, la misma numeración que usa
    ``AgenteCorpus`` al construir el contexto (ver ``agents.py``)."""
    validas: list[int] = []
    invalidas: list[int] = []

    def _revisar(m: re.Match[str]) -> str:
        n = int(m.group(1))
        if 1 <= n <= num_fragmentos:
            validas.append(n)
            return m.group(0)
        invalidas.append(n)
        return ""

    limpio = _MARCA.sub(_revisar, texto)
    limpio = re.sub(r" {2,}", " ", limpio).strip()
    return ResultadoVerificacion(texto=limpio, citas_validas=validas, citas_invalidas=invalidas)
