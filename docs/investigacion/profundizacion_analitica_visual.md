# Profundización — Agente de analítica visual (Reto 2)

Continuación de [`analitica_visual_agente.md`](analitica_visual_agente.md). Foco en los tres puntos
que quedaron sin profundidad real: límites de escala del grafo, estado de LIDA, y seguridad de
ejecución de código.

> **Re-auditoría (segunda pasada, sept. 2026)**: el tamaño del grafo se confirmó contra el repo de
> la Etapa 1. Se corrigió un error técnico (PyVis/vis-network **no** usa WebGL) y se resolvieron
> dos contradicciones que quedaban abiertas: LIDA **sí ejecuta código Python**, contra lo que
> sugiere el documento base, y Cosmograph alojado choca con el argumento de soberanía del dato del
> resto del sistema.

## 1. Límite real de escala para visualizar el grafo de ~27 000 nodos / ~97 000 aristas

El tamaño está **confirmado contra el repo real de la Etapa 1**: `docs/informe_tecnico.tex` de
`ad-astra-retrieval` reporta el grafo podado a **26 961 nodos y 97 182 aristas** (desde 561 522
relaciones antes de podar). La cifra de "~27k / ~97k" que usa este documento es correcta.

Confirmado con fuentes técnicas, no solo nombres de librerías:

| Librería | Límite real documentado | Aplica al caso (27k nodos / 97k aristas) |
|---|---|---|
| **Cosmograph** | Renderizado GPU (WebGL), calcula layouts de fuerza para **cientos de miles a millones de nodos/aristas en segundos**, liberando la CPU. Es la única herramienta de las evaluadas documentada explícitamente para ese rango. | **Sí, sin pre-filtrado.** Es la única opción confirmada para el grafo completo interactivo. |
| **Sigma.js** | Pipeline de renderizado WebGL basado en instancias; pensado para "miles de nodos y aristas", con degradación reportada por desarrolladores en versiones recientes por encima de ese rango. | Requiere pre-filtrado/muestreo — no está documentado para 27k nodos con fluidez garantizada. |
| **PyVis (vis-network)** | ⚠️ **Corrección de la primera pasada: PyVis NO usa WebGL.** vis-network renderiza sobre **Canvas 2D de HTML5** y calcula el layout de fuerza **en el hilo principal de JavaScript**. Por eso su techo práctico está en el orden de **unos pocos miles de nodos**, muy por debajo de 27k — no es una degradación suave, la pestaña se congela. | Usar solo sobre subgrafos filtrados (por fenómeno, por entidad de consulta), no sobre el grafo entero. **La conclusión de la primera pasada era correcta; el motivo que daba, no.** |
| **streamlit-agraph** | Envoltorio de **react-graph-vis** (que a su vez envuelve vis-network) para Streamlit — hereda las mismas limitaciones. No envuelve a PyVis: son dos envoltorios hermanos del mismo motor. | Igual que PyVis: subgrafos filtrados, no el grafo completo. |

**Recomendación actualizada, más específica que la investigación anterior**: usar **PyVis/
streamlit-agraph como vista por defecto sobre subgrafos filtrados** (por fenómeno, o los vecinos de
primer orden de las entidades de una consulta puntual — esto ya lo resuelve `GraphRetriever` según
`arquitectura_multiagente.md`), que es rápido de integrar y no depende de un servicio externo; y
reservar **Cosmograph solo si el equipo quiere ofrecer una vista "grafo completo" como pieza de
impacto visual en el pitch** — es la única opción verificada para ese tamaño completo, pero agrega
una dependencia nueva bajo presión de tiempo. Si el tiempo es escaso, la vista filtrada con PyVis
cubre el requisito funcional sin ese riesgo.

