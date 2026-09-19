"""Piezas comunes a los componentes: filtros tolerantes, refs y evidencia acotada."""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any, NamedTuple

from pydantic import BaseModel, ConfigDict, ValidationError

MAX_EVIDENCIA = 200
MAX_REFS = 20


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


def refs(pares: Iterable[tuple[str, int]]) -> list[dict[str, Any]]:
    unicos = dict.fromkeys(pares)
    return [{"doc_id": d, "chunk_id": c} for d, c in list(unicos)[:MAX_REFS]]


def evidencia(pares: Iterable[tuple[str, int]], total: int | None = None) -> tuple[list[dict], int]:
    unicos = list(dict.fromkeys(pares))
    lista = [{"doc_id": d, "chunk_id": c} for d, c in unicos[:MAX_EVIDENCIA]]
    return lista, len(unicos) if total is None else total
