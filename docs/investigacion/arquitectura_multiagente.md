# Arquitectura multiagente para el asistente conversacional (Reto 1)

## Patrones de arquitectura multiagente con RAG

### 1. Orquestador/enrutador + agentes especialistas (recomendado)

Un **agente orquestador** recibe la consulta del usuario, decide a qué fenómeno(s) pertenece
(clasificación de intención) y la enruta a uno o varios **agentes especialistas** (uno por
fenómeno: IA militar, seguridad espacial, dinámicas territoriales). Cada especialista consulta la
base vectorial de la Etapa 1 filtrando por `fenomeno` en la metadata, genera una respuesta con
citas, y el orquestador la consolida o la devuelve directamente.

- Ventaja: mapea 1:1 con la estructura del corpus (`fenomeno` ya es un campo de metadata en
  `metadata.jsonl` según el esquema de la Etapa 1), por lo que el enrutamiento es barato y preciso.
- Ventaja: cumple el requisito de "mínimo dos agentes" con un diseño natural, no forzado —
  orquestador + N especialistas ya son ≥ 2 agentes con roles distintos.
- Riesgo: consultas que cruzan fenómenos (p. ej. "IA militar en el conflicto colombiano" toca
  fenómeno 1 y 3) requieren que el orquestador pueda invocar más de un especialista y fusionar
  respuestas.

### 2. Agente verificador de citas (segundo agente o segunda etapa)

Patrón complementario: un **agente verificador** revisa que cada afirmación de la respuesta del
especialista esté efectivamente respaldada por el fragmento citado (grounding check), rechazando o
marcando afirmaciones sin evidencia textual. Esto es crítico para un reto evaluado por un jurado
técnico, donde una alucinación visible es más costosa que una respuesta incompleta.

- Implementación simple: el verificador recibe (respuesta, fragmentos citados) y usa el propio LLM
  o el cross-encoder reranker ya disponible en la Etapa 1 (`bge-reranker-v2-m3`) para puntuar si el
  fragmento soporta la afirmación.
- Este patrón es el usado por frameworks como **LangGraph** con nodos de "reflection"/"critic" y por
  el patrón "RAG con self-checking" descrito en la literatura de *Retrieval-Augmented Generation
  Survey* (Gao et al., 2023). https://arxiv.org/abs/2312.10997

### 3. Agente de analítica visual como tercer agente (conecta con Reto 2)

El Reto 2 exige "mínimo un agente" de analítica visual integrado al asistente del Reto 1. El patrón
natural es que el orquestador del Reto 1 pueda invocar al **agente de visualización** como una
herramienta (tool-calling) cuando detecta intención de "mostrar/graficar/comparar", en vez de tener
dos sistemas separados. Esto también suma agentes al conteo del Reto 1 sin duplicar trabajo.

## Frameworks y herramientas para orquestación multiagente

| Framework | Para qué sirve | Notas |
|---|---|---|
| **LangGraph** (LangChain) | Grafos de estados para orquestar agentes con control explícito de flujo (útil para orquestador→especialista→verificador) | Maduro, buena documentación, integra RAG nativamente. https://langchain-ai.github.io/langgraph/ |
| **CrewAI** | Definición declarativa de "roles" de agentes (orquestador, investigador, escritor) con delegación automática | Curva de entrada más rápida que LangGraph para equipos con poco tiempo. https://www.crewai.com |
| **AutoGen** (Microsoft) | Conversaciones multiagente con paso de mensajes entre agentes | Fuerte en escenarios de "agentes que conversan entre sí" más que en pipelines deterministas. https://microsoft.github.io/autogen/ |
| **OpenAI Agents SDK / Assistants API con handoffs** | Orquestación ligera con "handoffs" entre agentes especializados | Útil si ya se usa la API de OpenAI para el LLM generador; bajo esfuerzo de infraestructura. https://openai.github.io/openai-agents-python/ |
| **LlamaIndex Agents / Workflows** | Integración directa con índices vectoriales (FAISS, etc.) y agentes de consulta por índice ("Router Query Engine") | Especialmente relevante porque LlamaIndex tiene soporte nativo para "un agente por índice/colección", que mapea bien a "un agente por fenómeno". https://docs.llamaindex.ai/en/stable/module_guides/deploying/agents/ |

