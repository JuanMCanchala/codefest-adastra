# Arquitectura de nivel empresarial para la final (Reto 1 + Reto 2)

> Investigación hecha el 18-sep-2026. Las cifras de estrellas, última actividad y versiones se
> consultaron ese día con `gh api repos/<owner>/<repo>`, la API JSON de PyPI y el registro de npm.
> **No se midieron** tiempos de construcción, latencias ni rendimiento: toda estimación de horas de
> este documento es un juicio del equipo, no una medición, y va marcada como _estimación_.
>
> Complementa (no reemplaza) [`arquitectura_multiagente.md`](arquitectura_multiagente.md) y
> [`analitica_visual_agente.md`](analitica_visual_agente.md).

**Resumen:** conviene construir una **consola de inteligencia** con Next.js, shadcn/ui y AI Elements
que se conecte **directamente** a un backend **FastAPI** que ya contiene la base vectorial de la Etapa 1.
El backend responde por streaming SSE usando el _UI Message Stream Protocol_ del Vercel AI SDK. Los
agentes se organizan en LangGraph: un orquestador, especialistas F1, F2 y F3, un verificador y un
agente de visualización. Este último **empuja** gráficos al chat como _data parts_ tipados
(`data-map`, `data-orbit`, `data-graph`, `data-series`), que la interfaz muestra en línea y en un
panel lateral de artefactos. Si falla la red o el LLM durante la demo, un **modo de repetición**
vuelve a reproducir streams ya grabados. Así, la demo funciona aunque no haya internet ni API.

---

## 1. Referentes de producto: qué los hace "de otro nivel"

### 1.1 Patrones observados (con fuente)

| Referente                       | Patrón concreto                                                                                                                                                                                                                                                                                                                             | Fuente                                                                                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Palantir AIP (Agent Studio)** | **Burbujas de cita** clicables dentro del mensaje y un menú **"Sources"** al pie de cada respuesta. Una cita de documento abre un diálogo con **la página del PDF**, y una cita de ontología abre el objeto. Las citas solo aparecen si el LLM las emite en un formato XML específico, así que el formato de cita forma parte del _prompt_. | https://www.palantir.com/docs/foundry/agent-studio/citations · https://www.palantir.com/docs/foundry/agent-studio/retrieval-context                                                                         |
| **Palantir AIP (análisis)**     | Cada análisis genera un **grafo de dependencias interactivo** de la pregunta a la respuesta, con pasos intermedios inspeccionables y citas en línea enlazadas al resultado de cada herramienta (según un análisis de terceros, no documentación oficial).                                                                                   | https://zerofuturetech.substack.com/p/palantir-aip-agent-ontology-interaction · https://www.palantir.com/docs/foundry/aip/overview                                                                          |
| **Anduril Lattice**             | **COP (Common Operating Picture)** único en 3D que fusiona sensores. Interfaz "más cercana a una app web de consumo que a un terminal mil-spec": dashboards centrados en el mapa, mosaicos de video en vivo y tareas guiadas por flujo de trabajo.                                                                                          | https://www.anduril.com/news/anduril-s-lattice-a-trusted-dual-use-commercial-and-military-platform-for-public-safety-security · https://medium.com/buvcg-research/anduril-industries-deep-dive-6949c7dd41c7 |
| **Scale AI Donovan**            | RAG con **citas para explicabilidad**, "razonamiento detallado transparente" (pasos y recursos que usó el agente), _mapear coordenadas desde las citas del documento_ a un mapa base, un catálogo de agentes por función (Intelligence / Planning / Analysis / Reports) y generación de **informes operacionales**.                         | https://scale.com/donovan · https://aws.amazon.com/marketplace/pp/prodview-e7onk7j7ju6cw                                                                                                                    |
| **Primer Command**              | Monitoreo OSINT de narrativas y temas emergentes con agentes, recuperación de información y "visualizaciones potentes".                                                                                                                                                                                                                     | https://www.primer.ai/products/primer-command                                                                                                                                                               |
| **Vannevar Labs**               | OSINT nativo en IA para defensa, con foco explícito en la UX del analista en entornos de alta presión. No se encontró documentación pública de su interfaz.                                                                                                                                                                                 | https://research.contrary.com/company/vannevar-labs                                                                                                                                                         |
| **Recorded Future AI**          | Conversación en lenguaje natural sobre un **Intelligence Graph** (grafo de ontología más grafo de eventos, con entidades enlazadas: actores, países, TTPs) y **generación automática de informes** para difundir.                                                                                                                           | https://www.recordedfuture.com/platform/recorded-future-ai · https://www.recordedfuture.com/platform/intelligence-graph                                                                                     |
| **Hebbia Matrix**               | Una **cuadrícula** en la que las filas son documentos, las columnas son preguntas y cada celda es la salida de un agente, con **cita clicable al PDF fuente** ("Verifiable Fact Layer"). La arquitectura multiagente separa un _ReadAgent_ (recuperación) de un _OutputAgent_ (formato).                                                    | https://www.hebbia.com/blog/introducing-matrix-the-interface-to-agi · https://www.hebbia.com/blog/divide-and-conquer-hebbias-multi-agent-redesign                                                           |
| **Perplexity**                  | **Citas numeradas en línea**; al pasar el cursor se ve el contexto de la fuente y hay un panel de fuentes expandible. El streaming ocurre en tres fases visibles, _Searching → Reading → Writing_, y **las fuentes aparecen antes que la respuesta** para generar confianza.                                                                | https://aiuxplayground.com/teardowns/perplexity/citations/ · https://blakecrosley.com/guides/design/perplexity                                                                                              |
| **Claude Artifacts / ChatGPT**  | **Panel dividido**: el hilo de chat funciona como "rastro de razonamiento" y el panel derecho es el producto vivo de la sesión (vista previa y código). Según esta fuente, OpenAI retiró Canvas de GPT-5.5 en mayo de 2026 y lo cambió por bloques en línea.                                                                                | https://www.aiuxplayground.com/teardowns/claude/artifacts/ · https://www.aiuxplayground.com/pattern/chat-artifact/ · https://www.shareduo.com/blog/claude-artifacts-vs-chatgpt-canvas                       |
| **Microsoft Security Copilot**  | **Promptbooks**, que son secuencias de prompts preconstruidas tipo _playbook_. Un **Pinboard** lateral fija respuestas y genera un resumen de la sesión, y la sesión se puede compartir.                                                                                                                                                    | https://learn.microsoft.com/en-us/copilot/security/using-promptbooks · https://learn.microsoft.com/en-us/copilot/security/navigating-security-copilot                                                       |

