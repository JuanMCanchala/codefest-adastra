"""Derivación de entidades, menciones y relaciones desde el grafo GLiNER de la Etapa 1."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from xml.etree import ElementTree

CLAVES = {"d0": "tipo", "d1": "chunks", "d2": "relacion", "d3": "peso", "d4": "doc_id", "d5": "chunk_id"}
NS = "{http://graphml.graphdrawing.org/xmlns}"


@dataclass
class Grafo:
    tipos: dict[str, str] = field(default_factory=dict)
    chunks: dict[str, list[int]] = field(default_factory=dict)
    aristas: list[tuple[str, str, str, int, str, int]] = field(default_factory=list)


def _datos(elemento) -> dict[str, str]:
    salida = {}
    for dato in elemento.findall(f"{NS}data"):
        clave = CLAVES.get(dato.get("key"))
        if clave:
            salida[clave] = dato.text or ""
    return salida


def _enteros(texto: str) -> list[int]:
    return [int(t) for t in texto.split(",") if t.strip().isdigit()]


def leer_grafo(ruta: Path) -> Grafo:
    """Lee el GraphML por streaming (el archivo pesa ~22 MB)."""
    grafo = Grafo()
    # El GraphML es un artefacto propio de la Etapa 1, no una entrada externa.
    for _, elemento in ElementTree.iterparse(ruta, events=("end",)):  # noqa: S314
        if elemento.tag == f"{NS}node":
            datos = _datos(elemento)
            nombre = elemento.get("id")
            grafo.tipos[nombre] = datos.get("tipo") or None
            grafo.chunks[nombre] = _enteros(datos.get("chunks", ""))
            elemento.clear()
        elif elemento.tag == f"{NS}edge":
            datos = _datos(elemento)
            chunk = datos.get("chunk_id", "")
            if not chunk.isdigit():
                elemento.clear()
                continue
            grafo.aristas.append(
                (
                    elemento.get("source"),
                    elemento.get("target"),
                    datos.get("relacion") or "co-ocurre",
                    int(datos.get("peso") or 0),
                    datos.get("doc_id") or "",
                    int(chunk),
                )
            )
            elemento.clear()
    return grafo


def menciones(grafo: Grafo, doc_por_chunk: dict[int, str]) -> set[tuple[str, str, int]]:
    """Menciones trazables: cada par (doc_id, chunk_id) viene del grafo y existe en fragmentos."""
    salida: set[tuple[str, str, int]] = set()
    for entidad, ids in grafo.chunks.items():
        for chunk_id in ids:
            doc_id = doc_por_chunk.get(chunk_id)
            if doc_id:
                salida.add((entidad, doc_id, chunk_id))
    for origen, destino, _rel, _peso, doc_id, chunk_id in grafo.aristas:
        if doc_por_chunk.get(chunk_id) != doc_id:
            continue
        salida.add((origen, doc_id, chunk_id))
        salida.add((destino, doc_id, chunk_id))
    return salida


def filas_entidades(grafo: Grafo, menciones_set: set[tuple[str, str, int]]) -> list[tuple]:
    docs: dict[str, set[str]] = defaultdict(set)
    frags: dict[str, int] = defaultdict(int)
    for entidad, doc_id, _chunk_id in menciones_set:
        docs[entidad].add(doc_id)
        frags[entidad] += 1
    return [
        (entidad, grafo.tipos.get(entidad), len(docs[entidad]), frags[entidad]) for entidad in sorted(docs)
    ]


def filas_relaciones(grafo: Grafo, doc_por_chunk: dict[int, str]) -> list[tuple]:
    return [arista for arista in grafo.aristas if doc_por_chunk.get(arista[5]) == arista[4]]
