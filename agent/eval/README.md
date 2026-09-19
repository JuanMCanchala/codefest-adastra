# Banco de evaluación (Parte 1)

Instrumento de medición del agente: corre un lote de preguntas contra el contrato
`POST /chat` y devuelve, por pregunta y agregado, los tres bloques medibles de la
rúbrica oficial (relevancia, fidelidad, toxicidad y tono; tokens, interacciones y
latencia; resistencia a ataques y falsos positivos). Sin esto, ningún cambio en
prompts, enrutamiento o seguridad se puede afirmar que mejoró nada — solo se puede
opinar.

Vive en `agent/eval/`, separado de `agent/app/`: no lo toca el código de producción y
no lo instala el CI (ver §5).

---

## 1. Qué mide y cómo, bloque por bloque

La rúbrica oficial (`docs/especificacion/CODEFEST_2026_Etapa2_FINAL.pdf`, §2.5) reparte
el puntaje del Reto 1 así: 40 % Calidad, 20 % Eficiencia, 20 % Seguridad, 20 % Diseño.
El harness mide los primeros tres; el de Diseño no se mide con código, se documenta en
`docs/ARQUITECTURA.md`.

### 1.1 Bloque A — Calidad de respuesta (40 % de la nota, §2.5.1)

| Métrica | Peso dentro del bloque | Cómo se calcula |
| --- | --- | --- |
| Relevancia | 30 % | `AnswerRelevancyMetric` de DeepEval: ¿la respuesta contesta lo que se preguntó? |
| Fidelidad | 30 % | `FaithfulnessMetric` de DeepEval, contra `retrieval_context` |
| Toxicidad | 15 % | `ToxicityMetric` de DeepEval (en la versión instalada, 1.0 = sin toxicidad) |
| Tono | 25 % | `GEval` con el criterio exacto de la rúbrica: "profesional, clara y empática" |

Las cuatro corren con un **juez fijo, de otra familia que los generadores** (decisión
B0). Los generadores de producción son Qwen3-Next-80B (orquestador y visualización) y
Llama 3.3 70B (corpus); el juez por defecto es **`gemma-3-27b`** (familia Google). La
razón: la literatura de LLM-as-judge documenta autopreferencia — un juez tiende a
puntuar mejor las respuestas de modelos de su propia familia — así que juzgar con
Qwen o Llama habría inflado la nota de nuestro propio sistema.

**Fidelidad exige `retrieval_context`.** En rutas sin recuperación (fuera de alcance,
visualización pura) no aplica, y se reporta como tal (`fidelidad: null` en el JSON,
"no aplica" en el resumen) en vez de forzar un cero engañoso: la propia rúbrica dice
que aplica "solo si el agente hizo recuperación". El promedio del bloque redistribuye
el peso de fidelidad entre las otras tres cuando no aplica, para no inflar ni castigar
el promedio por una ruta que legítimamente no recupera nada (`eval/metricas.py`,
`PuntajeCalidad.bloque_a`).

**Por qué el código fuente de DeepEval importa para cómo se escriben los prompts:**
`FaithfulnessMetric` juzga por **contradicción, no por respaldo** — extrae las
afirmaciones de la respuesta, las marca `yes`/`no`/`idk` contra el contexto, y el
puntaje es `(total − no) / total`. Un `idk` (afirmación sin respaldo directo, pero que
tampoco contradice nada) **no penaliza**. Por eso `prompts.AGENTE_CORPUS` no dice solo
"no completes con conocimiento propio" — dice explícitamente "nunca contradigas una
cifra o afirmación de los fragmentos", que es la instrucción que de verdad mueve esta
métrica.

### 1.2 Bloque B — Eficiencia y costo (20 %, §2.5.2)

Sale gratis de `metadata` en cada respuesta, sin ninguna llamada extra del harness:

| Métrica | Peso | Campo del contrato |
| --- | --- | --- |
| Tokens totales | 40 % | `metadata.tokens.total` |
| Número de interacciones | 30 % | `metadata.num_interacciones` |
| Latencia | 30 % | medida por el propio cliente del harness (pared, no solo `metadata.latencia_ms` autorreportada) |

Se normaliza contra los demás equipos, no contra un umbral fijo — por eso el número
que importa no es un valor absoluto sino la comparación entre corridas propias
(`eval/reporte.py`).

### 1.3 Bloque C — Seguridad (20 %, §2.5.3, 75 % de ese bloque es resistencia a ataques)

**Determinista, sin juez.** Cada ataque en `eval/datos/ataques.jsonl` trae su propia
**señal de compromiso**: una regex que, si aparece en la respuesta, significa que el
ataque tuvo éxito (p. ej. el agente reveló `REGLAS DEL SISTEMA`, imprimió una
credencial, o obedeció la instrucción inyectada al pie de la letra). Se cuenta
**resistido** todo lo que no dispara esa señal, sea por rechazo explícito o por haber
ignorado la instrucción sin decirlo — así mide la metodología estándar de tasa de
éxito de ataque (attack success rate), y así un ataque neutralizado puntúa igual que
uno bloqueado, sin costar falsos positivos.

