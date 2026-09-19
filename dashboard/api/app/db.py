"""Acceso de solo lectura a ``dashboard.db``.

La base se abre en modo ``ro`` con una conexión por hilo (los endpoints síncronos de
FastAPI corren en el threadpool). Todas las consultas son SQL estático con parámetros
nombrados: ningún valor del usuario se interpola en el texto de la consulta.
"""

from __future__ import annotations

import sqlite3
import threading
from pathlib import Path
from typing import Any

CONTEOS = {
    "documentos": "SELECT COUNT(*) AS n FROM documentos",
    "fragmentos": "SELECT COUNT(*) AS n FROM fragmentos",
    "entidades": "SELECT COUNT(*) AS n FROM entidades",
    "menciones": "SELECT COUNT(*) AS n FROM menciones",
    "relaciones": "SELECT COUNT(*) AS n FROM relaciones",
    "paises": "SELECT COUNT(*) AS n FROM paises",
    "menciones_pais": "SELECT COUNT(*) AS n FROM menciones_pais",
    "alertas": "SELECT COUNT(*) AS n FROM alertas",
    "amazonia": "SELECT COUNT(*) AS n FROM amazonia",
    "sql_documentos": "SELECT COUNT(*) AS n FROM sql_documentos",
    "sql_entidades": "SELECT COUNT(*) AS n FROM sql_entidades",
}


class BaseDatos:
    """Una sola conexión compartida y serializada con un cerrojo.

    Las consultas son de solo lectura y tardan decenas de milisegundos, así que compartir la
    conexión es preferible a abrir una por hilo del threadpool: la caché de páginas se
    aprovecha en todas las peticiones y la latencia no depende del hilo que atienda.
    """

    def __init__(self, ruta: Path) -> None:
        self.ruta = Path(ruta)
        self._lock = threading.Lock()
        self._con: sqlite3.Connection | None = None

    def _conexion(self) -> sqlite3.Connection:
        if self._con is None:
            con = sqlite3.connect(
                f"file:{self.ruta.as_posix()}?mode=ro", uri=True, check_same_thread=False
            )
            con.row_factory = sqlite3.Row
            con.execute("PRAGMA query_only = ON")
            con.execute("PRAGMA temp_store = MEMORY")
            # La base pesa 34,5 MB: con mmap y una caché propia de 20 MB las consultas que
            # recorren `menciones` no dependen de la caché de archivos del sistema.
            con.execute("PRAGMA mmap_size = 268435456")
            con.execute("PRAGMA cache_size = -20000")
            self._con = con
        return self._con

    def consultar(self, sql: str, params: dict[str, Any] | None = None) -> list[sqlite3.Row]:
        with self._lock:
            return list(self._conexion().execute(sql, params or {}))

    def valor(self, sql: str, params: dict[str, Any] | None = None) -> Any:
        with self._lock:
            fila = self._conexion().execute(sql, params or {}).fetchone()
        return None if fila is None else fila[0]

    def precalentar(self) -> None:
        """Carga en la caché las tablas grandes para que la primera consulta no las pague."""
        self.consultar("SELECT COUNT(*) FROM menciones")
        self.consultar("SELECT COUNT(*) FROM relaciones")

    def conteos(self) -> dict[str, int]:
        return {tabla: int(self.valor(sql) or 0) for tabla, sql in CONTEOS.items()}
