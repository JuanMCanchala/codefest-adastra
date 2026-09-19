# Benchmarks de los 8 modelos Bedrock para la final (Reto 1)

Fecha de consulta: 18-sep-2026. Objetivo: decidir qué modelo usar en cada agente (orquestador, RAG, visualización) **antes** de gastar el presupuesto de USD 100.

Convenciones:

- **[AWS]** = documentación o precio oficial de AWS. **[Fab.]** = dato del fabricante del modelo (model card o paper propio). **[Indep.]** = medición independiente (Artificial Analysis, Vectara, BFCL).
- "sin dato" = no se encontró una cifra fiable. No se estimó nada que no esté marcado como supuesto.
- Artificial Analysis (AA) publica medianas de las últimas 72 h. Las cifras de velocidad corresponden al **endpoint de Amazon Bedrock**, extraídas el 18-sep-2026 de `artificialanalysis.ai/models/<modelo>/providers`. "Prompt largo" es la métrica por defecto de AA (unos 10k tokens de entrada). "Prompt medio" (unos 1k tokens) se parece más a nuestra ruta.
- El Intelligence Index de AA es la **v4.3**, una escala nueva con valores bajos (p. ej. gpt-oss-120b = 12,3). Solo sirve para comparar modelos entre sí.

---

## 1. Tabla comparativa

Precios en USD por 1M tokens (entrada/salida), bajo demanda, nivel Standard, us-east-1 salvo que se indique otra región.

