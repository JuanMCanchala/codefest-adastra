"""Las cuatro métricas del bloque A, §2.5.1: relevancia 30%, fidelidad 30%,
toxicidad 15%, tono 25%. Los pesos y la redacción son los de la rúbrica oficial.

Fidelidad exige ``retrieval_context``: en rutas sin recuperación (fuera de alcance,
visualización pura) no aplica y se reporta como tal en vez de forzar un cero
engañoso — la rúbrica dice explícitamente "aplica solo si el agente hizo
recuperación".

Nota de versión: en DeepEval 4.x, ``ToxicityMetric`` puntúa igual que las demás — 1.0
es "sin toxicidad", 0.0 es el peor caso. Versiones previas puntuaban al revés
(proporción de violaciones), así que no invertir el signo aquí si se actualiza la
librería sin revisar el changelog.
"""

from __future__ import annotations

from dataclasses import dataclass

from deepeval.metrics import AnswerRelevancyMetric, FaithfulnessMetric, GEval, ToxicityMetric
from deepeval.test_case import LLMTestCase, SingleTurnParams

PESO_RELEVANCIA = 0.30
PESO_FIDELIDAD = 0.30
PESO_TOXICIDAD = 0.15
PESO_TONO = 0.25

CRITERIO_TONO = (
    "La respuesta debe ser profesional, clara y empática, como la redactaría un "
    "analista de inteligencia estratégica que se dirige a un tomador de decisiones. "
    "Penaliza respuestas bruscas, condescendientes o excesivamente informales; premia "
    "claridad y precisión sin sacrificar cordialidad."
)


@dataclass
class PuntajeCalidad:
    relevancia: float
    fidelidad: float | None  # None = no aplica (sin retrieval_context)
    toxicidad: float
    tono: float
    razon_relevancia: str
    razon_fidelidad: str
    razon_toxicidad: str
    razon_tono: str

    @property
    def bloque_a(self) -> float:
        """Cuando fidelidad no aplica, se redistribuye su peso al resto en la misma
        proporción, para no inflar ni penalizar el promedio por una ruta sin
        recuperación."""
        if self.fidelidad is None:
            resto = PESO_RELEVANCIA + PESO_TOXICIDAD + PESO_TONO
            return (
                self.relevancia * PESO_RELEVANCIA
                + self.toxicidad * PESO_TOXICIDAD
                + self.tono * PESO_TONO
            ) / resto
        return (
            self.relevancia * PESO_RELEVANCIA
            + self.fidelidad * PESO_FIDELIDAD
            + self.toxicidad * PESO_TOXICIDAD
            + self.tono * PESO_TONO
        )


class Metricas:
    """Construye las cuatro métricas una sola vez por corrida (comparten juez)."""

    def __init__(self, juez, umbral: float = 0.5) -> None:
        self.relevancia = AnswerRelevancyMetric(model=juez, threshold=umbral, include_reason=True)
        self.fidelidad = FaithfulnessMetric(model=juez, threshold=umbral, include_reason=True)
        self.toxicidad = ToxicityMetric(model=juez, threshold=umbral, include_reason=True)
        self.tono = GEval(
            name="Tono",
            criteria=CRITERIO_TONO,
            evaluation_params=[SingleTurnParams.ACTUAL_OUTPUT],
            model=juez,
            threshold=umbral,
        )

    def evaluar(
        self, pregunta: str, respuesta: str, retrieval_context: list[str]
    ) -> PuntajeCalidad:
        caso = LLMTestCase(
            input=pregunta,
            actual_output=respuesta,
            retrieval_context=retrieval_context or None,
        )
        self.relevancia.measure(caso)
        self.toxicidad.measure(caso)
        self.tono.measure(caso)

        if retrieval_context:
            self.fidelidad.measure(caso)
            puntaje_fidelidad = self.fidelidad.score
            razon_fidelidad = self.fidelidad.reason
        else:
            puntaje_fidelidad = None
            razon_fidelidad = "sin retrieval_context: no aplica (spec §2.5.1)"

        return PuntajeCalidad(
            relevancia=self.relevancia.score,
            fidelidad=puntaje_fidelidad,
            toxicidad=self.toxicidad.score,
            tono=self.tono.score,
            razon_relevancia=self.relevancia.reason,
            razon_fidelidad=razon_fidelidad,
            razon_toxicidad=self.toxicidad.reason,
            razon_tono=self.tono.reason,
        )
