"""Pruebas de la API del tablero contra la base real y metadata.jsonl real."""

from __future__ import annotations

import json
import os
import sqlite3
import time
from pathlib import Path
from typing import Any

import pytest

from app import lectura
from app.componentes import CATALOGO, MODULOS

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
    # Sin CONSOLA_URL no hay enlace a la consola: la interfaz no inventa una dirección.
    assert cuerpo["consola_url"] is None
    assert cuerpo["vista_tecnica"] is False


def test_salud_publica_la_consola_configurada(cliente, monkeypatch) -> None:
    """`CONSOLA_URL` llega al navegador por la salud, sin barra final."""
    cfg = cliente.app.state.cfg
    monkeypatch.setattr(cfg, "consola_url", "https://consola.ejemplo/", raising=False)
    assert cliente.get("/api/salud").json()["consola_url"] == "https://consola.ejemplo"


def test_catalogo(cliente) -> None:
    componentes = cliente.get("/api/catalogo").json()["componentes"]
    assert [c["componente"] for c in componentes] == list(CATALOGO)
    for componente in componentes:
        assert componente["filtros"]


# Estos tres no salen del corpus por defecto, así que no pueden citar `doc_id`/`chunk_id`
# con los filtros de fábrica: `evidencia_satelital` es una medición sobre imagen y cita
# sitio, CRS, ventana del recorte, vuelo y checkpoint; `deforestacion` lee un conjunto
# oficial y cita su identificador, método, periodo y el DIVIPOLA de cada municipio;
# `poblacion_orbital` arranca en `vista=crecimiento`, que cita el catálogo GCAT
# (`jcat`/`satcat`/`cospar`), no el corpus — sus vistas `asat` e `inspectores` sí citan
# fragmentos reales y tienen su propia prueba, tan exigente como la que se salta aquí.
SIN_CORPUS = {"evidencia_satelital", "deforestacion", "poblacion_orbital"}


@pytest.mark.parametrize("componente", [c for c in CATALOGO if c not in SIN_CORPUS])
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


def test_evidencia_satelital_es_trazable_en_el_espacio(cliente) -> None:
    """La medición sobre imagen cita sitio, CRS, ventana y checkpoint, no fragmentos."""
    inicio = time.perf_counter()
    respuesta = cliente.post("/api/componente", json={"componente": "evidencia_satelital"})
    LATENCIAS["evidencia_satelital"] = (time.perf_counter() - inicio) * 1000
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["titulo"]
    assert cuerpo["nota_metodo"]
    assert cuerpo["filtros_ignorados"] == []

    triptico = cuerpo["datos"]["triptico"]
    if triptico is None:
        pytest.skip("no hay trípticos renderizados en este árbol")

    assert triptico["imagen"].startswith("/eldor/")
    assert triptico["crs"] == "EPSG:32719"
    assert len(triptico["recorte_px"]) == 4
    assert triptico["resolucion_m_px"] > 0
    assert triptico["huella_minera_ha"] >= 0
    assert triptico["clases"], "el recorte no declara ninguna clase de cobertura"
    for campo in (triptico["sitio"], triptico["fecha_captura"], triptico["modelo"]):
        assert campo in triptico["procedencia"] or campo


def test_deforestacion_es_trazable_a_su_conjunto(cliente) -> None:
    """La pérdida de bosque cita conjunto, método, periodo y el DIVIPOLA de cada municipio."""
    inicio = time.perf_counter()
    respuesta = cliente.post("/api/componente", json={"componente": "deforestacion"})
    LATENCIAS["deforestacion"] = (time.perf_counter() - inicio) * 1000
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["titulo"]
    assert cuerpo["nota_metodo"]
    assert cuerpo["filtros_ignorados"] == []

    datos = cuerpo["datos"]
    if datos["procedencia"] is None:
        pytest.skip("no hay datos de deforestación en este árbol")

    for clave in ("fuente", "dataset", "metodo", "periodo", "poligonos"):
        assert datos["procedencia"][clave], f"la procedencia no declara «{clave}»"
    assert datos["serie"], "la serie temporal viene vacía"
    assert datos["municipios"], "no hay municipios"
    assert datos["total_ha"] > 0
    for municipio in datos["municipios"]:
        # DIVIPOLA municipal: cinco dígitos, y los dos primeros son el departamento.
        assert municipio["divipola"].isdigit()
        assert len(municipio["divipola"]) == 5
        assert municipio["ha"] > 0
    # Sin filtro de causa, el total es la suma de las causas dentro del rango completo.
    assert sum(c["ha"] for c in datos["causas"]) == pytest.approx(datos["total_ha"], rel=1e-3)