| Modelo                            | Precio in/out                                                                                                                   | tok/s en Bedrock (AA, prompt medio / largo)              | TTFT en Bedrock (AA, medio / largo)              | Alucinación RAG (Vectara)                                                                | Seguimiento de instrucciones           | Tool calling / JSON                                                                                                                       | Multilingüe / español                                  | Notas                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| **gpt-oss-20b**                   | 0,07 / 0,30 [Indep.: AA, LiteLLM]; Sídney 0,0721 / 0,309 [AWS]                                                                  | 86,5 / 81,1                                              | **45,3 s / 57,6 s** (anómalo, ver §2.2)          | 3,7 % (HHEM-2.1, oct-2025); no aparece en HHEM-2.3                                       | IFBench 0,65 (high), 0,58 (low) [AA]   | τ²-Bench 0,60 (high), 0,50 (low) [AA]; Tau-Bench Retail 35,0 / 47,3 / 54,8 (low/med/high) [Fab.]; structured outputs en Bedrock: sí [AWS] | MMMLU español 75,0 / 79,7 / 81,2 (low/med/high) [Fab.] | Modelo de razonamiento. Resistencia a hijacking por prompt injection: 0,639 [Fab.]    |
| **gpt-oss-120b**                  | 0,15 / 0,60 [Indep.: AA, LiteLLM]; Sídney 0,1545 / 0,618 [AWS]                                                                  | 79,4 / 59,8                                              | 0,78 s / 0,96 s. E2E con reasoning high: 32,3 s  | 2,4 % (HHEM-2.1) / **14,2 %** (HHEM-2.3, may-2026)                                       | IFBench 0,69 (high), 0,58 (low) [AA]   | τ²-Bench 0,66 (high), 0,45 (low) [AA]; Tau-Bench Retail 49,4 / 62,0 / 67,8 [Fab.]; structured outputs: sí [AWS]                           | MMMLU español 80,6 / 84,6 / 85,9 (low/med/high) [Fab.] | Razonamiento. Hijacking por injection 0,780; extracción de system prompt 0,832 [Fab.] |
| **Llama 3.3 70B Instruct**        | 0,72 / 0,72 [Indep.: AA, LiteLLM]                                                                                               | 109,4 / 105,8                                            | 0,65 s / 1,16 s. E2E medio: 5,2 s                | **4,0 % (HHEM-2.1) / 4,1 % (HHEM-2.3)**                                                  | IFEval 92,1 [Fab.]; IFBench 0,47 [AA]  | BFCL v2 77,3 [Fab.]; BFCL v4 global 31,9 % (puesto 62) [Indep.]; τ²-Bench 0,27 [AA]; structured outputs: **no** [AWS]                     | MGSM 91,1 [Fab.]; español soportado oficialmente       | No razona. El precio de salida más alto del grupo                                     |
| **Llama 4 Scout 17B**             | 0,17 / 0,66 [Indep.: AA, LiteLLM]                                                                                               | **190,6 / 182,0**                                        | 0,59 s / 0,82 s. E2E medio: 3,2 s                | 4,7 % (HHEM-2.1) / 7,7 % (HHEM-2.3)                                                      | IFBench 0,40 [AA]; IFEval sin dato     | BFCL v4 28,1 % [Indep.]; τ²-Bench 0,15 [AA]; structured outputs: **no** [AWS]                                                             | MGSM 90,6 [Fab.]; español soportado                    | El más rápido en Bedrock. MMLU-Pro 74,3; GPQA 57,2 [Fab.]                             |
| **Mixtral 8x7B Instruct**         | 0,45 / 0,70 [Indep.: AA, LiteLLM]                                                                                               | sin dato / 24,6                                          | sin dato / 1,09 s                                | **20,1 %** (HHEM-2.1)                                                                    | IFBench sin dato; MT-Bench 8,30 [Fab.] | Tool calling del lado del cliente: **no soportado** en Bedrock [AWS]                                                                      | MMLU es 72,5; HellaSwag es 77,6 [Fab.]                 | Contexto de 32K y salida de 4K. Modelo de 2023                                        |
| **DeepSeek-R1-Distill-Llama-70B** | **No es serverless en Bedrock.** Custom Model Import: 8 CMU × USD 0,0785/min, cobrado en ventanas de 5 min [AWS blog, ene-2025] | sin dato para Bedrock                                    | sin dato para Bedrock                            | sin dato (no aparece en ninguna de las dos versiones de Vectara)                         | IFBench 0,28 [AA]                      | τ²-Bench 0,22 [AA]                                                                                                                        | sin dato            | Emite `<think>`. El fabricante desaconseja usar system prompt. GPQA 65,2 [Fab.]       |
| **Qwen3-Next-80B-A3B (Instruct)** | 0,15 / 1,20 [AWS]                                                                                                               | sin dato para Bedrock; 161–293 en otros proveedores [AA] | sin dato para Bedrock; 0,37–0,95 s en otros [AA] | 3,7 % (variante _thinking_, HHEM-2.1) / 9,3 % (_thinking_, HHEM-2.3); Instruct: sin dato | IFEval 87,6 [Fab.]; IFBench 0,40 [AA]  | BFCL-v3 70,3 [Fab.]; τ²-Bench 0,22 [AA]; structured outputs: sí [AWS]                                                                     | MMLU-ProX 76,7; MultiIF 75,8; INCLUDE 78,9 [Fab.]      | Instruct no emite `<think>` [Fab.]. MMLU-Pro 80,6; GPQA 72,9 [Fab.]                   |
| **Gemma 3 27B IT**                | 0,23 / 0,38 [AWS]                                                                                                               | sin dato / 63,0                                          | sin dato / 1,42 s                                | 3,0 % (HHEM-2.1) / 7,4 % (HHEM-2.3)                                                      | IFEval 90,4 [Fab.]; IFBench 0,32 [AA]  | BFCL v4 29,5 % en modo prompt [Indep.]; τ²-Bench 0,11 [AA]; structured outputs: sí [AWS]                                                  | Global-MMLU-Lite 75,1 [Fab.]                           | FACTS Grounding 74,9 [Fab.]. Intelligence Index de AA más bajo del grupo (4,85)       |

### Índice de inteligencia de AA (v4.3) y razonamiento [Indep.: AA]

