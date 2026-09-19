# Rectificación — auditoría de rigor sobre los 6 documentos `profundizacion_*`

Auditoría realizada en septiembre de 2026 sobre los seis documentos de profundización y los cinco
documentos base de `docs/investigacion/`, más verificación puntual contra el repo real de la Etapa 1
(`ad-astra-retrieval`) y contra fuentes primarias en la web para las cifras de mayor riesgo.

**Método**: no se rehízo la investigación. Se leyeron los 11 documentos, se buscaron
contradicciones internas y cruzadas, y se re-verificaron con búsqueda real **solo** las
afirmaciones que iban a usarse textualmente en el pitch (cifras de los fenómenos 1, 2 y 3) más un
puñado de afirmaciones técnicas de alto impacto. Las cifras cuya fuente primaria confirmó el dato
se dejaron intactas; las que no, se rebajaron o corrigieron en el documento correspondiente.

**Veredicto general**: el conjunto es **más sólido de lo que temía**. La mayoría de las cifras de
los fenómenos resistieron la verificación palabra por palabra. Los problemas reales se concentran
en (a) un error grave de subestimación en fenómeno 3, (b) una cifra de ESA que solo existe en un
agregador, (c) unas estadísticas de Perplexity que no existen en ninguna fuente, y (d) varias
cifras de adopción de frameworks tomadas de blogs de marketing.

---

## (a) Correcciones aplicadas

### `profundizacion_fenomeno3_cifras.md` — la más grave del conjunto

| # | Qué decía | Qué dice ahora | Por qué |
|---|---|---|---|
| 1 | **"Venezolanos en Colombia: más de 1 millón"** | **~2 810 358 (≈2.8 millones)**, corte marzo 2025 de Migración Colombia vía R4V | Error de subestimación de **más de 1.8 millones de personas**. Es técnicamente cierto que son "más de 1 millón", pero dicho ante un jurado colombiano se lee como desconocimiento del dato básico del propio país. **Era el peor error del conjunto.** |
| 2 | La tabla decía "más de 1 millón" y la lista de fuentes del mismo archivo decía "3 millones" | Coherente en ~2.81 millones | Contradicción interna dentro de un mismo documento. |
| 3 | "~6.7 millones acogidas en ALC" | **~6.9 millones** | ACNUR y R4V publican 6.9, no 6.7. |
| 4 | "RMRP 2025-2026: **230 socios**, meta de **2.34 millones** de personas" | Rebajado a **no verificado**; se añaden las cifras que R4V sí publica: **RMRP 2026, más de 150 socios en 17 países, USD 763 M para 1.2 millones de personas** | Ninguno de los dos números originales aparece en la fuente citada. |
| 5 | "Colombia es el **3er país más desigual del mundo** *en ese ajuste* [IDH ajustado por desigualdad]" | El 3er puesto es por **coeficiente de Gini del informe del PNUD (54.8)**, detrás de Sudáfrica (63) y Namibia (59.1). El IDH ajustado por desigualdad la deja en **0.593, puesto 107** | Conflación de dos indicadores distintos. El dato es real, la atribución no. Es el tipo de error que un jurado técnico desmonta en una pregunta. |
| 6 | "el informe PNUD 2025 no desagregó Colombia en las fuentes consultadas" | Corregido: **sí la desagrega** (de ahí el Gini 54.8 y el 3er puesto) | Caveat innecesario que además contradecía la fila de al lado. |
| 7 | Fuente: un **tuit de @DANE_Colombia** para el Gini | Sustituido por el boletín técnico oficial en PDF + la presentación de resultados + El Colombiano | Una publicación en X no es presentable ante un jurado cuando el boletín oficial existe. |
| 8 | Enlace de ACNUR truncado (`...alcanza-los`) | Sustituido por la página de situación de Venezuela de ACNUR | El enlace original no resolvía a nada comprobable. |
| 9 | "GINI 0.553 en 2023" | Retirado; se citan solo 2025 (0.531) y 2024 (0.551), que sí están confirmados | No se pudo re-confirmar el valor de 2023. |

### `profundizacion_fenomeno1_2_cifras.md`

