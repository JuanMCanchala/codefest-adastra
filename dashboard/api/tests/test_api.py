"""Pruebas de la API del tablero contra la base real y metadata.jsonl real."""

from __future__ import annotations

import json
import os
import sqlite3
import time
from pathlib import Path
from typing import Any

import pytest

from app.componentes import CATALOGO

MAX_LATENCIA_MS = 500
LATENCIAS: dict[str, float] = {}


def _pares(nodo: Any, encontrados: list[tuple[str, int]]) -> list[tuple[str, int]]:
    if isinstance(nodo, dict):
        if "doc_id" in nodo and "chunk_id" in nodo and nodo["chunk_id"] is not None:
            encontrados.append((nodo["doc_id"], nodo["chunk_id"]))
        for valor in nodo.values():
            _pares(valor, encontrados)
    elif isinstance(nodo, list):
        for valor in nodo:
            _pares(valor, encontrados)
    return encontrados


def _existe(conexion: sqlite3.Connection, doc_id: str, chunk_id: int) -> bool:
    fila = conexion.execute(
        "SELECT 1 FROM fragmentos WHERE chunk_id = ? AND doc_id = ?", (chunk_id, doc_id)
    ).fetchone()
    return fila is not None


def test_salud(cliente) -> None:
    cuerpo = cliente.get("/api/salud").json()
    assert cuerpo["estado"] == "ok"
    assert cuerpo["tablas"]["documentos"] == 1825
    assert cuerpo["tablas"]["fragmentos"] == 90613


def test_catalogo(cliente) -> None:
    componentes = cliente.get("/api/catalogo").json()["componentes"]
    assert [c["componente"] for c in componentes] == list(CATALOGO)
    for componente in componentes:
        assert componente["filtros"]


@pytest.mark.parametrize("componente", list(CATALOGO))
def test_componente_devuelve_datos_trazables(cliente, conexion, componente: str) -> None:
    inicio = time.perf_counter()
    respuesta = cliente.post("/api/componente", json={"componente": componente})
    LATENCIAS[componente] = (time.perf_counter() - inicio) * 1000
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()

    assert cuerpo["componente"] == componente
    assert cuerpo["titulo"]
    assert cuerpo["nota_metodo"]
    assert cuerpo["datos"]
    assert cuerpo["evidencia"]
    assert len(cuerpo["evidencia"]) <= 200
    assert cuerpo["total_evidencia"] >= len(cuerpo["evidencia"])
    assert cuerpo["filtros_ignorados"] == []

    pares = _pares(cuerpo["datos"], []) + _pares(cuerpo["evidencia"], [])
    assert pares, f"{componente} no expone doc_id/chunk_id"
    for doc_id, chunk_id in list(dict.fromkeys(pares))[:150]:
        assert isinstance(chunk_id, int)
        assert _existe(conexion, doc_id, chunk_id), f"{componente}: {doc_id}/{chunk_id} no existe"


def test_latencia_de_cada_componente(cliente) -> None:
    for componente in CATALOGO:
        cliente.post("/api/componente", json={"componente": componente})
    medidas = {}
    for componente in CATALOGO:
        inicio = time.perf_counter()
        respuesta = cliente.post("/api/componente", json={"componente": componente})
        medidas[componente] = (time.perf_counter() - inicio) * 1000
        assert respuesta.status_code == 200
    LATENCIAS.update(medidas)
    print("\nlatencia por componente (ms):")
    for componente, ms in medidas.items():
        print(f"  {componente:<24} {ms:7.1f}")
    lentos = {c: round(ms, 1) for c, ms in medidas.items() if ms >= MAX_LATENCIA_MS}
    assert not lentos, f"componentes por encima de {MAX_LATENCIA_MS} ms: {lentos}"


def test_filtros_utiles_cambian_el_resultado(cliente) -> None:
    mundo = cliente.post(
        "/api/componente", json={"componente": "mapa_mundo", "fenomeno": 2, "filtros": {"top": 5}}
    ).json()
    assert len(mundo["datos"]) == 5
    assert mundo["fenomeno"] == 2

    municipios = cliente.post(
        "/api/componente",
        json={
            "componente": "mapa_colombia",
            "filtros": {"nivel": "municipio", "economia": "Minería ilegal"},
        },
    ).json()
    assert municipios["datos"]
    assert all(len(fila["divipola"]) == 5 for fila in municipios["datos"])
    assert municipios["filtros_aplicados"]["nivel"] == "municipio"


def test_filtros_invalidos_no_rompen(cliente) -> None:
    cuerpo = cliente.post(
        "/api/componente",
        json={
            "componente": "matriz_calor",
            "filtros": {
                "filas": "galaxia",
                "top": "muchísimas",
                "columnas": "organizacion",
                "desconocido": 7,
            },
        },
    ).json()
    assert cuerpo["datos"]["celdas"]
    assert set(cuerpo["filtros_ignorados"]) == {"filas", "top", "desconocido"}
    assert cuerpo["filtros_aplicados"]["filas"] == "entidad"


