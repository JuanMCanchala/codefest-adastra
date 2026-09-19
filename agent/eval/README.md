# Banco de evaluación — cómo reproducir una corrida

Esta guía sirve para correr el mismo harness en **otra máquina**, por ejemplo para
probar con un juez distinto (otro modelo del gateway) o comparar hardware. El
resultado de cada corrida es un JSON versionable en `agent/eval/resultados/`, así que
dos corridas hechas en dos máquinas distintas se pueden comparar directamente con
`python -m eval.reporte`.

## 1. Requisitos

- Python 3.11 o 3.12.
- ~4 GB de disco libres: ~2,3 GB para BGE-M3, ~0,5 GB para el índice de la Etapa 1,
  ~0,5 GB para el clasificador de inyección, más las dependencias de Python.
- Una API key del gateway de ADL (`LLM_API_KEY`). Es la misma que usa el agente en
  producción; pídesela al equipo si no la tienes.
- Conexión a internet la primera vez (descarga el índice y los modelos de Hugging
  Face; quedan en caché para las siguientes corridas).

## 2. Preparar el entorno

Desde `agent/`:

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt -r requirements-dev.txt
```

`requirements-dev.txt` ya incluye `deepeval` y `openai`, que son las únicas
dependencias que el harness necesita además de las del agente. No hace falta
instalar nada por separado.

## 3. Descargar la base vectorial de la Etapa 1

El agente no trae el índice en el repo (pesa ~530 MB comprimido). Se descarga una
sola vez:

```bash
mkdir -p data
curl -fL -o data/base_vectorial.zip \
  https://github.com/JuanMCanchala/ad-astra-retrieval/releases/download/base-vectorial-v1/base_vectorial.zip
unzip -q data/base_vectorial.zip -d data/base_vectorial
```

El zip trae una carpeta interna con el mismo nombre, así que la ruta real del índice
queda en `data/base_vectorial/base_vectorial/` (con `encoder_bge-m3/index.faiss`,
`encoder_bge-m3/metadata.jsonl` y `grafo/grafo.graphml` adentro). Verifica esa
carpeta antes de seguir.

## 4. Configurar `.env`

Crea `agent/.env` (ya está en `.gitignore`, no se sube):

```ini
LLM_BASE_URL=https://litellm.admin-adl.codefest2026.augusta.avaldigitallabs.com/v1
LLM_API_KEY=<tu-api-key-del-gateway>
BASE_VECTORIAL_DIR=./data/base_vectorial/base_vectorial
RETRIEVAL_CONFIG=./config.retrieval.yaml
```

Si vas a probar el **orquestador o el agente de corpus** con un modelo distinto al de
producción (no solo el juez), agrega también:

```ini
MODELO_ORQUESTADOR=<id-del-modelo-en-el-gateway>
MODELO_CORPUS=<id-del-modelo-en-el-gateway>
MODELO_VISUALIZACION=<id-del-modelo-en-el-gateway>
```

Estos tres son opcionales: si no los pones, usa los de producción
(`qwen3-next-80b` y `meta.llama3-3-70b-instruct`, ver `app/settings.py`).

**Verifica primero qué modelos responden de verdad en el gateway de esa máquina**,
porque `/v1/models` lista más de lo que realmente funciona (algunos no tienen la key
del proveedor configurada del lado de ADL y devuelven 401). Prueba con un `curl`
directo antes de perder tiempo corriendo el harness completo:

```bash
curl -s -H "Authorization: Bearer $LLM_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"<id-del-modelo>","messages":[{"role":"user","content":"di solo OK"}],"max_tokens":10}' \
  https://litellm.admin-adl.codefest2026.augusta.avaldigitallabs.com/v1/chat/completions
```

Si responde `{"choices":[{"message":{"content":"OK"...` sirve. Si responde un JSON
con `"error"` y 401, no sirve como juez en esa máquina aunque aparezca en
`/v1/models`. Nota ya verificada en `eval/juez.py`: `gpt-4o`, `gpt-4o-mini` y
`claude-3-haiku` fallan así en el gateway actual; `gemma-3-27b` (juez por defecto) y
`mixtral-8x7b-instruct` sí responden.

## 5. Levantar el agente en local

```bash
uvicorn app.main:app --port 8000
```

La primera vez tarda unos minutos: carga BGE-M3 (~2,3 GB) y el reranker en la
primera pregunta o en el hilo de precarga. Verifica que terminó antes de lanzar el
harness:

```bash
curl -s http://localhost:8000/health
# {"estado":"ok","base_cargada":true,...}
```

Si sale `503` o `"base_cargada":false`, todavía está cargando: espera y repite.

## 6. Correr el harness

Corrida completa (50 preguntas oficiales + 20 fuera de alcance + 30 ataques, con el
juez por defecto):

```bash
python -m eval.ejecutar correr --endpoint http://localhost:8000 --etiqueta <nombre-de-tu-corrida>
```

Con otro juez (por ejemplo para comparar si el veredicto cambia según el modelo que
juzga):

```bash
python -m eval.ejecutar correr --endpoint http://localhost:8000 --etiqueta <nombre> --juez mixtral-8x7b-instruct
```

Para iterar rápido y barato antes de la corrida completa, con una submuestra:

```bash
python -m eval.ejecutar correr --endpoint http://localhost:8000 --etiqueta prueba_rapida --n-preguntas 5 --n-ataques 3
```

`<nombre-de-tu-corrida>` debería identificar la máquina o el modelo, por ejemplo
`baseline_pc2_gemma` o `corpus_llama_local`, para que el archivo en
`eval/resultados/<etiqueta>.json` se entienda sin abrir el JSON.

## 7. Comparar contra el baseline del equipo

```bash
python -m eval.reporte  # no es un comando de CLI directo; usar comparar:
python -m eval.ejecutar comparar baseline <nombre-de-tu-corrida>
```

Esto imprime una tabla con la diferencia métrica por métrica contra
`eval/resultados/baseline.json`, que ya está commiteado en el repo.

## 8. Subir el resultado

```bash
git add agent/eval/resultados/<nombre-de-tu-corrida>.json
git commit -m "data(eval): corrida <nombre> con <lo que cambiaste>"
git push origin nicolas
```

No subas `.env`, la base vectorial descargada (`data/`) ni la caché de Hugging Face:
ya están en `.gitignore`.

## Problemas comunes

- **`ModuleNotFoundError: No module named 'torch'`**: falta instalar
  `requirements.txt` completo, no solo `requirements-dev.txt`.
- **El healthcheck nunca llega a `true`**: revisa `BASE_VECTORIAL_DIR` — debe apuntar
  a la carpeta que tiene `encoder_bge-m3/index.faiss` dentro, no a la carpeta del zip
  descomprimido directamente (ver el paso 3, hay una carpeta anidada de más).
- **El juez devuelve puntajes en cero para todo**: casi siempre es el modelo del
  juez devolviendo 401 del lado del gateway; probar el `curl` directo del paso 4
  antes de sospechar del harness.
- **Windows / consola con acentos rotos (`�`)**: es la consola (cp1252), no el dato.
  Los JSON de `eval/resultados/` están en UTF-8 real; ábrelos con un editor, no con
  `type`/`cat` en `cmd.exe`.