def test_deforestacion_filtra_por_causa(cliente) -> None:
    """Filtrar por «Minería» deja solo su superficie, y nunca más que el total."""
    completo = cliente.post("/api/componente", json={"componente": "deforestacion"}).json()
    if completo["datos"]["procedencia"] is None:
        pytest.skip("no hay datos de deforestación en este árbol")
    minera = cliente.post(
        "/api/componente",
        json={"componente": "deforestacion", "filtros": {"causa": "Minería"}},
    ).json()
    assert minera["filtros_ignorados"] == []
    assert 0 < minera["datos"]["total_ha"] < completo["datos"]["total_ha"]
    assert minera["datos"]["causa"] == "Minería"
    assert "Minería" in minera["titulo"]


def test_deforestacion_ignora_una_causa_que_no_existe(cliente) -> None:
    """Una causa inventada se descarta y se avisa, en vez de devolver el lienzo vacío."""
    respuesta = cliente.post(
        "/api/componente",
        json={"componente": "deforestacion", "filtros": {"causa": "Marcianos"}},
    )
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    if cuerpo["datos"]["procedencia"] is None:
        pytest.skip("no hay datos de deforestación en este árbol")
    assert cuerpo["filtros_ignorados"] == ["causa"]
    assert cuerpo["datos"]["municipios"]


def test_poblacion_orbital_es_trazable_a_gcat(cliente) -> None:
    """La vista por defecto cita el catálogo GCAT: fuente, licencia y fecha reales."""
    inicio = time.perf_counter()
    respuesta = cliente.post("/api/componente", json={"componente": "poblacion_orbital"})
    LATENCIAS["poblacion_orbital"] = (time.perf_counter() - inicio) * 1000
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["titulo"]
    assert cuerpo["nota_metodo"]
    assert cuerpo["filtros_ignorados"] == []

    datos = cuerpo["datos"]
    if datos["procedencia"] is None:
        pytest.skip("no hay datos de población orbital en este árbol")
    for clave in ("fuente", "url", "licencia", "actualizado"):
        assert datos["procedencia"][clave], f"la procedencia no declara «{clave}»"
    assert datos["serie"], "la serie de lanzamientos viene vacía"
    assert datos["en_orbita_por_regimen"], "el desglose por régimen viene vacío"
    assert datos["total_en_orbita"] > 0


def test_asat_cita_fragmentos_reales(cliente, conexion) -> None:
    """La vista `asat` cita fragmentos reales del corpus para los ensayos que lo tienen."""
    respuesta = cliente.post(
        "/api/componente", json={"componente": "poblacion_orbital", "filtros": {"vista": "asat"}}
    )
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    if cuerpo["datos"]["procedencia"] is None:
        pytest.skip("no hay datos de población orbital en este árbol")

    pares = _pares(cuerpo["datos"], []) + _pares(cuerpo["evidencia"], [])
    assert pares, "la vista asat no citó ningún fragmento del corpus"
    for doc_id, chunk_id in list(dict.fromkeys(pares)):
        assert isinstance(chunk_id, int)
        assert _existe(conexion, doc_id, chunk_id), f"asat: {doc_id}/{chunk_id} no existe"


def test_asat_fengyun_domina_en_orbita(cliente) -> None:
    """Feng Yun 1C es, con mucho, el ensayo con más desechos que siguen en órbita."""
    respuesta = cliente.post(
        "/api/componente", json={"componente": "poblacion_orbital", "filtros": {"vista": "asat"}}
    )
    cuerpo = respuesta.json()
    if cuerpo["datos"]["procedencia"] is None:
        pytest.skip("no hay datos de población orbital en este árbol")
    ensayos = cuerpo["datos"]["asat"]
    assert ensayos, "la vista asat no trajo ensayos"
    primero = ensayos[0]
    assert "fengyun" in primero["nombre"].lower().replace(" ", "")
    assert primero["en_orbita"] == max(e["en_orbita"] for e in ensayos)


