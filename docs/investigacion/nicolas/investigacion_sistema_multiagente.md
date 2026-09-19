# Investigación profunda: sistema multiagente + GUI sobre ad-astra-retrieval

Documento de trabajo para Reto 1 (asistente conversacional, mínimo 2 agentes, GUI) y Reto 2
(módulo de analítica visual, mínimo 1 agente, integrado al asistente). Todavía no llegó el
documento oficial con los requisitos exactos, así que esto es una base de decisión, no un plan
cerrado. Donde algo depende del reto oficial se marca explícitamente como pendiente de confirmar.

Objetivo declarado por el equipo: no quedarse en el mínimo pedido, apuntar a la versión más sólida
que el tiempo disponible permita.

---

## 1. Punto de partida: qué ya existe y qué se puede reutilizar tal cual

Etapa 1 (`ad-astra-retrieval/`) dejó construido mucho más que "un índice FAISS". Esto es lo
aprovechable directamente, sin reescribir nada:

| Pieza ya construida | Dónde vive | Cómo se reutiliza en Reto 1/2 |
|---|---|---|
| `Retriever` (denso + disperso + grafo → fusión RRF → rerank) | `src/retrieval/pipeline.py` | Se envuelve como **tool** de un agente de recuperación. No hace falta tocarlo. |
| `VectorStore` (FAISS + metadata alineada) | `src/encoding/index.py` | Backend de búsqueda semántica del asistente conversacional. |
| `GraphRetriever` + `grafo.graphml` (26 961 entidades, 97 182 relaciones) | `src/graph/retrieve.py`, `entrega/base_vectorial/grafo/` | Doble uso: (a) señal extra en recuperación, ya integrada, (b) **visualización de entidades/relaciones lista para Reto 2** sin generar nada nuevo. |
| Esquema con `doc_id` y `chunk_id` trazables | `src/schema.py` | Base para citación verificable en el asistente (ver §4). |
| Parser de mapas `.pbf` (vector tiles) | `src/extraction/misc.py` | Si el corpus real de ADL trae datos geográficos, ya hay código para extraerlos → insumo directo para un mapa en Reto 2 (§5.2). |
| `metadata.jsonl` con idioma, fuente, fenómeno por chunk | `entrega/base_vectorial/encoder_bge-m3/` | Insumo para casi todas las visualizaciones de Reto 2 sin pipeline nuevo: son agregaciones sobre un JSONL que ya existe. |
| `config.yaml` como fuente única de verdad | raíz del repo | Mismo patrón a extender para la config de agentes (modelo LLM, prompts, tools habilitadas). |

**Consecuencia de diseño:** el sistema nuevo no reemplaza a `ad-astra-retrieval`, lo **envuelve**.
El repo de recuperación pasa a ser una dependencia (librería interna o microservicio) consumida por
los agentes, no algo que se reescribe.

**Pendiente de confirmar con el reto oficial:** los 3 fenómenos cambiaron de nombre respecto a
Etapa 1 (antes: defensa/IA militar, seguridad espacial LEO, dinámicas territoriales LATAM; ahora:
"IA y capacidades estratégicas", "Seguridad Espacial", "Amenazas regionales"). Hay que verificar si
es el mismo corpus reindexado con etiquetas nuevas o si trae corpus adicional. Si cambia el corpus,
`scripts/build_index.py` y `scripts/build_graph.py` ya están listos para correr contra el nuevo
material sin cambios de código.

---

## 2. La restricción que más pesa ahora: ¿siguen prohibidos los decoders?

Etapa 1 prohibía explícitamente modelos generativos en toda la recuperación (spec §8.3). Reto 1
pide un "asistente conversacional" — eso, por definición, necesita un LLM generativo para redactar
respuestas en lenguaje natural. Es razonable asumir que la prohibición aplicaba solo a la Etapa 1
(evaluación de recuperación pura) y que en esta fase el LLM generativo es el componente central
esperado, pero **esto no está confirmado en ningún documento que el equipo tenga todavía**.

**Acción concreta:** en cuanto llegue el reto oficial, revisar si hay alguna restricción de modelo
(familia, licencia, on-device vs API) antes de fijar el LLM elegido. Mientras tanto, se diseña
asumiendo LLM generativo permitido, con el motor de recuperación (que sí sigue siendo 100% encoder,
sin cambios) como la pieza que ya está "blindada" por diseño.

---

## 3. Arquitectura multiagente para Reto 1

### 3.1 Framework de orquestación

Investigación 2026 sobre frameworks de agentes production-ready (LangChain, LangGraph, CrewAI,
Microsoft Agent Framework/AutoGen, OpenAI Agents SDK, Google ADK, Mastra):