| # | Qué decía | Qué dice ahora | Por qué |
|---|---|---|---|
| 10 | "Riesgo de colisión en LEO **+20% desde 2024**, con 1.2 millones de fragmentos no rastreables **concentrados en la banda de 550 km**" — marcado "Verificado" | **Rebajado a NO VERIFICADO, marcado como no usable en el pitch** | Dos problemas: el "+20%" solo aparece en **fodnews.com**, un agregador sin trazabilidad editorial, y no se pudo confirmar en esa.int ni en el PDF del informe; y "1.2 M concentrados a 550 km" es una **lectura errónea** — ese 1.2 M es la estimación MASTER **global** de fragmentos de 1-10 cm en toda la órbita terrestre. |
| 11 | "~68 450 objetos >10cm" presentado junto a los rastreados, sin distinguir | Se marca explícitamente que los 68 450 son **estimación del modelo MASTER** (población de referencia al 1 feb. 2026), y que lo **rastreado** son los >43 000 | La cifra es correcta, pero decir "ESA rastrea 68 450 objetos" sería falso. Ante un jurado del sector aeroespacial es un error caro y evitable. |
| 12 | "Carga militar: **subió de 2.4% (2024) a 2.5% (2025)**" | Se conserva el 2.5% de 2025 (confirmado) y se advierte que **el 2.4% de 2024 no se re-confirmó** — la ficha de SIPRI anterior ya reportaba 2.5% para 2024, así que no presentarlo como una subida | Riesgo de afirmar una tendencia que no existe. |
| 13 | "+41% acumulado en la década 2016-2025" | Marcado como no re-confirmado; omitir o verificar en el PDF | El resto de la fila de SIPRI sí se verificó literalmente; este añadido no. |
| 14 | Lista de fuentes: "Stop Killer Robots — **156/76** states support negotiations" | Separado: **76 estados** = apoyo a negociar dentro de la CCAC (fuente: HRW); **156 estados** = votos a favor de la resolución de la **Asamblea General**, que es otra votación | Dos votaciones distintas presentadas como si fueran la misma cifra. |
| 15 | Fechas exactas de la 2ª sesión del GGE (31 ago.–4 sept. 2026) | Marcadas como no re-confirmadas día por día; decir "la última sesión del GGE, septiembre de 2026" | La cifra de 76 estados y las fechas de la RevCon sí están confirmadas; estas no. |
| 16 | SWF Global Counterspace Report "2026" | Añadido: **la ventana de evidencia del informe cierra en marzo de 2025** | No presentarlo como "lo que pasó este año". |
| 17 | Lista de fuentes plana | Separada en **primarias (citables)** y **secundarias/agregadores (no citables)**, con FODNews y New Space Economy marcados | Era imposible distinguir qué enlace respaldaba qué. |
| 18 | — | Añadido: la cifra de "USD 2,4 billones (2023)" de `fenomeno1_ia_militar.md` **queda sustituida** por la de 2025 | Contradicción entre documento base y profundización, sin explicar. |

### `profundizacion_verificacion_citas.md`

| # | Qué decía | Qué dice ahora | Por qué |
|---|---|---|---|
| 19 | "**94% de las respuestas de Perplexity** contienen citas numeradas inline, con un promedio de **7.1 a 8.2 fuentes por respuesta**" | **Retirado por completo.** Se conserva el patrón cualitativo (que sí es observable) y se documenta que los estudios reales dan cifras muy distintas y entre sí incompatibles: ~17.9 fuentes/respuesta (Profound), 5-10 citas inline típicas, 68.6% de respuestas con cita en Sonar Pro | **Ninguna de las dos cifras se pudo encontrar en ninguna fuente.** Es el caso más claro de posible alucinación del conjunto: dos números con un decimal, muy citables, sin origen. Las fuentes que las respaldaban (`aiuxplayground.com`, `aydesign.ai`) son blogs sin metodología publicada. |
| 20 | El "badge de confianza" descrito como parte del diseño de Perplexity | Aclarado que es un **patrón propuesto por el equipo**, no una descripción de lo que hace Perplexity | No atribuir a un tercero un diseño propio. |
| 21 | HHEM como "segunda señal si sobra tiempo" | Añadido que el límite real no es el tiempo sino la **VRAM**: sería el 4º o 5º modelo residente en 8 GB | Coherencia con la restricción de hardware. |

### `profundizacion_llm_generativo.md`

