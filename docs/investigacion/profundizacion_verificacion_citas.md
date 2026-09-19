# Profundización — Verificación de citas / grounding (Reto 1)

Continuación de la sección 3.2/§2 de `arquitectura_multiagente.md`. Foco: ¿es viable usar el
reranker cross-encoder ya disponible (`bge-reranker-v2-m3`) como scorer de grounding sin sumar otro
LLM, y qué patrón de LangGraph lo implementa?

> **Re-auditoría (segunda pasada, sept. 2026)**: el argumento central de este documento —reranker
> como scorer de grounding, con la advertencia honesta de que mide relevancia y no fidelidad— es
> **sólido y se mantiene íntegro**. Se retiraron las estadísticas de Perplexity de §4, que no se
> pudieron verificar en ninguna fuente y contradicen los estudios que sí tienen metodología
> publicada.

## 1. Reranker cross-encoder como scorer de grounding — viable, con matiz importante

Un cross-encoder reranker toma **(query, pasaje)** y devuelve un score de relevancia calculado con
atención completa entre ambos textos — esto es exactamente la misma mecánica que se necesita para
"¿esta oración generada está respaldada por este fragmento fuente?": basta con tratar la **oración
de la respuesta como la "query"** y el **fragmento citado como el "pasaje"**, y usar el score del
reranker como proxy de respaldo/grounding. Es una reutilización directa, no requiere reentrenar
nada ni sumar otro modelo.

**Matiz que hay que comunicar honestamente en el pitch**: el reranker fue entrenado para relevancia
semántica (¿este pasaje es relevante para esta consulta?), no específicamente para "fidelidad"
(¿esta afirmación es una consecuencia lógica de este texto, sin contradecirlo ni inventar detalles
no presentes?). Un score alto de reranker indica relación temática fuerte, pero no garantiza al
100% ausencia de alucinación de detalle (un número inventado dentro de una oración temáticamente
correcta podría pasar el filtro). Es una aproximación barata y defendible, no una prueba formal de
fidelidad — hay que decir esto así ante el jurado, no venderlo como "verificación perfecta".

## 2. Métodos de detección de alucinación más baratos que otro LLM grande

- **RAGAS — métrica de faithfulness**: framework abierto que da puntajes de *faithfulness*,
  *answer relevance* y *context precision*. Es la métrica más citada en la literatura de evaluación
  de RAG. Importante: la propia literatura advierte que **faithfulness sola es una señal poco
  confiable si se lee aislada de relevancia de la respuesta** — hay que combinar ambas, no usar solo
  una.
- **Vectara HHEM / HHEM-2.1** (Hughes Hallucination Evaluation Model): un **clasificador afinado**
  (no un LLM generativo) que da una etiqueta binaria alucinado/no-alucinado contra un contexto
  fuente. Es más barato computacionalmente que pedirle a un LLM grande que juzgue su propia salida,
  y es exactamente el tipo de "modelo chico y especializado" coherente con el patrón que el equipo
  ya usa (GLiNER, bge-reranker).
- **SelfCheckGPT**: mencionado en la literatura pero requiere múltiples muestras del mismo LLM para
  detectar inconsistencia — más caro en tiempo de inferencia que las dos opciones anteriores, menos
  adecuado bajo presión de tiempo/GPU compartida.

**Recomendación concreta y priorizada para <24h**: usar el **reranker ya disponible como primer
filtro barato** (ya está cargado, cero costo adicional de infraestructura) y, si sobra tiempo,
sumar un clasificador tipo **HHEM** como segunda señal — dos señales combinadas (reranker +
clasificador de alucinación) es más defendible que una sola, y ninguna de las dos requiere otro LLM
generativo grande corriendo en paralelo.

