"""Herramienta de recuperación sobre la base vectorial de la Etapa 1.

Envuelve el ``Retriever`` de la Etapa 1 (BGE-M3 denso + disperso, FAISS, RRF,
reranking y, opcionalmente, grafo) y devuelve fragmentos con la metadata que exige
la trazabilidad: ``doc_id``, ``chunk_id``, fuente y fenómeno.
"""

from __future__ import annotations

import logging
import os
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import yaml

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class Fragmento:
    doc_id: str
    chunk_id: str
    texto: str
    fuente: str
    fenomeno: int | None
    titulo: str | None = None

    def cita(self) -> str:
        return f"[{self.doc_id}#{self.chunk_id}]"


class Recuperador(Protocol):
    def buscar(self, consulta: str, k: int) -> list[Fragmento]: ...


class RecuperadorEtapa1:
    """Carga perezosa: los modelos (≈2,5 GB) se cargan una sola vez, en el primer uso."""

    def __init__(self, base_dir: Path, config_path: Path) -> None:
        self._base_dir = base_dir
        self._config_path = config_path
        self._retriever = None
        self._meta: dict[str, dict] = {}
        self._lock = threading.Lock()

    @property
    def listo(self) -> bool:
        return self._retriever is not None

    def cargar(self) -> None:
        with self._lock:
            if self._retriever is None:
                self._retriever = self._construir()

    def _construir(self):
        from etapa1.encoding.encoders import build_encoder, resolve_device
        from etapa1.encoding.index import VectorStore
        from etapa1.encoding.sparse import SparseIndex
        from etapa1.retrieval.pipeline import Retriever

        cfg = yaml.safe_load(self._config_path.read_text(encoding="utf-8"))
        if os.getenv("GRAFO_EN_RECUPERACION", "").lower() in {"1", "true", "si"}:
            cfg["graph"]["fuse_into_retrieval"] = True

        device = resolve_device("auto")
        stores, encoders, sparse = {}, {}, {}
        for enc_cfg in cfg["encoders"]:
            nombre = enc_cfg["name"]
            carpeta = self._base_dir / f"encoder_{nombre}"
            stores[nombre] = VectorStore.load(carpeta)
            encoders[nombre] = build_encoder(enc_cfg, device=device)
            indice = SparseIndex.load(carpeta)
            if indice is not None:
                sparse[nombre] = indice

        for store in stores.values():
            for m in store.metadata:
                self._meta.setdefault(m["chunk_id"], m)

        reranker = None
        if cfg["rerank"]["enabled"]:
            from etapa1.retrieval.rerank import CrossEncoderReranker

            reranker = CrossEncoderReranker(
                cfg["rerank"]["model_id"],
                device=device,
                max_length=cfg["rerank"].get("max_length"),
            )

        grafo = None
        gcfg = cfg.get("graph", {})
        graphml = self._base_dir / "grafo" / "grafo.graphml"
        if gcfg.get("enabled") and gcfg.get("fuse_into_retrieval") and graphml.exists():
            import networkx as nx
            from gliner import GLiNER

            from etapa1.graph.retrieve import GraphRetriever

            ner = GLiNER.from_pretrained(gcfg["ner_model"])
            grafo = GraphRetriever(nx.read_graphml(str(graphml)), ner, gcfg["entity_types"])

        log.info("base vectorial cargada: %d fragmentos, dispositivo %s", len(self._meta), device)
        return Retriever(
            stores=stores,
            encoders=encoders,
            cfg=cfg,
            reranker=reranker,
            graph_retriever=grafo,
            sparse_indexes=sparse,
        )

    def buscar(self, consulta: str, k: int) -> list[Fragmento]:
        self.cargar()
        resultado = self._retriever.retrieve("q", consulta)
        fragmentos: list[Fragmento] = []
        for f in resultado.fragments[:k]:
            meta = self._meta.get(f.chunk_id, {})
            fragmentos.append(
                Fragmento(
                    doc_id=f.doc_id,
                    chunk_id=f.chunk_id,
                    texto=f.text,
                    fuente=meta.get("fuente", ""),
                    fenomeno=meta.get("fenomeno"),
                    titulo=meta.get("titulo"),
                )
            )
        return fragmentos