| Framework | Fortaleza | Debilidad para este caso |
|---|---|---|
| **LangGraph** | Control fino como grafo de nodos/edges, checkpointing, streaming nativo, observabilidad (LangSmith), usado en producción por Anthropic/Replit/Uber. No depende de un solo proveedor de modelo. | Curva de aprendizaje algo mayor que CrewAI si nadie del equipo lo conoce. |
| **CrewAI** | El camino más rápido de idea a prototipo funcionando, orquestación por roles simple. | Sin checkpointing de fábrica, control grueso sobre la comunicación entre agentes, malo si hay que depurar bajo presión de tiempo. |
| **AutoGen / Microsoft Agent Framework** | Modela agentes como conversación entre ellos; fusionado con Semantic Kernel, v1.0 GA en abril 2026. | Ecosistema pensado más para investigación/experimentación que para un pitch con deadline. |
| **OpenAI Agents SDK** | Fricción mínima si todo es GPT. | Ata el proyecto a un solo proveedor de modelo — mal trade-off si después hay que cambiar de LLM por costo/latencia/disponibilidad. |

**Recomendación: LangGraph.** Da control explícito sobre el flujo (importante para un pitch donde
hay que explicar "por qué así" igual que se hizo con la fusión RRF en Etapa 1), soporta streaming
para que la GUI no se sienta congelada mientras responde, y no ata el proyecto a un proveedor de
modelo único — permite usar el mismo patrón de "medir y justificar" que ya funcionó con BGE-M3 y el
reranker.

### 3.2 Topología de agentes (mínimo 2, diseño recomendado con 3-4)

**Opción mínima (cumple el requisito "mínimo dos agentes")**
- **Agente orquestador/router**: interpreta la pregunta, decide a qué fenómeno(s) corresponde,
  decide si hace falta recuperación o el usuario está pidiendo una visualización (conecta con
  Reto 2), arma la respuesta final con citas.
- **Agente de recuperación**: envuelve el `Retriever` existente como tool, devuelve documentos +
  fragmentos con `doc_id`/`chunk_id`.

**Diseño recomendado para "excelencia" (4 agentes, mismo framework, sin duplicar trabajo)**
1. **Router/Orquestador** — clasifica la intención (pregunta factual, comparación entre fenómenos,
   pedido de visualización, pregunta fuera de alcance) y decide el plan.
2. **Agente de recuperación** — tool sobre `Retriever` (`src/retrieval/pipeline.py`). Sin cambios
   al motor, solo una capa de tool-calling encima.
3. **Agente de síntesis/redacción** — recibe los fragmentos recuperados y redacta la respuesta
   final en el idioma de la pregunta (el corpus y BGE-M3 ya son ES/EN/PT, aprovechar eso también en
   la respuesta). Aquí vive el único LLM generativo del sistema puro de chat.
4. **Agente de citación/verificación** — antes de mostrar la respuesta, valida que cada afirmación
   tenga un `doc_id`/`chunk_id` real que la respalde (evita alucinar citas, que es el error de
   confianza más caro en un sistema de este tipo — ver §4). Puede ser una función de validación
   determinista en vez de otro LLM, más barato y más confiable.

Separar síntesis de citación no es solo prolijidad: si el jurado pregunta "¿cómo evitan que el
asistente invente fuentes?", la respuesta es un paso de verificación explícito y auditable, no
"le pedimos al LLM que no mienta".

**Punto de enganche con Reto 2:** el orquestador, cuando detecta intención de visualización, delega
al agente de analítica (§5) en vez de al de síntesis. Mismo router, dos caminos — así el requisito
de Reto 2 ("integrado con el asistente conversacional") queda resuelto por construcción, no como
integración pegada después.

### 3.3 Citación y trazabilidad (patrón de 2026, aplicado a lo que ya existe)

La investigación sobre UI de citación en sistemas RAG (Perplexity, Claude, ChatGPT search, Notion
AI Q&A, herramientas legales como Harvey/Legora) converge en un patrón: **citas numeradas inline en
el texto, que abren una tarjeta de fuente con vista previa**, más un indicador de confianza que
combina cantidad de fuentes y acuerdo entre ellas. Regla dura del mismo patrón: si no hubo
recuperación real detrás de una afirmación, no se inventa una cita — se dice explícitamente que esa
parte no está respaldada.

Esto calza casi perfecto con lo que Etapa 1 ya dejó armado: cada fragmento devuelto por el
`Retriever` ya trae `doc_id` y `chunk_id` (el interno de FAISS) trazables 1:1 a `metadata.jsonl`. La
GUI solo necesita:
- Citas numeradas `[1]`, `[2]`... en la respuesta del agente de síntesis.
- Un panel lateral o tarjetas expandibles con el fragmento fuente, su `doc_id`, idioma y fenómeno.
- El agente de citación (§3.2) como gate: si una oración de la respuesta no tiene fragmento que la
  respalde, no se le asigna número de cita.

