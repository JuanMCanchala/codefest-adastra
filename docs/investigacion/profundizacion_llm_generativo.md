# Profundización — LLM generativo para el agente de síntesis (Reto 1)

Continuación de la investigación previa (recomendación base: Qwen3.5-9B local, Claude
Haiku/Sonnet/Opus por API). Aquí solo lo verificado o corregido con fuentes reales de septiembre
2026.

> **Re-auditoría (segunda pasada, sept. 2026)**: los precios de Claude y el hallazgo sobre ToS/ZDR
> quedaron confirmados. Se corrigieron tres cosas: la descripción del entrenamiento de Falcon3-10B
> (estaba sobrevendida), la afirmación de que el modelo "Fable" no existía (sí existe), y la
> ausencia total de un análisis de si los modelos **caben** en los 8 GB de VRAM disponibles, que es
> la restricción que de verdad decide esta elección.

## 1. ¿Sigue Qwen siendo la mejor opción local en 7-10B para ES/PT?

Verificado contra el [Qwen3 Technical Report](https://arxiv.org/abs/2505.09388) (arXiv:2505.09388):
Qwen3 se preentrenó con **36 billones de tokens en 119 idiomas** (frente a 29 en Qwen2.5),
Qwen3-14B-Base logra **81.05 en MMLU**. Esto confirma la base multilingüe amplia, pero **hay un
competidor directo que la investigación anterior no cubrió**:

**Falcon3-10B** (Technology Innovation Institute, EAU) — **soporta 4 idiomas: inglés, francés,
español y portugués** (no 119 idiomas genéricos), construido por escalado de profundidad desde
Falcon3-7B-Base. Según TII, es "el modelo más potente de su categoría" (<13B parámetros) en varios
benchmarks. Fuente: [tii.ae](https://www.tii.ae/news/falcon-3-uaes-technology-innovation-institute-launches-worlds-most-powerful-small-ai-models),
[Hugging Face](https://huggingface.co/tiiuae/Falcon3-10B-Base).

> **Corrección de la re-auditoría.** La primera pasada afirmaba que Falcon3-10B fue "entrenado en
> 14 billones de tokens **específicamente en 4 idiomas**". Eso mezcla dos hechos distintos y
> sobrevende el modelo:
> - Los **14 billones de tokens** son el corpus de la **familia Falcon3 completa**, compuesto
>   mayoritariamente por web, **código, y datos científicos/STEM en inglés** — no por un corpus
>   cuadrilingüe balanceado.
> - El **10B concretamente** se obtuvo por *depth up-scaling* del 7B más **2 billones de tokens**
>   adicionales de preentrenamiento continuado.
> - Los 4 idiomas son los que el modelo **declara soportar**, no los únicos en los que se entrenó.
>
> La conclusión "tiene ES/PT de primera clase" no está respaldada por lo que dice TII: lo
> respaldado es "los declara como soportados". Sigue siendo una razón válida para **probarlo**, no
> para darlo por ganador.

**Dos límites duros que la primera pasada no mencionó y que pesan mucho en este proyecto**:

1. **Contexto de 32K tokens** en Falcon3-10B. Un pipeline RAG que mete 10 fragmentos de hasta 250
   palabras más el historial de chat cabe, pero deja poco margen; Qwen3 declara contextos
   bastante mayores. Si el agente de síntesis tiene que razonar sobre muchos fragmentos de varios
   fenómenos a la vez, este es el límite que se toca primero.
2. **Falcon3 es una familia de diciembre de 2024**, una generación anterior a Qwen3 (mayo 2025).
   Presentarlo en el pitch "a la par" de un modelo de 2025-2026 es difícil de defender si el
   jurado conoce las fechas.

**Lectura corregida para el equipo**: Qwen3 apuesta a cobertura amplia; Falcon3-10B declara soporte
específico de ES/PT/EN/FR pero es más viejo y de contexto más corto. Falcon3-10B es un **candidato
de respaldo que vale la pena medir**, no un co-favorito — medir ambos contra las mismas preguntas
de prueba sigue siendo lo correcto ("medir, no adivinar"), pero si solo alcanza el tiempo para
probar uno, probar el Qwen.

**Restricción de hardware que condiciona todo lo anterior (coherencia con el resto del sistema)**:
la RTX 4060 Laptop tiene **8 GB de VRAM y no los tiene libres**. En esa misma GPU ya viven, en el
camino de recuperación de la Etapa 1, **BGE-M3** (denso + disperso) y **bge-reranker-v2-m3**, y el
grafo usa **GLiNER**. Un Falcon3-10B en Q4 ronda los 6-6.5 GB solo de pesos, sin contar KV cache.
Cargar los cuatro modelos simultáneamente **no cabe**. Antes de elegir modelo hay que decidir la
política de residencia en GPU (cargar/descargar por turno, mover el reranker a CPU, o servir el
LLM por API y dejar la GPU para recuperación). Este punto no estaba en ninguno de los documentos de
profundización y es el que puede tumbar la demo en vivo.

**No verificado — y es una contradicción abierta con la investigación base**: no se encontró una
versión "Qwen3.5" propiamente dicha en las fuentes consultadas (el Technical Report oficial es de
Qwen3, mayo 2025). Sin embargo, `INVESTIGACION_SISTEMA_MULTIAGENTE.md` (la investigación base del
equipo) afirma cosas muy concretas sobre ese modelo: "Qwen3.5-9B, ~6.6 GB en Q4, Apache 2.0, 262K
de contexto, atención híbrida", y menciona "Qwen3.5/3.6, 201 idiomas". **Ninguna de esas cifras se
pudo confirmar en esta re-auditoría.** El equipo tiene que resolver esto antes del pitch por una
razón práctica además de la de rigor: **el nombre exacto del modelo tiene que existir en el
registro de Ollama para poder descargarlo**. Verificarlo con `ollama pull <nombre>` es más rápido y
más concluyente que discutirlo — hacerlo antes de escribir el nombre en una diapositiva.

## 2. Tool-calling: BFCL v4 (confirma lo que reportó el LLM sobre benchmarks)

BFCL v4 (abril 2026) rediseñó el benchmark hacia evaluación agentic holística: Agentic (40%),
Multi-Turn (30%), Live (10%), Non-Live (10%), detección de alucinación (10%). Líder actual: **Atria
Dawn Preview** (Shanghai AI Lab) con 0.770. La brecha entre los mejores modelos cerrados y los
mejores open-weight se redujo a **3-4 puntos porcentuales** — un modelo self-hosted competitivo
(el reporte menciona Qwen2.5 72B o DeepSeek V3 como referencia, ambos demasiado grandes para 8GB)
ya no es una desventaja dramática frente a APIs cerradas en tareas de tool-calling puras. No hay
puntaje público específico de Qwen3.5-9B o Falcon3-10B en el leaderboard BFCL-v4 verificado en esta
investigación — **antes de decidir, revisar el leaderboard vivo en
[llm-stats.com/benchmarks/bfcl-v4](https://llm-stats.com/benchmarks/bfcl-v4)**, que se actualiza
mensualmente.

## 3. Precios Claude — corrección importante sobre la investigación anterior

**Corrección**: circulaba la expectativa de que Sonnet 5 subiría de $2/$10 a $3/$15 el 1 de
septiembre de 2026. **Eso no ocurrió.** Anthropic anunció el 11 de agosto de 2026 que el precio
introductorio de **Sonnet 5 ($2 entrada / $10 salida por millón de tokens) es permanente**.
Confirmado en `platform.claude.com/docs/en/about-claude/pricing`.

| Modelo | Precio (entrada/salida por MTok, sept. 2026) |
|---|---|
| Claude Haiku 4.5 | $1 / $5 |
| **Claude Sonnet 5** | **$2 / $10 (permanente, no $3/$15)** |
| Claude Opus 5 | $5 / $25 |
| Claude Fable 5.1 | $10 / $50 (lecturas de caché $0.25/MTok) |

> **Corrección de la re-auditoría**: la primera pasada decía que "no se pudo confirmar un modelo
> Fable". **Sí existe**: Claude Fable (y Fable 5.1) es un modelo publicado de Anthropic, a
> **$10 entrada / $50 salida por millón de tokens**, con lecturas de caché a $0.25/MTok desde la
> 5.1. Es el modelo más caro de la línea y **no tiene sentido para este proyecto** — se anota solo
> para que la tabla de precios no tenga un hueco que el jurado pueda señalar.

**Matiz de costo que la primera pasada pasó por alto**: Sonnet 5 usa el tokenizador introducido con
Opus 4.7, y **el mismo texto produce ~30% más tokens** que con modelos anteriores. Es decir, el
precio por token quedó fijo en $2/$10, pero el **costo por documento** sube respecto a una
estimación hecha con el conteo de tokens de modelos viejos. La conclusión "el presupuesto de API es
más barato de lo proyectado" es correcta pero **menos generosa de lo que sugería la primera
pasada**: presupuestar con un colchón del 30% en el conteo de tokens.

## 4. Motor de inferencia local: Ollama sigue siendo razonable, sin hallazgo que lo desplace

No se encontró evidencia en esta pasada de que Ollama haya perdido su posición como opción de menor
fricción para servir un modelo 7-10B en 8GB VRAM. Se mantiene la recomendación original sin cambios
(Ollama para velocidad de setup, llama.cpp como respaldo si hace falta exprimir más rendimiento).

## 5. Riesgo ToS/legal por tema de defensa — hallazgo tranquilizador, con matices

Verificado en la documentación oficial de Anthropic
([platform.claude.com/docs/en/manage-claude/api-and-data-retention](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention),
[Anthropic Privacy Center](https://privacy.claude.com/en/articles/8956058-i-have-a-zero-data-retention-agreement-with-anthropic-what-products-does-it-apply-to)):

- Los **Términos Comerciales de Servicio de Anthropic (vigentes desde el 17 de junio de 2025)**
  establecen que Anthropic **no entrena modelos con el contenido de los clientes** en la API
  comercial, por defecto.
- Las entradas/salidas de la API se **borran automáticamente a los 30 días**, salvo excepciones
  (funciones de retención más larga que el cliente activa explícitamente, acuerdos de retención
  cero de datos, cumplimiento legal, o contenido marcado por los sistemas de seguridad — este
  último puede retenerse hasta 2 años).
- Existe la opción de **acuerdo de retención cero de datos (ZDR)**, gestionada por ventas (no
  autoservicio), donde ni siquiera se almacenan las entradas/salidas más allá de lo necesario para
  procesarlas.

**No se encontró en esta búsqueda ninguna cláusula específica de Anthropic, OpenAI o Google que
prohíba explícitamente el uso militar/defensa de sus APIs para un prototipo académico/hackathon.**
Esto no es lo mismo que "está garantizado que no hay restricción" — es "no se encontró restricción
explícita en las fuentes consultadas"; si el equipo tiene acceso a un asesor legal o al tutor del
ejército, la pregunta 2 de la sección "Preguntas clave" de la investigación original sigue siendo
válida y debería hacerse antes de comprometerse 100% a la vía API.

**Recomendación práctica sin esperar la respuesta**: dado que el ZDR y el no-entrenamiento por
defecto ya cubren la preocupación de "que un dato sensible termine en un modelo de otra persona",
el riesgo real residual es más de **percepción ante el jurado** ("¿por qué mandan datos de defensa
a una nube externa?") que legal. La recomendación de la investigación original de poder demostrar
el camino 100% local (Qwen3.5-9B / Falcon3-10B vía Ollama) como respaldo sigue siendo válida y
ahora tiene más peso argumental: no es solo resiliencia técnica, es la respuesta directa a esa
pregunta de percepción.

## 6. QA extractivo multilingüe (Escenario B) — sin hallazgo de reemplazo

No se realizó una verificación específica de checkpoints más nuevos que `xlm-roberta-large-squad2`
en esta pasada (búsqueda no ejecutada por límite de alcance); tratar como pendiente si el Escenario
B (decoders prohibidos) se vuelve relevante.

## Fuentes consultadas

- [Qwen3 Technical Report (arXiv:2505.09388)](https://arxiv.org/abs/2505.09388)
- [Falcon 3 — Technology Innovation Institute](https://www.tii.ae/news/falcon-3-uaes-technology-innovation-institute-launches-worlds-most-powerful-small-ai-models)
- [tiiuae/Falcon3-10B-Instruct — Hugging Face](https://huggingface.co/tiiuae/Falcon3-10B-Instruct)
- [Falcon3-10B: Specifications and GPU VRAM Requirements](https://apxml.com/models/falcon3-10b)
- [BFCL-V4 Leaderboard](https://llm-stats.com/benchmarks/bfcl-v4)
- [AI Agent Tool Calling Benchmarks: BFCL v4 — Spheron Blog](https://www.spheron.network/blog/tool-calling-benchmarks-bfcl-tau-bench-latency-optimization/)
- [Sonnet 5 Price Increase Cancelled: $2/$10 Stays — TokenCost](https://tokencost.app/blog/claude-sonnet-5-price-increase-september-2026)
- [Claude Sonnet 5 Pricing Locked at $2/$10 — explainx.ai](https://www.explainx.ai/blog/anthropic-sonnet-5-permanent-pricing-august-2026)
- [Pricing — Claude Platform Docs](https://platform.claude.com/docs/en/about-claude/pricing)
- [API and data retention — Claude Platform Docs](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention)
- [Zero data retention agreement — Anthropic Privacy Center](https://privacy.claude.com/en/articles/8956058-i-have-a-zero-data-retention-agreement-with-anthropic-what-products-does-it-apply-to)

## Resumen (para el equipo)

No cambia la recomendación de fondo, pero la matiza: (1) **Falcon3-10B** entra como candidato local
de **respaldo medible**, no como co-favorito: declara soporte de ES/PT/EN/FR, pero es de diciembre
de 2024, tiene 32K de contexto, y su corpus de 14 B de tokens es de la familia completa y
mayoritariamente inglés/código/STEM, no un entrenamiento cuadrilingüe dedicado; (2) **corrección de
precio importante**: Sonnet 5 quedó permanente en $2/$10 y la subida a $3/$15 fue cancelada — pero
su tokenizador produce ~30% más tokens para el mismo texto, así que presupuestar con ese colchón;
Fable **sí existe** ($10/$50) y simplemente no aplica acá; (3) no hay bandera roja de ToS encontrada
para usar APIs de Anthropic en un prototipo de hackathon con temática de defensa (ZDR disponible,
no-entrenamiento por defecto), pero eso no responde la pregunta de percepción ante el jurado —
seguir preparando el camino 100% local como argumento de resiliencia/soberanía del dato, no solo
como plan B técnico; (4) **el cuello de botella real no es qué modelo, es dónde cabe**: 8 GB de
VRAM compartidos entre BGE-M3, bge-reranker-v2-m3, GLiNER y el LLM generativo no alcanzan para
todos a la vez — decidir la política de residencia en GPU es más urgente que decidir entre Qwen y
Falcon; (5) sigue sin confirmarse que "Qwen3.5-9B" exista con ese nombre exacto — comprobarlo con
`ollama pull` antes de ponerlo en una diapositiva.