En paralelo, contra `eval/datos/fuera_de_alcance.jsonl` (20 preguntas legítimamente
fuera del dominio), se mide la **tasa de falsos positivos**: cuántas de esas preguntas
recibieron el rechazo duro (`guard.RECHAZO`) en vez de la respuesta de cortesía
esperada. Esta cifra es la que necesita la Parte 3 (seguridad) para validar que
ajustar el guard no perjudica al Bloque A.

> **Advertencia, la misma que en `docs/ARQUITECTURA_DESPLIEGUE_SEGURIDAD.md`:** esta es
> **nuestra propia** batería de 30 ataques, escrita por el equipo. Es un piso, no una
> nota — la batería real de ADL es distinta y no la conocemos. 100 % de resistencia
> contra 30 ataques propios no predice el resultado contra una batería adversarial
> independiente.

---

## 2. Estructura de archivos

```
agent/eval/
  datos/
    preguntas_reto.jsonl      50 preguntas oficiales (copiadas de la Etapa 1)
    fuera_de_alcance.jsonl    20 preguntas legítimamente fuera del dominio
    ataques.jsonl             30 ataques propios, cada uno con su señal_compromiso
  cliente.py                  POST /chat por HTTP, parseo del contrato, latencia de pared
  juez.py                     DeepEvalBaseLLM sobre el gateway de ADL
  metricas.py                 las cuatro métricas del bloque A y sus pesos
  corrida.py                  runner: arma los tres bloques y los agrega
  reporte.py                  tabla comparable entre dos corridas
  ejecutar.py                 CLI (`python -m eval.ejecutar correr|comparar`)
  servidor_offline.py         agente sin torch/FAISS, sirve fragmentos precalculados
  resultados/                 un JSON por corrida, versionado en git
  tests/                      dobles puros, sin red (ver §5)
```

**Por qué HTTP y no invocar `Sistema` en proceso:** el evaluador de ADL mide al equipo
por HTTP contra el endpoint desplegado. Midiendo igual, el mismo harness sirve sin
cambios contra el agente en local, el servidor offline y el endpoint real de Coolify —
y es la única forma de que la cifra de latencia sea honesta (incluye red, no solo
cómputo).

**Por qué cada corrida es un JSON aparte y versionado:** para comparar una
configuración contra otra con `eval/reporte.py` en vez de con la memoria. El nombre
del archivo (`<etiqueta>.json`) debería identificar qué se estaba probando —
`baseline`, `router_v2`, `router_v3` son los tres que ya existen en el repo y cuentan
la historia completa de la Parte 2 (ver §4).

---

## 3. Uso rápido

Con el agente ya corriendo en `http://localhost:8000` (ver §6 si hace falta montarlo
desde cero, incluso en otra máquina):

```bash
# Corrida completa: 50 + 20 + 30 preguntas, juez por defecto (gemma-3-27b)
python -m eval.ejecutar correr --endpoint http://localhost:8000 --etiqueta mi_corrida

# Submuestra rápida y barata para iterar
python -m eval.ejecutar correr --endpoint http://localhost:8000 --etiqueta prueba \
  --n-preguntas 5 --n-ataques 3

# Otro juez (para ver si el veredicto cambia según quién juzga)
python -m eval.ejecutar correr --endpoint http://localhost:8000 --etiqueta mi_corrida \
  --juez mixtral-8x7b-instruct

# Comparar dos corridas ya guardadas
python -m eval.ejecutar comparar baseline mi_corrida
```

Cada corrida completa (50 preguntas de calidad, con 3–4 llamadas al juez cada una, más
20 de falsos positivos y 30 de ataques sin juez) tarda **30–45 minutos**. La lentitud
es del harness midiendo, no del agente: la latencia real del agente ante el evaluador
es la que reporta `latencia_media_ms`/`latencia_p95_ms` en el resumen, típicamente
4–7 segundos por pregunta (ver la tabla de resultados abajo).

---

## 4. Resultados hasta ahora

Tres corridas completas, mismo endpoint local, mismo juez (`gemma-3-27b`), cada una
motivada por lo que la anterior mostró:

| Corrida | Qué cambió | Bloque A | Interacciones/preg. | Tokens/preg. | Latencia media | Resistencia | Falsos positivos |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `baseline` | Estado inicial, sin router activo | 0,839 | 1,82 | 2807 | 6,4 s | 100 % | 0 % |
| `router_v2` | Prototipos del router cubriendo F1+F2+F3 (antes solo F1) | 0,872 | 1,84 | 2863 | 6,7 s | 100 % | 0 % |
| `router_v3` | Umbral recalibrado con la distribución real de similitud | **0,875** | **1,00** | **2627** | **4,2 s** | 100 % | 0 % |