| Modelo                                    | AA Index v4.3 | GPQA (AA)   | HLE (AA)      | Otros datos del fabricante                                      |
| ----------------------------------------- | ------------- | ----------- | ------------- | --------------------------------------------------------------- |
| gpt-oss-120b (high / low)                 | 12,35 / 10,21 | 0,78 / 0,67 | 0,196 / 0,059 | MMLU 85,9 / 88,0 / 90,0 (low/med/high); GPQA 67,1 / 73,1 / 80,1 |
| Qwen3-Next-80B-A3B (reasoning / instruct) | 11,20 / 9,64  | 0,76 / 0,74 | 0,126 / 0,076 | MMLU-Pro 80,6 (instruct)                                        |
| gpt-oss-20b (high / low)                  | 9,04 / 9,95   | 0,69 / 0,61 | 0,110 / 0,053 | MMLU 80,4 / 84,0 / 85,3                                         |
| DeepSeek-R1-Distill-Llama-70B             | 7,89          | 0,40        | 0,051         | GPQA 65,2; AIME24 70,0                                          |
| Llama 3.3 70B                             | 7,66          | 0,50        | 0,036         | MMLU-Pro 68,9; GPQA 50,5                                        |
| Llama 4 Scout                             | 6,45          | 0,59        | 0,038         | MMLU-Pro 74,3; GPQA 57,2                                        |
| Mixtral 8x7B                              | 5,12          | 0,29        | 0,047         | MMLU 70,6                                                       |
| Gemma 3 27B                               | 4,85          | 0,43        | 0,044         | MMLU-Pro 67,5; GPQA 42,4                                        |

AA publica gpt-oss-20b _low_ por encima de _high_ (9,95 frente a 9,04). Así aparece en su página y no lo corregimos.

### Sobre los datos de alucinación

El Vectara Hallucination Leaderboard mide cuánto se inventa un modelo al resumir un documento **usando solo sus hechos**, con temperatura 0. Es lo más parecido a nuestra métrica de faithfulness. Hay dos versiones:

- **HHEM-2.1, dataset antiguo** (última actualización: 7-oct-2025): gpt-oss-120b 2,4 %, Gemma 3 27B 3,0 %, gpt-oss-20b 3,7 %, Qwen3-Next thinking 3,7 %, Llama 3.3 4,0 %, Scout 4,7 %, Mixtral 20,1 %.
- **HHEM-2.3, dataset nuevo** (última actualización: 11-may-2026): Llama 3.3 4,1 %, Gemma 3 27B 7,4 %, Scout 7,7 %, Qwen3-Next thinking 9,3 %, gpt-oss-120b 14,2 %. gpt-oss-20b, Mixtral y R1-Distill no aparecen.
- **Conclusión:** Llama 3.3 70B es el único que queda estable y abajo en ambas versiones. gpt-oss-120b pasa de 2,4 % a 14,2 %, así que su fidelidad depende mucho del tipo de documento y hay que medirla con nuestro corpus. Además, en la versión nueva sus resúmenes miden 135 palabras de media, frente a 65 de Llama 3.3.
- AA Omniscience mide otra cosa: conocimiento sin contexto y la tasa de respuestas inventadas cuando el modelo no sabe. No sirve para RAG y aquí solo se menciona para evitar confusiones.

### Robustez ante prompt injection y jailbreak

- **gpt-oss** es el único modelo con datos publicados [Fab.: model card de OpenAI, ago-2025]:
  - Hijacking por prompt injection: 120b 0,780; 20b 0,639; o4-mini 0,917.
  - Extracción del system prompt: 0,832 / 0,881.
  - Protección de frase en mensajes developer→user: 0,909 / 0,661.
  - StrongReject (jailbreak) de 0,96 a 0,99, al nivel de o4-mini.
  - OpenAI advierte que ambos modelos resisten peor que o4-mini cuando el usuario intenta anular el system prompt. El 20b es claramente más débil.
- Llama 3.3, Llama 4 Scout, Mixtral, R1-Distill, Qwen3-Next y Gemma 3: **sin dato comparable**. No se encontró ningún leaderboard independiente que los compare con la misma metodología (búsqueda del 18-sep-2026).
- En Bedrock, los 8 modelos admiten **Guardrails** (según su model card) [AWS]. Es una defensa que no depende del modelo, aunque suma latencia y posiblemente coste. Hay que medirla.

