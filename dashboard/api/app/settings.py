"""Configuración por variables de entorno (Coolify, Anexo A.6). Nada sensible en el código."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Agente del Reto 1: el tablero solo lo consume por HTTP (POST /chat).
    agent_url: str = "https://agent.aerocode.codefest2026.augusta.avaldigitallabs.com"
    agent_timeout_s: float = 90.0

    # Datos: la base analítica viaja en la imagen; el texto de los fragmentos se lee de
    # metadata.jsonl (base vectorial de la Etapa 1), que se descarga en la construcción.
    db_path: Path = Path("/app/datos/dashboard.db")
    metadata_path: Path = Path("/data/base_vectorial/encoder_bge-m3/metadata.jsonl")
    geo_dir: Path = Path("/app/datos/geo")

    # SPA compilada (Vite) servida por el mismo puerto que la API (Anexo A.4).
    web_dist: Path = Path("/app/web")

    cors_origins: str = "*"

    # Detalles internos (identificadores del catálogo, claves crudas de filtros, consumo de
    # tokens) en la interfaz. Se decide en el despliegue, no en el navegador: el tablero que
    # revisa el jurado va limpio y el del equipo se enciende con VISTA_TECNICA=1.
    vista_tecnica: bool = False

    # Consola de inteligencia (Reto 1). Si el despliegue la publica, el tablero enlaza a ella
    # para poder ir y volver entre preguntar y explorar.
    consola_url: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