> **Matiz de la re-auditoría sobre el "si sobra tiempo"**: HHEM es barato *comparado con un LLM*,
> pero no es gratis en la máquina de este equipo. La RTX 4060 de 8 GB ya tiene que alojar BGE-M3,
> bge-reranker-v2-m3, GLiNER y el LLM generativo local (ver
> `profundizacion_llm_generativo.md` §1). Sumar un cuarto/quinto modelo residente es precisamente lo
> que no cabe. Si se implementa HHEM, planificarlo **en CPU** o descartarlo: el reranker solo, con
> umbral bien calibrado, ya cumple el requisito y es la opción que no pone en riesgo la demo.
> "Prioridad baja" es la lectura correcta, y la razón es de VRAM, no solo de tiempo.

## 3. Patrón "reflection/critic node" en LangGraph aplicado a citas

Confirmado el patrón general (dos variantes documentadas):

1. **Basado en reflexión pura**: generador → crítico LLM → bucle de N iteraciones fijas → se
   devuelve la última versión. Menos confiable porque el "crítico" es también un LLM que puede
   fallar en juzgar.
2. **Basado en validación determinista (más recomendado)**: generar → **validar con una regla
   determinista exacta** (aquí: el score del reranker/HHEM contra un umbral) → si falla, devolver el
   error exacto (qué oración, qué fragmento no la respalda) al agente de síntesis para que
   reformule solo esa parte → reintentar con un tope de intentos (3 es el número típico reportado
   en ejemplos de producción) → si sigue fallando, la respuesta final marca esa afirmación
   explícitamente como "no verificada" en vez de forzar una cita.

Esta segunda variante es la que calza con el argumento de diseño que ya tenía la investigación
original (§3.2): "la respuesta es un paso de verificación explícito y auditable, no *le pedimos al
LLM que no mienta*" — porque el paso que decide aprobar/rechazar es una regla determinista sobre un
score, no otro LLM opinando.

## 4. Patrón de UI de citación — el patrón sí, las cifras NO

**Lo que sigue en pie (observable directamente en el producto, seguro de afirmar)**:

- Fila de tarjetas de fuente en la parte superior de la respuesta, con marcadores numerados inline
  que apuntan de vuelta a esas tarjetas.
- Cada afirmación queda ligada a un corchete numerado inmediatamente después de la oración; si una
  afirmación combina dos fuentes, aparecen ambos números.
- Patrón de "badge de confianza": combinar cantidad de fuentes + autoridad de la fuente + acuerdo
  entre fuentes en una sola señal visual (fuerte/mixta/débil/sin respaldo), con color y etiqueta de
  texto, no solo color. (Este es un patrón de diseño **propuesto por el equipo**, no una
  descripción de lo que hace Perplexity — no atribuírselo a ellos.)

> ⚠️ **Retirado en la re-auditoría.** La primera pasada afirmaba: *"94% de las respuestas de
> Perplexity contienen citas numeradas inline, con un promedio de 7.1 a 8.2 fuentes citadas por
> respuesta"*. **Esas dos cifras no se pudieron confirmar en ninguna fuente y no deben usarse.** Los
> estudios publicados que sí se encontraron dan números muy distintos entre sí y ninguno coincide
> con los anteriores: un análisis de Profound reporta **~17.9 fuentes por respuesta** en Perplexity
> (frente a 3.7 en ChatGPT); otras mediciones hablan de **5-10 citas inline típicas**, o de que
> Perplexity visita ~10 páginas por consulta y cita 3-4; y para el porcentaje de respuestas con
> cita, la medición encontrada es de **68.6% en Perplexity Sonar Pro**, no 94%. La dispersión entre
> estudios es tan grande que **ninguna de estas cifras es citable como dato duro**; lo único
> defendible es el patrón cualitativo.
>
> Las dos fuentes que la primera pasada usó para esto (`aiuxplayground.com`, `aydesign.ai`) son
> blogs de procedencia desconocida, sin metodología publicada. Se mantienen abajo listadas como
> material de inspiración de diseño, **no como evidencia**.

**Conclusión práctica, sin cambios**: el patrón de UI que ya proponía `arquitectura_multiagente.md`
(§3.2/§3.3) sigue siendo el correcto y no hace falta rediseñarlo. Lo que cambia es **cómo se
justifica ante el jurado**: decir "es el patrón que usan los asistentes con citación del mercado,
Perplexity incluido" (observable, verdadero) en vez de citar un porcentaje que no resiste una
búsqueda de comprobación en vivo.

