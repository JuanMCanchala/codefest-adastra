"""Pruebas de la detección de minería ilegal sobre imágenes (ELDOR).

No cargan el checkpoint: el modelo pesa 329 MB y la inferencia es fuera de línea. Lo
que se prueba aquí es lo que puede romperse en silencio — el remapeo de claves del
checkpoint, las agregaciones de área, la trazabilidad y el enrutamiento del agente.
"""

from __future__ import annotations

import json

import pytest

from app.eldor import modelo
from app.eldor.evidencia import Deteccion, agregado, cargar_detecciones
from app.eldor.sitios import CLASES, SITIOS, tile_a_lonlat

# --------------------------------------------------------------------- remapeo


def test_remapeo_traduce_el_arbol_del_encoder():
    viejo = {
        "segformer.encoder.patch_embeddings.0.proj.weight": 1,
        "segformer.encoder.block.2.1.attention.self.query.weight": 2,
        "segformer.encoder.block.0.0.mlp.dense1.bias": 3,
        "segformer.encoder.layer_norm.3.weight": 4,
        "decode_head.linear_c.1.proj.weight": 5,
    }
    nuevo = modelo.remapear_claves(viejo)
    assert set(nuevo) == {
        "segformer.stages.0.patch_embeddings.proj.weight",
        "segformer.stages.2.blocks.1.attention.q_proj.weight",
        "segformer.stages.0.blocks.0.mlp.fc1.bias",
        "segformer.stages.3.layer_norm.weight",
        "decode_head.linear_projections.1.proj.weight",
    }


def test_remapeo_conserva_las_claves_que_no_cambian():
    igual = {"decode_head.classifier.weight": 1, "decode_head.batch_norm.bias": 2}
    assert modelo.remapear_claves(igual) == igual


# ----------------------------------------------------------------------- sitios


def test_conversion_a_hectareas_usa_la_resolucion_del_sitio():
    anel = SITIOS["Anel"]
    # 10.000 m² = 1 ha; a 0,05662 m/px hacen falta (100/0,05662)² px.
    px = round((100 / anel.resolucion_m) ** 2)
    assert anel.hectareas(px) == pytest.approx(1.0, rel=1e-3)


def test_procedencia_trae_la_cadena_espacial_completa():
    p = SITIOS["Anel"].procedencia()
    assert p["crs"] == "EPSG:32719"
    assert p["fecha_captura"] == "2022-04-08"
    assert p["bbox_lon"] == [-69.714044, -69.699976]


def test_tile_a_lonlat_cae_dentro_del_bbox_y_la_latitud_decrece_hacia_el_sur():
    anel = SITIOS["Anel"]
    arriba = tile_a_lonlat(anel, 0, 0, 512)
    abajo = tile_a_lonlat(anel, 0, anel.alto - 512, 512)
    assert anel.lon_min <= arriba["lon"][0] <= anel.lon_max
    # La fila 0 es el borde norte: un tile más al sur tiene menor latitud.
    assert abajo["lat"][1] < arriba["lat"][1]


def test_las_clases_cubren_los_14_ids_del_head_mas_el_fondo():
    assert set(CLASES) == set(range(15))


# -------------------------------------------------------------------- evidencia


def _deteccion(sitio="Anel", **areas) -> Deteccion:
    base = {
        "Bosque primario": 40.0,
        "Suelo desnudo": 30.0,
        "Balsa minera": 2.0,
        "Regeneración natural tipo 1": 8.0,
    }
    base.update(areas)
    return Deteccion(
        sitio=sitio,
        fecha="2022-04-08",
        area_total_ha=sum(base.values()),
        area_por_clase_ha=base,
        procedencia=SITIOS[sitio].procedencia(),
        modelo={"arquitectura": "SegFormer MiT-B2", "checkpoint": "x/best.pt"},
    )


def test_huella_minera_suma_solo_las_clases_de_mineria():
    d = _deteccion()
    # Suelo desnudo (30) + balsa minera (2); no bosque ni regeneración.
    assert d.area_mineria_ha == pytest.approx(32.0)


def test_area_intervenida_es_el_complemento_del_bosque_primario():
    d = _deteccion()
    assert d.area_intervenida_ha == pytest.approx(d.area_total_ha - 40.0)


def test_referencia_incluye_sitio_crs_fecha_y_checkpoint():
    r = _deteccion().referencia()
    assert "ELDOR/Anel" in r and "EPSG:32719" in r and "2022-04-08" in r and "best.pt" in r


def test_resumen_nombra_el_pais_real_de_los_sitios():
    # El jurado pregunta por Colombia; los sitios son peruanos y eso no se puede difuminar.
    assert "Perú" in _deteccion().resumen()


def test_agregado_suma_entre_sitios():
    a, b = _deteccion("Anel"), _deteccion("Linda")
    total = agregado({"Anel": a, "Linda": b})
    assert total["sitios"] == 2
    assert total["area_mineria_ha"] == pytest.approx(64.0)


def test_sin_directorio_no_hay_detecciones(tmp_path):
    assert cargar_detecciones(tmp_path / "no-existe") == {}