| # | Qué decía | Qué dice ahora | Por qué |
|---|---|---|---|
| 22 | Falcon3-10B "entrenado en **14 billones de tokens específicamente en 4 idiomas**" | Corregido: los 14 B son el corpus de la **familia Falcon3 completa**, mayoritariamente web/código/STEM en inglés; el 10B se obtuvo por *depth up-scaling* del 7B más **2 B de tokens** de preentrenamiento continuado; los 4 idiomas son los que **declara soportar** | La afirmación original convertía "soporta ES/PT" en "fue entrenado dedicadamente en ES/PT", que es lo que sostenía la recomendación de ponerlo a la par de Qwen. |
| 23 | Falcon3-10B "candidato serio a la par de Qwen3.5-9B" | Rebajado a **candidato de respaldo que vale la pena medir** | Se añaden dos límites duros que faltaban: **contexto de 32K** (ajustado para un RAG de 10 fragmentos + historial) y que **Falcon3 es de diciembre de 2024**, una generación anterior. |
| 24 | "No se pudo confirmar un modelo **Fable**" | Corregido: **Fable existe** (Claude Fable 5.1, $10/$50 por MTok, caché a $0.25). Se añade a la tabla de precios y se anota que no aplica a este proyecto por costo | Afirmación falsa en negativo. |
| 25 | "El presupuesto de API es más barato de lo proyectado" | Matizado: Sonnet 5 usa el tokenizador de Opus 4.7 y **el mismo texto produce ~30% más tokens** — presupuestar con ese colchón | El precio por token bajó respecto a lo esperado, pero el costo por documento no bajó tanto. |
| 26 | — | **Sección nueva sobre VRAM**: 8 GB compartidos entre BGE-M3, bge-reranker-v2-m3, GLiNER y el LLM generativo **no alcanzan**. Hay que decidir la política de residencia en GPU antes de elegir modelo | Ninguno de los seis documentos analizaba si los modelos recomendados **caben** en el hardware del equipo. Es el vacío técnico más serio que encontré. |
| 27 | "Qwen3.5" marcado como no verificado | Reforzado: se señala que la investigación base (`INVESTIGACION_SISTEMA_MULTIAGENTE.md`) afirma cosas muy concretas sobre ese modelo (262K contexto, 6.6 GB Q4, 201 idiomas) que **tampoco se confirmaron**, y se propone la prueba decisiva: `ollama pull` | Contradicción abierta entre documento base y profundización. |

### `profundizacion_analitica_visual.md`

| # | Qué decía | Qué dice ahora | Por qué |
|---|---|---|---|
| 28 | "PyVis: librería ligera **basada en WebGL** vía vis.js" | Corregido: vis-network renderiza sobre **Canvas 2D** y calcula el layout **en el hilo principal de JS**; su techo práctico son unos pocos miles de nodos y no degrada suavemente, congela la pestaña | Error técnico. La conclusión (usar subgrafos filtrados) era correcta; el motivo, no. |
| 29 | "streamlit-agraph: envoltorio de vis.js/**PyVis**" | Corregido: envuelve **react-graph-vis**; son dos envoltorios hermanos del mismo motor, no uno del otro | Precisión. |
| 30 | LIDA como opción "declarativa, más segura porque el output es datos y no código" (heredado del documento base) | Corregido: **LIDA genera y ejecuta código Python**. Si se usa LIDA, el sandboxing **vuelve a ser obligatorio**. Se propone la alternativa que sí cumple lo que el documento base quería: **JSON de Vega-Lite validado contra esquema + `st.vega_lite_chart`** | Contradicción real entre `analitica_visual_agente.md` §2 y `profundizacion_analitica_visual.md` §3: el documento base justifica bajar la prioridad del sandbox apoyándose en una propiedad que LIDA no tiene. |
| 31 | Cosmograph como "pieza de impacto" opcional | Añadida la contradicción con `profundizacion_llm_generativo.md` §5: Cosmograph alojado implica **sacar el grafo de entidades del corpus de defensa a un servicio de terceros**, justo lo que ese documento identifica como el mayor riesgo de percepción. Si se usa, por componente local, nunca por iframe | Contradicción cruzada no señalada. |
| 32 | "~27 000 nodos / ~97 000 aristas" sin fuente | Confirmado contra el repo real: **26 961 nodos / 97 182 aristas** (`ad-astra-retrieval/docs/informe_tecnico.tex`) | Verificación positiva, la cifra era correcta. |
| 33 | `py4u.org` y `pkgpulse.com` en la lista de fuentes sin marcar | Marcadas como no citables (py4u republica Stack Overflow sin atribución fiable; pkgpulse no publica metodología) | Higiene de fuentes. |

### `profundizacion_arquitectura_multiagente.md`

