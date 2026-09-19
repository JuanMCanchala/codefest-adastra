# Proyectos open source de referencia para la final (plataforma de inteligencia estratégica)

Fecha de consulta: 18-sep-2026. Estrellas, último push, licencia y estado de archivado se
consultaron ese día con `gh api repos/<owner>/<repo>`. Las licencias marcadas como
`NOASSERTION` por GitHub se leyeron en el archivo `LICENSE` del repo. "Último push" es el campo
`pushed_at` (último push a cualquier rama), no necesariamente el último release.

Este documento complementa `repos_utiles.md`, que ya cubre las **librerías puntuales**
(satellite-js, Cesium, python-sgp4, LangGraph, Streamlit, Chainlit, LIDA, pyvis, deck.gl,
KeepTrack, StuffInSpace, gods-eye-view, colombia_mapa, etc.). Aquí solo aparecen **productos
completos** que sirven de referencia de UX, arquitectura o componentes.

Regla de licencias que aplicamos:

- **MIT / Apache-2.0 / BSD**: se puede copiar código conservando el aviso de copyright.
- **AGPL / GPL / Elastic (ELv2) / CC BY-NC / sin licencia**: **no se copia código a nuestro repo**.
  Solo inspiración de UX y de arquitectura (capturas, flujos, nombres de paneles).
- **Open-core** (OpenCTI, Onyx): la parte comunitaria es Apache/MIT, pero los directorios `ee/`
  tienen licencia comercial; no tocarlos.

---

## 1. Tabla general