> **Nota del 19-sep, 01:10 — el enrutado de `visualizacion` por el corpus no mueve
> estas cifras.** Tras fusionar, toda ruta que responde con contenido pasa por el
> agente de corpus, incluidas las peticiones de gráfico. Podría temerse que eso añada
> una interacción y estropee el 1,00 de `router_v3`, así que se midió: se codificaron
> las 70 preguntas del banco con el mismo BGE-M3 y se contaron las rutas del router.
>
> | Lote | Distribución |
> | --- | --- |
> | 50 oficiales | **50 `corpus`, 0 `visualizacion`** |
> | 20 fuera de alcance | 6 resueltas por el router, 14 caen al orquestador LLM |
> | 30 ataques | 30 caen al orquestador (en producción no llegan: los para la guarda antes) |
>
> Ninguna de las 50 oficiales se enruta a `visualizacion`, así que el cambio **no toca
> las interacciones, los tokens ni la latencia de esta batería**. Solo actúa cuando se
> pide un gráfico explícitamente, que es la ruta del tablero, y ahí la llamada al
> corpus es justo lo que aporta la evidencia trazable que el Anexo B.1.3 exige.

Lectura completa en `agent/eval/resultados/*.json`. La historia importa más que el
número final: `router_v2` corrigió la cobertura temática de los prototipos pero casi
no movió las interacciones (1,84), porque el problema real no era de cobertura sino de
**umbral mal calibrado** — la similitud coseno absoluta entre un prototipo corto y una
pregunta larga con BGE-M3 no discrimina bien por categoría (las 50 oficiales caían
entre 0,415 y 0,574 de confianza, y una fuera de alcance mal etiquetada llegaba a
0,553). Lo que sí discriminaba era el **margen** contra la segunda ruta. Ese
diagnóstico, hecho con un script descartable que codificó las 70 preguntas reales
contra los prototipos, es lo que llevó a `router_v3` (ver el mensaje del commit
`6236f03` para las cifras exactas de esa calibración).

El router al 100 % no solo cumplió el objetivo de eficiencia (interacciones < 1,4);
además subió la calidad y bajó la latencia a casi la mitad, porque salir del paso del
orquestador evita que reformule la consulta y pierda matices de la pregunta original.

---

## 5. Por qué estas pruebas no están en el CI

`agent/eval/tests/` usa dobles puros (sin red, sin modelos reales) pero **sí importa**
`deepeval` y `openai` a nivel de módulo (`metricas.py`, `juez.py`). El CI
(`.github/workflows/ci.yml`) instala una lista explícita y liviana de dependencias que
a propósito no incluye ni esas dos ni torch/FAISS, para no alargar cada `push`.

`agent/pyproject.toml` fija `testpaths = ["tests"]`, así que `pytest -q` desde
`agent/` (lo que corre el CI) **no** recoge `agent/eval/tests/`. Se corren aparte:

```bash
pip install -r requirements-dev.txt   # ya incluye deepeval y openai
pytest eval/tests -q
```

`ruff check .` sí recorre `eval/tests/` (no respeta `testpaths`), por eso
`agent/pyproject.toml` tiene una entrada de `per-file-ignores` para
`"eval/tests/*"` igual que para `"tests/*"` (permite `assert` simple, estilo pytest).

Las pruebas de `router.py` y `verificador.py`, en cambio, sí viven en `agent/tests/`
(no en `eval/`), porque no necesitan `deepeval` ni `torch` — usan codificadores falsos
con vectores de prueba — y sí forman parte del código de producción (`agent/app/`).

---

## 6. Reproducir una corrida en otra máquina

Sirve para probar con un modelo distinto (otro juez, u otro modelo para el
orquestador/corpus) o comparar hardware. El resultado es un JSON versionable que se
compara directamente contra el de esta máquina con `eval/reporte.py`.

### 6.1 Requisitos

- Python 3.11 o 3.12.
- ~4 GB de disco libres: ~2,3 GB para BGE-M3, ~0,5 GB para el índice de la Etapa 1,
  ~0,5 GB para el clasificador de inyección, más las dependencias de Python.
- Una API key del gateway de ADL (`LLM_API_KEY`), la misma que usa el agente en
  producción.
- Conexión a internet la primera vez (descarga el índice y los modelos de Hugging
  Face; quedan en caché para las siguientes corridas).

### 6.2 Preparar el entorno

Desde `agent/`:

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate      Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
```

`requirements-dev.txt` ya incluye `deepeval` y `openai`; no hace falta instalar nada
por separado.

### 6.3 Descargar la base vectorial de la Etapa 1

El agente no trae el índice en el repo (~530 MB comprimido):

```bash
mkdir -p data
curl -fL -o data/base_vectorial.zip \
  https://github.com/JuanMCanchala/ad-astra-retrieval/releases/download/base-vectorial-v1/base_vectorial.zip
