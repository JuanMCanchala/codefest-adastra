"""Configuración por variables de entorno (Coolify, Anexo A.6). Nada sensible en el código."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Amazon Bedrock (API Key de ADL, §1.3) ---
    # boto3 lee AWS_BEARER_TOKEN_BEDROCK directamente del entorno; aquí solo se
    # declara la región y los IDs de modelo, que se copian de la consola de Bedrock.
    aws_region: str = "us-east-1"
    modelo_orquestador: str = "openai.gpt-oss-20b-1:0"
    modelo_corpus: str = "openai.gpt-oss-120b-1:0"
    modelo_visualizacion: str = "openai.gpt-oss-20b-1:0"
    llm_timeout_s: float = 60.0
    llm_max_tokens_respuesta: int = 700

    # --- Presupuesto (bolsa de USD 100, §1.3): tope duro de tokens por proceso ---
    presupuesto_tokens: int = 40_000_000

    # --- Base de conocimiento de la Etapa 1 ---
    base_vectorial_dir: Path = Path("/data/base_vectorial")
    retrieval_config: Path = Path("/app/config.retrieval.yaml")
    fragmentos_contexto: int = 6

    # --- Servidor ---
    cors_origins: str = "*"


@lru_cache
def get_settings() -> Settings:
    return Settings()