## 5. Cómo explicarlo ante el jurado sin caer en "le pedimos que no mienta"

El framing más defendible, sintetizado de las fuentes: **no es que el sistema "confíe" en que el
LLM no alucina — es que existe un paso posterior, separado y determinista, que mide si la salida es
consistente con la fuente, y que puede rechazarla.** Esto es coherente con cómo Anthropic distingue
"agente" de "workflow" (ver `profundizacion_arquitectura_multiagente.md` §5): el paso de
verificación es, a propósito, la parte MENOS "agéntica" y MÁS determinista del sistema — es una
elección de diseño, no una limitación. Vale la pena decir esto explícitamente: "diseñamos el paso
más crítico para la confianza del usuario como el más predecible del sistema, no el más
inteligente".

## Fuentes consultadas

- [RAG Reranking: Improving Retrieval Quality with Cross-Encoders](https://bigdataboutique.com/blog/rag-reranking-improving-retrieval-quality-with-cross-encoders)
- [Reranking & Cross-Encoders for RAG: BGE, Cohere, Jina (2026)](https://localaimaster.com/blog/reranking-cross-encoders-guide)
- [Evaluating RAG Systems: Metrics and Groundedness](https://www.blockchain-council.org/ai/evaluating-rag-systems-metrics-groundedness-hallucination-reduction/)
- [Reranking for RAG: +40% Accuracy with Cross-Encoders (2025 Guide)](https://app.ailog.fr/en/blog/guides/reranking)
- [Built with LangGraph! #29: Reflection & Reflexion](https://medium.com/@okanyenigun/built-with-langgraph-29-reflection-reflexion-10cc1cf96f35)
- [Reflection Agents — LangChain Blog](https://www.langchain.com/blog/reflection-agents)
- [LangGraph Error Handling: Retries & Fallback Strategies](https://machinelearningplus.com/gen-ai/langgraph-error-handling-retries-fallback-strategies/)
- ⚠️ [Perplexity Citations UX: Source Chips & Trust Signals — AI UX Playground](https://aiuxplayground.com/teardowns/perplexity/citations/) — *blog de procedencia desconocida; fue la base del "94% / 7.1-8.2 fuentes" que se retiró. Inspiración de diseño, no evidencia.*
- ⚠️ [AI citation and source UI design patterns for 2026 — AYDesign](https://www.aydesign.ai/blog/ai-citation-source-ui-patterns-2026) — *ídem.*
- [Perplexity vs ChatGPT Search for Analysts Who Need Citations in 2026](https://dev.to/pickuma/perplexity-vs-chatgpt-search-for-analysts-who-need-citations-in-2026-274b)
- [AI Platform Citation Patterns — Profound](https://www.tryprofound.com/blog/ai-platform-citation-patterns) — *estudio con metodología publicada; es la fuente del ~17.9 fuentes/respuesta que contradice la cifra retirada.*

## Resumen (para el equipo)

Sí es viable usar el reranker `bge-reranker-v2-m3` ya disponible como scorer de grounding sin sumar
otro LLM — es la opción más barata y coherente con el patrón de arquitectura ya usado (modelos
chicos especializados), con la advertencia honesta de que mide relevancia temática, no fidelidad
factual perfecta. Método más barato y defendible encontrado: **reranker como filtro 1 + umbral
determinista + reintento acotado (máx. 3) vía patrón de validación de LangGraph**, con HHEM de
Vectara como segunda señal opcional — opcional por VRAM, no solo por tiempo. El patrón de UI de
citación (citas numeradas inline + tarjetas de fuente + badge de confianza) es el correcto y se
implementa tal cual, pero **describirlo cualitativamente**: las estadísticas de Perplexity que
traía la primera pasada (94% de respuestas con cita, 7.1-8.2 fuentes) **se retiraron por no ser
verificables** y no deben aparecer en el pitch.