def test_pais_desconocido_se_ignora(cliente) -> None:
    """Un país inventado se descarta y se avisa, en vez de devolver el lienzo vacío."""
    respuesta = cliente.post(
        "/api/componente",
        json={"componente": "poblacion_orbital", "filtros": {"pais": "MARCIANOS"}},
    )
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    if cuerpo["datos"]["procedencia"] is None:
        pytest.skip("no hay datos de población orbital en este árbol")
    assert cuerpo["filtros_ignorados"] == ["pais"]
    assert cuerpo["datos"]["serie"], "el filtro descartado no debería dejar la serie vacía"


def test_nota_de_crecimiento_se_lee_como_una_frase(cliente) -> None:
    """La nota separa con comas: el punto de los miles no se le come a la prosa."""
    respuesta = cliente.post("/api/componente", json={"componente": "poblacion_orbital"})
    cuerpo = respuesta.json()
    if cuerpo["datos"]["procedencia"] is None:
        pytest.skip("no hay datos de población orbital en este árbol")
    nota = cuerpo["nota_metodo"]
    assert "CC BY 4.0, actualizado" in nota, f"la nota perdió sus comas: {nota}"
    assert "carga útil, etapa, componente, desecho" in nota
    filas = cuerpo["datos"]["procedencia"]["filas"]
    assert f"{filas:,}".replace(",", ".") in nota, "el separador de miles no es el español"


def test_en_orbita_declara_que_no_lo_filtra_el_pais(cliente) -> None:
    """Con un país aplicado, la cifra global sigue siendo global y la nota lo dice.

    `en_orbita_por_regimen` se precalcula sin dimensión de país, así que no se puede
    recortar. Lo que sí se puede es no dejar que se lea como el total de ese país.
    """
    sin_filtro = cliente.post("/api/componente", json={"componente": "poblacion_orbital"}).json()
    if sin_filtro["datos"]["procedencia"] is None:
        pytest.skip("no hay datos de población orbital en este árbol")
    respuesta = cliente.post(
        "/api/componente",
        json={"componente": "poblacion_orbital", "filtros": {"pais": "US"}},
    )
    cuerpo = respuesta.json()
    assert cuerpo["filtros_ignorados"] == []
    datos = cuerpo["datos"]
    assert datos["pais_aplicado"] is True
    assert datos["total_lanzados"] < sin_filtro["datos"]["total_lanzados"], "el país no filtró"
    assert datos["total_en_orbita"] == sin_filtro["datos"]["total_en_orbita"]
    assert "catálogo entero" in cuerpo["nota_metodo"]


def test_un_pais_no_filtrable_no_se_da_por_aplicado(cliente) -> None:
    """`serie` agrupa la cola de países en OTROS: CO no es filtrable y se avisa."""
    respuesta = cliente.post(
        "/api/componente",
        json={"componente": "poblacion_orbital", "filtros": {"pais": "CO"}},
    )
    cuerpo = respuesta.json()
    if cuerpo["datos"]["procedencia"] is None:
        pytest.skip("no hay datos de población orbital en este árbol")
    assert cuerpo["filtros_ignorados"] == ["pais"]
    assert cuerpo["datos"]["pais_aplicado"] is False


def test_asat_dice_cuantos_ensayos_deja_fuera(cliente) -> None:
    """El `top` por defecto recorta la lista: el total sin recortar viaja con ella."""
    respuesta = cliente.post(
        "/api/componente", json={"componente": "poblacion_orbital", "filtros": {"vista": "asat"}}
    )
    cuerpo = respuesta.json()
    if cuerpo["datos"]["procedencia"] is None:
        pytest.skip("no hay datos de población orbital en este árbol")
    datos = cuerpo["datos"]
    assert datos["asat_totales"] > len(datos["asat"]), "este caso deja de probar el recorte"
    assert f"de los {datos['asat_totales']}" in cuerpo["nota_metodo"]

    completo = cliente.post(
        "/api/componente",
        json={"componente": "poblacion_orbital", "filtros": {"vista": "asat", "top": 26}},
    ).json()
    assert len(completo["datos"]["asat"]) == completo["datos"]["asat_totales"]