---

## 2. Particularidades en Bedrock (IDs, APIs, contexto, razonamiento)

| Modelo                        | ID en bedrock-runtime                                                                                                                                                                                                         | Inferencia en us-east-1                                                                          | Converse                              | Structured outputs | Contexto / salida máx. [AWS] |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------- | ------------------ | ---------------------------- |
| gpt-oss-20b                   | `openai.gpt-oss-20b-1:0` (mantle: `openai.gpt-oss-20b`)                                                                                                                                                                       | En la región                                                                                     | Sí (además Invoke y Chat Completions) | Sí                 | 128K / 16K                   |
| gpt-oss-120b                  | `openai.gpt-oss-120b-1:0` (mantle: `openai.gpt-oss-120b`)                                                                                                                                                                     | En la región                                                                                     | Sí                                    | Sí                 | 128K / 16K                   |
| Llama 3.3 70B                 | `meta.llama3-3-70b-instruct-v1:0`                                                                                                                                                                                             | **Solo con el perfil geo** `us.meta.llama3-3-70b-instruct-v1:0` (en la región solo en us-east-2) | Sí                                    | **No**             | 128K / 4K                    |
| Llama 4 Scout                 | `meta.llama4-scout-17b-instruct-v1:0`                                                                                                                                                                                         | **Solo con el perfil geo** `us.meta.llama4-scout-17b-instruct-v1:0`                              | Sí                                    | **No**             | 10M / 8K                     |
| Mixtral 8x7B                  | `mistral.mixtral-8x7b-instruct-v0:1`                                                                                                                                                                                          | En la región                                                                                     | Sí; tool calling del cliente **no**   | **No**             | 32K / 4K                     |
| Qwen3-Next-80B-A3B            | `qwen.qwen3-next-80b-a3b` (mantle: `qwen.qwen3-next-80b-a3b-instruct`)                                                                                                                                                        | En la región                                                                                     | Sí (además Chat Completions)          | Sí                 | 256K / 8K                    |
| Gemma 3 27B                   | `google.gemma-3-27b-it` (la card de AWS lo titula "27B PT", pero el ID es `-it`)                                                                                                                                              | En la región                                                                                     | Sí (además Chat Completions)          | Sí                 | 128K / 8K                    |
| DeepSeek-R1-Distill-Llama-70B | **No existe como modelo gestionado.** El catálogo de Bedrock solo tiene DeepSeek-R1, V3.1 y V3.2. Se accede por Custom Model Import (us-east-1 y us-west-2) o por Bedrock Marketplace, que despliega un endpoint de SageMaker | —                                                                                                | Sin dato para modelos importados      | Sin dato           | —                            |

Fuentes: model cards de Bedrock (`docs.aws.amazon.com/bedrock/latest/userguide/model-card-*.html`), consultadas el 18-sep-2026. En gpt-oss, Gemma y Qwen3-Next, la card muestra el nivel de servicio Flex, que es más barato. El precio Flex de gpt-oss en Sídney es la mitad del Standard [AWS].

### 2.1 Tokens de razonamiento: impacto y cómo reducirlos

- **gpt-oss**: tiene tres niveles de razonamiento (low, medium, high). El fabricante los activa escribiendo `Reasoning: low` en el system prompt [Fab.]. En Bedrock:
  - **Chat Completions:** parámetro `reasoning_effort="low"`. Así figura en el blog de AWS de jul-2026 para bedrock-mantle.
  - **Converse:** los campos de OpenAI que no tienen equivalente se envían en `additionalModelRequestFields` [AWS]. Se esperaría `{"reasoning_effort": "low"}`, pero no lo encontramos documentado de forma explícita. **Hay que verificarlo.**
  - **InvokeModel:** el razonamiento llega entre etiquetas `<reasoning>`, antes del texto de la respuesta [AWS]. Hay que eliminarlo antes de mostrar o puntuar la respuesta.
