"""Pruebas de operación: caché de recuperación y healthcheck."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app import main
from app.cache import RecuperadorConCache, normalizar_consulta
from app.retrieval import Fragmento

FRAG = [Fragmento("F2-ESA-028", "7", "ESA estima 54.000 objetos.", "ESA/b.pdf", 2)]


class RecuperadorContado:
    def __init__(self, listo: bool = True) -> None:
        self.llamadas = 0
        self.listo = listo

    def buscar(self, consulta: str, k: int) -> list[Fragmento]:
        self.llamadas += 1
        return FRAG[:k]

    def cargar(self) -> None:
        pass


def test_cache_evita_repetir_la_busqueda_para_la_misma_consulta_normalizada():
    base = RecuperadorContado()
    rec = RecuperadorConCache(base)
    assert rec.buscar("¿Qué es LEO?", 6) == FRAG
    assert rec.buscar("  ¿qué ES   leo? ", 6) == FRAG
    assert base.llamadas == 1
    assert (rec.aciertos, rec.fallos) == (1, 1)


def test_cache_distingue_k_y_respeta_la_capacidad():
    base = RecuperadorContado()
    rec = RecuperadorConCache(base, capacidad=2)
    rec.buscar("a", 6)
    rec.buscar("a", 3)
    rec.buscar("b", 6)
    rec.buscar("a", 6)  # expulsada por capacidad: vuelve a buscar
    assert base.llamadas == 4


def test_normalizacion():
    assert normalizar_consulta("  Ｈola   MUNDO ") == "hola mundo"


def test_health_devuelve_503_mientras_carga(monkeypatch):
    from app.graph import Sistema
    from app.settings import Settings
    from tests.test_sistema import LLMFalso

    rec = RecuperadorContado(listo=False)
    s = Sistema(LLMFalso({}), rec, Settings(_env_file=None))
    monkeypatch.setattr(main, "_crear_sistema", lambda: (s, rec))
    with TestClient(main.app) as c:
        r = c.get("/health")
        assert r.status_code == 503
        assert r.json()["estado"] == "cargando"
        assert r.json()["clasificador_inyeccion"] == "desactivado"