def test_colombia_tiene_tres_objetos(cliente) -> None:
    """GCAT solo atribuye tres objetos a Colombia: Libertad-1, FACSAT y FACSAT-2."""
    respuesta = cliente.post(
        "/api/componente",
        json={"componente": "poblacion_orbital", "filtros": {"vista": "colombia"}},
    )
    cuerpo = respuesta.json()
    if cuerpo["datos"]["procedencia"] is None:
        pytest.skip("no hay datos de población orbital en este árbol")
    assert len(cuerpo["datos"]["colombia"]) == 3
    assert cuerpo["filtros_ignorados"] == []


def test_inspectores_citan_fragmentos_reales(cliente, conexion) -> None:
    """La vista `inspectores` cita fragmentos reales para las entradas con alias en el corpus."""
    respuesta = cliente.post(
        "/api/componente",
        json={"componente": "poblacion_orbital", "filtros": {"vista": "inspectores"}},
    )
    cuerpo = respuesta.json()
    if cuerpo["datos"]["procedencia"] is None:
        pytest.skip("no hay datos de población orbital en este árbol")

    pares = _pares(cuerpo["datos"], []) + _pares(cuerpo["evidencia"], [])
    assert pares, "la vista inspectores no citó ningún fragmento del corpus"
    for doc_id, chunk_id in list(dict.fromkeys(pares)):
        assert isinstance(chunk_id, int)
        assert _existe(conexion, doc_id, chunk_id), f"inspectores: {doc_id}/{chunk_id} no existe"


def test_inspectores_es_lista_curada(cliente) -> None:
    """Cada entrada de la lista curada declara la referencia pública que la justifica."""
    respuesta = cliente.post(
        "/api/componente",
        json={"componente": "poblacion_orbital", "filtros": {"vista": "inspectores"}},
    )
    cuerpo = respuesta.json()
    if cuerpo["datos"]["procedencia"] is None:
        pytest.skip("no hay datos de población orbital en este árbol")
    entradas = cuerpo["datos"]["inspectores"]
    assert entradas, "la vista inspectores no trajo entradas"
    for entrada in entradas:
        assert entrada["referencia"], f"{entrada['nombre']} no declara referencia"


def _triptico(cliente) -> dict[str, Any] | None:
    respuesta = cliente.post("/api/componente", json={"componente": "evidencia_satelital"})
    assert respuesta.status_code == 200
    return respuesta.json()["datos"]["triptico"]


def test_el_veredicto_de_mineria_lo_decide_la_medicion(cliente) -> None:
    """El veredicto sale de sumar las clases mineras, no de un modelo de lenguaje."""
    t = _triptico(cliente)
    if t is None:
        pytest.skip("no hay trípticos renderizados en este árbol")
    v = t["veredicto"]
    esperado = sum(c["porcentaje"] for c in t["clases"] if c["minera"])
    assert v["porcentaje_minero"] == pytest.approx(esperado, abs=0.01)
    assert v["hay_mineria"] is (v["porcentaje_minero"] >= v["umbral_pct"])
    assert v["etiqueta"]
    # El umbral se enseña: un veredicto con el listón escondido no es comprobable.
    assert v["umbral_pct"] > 0
    assert set(v["clases_mineras"]) == {c["clase"] for c in t["clases"] if c["minera"]}


def test_sin_modelo_configurado_el_triptico_sigue_entero(cliente) -> None:
    """Sin `LLM_API_KEY` el resumen se niega limpio y el componente no se entera."""
    respuesta = cliente.post("/api/interpretar", json={"sitio": "Anel"})
    assert respuesta.status_code == 503
    t = _triptico(cliente)
    if t is None:
        pytest.skip("no hay trípticos renderizados en este árbol")
    assert t["veredicto"]["etiqueta"], "el veredicto medido no depende del modelo"
    assert t["clases"], "las cifras que lo sostienen tampoco"


