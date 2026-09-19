"""Piezas comunes a los componentes: filtros tolerantes, refs, evidencia y cifras."""

from __future__ import annotations

import unicodedata
from collections.abc import Iterable
from typing import Any, NamedTuple

from pydantic import BaseModel, ConfigDict, ValidationError

from ..db import BaseDatos

MAX_EVIDENCIA = 200
MAX_REFS = 20

# El grafo de la Etapa 1 guarda las entidades y sus tipos en minúsculas («eln», «farc-ep»,
# «organizacion»), pero tanto el jurado como el agente escriben «ELN» o «FARC-EP». Sin
# normalizar, la igualdad de SQLite no encuentra nada: se baja a minúsculas y, si aun así no
# hay coincidencia exacta, se toma el candidato más mencionado que contenga el texto pedido.
RESOLVER_ENTIDAD = """
SELECT entidad FROM entidades
 WHERE entidad = :exacta OR entidad LIKE :patron
 ORDER BY (entidad = :exacta) DESC, n_fragmentos DESC
 LIMIT 1
"""

RESOLVER_TIPO_ENTIDAD = """
SELECT tipo FROM entidades
 WHERE tipo = :exacta OR tipo LIKE :patron
 GROUP BY tipo
 ORDER BY (tipo = :exacta) DESC, COUNT(*) DESC
 LIMIT 1
"""


class FiltrosBase(BaseModel):
    """Los filtros con valores imposibles se descartan en vez de romper la respuesta."""

    model_config = ConfigDict(extra="ignore", str_max_length=200)


class Salida(NamedTuple):
    titulo: str
    datos: Any
    evidencia: list[dict[str, Any]]
    total_evidencia: int
    nota_metodo: str


def resolver_filtros[F: FiltrosBase](
    modelo: type[F], filtros: dict[str, Any]
) -> tuple[F, list[str]]:
    """Construye los filtros ignorando claves desconocidas y valores inválidos."""
    admitidos = set(modelo.model_fields)
    ignorados = sorted(k for k in filtros if k not in admitidos)
    # Una cadena en blanco no es un filtro, es la ausencia de filtro. Se quita la clave en
    # vez de ponerla a None para que valga igual con los campos que tienen valor por
    # defecto. Sin esto, `entidad: ""` se comparaba contra la base, no casaba con nada y la
    # red salía sin un solo nodo; y no se informa como descartado porque el usuario no pidió
    # ningún valor que hubiera que descartar.
    candidatos = {
        k: v
        for k, v in filtros.items()
        if k in admitidos and not (isinstance(v, str) and not v.strip())
    }
    for _ in range(len(candidatos) + 1):
        try:
            return modelo(**candidatos), ignorados
        except ValidationError as error:
            malos = {str(e["loc"][0]) for e in error.errors() if e.get("loc")}
            malos &= candidatos.keys()
            if not malos:
                break
            for clave in malos:
                candidatos.pop(clave, None)
            ignorados = sorted({*ignorados, *malos})
    return modelo(), ignorados


def _resolver(bd: BaseDatos, sql: str, texto: str) -> str | None:
    """El valor tal y como está guardado, o ``None`` si no hay nada que se le parezca."""
    limpio = texto.strip().lower()
    filas = bd.consultar(sql, {"exacta": limpio, "patron": f"%{limpio}%"})
    return str(filas[0][0]) if filas else None


def normalizar_entidades[F: FiltrosBase](
    bd: BaseDatos, filtros: F, ignorados: list[str]
) -> tuple[F, list[str]]:
    """Lleva `entidad` y `tipo_entidad` al valor con el que están guardados en la base.

    Si el nombre pedido no existe —el agente puede proponer «sistema espacial», que no es
    ninguna entidad del grafo— el filtro se descarta y se informa en ``filtros_ignorados``,
    igual que con el vocabulario de las alertas. Antes se conservaba el texto crudo y la
    consulta no encontraba nada: la red salía sin un solo nodo, y un componente en blanco
    es indistinguible de un fallo para quien lo está evaluando.
    """
    cambios: dict[str, str | None] = {}
    fuera = list(ignorados)
    for campo, sql in (
        ("entidad", RESOLVER_ENTIDAD),
        ("tipo_entidad", RESOLVER_TIPO_ENTIDAD),
    ):
        valor = getattr(filtros, campo, None)
        if isinstance(valor, str) and valor.strip():
            elegido = _resolver(bd, sql, valor)
            cambios[campo] = elegido
            if elegido is None:
                fuera.append(campo)
    if not cambios:
        return filtros, ignorados
    return filtros.model_copy(update=cambios), sorted(set(fuera))