No hace falta inventar infraestructura de citación nueva — hace falta exponerla en la GUI.

---

## 4. GUI para Reto 1

Investigación 2026 sobre frameworks de UI para apps de agentes (Chainlit, Streamlit, Gradio,
custom con React):

| Framework | Cuándo conviene | Riesgo |
|---|---|---|
| **Chainlit** | Hecho específicamente para UI de LLM/agentes: streaming, threading de mensajes, muestra el razonamiento paso a paso, feedback de usuario, auth, historial. | El equipo fundador se bajó del desarrollo activo en 2025 — sigue funcionando pero sin roadmap activo. |
| **Streamlit** | Combina mejor que cualquier alternativa chat + dashboard en la misma app — relevante porque Reto 2 pide visualizaciones **integradas** al asistente, no una app aparte. Ecosistema maduro y estable. | Menos pulido "out of the box" para streaming token-a-token que Chainlit; hay que armarlo a mano (es viable, LangGraph ya da streaming nativo). |
| **Gradio** | Setup en 5 líneas, ideal para demo rápida a stakeholders. Ventaja exclusiva de ZeroGPU en HF Spaces (no relevante acá, es todo local/Coolify). | Menos control de layout fino que Streamlit para combinar chat + múltiples visualizaciones en una sola pantalla. |
| **Custom FastAPI + React** | Control total de diseño, la opción que más impresiona en un pitch si hay tiempo y alguien del equipo maneja frontend. | Más horas de desarrollo — riesgo alto dado el plazo (mañana 08:00 y 12:30). |

**Recomendación con el tiempo disponible: Streamlit.** Es la única opción que resuelve Reto 1 y
Reto 2 en la misma pantalla sin duplicar infraestructura de UI, tiene soporte maduro para chat
(`st.chat_message`, `st.chat_input`) y para gráficos (Plotly, pydeck, matplotlib) nativo, y no
depende de que alguien del equipo tenga experiencia en React bajo presión de tiempo.

**Si sobra tiempo después de tener el mínimo funcionando** (ruta de "más allá"): envolver la misma
lógica de agentes (que vive en FastAPI/LangGraph, independiente de la UI) con un frontend custom.
Como la recomendación de arquitectura (§6) separa backend de agentes y frontend desde el día uno,
ese upgrade no obliga a reescribir nada, solo a cambiar la capa de presentación.

---

## 5. Reto 2: agente de analítica visual

### 5.1 Qué significa "visualizaciones útiles" acá (no genéricas)