def test_el_resumen_solo_ve_cifras_y_se_guarda(cliente, gateway_falso) -> None:
    """El aviso le prohíbe describir la imagen, y el mismo recorte no se pide dos veces."""
    url, peticiones = gateway_falso
    if _triptico(cliente) is None:
        pytest.skip("no hay trípticos renderizados en este árbol")
    previo = cliente.app.state.cfg
    cliente.app.state.cfg = previo.model_copy(
        update={"llm_base_url": url, "llm_api_key": "sk-de-prueba"}
    )
    lectura._cache.clear()
    try:
        respuesta = cliente.post("/api/interpretar", json={"sitio": "Anel"})
        assert respuesta.status_code == 200
        cuerpo = respuesta.json()
        assert cuerpo["lectura"]
        assert cuerpo["veredicto"]["etiqueta"]
        etiquetas = [c["etiqueta"] for c in cuerpo["cifras"]]
        assert "Huella minera" in etiquetas, "el resumen no viaja con las cifras que lo sostienen"
        assert any(e.startswith("Clase ") for e in etiquetas)

        assert len(peticiones) == 1
        mensajes = peticiones[0]["messages"]
        sistema = mensajes[0]["content"]
        assert "NO ESTÁS VIENDO NINGUNA IMAGEN" in sistema
        assert "legalidad" in sistema, "el aviso no le prohíbe pronunciarse sobre legalidad"
        usuario = mensajes[1]["content"]
        assert "VEREDICTO YA CALCULADO" in usuario, "el modelo no recibe el veredicto hecho"
        assert "Suelo desnudo" in usuario, "el modelo no recibe el reparto por clases"

        # El mismo recorte no gasta dos llamadas: no hay pregunta del usuario que lo cambie.
        assert cliente.post("/api/interpretar", json={"sitio": "Anel"}).status_code == 200
        assert len(peticiones) == 1
    finally:
        cliente.app.state.cfg = previo
        lectura._cache.clear()


def test_evidencia_satelital_ignora_un_sitio_que_no_existe(cliente) -> None:
    """Un sitio sin renderizar se informa y se cae al primero, en vez de salir en blanco."""
    respuesta = cliente.post(
        "/api/componente",
        json={"componente": "evidencia_satelital", "filtros": {"sitio": "NoExiste"}},
    )
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    if cuerpo["datos"]["triptico"] is None:
        pytest.skip("no hay trípticos renderizados en este árbol")
    assert cuerpo["filtros_ignorados"] == ["sitio"]
    assert cuerpo["datos"]["triptico"]["sitio"] in cuerpo["datos"]["sitios"]


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
        cuerpo = respuesta.json()
        # La carga va como parámetro ligado, no concatenada: SQLite la trata como un valor
        # que no existe, así que el filtro se descarta y se informa. La respuesta sigue
        # bien formada, con datos del corpus sin ese filtro, y nunca es un error.
        assert "datos" in cuerpo, carga
        (clave,) = carga["filtros"].keys()
        assert clave in cuerpo["filtros_ignorados"], carga
    # Y la base queda intacta: ninguna carga borró, vació ni alteró una tabla.
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


def _un_fragmento_real(cliente) -> dict[str, Any]:
    """Un fragmento cualquiera del corpus, con su `fuente` tal y como está en metadata."""
    if not cliente.app.state.textos.disponible:
        pytest.skip("metadata.jsonl no está disponible en esta máquina")
    cuerpo = cliente.post(
        "/api/componente",
        json={"componente": "panel_evidencia", "fenomeno": 3, "filtros": {"limite": 1}},
    ).json()
    chunk_id = cuerpo["evidencia"][0]["chunk_id"]
    fragmento = cliente.get(f"/api/evidencia/{chunk_id}").json()
    if not fragmento["fuente"] or Path(fragmento["fuente"]).is_absolute():
        pytest.skip("el fragmento no registra una ruta relativa de archivo fuente")
    return fragmento


def test_documento_sin_corpus_montado(cliente) -> None:
    """Sin `CORPUS_DIR` la salud lo dice y el endpoint no promete un archivo que no tiene."""
    assert cliente.get("/api/salud").json()["corpus_disponible"] is False
    fragmento = _un_fragmento_real(cliente)
    respuesta = cliente.get(f"/api/documento/{fragmento['chunk_id']}")
    assert respuesta.status_code == 404
    assert "no publica el corpus" in respuesta.json()["detail"]