| # | Qué decía | Qué dice ahora | Por qué |
|---|---|---|---|
| 34 | LangGraph "concentra el **34% de las citas en documentos de arquitectura de producción** en empresas de 1000+ empleados según Q1 2026" | Rebajado a **no verificado** | Cifra sin fuente primaria: sale de dos blogs comparativos (`pooya.blog`, `fast.io`) sin metodología ni indicación de quién midió. Es una estadística irresistible para un pitch y exactamente por eso peligrosa. |
| 35 | CrewAI "100 000+ desarrolladores certificados, 450M+ workflows/mes" | Rebajado a **cifras de marketing reproducidas por terceros** | Ídem. |
| 36 | "LangGraph **superó a CrewAI** en estrellas de GitHub" seguido de "24 600 vs 45 900" | Señalado que los propios números **dicen lo contrario** de la frase, y que son volátiles | Contradicción dentro de una sola celda de la tabla. |
| 37 | Cifras de BFCL v4 (líder 0.770, brecha 3-4 p.p., caída 5-10 p.p., umbral de 5 llamadas) | El **fenómeno cualitativo se mantiene** (la precisión de tool-calling se degrada con la profundidad de la cadena); las **cifras exactas** se marcan como provenientes de un blog secundario, a verificar en el leaderboard antes de decirlas | El argumento de diseño no depende de los números exactos. |
| 38 | Esqueleto de código LangGraph presentado como "real, no pseudocódigo" | Añadido aviso: **no se ejecutó**; faltan `set_entry_point`, `compile()`, y tres símbolos sin definir; `create_react_agent` cambió de módulo entre versiones | Un equipo con prisa lo pega tal cual y pierde media hora. |
| 39 | — | **Sección 0 nueva**: el campo `fenomeno` existe pero es `int` restringido a 1/2/3, y el camino de respaldo de `build_index.py` puede dejarlo en **0**. Si el filtro es `fenomeno == N` ciego, esos documentos **desaparecen del asistente sin que nadie lo note** | Verificado en `src/schema.py`, `src/corpus_adl.py` y `scripts/build_index.py`. Todo el diseño de especialista-por-fenómeno se apoya en este campo y ningún documento describía su forma real. |
| 40 | — | **Añadido a §4**: el pipeline de 5 saltos no es solo un problema de precisión sino de **latencia en la demo en vivo** con un LLM local en 8 GB. Medir el camino completo antes del pitch y tener un modo corto preparado | Riesgo operativo del día de la presentación. |

---

## (b) Afirmaciones revisadas y **confirmadas como sólidas**

Estas se verificaron contra fuente primaria y **se pueden citar tal cual**. No se tocaron.

**Fenómeno 1 — SIPRI (verificado palabra por palabra contra la ficha de abril de 2026):**
- Gasto militar mundial 2025 = **USD 2 887 000 millones** (≈2.9 billones), **+2.9% real**, **11º año consecutivo** de aumento, **2.5% del PIB mundial**.
- Top 3 (EE.UU., China, Rusia) = **USD 1 480 000 millones = 51%** del total.
- **EE.UU. a la baja**, **Europa +14%**, **Asia-Oceanía +8.1%**.
- Las URL de SIPRI citadas son correctas y resuelven al documento que dicen respaldar.

**Fenómeno 1 — proceso ONU sobre LAWS:**
- **76 estados**, de los cuales **70 son Altas Partes Contratantes** de la CCAC, apoyan pasar a negociación de un instrumento vinculante.
- **7ª Conferencia de Revisión de la CCAC: 16-20 de noviembre de 2026, Ginebra**, donde se decide entre negociar, extender el mandato de solo-discusión, o dejar caducar el proceso.
- La URL de HRW es real y respalda exactamente esto. **Este es el material más fuerte del pitch**: es un punto de inflexión con fecha, no una generalidad.

**Fenómeno 2 — ESA Space Environment Report 2026:**
- **>43 000 objetos >10 cm efectivamente rastreados** por las redes de vigilancia.
- Estimación del modelo MASTER: **~68 450 objetos >10 cm** (incluidas ~11 300 cargas útiles activas), **~1.2 millones de fragmentos de 1-10 cm**, **>140 millones <1 cm**.
- La URL de esa.int es correcta.