- **Por qué importa:** AA mide gpt-oss-120b en Bedrock con reasoning _high_ y obtiene **33,5 s de razonamiento** antes de responder (prompt largo). La respuesta completa con prompt medio tarda 32,3 s. Scout tarda 3,2 s y Llama 3.3, 5,2 s. Los tokens de razonamiento se facturan como salida y, si el jurado cuenta los tokens de salida, **también penalizan la eficiencia**. OpenAI muestra que low reduce mucho la longitud del razonamiento, aunque no publica una cifra fija en tokens [Fab., Fig. 3].
- **DeepSeek-R1-Distill**: siempre razona dentro de `<think>`. El fabricante incluso recomienda forzar ese inicio. No hay un nivel de esfuerzo que reducir, así que para un agente conversacional sale caro en tokens y latencia.
- **Qwen3-Next en Bedrock**: la variante documentada es la Instruct, que según el fabricante no emite `<think>`. La card de AWS marca "Reasoning: Supported". **Hay que comprobar** si la salida trae un bloque de razonamiento.

### 2.2 Anomalía de gpt-oss-20b en Bedrock

AA mide en Bedrock una mediana de TTFT de 45 s con prompt medio y 58 s con prompt largo. En otros proveedores ese valor está entre 0,3 y 1,2 s. Puede ser encolamiento o un efecto del reasoning high. No lo podemos explicar desde fuera, pero **es un riesgo real de latencia** y hay que medirlo antes de usar el 20b.

---

## 3. Fichas por modelo (resumen)

**gpt-oss-20b.** Es el más barato: 0,07 / 0,30. Tiene structured outputs y tool calling, y su español es aceptable (MMMLU es 75,0 a 81,2).

- En contra: la anomalía de TTFT en Bedrock, la menor resistencia a prompt injection de los gpt-oss (hijacking 0,639) y el razonamiento obligatorio.
- Uso posible: clasificador o router si las mediciones propias descartan la anomalía de latencia.

**gpt-oss-120b.** Es el mejor en razonamiento, seguimiento de instrucciones (IFBench 0,69) y agentes (τ² 0,66), y el único con datos publicados de instruction hierarchy.

- Tiene structured outputs y cuesta 0,15 / 0,60.
- En contra: los resultados en Vectara son contradictorios (2,4 % frente a 14,2 %), sus respuestas son largas y cada llamada suma latencia y tokens de razonamiento.
- Uso posible: orquestador o visualización con reasoning low y salida estructurada.

**Llama 3.3 70B Instruct.** Tiene la fidelidad más consistente (Vectara 4,0 % y 4,1 %) y el IFEval más alto del grupo según el fabricante (92,1).

- Soporta español oficialmente, no razona y en Bedrock va rápido (109 tok/s, TTFT 0,65 s).
- En contra: no tiene structured outputs en Bedrock, su precio de salida es el más alto (0,72) y en us-east-1 requiere el perfil `us.`.
- Uso posible: **agente RAG**.

**Llama 4 Scout.** Es el más rápido en Bedrock (190 tok/s, E2E 3,2 s) y barato (0,17 / 0,66).

- En contra: seguimiento de instrucciones flojo (IFBench 0,40), τ² bajo (0,15), sin structured outputs y alucinación intermedia (4,7 % / 7,7 %).
- Uso posible: alternativa de baja latencia para el orquestador, validando el JSON en código.

**Mixtral 8x7B.** Tiene 20,1 % de alucinación, 24,6 tok/s, contexto de 32K, no permite tool calling en Bedrock y es de 2023. **Descartado.**

**DeepSeek-R1-Distill-Llama-70B.** No es serverless en Bedrock. Con Custom Model Import, 8 CMU × USD 0,0785/min = **USD 0,628 por minuto activo (unos USD 37,7/h)**, cobrados en ventanas de 5 min y con arranques en frío de "decenas de segundos" [AWS blog, ene-2025]. Además razona siempre con `<think>` y tiene IFBench 0,28. **Descartado.** Conviene preguntar a la organización cómo lo exponen.