def test_documento_sirve_el_archivo_original(cliente, monkeypatch, tmp_path: Path) -> None:
    fragmento = _un_fragmento_real(cliente)
    archivo = tmp_path / fragmento["fuente"]
    archivo.parent.mkdir(parents=True, exist_ok=True)
    archivo.write_bytes(b"%PDF-1.4 prueba")
    monkeypatch.setattr(cliente.app.state.cfg, "corpus_dir", tmp_path, raising=False)

    assert cliente.get("/api/salud").json()["corpus_disponible"] is True
    respuesta = cliente.get(f"/api/documento/{fragmento['chunk_id']}")
    assert respuesta.status_code == 200
    assert respuesta.content == b"%PDF-1.4 prueba"
    # `inline`: el navegador lo abre en la pestaña en vez de descargarlo a ciegas.
    assert respuesta.headers["content-disposition"].startswith("inline")

    # El corpus montado pero sin ese archivo concreto: 404 con la ruta, no un 500.
    archivo.unlink()
    respuesta = cliente.get(f"/api/documento/{fragmento['chunk_id']}")
    assert respuesta.status_code == 404
    assert fragmento["fuente"] in respuesta.json()["detail"]

    assert cliente.get("/api/documento/999999999").status_code == 404


def test_documento_no_sale_de_la_raiz_del_corpus(cliente, monkeypatch, tmp_path: Path) -> None:
    """Una `fuente` con `..` en metadata.jsonl no puede servir un archivo de fuera del corpus."""
    from app import main as modulo

    raiz = tmp_path / "corpus"
    raiz.mkdir()
    secreto = tmp_path / "secreto.txt"
    secreto.write_text("fuera del corpus", encoding="utf-8")
    monkeypatch.setattr(cliente.app.state.cfg, "corpus_dir", raiz, raising=False)
    monkeypatch.setattr(
        modulo,
        "_fragmento",
        lambda *_args, **_kwargs: {"chunk_id": 1, "doc_id": "X", "fuente": "../secreto.txt"},
    )
    respuesta = cliente.get("/api/documento/1")
    assert respuesta.status_code == 404
    assert "fuera del corpus" not in respuesta.text


@pytest.mark.parametrize("componente", list(CATALOGO))
def test_filtro_en_blanco_no_es_un_filtro(cliente, componente: str) -> None:
    """`entidad: ""` debe dar lo mismo que no mandar `entidad`: 160 combinaciones hostiles
    contra la API encontraron que la cadena en blanco llegaba cruda al SQL y filtraba por
    una entidad llamada «», dejando la red sin un solo nodo."""
    sin = cliente.post("/api/componente", json={"componente": componente, "filtros": {}})
    assert sin.status_code == 200, componente
    for blanco in ("", "   "):
        con = cliente.post(
            "/api/componente",
            json={"componente": componente, "filtros": {"entidad": blanco}},
        )
        assert con.status_code == 200, (componente, blanco)
        cuerpo = con.json()
        assert "entidad" not in cuerpo["filtros_aplicados"], (componente, blanco)
        if "entidad" in MODULOS[componente].Filtros.model_fields:
            # Ni se aplica ni se declara descartado: nadie pidió un valor que descartar.
            assert "entidad" not in cuerpo["filtros_ignorados"], (componente, blanco)
        else:
            # Donde el componente no admite `entidad`, la clave se informa como desconocida.
            assert "entidad" in cuerpo["filtros_ignorados"], (componente, blanco)
        assert cuerpo["datos"] == sin.json()["datos"], (componente, blanco)


