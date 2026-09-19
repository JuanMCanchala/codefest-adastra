# Profundización — Arquitectura multiagente (Reto 1)

Continuación de [`arquitectura_multiagente.md`](arquitectura_multiagente.md). Aquí solo lo que
cambia o se refuerza con evidencia verificada de septiembre 2026, no se repite lo ya escrito allí.

> **Re-auditoría (segunda pasada, sept. 2026)**: el estado de los frameworks (AutoGen en
> mantenimiento, Microsoft Agent Framework como sucesor) quedó confirmado contra fuente primaria.
> Se rebajaron a "no verificado" las cifras de adopción de LangGraph/CrewAI y las cifras exactas de
> BFCL v4, que venían de blogs comparativos sin metodología. Se añadieron dos restricciones reales
> del proyecto que faltaban: la forma exacta del campo `fenomeno` (§0) y la latencia del pipeline
> largo en la GPU disponible (§4).

## 0. El campo `fenomeno` existe — pero no como lo asume el diseño

Verificado directamente en el repo de la Etapa 1 (`ad-astra-retrieval`), que es la base sobre la
que se monta todo el enrutamiento por especialista:

- `src/schema.py` declara `fenomeno: int` con validación estricta: **solo acepta 1, 2 o 3**. No es
  una cadena de texto: el filtro de cada agente especialista compara enteros.
- `src/corpus_adl.py` lo deriva del inventario oficial (prefijo `F1`/`F2`/`F3`), y
  `scripts/build_index.py` cae a `fenomeno_from_path()` cuando un archivo no aparece en el
  inventario. **En ese camino de respaldo el valor puede quedar en `0`.**

**Implicación práctica para el orquestador**: el enrutamiento no puede asumir que todo fragmento
tiene fenómeno 1, 2 o 3. Hay que decidir qué hace el supervisor con los fragmentos de `fenomeno=0`
— lo razonable es que sean visibles para todos los especialistas en vez de quedar inalcanzables,
porque un fragmento sin clasificar sigue siendo evidencia válida. Si se filtra ciegamente por
`fenomeno == N`, esos documentos **desaparecen del asistente sin que nadie lo note**. Conviene
contar cuántos hay (`fenomeno == 0` en `metadata.jsonl`) antes de escribir el filtro.

## 1. Estado real de los frameworks (no la foto de hace un año)

| Framework | Estado sept. 2026 | Lectura para el equipo |
|---|---|---|
| **AutoGen** | Pasó a **modo mantenimiento en octubre 2025**: solo recibe parches de seguridad, sin features nuevas. Microsoft ya no lo recomienda para proyectos nuevos. | Descartado — no es una opción viable para empezar hoy. |
| **Microsoft Agent Framework** | Llegó a **1.0 GA el 2 de abril de 2026** (.NET y Python), fusiona las abstracciones de AutoGen con la infraestructura enterprise de Semantic Kernel, con soporte nativo de MCP. Sucesor oficial de AutoGen. | Viable pero con curva de adopción nueva (ecosistema .NET-first); no aporta ventaja sobre LangGraph para este plazo. |
| **LangGraph** | ⚠️ Cifras rebajadas en la re-auditoría. El "34% de las citas en documentos de arquitectura de producción en empresas de 1000+ empleados, Q1 2026" **no tiene fuente primaria**: sale de blogs comparativos de terceros (`pooya.blog`, `fast.io`), sin metodología publicada ni indicación de quién midió qué. El conteo de estrellas de GitHub (24 600 LangGraph vs 45 900 CrewAI) es volátil y, de hecho, **dice lo contrario** de la frase "superó a CrewAI". | La recomendación de usar LangGraph **sigue en pie**, pero hay que sostenerla con los argumentos técnicos de §2 y §3 (control explícito del flujo, checkpointing, streaming a Streamlit), **no con esas cifras**. Si un jurado pide la fuente del 34%, no la hay. |
| **CrewAI** | ⚠️ Ídem: "100 000+ desarrolladores certificados" y "450M+ workflows/mes" son **cifras de marketing reproducidas por blogs comparativos**, no verificadas contra una fuente primaria de CrewAI. | Sigue siendo la opción de prototipado más rápido si el equipo decide no usar LangGraph — eso es cualitativo y defendible; las cifras, no. |

**Conclusión: no cambia la recomendación.** LangGraph sigue siendo la opción correcta. Lo que sí
cambia tras la re-auditoría es **con qué se justifica**: el estado de AutoGen (mantenimiento desde
octubre de 2025) y de Microsoft Agent Framework (1.0 GA el 2 de abril de 2026, sucesor oficial)
**está confirmado contra fuentes primarias**; la supuesta ventaja de LangGraph "en adopción
enterprise" **no lo está**. El argumento defendible es el técnico: LangGraph da control explícito
del flujo, checkpointing y streaming, que es lo que necesita el agente verificador de citas
(§3 de `arquitectura_multiagente.md`). Presentarlo como "la opción que eligen las empresas grandes"
es exponerse a una pregunta sin respuesta.