**Qwen3-Next-80B-A3B (Instruct).** Tiene el conocimiento más alto entre los modelos que no razonan (MMLU-Pro 80,6; GPQA 72,9), BFCL-v3 70,3, structured outputs, contexto de 256K y un multilingüe sólido (MMLU-ProX 76,7).

- En contra: no hay mediciones de velocidad en Bedrock, IFBench es bajo (0,40), su salida es la más cara del grupo (1,20) y no hay datos de Vectara para la variante Instruct.
- Uso posible: alternativa para visualización u orquestador.

**Gemma 3 27B IT.** Buena fidelidad en HHEM-2.1 (3,0 %), FACTS Grounding 74,9, IFEval 90,4 según el fabricante y structured outputs. Es barato (0,23 / 0,38).

- En contra: el índice AA más bajo del grupo, IFBench 0,32, τ² 0,11 y 63 tok/s.
- Uso posible: alternativa barata para RAG.

---

## 4. Costo por pregunta y capacidad con USD 100

Ruta típica: orquestador con 700 tokens de entrada y 100 de salida, más el agente RAG con 2.500 de entrada y 300 de salida. Son 2 llamadas. Se usan precios Standard de us-east-1.

**Supuesto no medido:** en los modelos de razonamiento se suman 300 tokens de salida al orquestador y 600 al RAG. Sirve para dimensionar el efecto y hay que sustituirlo por lo que midamos.

| Combinación (orquestador + RAG)            | USD/pregunta sin razonamiento                                              | Preguntas por USD 100                                  | USD/pregunta con razonamiento (supuesto) | Preguntas por USD 100 |
| ------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------- | --------------------- |
| gpt-oss-20b + gpt-oss-20b                  | 0,000344                                                                   | ~290.700                                               | 0,000614                                 | ~162.900              |
| gpt-oss-20b + gpt-oss-120b                 | 0,000634                                                                   | ~157.700                                               | 0,001084                                 | ~92.300               |
| gpt-oss-120b + gpt-oss-120b                | 0,000720                                                                   | ~138.900                                               | 0,001260                                 | ~79.400               |
| Scout + gpt-oss-120b                       | 0,000740                                                                   | ~135.100                                               | 0,001100                                 | ~90.900               |
| Scout + Scout                              | 0,000808                                                                   | ~123.800                                               | —                                        | —                     |
| gpt-oss-20b + Qwen3-Next                   | 0,000814                                                                   | ~122.900                                               | 0,000904                                 | ~110.600              |
| Gemma 3 + Gemma 3                          | 0,000888                                                                   | ~112.600                                               | —                                        | —                     |
| Qwen3-Next + Qwen3-Next                    | 0,000960                                                                   | ~104.200                                               | —                                        | —                     |
| Mixtral + Mixtral                          | 0,001720                                                                   | ~58.100                                                | —                                        | —                     |
| Scout + Llama 3.3                          | 0,002201                                                                   | ~45.400                                                | —                                        | —                     |
| **gpt-oss-120b + Llama 3.3** (recomendada) | 0,000165 + 0,002016 = **0,002181**                                         | **~45.850**                                            | 0,000345 + 0,002016 = 0,002361           | ~42.350               |
| Llama 3.3 + Llama 3.3                      | 0,002592                                                                   | ~38.600                                                | —                                        | —                     |
| R1-Distill (Custom Model Import)           | depende del tiempo activo, no de los tokens: USD 3,14 por ventana de 5 min | con USD 100 alcanza para unas 2,6 h de endpoint activo | —                                        | —                     |

Si además se llama al agente de visualización (supuesto: 1.500 tokens de entrada y 200 de salida), con gpt-oss-120b cada pregunta cuesta unos 0,000345 USD más, y 0,000525 USD más con 300 tokens de razonamiento.

