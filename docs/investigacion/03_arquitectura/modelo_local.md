# Modelo de lenguaje LOCAL para el asistente multiagente con RAG

Investigación del 18-sep-2026 para la final del CODEFEST AD ASTRA 2026 (Fuerza Aeroespacial
Colombiana). El objetivo es elegir el LLM que genera las respuestas y hace de agente (enrutador,
redactor, verificador) sobre la base vectorial de la Etapa 1, **corriendo 100 % en el portátil del
equipo**. Es un argumento fuerte ante el jurado porque los datos de defensa no salen de la máquina.

**Hardware real (verificado con `nvidia-smi` y `ollama list` el 18-sep-2026):** NVIDIA GeForce
RTX 4060 Laptop GPU con 8188 MiB y driver 576.52, 32 GB de RAM, Intel i9-13980HX y Windows 11.
Ollama 0.32.11 ya tiene `phi4-mini:3.8b`, `phi3.5:3.8b-mini-instruct-q4_K_M` y `llama3.2:1b`.

**Restricciones:**

- El equipo se calienta: la Etapa 1 llegó a 83 °C, según `ANDES/README.md`.
- La VRAM se comparte con BGE-M3 (encoder) y `BAAI/bge-reranker-v2-m3` (cross-encoder), que están
  en `ANDES/src/retrieval/rerank.py`.

**Convenciones:**

- **[Fabricante]** es una cifra publicada por quien hizo el modelo.
- **[Independiente]** es una prueba de un tercero.
- **[Estimación propia]** es un cálculo nuestro, que siempre dice cómo se hizo.
- **"Por verificar"** marca un dato que no pudimos confirmar.

---

## 0. Recomendación en una tabla

| Rol                                          | Modelo                                                                                                                      | Runtime                      | Por qué                                                                                                                                                                                                                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Principal (redacción RAG + tool calling)** | **Qwen3.5-9B** (`qwen3.5:9b`, Q4_K_M)                                                                                       | Ollama                       | Tiene la mejor relación entre calidad, tool calling y español que cabe de forma realista en 8 GB. Es Apache 2.0 y cubre 201 idiomas. BFCL-V4 66,1, TAU2 79,1 y MMMLU 81,2 **[Fabricante]**. Además es la recomendación independiente más repetida para 8 GB |
| **Enrutador / verificador**                  | **El mismo Qwen3.5-9B** con otro prompt y salida JSON Schema. El verificador de grounding sigue siendo `bge-reranker-v2-m3` | Ollama                       | Con 8 GB, cargar **dos** LLM a la vez provoca intercambio de VRAM y calor. "Varios agentes" significa varios roles/prompts, no varios pesos                                                                                                                 |
| **Fallback 1 (local, más ligero)**           | **Qwen3.5-4B** (`qwen3.5:4b`, 3,4 GB)                                                                                       | Ollama                       | Cabe junto a BGE-M3 y el reranker en GPU. BFCL-V4 50,3 **[Fabricante, por verificar]**                                                                                                                                                                      |
| **Fallback 2 (ya instalado, 0 descargas)**   | `phi4-mini:3.8b`                                                                                                            | Ollama                       | Ya está en el equipo. Sirve como salvavidas si falla la red de la sede                                                                                                                                                                                      |
| **Experimental ("wow" del pitch)**           | **Ternary Bonsai 2 27B** (PrismML)                                                                                          | Fork de llama.cpp de PrismML | Es un 27B en 5,93 GB. Pero salió el 17-sep-2026, necesita un fork, no corre en Ollama, no tiene pruebas independientes de agentes y no está evaluado en español. **No debe ser la base de la demo.** Ver §1                                                 |
| **Fallback 3 (nube)**                        | Solo si el jurado lo permite y **con datos no sensibles**                                                                   | API compatible OpenAI        | Un interruptor `LLM_BASE_URL` en la configuración. Rompe el argumento de soberanía, así que es el último recurso                                                                                                                                            |

---

## 1. Ternary Bonsai 2 27B (PrismML): análisis a fondo

Fuentes primarias:

- Anuncio: https://prismml.com/news/bonsai-2-27b
- Tarjeta GGUF: https://huggingface.co/prism-ml/Ternary-Bonsai-2-27B-gguf
- Colección: https://huggingface.co/collections/prism-ml/bonsai-2
- Repo demo y whitepaper: https://github.com/PrismML-Eng/Bonsai-demo/ (el whitepaper es
  `bonsai-2-27b-whitepaper.pdf`)
- Documentación: https://docs.prismml.com/bonsai-2-27b.md, https://docs.prismml.com/download/formats.md
  y https://docs.prismml.com/resources/troubleshooting.md

### 1.1 Qué es

- Es una **compresión post-entrenamiento de Qwen3.8-27B**, no un modelo entrenado desde cero. Qwen3.8-27B
  es denso, multimodal, Apache 2.0, con contexto nativo de 262K y salió el 14-ago-2026, según
  https://huggingface.co/Qwen/Qwen3.8-27B y https://www.yottalabs.ai/post/qwen-3-8-27b-specs-hardware-requirements-how-to-run-2026.
  La tarjeta de PrismML dice que la arquitectura queda "sin cambios".
- **Arquitectura heredada:** 27,36B parámetros en total (24,35B de backbone de lenguaje, 2,54B de
  embeddings/cabeza y 0,46–0,47B de visión). Usa atención híbrida, con cerca del 75 % lineal
  (Gated DeltaNet) y cerca del 25 % atención completa, además de SwiGLU, RoPE y RMSNorm **[Fabricante]**.
- **Fecha de publicación:** 17-sep-2026, es decir, **ayer**.
- **Licencia:** Apache 2.0.

### 1.2 Cuantización: ¿1 bit o ternario?

Es **ternario**: los pesos valen {−1, 0, +1} y cada grupo de 128 pesos comparte una escala FP16
("ternary g128"). Antes de cuantizar aplican una rotación de Hadamard por bloques, que ya queda
dentro de los pesos. Por eso el runtime tiene que aplicar una transformada de Walsh–Hadamard, y
**por eso no corre en llama.cpp estándar**.

Hay dos empaquetados GGUF **[Fabricante]**:

