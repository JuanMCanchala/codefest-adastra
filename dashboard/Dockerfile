# Tablero del Reto 2: API y SPA en un único puerto (Anexo A.4).
#
# El contexto de construcción es la carpeta `dashboard/` (Base Directory = /dashboard en
# Coolify). La imagen es autosuficiente: trae la base analítica, las geometrías, la SPA
# compilada y el metadata.jsonl de la base vectorial de la Etapa 1 (solo ese archivo).

# --- Etapa 1: SPA (Vite) ---------------------------------------------------------------
FROM node:22-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# --- Etapa 2: API (FastAPI) ------------------------------------------------------------
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DB_PATH=/app/datos/dashboard.db \
    GEO_DIR=/app/datos/geo \
    WEB_DIST=/app/web \
    METADATA_PATH=/data/base_vectorial/encoder_bge-m3/metadata.jsonl

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY api/requirements.txt .
RUN pip install -r requirements.txt

# El usuario sin privilegios se crea antes de la descarga: los archivos nacen con el dueño
# correcto y no hace falta un chown -R que duplique cientos de MB.
RUN useradd --create-home --uid 10001 tablero \
    && mkdir -p /data /app/datos \
    && chown tablero /data /app/datos
USER tablero

# De la base vectorial (release público) solo se extrae metadata.jsonl: es el texto de los
# fragmentos que sustenta cada cifra del tablero. Los índices FAISS no se usan aquí.
ARG BASE_VECTORIAL_URL=https://github.com/JuanMCanchala/ad-astra-retrieval/releases/download/base-vectorial-v1/base_vectorial.zip
RUN curl -fsSL "$BASE_VECTORIAL_URL" -o /tmp/base.zip \
    && unzip -q /tmp/base.zip "base_vectorial/encoder_bge-m3/metadata.jsonl" -d /data \
    && rm /tmp/base.zip

COPY --chown=tablero api/app ./app
COPY --chown=tablero datos/dashboard.db ./datos/dashboard.db
COPY --chown=tablero datos/geo ./datos/geo
# Pérdida de bosque del Chocó, precalculada por `scripts/deforestacion_choco.py`.
COPY --chown=tablero datos/deforestacion ./datos/deforestacion
COPY --from=web --chown=tablero /web/dist ./web

EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=10 \
    CMD curl -fsS http://127.0.0.1:8080/api/salud || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