**Recomendación**: para el tiempo disponible (entrega en menos de 24 h), **LangGraph** ofrece el
mejor equilibrio entre control explícito del flujo (necesario para verificación de citas) y
madurez de la documentación. Si el equipo prioriza velocidad de armado sobre control fino,
**CrewAI** reduce el código necesario para definir orquestador + especialistas.

## Opciones de GUI rápidas de montar

| Opción | Tiempo de montaje | Notas |
|---|---|---|
| **Streamlit** | Muy bajo (horas) | Estándar de facto para demos de IA en Python; soporta chat (`st.chat_message`), gráficos (Plotly, Matplotlib) y mapas (`st.map`, pydeck) nativamente. Ideal para un hackatón. https://streamlit.io |
| **Gradio** | Muy bajo (horas) | Similar a Streamlit, con `gr.ChatInterface` listo para asistentes conversacionales; buena integración con Hugging Face si algún modelo local se sirve desde ahí. https://www.gradio.app |
| **Chainlit** | Bajo | Diseñado específicamente para UIs de chat con agentes/LLM, con soporte de streaming de pasos intermedios (útil para mostrar qué agente respondió). https://docs.chainlit.io |
| **Next.js + Vercel AI SDK** | Medio-alto | Más control de diseño y producción, pero consume tiempo de desarrollo que no sobra en un reto de 24 h. |

**Recomendación**: **Streamlit** o **Chainlit**. Streamlit si el equipo ya tiene familiaridad con
Python puro y quiere combinar chat + gráficos del Reto 2 en la misma app sin cambiar de stack;
Chainlit si se quiere mostrar visualmente la traza multiagente (qué agente intervino) como parte
del pitch, ya que tiene soporte nativo para mostrar "steps" de un agente.

## Reutilización de la base vectorial de la Etapa 1

La Etapa 1 entrega directamente reutilizable:

- `entrega/base_vectorial/encoder_bge-m3/index.faiss` + `metadata.jsonl`: el índice denso ya
  construido, cargable con `faiss.read_index` sin reindexar.
- Metadata por fragmento con campo `fenomeno`, lo que permite a cada agente especialista filtrar su
  búsqueda al fenómeno que le corresponde (post-filtrado sobre los resultados de FAISS, o
  pre-filtrado si se migra a un índice con soporte de metadata como FAISS `IDSelector`).
- `grafo/grafo.graphml`: reutilizable para el agente verificador (contrastar entidades mencionadas
  en la respuesta contra el grafo) y para visualizaciones de red en el Reto 2.
- El pipeline de recuperación (`src/retrieval/`) ya implementa fusión RRF y reranking; el asistente
  del Reto 1 debería **llamar a este pipeline como una función/herramienta** en cada agente
  especialista, en lugar de reimplementar la búsqueda vectorial.

**Punto de atención**: la Etapa 1 es explícitamente "RAG sin generación" (solo recuperación, sin
LLM decoder). El Reto 1 sí requiere generación conversacional, así que el trabajo nuevo es agregar
la capa de **generación con LLM decoder** sobre los fragmentos recuperados (algo antes prohibido en
Etapa 1 y ahora necesario), más la capa de agentes. El índice y el reranker se reutilizan sin
modificación.

## Comparativa y recomendación final

| Necesidad | Opción recomendada | Alternativa |
|---|---|---|
| Orquestación multiagente | LangGraph | CrewAI (si se prioriza velocidad sobre control) |
| GUI | Streamlit | Chainlit (si se quiere mostrar la traza de agentes) |
| Verificación de citas | Reutilizar `bge-reranker-v2-m3` de la Etapa 1 como scorer de grounding | Agente LLM adicional con prompt de verificación |
| Base de conocimiento | Reutilizar `index.faiss` + `metadata.jsonl` + `grafo.graphml` sin cambios | — |

**Recomendación concreta**: orquestador en LangGraph con 3 agentes especialistas (uno por
fenómeno) + 1 agente verificador de citas + 1 agente de analítica visual invocable como
herramienta (conecta con el Reto 2), todo servido en una GUI de Streamlit con historial de chat.
Esto cumple "mínimo dos agentes" del Reto 1 con margen (5 agentes con roles diferenciados) y deja
la integración con el Reto 2 resuelta por diseño, no como añadido posterior.