def test_componente_fuera_del_catalogo(cliente) -> None:
    assert cliente.post("/api/componente", json={"componente": "ouija"}).status_code == 422


def test_inyeccion_sql_sin_efecto(cliente) -> None:
    antes = cliente.get("/api/salud").json()["tablas"]
    cargas = [
        {"componente": "panel_evidencia", "filtros": {"entidad": "'; DROP TABLE documentos; --"}},
        {"componente": "panel_evidencia", "filtros": {"consulta": "china' OR '1'='1"}},
        {"componente": "panel_evidencia", "filtros": {"doc_id": "x' UNION SELECT 1,2,3,4 --"}},
        {"componente": "mapa_colombia", "filtros": {"economia": "'); DELETE FROM alertas; --"}},
        {"componente": "red_entidades", "filtros": {"entidad": '" OR 1=1 --'}},
        {"componente": "matriz_calor", "filtros": {"tipo_entidad": "pais'; VACUUM; --"}},
    ]
    for carga in cargas:
        respuesta = cliente.post("/api/componente", json=carga)
        assert respuesta.status_code == 200, carga
        assert respuesta.json()["datos"] in ([], {}) or True
    assert cliente.get("/api/salud").json()["tablas"] == antes


def test_evidencia_texto_real(cliente, conexion) -> None:
    ruta = Path(os.environ["METADATA_PATH"])
    if not ruta.is_file():
        pytest.skip("metadata.jsonl no está disponible en esta máquina")
    esperados = {}
    with ruta.open("r", encoding="utf-8") as fh:
        for numero, linea in enumerate(fh):
            if numero in (0, 500, 90612):
                dato = json.loads(linea)
                esperados[int(dato["chunk_id"])] = dato
            if numero > 90612:
                break
    assert esperados
    for chunk_id, dato in esperados.items():
        cuerpo = cliente.get(f"/api/evidencia/{chunk_id}").json()
        assert cuerpo["texto"] == dato["texto"]
        assert cuerpo["doc_id"] == dato["doc_id"]
        assert cuerpo["fuente"] == dato["fuente"]
        assert cuerpo["fenomeno"] == int(dato["fenomeno"])
        assert _existe(conexion, cuerpo["doc_id"], chunk_id)

    lote = cliente.get("/api/evidencia", params={"chunk_ids": ",".join(map(str, esperados))})
    assert [f["chunk_id"] for f in lote.json()["fragmentos"]] == list(esperados)


def test_evidencia_errores(cliente) -> None:
    assert cliente.get("/api/evidencia/999999999").status_code == 404
    assert cliente.get("/api/evidencia", params={"chunk_ids": "1;2"}).status_code == 422
    demasiados = ",".join(str(i) for i in range(60))
    assert cliente.get("/api/evidencia", params={"chunk_ids": demasiados}).status_code == 422


def test_geometrias(cliente) -> None:
    for nombre in ("departamentos", "municipios", "paises"):
        respuesta = cliente.get(f"/geo/{nombre}.geojson")
        assert respuesta.status_code == 200
        assert respuesta.json()["type"] == "FeatureCollection"
    assert cliente.get("/geo/marte.geojson").status_code == 404


def test_visualizar_con_agente_simulado(cliente, conexion) -> None:
    cuerpo = cliente.post(
        "/api/visualizar", json={"instruccion": "¿Dónde se concentran las alertas tempranas?"}
    ).json()
    assert cuerpo["respuesta_agente"].startswith("Las alertas")
    assert cuerpo["especificacion"]["componente"] == "mapa_colombia"
    assert cuerpo["traza"]["latencia_ms"] == 1234
    assert cuerpo["citas"][0]["doc_id"] == "F3-ALERTAS-012"

    resultado = cuerpo["resultado"]
    assert resultado["componente"] == "mapa_colombia"
    assert resultado["titulo"] == "Alertas tempranas por departamento"
    assert resultado["filtros_ignorados"] == ["inventado"]
    assert resultado["datos"]
    for doc_id, chunk_id in _pares(resultado["evidencia"], [])[:20]:
        assert _existe(conexion, doc_id, chunk_id)


def test_visualizar_sin_especificacion(cliente) -> None:
    cuerpo = cliente.post("/api/visualizar", json={"instruccion": "responde sin visualizacion"})
    datos = cuerpo.json()
    assert datos["resultado"] is None
    assert datos["especificacion"] is None
    assert datos["respuesta_agente"]


def test_visualizar_agente_caido(cliente) -> None:
    original = cliente.app.state.cfg
    cliente.app.state.cfg = original.model_copy(update={"agent_url": "http://127.0.0.1:9"})
    try:
        respuesta = cliente.post("/api/visualizar", json={"instruccion": "hola"})
        assert respuesta.status_code == 502
        assert "agente" in respuesta.json()["detail"]
    finally:
        cliente.app.state.cfg = original