### 1.2 Patrones que se copian (priorizados por impacto ante un jurado militar/académico)

1. **Citas verificables en línea `[1]`**, con _hover_ que muestra el fragmento recuperado (título, fuente, fecha y puntaje del reranker). Al hacer clic se abre el **panel de evidencia**, que muestra el fragmento resaltado y los metadatos del documento. Referentes: Palantir, Perplexity y Hebbia. Es el patrón **número uno**, porque ataca la objeción del jurado: "¿cómo sé que no alucina?".
2. **Traza visible de agentes**: una línea de tiempo plegable con la secuencia _Orquestador → Especialista F2 → Recuperación (k=20 → rerank 5) → Verificador → Visualización_, con la duración de cada paso. Referentes: Donovan ("transparent reasoning") y Palantir (grafo de dependencias). Además, cumple de forma **visible** el requisito de "mínimo dos agentes".
3. **Fuentes antes que la respuesta** y streaming por fases (Perplexity).
4. **Artefactos visuales generados dentro del chat**: el agente de visualización crea un mapa, un globo o un grafo que aparece en línea como tarjeta y se abre en un **panel de artefactos** a la derecha (Claude Artifacts). Es la integración Reto 1 ↔ Reto 2 que pide el enunciado.
5. **Vista COP**: una pestaña "Situación" con mapa de Colombia por municipio y globo LEO, en **modo oscuro táctico** (fondo casi negro, un solo color de acento, tipografía monoespaciada para los datos, estado de clasificación en la barra superior). Referente: Lattice.
6. **Promptbooks** (Security Copilot): 3 botones de "misión" con preguntas preparadas, uno por fenómeno. En la demo **evitan escribir en vivo** y garantizan las preguntas con repetición grabada.
7. **Pin → Informe** (Security Copilot, Recorded Future, Donovan): fijar respuestas y artefactos y exportar un "Informe de inteligencia" en Markdown o PDF con citas. Es opcional si sobra tiempo.

---

## 2. Stack web moderno y su madurez (consultada el 18-sep-2026)

### 2.1 Frontend y chat