## 2. Patrón concreto de implementación (Supervisor + agent-as-tool)

LangGraph documenta un primitivo de **Supervisor** con tres variantes de enrutamiento:

1. **Reglas deterministas** (si detecta palabra clave → fenómeno X).
2. **Enrutamiento juzgado por LLM** (el supervisor decide con su propio LLM a qué especialista ir).
3. **Enrutamiento por herramientas (tool-based)**: cada agente especialista se expone como una
   *tool* invocable, y el supervisor hace tool-calling sobre esas tools — este es el patrón que
   mapea 1:1 con "agente de analítica visual como herramienta invocada desde el orquestador del
   Reto 1" que exige el enunciado del Reto 2.

Esqueleto real (StateGraph, no pseudocódigo genérico):

```python
from langgraph.graph import StateGraph, MessagesState, END
from langgraph.prebuilt import create_react_agent

# Cada especialista es un agente ReAct con su propia tool de recuperación filtrada por fenómeno
especialista_ia_militar = create_react_agent(llm, tools=[retriever_tool_fenomeno1])
especialista_seguridad_espacial = create_react_agent(llm, tools=[retriever_tool_fenomeno2])
especialista_dinamicas_territoriales = create_react_agent(llm, tools=[retriever_tool_fenomeno3])
agente_analitica = create_react_agent(llm, tools=[catalogo_visualizaciones_tool])

def supervisor(state: MessagesState):
    # tool-based routing: el LLM del supervisor elige QUÉ especialista invocar como tool
    return llm_con_tools.invoke(state["messages"])

graph = StateGraph(MessagesState)
graph.add_node("supervisor", supervisor)
graph.add_node("fenomeno1", especialista_ia_militar)
graph.add_node("fenomeno2", especialista_seguridad_espacial)
graph.add_node("fenomeno3", especialista_dinamicas_territoriales)
graph.add_node("analitica", agente_analitica)
graph.add_node("verificador", verificador_citas)  # ver profundizacion_verificacion_citas.md
graph.add_conditional_edges("supervisor", enrutar_segun_tool_llamada)
graph.add_edge("fenomeno1", "verificador")  # y lo mismo para fenomeno2/3
graph.add_edge("verificador", END)
```

> **Aviso añadido en la re-auditoría**: este esqueleto es **ilustrativo y no se ejecutó**. Tres
> símbolos (`verificador_citas`, `enrutar_segun_tool_llamada`, `llm_con_tools`) no están definidos,
> falta el `graph.set_entry_point("supervisor")` y falta el `graph.compile()`. Además,
> `create_react_agent` ha cambiado de módulo entre versiones de LangGraph/LangChain — confirmar la
> ruta de importación contra la versión que el equipo instale, no contra este bloque. Sirve como
> mapa de la topología del grafo, no como código para pegar.

**Streaming a Streamlit** (patrón confirmado, no supuesto):

```python
with st.chat_message("assistant"):
    st.write_stream(
        chunk.content
        for chunk, metadata in graph.stream(
            {"messages": st.session_state.messages},
            stream_mode="messages",
        )
    )
```

`st.write_stream()` acepta cualquier generador y hace el efecto "máquina de escribir" nativo;
`stream_mode="messages"` es el modo de `.stream()` de LangGraph que emite chunks token a token del
LLM en ejecución, no el estado completo del grafo — es la combinación correcta para no tener que
escribir un puente de streaming custom.

## 3. Checkpointing / human-in-the-loop para el verificador de citas

LangGraph separa "pausar/reanudar" de "mutar estado" mediante `interrupt()` + un checkpointer
(`SqliteSaver` es suficiente para una demo, no hace falta Postgres). El patrón:

1. El nodo verificador llega a una afirmación sin respaldo suficiente → llama `interrupt()` con el
   detalle de la afirmación dudosa.
2. El estado se persiste con un `thread_id`.
3. Un humano (o, en la demo automática, una regla de fallback) aprueba/rechaza.
4. `graph.invoke(Command(resume=decision), config={"configurable": {"thread_id": ...}})` retoma
   exactamente desde ahí.

Útil no solo para demo con supervisión humana, sino como mecanismo de **reintento acotado**: el
patrón de "reflection/critic node" documentado en LangGraph usa un ciclo generador→crítico con un
tope de reintentos (3 es el número típico reportado) para evitar loops infinitos — aplicar esto en
el verificador de citas (generar respuesta → verificar grounding → si falla, regenerar con el error
exacto señalado, máximo 3 veces → si sigue fallando, responder "no se pudo verificar esta parte" en
vez de forzar una cita).