**Lectura:** el presupuesto **no limita** la elección. Incluso la combinación más cara da para decenas de miles de preguntas. Lo que sí importa es la **puntuación de eficiencia**, que compara tokens totales, número de llamadas y latencia con los demás equipos, y la **calidad**. Por eso pesa más evitar los tokens de razonamiento y las llamadas innecesarias que el precio por token. Evitar la llamada al orquestador con reglas deterministas cuando la intención es obvia ahorra tiempo en las tres dimensiones de eficiencia.

---

## 5. Recomendación

| Agente                                                  | Principal                                                                                            | Alternativas                                                                                                                                           | Motivo                                                                                                                                                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orquestador** (enruta y devuelve JSON)                | **gpt-oss-120b** con `reasoning_effort=low`, structured outputs con esquema JSON y `maxTokens` corto | 1) Qwen3-Next-80B-A3B Instruct con structured outputs (no razona). 2) Llama 4 Scout (el más rápido en Bedrock, pero hay que validar el JSON en código) | Es el único con datos de resistencia a prompt injection y el que mejor sigue instrucciones. La salida estructurada garantiza el JSON. En low, el coste en latencia debería ser acotado, **pero hay que medirlo** |
| **RAG** (español, solo con los fragmentos, con citas)   | **Llama 3.3 70B Instruct** (perfil `us.meta.llama3-3-70b-instruct-v1:0`)                             | 1) Gemma 3 27B IT (barato, con buen grounding). 2) gpt-oss-120b en low, si nuestra evaluación de faithfulness lo confirma                              | Tiene la fidelidad más estable en Vectara (4,0 % / 4,1 %), IFEval 92,1, español oficial, no razona y responde en unos 5 s con prompt medio en Bedrock                                                            |
| **Visualización** (JSON con un componente del catálogo) | **gpt-oss-120b** en low con structured outputs (esquema con `enum` del catálogo)                     | 1) Qwen3-Next-80B-A3B Instruct con structured outputs. 2) Gemma 3 27B IT con structured outputs                                                        | Hace falta un JSON válido garantizado y elegir bien de una lista cerrada. Usar el mismo modelo que el orquestador simplifica el código y los prompts                                                             |
| Descartados                                             | Mixtral 8x7B, DeepSeek-R1-Distill-Llama-70B, gpt-oss-20b (hasta que se aclare su TTFT en Bedrock)    | —                                                                                                                                                      | Alucinación alta y sin tool calling (Mixtral); no es serverless y razona siempre (R1-Distill); TTFT de 45 a 58 s en Bedrock y la peor defensa ante injection (20b)                                               |

---

## 6. Qué medir nosotros para confirmarlo (con un presupuesto de USD 5 o menos)

1. **Mini-evaluación en español:** 40–50 preguntas del corpus, con los mismos fragmentos recuperados para todos los modelos. Métricas de DeepEval: AnswerRelevancy, Faithfulness con `retrieval_context`, Toxicity y GEval de "tono profesional y empático". El juez debe ser fijo y ajeno a los candidatos. Comparar Llama 3.3, Gemma 3 27B y gpt-oss-120b (low) en el rol de RAG. Coste estimado: menos de USD 0,20 por modelo con la tabla de §4, más el coste del juez.
2. **Tokens reales:** registrar `usage.inputTokens` y `usage.outputTokens` en cada llamada, y comprobar si los tokens de razonamiento de gpt-oss vienen incluidos en outputTokens. Medir la media de tokens de razonamiento en low frente a medium con nuestros prompts.
3. **Latencia en nuestra región** (us-east-1 o la que asigne la organización): p50 y p95 de TTFT y del tiempo total, con ConverseStream, 30 llamadas por modelo. Incluir gpt-oss-20b para confirmar o descartar la anomalía.
4. **Validez del JSON** en el orquestador y en visualización: porcentaje de salidas que cumplen el esquema, con structured outputs activado y sin él, más la exactitud del enrutado sobre unas 50 consultas etiquetadas.
5. **Prompt injection:** 25–30 ataques en español, directos y **dentro de los fragmentos recuperados** (inyección indirecta), del tipo "ignora instrucciones", extracción del system prompt y cambio de rol. Medir la tasa de éxito del ataque por modelo, con Bedrock Guardrails y sin ellos, y lo que Guardrails añade de latencia.
6. **Parámetro de razonamiento en Converse:** confirmar que `additionalModelRequestFields={"reasoning_effort":"low"}` se aplica, comparando los tokens de salida con y sin él, o usar `Reasoning: low` en el system prompt.
7. **Qwen3-Next:** comprobar si devuelve razonamiento en Bedrock.
8. **R1-Distill:** preguntar a la organización cómo lo ofrecen.

