"""Fixtures de prueba: la API se ejerce contra la base real y metadata.jsonl real."""

from __future__ import annotations

import json
import os
import sqlite3
import threading
from collections.abc import Iterator
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import pytest

TABLERO = Path(__file__).resolve().parents[2]
METADATA_LOCAL = "C:/Programacion/ANDES/entrega/base_vectorial/encoder_bge-m3/metadata.jsonl"

os.environ.setdefault("DB_PATH", str(TABLERO / "datos" / "dashboard.db"))
os.environ.setdefault("METADATA_PATH", METADATA_LOCAL)
os.environ.setdefault("GEO_DIR", str(TABLERO / "datos" / "geo"))
os.environ.setdefault("AMW_PATH", str(TABLERO / "datos" / "amw" / "colombia.json"))
os.environ.setdefault("WEB_DIST", str(TABLERO / "web" / "dist"))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

RESPUESTA_AGENTE = {
    "respuesta": "Las alertas tempranas se concentran en Antioquia y Nariño [1].",
    "evaluacion": {"input": "x", "actual_output": "y", "retrieval_context": [], "tools_called": []},
    "metadata": {
        "num_interacciones": 1,
        "agentes_invocados": ["orquestador", "agente_visualizacion"],
        "tokens": {"input": 10, "output": 20, "total": 30},
        "tokens_por_agente": [],
        "latencia_ms": 1234,
        "estado": "ok",
    },
    "extras": {
        "ruta": "visualizacion",
        "citas": [{"n": 1, "doc_id": "F3-ALERTAS-012", "chunk_id": 81234}],
        "visualizacion": {
            "componente": "mapa_colombia",
            "fenomeno": 3,
            "filtros": {"nivel": "departamento", "inventado": True},
            "titulo": "Alertas tempranas por departamento",
            "justificacion": "La pregunta compara territorios.",
        },
    },
}


class _AgenteFalso(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_POST(self) -> None:
        largo = int(self.headers.get("content-length") or 0)
        peticion = json.loads(self.rfile.read(largo) or b"{}")
        cuerpo = dict(RESPUESTA_AGENTE)
        if "sin visualizacion" in str(peticion.get("pregunta", "")):
            extras = dict(cuerpo["extras"])
            extras["visualizacion"] = None
            cuerpo["extras"] = extras
        datos = json.dumps(cuerpo).encode("utf-8")
        self.send_response(200)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(datos)))
        self.end_headers()
        self.wfile.write(datos)

    def log_message(self, *_args) -> None:
        return


@pytest.fixture(scope="session")
def agente_falso() -> Iterator[str]:
    servidor = ThreadingHTTPServer(("127.0.0.1", 0), _AgenteFalso)
    hilo = threading.Thread(target=servidor.serve_forever, daemon=True)
    hilo.start()
    yield f"http://127.0.0.1:{servidor.server_address[1]}"
    servidor.shutdown()
    servidor.server_close()


@pytest.fixture(scope="session")
def cliente(agente_falso: str) -> Iterator[TestClient]:
    with TestClient(app) as prueba:
        prueba.app.state.cfg = prueba.app.state.cfg.model_copy(update={"agent_url": agente_falso})
        if prueba.app.state.textos.disponible:
            # Espera el índice de offsets de metadata.jsonl para que no compita con las
            # mediciones de latencia de los componentes.
            prueba.app.state.textos.construir()
        yield prueba


@pytest.fixture(scope="session")
def conexion() -> Iterator[sqlite3.Connection]:
    ruta = Path(os.environ["DB_PATH"]).as_posix()
    con = sqlite3.connect(f"file:{ruta}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    yield con
    con.close()