| Formato                              | bpw real | Tamaño       | Nota                                                                                              |
| ------------------------------------ | -------- | ------------ | ------------------------------------------------------------------------------------------------- |
| `PTQ1_0` (trits densos)              | 1,75     | 5,93–5,95 GB | Según la tarjeta HF, **es el que decodifica más rápido en GPUs Ada (la RTX 4060 es Ada)** y en L4 |
| `PQ2_0` (un trit por slot de 2 bits) | 2,13     | 7,21–7,25 GB | Más rápido en H100/A100/Blackwell                                                                 |
| F16 (referencia)                     | 16       | 53,8 GB      | —                                                                                                 |

Los bpw no coinciden entre fuentes:

- El anuncio dice "1,76 bits efectivos".
- MarkTechPost dice 1,71.
- La tarjeta HF dice 1,75.

La diferencia es menor, pero muestra que las cifras aún no están consolidadas. También existe
`Ternary-Bonsai-2-27B-mlx-2bit` para Apple y una demo WebGPU en
https://huggingface.co/spaces/webml-community/ternary-bonsai-2-webgpu-kernels.

### 1.3 Benchmarks publicados (todos **[Fabricante]**, sin reproducción independiente)

Los números del anuncio y los de la tarjeta HF **no cuadran entre sí**:

- El anuncio y MarkTechPost dan 83,9 frente a 85,4 del Qwen3.8-27B base, sobre 20 benchmarks.
- La tarjeta HF, en modo thinking, da 84,78 frente a 86,32 del FP16.

Ambos dicen "98,2 % de retención".

| Categoría                                     | Qwen3.8-27B                 | Bonsai 2 27B      | Retención | Fuente                  |
| --------------------------------------------- | --------------------------- | ----------------- | --------- | ----------------------- |
| Global (20 benchmarks)                        | 85,4                        | 83,9              | 98,2 %    | Anuncio / MarkTechPost  |
| Conocimiento y razonamiento                   | 86,66 (85,55 en otra tabla) | 83,95 (79,86)     | 96,9 %    | MarkTechPost / GIGAZINE |
| Matemáticas                                   | 97,06                       | 96,57             | 99,5 %    | Anuncio                 |
| Código                                        | 82,17                       | 81,58             | 99,3 %    | Anuncio                 |
| Seguimiento de instrucciones                  | 81,25                       | 82,66             | 101,7 %   | Anuncio                 |
| **Agentes y tool calling** (τ²-bench, BFCLv3) | 79,74 (76,74 en otra tabla) | **77,57 (74,92)** | 97,3 %    | Anuncio / GIGAZINE      |
| Visión                                        | 81,64                       | 78,59             | 96,3 %    | Anuncio                 |

La comparación con otras cuantizaciones del mismo modelo está en la tarjeta HF: UD-Q4_K_XL ocupa
17,6 GB y logra 85,18, e IQ2_XXS ocupa 9,4 GB y logra 72,59. Bonsai logra 84,78 en 5,9 GB. **Si se
confirma, este es el dato más interesante: a igual tamaño, supera con mucha diferencia a las
cuantizaciones de 2 bits convencionales.**

**Advertencias** de https://www.marktechpost.com/2026/09/18/prismml-releases-ternary-bonsai-2-27b-a-5-9-gb-apache-2-0-model-retaining-98-2-of-qwen3-8-27b-performance/:

- Las tareas agénticas de horizonte largo pierden mucho. Terminal-Bench 2.1 cae de 69,7 a 52,8,
  una retención del 75 %. SWE-bench Verified cae de 80,6 a 60,8.
- No admite el modo de razonamiento "low effort".
- Los resultados son **de PrismML y no están reproducidos**.

### 1.4 Español

**No hay ninguna evaluación multilingüe ni en español publicada para Bonsai 2.** Hereda el
tokenizer y el preentrenamiento de Qwen3.8, que es fuertemente multilingüe. Pero la cuantización
ternaria suele degradar más las lenguas con menos peso en la calibración, y conocimiento/razonamiento
ya pierde entre 3 y 6 puntos. **Por verificar con el mini-benchmark del §5.**

### 1.5 Tool calling y contexto

- Tiene tool calling nativo con formato OpenAI (array `tools`) a través de `llama-server` del fork,
  que expone una API compatible con OpenAI en `:8080` con visión, herramientas y control de esfuerzo
  de razonamiento, según https://github.com/PrismML-Eng/Bonsai-demo/.
