"""Piezas comunes a los componentes: filtros tolerantes, refs y evidencia acotada."""

from __future__ import annotations

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
    candidatos = {k: v for k, v in filtros.items() if k in admitidos}
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


def _resolver(bd: BaseDatos, sql: str, texto: str) -> str:
    limpio = texto.strip().lower()
    filas = bd.consultar(sql, {"exacta": limpio, "patron": f"%{limpio}%"})
    return str(filas[0][0]) if filas else limpio


def normalizar_entidades[F: FiltrosBase](bd: BaseDatos, filtros: F) -> F:
    """Lleva `entidad` y `tipo_entidad` al valor con el que están guardados en la base."""
    cambios: dict[str, str] = {}
    for campo, sql in (
        ("entidad", RESOLVER_ENTIDAD),
        ("tipo_entidad", RESOLVER_TIPO_ENTIDAD),
    ):
        valor = getattr(filtros, campo, None)
        if isinstance(valor, str) and valor.strip():
            cambios[campo] = _resolver(bd, sql, valor)
    return filtros.model_copy(update=cambios) if cambios else filtros


def refs(pares: Iterable[tuple[str, int]]) -> list[dict[str, Any]]:
    unicos = dict.fromkeys(pares)
    return [{"doc_id": d, "chunk_id": c} for d, c in list(unicos)[:MAX_REFS]]


def evidencia(pares: Iterable[tuple[str, int]], total: int | None = None) -> tuple[list[dict], int]:
    unicos = list(dict.fromkeys(pares))
    lista = [{"doc_id": d, "chunk_id": c} for d, c in unicos[:MAX_EVIDENCIA]]
    return lista, len(unicos) if total is None else total
