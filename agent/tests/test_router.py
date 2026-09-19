"""Router por embeddings (Parte 2, decisión A2): sin GPU, sin BGE-M3 real.

El codificador falso devuelve vectores controlados por la prueba, no embeddings reales,
para poder fijar exactamente la confianza y el margen que ve el router.
"""

from __future__ import annotations

from app import router as router_mod
from app.router import RouterEmbeddings

_GRUPOS = list(router_mod._PROTOTIPOS.items())
_N_GRUPOS = len(_GRUPOS)


class CodificadorFalso:
    """Primera llamada (todas las frases de los prototipos) -> un vector one-hot por
    grupo, en el mismo orden que ``_PROTOTIPOS``. Segunda llamada (la pregunta) -> el
    vector que la prueba haya fijado."""

    def __init__(self, vector_consulta: list[float] | None) -> None:
        self._vector_consulta = vector_consulta
        self.llamadas = 0

    def codificar(self, textos: list[str]) -> list[list[float]] | None:
        self.llamadas += 1
        if len(textos) == 1:
            return [self._vector_consulta] if self._vector_consulta is not None else None
        vectores: list[list[float]] = []
        for i, (_, frases) in enumerate(_GRUPOS):
            base = [0.0] * _N_GRUPOS
            base[i] = 1.0
            vectores.extend([base] * len(frases))
        return vectores


def _indice(ruta: str) -> int:
    return [nombre for nombre, _ in _GRUPOS].index(ruta)


def _one_hot(ruta: str) -> list[float]:
    v = [0.0] * _N_GRUPOS
    v[_indice(ruta)] = 1.0
    return v


def test_alta_confianza_enruta_directo_sin_llm():
    cod = CodificadorFalso(_one_hot("corpus"))
    r = RouterEmbeddings(cod)
    d = r.enrutar("¿Qué dicen los informes sobre X?")
    assert d.ruta == "corpus"
    assert d.confianza == 1.0


def test_confianza_ambigua_cae_al_llm():
    # Empatado entre corpus y visualizacion: margen por debajo del mínimo.
    mezcla = [0.0] * _N_GRUPOS
    mezcla[_indice("corpus")] = 0.71
    mezcla[_indice("visualizacion")] = 0.70
    cod = CodificadorFalso(mezcla)
    r = RouterEmbeddings(cod, umbral_confianza=0.55, margen_minimo=0.03)
    d = r.enrutar("pregunta ambigua")
    assert d.ruta is None


def test_confianza_baja_cae_al_llm():
    mezcla = [0.1] * _N_GRUPOS
    cod = CodificadorFalso(mezcla)
    r = RouterEmbeddings(cod, umbral_confianza=0.55)
    d = r.enrutar("pregunta rara")
    assert d.ruta is None


def test_encoder_no_listo_cae_al_llm_sin_fallar():
    cod = CodificadorFalso(None)
    r = RouterEmbeddings(cod)
    d = r.enrutar("cualquier pregunta")
    assert d.ruta is None
    assert d.confianza == 0.0


def test_prototipos_se_calculan_una_sola_vez():
    cod = CodificadorFalso(_one_hot("visualizacion"))
    r = RouterEmbeddings(cod)
    r.enrutar("primera")
    r.enrutar("segunda")
    # Una llamada para construir los prototipos + una por cada pregunta.
    assert cod.llamadas == 3


def test_ruta_ambos_tambien_es_alcanzable():
    cod = CodificadorFalso(_one_hot("ambos"))
    r = RouterEmbeddings(cod)
    assert r.enrutar("explica y grafica").ruta == "ambos"
