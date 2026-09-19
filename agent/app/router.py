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
#
# Los de "corpus" cubren los tres fenómenos a propósito (dos por fenómeno, tomados del
# fraseo real de las preguntas oficiales en agent/eval/datos/preguntas_reto.jsonl). La
# primera versión solo tenía ejemplos de F1 (IA/defensa) y el baseline mostró la
# consecuencia: el router activaba en apenas 4/50 preguntas porque F2 (espacio) y F3
# (dinámicas territoriales) quedaban con similitud baja contra un prototipo que no
# cubría su vocabulario.
_PROTOTIPOS: dict[str, list[str]] = {
    "corpus": [
        # F1 — IA y capacidades estratégicas en defensa
        "¿Cómo están empleando los sistemas no tripulados potenciados por IA para "
        "aumentar la efectividad de las operaciones militares?",
        "¿Qué riesgos representa la escasez de talento especializado en inteligencia "
        "artificial para el desarrollo de capacidades de defensa?",
        # F2 — seguridad del entorno espacial
        "¿Qué capacidades contraespaciales representan actualmente la mayor amenaza "
        "para los sistemas satelitales?",
        "¿Cuál ha sido el impacto de las pruebas antisatélite sobre la generación de "
        "desechos orbitales?",
        # F3 — dinámicas territoriales y amenazas regionales en América Latina
        "¿Cómo utilizan los grupos armados ilegales el control territorial para "
        "sustituir funciones del Estado?",
        "¿De qué manera el narcotráfico financia el fortalecimiento y la expansión "
        "territorial de los grupos armados?",
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
    """Enrutamiento determinista por similitud, con caída al LLM si no hay confianza.

    Umbrales calibrados contra las 50 preguntas oficiales y las 20 fuera de alcance del
    harness (script de calibración descartable, no versionado; cifras en el commit que
    introduce estos valores). Hallazgo clave: la similitud coseno absoluta entre un
    prototipo corto y una pregunta larga con BGE-M3 no discrimina bien por sí sola — las
    50 oficiales caen entre 0,415 y 0,574, y una fuera de alcance mal etiquetada llega a
    0,553, más alto que varias oficiales legítimas. El **margen** contra la segunda ruta
    sí discrimina: las 50 oficiales tienen margen ≥0,060, mientras que las 3 fuera de
    alcance que el router rankeaba mal (top-1 "ambos" en vez de "fuera_de_alcance")
    tenían margen ≤0,028. Por eso el umbral de confianza baja a un piso nominal y el
    margen es el filtro real.
    """

    def __init__(
        self,
        codificador: Codificador,
        umbral_confianza: float = 0.40,
        margen_minimo: float = 0.05,
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
