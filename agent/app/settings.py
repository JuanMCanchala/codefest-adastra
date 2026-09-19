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
    # Gateway OpenAI-compatible de ADL (clave "sk-..."). Si LLM_BASE_URL está definido,
    # se usa en lugar de boto3; los IDs de modelo son los que exponga el gateway.
    llm_base_url: str = "https://litellm.admin-adl.codefest2026.augusta.avaldigitallabs.com/v1"
    llm_api_key: str = ""
    # IDs del gateway de ADL. Elegidos con benchmarks públicos y una prueba mínima en el
    # gateway (docs/investigacion/03_arquitectura/benchmarks_modelos_bedrock.md): Qwen3-Next
    # clasificó bien y fue el más rápido (1,1 s) sin tokens de razonamiento; Llama 3.3 70B
    # tiene la alucinación más baja y estable en RAG. gpt-oss-120b erró el fenómeno.
    modelo_orquestador: str = "qwen3-next-80b"
    modelo_corpus: str = "meta.llama3-3-70b-instruct"
    modelo_visualizacion: str = "qwen3-next-80b"
    # Esfuerzo de razonamiento si se usa un modelo gpt-oss: "low" reduce tokens y latencia.
    razonamiento_gpt_oss: str = "low"
    llm_timeout_s: float = 60.0
    llm_max_tokens_respuesta: int = 700

    # --- Presupuesto (bolsa de USD 100, §1.3): tope duro de tokens por proceso ---
    presupuesto_tokens: int = 40_000_000

    # --- Base de conocimiento de la Etapa 1 ---
    base_vectorial_dir: Path = Path("/data/base_vectorial")
    retrieval_config: Path = Path("/app/config.retrieval.yaml")
    fragmentos_contexto: int = 6
    # Calificación de evidencia antes de redactar. El valor es el logit del cross-encoder
    # del mejor fragmento: por debajo de este umbral, el redactor recibe una instrucción
    # de cautela (no se abstiene: abstenerse hundiría Answer Relevancy, que pesa 30 % del
    # bloque de Calidad).
    #
    # Calibrado sobre la base vectorial real: las 50 preguntas oficiales dan un mejor
    # score de -0,25 a +10,10 (mediana +4,48) y las 20 fuera de alcance de -5,13 a +0,25
    # (mediana -2,14). Con -0,5 ninguna de las 50 oficiales queda marcada y se detectan
    # 17 de las 20 sin evidencia. Subirlo a 0,0 detecta 19/20 pero marca 1 oficial.
    umbral_evidencia: float = -0.5

    # --- Seguridad: clasificador de prompt injection (segunda capa, en CPU) ---
    clasificador_inyeccion: bool = True
    umbral_inyeccion: float = 0.5
    # Alternativa medida: "meta-llama/Llama-Prompt-Guard-2-86M" (acceso restringido,
    # necesita HF_TOKEN en la construcción). Detectó 8/24 ataques difíciles frente a
    # 15/24 del valor por defecto; ver el encabezado de clasificador.py.
    modelo_inyeccion: str = "proventra/mdeberta-v3-base-prompt-injection"
    # Solo se usa para descargar modelos de acceso restringido. Nunca va en la imagen ni
    # en el código: se declara en las variables de entorno de Coolify (Anexo A.6).
    hf_token: str = ""

    # --- Servidor ---
    cors_origins: str = "*"


@lru_cache
def get_settings() -> Settings:
    return Settings()
