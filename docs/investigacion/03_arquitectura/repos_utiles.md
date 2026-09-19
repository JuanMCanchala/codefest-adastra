# Repositorios útiles para acelerar la final (Reto 1 y Reto 2)

Fecha de consulta: 18-sep-2026. Métricas obtenidas con `gh api repos/<owner>/<repo>` ese día.
"Último commit" es el campo `pushed_at` de la API de GitHub (último push a cualquier rama), no
necesariamente el último release. Cuando una métrica no se pudo consultar, se indica.

Contexto: ya tenemos la base vectorial en Python (BGE-M3 + FAISS + reranker + grafo GLiNER en
GraphML). Lo que falta es la capa de agentes, la GUI y las visualizaciones. Todo lo que obligue a
salir de Python o a montar un segundo servidor tiene un costo alto con la entrega a horas.

## 1. Tabla comparativa

| Repo                                                                                                             | Reto                                                     | Estrellas                                                         | Último push                                     | Licencia                                                        | Esfuerzo de integración                               | Veredicto                                                                   |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| [bilawalsidhu/gods-eye-view](https://github.com/bilawalsidhu/gods-eye-view)                                      | R2 (F2, extra visual)                                    | 37.814                                                            | 2026-09-17                                      | MIT (código); datos con licencias propias                       | Alto: Node 24, Vite, CesiumJS, app monolítica         | Inspirarse (ideas + capa de satélites)                                      |
| [shashwatak/satellite-js](https://github.com/shashwatak/satellite-js)                                            | R2 (F2, globo web)                                       | 1.090                                                             | 2026-08-20 (release 7.1.0, 2026-07-23)          | MIT                                                             | Bajo si ya hay un globo JS                            | Usar si se hace el globo en JS                                              |
| [CesiumGS/cesium](https://github.com/CesiumGS/cesium)                                                            | R2 (F2, globo 3D)                                        | 15.751                                                            | 2026-09-18 (release 1.145, 2026-09-01)          | Apache-2.0                                                      | Medio: HTML embebido + CDN; token de ion opcional     | Usar solo como extra visual                                                 |
| [esa/dSGP4](https://github.com/esa/dSGP4)                                                                        | R2 (F2)                                                  | 96                                                                | 2026-08-07                                      | GPL-3.0                                                         | Medio: exige PyTorch, está pensado para ML            | Descartar                                                                   |
| CS-SI/Orekit ([GitHub](https://github.com/CS-SI/Orekit), desarrollo en [GitLab](https://gitlab.orekit.org))      | R2 (F2)                                                  | 295                                                               | 2026-09-18                                      | Apache-2.0                                                      | Muy alto: Java, dinámica orbital de bajo nivel        | Descartar                                                                   |
| librespacefoundation/satnogs-network ([GitLab](https://gitlab.com/librespacefoundation/satnogs/satnogs-network)) | —                                                        | No consultable: el repo no existe en GitHub (404); vive en GitLab | Sin dato fiable (GitLab reporta ~2.099 commits) | AGPL-3.0                                                        | Muy alto: Django + Docker, red de estaciones terrenas | Descartar                                                                   |
| [brandon-rhodes/python-sgp4](https://github.com/brandon-rhodes/python-sgp4)                                      | R2 (F2, Python)                                          | 470                                                               | 2026-07-12 (tag v2.14)                          | MIT                                                             | Bajo: `pip install sgp4`, sin dependencias pesadas    | Usar (propagación en Python)                                                |
| [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph)                                              | R1 + R2 (orquestación)                                   | 41.902                                                            | 2026-09-18                                      | MIT                                                             | Bajo-medio                                            | Usar                                                                        |
| [langchain-ai/langgraph-supervisor-py](https://github.com/langchain-ai/langgraph-supervisor-py)                  | R1                                                       | 1.654                                                             | 2026-07-15                                      | MIT                                                             | Bajo                                                  | Inspirarse (los propios mantenedores ya no lo recomiendan)                  |
| [streamlit/streamlit](https://github.com/streamlit/streamlit)                                                    | R1 + R2 (GUI)                                            | 45.782                                                            | 2026-09-18                                      | Apache-2.0                                                      | Muy bajo                                              | Usar                                                                        |
| [Chainlit/chainlit](https://github.com/Chainlit/chainlit)                                                        | R1 (GUI de chat)                                         | 12.460                                                            | 2026-09-18 (release 2.12.0, 2026-08-25)         | Apache-2.0                                                      | Bajo                                                  | Alternativa (mantenido por la comunidad desde mayo 2025)                    |
| [gradio-app/gradio](https://github.com/gradio-app/gradio)                                                        | R1 (GUI)                                                 | 43.578                                                            | 2026-09-18                                      | Apache-2.0                                                      | Bajo                                                  | Alternativa                                                                 |
| [langchain-ai/agent-chat-ui](https://github.com/langchain-ai/agent-chat-ui)                                      | R1 (GUI)                                                 | 3.166                                                             | 2026-09-14                                      | MIT                                                             | Medio-alto: Next.js + servidor LangGraph              | Descartar para hoy                                                          |
| [microsoft/lida](https://github.com/microsoft/lida)                                                              | R2 (text-to-chart)                                       | 3.279                                                             | 2024-08-08                                      | MIT                                                             | Medio                                                 | Inspirarse (patrón resumen → objetivos → gráfica); sin actividad desde 2024 |
| [microsoft/data-formulator](https://github.com/microsoft/data-formulator)                                        | R2 (text-to-chart)                                       | 17.262                                                            | 2026-09-18                                      | MIT                                                             | Alto para embeber (es una app completa)               | Inspirarse / demo aparte                                                    |
| [sinaptik-ai/pandas-ai](https://github.com/sinaptik-ai/pandas-ai)                                                | R2                                                       | 23.801                                                            | 2025-10-28 (v3.0.0, 2025-10-07)                 | MIT, excepto `ee/` (licencia propia)                            | Medio                                                 | Descartar (ejecuta código generado por el LLM y está parado desde oct-2025) |
| [vanna-ai/vanna](https://github.com/vanna-ai/vanna)                                                              | R2                                                       | 23.816                                                            | 2026-02-02                                      | MIT                                                             | —                                                     | Descartar: **archivado** (`archived: true`) y es text-to-SQL                |
| [Canner/WrenAI](https://github.com/Canner/WrenAI)                                                                | R2                                                       | 17.686                                                            | 2026-09-18                                      | NOASSERTION (según la API)                                      | Alto: capa semántica SQL + Docker                     | Descartar                                                                   |
| [plotly/plotly.py](https://github.com/plotly/plotly.py)                                                          | R2 (gráficas, coropletas, 3D)                            | 18.792                                                            | 2026-09-18                                      | MIT                                                             | Muy bajo                                              | Usar                                                                        |
| [WestHealth/pyvis](https://github.com/WestHealth/pyvis)                                                          | R2 (grafo)                                               | 1.206                                                             | 2024-04-24                                      | BSD-3-Clause                                                    | Muy bajo                                              | Usar (estable aunque poco activo)                                           |
| [ChrisDelClea/streamlit-agraph](https://github.com/ChrisDelClea/streamlit-agraph)                                | R2 (grafo en Streamlit)                                  | 482                                                               | 2026-01-25                                      | MIT                                                             | Muy bajo                                              | Alternativa a pyvis con clics                                               |
| [cytoscape/cytoscape.js](https://github.com/cytoscape/cytoscape.js)                                              | R2 (grafo web)                                           | 11.218                                                            | 2026-09-16                                      | MIT                                                             | Medio (JS)                                            | Solo si hay front propio                                                    |
| [jacomyal/sigma.js](https://github.com/jacomyal/sigma.js)                                                        | R2 (grafo web grande)                                    | 12.168                                                            | 2026-09-16                                      | MIT                                                             | Medio (JS, carga GraphML vía graphology)              | Solo si el grafo es muy grande                                              |
| [vasturiano/3d-force-graph](https://github.com/vasturiano/3d-force-graph)                                        | R2 (grafo 3D, efecto "wow")                              | 6.403                                                             | 2026-04-05                                      | MIT                                                             | Bajo-medio (HTML + CDN)                               | Opcional para el pitch                                                      |
| [python-visualization/folium](https://github.com/python-visualization/folium)                                    | R2 (mapas F3)                                            | 7.400                                                             | 2026-09-18                                      | NOASSERTION según la API (el repo publica licencia MIT)         | Bajo                                                  | Alternativa a Plotly para mapas                                             |
| [randyzwitch/streamlit-folium](https://github.com/randyzwitch/streamlit-folium)                                  | R2 (mapas F3 en Streamlit)                               | 586                                                               | 2026-09-09                                      | MIT                                                             | Muy bajo                                              | Usar si se elige folium                                                     |
| [caticoa3/colombia_mapa](https://github.com/caticoa3/colombia_mapa)                                              | R2 (F3, mapa por municipio)                              | 8                                                                 | 2020-07-31                                      | Sin licencia en el repo (datos derivados del MGN 2018 del DANE) | Muy bajo                                              | Usar (trae el código DIVIPOLA)                                              |
| [santiblanko/colombia.geojson](https://github.com/santiblanko/colombia.geojson)                                  | R2 (F3)                                                  | 16                                                                | 2022-09-25                                      | Sin licencia en el repo                                         | Bajo                                                  | Respaldo                                                                    |
| [wmgeolab/geoBoundaries](https://github.com/wmgeolab/geoBoundaries)                                              | R2 (F3, fronteras ADM1/ADM2 con licencia clara por país) | 409                                                               | 2026-04-15                                      | NOASSERTION según la API (la licencia depende de cada país)     | Bajo                                                  | Respaldo con licencia documentada                                           |
| [thkruz/keeptrack.space](https://github.com/thkruz/keeptrack.space)                                              | R2 (F2, basura espacial en navegador)                    | 1.594                                                             | 2026-09-17 (v13.11.1)                           | AGPL-3.0                                                        | Muy bajo como iframe; alto como fork                  | Usar como iframe/enlace, no hacer fork                                      |
| [visgl/deck.gl](https://github.com/visgl/deck.gl) (pydeck)                                                       | R2                                                       | 14.597                                                            | 2026-09-18                                      | MIT                                                             | Bajo-medio                                            | Opcional                                                                    |
| [microsoft/graphrag](https://github.com/microsoft/graphrag)                                                      | R1                                                       | 36.028                                                            | 2026-09-16                                      | MIT                                                             | Alto: reindexa todo el corpus                         | Descartar (ya tenemos grafo propio)                                         |

## 2. Detalle por repositorio

### 2.1 God's Eye View (bilawalsidhu/gods-eye-view), revisión a fondo

- **Qué es**: un "simulador de satélite espía" en el navegador sobre un globo 3D fotorrealista, con
  datos públicos reales: aviones (OpenSky/adsb.lol), tráfico militar, buques (AISStream), satélites
  (CelesTrak, catálogo de 838 objetos y opción "DENSE" con Starlink), sismos (USGS), incendios
  (NASA FIRMS), cámaras CCTV proyectadas en 3D, radio, lanzamientos (Launch Library 2), cables
  submarinos, datacenters y represas. Tiene filtros de sensor en GLSL (CRT, NVG, FLIR), HUD militar,
  superposición de detecciones, cabina de vuelo, director de escenas y enlaces para compartir.
  Llegó al #1 de GitHub Trending en agosto de 2026.
- **Agente**: control por voz con la **OpenAI Realtime API** y 28 herramientas (mover la cámara,
  anotar polígonos, consultar capas como "¿cuántos vuelos hay sobre Texas?", encender capas).
  La clave de OpenAI se queda en el servidor y el cliente recibe un token de sesión corto.
- **Stack**: JavaScript sin framework, CesiumJS (`cesium ^1.124`), Vite 6, `satellite.js ^6.0.2`,
  `mgrs`, `egm96-universal`, un proxy en Node para las claves. Exige **Node 24.x (≥24.14) o 26.x**.
- **Cómo se ejecuta**: `git clone … && npm ci && npm run doctor && npm run dev` →
  `http://localhost:4173`. También hay instalador en Pinokio.
- **Claves de API**: arranca sin claves (imágenes Esri y terreno sin clave, 13 de 15 capas sin
  clave). Opcionales: token de Cesium ion (3D fotorrealista, uso personal y no comercial),
  Google Maps (medido), OpenAI (voz, con costo por minuto), AISStream, FIRMS, TomTom, OpenSky.
- **Licencia**: MIT para el código. El propio LICENSE aclara que los datos incluidos no son MIT: los
  cables de TeleGeography son CC BY-NC-SA 3.0 y los extractos de OSM son ODbL.
- **Encaje con el reto**: bajo como base. El enunciado pide trabajar con informes, no con datos
  orbitales primarios, y el núcleo de la app (aviones, buques, CCTV, voz) no tiene nada que ver con
  los tres fenómenos. Además es otro runtime (Node) y una base de código grande.
- **Qué podemos reutilizar**:
  1. **El patrón "agente con herramientas que maneja la visualización"**: un catálogo de acciones con
     esquema (`src/voice/actionSchemas.js`, `src/voice/gevActions.js`) que el LLM invoca. Es el
     mismo patrón que proponemos para el agente del Reto 2 (el LLM elige una herramienta de gráfica
     con parámetros, no escribe código).
  2. **La capa de satélites** (`src/layers/satellites/`: `orbits.js`, `source.js`, `rendering.js`):
     propagación SGP4 con satellite.js sobre TLE de CelesTrak cacheados en disco, con órbitas
     realineadas por GMST. Sirve de referencia para un globo F2 propio en CesiumJS. No leí el código
     fuente de esos archivos, solo la estructura y el README.
  3. **La estética HUD/FLIR** como inspiración visual para el pitch de F2 (un "modo analista").
  4. **Enlaces para compartir el estado** (cámara y capas serializadas en la URL): una buena idea
     para que el asistente devuelva un enlace a la vista exacta.
- **Veredicto**: inspirarse. No hacer fork ni integrarlo tal cual.

### 2.2 Propagación orbital y globos (F2, solo como extra visual)

- **python-sgp4** ([repo](https://github.com/brandon-rhodes/python-sgp4)): es la opción más barata
  en Python. `Satrec` y `SatrecArray` propagan miles de objetos vectorizados. Combinado con el
  endpoint GP JSON de CelesTrak (lo verifiqué hoy y responde:
  `https://celestrak.org/NORAD/elements/gp.php?GROUP=cosmos-2251-debris&FORMAT=json`, y lo mismo
  para `fengyun-1c-debris` e `iridium-33-debris`), se obtiene un `plotly.graph_objects.Scatter3d`
  con las nubes de escombros de Cosmos-2251, Fengyun-1C e Iridium-33. Eso ilustra bien los informes
  sobre ASAT y colisiones. **Conviene cachear el JSON en disco**, porque la red de la sede puede fallar.
- **satellite.js** ([repo](https://github.com/shashwatak/satellite-js)): el equivalente en JS
  (v7.1.0, TypeScript, SGP4/SDP4 con TLE y OMM). Solo hace falta si se construye un globo CesiumJS.
- **CesiumJS** ([repo](https://github.com/CesiumGS/cesium)): un globo 3D embebible en Streamlit con
  `st.components.v1.html` cargándolo desde CDN (jsDelivr). Sin token de ion hay que usar una capa
  base OSM. Es un extra visual; no invertir más de una hora.
- **KeepTrack** ([repo](https://github.com/thkruz/keeptrack.space), [app](https://app.keeptrack.space)):
  el visor de basura espacial más completo del ecosistema (más de 50.000 objetos, simulación de
  rupturas y campos de escombros). Tiene modo embebido documentado
  ([embed.keeptrack.space](https://embed.keeptrack.space)). La licencia **AGPL-3.0** hace que un fork
  servido en red obligue a publicar el código. **Recomendación**: embeberlo como iframe o enlace
  (la opción de menor esfuerzo para el "wow" de F2) y no hacer fork. Necesita internet en la sede.
- **dSGP4** (ESA): SGP4 diferenciable en PyTorch, pensado para ML y ajuste de órbitas. Sobra para
  nuestro caso y es GPL-3.0. Descartar.
- **Orekit**: una librería Java de dinámica orbital de nivel profesional. Es demasiado para horas y
  obliga a usar un wrapper de Java. Descartar.
- **SatNOGS Network**: la plataforma Django que coordina estaciones terrenas de radioaficionados.
  No visualiza basura espacial y es AGPL. Descartar. (No existe en GitHub; la URL pedida da 404 y el
  proyecto vive en GitLab.)
- **StuffInSpace** ([jeyoder/StuffInSpace](https://github.com/jeyoder/StuffInSpace), antes
  ThingsInSpace): el visor original del que deriva KeepTrack. 833 estrellas, último push en
  2024-01-09 y la API no reporta licencia. Descartar.

### 2.3 Orquestación multiagente (Reto 1)

- **LangGraph** ([repo](https://github.com/langchain-ai/langgraph)): el estándar de facto, muy
  activo. Un `StateGraph` con nodos `router → especialista(s) por fenómeno → verificador` cumple el
  "mínimo dos agentes" de forma visible. Además, el grafo se puede exportar como diagrama Mermaid
  (`graph.get_graph().draw_mermaid()`) para la documentación y el pitch.
- **langgraph-supervisor-py** ([repo](https://github.com/langchain-ai/langgraph-supervisor-py)): el
  README dice textualmente que ahora se recomienda el "supervisor pattern directly via tools" en
  vez de la librería. Conviene copiar la idea (supervisor que delega en especialistas expuestos como
  herramientas) sin añadir la dependencia.
- **microsoft/graphrag**: descartar. Reindexaría todo el corpus con el LLM (horas y costo) y ya
  tenemos un grafo GLiNER propio.

### 2.4 GUI de chat (Reto 1)

- **Streamlit** ([repo](https://github.com/streamlit/streamlit)): `st.chat_message`,
  `st.chat_input` y `st.status` (para mostrar qué agente está trabajando). En la misma app se pintan
  Plotly, folium y HTML embebido, así que integrar el Reto 2 cuesta casi nada. Es la opción más rápida.
- **Chainlit** ([repo](https://github.com/Chainlit/chainlit)): el mejor chat "listo para
  producción", con pasos anidados que visualizan a cada agente (muy vistoso para un jurado) y
  soporte de elementos Plotly. Su README avisa que el equipo original se retiró el 1-may-2025 y que
  hoy lo mantiene la comunidad (aun así publicó la 2.12.0 el 25-ago-2026). Es una buena alternativa
  si el equipo ya lo conoce.
- **Gradio** ([repo](https://github.com/gradio-app/gradio)): `gr.ChatInterface` con mensajes de
  "thought" de agentes. Es equivalente, pero montar un dashboard con varias pestañas es menos
  flexible que en Streamlit.
- **agent-chat-ui** ([repo](https://github.com/langchain-ai/agent-chat-ui)): Next.js y necesita un
  servidor LangGraph (`langgraph dev`) con un ID de grafo. Son dos stacks. Descartar para hoy.

### 2.5 Agentes de texto a gráfica (Reto 2)

- **LIDA** ([repo](https://github.com/microsoft/lida), [paper](https://arxiv.org/abs/2303.02927)):
  su pipeline `summarize → goals → visualize` es el diseño a imitar. El agente resume el dataset
  (conteos por fenómeno, fuente, año, entidad) y propone objetivos analíticos antes de graficar. No
  se ha tocado desde 2024-08 y depende de `llmx`. Conviene copiar el patrón, no la dependencia.
- **Data Formulator** ([repo](https://github.com/microsoft/data-formulator)): muy activo (v0.7 del
  28-may-2026, más de 30 tipos de gráfica y soporte de Anthropic/OpenAI/Ollama vía LiteLLM). Es una
  app completa (`uvx data_formulator`), no una librería embebible. Sirve de inspiración o como demo
  lateral, no como componente.
- **PandasAI**: el LLM genera código pandas y matplotlib que se ejecuta localmente, lo que implica
  riesgo y respuestas no deterministas delante del jurado. La última versión es la v3.0.0 (oct-2025)
  y no hay push desde entonces. Descartar.
- **Vanna**: archivado según la API de GitHub y orientado a text-to-SQL. Descartar.
- **WrenAI**: una capa semántica sobre bases SQL con Docker. No aplica a un corpus documental.
  Descartar.

### 2.6 Visualización del grafo de conocimiento (GraphML de GLiNER)

- **pyvis** ([repo](https://github.com/WestHealth/pyvis)): `networkx.read_graphml()` →
  `Network.from_nx()` → HTML → `st.components.v1.html`. Lleva inactivo desde 2024-04, pero es estable
  y se integra en minutos. Recomendación: filtrar el subgrafo del ego de las entidades que salen en
  la respuesta (por ejemplo, 1-2 saltos y un máximo de unos 150 nodos) para que se pueda leer.
- **streamlit-agraph** ([repo](https://github.com/ChrisDelClea/streamlit-agraph)): parecido, pero
  devuelve el nodo clicado a Python. Eso permite que el clic en una entidad lance una pregunta al
  asistente, lo que da una buena integración entre el Reto 1 y el Reto 2.
- **sigma.js / cytoscape.js / 3d-force-graph**: solo si hay un frontend JS propio. 3d-force-graph
  (HTML + CDN) da un efecto visual fuerte para el pitch con poco código.

### 2.7 Mapas de Colombia por municipio (F3)

- **Fuente oficial**: Marco Geoestadístico Nacional del DANE
  ([geoportal DANE, descarga MGN](https://geoportal.dane.gov.co/servicios/descarga-y-metadatos/descarga-mgn-marco-geoestadistico-nacional/)),
  en shapefile. Convertirlo en plena final cuesta tiempo.
- **caticoa3/colombia_mapa** ([repo](https://github.com/caticoa3/colombia_mapa)): GeoJSON y TopoJSON
  derivados del **MGN 2018 del DANE**, simplificados con mapshaper y pensados para coropletas de
  Plotly. Revisé el archivo `co_2018_MGN_MPIO_POLITICO.geojson` (unos 2,8 MB) y trae
  `MPIO_CCNCT` (código DIVIPOLA de 5 dígitos, p. ej. "18001"), `MPIO_CNMBR`, `DPTO_CCDGO` y
  `DPTO_CNMBR`. Eso permite unir directamente las alertas tempranas o los datos de la Defensoría por
  municipio con
  `px.choropleth_mapbox(..., featureidkey="properties.MPIO_CCNCT")` (o `choropleth_map` según la
  versión de Plotly). El repo no declara licencia; hay que citar al DANE como fuente.
- **santiblanko/colombia.geojson** ([repo](https://github.com/santiblanko/colombia.geojson)):
  `depto.json` (unos 1,5 MB) y `mpio.json` (unos 4,9 MB) con campos `DPTO`, `MPIO` y
  `NOMBRE_DPT`, sin licencia y más pesado. Queda como respaldo.
- **geoBoundaries** ([repo](https://github.com/wmgeolab/geoBoundaries)): fronteras ADM1/ADM2 de
  Colombia con licencia documentada por país. Queda como respaldo si el jurado pregunta por licencias.
- **Plotly** o **folium + streamlit-folium** para pintarlo. Plotly es suficiente y mantiene un solo
  estilo en todas las gráficas.

## 3. Recomendación: stack mínimo

### Reto 1: asistente multiagente con GUI

1. **Streamlit** como GUI única, compartida con el Reto 2 en pestañas: "Asistente" y "Analítica".
2. **LangGraph `StateGraph`** con 3 roles como mínimo, cada uno un nodo con su propio prompt:
   - _Enrutador/orquestador_: clasifica la consulta en F1, F2 o F3 (o varias) y reescribe la
     pregunta.
   - _Agente investigador por fenómeno_: llama como herramienta al retriever ya existente
     (FAISS + reranker + expansión por grafo) filtrando por `fenomeno`, y redacta la respuesta con
     citas.
   - _Agente verificador_: revisa que cada afirmación esté soportada por los fragmentos citados y
     puede reutilizar el reranker como puntuador.
     El patrón supervisor se implementa a mano, como recomienda el README de langgraph-supervisor.
3. `st.status` o expanders para mostrar los pasos de cada agente. Es la prueba visible de que hay
   varios agentes. Añadir el diagrama Mermaid del grafo a la documentación.

### Reto 2: analítica visual con agente, integrada al asistente

1. **Agente "analista visual"** (otro nodo de LangGraph al que el orquestador puede llamar) que
   sigue el patrón de LIDA (resumen de datos → objetivo → gráfica). No ejecuta código generado:
   elige, mediante _tool calling_ con parámetros validados, entre un **catálogo cerrado de
   plantillas Plotly**. Es la misma idea del catálogo de acciones de God's Eye View. Plantillas
   sugeridas:
   - Barras o series temporales de documentos y menciones por fenómeno, fuente y año (desde los
     metadatos del corpus).
   - **Coropleta de Colombia por municipio** (F3) con `caticoa3/colombia_mapa` y la clave
     `MPIO_CCNCT`.
   - **Subgrafo de entidades** (GraphML con networkx → pyvis o streamlit-agraph) centrado en las
     entidades de la respuesta.
   - Mapa de calor de coocurrencia de entidades y temas.
   - **Extra F2**: nube 3D de escombros (python-sgp4 + GP JSON de CelesTrak cacheado + `Scatter3d`
     de Plotly) y un enlace o iframe a KeepTrack. Se presenta como contexto visual y no como núcleo.
2. **Integración**: la respuesta del asistente incluye un botón "Visualizar" (o el orquestador
   invoca directamente al analista cuando detecta intención visual) que pinta la gráfica en el mismo
   hilo del chat.

### Qué NO usar y por qué

- **God's Eye View como base**: otro runtime (Node 24), una base de código grande, un núcleo
  (aviones, buques, CCTV, voz con OpenAI Realtime de pago) que no tiene relación con los fenómenos,
  y datos con licencias no comerciales. Solo sirve como inspiración.
- **Orekit, dSGP4 y SatNOGS**: son herramientas de dinámica orbital u operación de estaciones. El
  enunciado dice que no se trabaja con datos orbitales primarios.
- **Fork de KeepTrack**: la AGPL-3.0 y el tamaño lo hacen inviable. Basta con el iframe o el enlace.
- **PandasAI**: ejecuta código generado y está parado desde oct-2025. **Vanna**: archivado.
  **WrenAI**: SQL y Docker. **GraphRAG**: reindexación costosa y redundante con nuestro grafo.
- **agent-chat-ui**: obliga a un segundo stack (Next.js + servidor LangGraph).
- **La librería langgraph-supervisor**: sus propios mantenedores recomiendan implementar el patrón
  con herramientas.
- **LIDA como dependencia**: sin actividad desde 2024 y depende de llmx. Copiar solo el patrón.