> ⚠️ **Contradicción entre documentos detectada en la re-auditoría, resolver antes de decidir.**
> Cosmograph es una librería **JavaScript/WebGL** (además de una app alojada). Meterla en Streamlit
> exige o bien un componente custom de Streamlit, o bien un iframe a la aplicación alojada de
> Cosmograph. **La segunda opción implica sacar el grafo de entidades del corpus de defensa hacia
> un servicio de terceros** — que es exactamente lo que `profundizacion_llm_generativo.md` §5
> identifica como el riesgo de percepción más caro ante este jurado ("¿por qué mandan datos de
> defensa a una nube externa?"), y contradice el argumento de "camino 100% local" que ese mismo
> documento recomienda preparar como diferenciador.
>
> No es una razón para descartar Cosmograph, pero sí para que **si se usa, sea por la vía del
> componente local y no por iframe al servicio alojado** — y para que nadie lo proponga en el pitch
> como "vista de impacto" sin haber resuelto antes esa pregunta. Dado el plazo de horas, la opción
> coherente con el resto del sistema sigue siendo **PyVis sobre subgrafos filtrados**.

## 2. Estado de LIDA (Microsoft) en 2026

LIDA sigue siendo **open source y activo** (contenido publicado hasta junio de 2026 según el
repositorio), mantiene su enfoque "grammar-agnostic": genera visualizaciones independientes de la
librería final (Matplotlib, Seaborn, Altair, D3) y es compatible con múltiples proveedores de LLM
(OpenAI, Azure OpenAI, PaLM, Cohere, Hugging Face). No se encontró en esta búsqueda un sucesor o
alternativa que lo haya reemplazado como referencia del patrón "LLM → especificación de
visualización agnóstica de gramática". **Lectura**: sigue siendo una opción legítima de respaldo
para preguntas fuera del catálogo fijo, tal como proponía la investigación original — no hace falta
buscar alternativas más nuevas.

> ⚠️ **Contradicción con el documento base, corregida aquí.** `analitica_visual_agente.md` coloca a
> LIDA en su **opción 2 ("generación declarativa")** y argumenta que esa opción es "más segura
> porque el output es datos (JSON), no código ejecutable". **Eso no aplica a LIDA.** LIDA genera y
> **ejecuta código Python** (matplotlib, seaborn, altair, etc.) para producir la figura; su
> "agnosticismo de gramática" se refiere a que no está atado a una gramática de visualización
> concreta, no a que no ejecute código.
>
> Consecuencia directa: **si se usa LIDA, el requisito de sandboxing de la §3 de este documento
> vuelve a ser obligatorio**, no opcional. La combinación "usamos LIDA como respaldo" + "el
> sandboxing es de prioridad baja" es incoherente. Las opciones coherentes son dos: (a) catálogo
> fijo, sin LIDA, sin sandbox; (b) catálogo fijo + LIDA/generación de código **con** sandbox
> resuelto. Para un plazo de horas, (a).
>
> Si lo que se quiere es de verdad "salida declarativa sin ejecución de código", lo que corresponde
> es pedirle al LLM un **JSON de Vega-Lite validado contra su esquema** y renderizarlo con
> `st.vega_lite_chart` — ahí sí el output es datos y no hay código que ejecutar. Esa es la opción
> que cumple lo que el documento base quería decir.

## 3. Seguridad de sandboxing para código generado por LLM (si se usa la opción de respaldo)

No se completó una comparación exhaustiva de RestrictedPython vs E2B vs subprocess con timeout en
esta pasada (alcance no cubierto por las búsquedas realizadas). **Queda pendiente de profundizar**
si el equipo efectivamente decide implementar la opción de generación de código como respaldo del
catálogo fijo — dado que el catálogo fijo (opción de menor riesgo, ya recomendada) es la estrategia
principal, este punto es de prioridad baja mientras no se decida usar generación de código libre.

## 4. Mapas coropléticos de ALC — sin cambios sobre la recomendación anterior

No se encontró evidencia que desplace a Plotly Express (`px.choropleth`) como opción de integración
más directa con Streamlit vía `st.plotly_chart`. Se mantiene la recomendación original.

## Fuentes consultadas

- [How to Visualize a Graph with a Million Nodes — Nightingale](https://nightingaledvs.com/how-to-visualize-a-graph-with-a-million-nodes/)
- [The Concept of Cosmograph](https://cosmograph.app/docs-general/concept/)
- [Compare Graph Libraries — Cosmograph](https://cosmograph.app/library/compare/)
- ⚠️ [Cytoscape.js vs vis-network vs Sigma.js 2026 — PkgPulse Guides](https://www.pkgpulse.com/guides/cytoscape-vs-vis-network-vs-sigma-graph-visualization-2026) — *dominio de procedencia desconocida, sin metodología de benchmark publicada; útil como orientación, no citable.*
- ⚠️ [Python Tools for Visualizing Large Graphs (100k Vertices & 1M Edges)](https://www.py4u.org/blog/python-tools-to-visualize-100k-vertices-and-1m-edges/) — *py4u.org es un sitio que republica contenido de Stack Overflow sin atribución fiable; no citar. Para los límites reales de cada motor, la documentación oficial de vis-network, Sigma.js y Cosmograph es la fuente correcta.*
- [LIDA — GitHub (microsoft/lida)](https://github.com/microsoft/lida)
- [LIDA — Microsoft Research project page](https://www.microsoft.com/en-us/research/project/lida-automatic-generation-of-grammar-agnostic-visualizations/)

## Resumen (para el equipo)

Para 27k nodos (cifra confirmada contra el repo: 26 961 nodos / 97 182 aristas): usar
**PyVis/streamlit-agraph sobre subgrafos filtrados** como estrategia principal (rápida, sin
dependencia externa) — con el motivo correcto: vis-network es **Canvas 2D con layout en el hilo
principal**, no WebGL, y su techo está en pocos miles de nodos. **Cosmograph** es la única librería
verificada que aguanta el grafo completo, pero embeberla exige componente custom o iframe a un
servicio alojado, y esa segunda vía choca con el argumento de soberanía del dato del resto del
sistema: resérvala como "pieza de impacto" opcional y solo por la vía local.

LIDA sigue vivo, **pero ejecuta código Python generado** — no es la alternativa "sin ejecución" que
sugiere el documento base. El riesgo de seguridad de ejecutar código generado por LLM **queda sin
verificar en esta pasada**; es irrelevante solo si el equipo se queda con el catálogo fijo **y sin
LIDA**. Si se quiere flexibilidad sin sandbox, la salida correcta es un **JSON de Vega-Lite
validado contra esquema**, renderizado con `st.vega_lite_chart`.