- El contexto nominal es de 262K, pero ver la memoria en §1.7.
- dev.to (https://dev.to/jamilxt/bonsai-2-27b-puts-a-27b-ai-model-in-59gb-can-it-replace-your-paid-subscription-54ol)
  advierte: "nobody has published independent agentic-harness numbers for Bonsai 2 yet… wait for
  independent results".

### 1.6 Cómo se ejecuta

| Runtime                          | ¿Corre Bonsai 2 27B?                                                                                                                                                  | Fuente                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| llama.cpp estándar (ggml-org)    | **No**. La documentación dice: "Do not run Ternary Bonsai 2 on stock llama.cpp"                                                                                       | docs.prismml.com/download/formats.md              |
| **Fork `PrismML-Eng/llama.cpp`** | **Sí**. Release `prism-b10709-9a9394a` del 18-sep-2026 con binarios **Windows x64 CUDA 12.4 / CUDA 12.8**, CPU y Vulkan. El driver 576.52 del equipo admite CUDA 12.8 | https://github.com/PrismML-Eng/llama.cpp/releases |
| Ollama                           | **No**. La documentación dice: "current Ollama releases, cannot run Ternary Bonsai 2"                                                                                 | formats.md                                        |
| LM Studio                        | Solo MLX en Mac, **no en Windows**                                                                                                                                    | https://docs.prismml.com/integrations/lmstudio.md |
| MLX                              | Sí, en MLX estándar, pero solo en Apple                                                                                                                               | formats.md                                        |
| vLLM                             | No documentado                                                                                                                                                        | —                                                 |

### 1.7 ¿Cabe y rinde en 8 GB de VRAM + 32 GB de RAM?

**Datos del fabricante:**

- El KV cache de la versión 27B ocupa **64 KiB por token** (en f16). `q8_0` lo reduce a la mitad
  aproximadamente y `BONSAI_KV4=1` lo reduce unas 3,5 veces. `BONSAI_MMPROJ_CPU=1` libera unos
  0,9 GiB, porque saca el proyector de visión de la GPU.
- El repo demo da el consumo total de VRAM en solo texto: **~7,8–8,6 GB con 4K de contexto** y
  ~13,7–14,4 GB con 100K.
- Velocidad de decodificación (TG128):

  | GPU          | Formato | tok/s     |
  | ------------ | ------- | --------- |
  | RTX 5090     | PQ2_0   | 129,9–143 |
  | RTX 4090     | PTQ1_0  | 96,7      |
  | RTX 6000 Ada | PTQ1_0  | 90,4      |
  | L4 (72 W)    | —       | 32,1      |

  **No hay datos para la RTX 4060 ni para GPUs de 8 GB.**

**[Estimación propia] de memoria:**

- 5,93 GB de pesos (PTQ1_0)
- \+ 0,5 GiB de KV con 8K en f16, o ~0,25 GiB con q8_0
- \+ buffers de cómputo y contexto CUDA, entre ~0,5 y 1 GB (por verificar)
- = **~6,7–7,5 GB**

Esto **solo cabe si la GPU queda libre para Bonsai**, con BGE-M3 y el reranker en CPU, sin visión
y sin nada más en la GPU. Windows además reserva parte de los 8188 MiB. Queda **muy justo**.

No está documentado si los kernels ternarios tienen buena ruta de CPU para offload parcial con
`-ngl < 99`. Hay binario CPU, pero no hay cifras. **Por verificar.**

**[Estimación propia] de velocidad:** la decodificación a batch 1 está limitada por el ancho de
banda de memoria. La RTX 4060 Laptop tiene unos 256 GB/s y la RTX 4090 unos 1008 GB/s. Escalando
los 96,7 tok/s de la 4090 salen **~20–25 tok/s**. Es una cota optimista, sin medir, y además un
portátil que se calienta baja de reloj. **Por verificar con el §5.**

**La prueba independiente más cercana ni siquiera es de Bonsai 2:**

- Kubesimplify (https://blog.kubesimplify.com/bonsai-27b-rtx-pro-6000-dgx-spark, 16-jul-2026)
  midió el **Bonsai 27B de primera generación**: 120,7 tok/s ternario y 145,5 tok/s en 1 bit en
  una RTX PRO 6000. La versión de 1 bit "agotó el presupuesto de tokens" en una tarea de código.
- GIGAZINE (https://gigazine.net/gsc_news/en/20260918-bonsai-2-27b/) cita que el Bonsai 27B original
  se probó en un portátil con GPU de 8 GB. No hay cifras de Bonsai 2 en 8 GB.

### 1.8 Veredicto sobre Bonsai 2

- **A favor:**
  - Es la mayor capacidad por GB disponible hoy: un 27B de clase frontera en 5,9 GB.
  - Tiene Apache 2.0, tool calling nativo y una API OpenAI desde `llama-server`.
  - Tiene binarios Windows CUDA.
  - Es un titular excelente para el pitch ("27B soberano en un portátil").
- **En contra, y hoy es decisivo:**
  - Tiene **un día de vida**.
  - Depende de un **fork**, así que Ollama no sirve.
  - **No hay pruebas independientes** de agentes ni de español.
  - Las tareas agénticas largas caen al 75 % de retención.
  - En 8 GB **obliga a sacar BGE-M3 y el reranker de la GPU**, y quedaría al límite, con riesgo
    de OOM en plena demo.
  - Una carga GPU sostenida al 100 % choca con la restricción térmica.
- **Decisión:** usarlo como **experimento opcional**. Si el mini-benchmark del §5 muestra que corre
  estable con 8K de contexto y más de 15 tok/s con los encoders en CPU, puede ir como "modo alta
  calidad" conmutable (misma API OpenAI, otro `base_url`). **La demo base debe correr en Ollama
  con Qwen3.5.**

---

## 2. Alternativas locales viables en RTX 4060 8 GB (septiembre 2026)

**Presupuesto de VRAM [Estimación propia]:**

| Elemento                                  | VRAM          |
| ----------------------------------------- | ------------- |
| Total                                     | 8,0 GB        |
| Windows / pantalla                        | −0,3 a 0,5 GB |
| BGE-M3 en fp16 (568M parámetros, ~1,1 GB) | −1,1 GB       |
| bge-reranker-v2-m3 en fp16 (~1,1 GB)      | −1,1 GB       |
| Contextos CUDA de PyTorch                 | −0,3 a 0,5 GB |
| **Queda para el LLM**                     | **~4,5–5 GB** |

Si BGE-M3 (solo codifica la consulta, que es corta) pasa a CPU, se liberan ~1,1 GB y el LLM tiene
**~6 GB**.

| Modelo                          | Tamaño / VRAM en Q4                                                                                       | Español / multilingüe                                          | Tool calling                                                                                                                                         | Contexto    | Licencia   | Encaje en 8 GB compartidos                                                                                                                                                                                                                                                                           | Fuente                                                                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Qwen3.5-9B**                  | 6,6 GB con la etiqueta de Ollama (incluye visión) y ~5,1–5,7 GB en GGUF Q4_K_M                            | 201 idiomas. MMMLU 81,2, MMLU-ProX 76,3 y WMT24++ 72,6 **[F]** | BFCL-V4 66,1, TAU2 79,1 e IFEval 91,5 **[F]**. Es "la recomendación para 8 GB" en InsiderLLM y betterclaw **[I, cualitativo]**                       | 262K nativo | Apache 2.0 | **Sí**, con BGE-M3 en CPU o con 1–4 capas en CPU                                                                                                                                                                                                                                                     | https://huggingface.co/Qwen/Qwen3.5-9B, https://ollama.com/library/qwen3.5/tags, https://insiderllm.com/guides/function-calling-local-llms/     |
| **Qwen3.5-4B**                  | 3,4 GB (Ollama)                                                                                           | MMMLU 76,1 y MMLU-ProX 71,5 **[F]**                            | BFCL-V4 50,3 e IFEval 89,8 **[F, por verificar]**                                                                                                    | 262K        | Apache 2.0 | **Sí, holgado**, junto a los encoders en GPU                                                                                                                                                                                                                                                         | Las mismas                                                                                                                                      |
| **Gemma 4 12B** (jun-2026)      | 7,6 GB (Ollama) y ~6,6 GB Q4_K_M (QAT)                                                                    | 140+ idiomas y MMMLU 83,4 **[F]**                              | Tool calling nativo y Tau2 69,0 **[F]**. Con Gemma 4 conviene desactivar thinking para que las tool calls no terminen en `reasoning_content` **[I]** | 256K        | Apache 2.0 | **Justo**: exige sacar ambos encoders de la GPU                                                                                                                                                                                                                                                      | https://huggingface.co/google/gemma-4-12B-it, https://ollama.com/library/gemma4/tags, https://www.betterclaw.io/blog/gemma-4-12b-vs-qwen-3-5-9b |
| Gemma 4 E4B                     | 9,6 GB con la etiqueta `e4b` por defecto de Ollama, que incluye audio y visión. `e2b-it-qat` ocupa 4,3 GB | 140+ idiomas                                                   | Nativo                                                                                                                                               | 128K        | Apache 2.0 | Sí, con la variante QAT (tamaño exacto de E4B QAT por verificar)                                                                                                                                                                                                                                     | https://ollama.com/library/gemma4/tags                                                                                                          |
| Qwen3.6-35B-A3B (MoE)           | 23 GB (Ollama) y 22,1 GB UD-Q4_K_M                                                                        | Alto                                                           | El mejor de esta lista, con parser `qwen3_coder` **[I]**                                                                                             | 256K        | Apache 2.0 | Solo con `--n-cpu-moe` y los expertos en RAM. En una RTX 3060 de 12 GB da ~38 tok/s **medidos [I]**. Un post dice 33–34 tok/s en **RTX 4060 Laptop 8 GB + 32 GB + Win11**, pero usa un fork con "mecanismo no divulgado", así que es de **baja credibilidad**. Usa ~20 GB de RAM y mucha CPU (calor) | https://insiderllm.com/guides/best-way-run-qwen-3-6-35b-moe-locally/, https://huggingface.co/Qwen/Qwen3.6-35B-A3B/discussions/58                |
| GPT-OSS-20B (MoE, MXFP4)        | ~13 GB de pesos                                                                                           | Correcto, centrado en inglés                                   | Bueno                                                                                                                                                | 128K        | Apache 2.0 | En 8–12 GB hace falta offload de CPU y se queda en "30 tok/s o peor" **[I]**                                                                                                                                                                                                                         | https://runaihome.com/blog/gpt-oss-20b-local-ai-hardware-guide-2026/, https://github.com/ggml-org/llama.cpp/discussions/15396                   |
| Ministral 3 8B / 14B (dic-2025) | GGUF de terceros disponibles (tamaños por verificar)                                                      | Español explícito entre sus idiomas **[F]**                    | Function calling nativo con el parser `mistral` en vLLM **[F]**                                                                                      | 256K        | Apache 2.0 | El 8B sí cabe. El 14B no cabe con los encoders                                                                                                                                                                                                                                                       | https://huggingface.co/mistralai/Ministral-3-14B-Instruct-2512                                                                                  |
| Phi-4-mini 3.8B                 | 2,5 GB (**ya instalado**)                                                                                 | Más débil en español (sin cifra verificada)                    | "Predecible" para JSON y herramientas **[I, cualitativo]**                                                                                           | 128K        | MIT        | Sí                                                                                                                                                                                                                                                                                                   | https://www.mayhemcode.com/2026/06/best-local-llms-for-4gb-6gb-and-8gb.html                                                                     |
| Qwen3.6-27B / Qwen3.8-27B denso | 17–18 GB en Q4                                                                                            | Muy alto                                                       | Muy bueno                                                                                                                                            | 256K        | Apache 2.0 | **No** en Q4. Solo en su forma Bonsai (§1)                                                                                                                                                                                                                                                           | https://ollama.com/library/qwen3.6/tags                                                                                                         |

**[F]** = fabricante y **[I]** = independiente.

**Notas:**

- Todavía no hay Qwen3.6/3.8 en tamaños de menos de 27B. Qwen3.6-9B está pedido pero no publicado:
  https://github.com/QwenLM/Qwen3.8/discussions/156.
- No encontramos un leaderboard **específico de español** actualizado a 2026 con estos modelos. Las
  métricas multilingües de la tabla (MMMLU, MMLU-ProX) son del fabricante. **La calidad en español
  hay que medirla con nuestras preguntas** (§5).
- La tabla de BFCL v4 de ertas.ai **no** se usa: el propio artículo dice que son "rangos
  ilustrativos sintetizados", no mediciones.

---

## 3. Runtime y serving

| Criterio                         | **Ollama 0.32.11** (instalado)                                                                                                                                                       | llama.cpp `llama-server`                                    | LM Studio           | vLLM                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows nativo                   | Sí                                                                                                                                                                                   | Sí (binarios CUDA)                                          | Sí                  | **No oficial**. Opciones: WSL2, Docker Model Runner o el fork comunitario `SystemPanic/vllm-windows` ([fazm.ai](https://fazm.ai/t/vllm-windows-support-2026)) |
| API compatible OpenAI            | `/v1/chat/completions`, además de la API nativa `/api/chat`                                                                                                                          | `/v1/chat/completions`                                      | Sí (servidor local) | Sí                                                                                                                                                            |
| Tool calling                     | Sí (`tools`)                                                                                                                                                                         | Sí, con `--jinja`                                           | Sí                  | Sí, con `--enable-auto-tool-choice --tool-call-parser ...`                                                                                                    |
| Structured outputs / JSON Schema | Sí: `format: <schema>` en `/api/chat` ([docs](https://docs.ollama.com/capabilities/structured-outputs))                                                                              | Sí: `response_format` con `json_schema` y gramáticas GBNF   | Sí                  | Sí (guided decoding)                                                                                                                                          |
| Offload CPU/GPU                  | Automático, más `num_gpu` (número de capas)                                                                                                                                          | `-ngl`, `--n-cpu-moe`, `-ot` (control fino, ideal para MoE) | Deslizador de capas | Limitado. La PagedAttention reserva mucha VRAM, lo que es malo con 8 GB                                                                                       |
| Concurrencia                     | `OLLAMA_NUM_PARALLEL` (por defecto 1; **la memoria escala con NUM_PARALLEL × contexto**), `OLLAMA_MAX_LOADED_MODELS` y `OLLAMA_MAX_QUEUE` (512) ([FAQ](https://docs.ollama.com/faq)) | `--parallel N` (el contexto se reparte entre slots)         | Básica              | La mejor (continuous batching), pero no merece la pena con 8 GB                                                                                               |
| Bonsai 2                         | **No**                                                                                                                                                                               | **Solo el fork de PrismML**                                 | No en Windows       | No                                                                                                                                                            |
| Riesgo el día de la final        | **Mínimo**: ya está instalado y probado                                                                                                                                              | Bajo, pero hay que integrarlo                               | Medio               | **Alto**                                                                                                                                                      |

**Decisión:**

- **Ollama** es el servidor principal. Usaremos la API nativa `/api/chat` porque devuelve
  `eval_count` y `eval_duration` para medir, o `/v1` si el framework de agentes espera OpenAI.
- **`llama-server` del fork de PrismML** solo si se prueba Bonsai.

Como ambos exponen una API OpenAI, el código de agentes debe leer `LLM_BASE_URL` y `LLM_MODEL` de
la configuración para poder cambiar sin tocar código.

**Actualizar Ollama a 0.34.2:**

- **No hace falta para la final.**
- Los cambios de la 0.33 a la 0.34.2 se centran en MLX/Apple, en integrar ChatGPT Desktop y en la
  búsqueda de herramientas del cliente OpenAI
  ([releases](https://github.com/ollama/ollama/releases), [0.34.2](https://freedom.tech/posts/2026-09-15-ollama-0-34-2/)).
- Un detalle: la 0.34 **respeta los parámetros por defecto del GGUF**, como temperatura y contexto,
  y eso puede cambiar el comportamiento.
- Actualizar un runtime el día de la demo es riesgo sin beneficio. Solo conviene si `qwen3.5` falla
  al cargar en la 0.32.11 (por verificar con el §5).

**Cómo convivir con BGE-M3 y el reranker en la misma GPU:**

1. Poner `OLLAMA_MAX_LOADED_MODELS=1` para que nunca haya dos LLM en VRAM. Los roles de agente
   comparten el mismo modelo.
2. Poner `OLLAMA_NUM_PARALLEL=1`. En un pipeline de agentes secuencial (enrutador → recuperación →
   redactor → verificador) el paralelismo solo multiplica el KV. Como mucho, 2 si la GUI lanza el
   agente de gráficos (Reto 2) a la vez.
3. Poner `OLLAMA_FLASH_ATTENTION=1` y `OLLAMA_KV_CACHE_TYPE=q8_0`. Con q8_0 el KV ocupa la mitad.
   **No usar q4_0**, porque según InsiderLLM degrada la precisión de las tool calls.
4. Poner `OLLAMA_KEEP_ALIVE=-1` durante la demo, para no recargar el modelo.
5. **BGE-M3 en CPU para codificar la consulta.** Es una frase corta, así que el costo en el i9 es
   bajo (latencia por verificar). **El reranker en GPU fp16** sobre el top-k, que es donde la GPU
   sí aporta.
   - Si falta VRAM, hay que bajar el top-k del reranker o pasarlo a CPU. La latencia de hacer
     rerank en CPU sobre 20–30 pares está por verificar.
6. Cargar primero los encoders y luego el LLM. Revisar `ollama ps`: la columna PROCESSOR debe decir
   `100% GPU`. Si dice `xx%/yy% CPU/GPU`, el modelo se partió y va más lento.
7. **Térmica:**
   - Respuestas cortas (`num_predict` entre 512 y 768).
   - Contexto de 8K, suficiente para 6–8 fragmentos de ~500 tokens más el historial.
   - Sin thinking en el redactor.
   - Portátil sobre base refrigerada y en modo de energía equilibrado.
   - Evitar el MoE con `--n-cpu-moe`, que pone la CPU al 100 % de forma sostenida.

---

## 4. Estrategia recomendada y configuración concreta

### 4.1 Arquitectura de modelos

Hay 4 roles y 1 solo LLM cargado:

- **Enrutador:** Qwen3.5-9B con `format` JSON Schema `{agente, fenomeno, necesita_grafico}` y
  temperatura 0.
- **Recuperador:** no usa LLM. Es BGE-M3 + FAISS + RRF + el reranker de la Etapa 1, sin cambios.
- **Redactor RAG:** Qwen3.5-9B sin thinking, con temperatura 0,7, top_p 0,8 y top_k 20 (los
  parámetros "non-thinking" de Qwen). Cita los fragmentos con `[F#]`.
- **Verificador:** usa primero el score de `bge-reranker-v2-m3` entre cada frase y el fragmento
  citado, y después, solo si hay duda, una llamada corta al LLM con salida JSON.
- **Agente de gráficos (Reto 2):** Qwen3.5-9B con tool calling (`generar_grafico`).

### 4.2 Configuración (PowerShell, variables de usuario para la aplicación Ollama)

```powershell
# Variables persistentes de usuario; cerrar y reabrir Ollama después (FAQ oficial)
setx OLLAMA_MAX_LOADED_MODELS 1
setx OLLAMA_NUM_PARALLEL 1
setx OLLAMA_FLASH_ATTENTION 1
setx OLLAMA_KV_CACHE_TYPE q8_0
setx OLLAMA_KEEP_ALIVE -1
setx OLLAMA_CONTEXT_LENGTH 8192
# Reiniciar Ollama: cerrar desde la bandeja del sistema y abrirlo de nuevo
```

**Opciones por petición en `/api/chat`:**

```json
{
  "num_ctx": 8192,
  "num_predict": 768,
  "temperature": 0.7,
  "top_p": 0.8,
  "top_k": 20
}
```

- **`num_gpu` (capas a GPU):** dejarlo automático. Solo hay que fijarlo, por ejemplo con
  `"num_gpu": 99`, si `ollama ps` muestra reparto y se quiere forzar todo a GPU tras mover BGE-M3
  a CPU.
- El número de capas de Qwen3.5-9B está **por verificar** con
  `ollama show qwen3.5:9b --modelfile` o con `ollama show qwen3.5:9b`.
- **Cuantización:** Q4_K_M, que es la etiqueta por defecto `qwen3.5:9b`. **No usar Q8**: con 9,6 GB
  no cabe.
- **Thinking:** las variantes pequeñas de Qwen3.5 lo traen desactivado por defecto, según
  [Unsloth](https://unsloth.ai/docs/models/qwen3.5). Hay que pasar `"think": false` explícito
  cuando la plantilla lo admita.

### 4.3 Plan de fallback (en orden)

1. Si `qwen3.5:9b` se reparte entre CPU y GPU o va a menos de 10 tok/s con los encoders cargados,
   mover BGE-M3 a CPU.
2. Si sigue sin ir bien, **`qwen3.5:4b`**, con los mismos prompts y esquemas.
3. **`phi4-mini:3.8b`** (ya descargado) si falla la red de la sede y no se pudo bajar nada.
4. **Nube** (API compatible OpenAI) **solo** con autorización del jurado y sin documentos sensibles.
   Sería un cambio de `LLM_BASE_URL` y `LLM_MODEL`. En el pitch hay que presentarlo como
   "degradación controlada", no como diseño.
5. **Modo "alta calidad" opcional:** Bonsai 2 27B en `llama-server` del fork, en `:8080`, solo si
   el §5 lo valida.

### 4.4 Comandos de instalación (a cargo del equipo; este documento no descargó nada)

**Descargas:** `qwen3.5:9b` pesa 6,6 GB y `qwen3.5:4b` 3,4 GB. Opcionales: `gemma4:12b` (7,6 GB) y
Bonsai (5,95 GB).

```powershell
ollama --version                  # 0.32.11
ollama pull qwen3.5:9b
ollama pull qwen3.5:4b
ollama run qwen3.5:9b "Resume en dos frases qué es la órbita baja terrestre." --verbose   # muestra eval rate (tok/s)
ollama ps                          # PROCESSOR debe decir 100% GPU
nvidia-smi --query-gpu=memory.used,temperature.gpu,power.draw --format=csv -l 2
```

**Bonsai 2 27B (opcional; los nombres exactos de los archivos están por verificar en la página de HF):**

```powershell
git clone https://github.com/PrismML-Eng/Bonsai-demo
cd Bonsai-demo
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1                                     # descarga los binarios del fork (CUDA 12.x) y el modelo
$env:BONSAI_CTX = "8192"; $env:BONSAI_MMPROJ_CPU = "1"   # documentado para .sh; su efecto en .ps1 está por verificar
.\scripts\start_llama_server.ps1                # API OpenAI en http://localhost:8080
```

**Alternativa manual con el binario del fork.** Se usa PTQ1_0 porque es el más rápido en Ada según
la tarjeta HF. El nombre del archivo está por verificar:

```powershell
hf download prism-ml/Ternary-Bonsai-2-27B-gguf Ternary-Bonsai-2-27B-PTQ1_0.gguf --local-dir .
.\llama-server.exe -m Ternary-Bonsai-2-27B-PTQ1_0.gguf -ngl 99 -fa on -c 8192 `
  --cache-type-k q8_0 --cache-type-v q8_0 --jinja --port 8080 --temp 0.7 --top-p 0.8 --top-k 20
```

---

## 5. Mini-benchmark reproducible (~10 min, sin contar descargas)

**Qué mide:**

1. Velocidad: tok/s de generación y de prompt.
2. Español con RAG: si responde con el dato del fragmento correcto y lo cita, y si **se abstiene**
   cuando la respuesta no está.
3. Tool calling: si elige la herramienta correcta y pasa argumentos válidos del enum.
4. Enrutador con JSON Schema: si el JSON es válido y los campos son correctos.
5. VRAM y temperatura antes y después, con `nvidia-smi`.

Los fragmentos son **sintéticos** (datos ficticios a propósito, como el ejercicio "CÓNDOR-7" en 2031) para medir fidelidad al contexto y no conocimiento memorizado.

**Instrucciones:**

- Guardar el script como `bench_llm.py` en una carpeta temporal. **Solo usa la biblioteca estándar
  de Python.**
- **Correrlo con el sistema RAG (BGE-M3 + reranker) cargado**, para medir la VRAM real compartida.

```powershell
python bench_llm.py --models qwen3.5:9b qwen3.5:4b phi4-mini:3.8b
# Bonsai (llama-server del fork en :8080, API OpenAI):
python bench_llm.py --openai http://localhost:8080 --models bonsai
```

```python
#!/usr/bin/env python3
"""Mini-benchmark de LLM local para el asistente RAG (CODEFEST AD ASTRA 2026). Solo stdlib."""
import argparse, json, subprocess, time, urllib.request, urllib.error

FRAGMENTOS = (
    "[F1] La órbita baja terrestre (LEO) concentra la mayor parte de los satélites activos y de la "
    "basura espacial rastreada, lo que eleva el riesgo de colisiones.\n"
    "[F2] (Dato SINTÉTICO de prueba) El ejercicio CÓNDOR-7 se realizó en 2031 en Cali y participaron "
    "42 aeronaves de tres países.\n"
    "[F3] Las dinámicas territoriales en América Latina incluyen migración, economías ilegales y "
    "brechas de desarrollo humano entre regiones."
)
SISTEMA_RAG = (
    "Eres un analista de la Fuerza Aeroespacial Colombiana. Responde SOLO en español y SOLO con la "
    "información de los fragmentos. Cita cada dato con su etiqueta [F#]. Si la respuesta no está en "
    "los fragmentos, responde exactamente: 'No se encuentra en los documentos disponibles.'"
)
TOOLS = [
    {"type": "function", "function": {
        "name": "buscar_documentos",
        "description": "Busca fragmentos en la base vectorial.",
        "parameters": {"type": "object", "properties": {
            "consulta": {"type": "string"},
            "fenomeno": {"type": "string", "enum": ["ia_militar", "seguridad_espacial", "dinamicas_territoriales"]}},
            "required": ["consulta", "fenomeno"]}}},
    {"type": "function", "function": {
        "name": "generar_grafico",
        "description": "Genera una visualización para el análisis.",
        "parameters": {"type": "object", "properties": {
            "tipo": {"type": "string", "enum": ["barras", "lineas", "mapa", "dispersion"]},
            "tema": {"type": "string"},
            "ambito": {"type": "string", "enum": ["global", "regional", "nacional"]}},
            "required": ["tipo", "tema", "ambito"]}}},
]
ESQUEMA_RUTA = {"type": "object", "properties": {
    "agente": {"type": "string", "enum": ["rag", "graficos", "fuera_de_alcance"]},
    "fenomeno": {"type": "string", "enum": ["ia_militar", "seguridad_espacial", "dinamicas_territoriales", "ninguno"]},
    "necesita_grafico": {"type": "boolean"}},
    "required": ["agente", "fenomeno", "necesita_grafico"]}


def gpu():
    try:
        return subprocess.run(["nvidia-smi", "--query-gpu=memory.used,temperature.gpu,power.draw",
                               "--format=csv,noheader,nounits"], capture_output=True, text=True,
                              timeout=10).stdout.strip()
    except Exception:
        return "n/d"


def post(url, payload, timeout=600):
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"),
                                 headers={"Content-Type": "application/json"})
    t0 = time.perf_counter()
    with urllib.request.urlopen(req, timeout=timeout) as r:
        body = json.loads(r.read().decode("utf-8"))
    return body, time.perf_counter() - t0


def chat(args, model, messages, tools=None, schema=None, max_tokens=512, temperature=0.2):
    """Devuelve dict(content, tool_calls[(name, args_dict|None)], gen_tps, prompt_tps, wall)."""
    if args.openai:
        p = {"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
        if tools: p["tools"] = tools
        if schema: p["response_format"] = {"type": "json_schema",
                                           "json_schema": {"name": "ruta", "schema": schema, "strict": True}}
        b, wall = post(args.openai.rstrip("/") + "/v1/chat/completions", p)
        m = b["choices"][0]["message"]
        calls = []
        for c in m.get("tool_calls") or []:
            try: a = json.loads(c["function"]["arguments"])
            except Exception: a = None
            calls.append((c["function"]["name"], a))
        t = b.get("timings", {})
        n = (b.get("usage") or {}).get("completion_tokens", 0)
        return {"content": m.get("content") or "", "tool_calls": calls, "wall": wall,
                "gen_tps": t.get("predicted_per_second") or (n / wall if wall else 0),
                "prompt_tps": t.get("prompt_per_second")}
    p = {"model": model, "messages": messages, "stream": False, "keep_alive": "10m",
         "options": {"num_ctx": args.ctx, "num_predict": max_tokens, "temperature": temperature}}
    if tools: p["tools"] = tools
    if schema: p["format"] = schema
    url = args.ollama.rstrip("/") + "/api/chat"
    try:
        b, wall = post(url, dict(p, think=False))
    except urllib.error.HTTPError:  # modelos sin capacidad "thinking" rechazan el campo
        b, wall = post(url, p)
    m = b.get("message", {})
    calls = [(c["function"]["name"], c["function"].get("arguments")) for c in m.get("tool_calls") or []]
    ed, pd = b.get("eval_duration", 0) / 1e9, b.get("prompt_eval_duration", 0) / 1e9
    return {"content": m.get("content") or "", "tool_calls": calls, "wall": wall,
            "gen_tps": b.get("eval_count", 0) / ed if ed else 0,
            "prompt_tps": b.get("prompt_eval_count", 0) / pd if pd else None}


def bench(args, model):
    r = {"modelo": model, "gpu_antes": gpu()}
    rag = lambda q: [{"role": "system", "content": SISTEMA_RAG},
                     {"role": "user", "content": f"Fragmentos:\n{FRAGMENTOS}\n\nPregunta: {q}"}]
    chat(args, model, [{"role": "user", "content": "Hola"}], max_tokens=8)  # calentamiento / carga
    # 1) Velocidad (generación larga)
    s = chat(args, model, [{"role": "user", "content":
             "Explica en español, en unas 250 palabras, por qué la basura espacial es un riesgo para LEO."}],
             max_tokens=400, temperature=0.7)
    r["gen_tok_s"], r["prompt_tok_s"] = round(s["gen_tps"], 1), s["prompt_tps"] and round(s["prompt_tps"], 1)
    # 2) RAG en español: fidelidad + cita + abstención
    a = chat(args, model, rag("¿Cuántas aeronaves participaron en el ejercicio CÓNDOR-7 y dónde se realizó?"))
    c = a["content"]
    r["rag_ok"] = ("42" in c) and ("Cali" in c) and ("[F2]" in c)
    n = chat(args, model, rag("¿Cuál es el presupuesto de la Fuerza Aeroespacial para 2032?"))
    r["abstencion_ok"] = "no se encuentra" in n["content"].lower()
    r["rag_respuesta"] = c[:160].replace("\n", " ")
    # 3) Tool calling
    casos = [("Hazme un gráfico de barras de la migración en Colombia.", "generar_grafico",
              lambda x: x.get("tipo") == "barras" and x.get("ambito") == "nacional"),
             ("Busca documentos sobre congestión orbital y basura espacial.", "buscar_documentos",
              lambda x: x.get("fenomeno") == "seguridad_espacial")]
    ok = 0
    for q, fn, chk in casos:
        t = chat(args, model, [{"role": "system", "content": "Usa las herramientas cuando corresponda."},
                               {"role": "user", "content": q}], tools=TOOLS)
        ok += any(name == fn and isinstance(x, dict) and chk(x) for name, x in t["tool_calls"])
    r["tools_ok"] = f"{ok}/{len(casos)}"
    # 4) Enrutador con JSON Schema
    rutas = [("¿Qué país tiene más satélites en LEO?", "rag", "seguridad_espacial", False),
             ("Grafica la evolución del uso de drones militares en América Latina", "graficos", "ia_militar", True),
             ("¿Quién ganó el mundial de fútbol?", "fuera_de_alcance", "ninguno", False)]
    ok = 0
    for q, ag, fe, gr in rutas:
        j = chat(args, model, [{"role": "system", "content":
                 "Clasifica la consulta del usuario. Responde solo JSON según el esquema."},
                 {"role": "user", "content": q}], schema=ESQUEMA_RUTA, temperature=0)
        try:
            d = json.loads(j["content"])
            ok += d.get("agente") == ag and d.get("fenomeno") == fe and d.get("necesita_grafico") == gr
        except Exception:
            pass
    r["router_ok"] = f"{ok}/{len(rutas)}"
    r["gpu_despues"] = gpu()
    return r


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", nargs="+", required=True)
    ap.add_argument("--ollama", default="http://localhost:11434")
    ap.add_argument("--openai", default=None, help="base URL de un servidor OpenAI (p. ej. llama-server)")
    ap.add_argument("--ctx", type=int, default=8192)
    ap.add_argument("--pausa", type=int, default=20, help="segundos de enfriamiento entre modelos")
    args = ap.parse_args()
    res = []
    for i, m in enumerate(args.models):
        if i: time.sleep(args.pausa)
        try:
            res.append(bench(args, m))
        except Exception as e:
            res.append({"modelo": m, "error": repr(e)})
        print(json.dumps(res[-1], ensure_ascii=False, indent=1), flush=True)
    with open("bench_resultados.json", "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=1)
    print("\nmodelo | gen tok/s | rag | abst | tools | router | gpu(MiB,°C,W) después")
    for r in res:
        print(r["modelo"], "|", r.get("gen_tok_s"), "|", r.get("rag_ok"), "|", r.get("abstencion_ok"),
              "|", r.get("tools_ok"), "|", r.get("router_ok"), "|", r.get("gpu_despues", r.get("error")))
```

**Regla de decisión:**

- Se elige el modelo **más grande** que cumpla **todo** lo siguiente, con el RAG cargado:
  - `rag_ok = True` y `abstencion_ok = True`
  - `tools_ok = 2/2` y `router_ok >= 2/3`
  - `gen_tok_s >= 15`
  - `ollama ps` en `100% GPU`
  - temperatura por debajo de ~80 °C
- Si empatan, gana el que sea más estable (el que no da error ni necesita reintento).
- El umbral de 15 tok/s es un criterio nuestro: por encima de ese valor la respuesta en streaming
  se lee con fluidez.

**Limitaciones del benchmark:**

- Son pocas pruebas. Es una prueba de humo, no un leaderboard.
- Conviene repetirlo 2 veces y añadir 5–10 preguntas reales del corpus, con fragmentos reales, como
  las de `preguntas_jurado.md`.

---

## 6. Qué decir ante el jurado

- "El LLM corre en el portátil (Qwen3.5-9B, Apache 2.0) y ningún documento ni consulta sale de la
  máquina. La recuperación usa BGE-M3 y un cross-encoder locales. No dependemos de ninguna API."
- "La arquitectura es agnóstica al modelo: cualquier servidor compatible con OpenAI se conecta
  cambiando una variable. Así probamos incluso Bonsai 2 27B, un modelo ternario de 27B en 5,9 GB
  publicado ayer." Esto solo se dice si el §5 lo validó.
- "Las respuestas se anclan en fragmentos citados y un verificador (el cross-encoder) mide el
  soporte de cada afirmación. El sistema se abstiene si no hay evidencia."

---

## Fuentes

**Bonsai 2 / PrismML:**

- https://prismml.com/news/bonsai-2-27b
- https://prismml.com/news/prismml-launches-bonsai-2-27b
- https://huggingface.co/prism-ml/Ternary-Bonsai-2-27B-gguf
- https://huggingface.co/collections/prism-ml/bonsai-2
- https://huggingface.co/prism-ml/Ternary-Bonsai-2-27B-mlx-2bit
- https://github.com/PrismML-Eng/Bonsai-demo/
- https://github.com/PrismML-Eng/llama.cpp/releases
- https://docs.prismml.com/bonsai-2-27b.md
- https://docs.prismml.com/download/formats.md
- https://docs.prismml.com/resources/troubleshooting.md
- https://docs.prismml.com/integrations/lmstudio.md

**Cobertura y pruebas independientes:**

- https://www.marktechpost.com/2026/09/18/prismml-releases-ternary-bonsai-2-27b-a-5-9-gb-apache-2-0-model-retaining-98-2-of-qwen3-8-27b-performance/
- https://gigazine.net/gsc_news/en/20260918-bonsai-2-27b/
- https://dev.to/jamilxt/bonsai-2-27b-puts-a-27b-ai-model-in-59gb-can-it-replace-your-paid-subscription-54ol
- https://blog.kubesimplify.com/bonsai-27b-rtx-pro-6000-dgx-spark (Bonsai 1)

**Qwen:**

- https://huggingface.co/Qwen/Qwen3.8-27B
- https://www.yottalabs.ai/post/qwen-3-8-27b-specs-hardware-requirements-how-to-run-2026
- https://huggingface.co/Qwen/Qwen3.5-9B
- https://unsloth.ai/docs/models/qwen3.5
- https://ollama.com/library/qwen3.5/tags
- https://ollama.com/library/qwen3.6/tags
- https://github.com/QwenLM/Qwen3.8/discussions/156
- https://insiderllm.com/guides/best-way-run-qwen-3-6-35b-moe-locally/
- https://huggingface.co/Qwen/Qwen3.6-35B-A3B/discussions/58
- https://willitrunai.com/blog/qwen-3-gpu-requirements

**Gemma, Mistral y otros:**

- https://huggingface.co/google/gemma-4-12B-it
- https://ollama.com/library/gemma4/tags
- https://www.betterclaw.io/blog/gemma-4-12b-vs-qwen-3-5-9b
- https://insiderllm.com/guides/function-calling-local-llms/
- https://huggingface.co/mistralai/Ministral-3-14B-Instruct-2512
- https://runaihome.com/blog/gpt-oss-20b-local-ai-hardware-guide-2026/
- https://github.com/ggml-org/llama.cpp/discussions/15396
- https://www.mayhemcode.com/2026/06/best-local-llms-for-4gb-6gb-and-8gb.html

**Runtimes:**

- https://docs.ollama.com/faq
- https://docs.ollama.com/capabilities/structured-outputs
- https://github.com/ollama/ollama/releases
- https://freedom.tech/posts/2026-09-15-ollama-0-34-2/
- https://fazm.ai/t/vllm-windows-support-2026