La tendencia 2026 en analítica agéntica es que el agente no muestra un dashboard fijo, sino que
**decide qué visualización generar según la pregunta**, seleccionando entre un catálogo de
funciones de visualización ya definidas (patrón text-to-viz con tool-calling, no generación de
código arbitraria — más seguro, más rápido, más fácil de defender ante el jurado: "el agente elige
entre gráficas certificadas, no improvisa código").

### 5.2 Catálogo de visualizaciones que se pueden construir con lo que YA existe

| Visualización | Fuente de datos ya construida | Librería sugerida |
|---|---|---|
| **Grafo de entidades/relaciones interactivo** por fenómeno | `grafo.graphml` (ya tiene 26 961 entidades / 97 182 relaciones) | Cosmograph (GPU, pensado justo para grafos de entidades/relaciones grandes; hay widget Python) o pyvis si el grafo filtrado por consulta es chico |
| **Distribución de documentos** por idioma / fuente / fenómeno | `metadata.jsonl` (campos ya presentes en la Tabla 1 de metadata obligatoria) | Plotly (barras, treemap) |
| **Mapa geográfico** para "Amenazas regionales" | `src/extraction/misc.py` ya parsea `.pbf` (vector tiles) — si el corpus trae capas geográficas, el dato ya se extrae | pydeck (wrapper Python de deck.gl) o Kepler.gl si el volumen de puntos es alto |
| **Mapa de clusters temáticos** (qué tan agrupados están los documentos por tema/idioma) | Embeddings BGE-M3 1024d ya calculados en `index.faiss` | Proyección UMAP/t-SNE → scatter Plotly |
| **Línea de tiempo** (si `metadata.jsonl` trae fecha) | metadata existente | Plotly timeline |
| **Red de co-ocurrencia de entidades** para una consulta puntual | `GraphRetriever` (`src/graph/retrieve.py`) ya trae vecinos de primer orden de las entidades de una consulta | Mismo motor que el grafo completo, pero acotado |

La ventaja competitiva real acá no es la variedad de gráficos (eso lo tiene cualquier equipo con
Plotly), es que **la mitad de estas visualizaciones no requieren pipeline nuevo** — son lecturas
distintas de datos que Etapa 1 ya calculó y validó. Vale la pena mostrar eso explícitamente en el
pitch: la solidez de la base vectorial de Etapa 1 es lo que permite llegar a analítica rica sin
partir de cero.

### 5.3 Agente de analítica

Un agente con tools = una función por tipo de gráfico del catálogo de §5.2, cada una con su
contrato de entrada (filtros: fenómeno, idioma, rango de fechas, entidad) y salida (figura Plotly
serializada). El orquestador de Reto 1 lo invoca cuando detecta intención de visualización; el
agente elige la tool adecuada según la pregunta y devuelve la figura embebida en la respuesta del
chat, no en una pantalla aparte — así se cumple "integrado con el asistente conversacional" de
forma literal, no solo simbólica.

---

## 6. Arquitectura técnica propuesta (unificada, Reto 1 + Reto 2)

```
┌─────────────────────────── GUI (Streamlit) ───────────────────────────┐
│  st.chat_input → st.chat_message (streaming) + gráficos Plotly/pydeck  │
│  panel de citas (doc_id, fenómeno, idioma, fragmento fuente)           │
└───────────────────────────────┬─────────────────────────────────────┘
                                 │ HTTP/WebSocket
┌────────────────────────────────▼─────────────────────────────────────┐
│                    Backend FastAPI (agentes, LangGraph)                │
│                                                                         │
│   Router/Orquestador ──┬── Agente de recuperación → Retriever (Etapa 1)│
│                        ├── Agente de síntesis (LLM generativo)         │
│                        ├── Agente de citación/verificación             │
│                        └── Agente de analítica → catálogo de gráficos  │
│                                     (grafo.graphml, metadata.jsonl,     │
│                                      index.faiss, datos geo .pbf)       │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                    ad-astra-retrieval/ como dependencia
                    (src/retrieval, src/graph, src/encoding sin tocar)
```

Backend y frontend separados desde el inicio (no todo adentro de un único script de Streamlit) por
dos razones prácticas: permite que alguien trabaje en agentes mientras otro trabaja en GUI en
paralelo esta noche, y deja la puerta abierta a upgrade de frontend (§4) sin tocar la lógica de
agentes. Despliegue: mismo patrón que ya se dejó listo — contenedor(es) Docker, publicados en el
Coolify local ya instalado (`COOLIFY_SETUP.md`).

---

## 7. Ruta de implementación priorizada (contra el reloj)

**Fase 0 — innegociable para Reto 1 (08:00):**
1. Backend LangGraph con Router + Agente de recuperación (envolviendo `Retriever` existente) +
   Agente de síntesis con citas numeradas.
2. GUI Streamlit con chat funcional, streaming, y panel de fuentes citadas.
3. Documentación mínima de diseño y uso de este componente (pedido explícito del reto: "diseño y
   uso esperado de cada componente debe estar correctamente documentado").

**Fase 1 — innegociable para Reto 2 (12:30), construye sobre la Fase 0:**
4. Agente de citación/verificación como gate antes de mostrar respuesta (si no alcanzó el tiempo en
   Fase 0, es la primera mejora de calidad a sumar acá).
5. Agente de analítica con 2-3 visualizaciones del catálogo §5.2 priorizadas por lo que ya está
   construido sin trabajo extra: grafo interactivo + distribución por fenómeno/idioma como mínimo
   defendible, mapa geográfico y clusters UMAP si el tiempo alcanza.
6. Integración del agente de analítica al mismo router del chat.
7. Documentación del segundo componente.

**Fase 2 — "más allá" si sobra tiempo:**
8. Frontend custom sobre el mismo backend (§4).
9. Indicador de confianza en las citas (fuerte/mixta/débil, según cantidad y acuerdo de fuentes).
10. Deploy real en Coolify para poder mostrar el pitch corriendo desde un link, no desde localhost.

---

## 8. Los dos escenarios sobre el LLM generativo, investigados a fondo

No se puede asumir cuál de los dos aplica hasta que llegue el reto oficial, así que ambos quedan
diseñados con el mismo nivel de detalle. La clave de diseño que hace que esto no cueste doble
trabajo: **el paso de síntesis de la respuesta se construye como módulo intercambiable desde el
día uno**, igual que `rerank.enabled` en `config.yaml` de Etapa 1. Todo lo de recuperación,
citación y agentes de analítica es idéntico en los dos escenarios — lo único que cambia es qué
genera el texto final de la respuesta.

### 8.1 Escenario A — LLM generativo permitido (el más probable)

Es razonable asumir que la prohibición de decoders de Etapa 1 aplicaba solo a la evaluación de
recuperación pura, y que un "asistente conversacional" por definición necesita un modelo
generativo. Aun así, sigue sin estar confirmado (ver §11, pregunta 1).

**Elección de LLM — con el hardware ya disponible (RTX 4060 Laptop, 8 GB VRAM):**

| Modelo | VRAM (Q4) | Por qué | Rol sugerido |
|---|---|---|---|
| **Qwen3.5-9B** | ~6.6 GB | Apache 2.0, 262K contexto, atención híbrida (KV cache chico), el mejor equilibrio multilingüe/tamaño para 8 GB en 2026 | **Pick por defecto para el agente de síntesis local** |
| Nemotron 3 Nano 4B | ~2-3 GB | Híbrido Mamba-Transformer de NVIDIA, pensado para agentic/tool-calling, muy rápido | Router/clasificador de intención (no necesita ser el modelo grande) |
| Ministral 3 8B / Llama 3.1 8B | ~5-6 GB | Alternativas si Qwen3.5-9B da problemas de licencia/tooling | Respaldo |

**Opción API (si hay conectividad y no hay restricción de datos — ver §11, pregunta 2):**

| Modelo | Precio (entrada/salida por MTok) | Uso sugerido |
|---|---|---|
| Claude Haiku 4.5 | $1 / $5 | Router de intención, agente de citación/verificación (tareas baratas y rápidas) |
| **Claude Sonnet 5** | $2 / $10 | Agente de síntesis — mejor punto costo/calidad/tool-use para este caso |
| Claude Opus 5 | $5 / $25 | Solo si la calidad de Sonnet 5 no alcanza en pruebas — respaldo, no default |

**Recomendación concreta:** correr los dos caminos (local Qwen3.5-9B vs Claude Sonnet 5 por API)
contra un puñado de preguntas reales de los 3 fenómenos esta noche, y elegir con el mismo criterio
que usaron para BGE-M3 — medir, no adivinar. Como LangGraph habla con cualquiera de los dos por una
interfaz compatible con OpenAI (Ollama expone `http://localhost:11434/v1`), cambiar de uno a otro
es una línea de config, no una reescritura. Esto también es la respuesta más barata a "¿y si el
tutor dice que no se puede usar la nube por el tema militar?": ya queda probado que ambos caminos
funcionan, se apaga uno y sigue andando el otro.

### 8.2 Escenario B — sigue prohibido cualquier modelo generativo (decoder)

Si la restricción de §8.3 de la spec de Etapa 1 sigue vigente, un "asistente conversacional" todavía
es posible, solo que sin fluidez de LLM. Niveles crecientes de sofisticación, todos 100% encoder:

1. **QA extractivo por selección de span** — un modelo encoder (XLM-RoBERTa u otro BERT
   multilingüe, ej. checkpoints tipo `xlm-roberta-large-squad2`) entrenado para predicción de
   inicio/fin de respuesta dentro del fragmento recuperado. La "respuesta" es texto literal
   extraído, no generado — cumple la regla al pie de la letra, mismo argumento de defensa que ya
   usaron para el reranker cross-encoder en Etapa 1 (arquitectura encoder, no decoder).
2. **Fusión por plantilla** — combinar los mejores spans de varios fragmentos con un formato fijo
   ("Según [doc_id], en `<fragmento>`. Además [doc_id_2] indica `<fragmento>`"). Cero modelo
   generativo, es una capa de formato sobre la salida extractiva. Es la opción más segura si hay
   dudas de último momento sobre qué cuenta como "generativo".
3. **Router sin LLM** — un clasificador de intención basado en encoder (ej. un XLM-R afinado con
   pocos ejemplos por fenómeno) en vez de un LLM con prompt. Coherente con el patrón ya usado
   (GLiNER para NER, bge-reranker para scoring): modelos chicos, especializados, encoder-only.
4. **Memoria conversacional** sin LLM: se resuelve guardando los spans/fragmentos ya mostrados en
   turnos anteriores como contexto extra para la siguiente recuperación, no como "memoria" que un
   LLM tenga que redactar.

**Ser honesto con la desventaja:** este camino se va a sentir más "motor de búsqueda" que
"conversación" frente al jurado, comparado con equipos que sí usen LLM. Es la opción defendible,
no la más vistosa — vale la pena decirlo así en el pitch si toca usarla, en vez de intentar que
parezca más fluida de lo que es.

---

## 9. Ideas de valor agregado que no piden los retos (puntos extra)

En Etapa 1, el grafo de conocimiento fue exactamente este patrón: nadie lo exigía como obligatorio,
sumó puntos por ser bono explícito, y terminó siendo parte de por qué el equipo llegó a finalista.
**Tener piezas que van más allá de lo mínimo pedido suma puntos** — vale la pena reservar tiempo
para al menos 2-3 de estas si las Fases 0 y 1 (§7) se cierran con margen:

| Idea | Por qué suma | Costo de implementación |
|---|---|---|
| **Comparación cruzada entre fenómenos** ("¿cómo se relaciona X de seguridad espacial con Y de amenazas regionales?") usando el grafo para encontrar entidades compartidas entre fenómenos | Nadie lo pide explícitamente; usa el grafo de Etapa 1 de una forma que ningún otro equipo probablemente explota | Bajo — el `GraphRetriever` ya soporta esto, es una consulta multi-entidad |
| **Trazabilidad del razonamiento del agente** (qué documentos consultó, por qué eligió esa visualización, mostrado como panel expandible) | En un contexto de defensa, explicabilidad es un valor real, no solo estético — LangGraph emite estos eventos de forma nativa | Bajo — es exponer algo que el framework ya genera |
| **Indicador de confianza por consenso de fuentes** (cuántas fuentes independientes respaldan una afirmación, marcado fuerte/mixto/débil) | Es tradecraft real de análisis de inteligencia (no solo "cita bonita"), encaja directo con "capacidades estratégicas" y "amenazas regionales" | Medio — lógica sobre los mismos fragmentos ya recuperados |
| **Modo resiliente sin conectividad** (demostrar que el sistema responde igual con el LLM local, sin internet) | Argumento de diseño fuerte específicamente para un jurado de la Fuerza Aeroespacial: un sistema de analítica de defensa que depende de una nube externa es una debilidad operacional real | Medio — ya viene gratis si se sigue la recomendación de §8.1 de soportar los dos caminos |
| **Exportar una consulta a informe** (PDF con la respuesta, sus citas y las visualizaciones generadas) | Entregable tangible más allá del chat, mismo hábito que ya tienen con `informe_tecnico.pdf` en Etapa 1 | Medio — `reportlab` o similar sobre lo que ya se muestra en pantalla |
| **Detección de discrepancias entre fuentes** (marcar cuando dos documentos del corpus se contradicen sobre el mismo tema) | Valor analítico real, no cosmético, y ningún otro equipo hackathon suele llegar a esto | Alto — es lo más ambicioso de la lista, dejar para el final si sobra tiempo |
| **Deploy accesible por URL** vía el Coolify ya instalado, en vez de demo en localhost | El pitch se ve más serio corriendo desde un link real | Bajo si Fase 0/1 ya corren en Docker |

No hace falta correr los siete. La ganancia real de "ir por la excelencia" está en elegir 2-3 con
buen ratio costo/impacto (comparación cruzada + trazabilidad de razonamiento + modo resiliente son
las de mejor retorno) y ejecutarlas bien, no en dispersar el tiempo entre todas.

---

## 10. Herramientas actuales evaluadas para este caso (investigación 2026)

Resumen de lo investigado para justificar las elecciones de §3, §4 y §8 con datos, no con
preferencia:

**Modelos generativos (Escenario A):** ver tabla completa en §8.1. El panorama abierto en 2026 lo
lidera la familia Qwen (Qwen3.5/3.6, 201 idiomas, la mejor cobertura multilingüe del mercado
abierto) y DeepSeek V4 (mejor relación rendimiento/costo de inferencia self-hosted), pero esos
tamaños grandes no entran en 8 GB — de ahí la recomendación de Qwen3.5-9B como el punto de la
familia que sí entra.

**Servidor de inferencia local:** Ollama (más simple, API compatible con OpenAI en
`localhost:11434/v1`, ideal para empezar rápido) vs llama.cpp (10-20% más rápido, más control fino,
más fricción de configuración) vs vLLM (pensado para multiusuario concurrente — no aporta nada
extra en un demo de una sola persona/pantalla). **Recomendación: Ollama** para no perder tiempo de
la noche en configuración, con la opción de bajar a llama.cpp directo si hace falta exprimir más
la GPU de 8 GB.

**Orquestación de agentes:** LangGraph confirmado como recomendación (§3.1) frente a CrewAI
(prototipado más rápido pero sin checkpointing ni control fino), AutoGen/Microsoft Agent Framework
(mejor para investigación que para un pitch con deadline) y OpenAI Agents SDK (ata el proyecto a un
solo proveedor — mal trade-off dado que §8.1 recomienda poder alternar entre modelo local y API).

**QA extractivo (Escenario B):** el estado del arte para lectura comprensiva encoder-only sigue
siendo BERT/XLM-R con una cabeza de clasificación de tokens para predecir el span de respuesta
dentro del contexto recuperado — exactamente el mismo patrón arquitectónico que ya usaron para el
reranker y para GLiNER, así que no es una familia de modelos nueva para el equipo.

**Function calling / tool use:** BFCL v4 (abril 2026) es el benchmark de referencia actual para
qué tan bien un modelo llama herramientas en agentes multi-paso — vale la pena usarlo como criterio
si hace falta desempatar entre el LLM local y el de API durante las pruebas de esta noche.

---

## 11. Preguntas clave para el tutor/acompañante del ejército

El equipo tiene acceso a alguien del ejército que puede responder preguntas — vale mucho más una
buena pregunta ahora que adivinar y tener que rehacer arquitectura a las 3 AM. Ordenadas por cuánto
cambian el diseño si la respuesta es la que no se espera:

1. **¿Sigue prohibido usar modelos generativos (decoders) en Reto 1 y Reto 2, o esa restricción era
   exclusiva de la evaluación de recuperación de Etapa 1?** Es la pregunta que más cambia todo el
   diseño (§8.1 vs §8.2) — la primera en hacer.
2. **Dado que el tema es defensa (capacidades estratégicas militares, seguridad espacial, amenazas
   regionales), ¿hay alguna restricción de que las consultas o los datos salgan a APIs en la nube
   (OpenAI, Anthropic, Google), o es aceptable usar servicios en la nube para un prototipo de
   hackathon?** Determina si el LLM tiene que ser 100% local (Ollama/Qwen3.5-9B) o si se puede usar
   una API con mejor calidad (Claude Sonnet 5).
3. **El enunciado dice "analizar datos de fuentes públicas relacionadas con tres fenómenos de
   interés" — ¿se refiere al corpus ya indexado en Etapa 1, o el sistema debe poder consultar
   fuentes públicas adicionales o en vivo (búsqueda web, feeds de noticias actuales) para el
   análisis o las visualizaciones de Reto 2?** Cambia radicalmente el alcance del agente de
   analítica: catálogo fijo sobre datos ya indexados (§5.2) vs. un agente con acceso a búsqueda web
   en tiempo real.
4. **¿Hay contenido del corpus sobre amenazas regionales o capacidades militares que no debería
   citarse o mostrarse literalmente en pantalla durante una demo pública o el pitch, aunque el
   documento en sí sea de fuente pública?** Pregunta de seguridad operacional para la puesta en
   escena, no de arquitectura — mejor confirmarlo antes que descubrirlo en vivo frente al jurado.
5. **¿La evaluación de Reto 1 y Reto 2 es puramente cualitativa (pitch + jurado) o hay algún
   criterio medible que debamos preparar, similar al NDCG@10/F1@3/Borda de Etapa 1?** Determina si
   vale la pena construir un arnés de evaluación para el asistente conversacional, igual que se hizo
   para la recuperación.
6. **¿El requisito de "mínimo dos agentes" (Reto 1) y "mínimo un agente" (Reto 2) exige que sean
   visiblemente distintos en la demo — nombrados, trazables en la conversación — o alcanza con que
   la arquitectura interna los tenga separados?** Afecta cuánto esfuerzo poner en exponer la
   trazabilidad de agentes en la GUI (relacionado con la idea de valor agregado de §9).

---

## 12. Decisiones abiertas — confirmar apenas llegue el reto oficial

- ¿Sigue habiendo restricción de modelos generativos, o aplica solo a Etapa 1? (§11, pregunta 1)
- ¿El corpus de los 3 fenómenos nuevos es el mismo de Etapa 1 re-etiquetado, o hay material
  adicional que indexar?
- ¿Hay restricción de proveedor/licencia de LLM (local vs API, modelo específico permitido)?
  (§11, pregunta 2)
- ¿"Mínimo dos agentes" exige que sean visiblemente distintos en la demo, o alcanza con que la
  arquitectura interna los tenga separados? (§11, pregunta 6)
- Formato exacto de entrega y de la documentación de diseño/uso por componente (¿un README por
  componente? ¿informe único?).

---

## Fuentes consultadas

- [The best AI agent frameworks in 2026 — LangChain](https://www.langchain.com/resources/ai-agent-frameworks)
- [CrewAI vs LangGraph vs AutoGen (2026 Comparison)](https://pickaxe.co/post/crewai-vs-langgraph-vs-autogen)
- [A Detailed Comparison of Top 6 AI Agent Frameworks in 2026 — Turing](https://www.turing.com/resources/ai-agent-frameworks)
- [Best Multi-Agent Frameworks in 2026](https://gurusup.com/blog/best-multi-agent-frameworks-2026)
- [Agentic AI Frameworks 2026: Production Comparison — Uvik](https://uvik.net/blog/agentic-ai-frameworks/)
- [CrewAI vs LangGraph vs AutoGen vs OpenAgents](https://openagents.org/blog/posts/2026-02-23-open-source-ai-agent-frameworks-compared)
- [Streamlit vs Gradio vs Chainlit — Medium](https://medium.com/@atnoforgenai/streamlit-vs-gradio-vs-chainlit-building-quick-uis-for-your-ai-applications-138e3baa5317)
- [Streamlit Alternatives in 2026 — Innonexa](https://www.innonexa.com/2026/07/02/streamlit-alternatives-python-ai-agent-apps-2026/)
- [Streamlit vs Gradio vs Chainlit vs Marimo — HeyClaude](https://heyclau.de/compare/ml-app-ui-frameworks)
- [AI citation and source UI design patterns for 2026 — AYDesign](https://www.aydesign.ai/blog/ai-citation-source-ui-patterns-2026)
- [Citation-Aware RAG — Tensorlake](https://www.tensorlake.ai/blog/rag-citations)
- [feature: Source-level deep linking and highlighting for citations — open-webui discussion](https://github.com/open-webui/open-webui/discussions/20829)
- [Agentic Dashboard: How Dashboard Agents Work in 2026 — Knowi](https://www.knowi.com/blog/what-is-a-dashboard-agent-ai-powered-analytics/)
- [Agentic AI and Agents for building Visualisation Dashboards — Xenonstack](https://www.xenonstack.com/blog/agentic-ai-data-visualisation)
- [Agentic Dashboards (2026 Guide) — Ampcome](https://www.ampcome.com/post/agentic-dashboards-2026-what-they-are-how-they-work-architecture-real-examples)
- [Cosmograph](https://cosmograph.app/)
- [Sigma.js](https://www.sigmajs.org/)
- [The Two Best Tools for Plotting Interactive Network Graphs — Medium](https://medium.com/@bl3e967/the-two-best-tools-for-plotting-interactive-network-graphs-8d352aa894d4)
- [Visualizing Geospatial Data with PyDeck — Medium](https://medium.com/@shouke.wei/visualizing-geospatial-data-with-pydeck-8e6afb56f282)
- [Leafmap: Interactive Mapping & Geospatial Analysis in Python](https://geog-510.gishub.org/book/geospatial/leafmap.html)
- [Kepler.gl](https://kepler.gl/)
- [Best LLMs Right Now: September 2026 Model Rankings & Use Cases — Azumo](https://azumo.com/artificial-intelligence/ai-insights/top-10-llms-0625)
- [Open Source LLM Comparison Table (2026) — ComputingForGeeks](https://computingforgeeks.com/open-source-llm-comparison/)
- [Best Open Source LLMs (September 2026) — Thunder Compute](https://www.thundercompute.com/blog/best-open-source-llms)
- [vLLM, Ollama, LM Studio, llama.cpp: Choosing the best LLM inference engine in 2026 — BIZON](https://bizon-tech.com/blog/best-llm-inference-engines)
- [Ollama vs llama.cpp vs vLLM: Which Should You Use in 2026? — DEV Community](https://dev.to/thurmon_demich/ollama-vs-llamacpp-vs-vllm-which-should-you-use-in-2026-10gp)
- [Small LLMs That Fit in 8GB: The Best Models to Self-Host in 2026 — Pinggy](https://pinggy.io/blog/small_llms_that_fit_in_8gb_memory/)
- [Best Ollama Models 2026: 25+ Ranked by VRAM & SWE-Bench — Morph](https://www.morphllm.com/best-ollama-models)
- [Evaluating Compact LLMs for Zero-Shot Iberian Language Tasks on End-User Devices (arXiv)](https://arxiv.org/pdf/2504.03312)
- [Modeling Extractive Question Answering Using Encoder-Decoder Models](https://pdfs.semanticscholar.org/9b92/c9c1d9c61dcf74b781c72357ff25172f155d.pdf)
- [Adapting Pre-trained Generative Models for Extractive Question Answering (arXiv)](https://arxiv.org/pdf/2311.02961)
- [AI Agent Tool Calling Benchmarks: BFCL v4, tau-Bench — Spheron Blog](https://www.spheron.network/blog/tool-calling-benchmarks-bfcl-tau-bench-latency-optimization/)
- [Multi-Mission Tool Bench (arXiv)](https://arxiv.org/pdf/2504.02623)
- Precios de modelos Claude (Sonnet 5, Haiku 4.5, Opus 5): tabla oficial de la skill `claude-api`, cacheada 2026-06-24
