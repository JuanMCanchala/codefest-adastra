# Agente del Reto 1: POST /chat en el puerto 8000 (Anexo A.4).
#
# La imagen es autosuficiente: trae los modelos de embeddings y reranking y la base
# vectorial de la Etapa 1. Las credenciales NO van en la imagen: la API Key de Bedrock se
# inyecta como variable de entorno desde Coolify (Anexo A.6).

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HF_HOME=/models \
    HF_HUB_DISABLE_TELEMETRY=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# torch de CPU primero: el contenedor no tiene GPU y la build CUDA pesa varios GB.
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu
COPY requirements.txt .
RUN pip install -r requirements.txt

# Modelos de la recuperación, descargados en la construcción para que el arranque no
# dependa de la red de Hugging Face durante la evaluación.
RUN python -c "from huggingface_hub import snapshot_download as d; \
d('BAAI/bge-m3'); d('BAAI/bge-reranker-v2-m3')"

# Base vectorial de la Etapa 1 (release público, 507 MB comprimidos).
ARG BASE_VECTORIAL_URL=https://github.com/JuanMCanchala/ad-astra-retrieval/releases/download/base-vectorial-v1/base_vectorial.zip
RUN mkdir -p /data \
    && curl -fsSL "$BASE_VECTORIAL_URL" -o /tmp/base.zip \
    && unzip -q /tmp/base.zip -d /data \
    && rm /tmp/base.zip

COPY app ./app
COPY etapa1 ./etapa1
COPY agent_card.json config.retrieval.yaml ./

RUN useradd --create-home --uid 10001 agente \
    && chown -R agente /app /models /data
USER agente

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