| Pieza                                     | Repo                       | ★       | Último push | Versión                                                          | Nota                                                                                                                                                                           |
| ----------------------------------------- | -------------------------- | ------- | ----------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| shadcn/ui                                 | shadcn-ui/ui               | 124.145 | 2026-09-17  | n/a                                                              | Estándar de facto; los componentes se copian al repo.                                                                                                                          |
| Next.js                                   | vercel/next.js             | n/c     | n/c         | `next` 16.3.5                                                    |                                                                                                                                                                                |
| **Vercel AI SDK** (`ai`, `@ai-sdk/react`) | vercel/ai                  | 26.829  | 2026-09-18  | 7.0.107 / 4.0.110                                                | Su **UI Message Stream Protocol** es SSE, **agnóstico de lenguaje** y documentado para backends Python/FastAPI.                                                                |
| **AI Elements**                           | vercel/ai-elements         | 2.441   | 2026-09-01  | n/a                                                              | Registro shadcn con `inline-citation`, `sources`, `chain-of-thought`, `reasoning`, `tool`, `task`, `artifact`, `plan`, `canvas`, `node`/`edge`. Cubre los patrones de la §1.2. |
| **assistant-ui**                          | assistant-ui/assistant-ui  | 12.206  | 2026-09-18  | `@assistant-ui/react` 0.15.21                                    | Primitivas React componibles. Tiene runtime _Data Stream_ (backend propio), runtime LangGraph y _tool UIs_.                                                                    |
| assistant-ui Tool UI                      | assistant-ui/tool-ui       | 784     | 2026-08-31  | n/a                                                              | Componentes para _tool calls_ renderizados.                                                                                                                                    |
| **CopilotKit**                            | CopilotKit/CopilotKit      | 37.408  | 2026-09-18  | `@copilotkit/react-core` 1.72.0                                  | Generative UI (tool rendering, state rendering, A2UI, MCP Apps) sobre AG-UI.                                                                                                   |
| **AG-UI protocol**                        | ag-ui-protocol/ag-ui       | 15.948  | 2026-09-18  | `@ag-ui/client` 1.0.0 · `ag-ui-protocol` (py) 1.0.0 (2026-09-17) | Eventos: `RunStarted/Finished`, `StepStarted/Finished`, `TextMessage*`, `ToolCall*`, `StateSnapshot/Delta`, `Reasoning*`, `Subagent*`, `Custom`.                               |
| agent-chat-ui (LangChain)                 | langchain-ai/agent-chat-ui | 3.166   | 2026-09-14  | n/a                                                              | Requiere LangGraph Agent Server.                                                                                                                                               |
| json-render                               | vercel-labs/json-render    | 16.443  | 2026-09-18  | n/a                                                              | "The Generative UI framework": interfaz declarativa a partir de JSON.                                                                                                          |
| A2UI                                      | a2ui-project/a2ui          | 16.431  | 2026-09-18  | n/a                                                              | Especificación declarativa de UI para agentes.                                                                                                                                 |
| Chainlit                                  | Chainlit/chainlit          | 12.460  | 2026-09-18  | 2.12.0                                                           | **Desde el 1-may-2025 el equipo original dejó el desarrollo activo** y ahora lo mantiene la comunidad ([PyPI](https://pypi.org/project/chainlit/)).                            |

Fuentes: https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol · https://elements.ai-sdk.dev ·
https://www.assistant-ui.com/docs/runtimes/custom/data-stream ·
https://www.assistant-ui.com/docs/runtimes/langgraph/generative-ui ·
https://docs.copilotkit.ai/langgraph-fastapi/concepts/generative-ui-overview ·
https://docs.ag-ui.com/concepts/events

**Puntos finos verificados:**

- El protocolo del AI SDK exige el header `x-vercel-ai-ui-message-stream: v1`. Incluye las partes
  `text-start/delta/end`, `reasoning-*`, `tool-input-start/delta/available`,
  `tool-output-available`, `source-url`, `source-document`, **`data-*` (tipos propios)**,
  `start-step/finish-step`, `finish` y `[DONE]`. Por eso un FastAPI puede hablarlo
  directamente, sin servidor Node intermedio.
- **La Generative UI nativa de LangGraph** (`push_ui_message` + `LoadExternalComponent`) **depende
  de LangSmith/Agent Server** para empaquetar y servir los componentes (`langgraph.json` → `ui`)
  ([docs](https://docs.langchain.com/langsmith/generative-ui-react)). Es una dependencia de
  plataforma que **no conviene** tener en una demo sin red.
- En assistant-ui, el runtime LangGraph necesita el stream mode `"custom"` y `metadata.message_id`
  para enlazar la UI al mensaje. Hay issues conocidos de re-render al recargar
  ([docs](https://www.assistant-ui.com/docs/runtimes/langgraph/generative-ui)).
- El starter oficial de CopilotKit para LangGraph+FastAPI se movió al monorepo
  (`examples/integrations/langgraph-fastapi`). Usa **un `CopilotRuntime` en Node/Hono**
  (`@copilotkit/runtime/v2`) que hace de proxy hacia el FastAPI, y este expone el grafo con
  `add_langgraph_fastapi_endpoint(app, graph, "/agent")` de `ag-ui-langgraph` 0.0.45. Son **dos
  procesos y dos capas de protocolo**.
  https://github.com/CopilotKit/CopilotKit/tree/main/examples/integrations/langgraph-fastapi ·
  https://github.com/ag-ui-protocol/ag-ui/tree/main/integrations/langgraph/python
- PydanticAI expone AG-UI en una línea: `AGUIAdapter.dispatch_request(request, agent=agent)`,
  con estado tipado (`StateDeps`) y eventos propios con `ctx.emit()`
  ([docs](https://pydantic.dev/docs/ai/integrations/ui/ag-ui/)).

### 2.2 Backend y orquestación

| Pieza             | Repo                        | ★      | Último push | Versión (fecha)      |
| ----------------- | --------------------------- | ------ | ----------- | -------------------- |
| FastAPI           | fastapi/fastapi             | n/c    | n/c         | 0.141.1 (2026-07-29) |
| sse-starlette     | sysid/sse-starlette         | 852    | 2026-09-18  | 3.4.11 (2026-09-05)  |
| **LangGraph**     | langchain-ai/langgraph      | 41.902 | 2026-09-18  | 1.2.11 (2026-08-11)  |
| PydanticAI        | pydantic/pydantic-ai        | 20.033 | 2026-09-18  | 2.45.0 (2026-09-18)  |
| OpenAI Agents SDK | openai/openai-agents-python | 29.554 | 2026-09-18  | 0.22.3 (2026-09-17)  |
| CrewAI            | crewAIInc/crewAI            | 58.741 | 2026-09-18  | 1.15.22 (2026-09-16) |
| Langfuse          | langfuse/langfuse           | 34.787 | 2026-09-18  | SDK 4.15.4           |
| Arize Phoenix     | Arize-ai/phoenix            | 11.538 | 2026-09-18  | 20.14.0              |

Lectura para este caso:

- **LangGraph** es la mejor opción porque el flujo es un grafo explícito (router → especialistas en
  paralelo → verificador → visualización), cada nodo es un "agente" visible y cada transición
  se puede emitir como evento de traza. OpenAI Agents SDK (con _handoffs_) y PydanticAI son
  alternativas válidas y más ligeras. CrewAI oculta más el flujo, y eso dificulta mostrar trazas
  deterministas.
- **Observabilidad**: **Phoenix** corre local con `pip` (sin Docker ni red) y sirve como pantalla
  "de ingeniería" para la sesión de preguntas del jurado. Langfuse autoalojado requiere más
  infraestructura. En cualquier caso, **la traza que ve el jurado debe estar dentro del producto**
  (§1.2-2), no en una herramienta externa.

### 2.3 Visualización

| Necesidad                                                  | Librería                                                                          | Repo ★ / push                                | Versión                                                       | Veredicto                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mapa de Colombia por municipio (coropletas, puntos, calor) | **MapLibre GL** + **deck.gl** (`GeoJsonLayer`, `HeatmapLayer`) vía `react-map-gl` | 11.693 / 14.597 / 8.504 (sep-2026)           | maplibre-gl 6.10.0 · deck.gl 9.4.0                            | Recomendado. Funciona **sin mapa base** (solo GeoJSON sobre fondo oscuro), así que no depende de red.                                                                                                                                                                                                                                                                                         |
| Globo / órbitas LEO                                        | **CesiumJS** + Resium                                                             | 15.751 / 884                                 | cesium 1.145.0 · resium 1.26.0                                | El más realista, pero requiere copiar assets y `CESIUM_BASE_URL` en Next. **Offline**: usar la imagen NaturalEarthII incluida (`TileMapServiceImageryProvider.fromUrl(buildModuleUrl("Assets/Textures/NaturalEarthII"))`, `baseLayerPicker:false`, `geocoder:false`) y **sin token Ion** ([guía offline](https://github.com/CesiumGS/cesium/blob/main/Documentation/OfflineGuide/README.md)). |
| Globo alternativo (menos riesgo)                           | **react-globe.gl** (three.js)                                                     | 1.457 / may-2026 (globe.gl 3.175 / ago-2026) | n/c                                                           | Integración trivial en React: arcos, puntos y "paths" de órbita. Es el plan B si Cesium da problemas en Next.                                                                                                                                                                                                                                                                                 |
| Propagación de órbitas                                     | **satellite.js** (SGP4 desde TLE/OMM)                                             | 1.090 / ago-2026                             | 7.1.0                                                         | Estándar en JS.                                                                                                                                                                                                                                                                                                                                                                               |
| Series, comparativas, barras, heatmaps                     | **ECharts** (`echarts-for-react`)                                                 | 67.349 / 5.007                               | echarts-for-react 3.0.6                                       | Tema oscuro nativo, animaciones y buen aspecto "de consola". Plotly (18.337) es la alternativa si el agente produce figuras en Python.                                                                                                                                                                                                                                                        |
| Grafo de entidades (graphml)                               | **Sigma.js** (+ `@react-sigma/core`) o **react-force-graph**                      | 12.168 / 3.301                               | sigma 3.0.3 · react-sigma 5.0.6 · react-force-graph-2d 1.29.1 | Sigma (WebGL) escala a grafos grandes. react-force-graph es más rápido de montar. Cytoscape.js (11.218) sirve si hace falta un layout jerárquico.                                                                                                                                                                                                                                             |

**Datos:**

- **CelesTrak GP**: `https://celestrak.org/NORAD/elements/gp.php?GROUP=STATIONS&FORMAT=JSON`. Se
  actualiza cada 2 h. Desde marzo de 2026, los grupos `active` y `starlink` admiten **una descarga
  por ciclo** (si no, devuelven 403). **Hay que descargar una vez y cachear en el repo**
  ([doc](https://celestrak.org/NORAD/documentation/gp-data-formats.php)).
- **Municipios de Colombia (GeoJSON/TopoJSON)**: los derivados del MGN del DANE están en
  https://github.com/caticoa3/colombia_mapa y en el gist de John Guerra
  https://gist.github.com/john-guerra/727e8992e9599b9d9f1dbfdc4c8e479e. La fuente oficial es el
  [geoportal del DANE](https://geoportal.dane.gov.co/servicios/descarga-y-metadatos/descarga-mgn-marco-geoestadistico-nacional/).
  Conviene simplificar con mapshaper y **servirlo como archivo estático**.

### 2.4 Plantillas y starters (qué dan hecho)

| Starter                                                                              | ★ / push          | Qué da                                                                                     | Encaje                                                           |
| ------------------------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| **AI Elements** (registro shadcn; `npx ai-elements@latest`, ver elements.ai-sdk.dev) | 2.441 / sep-2026  | Chat, citas en línea, fuentes, cadena de pensamiento, tool, artifact y canvas de nodos     | **Base del chat (A1)**.                                          |
| **CopilotKit `examples/integrations/langgraph-fastapi`**                             | monorepo 37.408   | Next.js + CopilotRuntime + FastAPI/LangGraph por AG-UI, con generative UI, A2UI y MCP apps | **Base de A2**, completa pero con más piezas.                    |
| CopilotKit/open-research-ANA                                                         | 407 / sep-2026    | "Research canvas" con LangGraph, búsqueda y HITL                                           | Referencia de layout chat + lienzo.                              |
| assistant-ui/assistant-ui-starter-langgraph                                          | 29 / feb-2026     | assistant-ui + LangGraph Server                                                            | Poca adopción, **no recomendado**.                               |
| **Kiranism/next-shadcn-dashboard-starter**                                           | 7.018 / sep-2026  | Dashboard Next.js + shadcn (sidebar, layout, tablas, gráficos)                             | Esqueleto de la consola: navegación y vistas.                    |
| satnaing/shadcn-admin                                                                | 14.251 / sep-2026 | Admin shadcn (Vite)                                                                        | Alternativa de layout sin Next.                                  |
| vstorm-co/full-stack-ai-agent-template                                               | 1.903 / sep-2026  | Generador FastAPI + Next.js con agentes, RAG y streaming                                   | Útil para ver estructura, aunque es demasiado grande para 1 día. |
| fastapi/full-stack-fastapi-template                                                  | 45.625 / sep-2026 | FastAPI + React/Vite + shadcn + Postgres                                                   | Sobredimensionado (auth, BD) para esta demo.                     |
| doganarif/fastapi-ai-sdk                                                             | 63 / jun-2026     | Helper para emitir el protocolo AI SDK desde FastAPI                                       | Poca madurez. Mejor escribir el emisor SSE (~60 líneas) a mano.  |

---

## 3. Comparación de arquitecturas completas

- **A1 (recomendada):** Next.js 16 + shadcn + **AI Elements** + `useChat` (AI SDK) ⇄ **FastAPI**
  (SSE con UI Message Stream Protocol) ⇄ LangGraph + FAISS/BGE-M3/reranker/graphml **en el mismo
  proceso**.
- **A2:** Next.js + **CopilotKit** (CopilotRuntime en Node) ⇄ AG-UI ⇄ FastAPI +
  `ag-ui-langgraph` ⇄ LangGraph.
- **B:** **Chainlit** pulido (tema, `cl.Step` para trazas, `CustomElement` JSX, Plotly en línea).
- **C:** **Streamlit** (`st.chat_message`, `st.status`, pydeck/plotly).

| Criterio                              | A1 Next+AI Elements+FastAPI                                                                                       | A2 Next+CopilotKit+AG-UI                                                           | B Chainlit                                                                                                                                                           | C Streamlit                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Calidad visual percibida              | **Muy alta**: control total, consola táctica propia y panel de artefactos                                         | Muy alta, pero con aspecto "CopilotKit" si no se personaliza                       | Media-alta: se reconoce como "app de Chainlit"                                                                                                                       | Media: se reconoce como prototipo, que es justo lo que se quiere evitar                |
| Tiempo de construcción (_estimación_) | 10–14 h-persona para el núcleo                                                                                    | 10–16 h-persona (más piezas y versiones `runtime/v2` recientes)                    | 5–8 h                                                                                                                                                                | 4–6 h                                                                                  |
| Riesgo en demo                        | Bajo si hay modo de repetición: un solo protocolo y un solo backend Python. El frontend se puede servir compilado | Medio: 2 procesos (Node runtime + FastAPI), 2 protocolos y más superficie de fallo | Bajo-medio. Issues abiertos de CustomElement que no re-renderiza al recargar ([#2576](https://github.com/Chainlit/chainlit/issues/2576)) y mantenimiento comunitario | Bajo técnicamente, pero el modelo de _rerun_ complica el streaming y los mapas pesados |
| Integración con Python/FAISS          | **Directa**: FAISS vive en FastAPI                                                                                | Directa (FastAPI)                                                                  | Directa                                                                                                                                                              | Directa                                                                                |
| Mostrar trazas de agentes             | Partes `data-trace` y `reasoning`, más el componente `chain-of-thought`/`task`                                    | Nativo: `StepStarted/Finished`, `Subagent*`, state rendering                       | Nativo con `cl.Step` (muy bueno y gratis)                                                                                                                            | `st.status`, más limitado                                                              |
| Visualizaciones generadas en el chat  | Partes `data-map/orbit/graph/series` renderizadas por componentes React (deck.gl, Cesium, Sigma, ECharts)         | _Tool call rendering_ / `useComponent` / A2UI                                      | Plotly en línea bien; deck.gl y Cesium solo vía JSX propio o iframe                                                                                                  | pydeck y plotly en línea; Cesium y Sigma solo vía componentes custom                   |
| Offline                               | Sí: tiles no necesarios, NaturalEarthII y GeoJSON estático                                                        | Sí, con el mismo trabajo                                                           | Sí                                                                                                                                                                   | Sí                                                                                     |

**Conclusión:** A1 y A2 comparten el "techo" visual. **A1 gana en riesgo**: un solo backend Python,
un solo protocolo documentado y sin runtime Node intermedio. Además, conserva la opción de migrar a
AG-UI después. B es el **plan de contingencia** si a mitad de jornada el frontend no converge:
el mismo backend se puede montar en Chainlit en ~2 h (_estimación_), porque los agentes no
dependen de la UI. **C se descarta**, porque el objetivo explícito es no parecer un prototipo.

---

## 4. Recomendación final

### 4.1 Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind + **shadcn/ui** + **AI Elements**
  - `@ai-sdk/react` (`useChat` con `DefaultChatTransport` apuntando al FastAPI).
- **Visualización:** `react-map-gl` (MapLibre) + deck.gl · CesiumJS/Resium, con **react-globe.gl
  como plan B** · satellite.js · echarts-for-react · @react-sigma/core.
- **Backend:** FastAPI + `sse-starlette`, un endpoint `POST /api/chat` que emite el UI Message
  Stream Protocol. LangGraph para los agentes. Carga del índice FAISS, BGE-M3, reranker y
  graphml **una sola vez** al arrancar (lifespan).
- **Observabilidad:** traza propia dentro de la UI y Phoenix local como opcional.
- **LLM:** el que ya use el equipo. Es imprescindible el **modo repetición** para no depender de él.

### 4.2 Agentes (≥2 en Reto 1, ≥1 en Reto 2, todos visibles en la traza)

```
Usuario ─▶ Orquestador (clasifica F1/F2/F3, decide si hay visualización)
            ├─▶ Especialista F1 ─┐   (RAG filtrado por fenómeno: FAISS → reranker → grafo)
            ├─▶ Especialista F2 ─┼─▶ Verificador (cada afirmación ↔ fragmento; marca "sin soporte")
            ├─▶ Especialista F3 ─┘
            └─▶ Agente de Visualización (Reto 2): elige plantilla + filtros → emite data-* spec
```

El agente de visualización **no genera código**. Elige de un **catálogo cerrado** de 5–6
plantillas y rellena una especificación JSON validada con Pydantic. Esto sigue la estrategia 3 de
`analitica_visual_agente.md`, con riesgo cero de código arbitrario.

### 4.3 Protocolo agente → UI ("empujar" gráficos al chat)

Sobre SSE (`x-vercel-ai-ui-message-stream: v1`), en este orden, para imitar a Perplexity:

```
data: {"type":"start","messageId":"m1"}
data: {"type":"data-trace","id":"t1","data":{"agent":"Orquestador","status":"done","ms":180,"detail":"F2 + visualización"}}
data: {"type":"data-trace","id":"t2","data":{"agent":"Especialista F2","status":"running"}}
data: {"type":"source-document","sourceId":"S1","mediaType":"text/plain","title":"ESA Space Environment Report 2025"}
data: {"type":"data-evidence","id":"S1","data":{"doc_id":"...","chunk":"...","score":0.91,"fenomeno":"F2","url":"..."}}
data: {"type":"text-start","id":"x"}
data: {"type":"text-delta","id":"x","delta":"La congestión en LEO … [S1]"}
data: {"type":"text-end","id":"x"}
data: {"type":"data-trace","id":"t3","data":{"agent":"Verificador","status":"done","supported":7,"unsupported":0}}
data: {"type":"data-orbit","id":"v1","data":{"title":"Estaciones y debris <600 km","tle_group":"STATIONS","highlight":[25544]}}
data: {"type":"finish"}
data: [DONE]
```

- Las partes `data-*` con **el mismo `id` se reemplazan**, así que la traza se actualiza de
  `running` a `done` en vivo. Los tipos se declaran en TS con `UIMessage<…, DataParts>`
  ([streaming data](https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data)).
- En el frontend, un `switch (part.type)` decide qué pintar:
  - `data-map` → `<ColombiaMap/>`
  - `data-orbit` → `<OrbitGlobe/>`
  - `data-graph` → `<EntityGraph/>`
  - `data-series` → `<SeriesChart/>`
  - `data-trace` → `<AgentTrace/>`
  - `source-document` / `data-evidence` → `<InlineCitation/>` + `<EvidencePanel/>`

  Cada visualización se renderiza **como tarjeta en línea** con botón "Abrir en panel", que la
  pasa al panel de artefactos o a la vista COP.

- **Datos pesados** (GeoJSON, TLE, graphml): **no** viajan por el stream. La spec lleva IDs y
  filtros, y el componente pide los datos a `GET /api/data/...` o a `/public/data/` estático.
- Migración futura: cada `data-*` corresponde a un `Custom`/`ToolCall*` de AG-UI si más adelante
  se adopta CopilotKit.

### 4.4 Estructura de carpetas

```
codefest-adastra-final/
├── backend/                      # FastAPI + agentes (importa la base de la Etapa 1)
│   ├── app/main.py               # lifespan: carga FAISS, BGE-M3, reranker, graphml
│   ├── app/stream.py             # emisor UI Message Stream Protocol (SSE)
│   ├── app/api/chat.py           # POST /api/chat
│   ├── app/api/data.py           # GET /api/data/{municipios|tle|grafo|series}
│   ├── app/agents/graph.py       # LangGraph: orquestador → especialistas → verificador → viz
│   ├── app/agents/{orquestador,especialista,verificador,visualizacion}.py
│   ├── app/viz/specs.py          # modelos Pydantic de cada plantilla (catálogo cerrado)
│   ├── app/replay/               # grabador y reproductor de streams (modo demo)
│   │   └── cassettes/*.jsonl     # respuestas grabadas de las preguntas del pitch
│   └── tests/
├── frontend/                     # Next.js 16 + shadcn + AI Elements
│   ├── app/(console)/chat/page.tsx       # chat + panel de evidencia + panel de artefactos
│   ├── app/(console)/situacion/page.tsx  # vista COP: mapa Colombia + globo LEO
│   ├── components/ai-elements/   # generado por el registro
│   ├── components/viz/{ColombiaMap,OrbitGlobe,EntityGraph,SeriesChart}.tsx
│   ├── components/intel/{AgentTrace,EvidencePanel,Promptbooks,ClassificationBar}.tsx
│   ├── lib/parts.ts              # tipos DataParts compartidos (espejo de specs.py)
│   └── public/data/              # municipios.topojson, tle_cache.json, grafo.json (offline)
├── reto1/  reto2/                # documentación de entrega (ya existen)
└── docs/investigacion/
```

### 4.5 Qué clonar o instalar

1. `npx create-next-app@latest frontend` y luego `npx shadcn@latest init`. Después, agregar los
   componentes de **AI Elements** (conversation, message, inline-citation, sources,
   chain-of-thought, task, tool, artifact, prompt-input) desde https://elements.ai-sdk.dev.
2. Tomar el **layout** (sidebar, header, tema) de `Kiranism/next-shadcn-dashboard-starter` como
   referencia; no conviene clonarlo entero.
3. Mirar `CopilotKit/examples/integrations/langgraph-fastapi` y `CopilotKit/open-research-ANA`
   solo para el patrón chat + lienzo. No se usan como base (A1).
4. Backend: `pip install fastapi sse-starlette langgraph`, más la base de la Etapa 1 como paquete.

### 4.6 Fallback offline (antirriesgo de demo)

- **Modo `DEMO_MODE=replay`**: cada respuesta real se graba en `cassettes/*.jsonl` (los eventos
  SSE con sus tiempos). En modo replay, el endpoint reproduce el cassette con los mismos
  intervalos si la pregunta coincide con un promptbook. Visualmente es idéntico a una respuesta en
  vivo.
- **Modo `live` con timeout**: si el LLM no responde en N segundos, se cae al cassette más cercano
  por similitud de la pregunta (BGE-M3 ya está cargado).
- **Sin red**: sin tiles remotos, con Cesium NaturalEarthII, TLE cacheados, fuentes de Google
  **autoalojadas** (`next/font/local`) y el frontend compilado (`next build && next start`).
- Llevar **dos máquinas** con la misma build y un **video de respaldo** de 2 min de la demo.

### 4.7 Plan por horas (equipo de 3–4; horas relativas H0 = inicio)

Hitos del enunciado: **Reto 1 a las 08:00** y **Reto 2 a las 12:30** (ver `README.md`). El plan
llega a un Reto 1 entregable y _luego_ agrega la analítica. Todas las duraciones son _estimaciones_.

| Bloque    | Backend (1–2 personas)                                                                                                   | Frontend (1–2 personas)                                                                                               | Resultado verificable                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **H0–H1** | FastAPI con lifespan que carga la base de la Etapa 1. Endpoint `/api/chat` que emite **texto fijo** con el protocolo SSE | Next + shadcn + AI Elements. `useChat` contra el backend. Tema oscuro táctico                                         | "Hola mundo" en streaming de extremo a extremo                                            |
| **H1–H3** | LangGraph: orquestador + 3 especialistas (RAG filtrado) + emisión de `data-trace` y `source-document`/`data-evidence`    | `AgentTrace`, `InlineCitation` con hover, `EvidencePanel` lateral                                                     | **Reto 1 funcional con citas y traza** (lo más importante para el jurado)                 |
| **H3–H4** | Verificador (reranker como juez de soporte) y marca "sin soporte". Grabador de cassettes                                 | Promptbooks (3 misiones). Barra de clasificación. Estados de carga "Buscando → Leyendo → Redactando"                  | Grabar cassettes de las preguntas del pitch. **Congelar la entrega del Reto 1** (tag git) |
| **H4–H6** | Agente de visualización con catálogo `map`/`series`/`graph` (specs Pydantic) y endpoints `/api/data/*`                   | `ColombiaMap` (deck.gl GeoJsonLayer coroplético), `SeriesChart` (ECharts), `EntityGraph` (Sigma desde graphml → JSON) | Tres visualizaciones empujadas desde el chat                                              |
| **H6–H7** | Plantilla `orbit` (TLE cacheado + satellite.js en el cliente)                                                            | `OrbitGlobe`: Cesium offline, con **react-globe.gl si Cesium falla en 45 min**                                        | Globo LEO en el chat y en la vista COP                                                    |
| **H7–H8** | Modo replay y timeout → cassette. Pruebas                                                                                | Vista "Situación" (COP) que reúne los artefactos fijados. Pulido                                                      | **Congelar la entrega del Reto 2**. Grabar cassettes finales y video de respaldo          |
| **H8+**   | Documentación de uso y diseño (requisito transversal)                                                                    | Ensayo del pitch 2×, con red cortada al menos 1 vez                                                                   | Pitch listo                                                                               |

**Orden de sacrificio** si falta tiempo:

1. El globo Cesium, sustituido por react-globe.gl.
2. La vista COP separada, sustituida por el panel de artefactos.
3. El verificador como agente, sustituido por un umbral del reranker.
4. Phoenix.

**Nunca se sacrifican:** citas + panel de evidencia, traza de agentes y modo replay.

### 4.8 Guion de pitch sugerido (lo que impresiona)

1. **Misión F2**: "¿Qué tan congestionada está LEO y qué riesgo implica para Colombia?".
   Se muestra la traza (orquestador → F2 → verificador), las fuentes antes que el texto y las citas
   `[S1]` con hover. Luego el agente de visualización empuja el globo con las órbitas.
2. **Misión F3**: pregunta territorial. Aparece el mapa por municipio en línea, se abre en el panel
   y se hace clic en una cita, que abre el fragmento original.
3. **Misión F1**: el grafo de entidades (actores–capacidades–países) desde el graphml.
4. Cierre: "cada afirmación es verificable; 0 afirmaciones sin soporte". Se muestra el
   contador del verificador y se menciona que funciona **sin internet** (modo replay).

---

## Fuentes principales

- Palantir AIP citations: https://www.palantir.com/docs/foundry/agent-studio/citations
- Scale Donovan: https://scale.com/donovan
- Anduril Lattice: https://www.anduril.com/news/anduril-s-lattice-a-trusted-dual-use-commercial-and-military-platform-for-public-safety-security
- Hebbia Matrix: https://www.hebbia.com/blog/introducing-matrix-the-interface-to-agi
- Recorded Future AI: https://www.recordedfuture.com/platform/recorded-future-ai
- Perplexity citations UX: https://aiuxplayground.com/teardowns/perplexity/citations/
- Claude Artifacts UX: https://www.aiuxplayground.com/teardowns/claude/artifacts/
- Security Copilot: https://learn.microsoft.com/en-us/copilot/security/using-promptbooks
- AI SDK stream protocol: https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol
- AI Elements: https://github.com/vercel/ai-elements
- assistant-ui Data Stream / LangGraph GenUI: https://www.assistant-ui.com/docs/runtimes/custom/data-stream · https://www.assistant-ui.com/docs/runtimes/langgraph/generative-ui
- AG-UI eventos: https://docs.ag-ui.com/concepts/events
- CopilotKit generative UI: https://docs.copilotkit.ai/langgraph-fastapi/concepts/generative-ui-overview
- ag-ui-langgraph: https://github.com/ag-ui-protocol/ag-ui/tree/main/integrations/langgraph/python
- LangGraph Generative UI (requiere Agent Server): https://docs.langchain.com/langsmith/generative-ui-react
- PydanticAI AG-UI: https://pydantic.dev/docs/ai/integrations/ui/ag-ui/
- Chainlit (mantenimiento comunitario): https://pypi.org/project/chainlit/ · issue https://github.com/Chainlit/chainlit/issues/2576
- Cesium offline: https://github.com/CesiumGS/cesium/blob/main/Documentation/OfflineGuide/README.md
- CelesTrak GP: https://celestrak.org/NORAD/documentation/gp-data-formats.php
- Municipios Colombia: https://github.com/caticoa3/colombia_mapa