**Fenómeno 2 — Secure World Foundation:**
- **9ª edición** del Global Counterspace Capabilities Report, **13 países**, **Alemania incluida por primera vez**, **5 categorías** (co-orbital, ascenso directo, guerra electrónica, energía dirigida, ciber).
- Hallazgo central: la **guerra electrónica / jamming de GPS**, no las armas cinéticas, es la capacidad antisatélite realmente en uso. Confirmado también por Breaking Defense.
- La lectura del equipo ("seguridad espacial ≠ ciencia ficción") es un buen ángulo y está bien fundamentada.

**Fenómeno 3:**
- **UNODC GSH 2023: 18 homicidios por 100 000 en ALC, el triple del promedio mundial.** Confirmado. Bonus confirmado y añadido: **50% de los homicidios en las Américas están ligados a crimen organizado, frente al 24% mundial** — es el respaldo cuantitativo del argumento central del documento base.
- **InSight Crime 2025: al menos 108 838 homicidios en ALC, tasa mediana ~17.6/100k, >5% menos que 2024.** Confirmado literalmente, incluida la URL.
- **DANE: Gini Colombia 0.531 en 2025 vs 0.551 en 2024, el más bajo en seis años.** Confirmado, y la URL del boletín (`bol-PM-2025.pdf`) es real. Añadido como bonus verificado: pobreza monetaria **28.0%** (−3.8 p.p.), pobreza extrema **9.6%**, línea de pobreza **$482 041**.
- **ACNUR/R4V: ~7.9 millones han salido de Venezuela.** Confirmado.
- **IDH Colombia: 0.758, puesto 91 de 193, categoría "Alto", puesto 14 en América Latina; IDH ajustado por desigualdad 0.593, puesto 107.** Confirmado.
- La **nota metodológica sobre la discrepancia UNODC/InSight Crime** es excelente y se amplió: se encontró una **segunda discrepancia** igual de útil y más potente (DANE 0.531 vs Gini 54.8 del PNUD), porque ahí **ambas fuentes son oficiales**.

**Técnicas:**
- **AutoGen en modo mantenimiento desde octubre de 2025** y **Microsoft Agent Framework 1.0 GA el 2 de abril de 2026** como sucesor oficial. Confirmado, incluido el propio README de `microsoft/autogen`. Es el hallazgo técnico más sólido del conjunto.
- **Precios Claude**: Haiku 4.5 $1/$5, **Sonnet 5 $2/$10 permanente** (la subida a $3/$15 fue efectivamente cancelada), Opus 5 $5/$25. Confirmado.
- **ToS/ZDR de Anthropic**: no entrenamiento con contenido de clientes por defecto en la API comercial, borrado a 30 días, ZDR disponible vía ventas. Confirmado. La honestidad del documento al decir "no se encontró restricción" en vez de "no hay restricción" es correcta y hay que mantenerla.
- **Falcon3-10B soporta 4 idiomas (EN/FR/ES/PT)** y tiene **32K de contexto**. Confirmado.
- **Tamaño del grafo: 26 961 nodos / 97 182 aristas.** Confirmado contra el repo.
- **El campo `fenomeno` existe en la metadata de la Etapa 1.** Confirmado en `src/schema.py`.
- **El argumento completo del reranker como scorer de grounding** (§1 de `profundizacion_verificacion_citas.md`), incluida la advertencia honesta de que mide relevancia temática y no fidelidad factual. Es conceptualmente correcto y bien expresado. **No lo toqué: es la mejor sección de los seis documentos.**
- **La distinción workflow vs. agente** (§5 de `profundizacion_arquitectura_multiagente.md`) y la recomendación de ser honestos si algún nodo queda hardcodeado. Buen criterio, se mantiene íntegro.

---

## (c) Vacíos abiertos, por prioridad

### PRIORIDAD ALTA — resolver antes del pitch

1. **Los cuatro modelos no caben en 8 GB de VRAM.** BGE-M3 + bge-reranker-v2-m3 + GLiNER + un LLM generativo de 7-10B en Q4 exceden la RTX 4060. Ningún documento lo analizaba. Hay que decidir ya: ¿carga/descarga por turno? ¿reranker en CPU? ¿LLM por API y GPU solo para recuperación? **Esto puede tumbar la demo en vivo**, no es un detalle de optimización.

2. **Latencia del camino completo, sin medir.** Supervisor → especialista → verificador → reintento → analítica son 5 generaciones secuenciales más FAISS y reranking. Nadie ha cronometrado esto. Medirlo y tener un modo de demo corto preparado.

