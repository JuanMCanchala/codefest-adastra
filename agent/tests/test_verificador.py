"""Verificador determinista de citas (Parte 2, cuarto agente). Sin modelos, sin red."""

from __future__ import annotations

from app.verificador import verificar_citas


def test_citas_dentro_de_rango_quedan_intactas():
    r = verificar_citas("Hubo un incidente [1] y otro más [2].", num_fragmentos=2)
    assert r.texto == "Hubo un incidente [1] y otro más [2]."
    assert r.citas_validas == [1, 2]
    assert r.citas_invalidas == []
    assert r.limpio


def test_cita_fuera_de_rango_se_elimina():
    r = verificar_citas("Un dato inventado [5].", num_fragmentos=2)
    assert "[5]" not in r.texto
    assert r.citas_invalidas == [5]
    assert not r.limpio


def test_respuesta_sin_citas_no_se_toca():
    r = verificar_citas("No encontré evidencia suficiente para responder.", num_fragmentos=3)
    assert r.texto == "No encontré evidencia suficiente para responder."
    assert r.citas_validas == []
    assert r.citas_invalidas == []
    assert r.limpio


def test_cero_fragmentos_invalida_cualquier_cita():
    r = verificar_citas("Según el fragmento [1].", num_fragmentos=0)
    assert "[1]" not in r.texto
    assert r.citas_invalidas == [1]


def test_mezcla_de_citas_validas_e_invalidas():
    r = verificar_citas("Cierto [1], pero esto no [9] y esto sí [2].", num_fragmentos=2)
    assert r.citas_validas == [1, 2]
    assert r.citas_invalidas == [9]
    assert "[9]" not in r.texto
    assert "[1]" in r.texto
    assert "[2]" in r.texto