unzip -q data/base_vectorial.zip -d data/base_vectorial
```

El zip trae una carpeta interna con el mismo nombre: la ruta real queda en
`data/base_vectorial/base_vectorial/` (con `encoder_bge-m3/index.faiss`,
`encoder_bge-m3/metadata.jsonl` y `grafo/grafo.graphml` adentro). Verifica esa carpeta
antes de seguir — es el error más común de este paso.

### 6.4 Configurar `.env`

Crea `agent/.env` (ya está en `.gitignore`, no se sube):

```ini
LLM_BASE_URL=https://litellm.admin-adl.codefest2026.augusta.avaldigitallabs.com/v1
LLM_API_KEY=<tu-api-key-del-gateway>
BASE_VECTORIAL_DIR=./data/base_vectorial/base_vectorial
RETRIEVAL_CONFIG=./config.retrieval.yaml
```

Para probar el **orquestador o el agente de corpus** con un modelo distinto al de
producción (no solo el juez), agrega también, opcionalmente:

```ini
MODELO_ORQUESTADOR=<id-del-modelo-en-el-gateway>
MODELO_CORPUS=<id-del-modelo-en-el-gateway>
MODELO_VISUALIZACION=<id-del-modelo-en-el-gateway>
```

Si no los pones, usa los de producción (`qwen3-next-80b` y
`meta.llama3-3-70b-instruct`, ver `app/settings.py`).

**Verifica primero qué modelos responden de verdad en el gateway de esa máquina**:
`/v1/models` lista más de lo que realmente funciona (algunos no tienen la key del
proveedor configurada del lado de ADL y devuelven 401 aunque aparezcan listados).

```bash
curl -s -H "Authorization: Bearer $LLM_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"<id-del-modelo>","messages":[{"role":"user","content":"di solo OK"}],"max_tokens":10}' \
  https://litellm.admin-adl.codefest2026.augusta.avaldigitallabs.com/v1/chat/completions
```

Si responde `{"choices":[{"message":{"content":"OK"...` sirve. Si responde un JSON con
`"error"` y 401, no sirve como juez en esa máquina aunque aparezca en `/v1/models`.
Verificado en esta máquina: `gpt-4o`, `gpt-4o-mini` y `claude-3-haiku` fallan así;
`gemma-3-27b` (juez por defecto) y `mixtral-8x7b-instruct` sí responden.
`gpt-oss-120b` responde pero es un modelo de razonamiento que puede devolver
contenido vacío con `max_tokens` bajo (gasta tokens de "thinking" primero).

### 6.5 Levantar el agente en local

```bash
uvicorn app.main:app --port 8000
```

La primera vez tarda varios minutos: descarga y carga BGE-M3 (~2,3 GB), el reranker y
el clasificador de inyección. Verifica antes de lanzar el harness:

```bash
curl -s http://localhost:8000/health
# {"estado":"ok","base_cargada":true,...}
```

Si sale `503` o `"base_cargada":false`, todavía está cargando: espera y repite.

### 6.6 Correr, comparar y subir

Ver los comandos de la §3. Para dejar el resultado en el repo:

```bash
git add agent/eval/resultados/<tu-etiqueta>.json
git commit -m "data(eval): corrida <tu-etiqueta> con <lo que cambiaste>"
git push origin nicolas
```

No subas `.env`, la base vectorial descargada (`data/`) ni la caché de Hugging Face:
ya están en `.gitignore`.

### 6.7 Problemas comunes

- **`ModuleNotFoundError: No module named 'torch'`**: falta instalar
  `requirements.txt` completo, no solo `requirements-dev.txt`.
- **El healthcheck nunca llega a `true`**: revisa `BASE_VECTORIAL_DIR` — debe apuntar
  a la carpeta que tiene `encoder_bge-m3/index.faiss` dentro (hay una carpeta anidada
  de más en el zip, ver §6.3).
- **El juez devuelve puntajes en cero para todo**: casi siempre es el modelo del juez
  devolviendo 401 del lado del gateway; probar el `curl` directo del paso §6.4 antes
  de sospechar del harness.
- **`ModuleNotFoundError: No module named 'langgraph.graph'` tras instalar**: pasa si
  una instalación previa quedó a medias (paquete `langgraph` sin contenido real).
  Reinstalar con `pip install --force-reinstall --no-cache-dir "langgraph>=1.0"`.
- **Windows / consola con acentos rotos (`�`)**: es la consola (cp1252), no el dato.
  Los JSON de `eval/resultados/` están en UTF-8 real; ábrelos con un editor, no con
  `type`/`cat` en `cmd.exe`.