def test_distribucion_es_un_histograma_trazable(cliente, conexion) -> None:
    """Las barras suman el total, la cola se recoge en la última y cada barra trae refs reales."""
    cuerpo = cliente.post(
        "/api/componente",
        json={"componente": "distribucion", "filtros": {"variable": "fragmentos_por_documento"}},
    ).json()
    datos = cuerpo["datos"]
    assert datos["total"] == sum(b["cuenta"] for b in datos["barras"])
    assert (
        datos["total"]
        == conexion.execute("SELECT COUNT(*) FROM documentos WHERE n_fragmentos > 0").fetchone()[0]
    )
    assert datos["resumen"]["minimo"] <= datos["resumen"]["mediana"] <= datos["resumen"]["maximo"]
    ultima = datos["barras"][-1]
    assert ultima["hasta"] is None and ultima["etiqueta"].startswith("≥")
    assert datos["resumen"]["maximo"] >= ultima["desde"]
    # La evidencia de la cola apunta al documento más largo, y ese par existe de verdad.
    doc_id, chunk_id = ultima["refs"][0]["doc_id"], ultima["refs"][0]["chunk_id"]
    assert _existe(conexion, doc_id, chunk_id)
    assert (
        conexion.execute(
            "SELECT n_fragmentos FROM documentos WHERE doc_id = ?", (doc_id,)
        ).fetchone()[0]
        == datos["resumen"]["maximo"]
    )

    # Alertas por municipio solo existen en F3: en F1 el componente lo dice, no inventa.
    vacio = cliente.post(
        "/api/componente",
        json={
            "componente": "distribucion",
            "fenomeno": 1,
            "filtros": {"variable": "alertas_por_municipio"},
        },
    ).json()
    assert vacio["datos"]["total"] == 0 and vacio["datos"]["barras"] == []
    assert "No hay sujetos" in vacio["nota_metodo"]

    # Una variable inventada por quien pregunta se descarta y se informa; no rompe.
    raro = cliente.post(
        "/api/componente", json={"componente": "distribucion", "filtros": {"variable": "riesgo"}}
    )
    assert raro.status_code == 200 and "variable" in raro.json()["filtros_ignorados"]


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


def _un_chunk(cliente) -> int:
    """Un chunk_id real, tomado del propio panel para no fijar un número del corpus."""
    cuerpo = cliente.post(
        "/api/componente", json={"componente": "panel_evidencia", "filtros": {"limite": 1}}
    ).json()
    return int(cuerpo["datos"][0]["chunk_id"])


def test_la_cita_del_agente_abre_el_fragmento_citado(cliente) -> None:
    """Pulsar «[3]» en la respuesta tiene que llevar a esa frase, no al documento entero.

    Sin el filtro por `chunk_id` lo más fino que se podía pedir era `doc_id`, y el
    fragmento citado podía no estar entre los diez que devolvía el documento.
    """
    chunk = _un_chunk(cliente)
    cuerpo = cliente.post(
        "/api/componente", json={"componente": "panel_evidencia", "filtros": {"chunk_id": chunk}}
    ).json()
    assert cuerpo["datos"], "la cita no devolvió ningún fragmento"
    assert int(cuerpo["datos"][0]["chunk_id"]) == chunk, "el fragmento citado no es el primero"
    assert cuerpo["filtros_ignorados"] == []


def test_una_cita_que_no_existe_se_repliega_al_corpus_y_lo_dice(cliente) -> None:
    """Misma regla que el resto de filtros: nunca un panel en blanco sin explicación."""
    cuerpo = cliente.post(
        "/api/componente",
        json={"componente": "panel_evidencia", "filtros": {"chunk_id": 99999999}},
    ).json()
    assert cuerpo["datos"], "una cita rota dejó el panel vacío"
    assert "chunk_id" in cuerpo["filtros_ignorados"]


def test_una_cita_rota_no_tumba_el_resto_del_lote(cliente) -> None:
    """El panel pide de golpe todas las citas de una respuesta.

    El agente numera sus citas contra la base vectorial, que no es la misma tubería que
    la tabla `fragmentos`; si una no existe, devolver 404 dejaba al lector sin ver
    ninguna de las demás.
    """
    bueno = _un_chunk(cliente)
    cuerpo = cliente.get("/api/evidencia", params={"chunk_ids": f"{bueno},999999999"})
    assert cuerpo.status_code == 200
    datos = cuerpo.json()
    assert [f["chunk_id"] for f in datos["fragmentos"]] == [bueno]
    assert datos["faltantes"] == [999999999]


def test_un_lote_entero_de_citas_rotas_sigue_siendo_404(cliente) -> None:
    """Si no se pudo abrir ni una, es un fallo de verdad y hay que decirlo como tal."""
    assert (
        cliente.get("/api/evidencia", params={"chunk_ids": "999999998,999999999"}).status_code
        == 404
    )