# Las fichas de alertas guardan su vocabulario tal y como lo escribe la Defensoría
# («Inminencia», «Minería ilegal»), pero el jurado y el agente escriben «inminencia» o
# «mineria ilegal». SQLite compara `=` distinguiendo mayúsculas y su `LIKE` solo ignora el
# caso en ASCII, así que una tilde o una mayúscula devolvían el componente vacío: correcto
# pero en blanco, que para quien evalúa es indistinguible de un fallo. El vocabulario de
# estas columnas es cerrado y diminuto (2 tipos, 5 economías), así que se compara en Python
# sin tildes y en minúsculas.
VOCABULARIO = {
    "tipo_alerta": ("SELECT DISTINCT tipo FROM alertas WHERE tipo IS NOT NULL", None),
    "economia": (
        "SELECT DISTINCT economias_ilicitas FROM alertas WHERE economias_ilicitas IS NOT NULL",
        ";",
    ),
}


def _plano(texto: str) -> str:
    descompuesto = unicodedata.normalize("NFD", texto.strip().lower())
    return "".join(c for c in descompuesto if unicodedata.category(c) != "Mn")


def _valores(bd: BaseDatos, sql: str, separador: str | None) -> list[str]:
    """Vocabulario real de la columna. `economias_ilicitas` guarda varias por fila,
    separadas por `;`, así que se parten antes de comparar."""
    vistos: list[str] = []
    for fila in bd.consultar(sql):
        bruto = str(fila[0])
        for parte in bruto.split(separador) if separador else [bruto]:
            limpio = parte.strip()
            if limpio:
                vistos.append(limpio)
    return list(dict.fromkeys(vistos))


def normalizar_vocabulario[F: FiltrosBase](
    bd: BaseDatos, filtros: F, campos: Iterable[str], ignorados: list[str]
) -> tuple[F, list[str]]:
    """Lleva cada filtro al valor exacto de la base. Si no hay ninguno parecido, se
    descarta y se informa en ``filtros_ignorados``: mejor enseñar el mapa completo y
    decir que ese filtro no se aplicó que devolver un componente en blanco."""
    cambios: dict[str, Any] = {}
    fuera = list(ignorados)
    for campo in campos:
        pedido = getattr(filtros, campo, None)
        if not isinstance(pedido, str) or not pedido.strip():
            continue
        sql, separador = VOCABULARIO[campo]
        objetivo = _plano(pedido)
        valores = _valores(bd, sql, separador)
        exacto = next((v for v in valores if _plano(v) == objetivo), None)
        parcial = next((v for v in valores if objetivo in _plano(v)), None)
        elegido = exacto or parcial
        if elegido is None:
            cambios[campo] = None
            fuera.append(campo)
        elif elegido != pedido:
            cambios[campo] = elegido
    if not cambios:
        return filtros, ignorados
    return filtros.model_copy(update=cambios), sorted(set(fuera))


def refs(pares: Iterable[tuple[str, int]]) -> list[dict[str, Any]]:
    unicos = dict.fromkeys(pares)
    return [{"doc_id": d, "chunk_id": c} for d, c in list(unicos)[:MAX_REFS]]


def evidencia(pares: Iterable[tuple[str, int]], total: int | None = None) -> tuple[list[dict], int]:
    unicos = list(dict.fromkeys(pares))
    lista = [{"doc_id": d, "chunk_id": c} for d, c in unicos[:MAX_EVIDENCIA]]
    return lista, len(unicos) if total is None else total


def miles(n: int) -> str:
    """`69999` → `69.999`: separador de miles como se escribe en español.

    Se aplica solo al número. Formatear la frase entera y cambiarle después las comas por
    puntos convierte la prosa en una ristra de puntos.
    """
    return f"{n:,}".replace(",", ".")