| Repo                                                                                                    | Cat. | Qué es (una línea)                                                                   | Stack                                                  | ★       | Último push                  | Licencia                                       | Veredicto                                                           |
| ------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------- | ---------------------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| [koala73/worldmonitor](https://github.com/koala73/worldmonitor)                                         | 1    | Dashboard global de inteligencia en tiempo real con resúmenes IA                     | TS, Vite, globe.gl + deck.gl, Tauri, Ollama            | 86.934  | 2026-09-18                   | AGPL-3.0                                       | Inspiración principal de layout                                     |
| [simplifaisoul/osiris](https://github.com/simplifaisoul/osiris)                                         | 1    | Dashboard OSINT tipo HUD (vuelos, conflicto, sanciones)                              | Next.js 16, MapLibre GL                                | 9.661   | 2026-09-18                   | MIT                                            | Tomar HUD y rutas `/api/*`                                          |
| [BigBodyCobain/Shadowbroker](https://github.com/BigBodyCobain/Shadowbroker)                             | 1    | Mapa "dark-ops" con 40+ capas y canal para agente co-analista                        | Next.js, MapLibre, FastAPI                             | 11.187  | 2026-09-18                   | AGPL-3.0                                       | Inspiración (estética, dossier por país)                            |
| [Dev-next-gen/orodruin](https://github.com/Dev-next-gen/orodruin)                                       | 1/6  | "Alternativa a Gotham": mapa 2D/3D + grafo de actores + analista IA que maneja la UI | JS, LLM compatible OpenAI                              | 52      | 2026-09-11                   | AGPL-3.0                                       | Inspiración clave (agente que controla la UI)                       |
| [AndrewCTF/velocity](https://github.com/AndrewCTF/velocity)                                             | 1    | Consola de situación con historial, procedencia y confianza por contacto             | Python, Postgres/TimescaleDB, MCP                      | 92      | 2026-09-17                   | AGPL-3.0                                       | Inspiración (procedencia, informe HTML/PPTX)                        |
| [OpenCTI-Platform/opencti](https://github.com/OpenCTI-Platform/opencti)                                 | 1    | Plataforma de inteligencia de amenazas (STIX2, grafo de conocimiento)                | TS/React, GraphQL, ElasticSearch, Redis                | 10.020  | 2026-09-18 (rel. 2026-09-17) | Apache-2.0 (CE) + EE comercial                 | Modelo de datos y vistas de entidad                                 |
| [openaleph/openaleph](https://github.com/openaleph/openaleph)                                           | 1    | Fork mantenido de Aleph (OCCRP): búsqueda de documentos + entidades                  | Python/Flask, React, ElasticSearch, FtM                | 131     | 2026-09-16                   | MIT                                            | Referencia de ficha de entidad; Aleph original descontinuado        |
| [hipcityreg/situation-monitor](https://github.com/hipcityreg/situation-monitor)                         | 1    | Dashboard de noticias/mercados/geopolítica                                           | TS                                                     | 4.190   | 2026-01-13                   | Sin licencia                                   | Solo mirar (sin licencia = todos los derechos reservados)           |
| [infiniflow/ragflow](https://github.com/infiniflow/ragflow)                                             | 2    | Motor RAG empresarial con parsing profundo y citas con vista del fragmento           | Python, Go, React, Elasticsearch/Infinity              | 90.959  | 2026-09-18 (v0.27.2)         | Apache-2.0                                     | Tomar UX de "chunk" citado                                          |
| [onyx-dot-app/onyx](https://github.com/onyx-dot-app/onyx)                                               | 2    | Plataforma de chat/búsqueda empresarial (ex Danswer) con conectores                  | Python/FastAPI, Next.js, Vespa                         | 32.162  | 2026-09-18                   | MIT + `ee/` comercial                          | Tomar panel de fuentes y filtros                                    |
| [Cinnamon/kotaemon](https://github.com/Cinnamon/kotaemon)                                               | 2    | UI RAG limpia con citas resaltadas en el PDF y GraphRAG                              | Python, Gradio                                         | 25.774  | 2026-07-14                   | Apache-2.0                                     | Tomar panel de evidencia (Top 8)                                    |
| [open-webui/open-webui](https://github.com/open-webui/open-webui)                                       | 2    | Interfaz de chat autoalojada más popular                                             | Python, SvelteKit                                      | 152.497 | 2026-09-18                   | Open WebUI License (BSD-3 + cláusula de marca) | Mirar; no forkear (exige conservar su marca)                        |
| [danny-avila/LibreChat](https://github.com/danny-avila/LibreChat)                                       | 2    | Clon de ChatGPT con agentes, MCP y artefactos                                        | TS, React, Node, MongoDB                               | 44.331  | 2026-09-18                   | MIT                                            | Tomar "Artifacts" laterales                                         |
| [Mintplex-Labs/anything-llm](https://github.com/Mintplex-Labs/anything-llm)                             | 2    | Workspaces RAG local-first con agentes                                               | JS, React, Node                                        | 66.193  | 2026-09-18                   | MIT                                            | Tomar concepto de workspace por tema                                |
| [ItzCrazyKns/Vane](https://github.com/ItzCrazyKns/Vane) (ex Perplexica)                                 | 2    | Motor de respuestas tipo Perplexity con modos velocidad/calidad                      | Next.js, TS, SearxNG                                   | 36.871  | 2026-09-01                   | MIT                                            | Tomar modos y widgets                                               |
| [miurla/morphic](https://github.com/miurla/morphic)                                                     | 2/4  | Buscador IA con UI generativa y respuestas citadas                                   | Next.js, Vercel AI SDK, Postgres, Supabase             | 9.128   | 2026-09-18                   | Apache-2.0                                     | Tomar UX de respuesta citada (Top 8)                                |
| [khoj-ai/khoj](https://github.com/khoj-ai/khoj)                                                         | 2    | "Segundo cerebro" con investigación y agentes                                        | Python/Django, Next.js                                 | 37.405  | 2026-08-02                   | AGPL-3.0                                       | Solo inspiración                                                    |
| [assafelovic/gpt-researcher](https://github.com/assafelovic/gpt-researcher)                             | 3    | Agente de investigación planner → researchers → publisher con citas                  | Python, LangGraph (multi_agents), Next.js              | 29.514  | 2026-08-27                   | Apache-2.0                                     | Tomar el equipo multiagente (Top 8)                                 |
| [stanford-oval/storm](https://github.com/stanford-oval/storm)                                           | 3    | STORM / Co-STORM: informe tipo Wikipedia con citas y mapa mental                     | Python, dspy                                           | 31.443  | 2025-09-30                   | MIT                                            | Tomar el patrón de perspectivas y esquema; sin actividad hace 1 año |
| [langchain-ai/deepagents](https://github.com/langchain-ai/deepagents)                                   | 3    | Arnés de agentes de LangChain (planificación, subagentes, sistema de archivos)       | Python, LangGraph                                      | 29.547  | 2026-09-18                   | MIT                                            | Sucesor práctico de open_deep_research                              |
| [langchain-ai/open_deep_research](https://github.com/langchain-ai/open_deep_research)                   | 3    | Deep research configurable (supervisor + investigadores)                             | Python, LangGraph                                      | 12.687  | 2026-08-10                   | MIT, **archivado**                             | Leer el grafo; no depender                                          |
| [bytedance/deer-flow](https://github.com/bytedance/deer-flow)                                           | 3    | "Super agent harness" con subagentes, memoria y sandbox (v2 reescrito)               | Python, LangGraph, Next.js                             | 82.657  | 2026-09-18                   | MIT                                            | Tomar la UI de pasos (rama 1.x = deep research)                     |
| [dzhng/deep-research](https://github.com/dzhng/deep-research)                                           | 3    | Deep research mínimo (~500 líneas): profundidad × amplitud                           | TS                                                     | 19.698  | 2026-04-11                   | MIT                                            | Referencia didáctica del bucle                                      |
| [Alibaba-NLP/DeepResearch](https://github.com/Alibaba-NLP/DeepResearch)                                 | 3    | Tongyi DeepResearch: modelo + agente de investigación                                | Python                                                 | 19.967  | 2026-02-27                   | Apache-2.0                                     | Descartar (centrado en entrenar el modelo)                          |
| [SkyworkAI/DeepResearchAgent](https://github.com/SkyworkAI/DeepResearchAgent)                           | 3    | Sistema jerárquico multiagente (planner + especialistas)                             | Python                                                 | 3.546   | 2026-05-04                   | MIT                                            | Referencia de jerarquía                                             |
| [CopilotKit/CopilotKit](https://github.com/CopilotKit/CopilotKit)                                       | 4    | Stack frontend para agentes y UI generativa (creadores de AG-UI)                     | TS/React, integra LangGraph Python                     | 37.408  | 2026-09-18 (v1.72.0)         | MIT                                            | Referencia de patrón "tool → componente"                            |
| [ag-ui-protocol/ag-ui](https://github.com/ag-ui-protocol/ag-ui)                                         | 4    | Protocolo de eventos agente ↔ UI (streaming, estado, tool calls)                     | TS + SDK Python                                        | 15.948  | 2026-09-18                   | MIT                                            | Tomar el vocabulario de eventos (Top 8)                             |
| [vercel/chatbot](https://github.com/vercel/chatbot) (ex ai-chatbot)                                     | 4    | Plantilla Next.js de chatbot con artefactos y tools                                  | Next.js, AI SDK, shadcn/ui                             | 20.955  | 2026-07-08                   | Apache-2.0                                     | Tomar layout chat + artefacto                                       |
| [assistant-ui/assistant-ui](https://github.com/assistant-ui/assistant-ui)                               | 4    | Librería React de primitivas de chat (tool UIs, citas)                               | TS/React                                               | 12.206  | 2026-09-18                   | MIT                                            | Usar si el front es React                                           |
| [vercel-labs/json-render](https://github.com/vercel-labs/json-render)                                   | 4    | UI generativa desde un spec JSON con catálogo de componentes cerrado                 | TS, React/shadcn, Vue, PDF                             | 16.443  | 2026-09-18                   | Apache-2.0                                     | Tomar la idea de catálogo cerrado                                   |
| [tambo-ai/tambo](https://github.com/tambo-ai/tambo)                                                     | 4    | SDK React: componentes registrados con Zod que el agente elige                       | TS/React                                               | 11.184  | 2026-09-17                   | MIT                                            | Alternativa a CopilotKit                                            |
| [thesysdev/openui](https://github.com/thesysdev/openui)                                                 | 4    | Lenguaje compacto de UI generativa en streaming                                      | TS/React                                               | 9.674   | 2026-09-18                   | MIT                                            | Mirar                                                               |
| [a2ui-project/a2ui](https://github.com/a2ui-project/a2ui) (ex google/A2UI)                              | 4    | Estándar de Google para UIs generadas por agentes                                    | TS + renderers                                         | 16.431  | 2026-09-18                   | Apache-2.0                                     | Mirar (v0.9, aún en preview)                                        |
| [langchain-ai/langgraphjs-gen-ui-examples](https://github.com/langchain-ai/langgraphjs-gen-ui-examples) | 4    | Ejemplos de agentes LangGraph.js con UI generativa                                   | TS                                                     | 402     | 2025-05-01                   | MIT, **archivado**                             | Solo leer                                                           |
| [keplergl/kepler.gl](https://github.com/keplergl/kepler.gl)                                             | 5    | Herramienta de análisis geoespacial con asistente IA y DuckDB                        | TS/React, deck.gl, DuckDB                              | 12.013  | 2026-09-18 (v3.3.0-alpha.12) | MIT                                            | Tomar asistente IA sobre el mapa                                    |
| [nasa/openmct](https://github.com/nasa/openmct)                                                         | 5    | Framework web de control de misión de la NASA                                        | JS/Vue                                                 | 13.127  | 2026-09-11                   | Apache-2.0                                     | Tomar estética de telemetría y línea de tiempo                      |
| [Flowm/satvis](https://github.com/Flowm/satvis)                                                         | 5    | Rastreador 3D de satélites y predictor de pases                                      | TS, CesiumJS, Vue                                      | 406     | 2026-09-13                   | MIT                                            | Tomar el visor orbital                                              |
| [nasa-gibs/worldview](https://github.com/nasa-gibs/worldview)                                           | 5    | Visor de imágenes satelitales con timeline                                           | JS/React, OpenLayers                                   | 1.867   | 2026-09-18                   | NASA Open Source Agreement 1.3                 | Tomar control de línea de tiempo                                    |
| [neo4j-contrib/neodash](https://github.com/neo4j-contrib/neodash)                                       | 5    | Constructor de dashboards sobre un grafo (tarjetas: grafo, mapa, tabla, serie)       | TS/React                                               | 516     | 2026-09-09                   | Apache-2.0                                     | Tomar la rejilla de tarjetas                                        |
| [gephi/gephi-lite](https://github.com/gephi/gephi-lite)                                                 | 5    | Gephi web para explorar grafos                                                       | TS, sigma.js                                           | 352     | 2026-09-18                   | GPL-3.0                                        | Solo inspiración                                                    |
| [developmentseed/lonboard](https://github.com/developmentseed/lonboard)                                 | 5    | Mapas deck.gl rápidos desde Python (GeoArrow)                                        | Python, deck.gl                                        | 964     | 2026-09-17                   | MIT                                            | Alternativa Python a deck.gl                                        |
| [graphistry/pygraphistry](https://github.com/graphistry/pygraphistry)                                   | 5    | Exploración de grafos grandes con GPU desde Python                                   | Python                                                 | 2.555   | 2026-09-18                   | BSD-3-Clause                                   | Mirar (el render remoto exige cuenta)                               |
| [PremaanshVyas/satlas](https://github.com/PremaanshVyas/satlas)                                         | 5/6  | Conciencia situacional espacial con un agente que mueve el globo                     | React + Three.js, FastAPI + skyfield, pgvector, Claude | 31      | 2026-09-10                   | MIT                                            | Inspiración clave para F2 (Top 8)                                   |
| [vericle/intellyweave](https://github.com/vericle/intellyweave)                                         | 6    | Análisis OSINT de documentos: GLiNER + mapa 3D + red + agentes que debaten           | Python, Mapbox, multi-LLM                              | 75      | 2026-09-02                   | BSD-3-Clause                                   | Referencia más cercana a nuestro stack (Top 8)                      |
| [assafkip/kipi](https://github.com/assafkip/kipi)                                                       | 6    | Documentos → grafo de entidades investigado, con evidencia graduada                  | Python, Claude                                         | 72      | 2026-09-05                   | Elastic License 2.0                            | Solo inspiración (grados de evidencia)                              |
| [mantisfury/ArkhamMirror](https://github.com/mantisfury/ArkhamMirror)                                   | 6    | Inteligencia documental local para periodismo investigativo                          | Python                                                 | 489     | 2026-01-25                   | MIT                                            | Mirar                                                               |
| [OpenOSINT/OpenOSINT](https://github.com/OpenOSINT/OpenOSINT)                                           | 6    | Agente OSINT con REPL, servidor MCP y 20 herramientas                                | Python                                                 | 1.603   | 2026-09-18                   | MIT                                            | Mirar (orientado a personas/dominios, no a geopolítica)             |
| [calesthio/Crucix](https://github.com/calesthio/Crucix)                                                 | 6    | Agente personal de inteligencia que vigila fuentes y alerta cambios                  | JS                                                     | 11.751  | 2026-05-20                   | AGPL-3.0                                       | Solo inspiración (alertas)                                          |
| [palantir/blueprint](https://github.com/palantir/blueprint)                                             | 6    | Toolkit React de Palantir para interfaces densas de análisis                         | TS/React                                               | 22.073  | 2026-09-18                   | Apache-2.0                                     | Usar si el front es React (el "look Palantir" real)                 |
| [IQTLabs/snowglobe](https://github.com/IQTLabs/snowglobe)                                               | 6    | Juegos de guerra abiertos con LLM (IQT, brazo de In-Q-Tel)                           | Python                                                 | 62      | 2026-02-11                   | Apache-2.0, **archivado**                      | Solo leer (idea de escenarios)                                      |

Descartados en la revisión: `h9zdev/GeoSentinel` (1.081 ★, licencia CC BY-NC 4.0, no apta
para código), `CaviraOSS/Akashic` (128 ★, AGPL e incluye material de World Monitor),
`Shamdon/openfoundry` (5 ★, creado en mayo-2026, sin código en lenguaje principal),
`AnotiaWang/deep-research-web-ui` y `CopilotKit/open-research-ANA` (sin licencia),
`MISP/MISP` e `intelowlproject/IntelOwl` (AGPL, ciberinteligencia técnica, lejos de nuestro caso),
`smicallef/spiderfoot` (MIT pero último push 2026-04-13 y enfocado en reconocimiento de red).

---

## 2. Por categoría

### Categoría 1. Plataformas OSINT, inteligencia y dashboards de situación

**koala73/worldmonitor** (86.934 ★, AGPL-3.0, push 2026-09-18). Es la referencia visual más
vista de 2026: un tablero de situación global con noticias curadas y resumidas por IA, un motor
de mapas dual (globo 3D con globe.gl y mapa plano WebGL con deck.gl que comparten un catálogo de
capas), paneles especializados y un **Country Instability Index** con puntajes, bandas y variación
de 24 h. Stack TypeScript + Vite, con app de escritorio en Tauri 2 y modo local con Ollama.

- Qué tomar: (1) el **catálogo de capas compartido entre globo y mapa plano**, porque nosotros
  también tenemos globo orbital (F2) y mapa de Colombia (F3); (2) la idea del **índice
  compuesto con banda de color y delta**, que podemos traducir a un "índice de presión
  territorial" por departamento con datos que ya tenemos en el corpus; (3) el brief IA en la
  cabecera del dashboard.
- Esfuerzo: medio (reproducir el layout). Riesgo de licencia: **AGPL, no copiar código**.

**simplifaisoul/osiris** (9.661 ★, MIT, push 2026-09-18). Dashboard OSINT tipo HUD con
Next.js 16 y MapLibre GL, capas de vuelos, sismos, conflicto, sanciones (OpenSanctions) y
Telegram geoparseado. Su arquitectura es simple: un cliente con mapa + paneles HUD y una serie de
rutas `/api/<fuente>` que normalizan cada fuente.

- Qué tomar: el patrón **una ruta API por fuente con esquema normalizado** y el HUD de paneles
  plegables sobre el mapa. Al ser MIT, se pueden reutilizar componentes de estilo.
- Esfuerzo: bajo-medio. Riesgo: bajo. Ojo: la descripción del repo incluye una dirección de
  token cripto; es un proyecto personal con mucha publicidad, así que conviene tomar ideas y no
  depender de él.

**BigBodyCobain/Shadowbroker** (11.187 ★, AGPL-3.0, push 2026-09-18). Mapa "dark-ops" con 60+
fuentes y 40+ capas (Next.js, MapLibre, FastAPI). Tiene clic derecho en cualquier punto →
**dossier del país** (jefe de Estado, población, resumen de Wikipedia, última imagen Sentinel-2),
modos visuales (FLIR, NVG, CRT) y un canal de comandos firmado para conectar un agente IA como
co-analista.

- Qué tomar: el **dossier contextual al hacer clic** (en nuestro caso: clic en un departamento →
  ficha con documentos del corpus, entidades del grafo y serie temporal) y la estética oscura.
- Esfuerzo: medio. Riesgo: **AGPL**. Nota: parte de sus capas (cámaras, escáneres de policía,
  Shodan) no encajan con el tono institucional de la FAC; no copiar esa parte.

**Dev-next-gen/orodruin** (52 ★, AGPL-3.0, push 2026-09-11, creado en marzo 2026). Pocas
estrellas, pero es la demostración más limpia del concepto que queremos: un **analista IA que
consulta las fuentes y además maneja la interfaz** (recentra el mapa, activa capas, filtra
eventos, abre cámaras) y un **grafo de co-ocurrencia de actores** construido desde el flujo de
eventos GDELT (tamaño = grado, grosor = frecuencia, color = país; clic en un actor lleva sus
eventos al mapa).

- Qué tomar: exactamente ese contrato: el agente tiene herramientas de UI (`fly_to`,
  `toggle_layer`, `filter_events`, `focus_entity`) además de las de datos. El grafo de actores
  coincide con nuestro grafo GLiNER en GraphML.
- Esfuerzo: medio. Riesgo: AGPL + proyecto joven, "en desarrollo" según su README.

**AndrewCTF/velocity** (92 ★, AGPL-3.0, push 2026-09-17). Consola de situación que se distingue
por dos cosas: guarda historial propio (con un control para rebobinar) y **puntúa lo que
muestra**: cada contacto dice qué fuentes lo reportaron, cuántas coinciden y la edad real del
dato. Genera informes HTML/PPTX donde cada afirmación lleva su procedencia, y expone todo por MCP.

- Qué tomar: la **etiqueta de procedencia y frescura** en cada dato y el informe exportable con
  procedencia por afirmación, que encaja con la exigencia de citas del reto.
- Esfuerzo: bajo (es un patrón de UI). Riesgo: AGPL.

**OpenCTI-Platform/opencti** (10.020 ★, Apache-2.0 en la edición comunitaria + EE comercial,
push 2026-09-18, release 2026-09-17). La plataforma de inteligencia de amenazas de referencia:
modelo de datos STIX 2.1, grafo de conocimiento, fichas de entidad con pestañas (resumen,
relaciones, conocimiento, contenido, fuentes) y vistas de relaciones.

- Qué tomar: la **estructura de la ficha de entidad** y el modelo "entidad — relación —
  informe fuente", que se puede aplicar a nuestras entidades GLiNER (actor, organización,
  lugar, sistema de armas, satélite).
- Esfuerzo: montarlo es alto (Elasticsearch, Redis, RabbitMQ, MinIO); solo tomar el diseño.
  Riesgo: bajo para la parte comunitaria; no usar nada de la EE.

**openaleph/openaleph** (131 ★, MIT, push 2026-09-16). OCCRP dejó de mantener el Aleph de código
abierto (fin del mantenimiento tras diciembre de 2025) y lanzó Aleph Pro, reescrito y no abierto
([anuncio](https://www.occrp.org/en/announcement/occrp-announces-a-new-chapter-for-its-investigative-data-platform-aleph-pro)).
El Data and Research Center (DARC) sigue el proyecto como OpenAleph. `alephdata/aleph` (2.433 ★,
último push 2026-02-20) no está archivado, pero ya no evoluciona.

- Qué tomar: la búsqueda facetada sobre documentos + entidades (modelo FollowTheMoney) y la
  vista "documento con entidades resaltadas".
- Esfuerzo: alto si se monta; bajo si solo se toma la UX. Riesgo: bajo (MIT).

### Categoría 2. Plataformas RAG empresariales con UI pulida y citas

**infiniflow/ragflow** (90.959 ★, Apache-2.0, push 2026-09-18, v0.27.2 del 2026-09-10). Motor
RAG empresarial con parsing profundo de documentos (DeepDoc), plantillas de fragmentación y
**citas que al pasar el cursor muestran el fragmento original y su captura del PDF**. Stack
Python + Go + React sobre Elasticsearch/Infinity.

- Qué tomar: el **popover de cita con fragmento y página**, y la vista de "chunks" por documento
  para auditar el retrieval (útil ante el jurado para mostrar que la base vectorial es real).
- Esfuerzo: bajo como patrón UX; alto si se adopta el motor (no tiene sentido, ya tenemos base
  vectorial). Riesgo: bajo.

**onyx-dot-app/onyx** (32.162 ★, MIT + directorios `ee/` con licencia comercial, push
2026-09-18). Ex Danswer: chat y búsqueda empresarial con conectores, panel lateral de
documentos citados y filtros por fuente, fecha y etiqueta.

- Qué tomar: el **panel de documentos con filtros** (en nuestro caso por fenómeno, fuente,
  idioma y año) y la marca "fuente citada vs. fuente recuperada".
- Esfuerzo: bajo como patrón. Riesgo: bajo si se evita `ee/`.

**Cinnamon/kotaemon** (25.774 ★, Apache-2.0, push 2026-07-14). UI RAG en Python (Gradio) muy
limpia: panel de información con **citas resaltadas dentro del visor PDF**, puntaje de relevancia
por fragmento, soporte GraphRAG/LightRAG con vista del grafo, y razonamiento en varios pasos.

- Qué tomar: el **panel de evidencia a la derecha** (fragmento, puntaje, documento, página) y la
  forma de alternar entre "respuesta" y "grafo de la respuesta". Al estar en Python es el más
  cercano a nuestro stack.
- Esfuerzo: bajo-medio. Riesgo: bajo.

**open-webui/open-webui** (152.497 ★, Open WebUI License, push 2026-09-18). La interfaz de chat
autoalojada más usada. Desde 2025 su licencia es BSD-3 con una cláusula que prohíbe quitar su
marca en despliegues de más de 50 usuarios, así que no conviene como base de un producto propio.

- Qué tomar: la experiencia de citas (chips numerados que abren la fuente) y el selector de
  modelos/herramientas. Esfuerzo: bajo. Riesgo: medio (cláusula de marca).

**danny-avila/LibreChat** (44.331 ★, MIT, push 2026-09-18). Clon avanzado de ChatGPT con agentes,
MCP y **Artifacts** (panel lateral donde el asistente renderiza HTML/React/Mermaid).

- Qué tomar: el **panel de artefactos lateral** como lugar natural para mapas y gráficas junto al
  chat. Esfuerzo: medio. Riesgo: bajo.

**Mintplex-Labs/anything-llm** (66.193 ★, MIT) y **ItzCrazyKns/Vane** (36.871 ★, MIT, antes
Perplexica, renombrado en 2026). AnythingLLM aporta la idea de **workspaces** (uno por fenómeno);
Vane aporta los **modos Velocidad / Equilibrado / Calidad** y los widgets que aparecen solo cuando
aplican.

- Qué tomar: modo "respuesta rápida" vs. "informe profundo" en nuestro chat, y workspaces por
  fenómeno. Esfuerzo: bajo. Riesgo: bajo.

**miurla/morphic** (9.128 ★, Apache-2.0, push 2026-09-18). Buscador IA con UI generativa:
respuestas citadas que se renderizan como componentes (tarjetas de fuentes, rejillas de imágenes)
a partir de un spec JSON en streaming. Next.js + Vercel AI SDK + Postgres + Supabase Auth.

- Qué tomar: la **anatomía de respuesta tipo Perplexity**: fila de tarjetas de fuentes arriba,
  respuesta con números `[n]`, preguntas de seguimiento abajo, y enlaces para compartir.
- Esfuerzo: bajo-medio. Riesgo: bajo.

### Categoría 3. Agentes de investigación profunda multiagente

**assafelovic/gpt-researcher** (29.514 ★, Apache-2.0, push 2026-08-27). El agente de
investigación más maduro. Su carpeta `multi_agents` implementa con LangGraph un equipo editorial:
_Chief Editor → Researcher → Editor (plan) → Reviewer/Revisor en paralelo → Writer → Publisher_,
con fuentes locales o web y citas en el informe.

- Qué tomar: el **equipo de roles** para el modo "informe" de nuestro asistente, cambiando la
  búsqueda web por nuestra base vectorial; y el reviewer que valida cada sección antes de publicar.
- Esfuerzo: medio. Riesgo: bajo.

**stanford-oval/storm** (31.443 ★, MIT, último push 2025-09-30). STORM genera informes con citas
simulando conversaciones desde varias **perspectivas** y construyendo primero el **esquema**;
Co-STORM añade un mapa mental dinámico de la conversación. Lleva un año sin commits, así que se
usa como diseño, no como dependencia.

- Qué tomar: generar preguntas desde perspectivas (p. ej. "analista militar", "jurista DIH",
  "operador satelital") antes de responder consultas complejas, y el esquema previo a la redacción.
- Esfuerzo: medio. Riesgo: bajo (licencia), medio (mantenimiento).

**langchain-ai/open_deep_research** (12.687 ★, MIT, **archivado**, último push 2026-08-10) y
**langchain-ai/deepagents** (29.547 ★, MIT, push 2026-09-18). El primero es el grafo de
referencia supervisor + investigadores + redacción (llegó al puesto 6 de Deep Research Bench en
agosto de 2025); ahora está archivado y LangChain empuja `deepagents` (planificación con lista de
tareas, subagentes y sistema de archivos virtual).

- Qué tomar: del primero, la **fase de "scoping"** (aclarar la pregunta y fijar un brief antes de
  investigar); del segundo, la herramienta `write_todos` para mostrar el plan del agente en la UI.
- Esfuerzo: bajo-medio. Riesgo: no depender de un repo archivado.

**bytedance/deer-flow** (82.657 ★, MIT, push 2026-09-18). La v2 (febrero de 2026) es una
reescritura total como "super agent harness" (subagentes, memoria, sandbox); el deep research
original sigue en la rama `main-1.x`. Su UI muestra el plan editable y los pasos del agente en
tiempo real y genera informes y podcasts.

- Qué tomar: la **línea de pasos del agente visible y el plan editable por el usuario**
  (human-in-the-loop), que da la sensación de "producto" durante la demo.
- Esfuerzo: medio. Riesgo: bajo; ojo con que la documentación empuja modelos de Volcengine.

**dzhng/deep-research** (19.698 ★, MIT, push 2026-04-11). Implementación mínima (~500 líneas TS)
del bucle "profundidad × amplitud" que genera consultas, aprende y recursa. Útil para entender el
bucle sin framework. Esfuerzo: bajo. Riesgo: bajo.

**SkyworkAI/DeepResearchAgent** (3.546 ★, MIT) y **Alibaba-NLP/DeepResearch** (19.967 ★,
Apache-2.0): el primero es un ejemplo de jerarquía planner → agentes especialistas; el segundo se
centra en entrenar un modelo propio y no nos aporta nada práctico para la final.

### Categoría 4. UI generativa: agentes que renderizan gráficos y mapas en el chat

**CopilotKit/CopilotKit** (37.408 ★, MIT, v1.72.0 del 2026-09-15) + **ag-ui-protocol/ag-ui**
(15.948 ★, MIT). CopilotKit es el stack frontend para agentes con UI generativa; AG-UI es el
protocolo de eventos que usa (inicio/fin de ejecución, mensajes en streaming, llamadas a
herramientas, snapshots y deltas de estado compartido). Tiene integración con LangGraph en
Python, así que nuestro backend podría quedarse igual.

- Qué tomar: el **contrato "llamada a herramienta → componente React"** (`useCopilotAction` con
  `render`) y el **estado compartido agente ↔ UI**: el agente escribe `{capa_activa, bbox,
entidad_seleccionada}` y el mapa reacciona. Aunque no adoptemos el framework, conviene copiar
  el vocabulario de eventos de AG-UI en nuestro streaming.
- Esfuerzo: medio-alto si el front no es React. Riesgo: bajo.

**vercel/chatbot** (20.955 ★, Apache-2.0, antes `vercel/ai-chatbot`). Plantilla Next.js con AI SDK
y shadcn/ui, con un **panel de artefactos** (documento/código/hoja) que se abre junto al chat.

- Qué tomar: el layout "chat a la izquierda, artefacto vivo a la derecha", ideal para que un
  mapa o una serie temporal no queden enterrados en el historial. Esfuerzo: medio. Riesgo: bajo.

**assistant-ui/assistant-ui** (12.206 ★, MIT). Primitivas React de chat (hilos, tool UIs,
adjuntos, fuentes). Si el front es React, es la forma más rápida de tener un chat de calidad
comercial. Esfuerzo: bajo-medio. Riesgo: bajo.

**vercel-labs/json-render** (16.443 ★, Apache-2.0) y **tambo-ai/tambo** (11.184 ★, MIT). Ambos
fijan un **catálogo cerrado de componentes** con esquema (JSON/Zod) y el LLM solo puede elegir
componentes y props válidos. Morphic usa este enfoque.

- Qué tomar: definir nuestro catálogo (`MapaColombia`, `GloboOrbital`, `GrafoEntidades`,
  `SerieTiempo`, `TablaFuentes`, `KPI`) con esquema estricto y validar la salida del agente antes
  de renderizar; así el agente nunca produce código ejecutable. Esfuerzo: bajo. Riesgo: bajo.

**thesysdev/openui** (9.674 ★, MIT) y **a2ui-project/a2ui** (16.431 ★, Apache-2.0, antes
`google/A2UI`, v0.9.1 con v1.0 como candidata): estándares emergentes de UI generativa. Vale la
pena nombrarlos ante el jurado como tendencia, pero A2UI se declara aún en "early stage public
preview"; no los adoptaríamos para la final.

**langchain-ai/langgraphjs-gen-ui-examples** (402 ★, MIT, **archivado**, último push
2025-05-01): colección de agentes LangGraph.js con UI generativa; sirve para leer cómo el grafo
emite componentes, no para depender de él.

### Categoría 5. Visualización geoespacial, espacial y de grafos (proyectos completos)

(Las librerías base, como deck.gl, Cesium, satellite-js, KeepTrack, StuffInSpace, sigma.js,
cytoscape.js y 3d-force-graph, ya están en `repos_utiles.md`.)

**keplergl/kepler.gl** (12.013 ★, MIT, push 2026-09-18, v3.3.0-alpha.12). Herramienta completa de
análisis geoespacial sobre deck.gl, con integración DuckDB y un **asistente IA** documentado en
`docs/user-guides/ai-assistant.md` que opera sobre el mapa (crear capas, filtrar, consultar).

- Qué tomar: el panel lateral de capas y filtros con histograma temporal (el "time playback" de
  kepler es la forma estándar de animar eventos en el tiempo) y la idea de asistente que actúa
  sobre el estado del mapa. Esfuerzo: medio (embeberlo es React/Redux). Riesgo: bajo.

**nasa/openmct** (13.127 ★, Apache-2.0, push 2026-09-11). Framework web de control de misión:
telemetría en vivo, gráficas, tablas de límites y línea de tiempo en un layout configurable.

- Qué tomar: la **estética de sala de operaciones** (tiras de telemetría, indicadores de estado
  y línea de tiempo común) para el módulo de seguridad espacial. Esfuerzo: medio. Riesgo: bajo.

**Flowm/satvis** (406 ★, MIT, push 2026-09-13). Rastreador 3D de 12.000+ satélites sobre CesiumJS
con predicción de pases y vista de cielo. Es una aplicación completa y MIT, más pequeña y fácil
de leer que KeepTrack.

- Qué tomar: la selección de satélites por grupo, la órbita dibujada al seleccionar y la
  predicción de pases sobre Bogotá. Esfuerzo: medio. Riesgo: bajo.

**nasa-gibs/worldview** (1.867 ★, NASA Open Source Agreement 1.3, push 2026-09-18). Visor de
imágenes satelitales con un **control de línea de tiempo** muy logrado para navegar capas por
fecha. Qué tomar: el diseño del timeline. Riesgo: la NOSA no es compatible con GPL; solo diseño.

**neo4j-contrib/neodash** (516 ★, Apache-2.0, push 2026-09-09). Constructor de dashboards sobre
un grafo: rejilla de tarjetas (grafo, mapa, tabla, barra, línea, KPI) donde cada tarjeta es una
consulta. Qué tomar: el modelo **"cada tarjeta = una consulta + un tipo de visualización"**, que
es justo lo que el agente debería producir. Esfuerzo: bajo como patrón. Riesgo: bajo.

**gephi/gephi-lite** (352 ★, GPL-3.0): la mejor referencia de exploración de grafos en web
(filtros, apariencia por métrica, layouts). Solo inspiración por GPL.
**developmentseed/lonboard** (964 ★, MIT): mapas deck.gl de alto rendimiento desde Python;
alternativa si nos quedamos en Python y folium se queda corto.
**graphistry/pygraphistry** (2.555 ★, BSD-3): grafos grandes con GPU, pero el render depende
del servidor de Graphistry (cuenta), por eso no lo recomendamos para la demo.

### Categoría 6. Proyectos para defensa, seguridad e inteligencia con LLM

No existe un proyecto abierto maduro de un ministerio de defensa con LLM y UI. Lo más útil son
proyectos pequeños pero muy cercanos a nuestro caso, más el toolkit de UI de Palantir.

**PremaanshVyas/satlas** (31 ★, MIT, push 2026-09-10). Conciencia situacional espacial "con un
agente en la puerta de entrada": 30.000+ objetos del catálogo de la Space Force en un globo
Three.js y un agente (Claude) que **no hace la matemática orbital sino que llama herramientas
tipadas** (FastAPI + skyfield para pases y conjunciones, pgvector para RAG) y **mueve la cámara
del globo** ("muéstrame la ISS" → vuela y la hace pulsar; "todos los Starlink" → los resalta en
violeta y atenúa el resto).

- Qué tomar: el diseño completo de nuestra F2: herramientas `propagar`, `pases_sobre`,
  `resaltar_grupo`, `volar_a`, y la regla "el LLM nunca calcula órbitas". MIT, así que se puede
  leer y adaptar código. Esfuerzo: medio. Riesgo: bajo (proyecto joven, pocas estrellas).

**vericle/intellyweave** (75 ★, BSD-3-Clause, push 2026-09-02). Plataforma OSINT sobre
documentos: **extracción de entidades con GLiNER** (7 tipos, multilingüe, zero-shot), mapa 3D
(Mapbox), análisis de red y agentes que debaten hipótesis (Quartermaster + Case Officer).

- Qué tomar: es la referencia más cercana a nuestro stack (también usamos GLiNER y grafo). Tomar
  la tarjeta de entidad con confianza y contexto, y el flujo "documento → entidades → mapa y red".
  Esfuerzo: bajo-medio. Riesgo: bajo (BSD-3).

**assafkip/kipi** (72 ★, Elastic License 2.0, push 2026-09-05). Documentos → grafo de entidades
investigado por un agente, con **grados de evidencia** (un registro DNS = A; una lectura del
analista = pista), centralidad de intermediación, comunidades Louvain, camino más corto entre dos
nodos y procedencia en cada nodo y arista ("el analista decide, la máquina propone").

- Qué tomar: la **escala de confianza por afirmación** (tipo escala de fiabilidad OTAN/Admiralty
  A–F / 1–6) y las tres analíticas de grafo (centralidad, comunidades, ruta). Riesgo: ELv2, no
  copiar código.

**palantir/blueprint** (22.073 ★, Apache-2.0, push 2026-09-18). El toolkit React con el que
Palantir construye sus interfaces densas de análisis (tablas, árboles, paneles, tema oscuro).
Si queremos que "se vea como Palantir", esta es la fuente primaria y se puede usar legalmente.
Esfuerzo: medio (requiere front React). Riesgo: bajo.

**OpenOSINT/OpenOSINT** (1.603 ★, MIT) y **calesthio/Crucix** (11.751 ★, AGPL-3.0): agentes OSINT
con servidor MCP y un vigilante de fuentes con alertas. Nos sirven como idea para un panel de
"alertas / cambios desde la última sesión", no como código.

**IQTLabs/snowglobe** (62 ★, Apache-2.0, archivado): juegos de guerra abiertos con LLM de IQT
Labs (In-Q-Tel). Idea para un posible "modo escenario" (qué pasaría si...), fuera del alcance de
la final.

---

## 3. Top 8 referencias para nuestro producto

| #   | Referencia                                           | Qué tomar exactamente                                                                                                                                                                                                                                                  | Dónde aplica                                       | Esfuerzo                                | Licencia                                                                |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| 1   | **koala73/worldmonitor**                             | Layout de sala de situación: cabecera con brief IA, mapa central con **catálogo de capas único para globo 3D y mapa plano**, columna de paneles y un **índice compuesto por territorio** con banda de color y delta a 24 h.                                            | Pantalla principal del módulo de analítica         | Medio                                   | AGPL: solo inspiración                                                  |
| 2   | **Dev-next-gen/orodruin**                            | El agente tiene **herramientas de UI** además de las de datos (`fly_to`, `toggle_layer`, `filter_events`, `focus_entity`) y el **grafo de co-ocurrencia de actores** enlazado al mapa (clic en actor → sus eventos en el mapa).                                        | Integración chat ↔ analítica (lo que pide el reto) | Medio                                   | AGPL: solo inspiración                                                  |
| 3   | **PremaanshVyas/satlas**                             | Diseño de F2: globo con LEO/MEO/GEO diferenciados, agente que **llama herramientas tipadas de mecánica orbital** y mueve la cámara/resalta grupos; regla "el LLM nunca calcula órbitas".                                                                               | Globo orbital + chat de seguridad espacial         | Medio                                   | MIT: se puede adaptar código                                            |
| 4   | **Cinnamon/kotaemon** (+ popover de RAGFlow)         | **Panel de evidencia** a la derecha con fragmento, documento, página y puntaje de relevancia; al pasar sobre `[n]` se ve el fragmento original. Alternar "respuesta / grafo de la respuesta".                                                                          | Chat RAG con citas                                 | Bajo-medio                              | Apache-2.0                                                              |
| 5   | **miurla/morphic**                                   | Anatomía de respuesta tipo Perplexity: fila de tarjetas de fuentes arriba, respuesta con `[n]`, preguntas de seguimiento, y **componentes de UI generativa desde un spec JSON en streaming**.                                                                          | Formato de cada respuesta del asistente            | Bajo-medio                              | Apache-2.0                                                              |
| 6   | **assafelovic/gpt-researcher** (+ STORM, deer-flow)  | Modo "informe profundo": equipo planner → investigadores en paralelo → reviewer → writer con citas; preguntas desde **perspectivas** (STORM); **plan visible y editable** y línea de pasos del agente en vivo (deer-flow).                                             | Asistente multiagente (Reto 1)                     | Medio                                   | Apache-2.0 / MIT                                                        |
| 7   | **CopilotKit + AG-UI** (+ json-render/tambo)         | Contrato "tool call → componente" con **catálogo cerrado y validado** (`MapaColombia`, `GloboOrbital`, `GrafoEntidades`, `SerieTiempo`, `TablaFuentes`, `KPI`), **estado compartido** agente ↔ vista y el vocabulario de eventos AG-UI para el streaming.              | Puente entre el agente y las visualizaciones       | Medio (bajo si solo se copia el patrón) | MIT / Apache-2.0                                                        |
| 8   | **vericle/intellyweave** (+ kipi, velocity, OpenCTI) | Flujo documento → entidades GLiNER → mapa + red; **ficha de entidad** estilo OpenCTI (resumen, relaciones, documentos fuente); **grado de confianza y procedencia por afirmación** (kipi, velocity); analíticas de grafo: centralidad, comunidades y camino más corto. | Grafo de entidades y credibilidad ante el jurado   | Bajo-medio                              | BSD-3 (IntellyWeave); ELv2/AGPL solo inspiración; OpenCTI CE Apache-2.0 |

Complemento transversal: si el front termina en React, usar **palantir/blueprint**
(Apache-2.0) o shadcn/ui para el aspecto, y tomar la **línea de tiempo** de NASA Worldview /
kepler.gl para las series temporales. Si el front sigue en Python, los patrones 2, 4, 5 y 7 se
implementan igual: el agente devuelve un spec validado y Streamlit o Chainlit lo renderiza.

---

## 4. Fuentes consultadas

- Métricas: `gh api repos/<owner>/<repo>` (18-sep-2026) y búsquedas con `gh search repos`.
- Aleph → Aleph Pro / OpenAleph: [OCCRP](https://www.occrp.org/en/announcement/occrp-announces-a-new-chapter-for-its-investigative-data-platform-aleph-pro),
  [OpenAleph](https://openaleph.org/blog/2025/openaleph-commits-to-the-commons/).
- Descubrimiento de proyectos OSINT con LLM: [GitHub topic intelligence-analysis](https://github.com/topics/intelligence-analysis),
  [IBTimes UK sobre World Monitor](https://www.ibtimes.co.uk/free-open-source-alternative-palantir-intelligence-platform-1809645).
