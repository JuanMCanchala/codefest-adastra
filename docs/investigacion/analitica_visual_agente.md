# Analítica visual generada por agente (Reto 2)

## Cómo un agente genera visualizaciones a partir de lenguaje natural

El patrón general es **text-to-chart / text-to-visualization**: el agente recibe una intención en
lenguaje natural ("muéstrame la evolución de desechos espaciales" o "compara homicidios entre
Colombia y la región"), la traduce a una consulta estructurada sobre los datos disponibles, y
genera el artefacto visual. Hay tres estrategias, no excluyentes:

### 1. Generación de código de gráficos (code generation)

El agente (LLM) escribe y ejecuta código Python (Matplotlib, Plotly, Altair) que produce la figura,
en lugar de producir la figura directamente. Es el patrón más flexible y el que mejor se integra
con un asistente conversacional porque reutiliza el mismo LLM del Reto 1 como "agente generador de
gráficos", con una herramienta de ejecución de código sandboxed.

- Ejemplos de este patrón en producción: **ChatGPT Code Interpreter / Advanced Data Analysis**,
  **PandasAI** (https://github.com/gventuri/pandas-ai), **Vanna.ai** para text-to-SQL+chart
  (https://vanna.ai).
- Riesgo a mitigar: ejecutar código generado por LLM requiere un entorno aislado (subprocess con
  timeout, sin acceso a filesystem/red) para evitar ejecución arbitraria insegura.

### 2. Generación declarativa (grammar-of-graphics / JSON spec)

En lugar de código libre, el LLM genera una **especificación declarativa** (por ejemplo un JSON de
Vega-Lite) que luego una librería renderiza de forma determinista. Reduce el riesgo de código
arbitrario y de errores de sintaxis, a cambio de menos flexibilidad.

- **Vega-Lite** (https://vega.github.io/vega-lite/) es el estándar de facto para esto; existen
  ejemplos públicos de "LLM to Vega-Lite spec" (p. ej. proyecto **LIDA** de Microsoft:
  https://github.com/microsoft/lida, que hace explícitamente "grammar-agnostic visualization
  generation" con LLMs).
- Más seguro para un contexto de reto evaluado, porque el output es datos (JSON), no código
  ejecutable.

### 3. Plantillas predefinidas + selección por el agente

El agente no genera código ni specs desde cero: clasifica la intención del usuario contra un
catálogo fijo de visualizaciones ya construidas (p. ej. "serie de tiempo de desechos orbitales",
"mapa de homicidios ALC") y solo decide **cuál mostrar y con qué filtros** (país, rango de años,
fenómeno). Es la opción de menor riesgo y menor esfuerzo de implementación para un plazo de 24 h,
al costo de menor flexibilidad ante preguntas no anticipadas.

**Recomendación para el reto**: combinar (3) como base —un catálogo de 8-12 visualizaciones
cubriendo los tres fenómenos, ya diseñadas y probadas— con (1) como respaldo para preguntas que no
calzan en el catálogo, dado el tiempo limitado y el riesgo de ejecución insegura de código.

## Tipos de visualización relevantes para los tres fenómenos

- **Mapas** (choropleth/coropléticos): indicadores por país en ALC (homicidios, IDH, gasto militar).
  Librerías: **Plotly Express** (`px.choropleth`), **Folium**, **pydeck** (integra bien con
  Streamlit vía `st.pydeck_chart`).
- **Series de tiempo**: evolución de desechos orbitales, víctimas del conflicto, inversión en IA.
  Librerías: Plotly, Altair, Matplotlib.
- **Grafos de conocimiento**: relaciones entre entidades (actores, países, tecnologías) ya extraídas
  en `grafo.graphml` de la Etapa 1. Librerías: **NetworkX + Plotly** (layout con `spring_layout` y
  render de nodos/aristas), **PyVis** (https://pyvis.readthedocs.io, genera grafos HTML interactivos
  fácilmente embebibles), **streamlit-agraph** para integración directa en Streamlit.
- **Líneas de tiempo de hitos**: eventos normativos o históricos (Acuerdo de Paz, AI Act, pruebas
  ASAT). Librerías: Plotly (`px.timeline`), o una tabla/Gantt simple.
- **Gráficos comparativos multinivel** (barras agrupadas): global vs. regional vs. Colombia para un
  mismo indicador, el patrón más pedido por el enunciado del reto.

## Librerías recomendadas (Python, coherente con el stack ya usado en la Etapa 1)

| Librería | Uso principal | Motivo |
|---|---|---|
| **Plotly / Plotly Express** | Series de tiempo, barras, mapas coropléticos, timelines | Interactivo out-of-the-box, se integra directo en Streamlit (`st.plotly_chart`) |
| **NetworkX** | Cálculo de layout y métricas de grafo | Ya es dependencia de la Etapa 1 (usado para `grafo.graphml`) — cero costo de adopción |
| **PyVis** | Render interactivo de grafos en HTML | Bajo esfuerzo para convertir `grafo.graphml` en una visualización navegable |
| **Pandas** | Transformación de datos previos a graficar | Ya es dependencia de la Etapa 1 (extracción CSV/XLSX) |
| **GeoPandas** (opcional) | Si se necesitan geometrías propias en vez de nombres de país estándar | Solo si el PBF de mapas vectoriales de la Etapa 1 se reutiliza directamente |

## Integración con el asistente del Reto 1

El agente de analítica visual se expone como una **herramienta (tool)** que el orquestador del Reto
1 puede invocar cuando detecta intención de visualización, siguiendo el mismo patrón de
tool-calling que ya se usaría para los agentes especialistas de RAG:

1. El orquestador clasifica la intención: "responder con texto" vs. "generar visualización" (o
   ambos: texto + gráfico de apoyo).
2. Si es visualización, invoca al agente de analítica visual pasándole la consulta original y el
   fenómeno detectado.
3. El agente de analítica visual selecciona la visualización del catálogo (o genera código/spec),
   ejecuta la extracción de datos desde las fuentes ya indexadas o desde archivos estructurados del
   corpus (XLSX del AI Index, CSV, metadata del grafo), y devuelve la figura (objeto Plotly/HTML) al
   frontend Streamlit.
4. La respuesta final combina el texto generado por el agente especialista de RAG **y** la figura,
   en el mismo turno de chat — esto es lo que el enunciado exige como "integrado con el asistente
   conversacional", no un dashboard separado.

**Nota de seguridad**: si se opta por generación de código (opción 1 de la sección anterior), el
código debe ejecutarse en un proceso aislado con timeout y sin acceso a red/filesystem fuera del
directorio de datos, dado que el input (la intención del usuario) llega de una fuente no confiable
en el sentido de seguridad del software, aunque el contexto sea un reto controlado.