3. **¿Existe "Qwen3.5-9B" con ese nombre exacto?** La investigación base afirma cosas muy concretas (262K contexto, 6.6 GB en Q4, Apache 2.0, 201 idiomas) que no se confirmaron en ninguna pasada. Se resuelve en dos minutos con `ollama pull`. Si no existe, la recomendación de modelo local del equipo se queda sin sujeto.

4. **Qué hace el orquestador con `fenomeno == 0`.** El camino de respaldo de `build_index.py` asigna 0 a documentos que no están en el inventario. Un filtro ciego por fenómeno los borra del asistente en silencio. Contar cuántos hay en `metadata.jsonl` y decidir la política.

5. **No hay ninguna cifra verificada de Colombia para los fenómenos 1 y 2.** Ambas filas ("desarrollos de IA militar en Colombia: CCOC, FAC" y "FACSAT / Agencia Espacial Colombiana") siguen marcadas como "no encontrado". El reto es colombiano y el eje narrativo de los tres documentos base es "global → regional → Colombia". **Es el vacío de contenido más visible ante este jurado en particular**: se tienen cifras globales excelentes y cero cifras nacionales propias en dos de los tres fenómenos. Fuentes a atacar: Mindefensa, FAC, AEC, y —clave— **el propio corpus indexado**, que es donde el jurado espera que se busque.

### PRIORIDAD MEDIA

6. **Sandboxing de código generado por LLM: sin resolver.** Es aceptable dejarlo así **solo** si se cierra la puerta a LIDA y a la generación de código, quedándose con el catálogo fijo. Si alguien mete LIDA "porque es de Microsoft y queda bien en el pitch", el problema vuelve. Decidirlo explícitamente, no por omisión.

7. **Cifras del AI Index de Stanford: nunca verificadas.** Siguen remitiendo al XLSX del corpus. Es la decisión correcta, pero significa que **nadie ha abierto ese XLSX todavía** y no se sabe qué hay dentro. Si se piensa mostrar una gráfica de inversión en IA, hay que mirarlo antes.

8. **Satélites activos y desglose por operador (UCS Satellite Database): no verificado.** El documento hace bien en no repetir la cifra de "~9 839-11 125 activos, 53% Starlink" que circuló sin confirmar. Si se quiere una gráfica de satélites por operador, hay que ir a la fuente.

9. **Implementación del Acuerdo de Paz (% según JEP / Instituto Kroc), víctimas del conflicto (Unidad para las Víctimas), estado de disidencias: no verificados.** Los tres son previsibles en preguntas del jurado sobre Colombia.

10. **Patrón de streaming `st.write_stream` + `stream_mode="messages"`: tomado de un tutorial personal en Medium**, no de la documentación oficial. Funciona o no funciona en diez minutos de prueba; hacerla antes de construir la UI encima.

### PRIORIDAD BAJA

11. **QA extractivo multilingüe (Escenario B):** sin verificar checkpoints más nuevos que `xlm-roberta-large-squad2`. Solo importa si reaparece la prohibición de decoders, que no es el caso en la Etapa 2.

12. **Comparación exhaustiva de mapas coropléticos.** Plotly Express sigue siendo lo razonable; no hay razón para revisarlo.

13. **CEPAL Panorama Social / Banco Mundial LAC Equity Lab:** no verificados, pero el fenómeno 3 ya tiene material sobrado con DANE, PNUD, UNODC, InSight Crime y ACNUR/R4V.

---

## Nota final sobre el uso de estos documentos en el pitch

La regla operativa que sugiero al equipo: **cualquier número que vaya a una diapositiva tiene que
estar en la columna "Verificado" de una de las dos tablas de cifras, o no va.** Las filas rebajadas
en esta rectificación están marcadas con ⚠️ precisamente para que se puedan filtrar de un vistazo.

Y un patrón que conviene reconocer para el futuro: las afirmaciones que resultaron falsas comparten
una firma. Son **cifras con un decimal, redondeadas de forma cómoda, que respaldan exactamente el
punto que uno quería defender, y cuya fuente es un dominio del que nadie ha oído hablar** (el 94% de
Perplexity, el 34% de LangGraph, el +20% de ESA). Las cifras que resistieron la verificación vienen
todas de organismos con nombre propio —SIPRI, ESA, UNODC, DANE, ACNUR, PNUD, SWF, HRW— y suelen ser
menos redondas. Es un buen filtro mental para cuando no haya tiempo de verificar.