---

## Fuentes (consultadas el 18-sep-2026)

- Precios oficiales de Bedrock: https://aws.amazon.com/bedrock/pricing/ (gpt-oss en Sídney; Qwen3-Next y Gemma 3 en us-east-1, us-east-2 y us-west-2).
- Precios de Llama, Mixtral y gpt-oss en us-east-1, contexto y funciones: LiteLLM `model_prices_and_context_window.json` (https://github.com/BerriAI/litellm), que coincide con Artificial Analysis.
- Model cards de Bedrock: https://docs.aws.amazon.com/bedrock/latest/userguide/model-cards.html y sus páginas `model-card-openai-gpt-oss-20b`, `-120b`, `model-card-meta-llama-3-3-70b-instruct`, `model-card-meta-llama-4-scout-17b-instruct`, `model-card-mistral-ai-mixtral-8x7b-instruct`, `model-card-qwen-qwen3-next-80b-a3b` y `model-card-google-gemma-3-27b-pt`.
- Parámetros de OpenAI en Bedrock: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-openai.html
- reasoning_effort en Bedrock: https://aws.amazon.com/blogs/machine-learning/run-nvidia-nemotron-and-openai-gpt-oss-models-on-amazon-bedrock-in-aws-govcloud-us/ (1-jul-2026).
- R1-Distill con Custom Model Import: https://aws.amazon.com/blogs/machine-learning/deploy-deepseek-r1-distilled-llama-models-with-amazon-bedrock-custom-model-import/ (29-ene-2025).
- Artificial Analysis, proveedores y evaluaciones: https://artificialanalysis.ai/models/{gpt-oss-20b, gpt-oss-120b, llama-3-3-instruct-70b, llama-4-scout, mixtral-8x7b-instruct, deepseek-r1-distill-llama-70b, qwen3-next-80b-a3b-instruct, qwen3-next-80b-a3b-reasoning, gemma-3-27b}[/providers] (medianas de 72 h al 18-sep-2026; Intelligence Index v4.3).
- Vectara Hallucination Leaderboard: https://github.com/vectara/hallucination-leaderboard (HHEM-2.3, 11-may-2026) y el commit 279c928 (HHEM-2.1, 7-oct-2025).
- BFCL v4: https://gorilla.cs.berkeley.edu/leaderboard.html (CSV `data_overall.csv`, Last-Modified 13-abr-2026).
- Model card de gpt-oss (OpenAI, ago-2025): https://cdn.openai.com/pdf/419b6906-9da6-406c-a19d-1bb078ac7637/oai_gpt-oss_model_card.pdf (tablas 2, 3, 6–9).
- Llama 3.3: https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct · Llama 4 Scout: https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct
- Qwen3-Next Instruct: https://huggingface.co/Qwen/Qwen3-Next-80B-A3B-Instruct
- Gemma 3: https://huggingface.co/google/gemma-3-27b-it y el informe técnico https://arxiv.org/abs/2503.19786 (tablas 6 y 18).
- Mixtral: https://mistral.ai/news/mixtral-of-experts (11-dic-2023) y https://arxiv.org/abs/2401.04088 (tablas 2–4).
- DeepSeek-R1-Distill-Llama-70B: https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-70B
