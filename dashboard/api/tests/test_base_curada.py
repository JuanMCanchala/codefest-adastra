"""`panel_evidencia` con el filtro `curado`: la base validada a mano por ADL."""

from __future__ import annotations


def test_curado_por_defecto_no_cambia_el_comportamiento_actual(cliente) -> None:
    """Sin `curado` el panel se comporta exactamente igual que antes de este filtro."""
    con_flag = cliente.post(
        "/api/componente",
        json={"componente": "panel_evidencia", "filtros": {"entidad": "China", "curado": False}},
    ).json()
    sin_flag = cliente.post(
        "/api/componente",
        json={"componente": "panel_evidencia", "filtros": {"entidad": "China"}},
    ).json()
    assert con_flag == sin_flag


def test_curado_restringe_a_sql_entidades(cliente, conexion) -> None:
    """Con `curado` en verdadero, cada `chunk_id` devuelto está en `sql_entidades`."""
    curados = {fila[0] for fila in conexion.execute("SELECT chunk_id FROM sql_entidades")}
    respuesta = cliente.post(
        "/api/componente",
        json={"componente": "panel_evidencia", "filtros": {"curado": True, "limite": 20}},
    ).json()
    assert respuesta["datos"], "la base curada tiene 157 filas, el panel no debería salir vacío"
    assert all(fila["chunk_id"] in curados for fila in respuesta["datos"])
    assert "ADL" in respuesta["titulo"] or "ADL" in respuesta["nota_metodo"]


def test_curado_con_entidad_restringe_a_los_pares_curados(cliente, conexion) -> None:
    """`curado` + `entidad` se limita a los `chunk_id` curados de esa entidad."""
    curados = {fila[0] for fila in conexion.execute("SELECT chunk_id FROM sql_entidades")}
    respuesta = cliente.post(
        "/api/componente",
        json={
            "componente": "panel_evidencia",
            "filtros": {"entidad": "China", "curado": True, "limite": 20},
        },
    ).json()
    assert respuesta["datos"], "«China» tiene menciones dentro de la base curada"
    assert all(fila["chunk_id"] in curados for fila in respuesta["datos"])
    assert respuesta["filtros_ignorados"] == []


def test_curado_con_entidad_sin_datos_repliega_y_declara_el_filtro_descartado(cliente) -> None:
    """Si la combinación `curado` + `entidad` no tiene filas, se repliega sin quedar vacío."""
    respuesta = cliente.post(
        "/api/componente",
        json={"componente": "panel_evidencia", "filtros": {"entidad": "ELN", "curado": True}},
    ).json()
    assert respuesta["datos"], "el repliegue nunca debe devolver un panel vacío"
    assert "curado" in respuesta["filtros_ignorados"]


def test_curado_devuelve_texto_y_referencias_igual_que_el_resto_del_panel(cliente) -> None:
    """Cada fragmento curado sigue traiendo su texto, `doc_id` y `chunk_id`."""
    respuesta = cliente.post(
        "/api/componente",
        json={"componente": "panel_evidencia", "filtros": {"curado": True}},
    ).json()
    for fila in respuesta["datos"]:
        assert fila["doc_id"]
        assert fila["chunk_id"]
        assert "fragmento" in fila