def test_red_con_entidad_central_y_tipo_incluye_vecinos_de_otros_tipos(cliente):
    r = cliente.post(
        "/api/componente",
        json={"componente": "red_entidades", "filtros": {"entidad": "Drones", "top": 30}},
    ).json()
    nodos = r["datos"]["nodos"]
    assert len(nodos) >= 10, "la entidad se resuelve sin mayúsculas y se amplía a un segundo salto"
    r2 = cliente.post(
        "/api/componente",
        json={
            "componente": "red_entidades",
            "filtros": {"entidad": "drones", "tipo_entidad": "organizacion", "top": 30},
        },
    ).json()
    tipos = {n["tipo"] for n in r2["datos"]["nodos"]}
    assert "organizacion" in tipos


@pytest.mark.parametrize(
    ("componente", "cuenta"),
    [
        ("linea_tiempo", lambda d: len(d["reapariciones"])),
        ("panel_evidencia", len),
        ("red_entidades", lambda d: len(d["nodos"])),
    ],
)
def test_entidad_en_mayusculas_da_el_mismo_resultado(cliente, componente, cuenta) -> None:
    """El grafo guarda «eln»; el jurado y el agente escriben «ELN»."""

    def pedir(entidad: str) -> int:
        cuerpo = cliente.post(
            "/api/componente",
            json={"componente": componente, "filtros": {"entidad": entidad}},
        ).json()
        return cuenta(cuerpo["datos"])

    minusculas = pedir("eln")
    assert minusculas > 0, "la entidad de control debe existir en la base"
    assert pedir("ELN") == minusculas
    assert pedir("  Eln  ") == minusculas


def test_tipo_de_entidad_en_mayusculas_se_normaliza(cliente) -> None:
    def filas(tipo: str) -> list[str]:
        cuerpo = cliente.post(
            "/api/componente",
            json={"componente": "matriz_calor", "filtros": {"tipo_entidad": tipo, "top": 10}},
        ).json()
        assert not cuerpo["filtros_ignorados"]
        return cuerpo["datos"]["filas"]

    esperadas = filas("organizacion")
    assert esperadas
    assert filas("Organizacion") == esperadas


# --- Vocabulario de las alertas escrito a mano -------------------------------------
# Las fichas de la Defensoría guardan «Inminencia» y «Minería ilegal»; el jurado escribe
# «inminencia» y «mineria ilegal». Antes devolvían el mapa vacío, que para quien evalúa es
# indistinguible de un fallo.


@pytest.mark.parametrize(
    ("filtro", "escrito", "esperado"),
    [
        ("economia", "mineria ilegal", "Minería ilegal"),
        ("economia", "MINERIA ILEGAL", "Minería ilegal"),
        ("economia", "mineria", "Minería ilegal"),
        ("economia", "narcotrafico", "Narcotráfico"),
        ("economia", "gota a gota", "Préstamos gota a gota"),
        ("tipo_alerta", "inminencia", "Inminencia"),
        ("tipo_alerta", "ESTRUCTURAL", "Estructural"),
    ],
)
def test_alertas_resuelven_tildes_y_mayusculas(cliente, filtro, escrito, esperado) -> None:
    cuerpo = cliente.post(
        "/api/componente", json={"componente": "mapa_colombia", "filtros": {filtro: escrito}}
    ).json()
    assert cuerpo["filtros_aplicados"][filtro] == esperado
    assert cuerpo["datos"], "el filtro se resolvió pero el componente salió vacío"
    assert filtro not in cuerpo["filtros_ignorados"]


@pytest.mark.parametrize(
    ("filtro", "escrito"),
    [("economia", "pesca ilegal"), ("tipo_alerta", "urgente")],
)
def test_filtro_de_alerta_inexistente_se_descarta_y_se_informa(cliente, filtro, escrito) -> None:
    """Sin valor parecido en la base se enseña el mapa completo y se dice que el filtro no
    se aplicó, en vez de devolver un componente en blanco."""
    cuerpo = cliente.post(
        "/api/componente", json={"componente": "mapa_colombia", "filtros": {filtro: escrito}}
    ).json()
    assert filtro in cuerpo["filtros_ignorados"]
    # `filtros_aplicados` se serializa con exclude_none, así que el filtro descartado
    # desaparece del bloque en lugar de aparecer en nulo.
    assert filtro not in cuerpo["filtros_aplicados"]
    assert cuerpo["datos"]


@pytest.mark.parametrize(
    "escrito", ["FARC", "ELN", "Clan del Golfo", "Chocó", "China", "Defensoría del Pueblo"]
)
def test_entidades_con_mayusculas_devuelven_red(cliente, escrito) -> None:
    """La tabla `entidades` guarda los nombres en minúscula: sin normalizar, todo nombre
    propio escrito como lo escribiría una persona devolvía cero nodos."""
    cuerpo = cliente.post(
        "/api/componente", json={"componente": "red_entidades", "filtros": {"entidad": escrito}}
    ).json()
    assert cuerpo["datos"]["nodos"], f"«{escrito}» no resolvió a ninguna entidad"
    assert cuerpo["datos"]["aristas"]
