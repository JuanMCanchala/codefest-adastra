"""Runner del harness con dobles: sin red, sin juez real. Correr con
``pytest eval/tests`` (no está en el ``testpaths`` del CI)."""

from __future__ import annotations

from eval.cliente import RespuestaAgente
from eval.corrida import (
    RegistroCalidad,
    _percentil,
    agregar_calidad,
    correr_falsos_positivos,
    correr_seguridad,
)


def _resp(respuesta: str = "ok", **overrides) -> RespuestaAgente:
    base = dict(
        respuesta=respuesta,
        retrieval_context=[],
        tools_called=[],
        num_interacciones=1,
        agentes_invocados=["orquestador"],
        tokens_total=100,
        tokens_input=80,
        tokens_output=20,
        latencia_ms_reportada=500,
        latencia_ms_medida=520,
        estado="ok",
    )
    base.update(overrides)
    return RespuestaAgente(**base)


class ClienteFalso:
    def __init__(self, respuestas: dict[str, RespuestaAgente]) -> None:
        self._respuestas = respuestas

    def preguntar(self, pregunta: str) -> RespuestaAgente:
        return self._respuestas[pregunta]


def test_percentil_p95_de_lista_ordenada():
    valores = [float(i) for i in range(1, 101)]  # 1..100
    assert abs(_percentil(valores, 0.95) - 95.05) < 0.5


def test_percentil_lista_vacia_da_cero():
    assert _percentil([], 0.95) == 0.0


def test_falso_positivo_detecta_rechazo_exacto():
    from app.guard import RECHAZO

    cliente = ClienteFalso({"pregunta legítima": _resp(respuesta=RECHAZO)})
    preguntas = [{"query_id": "fa001", "text": "pregunta legítima"}]
    registros = correr_falsos_positivos(cliente, preguntas)
    assert registros[0].bloqueado is True


def test_falso_positivo_respuesta_normal_no_cuenta():
    cliente = ClienteFalso({"pregunta legítima": _resp(respuesta="Aquí va la respuesta [1].")})
    preguntas = [{"query_id": "fa001", "text": "pregunta legítima"}]
    registros = correr_falsos_positivos(cliente, preguntas)
    assert registros[0].bloqueado is False


def test_ataque_resistido_cuando_no_hay_senal():
    cliente = ClienteFalso({"ataque": _resp(respuesta="No puedo ayudar con eso.")})
    ataques = [
        {
            "query_id": "at001",
            "categoria": "prueba",
            "text": "ataque",
            "senal_compromiso": "COMPROMETIDO",
        }
    ]
    registros = correr_seguridad(cliente, ataques)
    assert registros[0].resistido is True


def test_ataque_no_resistido_cuando_la_senal_aparece():
    cliente = ClienteFalso({"ataque": _resp(respuesta="Aquí está: COMPROMETIDO")})
    ataques = [
        {
            "query_id": "at001",
            "categoria": "prueba",
            "text": "ataque",
            "senal_compromiso": "COMPROMETIDO",
        }
    ]
    registros = correr_seguridad(cliente, ataques)
    assert registros[0].resistido is False


def test_agregar_calidad_promedia_solo_los_validos():
    registros = [
        RegistroCalidad(
            query_id="q1",
            texto="",
            respuesta="",
            estado="ok",
            num_interacciones=2,
            agentes_invocados=[],
            tokens_total=100,
            latencia_ms=500,
            relevancia=1.0,
            fidelidad=1.0,
            toxicidad=1.0,
            tono=1.0,
            bloque_a=1.0,
        ),
        RegistroCalidad(
            query_id="q2",
            texto="",
            respuesta="",
            estado="error_modelo",
            num_interacciones=0,
            agentes_invocados=[],
            tokens_total=0,
            latencia_ms=0,
            error="timeout",
        ),
    ]
    a = agregar_calidad(registros)
    assert a.n == 1
    assert a.relevancia_media == 1.0
    assert a.tokens_totales == 100


def test_agregar_calidad_sin_registros_validos():
    a = agregar_calidad([])
    assert a.n == 0
    assert a.fidelidad_media is None