def test_carga_lee_un_json_escrito_por_el_precalculo(tmp_path):
    (tmp_path / "Anel.json").write_text(
        json.dumps(
            {
                "procedencia": SITIOS["Anel"].procedencia(),
                "modelo": {"arquitectura": "SegFormer MiT-B2"},
                "cobertura": {
                    "area_total_ha": 100.0,
                    "area_por_clase_ha": {"Bosque primario": 60.0, "Suelo desnudo": 40.0},
                },
                "validacion": {"miou_presentes": 0.31, "exactitud_pixel": 0.66},
            }
        ),
        encoding="utf-8",
    )
    det = cargar_detecciones(tmp_path)
    assert det["Anel"].area_bosque_ha == 60.0
    assert det["Anel"].area_mineria_ha == 40.0
    assert "mIoU 0.310" in det["Anel"].resumen()


def test_un_json_corrupto_no_tumba_la_carga(tmp_path):
    (tmp_path / "roto.json").write_text("{no es json", encoding="utf-8")
    assert cargar_detecciones(tmp_path) == {}


# ------------------------------------------------------------- agente y grafo

from app.agents import AgenteSatelital  # noqa: E402
from app.graph import Sistema  # noqa: E402
from app.retrieval import Fragmento  # noqa: E402
from app.settings import Settings  # noqa: E402
from app.tracker import Tracker  # noqa: E402

CFG = Settings(_env_file=None)


class LLMFalso:
    def __init__(self, guion):
        self.guion, self.llamadas = guion, []

    def completar(self, *, tracker, agente, modelo, sistema, mensaje, max_tokens, temperatura=0.2):
        self.llamadas.append(agente)
        self.ultimo_mensaje = mensaje
        tracker.llamada_modelo(agente, modelo, tokens_in=50, tokens_out=10)
        return self.guion[agente]


class RecuperadorFalso:
    listo = True

    def buscar(self, consulta, k):
        return [Fragmento("F3-CEOBS-008", "c1", "Monitoreo satelital de minería.", "a.pdf", 1)]

    def cargar(self):
        pass


def test_agente_sin_detecciones_no_esta_disponible():
    assert AgenteSatelital(LLMFalso({}), CFG, detecciones={}).disponible is False


def test_agente_filtra_por_el_sitio_nombrado_en_la_pregunta():
    det = {"Anel": _deteccion("Anel"), "Linda": _deteccion("Linda")}
    ag = AgenteSatelital(LLMFalso({"agente_satelital": "ok"}), CFG, detecciones=det)
    ag.responder("¿Cuánta minería hay en Anel?", (t := Tracker()))
    assert t.tools[0].input_parameters["sitios"] == ["Anel"]


def test_agente_sin_sitio_nombrado_usa_todos():
    det = {"Anel": _deteccion("Anel"), "Linda": _deteccion("Linda")}
    ag = AgenteSatelital(LLMFalso({"agente_satelital": "ok"}), CFG, detecciones=det)
    ag.responder("¿Cuánta minería ilegal se detecta?", (t := Tracker()))
    assert t.tools[0].input_parameters["sitios"] == ["Anel", "Linda"]


def test_agente_pone_las_mediciones_en_el_contexto_recuperado():
    """`retrieval_context` no puede ir vacío: contra él se mide la fidelidad (§2.5 A)."""
    ag = AgenteSatelital(
        LLMFalso({"agente_satelital": "ok"}), CFG, detecciones={"Anel": _deteccion()}
    )
    ag.responder("¿Cuánta minería hay?", (t := Tracker()))
    assert len(t.contexto) == 1
    assert "ELDOR/Anel" in t.contexto[0] and "EPSG:32719" in t.contexto[0]


def test_la_ruta_satelital_llega_al_cuarto_agente():
    llm = LLMFalso(
        {
            "orquestador": '{"ruta": "satelital", "fenomeno": 3, "consulta": "minería"}',
            "agente_satelital": "Se midieron 32 ha de huella minera en [Anel].",
        }
    )
    sistema = Sistema(llm, RecuperadorFalso(), CFG)
    sistema.satelital = AgenteSatelital(llm, CFG, detecciones={"Anel": _deteccion()})
    sistema._grafo = sistema._construir()

    r = sistema.responder("¿Cuántas hectáreas de minería ilegal hay en Anel?")
    assert "agente_satelital" in r.metadata.agentes_invocados
    assert r.evaluacion.retrieval_context, "la respuesta debe apoyarse en mediciones citables"
    assert any(t.name == "medir_cobertura_eldor" for t in r.evaluacion.tools_called)


def test_sin_detecciones_la_ruta_satelital_cae_al_corpus():
    """Degradación: en un despliegue sin los JSON el sistema responde igual que antes."""
    llm = LLMFalso(
        {
            "orquestador": '{"ruta": "satelital", "fenomeno": 3, "consulta": "minería"}',
            "agente_corpus": "Según el corpus [1], hay monitoreo satelital.",
        }
    )
    sistema = Sistema(llm, RecuperadorFalso(), CFG)
    sistema.satelital = AgenteSatelital(llm, CFG, detecciones={})
    sistema._grafo = sistema._construir()

    r = sistema.responder("¿Cuántas hectáreas de minería ilegal hay?")
    assert "agente_corpus" in r.metadata.agentes_invocados
    assert "agente_satelital" not in r.metadata.agentes_invocados
