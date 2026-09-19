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

    # Corpus original (PDF, JSON, CSV de la Etapa 0). No viaja en la imagen —son gigas—:
    # si el despliegue lo monta aquí, la evidencia enlaza al archivo del que salió cada
    # fragmento; si no, el panel sigue funcionando sin el enlace.
    corpus_dir: Path = Path("")

    # Modelo de lenguaje para el resumen en prosa del tríptico satelital
    # (`POST /api/interpretar`). Es el mismo gateway OpenAI-compatible de ADL que usa el
    # agente, pero el tablero lo llama por su cuenta: no comparte proceso con él. Sin
    # `LLM_API_KEY` el resumen no se ofrece y el tríptico se sirve igual, con su veredicto
    # medido y sus cifras, que no dependen de ningún modelo de lenguaje.
    llm_base_url: str = "https://litellm.admin-adl.codefest2026.augusta.avaldigitallabs.com/v1"
    llm_api_key: str = ""
    llm_modelo: str = "qwen3-next-80b"
    llm_timeout_s: float = 30.0
    llm_max_tokens: int = 400

    # Consola de inteligencia (Reto 1). Si el despliegue la publica, el tablero enlaza a ella
    # para poder ir y volver entre preguntar y explorar.
    consola_url: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
