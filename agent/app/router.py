"""Enrutamiento por embeddings, sin gastar ninguna llamada al modelo (decisión A2).

Clasifica la pregunta contra prototipos de cada ruta usando el mismo encoder BGE-M3 que
ya está cargado en memoria para la recuperación (ver ``RecuperadorEtapa1.codificar`` en
``retrieval.py``). Si la similitud contra el mejor prototipo queda por debajo del umbral,
o el margen contra el segundo mejor es demasiado estrecho, se abstiene y cae al
orquestador LLM: ese pasa a ser el camino de excepción, no el de siempre.

Mientras el encoder todavía no terminó de cargar (arranque en frío), ``codificar``
devuelve ``None`` y el router se abstiene igual que por baja confianza: nunca falla.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Protocol

# Frases de referencia por ruta, varias por ruta para promediar y no depender de una
# única formulación. Los prototipos y el umbral se afinan con el harness (Parte 1), no
# a ojo: ver agent/eval/.
_PROTOTIPOS: dict[str, list[str]] = {
    "corpus": [
        "¿Qué dicen los informes sobre la inteligencia artificial en la defensa?",
        "¿Cómo ha evolucionado el uso de drones en conflictos recientes?",
        "¿Qué riesgos representa la dependencia de tecnología extranjera?",
        "Explica la relación entre la escasez de talento y las capacidades militares",
        "¿Qué lecciones dejan los conflictos recientes sobre el empleo de IA?",
    ],
    "visualizacion": [
        "Muéstrame en un mapa las alertas tempranas por departamento",
        "Grafica la distribución de documentos por fenómeno",
        "Compara la evolución de las menciones en el tiempo",
        "Visualiza la relación entre entidades del corpus",
    ],
    "ambos": [
        "Explica el fenómeno y muéstrame también su evolución en un gráfico",
        "Analiza las causas y visualiza la tendencia en el tiempo",
        "Resume la situación y grafica su distribución geográfica",
    ],
    "fuera_de_alcance": [
        "¿Cuál es la receta tradicional del ajiaco?",
        "Recomiéndame una película para ver este fin de semana",
        "¿Cómo resuelvo una ecuación cuadrática?",
        "Cuéntame un chiste sobre programadores",
    ],
}


class Codificador(Protocol):
    """Lo que el router necesita del recuperador: vectores densos normalizados, o
    ``None`` mientras el encoder no está listo."""

    def codificar(self, textos: list[str]) -> list[list[float]] | None: ...


@dataclass(frozen=True)
class DecisionRouter:
    ruta: str | None  # None -> sin confianza suficiente, cae al orquestador LLM
    confianza: float
    margen: float


def _coseno(a: list[float], b: list[float]) -> float:
    num = sum(x * y for x, y in zip(a, b, strict=True))
    norma_a = math.sqrt(sum(x * x for x in a))
    norma_b = math.sqrt(sum(y * y for y in b))
    if norma_a == 0.0 or norma_b == 0.0:
        return 0.0
    return num / (norma_a * norma_b)


class RouterEmbeddings:
    """Enrutamiento determinista por similitud, con caída al LLM si no hay confianza."""

    def __init__(
        self,
        codificador: Codificador,
        umbral_confianza: float = 0.55,
        margen_minimo: float = 0.03,
    ) -> None:
        self._cod = codificador
        self.umbral = umbral_confianza
        self.margen_minimo = margen_minimo
        self._prototipos: dict[str, list[list[float]]] | None = None

    def _asegurar_prototipos(self) -> bool:
        if self._prototipos is not None:
            return True
        frases = [frase for grupo in _PROTOTIPOS.values() for frase in grupo]
        vectores = self._cod.codificar(frases)
        if vectores is None:
            return False
        prototipos: dict[str, list[list[float]]] = {}
        i = 0
        for ruta, grupo in _PROTOTIPOS.items():
            prototipos[ruta] = vectores[i : i + len(grupo)]
            i += len(grupo)
        self._prototipos = prototipos
        return True

    def enrutar(self, pregunta: str) -> DecisionRouter:
        if not self._asegurar_prototipos():
            return DecisionRouter(ruta=None, confianza=0.0, margen=0.0)

        vectores = self._cod.codificar([pregunta])
        if not vectores:
            return DecisionRouter(ruta=None, confianza=0.0, margen=0.0)
        consulta = vectores[0]

        promedios = {
            ruta: sum(_coseno(consulta, v) for v in vecs) / len(vecs)
            for ruta, vecs in self._prototipos.items()  # type: ignore[union-attr]
        }
        ordenadas = sorted(promedios.items(), key=lambda kv: kv[1], reverse=True)
        mejor_ruta, mejor_score = ordenadas[0]
        segunda_score = ordenadas[1][1] if len(ordenadas) > 1 else 0.0
        margen = mejor_score - segunda_score

        if mejor_score < self.umbral or margen < self.margen_minimo:
            return DecisionRouter(ruta=None, confianza=mejor_score, margen=margen)
        return DecisionRouter(ruta=mejor_ruta, confianza=mejor_score, margen=margen)


class Enrutador(Protocol):
    """Interfaz que consume ``graph.Sistema``: real (``RouterEmbeddings``) o de prueba."""

    def enrutar(self, pregunta: str) -> DecisionRouter: ...
