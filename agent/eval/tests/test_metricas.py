"""Aritmética del bloque A (pesos de la rúbrica §2.5.1). Sin juez real: no hace
llamadas de red, por eso vive fuera de ``tests/`` — no está en ``testpaths`` del CI,
que a propósito no instala deepeval/openai. Correr con ``pytest eval/tests``."""

from __future__ import annotations

from eval.metricas import PuntajeCalidad


def _puntaje(**overrides) -> PuntajeCalidad:
    base = dict(
        relevancia=1.0,
        fidelidad=1.0,
        toxicidad=1.0,
        tono=1.0,
        razon_relevancia="",
        razon_fidelidad="",
        razon_toxicidad="",
        razon_tono="",
    )
    base.update(overrides)
    return PuntajeCalidad(**base)


def test_bloque_a_perfecto_da_uno():
    assert _puntaje().bloque_a == 1.0


def test_bloque_a_pondera_segun_la_rubrica():
    # Solo relevancia en cero: baja exactamente su peso (30%).
    p = _puntaje(relevancia=0.0)
    assert abs(p.bloque_a - 0.70) < 1e-9


def test_fidelidad_no_aplica_redistribuye_el_peso():
    # Sin retrieval_context (p.ej. ruta fuera_de_alcance), el resto puntúa a 1.0 y el
    # bloque no debe verse penalizado por un campo que no aplica.
    p = _puntaje(fidelidad=None)
    assert p.bloque_a == 1.0


def test_fidelidad_no_aplica_pero_el_resto_no_es_perfecto():
    p = _puntaje(fidelidad=None, tono=0.5)
    # (relevancia*0.30 + toxicidad*0.15 + tono*0.25) / (0.30+0.15+0.25)
    esperado = (1.0 * 0.30 + 1.0 * 0.15 + 0.5 * 0.25) / 0.70
    assert abs(p.bloque_a - esperado) < 1e-9