## 4. Riesgo concreto reportado: multi-turn y tool-calling se degradan con la profundidad del pipeline

El benchmark **BFCL v4** (abril 2026, líder actual Atria Dawn Preview con 0.770; brecha de solo
3-4 puntos porcentuales entre los mejores modelos cerrados y los mejores open-weight) documenta que
**los puntajes multi-turno caen 5-10 puntos porcentuales respecto a single-turn en todos los
modelos evaluados**, y que si un agente hace **5 o más llamadas a herramientas encadenadas**, el
error se compone (la precisión efectiva es menor que el puntaje multi-turno reportado).

> **Matiz de la re-auditoría**: las cifras concretas de este párrafo (0.770 del líder, la brecha de
> 3-4 p.p., la caída de 5-10 p.p. y el umbral exacto de "5 llamadas") provienen de un **blog
> secundario** (`spheron.network`), no del leaderboard oficial de BFCL ni de una publicación de los
> autores del benchmark. **El fenómeno cualitativo es sólido y bien conocido** —la precisión de
> tool-calling se degrada con la profundidad de la cadena— y ese es el argumento que hay que usar.
> Los números exactos **no deben decirse en el pitch** sin comprobarlos primero en el leaderboard
> vivo ([llm-stats.com/benchmarks/bfcl-v4](https://llm-stats.com/benchmarks/bfcl-v4)). Decir "los
> benchmarks de tool-calling muestran degradación consistente en cadenas largas, por eso acotamos
> los reintentos" es defendible; decir "caen exactamente 5-10 puntos" no lo es.

Esto es directamente relevante: el pipeline propuesto (supervisor → especialista → verificador →
posible reintento → analítica) puede llegar a 4-5 saltos de tool-calling en una sola consulta.
**Implicación práctica**: no asumir que el pipeline es tan confiable en el salto 5 como en el
salto 1 — el tope de reintentos del verificador (§3) no es solo para evitar loops, es también para
contener la degradación de precisión que el propio benchmark documenta.

**Segundo motivo, más urgente, que la primera pasada no consideró: la latencia en la demo en vivo.**
Con un LLM local de 7-10B en una RTX 4060 de 8 GB, cada salto del pipeline es una generación
completa. Un camino supervisor → especialista → verificador → reintento → analítica son **5
generaciones secuenciales** más la recuperación FAISS y el reranking. Ante un jurado, una respuesta
que tarda un minuto se percibe como un sistema roto aunque sea correcta. Recomendación práctica:
medir el tiempo del camino completo **antes** del pitch, y tener preparado un modo de demo con el
reintento desactivado (o con el LLM por API) si el camino local no baja de un tiempo presentable.
Esto conecta con la restricción de VRAM descrita en `profundizacion_llm_generativo.md` §1: no son
dos problemas, es el mismo.

## 5. ¿Y si no hay tiempo para un framework? — criterio para defender la arquitectura ante el jurado

Anthropic distingue explícitamente dos categorías (no son sinónimos, y el jurado técnico puede
preguntar la diferencia):

- **Workflow**: el código decide el flujo. Los pasos están predefinidos antes de tiempo de
  ejecución. Predecible, testeable paso a paso.
- **Agente**: el modelo dirige dinámicamente su propio proceso y uso de herramientas. El modelo
  decide el flujo en tiempo de ejecución. Flexible, pero más difícil de acotar.

El riesgo real del diseño propuesto (orquestador→especialistas→verificador→analítica) es que, tal
como está descrito, es técnicamente un **workflow** — cada paso está prefijado en el grafo. Para
poder llamarlo honestamente "sistema multiagente" ante un jurado técnico, hay que poder señalar
**dónde decide el modelo y no el código**:

1. El supervisor decide dinámicamente (vía tool-calling con LLM) a qué especialista(s) enrutar, no
   con reglas fijas de keyword-matching.
2. Cada especialista decide autónomamente qué y cuántas veces consultar el `Retriever` (no una sola
   llamada fija).
3. El verificador tiene autonomía real para rechazar/reintentar, no solo un chequeo cosmético.

Si alguno de estos tres puntos termina hardcodeado por falta de tiempo, es más honesto en el pitch
llamarlo "workflow con agentes de lenguaje en los nodos de decisión" que forzar la palabra "agente"
en los tres. La distinción workflow-vs-agente es justo el tipo de pregunta que un jurado técnico
(no solo de negocio) puede hacer, y responderla con este framework de Anthropic es más sólido que
una definición inventada sobre la marcha.

## Fuentes consultadas

**Primarias / verificadas:**

- [microsoft/autogen — GitHub](https://github.com/microsoft/autogen) — el propio README confirma el modo mantenimiento y redirige a Microsoft Agent Framework
- [LangChain vs. AutoGen in 2026: What the Maintenance Announcement Changed](https://www.langchain.com/resources/langchain-vs-autogen) — *nota: es material del propio proveedor de LangGraph, tratarlo como parte interesada*
- [Microsoft Agent Framework: the production-ready convergence of AutoGen and Semantic Kernel](https://cloudsummit.eu/blog/microsoft-agent-framework-production-ready-convergence-autogen-semantic-kernel)
- [Reviewing Microsoft Agent Framework — the AutoGen and Semantic Kernel successor](https://drel.ai/blog/microsoft-agent-framework-security-review)

**Secundarias (orientación, no citables como dato):**

- ⚠️ [LangGraph vs CrewAI vs AutoGen 2026: Benchmarks, Pricing — Pooya Golchian](https://pooya.blog/blog/crewai-vs-langgraph-autogen-comparison-2026/) — *origen del "34% de citas en arquitecturas enterprise"; sin metodología publicada*
- ⚠️ [LangGraph vs CrewAI: Honest Comparison for 2026 — Fastio](https://fast.io/resources/langgraph-vs-crewai/) — *ídem para las cifras de comunidad de CrewAI*
- ⚠️ [Microsoft Retires AutoGen — AgentMarketCap](https://agentmarketcap.ai/blog/2026/04/13/microsoft-autogen-maintenance-mode-agent-framework-sunset-2026) — *el hecho es correcto, pero el dominio no es una fuente primaria; citar el README de GitHub*
- ⚠️ [AI Agent Tool Calling Benchmarks: BFCL v4 — Spheron Blog](https://www.spheron.network/blog/tool-calling-benchmarks-bfcl-tau-bench-latency-optimization/) — *origen de todas las cifras exactas de BFCL v4 de §4; verificar contra el leaderboard antes de citarlas*

**Documentación de producto y tutoriales (para implementar, no para citar cifras):**

- [st.chat_message — Streamlit Docs](https://docs.streamlit.io/develop/api-reference/chat/st.chat_message)
- [Build a basic LLM chat app — Streamlit Docs](https://docs.streamlit.io/develop/tutorials/chat-and-llm-apps/build-conversational-apps)
- [Streaming in LangGraph — Tutorial 12, Medium](https://medium.com/@frextarr.552/streaming-in-langgraph-agentic-ai-using-langgraph-tutorial-12-f94ed5edcfee) — *tutorial personal; el patrón `st.write_stream` + `stream_mode="messages"` hay que confirmarlo contra la documentación oficial de LangGraph de la versión instalada antes de darlo por bueno*
- [Reflection Agents — LangChain Blog](https://www.langchain.com/blog/reflection-agents)
- [Built with LangGraph! #29: Reflection & Reflexion](https://medium.com/@okanyenigun/built-with-langgraph-29-reflection-reflexion-10cc1cf96f35)
- [LangGraph Error Handling: Retries & Fallback Strategies](https://machinelearningplus.com/gen-ai/langgraph-error-handling-retries-fallback-strategies/) — *el "tope de 3 reintentos" es una convención de estos tutoriales, no una constante derivada de una medición; es una elección razonable del equipo, no un hallazgo*
- [BFCL-V4 Leaderboard — llm-stats.com](https://llm-stats.com/benchmarks/bfcl-v4)

## Resumen (para el equipo, no repetido en el archivo)

Hallazgos que refuerzan la recomendación anterior sin cambiarla: (1) **AutoGen está descartado** por
estar en mantenimiento desde octubre de 2025, con Microsoft Agent Framework 1.0 GA (2 de abril de
2026) como sucesor oficial — **verificado contra fuente primaria**, es el hallazgo más sólido de
este documento; (2) LangGraph sigue siendo la elección correcta **por sus propiedades técnicas**
(control explícito del flujo, checkpointing, streaming con `st.write_stream` +
`stream_mode="messages"`), no por las cifras de adopción enterprise que traía la primera pasada y
que no tienen fuente primaria; (3) riesgo real: las cadenas largas de tool-calling degradan
precisión — el fenómeno es sólido aunque **las cifras exactas de BFCL v4 vengan de un blog
secundario** — así que el tope de reintentos del verificador debe existir por rendimiento, no solo
por elegancia de diseño; (4) **añadido en la re-auditoría**: el mismo pipeline largo es también un
problema de **latencia** con un LLM local en 8 GB de VRAM — medir el camino completo antes del
pitch y tener un modo de demo más corto preparado.
