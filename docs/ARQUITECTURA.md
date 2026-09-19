# Arquitectura — Equipo AeroCode

**CODEFEST AD ASTRA 2026, Etapa 2.** Documento de arquitectura y justificación de diseño
(§2.5 bloque D del Reto 1; §3.4 bloque A del Reto 2).

---

## 1. El problema

Tres fenómenos —IA y capacidades estratégicas en defensa (F1), seguridad del entorno
espacial (F2) y dinámicas territoriales en América Latina (F3)— con un corpus de **1.825
documentos** en tres idiomas y varios formatos. El analista no puede leerlos: necesita
**preguntar en lenguaje natural y recibir respuestas que pueda verificar**, y necesita
**ver** la estructura del corpus para encontrar lo que no sabía que buscaba.

La solución son dos productos sobre una misma base de conocimiento:

| Reto | Producto | Qué resuelve |
| --- | --- | --- |
| 1 | Asistente multiagente con GUI | Preguntas en lenguaje natural, respondidas **solo** con evidencia del corpus y citadas fragmento a fragmento |
| 2 | Tablero de analítica visual | Exploración visual del corpus, con el componente correcto activado por instrucción en lenguaje natural |

**La restricción que define todo el diseño:** cada cifra mostrada, en el chat y en el
tablero, tiene que poder abrirse en el fragmento exacto que la sustenta (`doc_id` +
`chunk_id`). No hay puntajes calculados ni datos simulados en ninguna parte.

---

## 2. Vista general

Tres contenedores, un puerto HTTP cada uno, desplegados en Coolify con build pack
Dockerfile (Anexo A.4).

```
┌──────────────────┐        ┌──────────────────────────────────────┐
│  frontagent      │ POST   │  agent                               │
│  Next.js         ├───────►│  FastAPI · LangGraph                 │
│  chat + evidencia│ /chat  │  orquestador → corpus → visualización│
└──────────────────┘        │         │                            │
                            │         ▼                            │
┌──────────────────┐        │  Base vectorial Etapa 1              │
│  dashboard       │ POST   │  BGE-M3 (denso+disperso) → FAISS     │
│  API + SPA React ├───────►│  → RRF → reranker → 6 fragmentos     │
│  8 componentes   │/visua… │  90.613 fragmentos · 1.825 documentos│
└────────┬─────────┘        └──────────────────┬───────────────────┘
         │                                     │
         ▼                                     ▼
   dashboard.db (SQLite, 34,5 MB)        Amazon Bedrock
   conteos trazables a doc_id/chunk_id   (vía gateway de ADL)
```

El tablero **no** habla con los modelos: le pide la especificación del gráfico al agente y
calcula los datos contra su propia base. Así el gasto de tokens ocurre en un solo sitio y
el tablero sigue funcionando aunque el gateway falle.

---

## 3. Reto 1 · El sistema multiagente

### 3.1 Los agentes

| Agente | Modelo | Proveedor | Cuándo se invoca | Herramientas |
| --- | --- | --- | --- | --- |
| `orquestador` | `qwen3-next-80b` | Qwen | Siempre | `filtro_seguridad` (determinista) |
| `agente_corpus` | `llama-3.3-70b-instruct` | Meta | En toda ruta que responda con contenido | `buscar_corpus` |
| `agente_visualizacion` | `qwen3-next-80b` | Qwen | Cuando se pide un gráfico | `seleccionar_componente` |
| `agente_satelital` *(4.º, opcional)* | `qwen3-next-80b` | Qwen | Preguntas sobre huella minera y cobertura boscosa, **solo si hay detecciones ELDOR en disco** | `medir_cobertura_eldor` |

El cuarto agente es el «análisis aumentado» que la especificación premia (§1.2): mide
minería ilegal y bosque primario sobre imágenes segmentadas con ELDOR. Su evidencia no son
fragmentos de texto sino áreas, y **la procedencia cumple el mismo papel que
`doc_id`/`chunk_id`**: sitio, CRS, *bbox*, fecha de vuelo y *checkpoint* del modelo. Las
cifras se calculan fuera de línea; el agente solo las lee y las redacta, y entran a
`retrieval_context` para que la fidelidad se mida contra ellas. Si no hay detecciones, el
grafo no lo enruta y la pregunta cae al corpus.

El flujo:

```
pregunta
  └─ guarda (0 llamadas al modelo)
       ├─ inyección detectada → rechazo cortés
       └─ ok → orquestador ─── fuera de alcance → respuesta de alcance
                    │
                    └─ corpus/visualización/ambos
                         └─ agente_corpus ── si se pidió gráfico → agente_visualizacion
```

**Ruta típica: dos llamadas al modelo.** Un intento de inyección se rechaza con cero. El
agente de corpus se abstiene sin llamar al redactor cuando la búsqueda no devuelve nada.

### 3.2 Por qué esta topología y no otra

Es la decisión de diseño más importante del documento, y va contra la intuición de que
«más agentes es mejor arquitectura».

- **Orquestador central con especialistas, sin debate.** Kim et al. (2025) miden 260
  configuraciones multiagente y encuentran desde +80,8 % hasta **−70,0 %** según la tarea,
  y que **las arquitecturas sin verificación central propagan más errores**. Cemri et al.
  (MAST, NeurIPS 2025) catalogan 14 modos de fallo sobre más de 1.600 trazas. Wang et al.
  (ACL 2024) muestran que un solo agente bien instruido casi iguala al mejor debate
  multiagente. Poner agentes a discutir añadiría llamadas —que la rúbrica penaliza— sin
  evidencia de que mejore la respuesta.
- **Especialistas como roles del mismo flujo, inspirados en MA-RAG** (Nguyen et al.,
  2025): planificador/enrutador, recuperador determinista, redactor con citas. El
  recuperador **no usa ningún modelo generativo**: es búsqueda híbrida y reranking.
- **Invocación bajo demanda, no en cascada fija** (Adaptive-RAG, Jeong et al., NAACL
  2024): el agente de visualización solo entra si la solicitud pide un gráfico.

**La tensión que resolvimos explícitamente:** la especificación da puntos por agentes
adicionales (§1.2) pero la eficiencia se puntúa contra los demás equipos (§2.5.2). Por eso
las capas que añadimos —el filtro de inyección y el clasificador— **no consumen tokens**:
son deterministas o modelos encoder pequeños dentro del contenedor.

### 3.3 Elección de modelos

Partimos de un estudio propio de los ocho modelos disponibles
([`benchmarks_modelos_bedrock.md`](investigacion/03_arquitectura/benchmarks_modelos_bedrock.md)),
con precios oficiales de AWS, velocidad medida por Artificial Analysis sobre el endpoint de
Bedrock, y alucinación del Vectara Hallucination Leaderboard.

| Rol | Modelo | Por qué |
| --- | --- | --- |
| Redactor (`agente_corpus`) | **Llama 3.3 70B** | Es el **único estable en las dos versiones** del leaderboard de Vectara (4,0 % con HHEM‑2.1 y 4,1 % con HHEM‑2.3). gpt-oss-120b pasó de 2,4 % a 14,2 % entre versiones: su fidelidad depende demasiado del tipo de documento. IFEval 92,1 y español soportado oficialmente. No emite tokens de razonamiento |
| Orquestador y visualización | **Qwen3-Next-80B-A3B Instruct** | Clasificó bien y fue el más rápido en nuestra medición (1,1 s) **sin tokens de razonamiento**, y admite salidas estructuradas para garantizar el JSON |
| Descartados | Mixtral 8x7B, DeepSeek-R1-Distill, gpt-oss-20b | Alucinación del 20,1 % y sin tool calling (Mixtral); no es serverless y razona siempre (R1-Distill); TTFT de 45–58 s en Bedrock y la peor defensa ante inyección (gpt-oss-20b) |

**El presupuesto no fue el criterio.** Con la combinación elegida, la bolsa de USD 100 da
para decenas de miles de preguntas. Lo que importa es la puntuación de eficiencia, así que
el criterio real fue **evitar tokens de razonamiento y llamadas innecesarias**, no el
precio por token.

### 3.4 Recuperación

Heredada y endurecida desde la Etapa 1. Es determinista: **ningún modelo generativo
participa en decidir qué fragmentos se recuperan.**

```
consulta
  └─ BGE-M3, UNA pasada → vector denso + pesos léxicos
       ├─ denso → FAISS (top 100)
       └─ disperso → índice léxico (top 100)
            └─ fusión RRF → reranker cross-encoder (40 candidatos)
                 └─ 6 fragmentos con doc_id y chunk_id
```

- **Híbrida denso + disperso.** El vector denso diluye siglas y nombres propios
  («RPO», «FACSAT», «Resolute Sentinel»); la señal léxica los recupera. Se fusionan con RRF.
- **Reranker `mmarco-mMiniLMv2-L12-H384`** (118 M, multilingüe). Sustituyó a
  `bge-reranker-v2-m3` (568 M), que consumía el **95–97,5 %** de la latencia de búsqueda.
- **Una sola pasada del encoder.** BGE-M3 produce el vector denso y los pesos léxicos en el
  mismo *forward*; pedirlos por separado pasaba la consulta dos veces por un modelo de
  568 M.
- **El grafo está apagado en la recuperación.** Xiang et al. (2025) muestran que GraphRAG
  rinde **por debajo** del RAG clásico en preguntas factuales simples, que son 31 de las 50
  del jurado. El grafo aporta donde sí sirve: la red de entidades del tablero.

Mediciones propias sobre la base real (90.613 fragmentos, CPU, sin GPU como en el
contenedor):

| Cambio | Antes | Después | Verificación |
| --- | --- | --- | --- |
| Reranker ligero | 16.599 ms | **1.400 ms (12×)** | acierto@6 igual o mejor que el modelo grande sobre las 50 preguntas etiquetadas |
| Codificar la consulta una vez | 330 ms | **155 ms** | Vector denso **bit a bit idéntico**; orden fusionado idéntico en 20/20 consultas |
| Índice de metadata cacheado | 11,7 ms por consulta | **0** | Fragmentos idénticos en 20/20 |
| Top‑3 de documentos desactivado | 2,6 ms por consulta | **0** | El agente solo consume fragmentos |

**Búsqueda completa: de 25–29 s a ~1,6–2,1 s.**

### 3.5 Fidelidad y abstención

La fidelidad al contexto recuperado pesa el 30 % del bloque de Calidad. Tres medidas:

1. **Citas obligatorias por fragmento** (ALCE, Gao et al., EMNLP 2023): el redactor recibe
   6 fragmentos numerados y debe citar cada afirmación con `[n]`. Esos mismos fragmentos
   son los que se devuelven en `evaluacion.retrieval_context`.
2. **Abstención explícita sin llamar al modelo.** Si la búsqueda no devuelve fragmentos, el
   sistema responde que no encontró evidencia suficiente y **no invoca al redactor**. Joren
   et al. (2024) muestran que la generación selectiva mejora entre 2 y 10 % la fracción de
   respuestas correctas.
3. **Toda ruta que responda con contenido pasa por el corpus**, incluidas las peticiones de
   gráfico. La fidelidad no se puede medir contra un contexto vacío, y una pregunta de
   corpus mal enrutada se perdería entera. La especificación del gráfico viaja en
   `extras.visualizacion`, **no dentro de `respuesta`**: meter ahí una frase como «preparé
   el mapa» introduciría en `actual_output` una afirmación que el contexto recuperado no
   sustenta.

Cuando dos fuentes dan cifras distintas, el prompt obliga a mostrar **ambas con su cita**,
en vez de elegir una.

### 3.6 Seguridad: la decisión de diseño

El detalle operativo está en
[`ARQUITECTURA_DESPLIEGUE_SEGURIDAD.md`](ARQUITECTURA_DESPLIEGUE_SEGURIDAD.md) §3. Aquí
solo la decisión que afecta a la arquitectura: **ninguna capa de defensa gasta tokens.**
Son patrones deterministas, un clasificador encoder pequeño dentro del contenedor,
separación explícita entre instrucciones y datos, y saneo de la salida. Descartamos un
guardarraíl con un LLM juez **por diseño**: añadiría una llamada al modelo en cada
pregunta, y la eficiencia se puntúa contra los demás equipos.

La segunda decisión es que **el falso positivo importa tanto como el ataque**: una pregunta
legítima bloqueada cuenta como respuesta irrelevante y sin fidelidad, y la Calidad pesa el
doble que la Seguridad. Por eso cada patrón exige contexto en vez de una palabra suelta, y
por eso medimos los falsos positivos contra las 50 preguntas oficiales (0) antes que la
tasa de detección.

### 3.7 Contrato y eficiencia

`POST /chat` devuelve los tres bloques de la §2.4: `respuesta`, `evaluacion`
(`input`, `actual_output`, `retrieval_context[]`, `tools_called[]`) y `metadata`
(`num_interacciones`, `agentes_invocados`, `tokens`, `tokens_por_agente[]`, `latencia_ms`,
`estado`).

- **`tokens.total` suma todos los modelos invocados**, no solo el orquestador, como exige
  la especificación. Los tokens son los que reporta el proveedor, no estimaciones.
- **Contexto corto:** 6 fragmentos. Prompts de sistema deliberadamente breves.
- **`max_tokens` acotado por agente:** 160 para el enrutado, 220 para la especificación del
  gráfico.
- **Tope de gasto** por proceso, para proteger la bolsa de USD 100.
- **Caché de recuperación**: preguntas repetidas no repiten la búsqueda.
- El frontend propio pide `"incluir_extras": true` y recibe citas y visualización; **la
  evaluación automática recibe el contrato exacto**, sin campos añadidos.

---

## 4. Reto 2 · El tablero

### 4.1 De dónde salen los datos

`dashboard.db` (SQLite, 34,5 MB) se construye desde el corpus real y los archivos
originales de ADL. **Todas las variables son conteos, frecuencias o agregaciones de campos
existentes. No se estima ni se puntúa nada** (Anexo B.2.5).

| Tabla | Filas | Origen |
| --- | --- | --- |
| `documentos` | 1.825 | 459 de F1, 478 de F2, 888 de F3 |
| `fragmentos` | 90.613 | Tabla puente de toda la trazabilidad |
| `entidades` / `menciones` | 26.961 / 190.445 | Grafo GLiNER de la Etapa 1 |
| `relaciones` | 97.182 | Aristas con su `doc_id` y `chunk_id` |
| `menciones_pais` | 17.351 | Entidades de tipo país normalizadas a ISO3 |
| `alertas` | 1.082 | Fichas de la Defensoría del Pueblo, una fila por alerta × municipio |
| `amazonia` | 1.409 | CSV georreferenciado de Amazon Underworld |
| `sql_documentos` / `sql_entidades` | 19 / 157 | Base SQL de ADL para F2 |

Cada fila de las tablas analíticas lleva `doc_id` y `chunk_id`, y una prueba automática
verifica que ambos existan y **coincidan entre sí**.

### 4.2 Ejecución dinámica: catálogo cerrado

El experto escribe una instrucción; el agente devuelve una especificación; el backend la
ejecuta contra la base. El agente **solo puede elegir de un catálogo cerrado de ocho
componentes** y rellenar sus filtros: no genera SQL ni código.

Tres decisiones que hacen que esto funcione con preguntas que nadie escribió antes:

1. **Vocabularios cerrados en el prompt.** El agente recibe los valores admitidos de cada
   filtro enumerable, así que devuelve `economia: "Minería ilegal"` y no una invención.
2. **Resolución de filtros en el servidor.** Los valores abiertos se resuelven contra el
   vocabulario real, sin distinguir mayúsculas ni tildes y admitiendo coincidencia parcial:
   `"FARC"` → `farc`, `"Chocó"` → `chocó`, `"mineria"` → `Minería ilegal`. Sin esto, **todo
   nombre propio escrito como lo escribe una persona devolvía un gráfico vacío**, porque el
   grafo guarda las entidades en minúscula y SQLite compara distinguiendo mayúsculas.
3. **Un componente nunca sale vacío por un filtro inexistente.** Si el valor no se parece a
   ninguno de la base, el filtro se descarta, se informa en `filtros_ignorados` y se
   responde con los datos sin ese filtro. Un gráfico en blanco es indistinguible de un
   fallo para quien lo mira.

### 4.3 Propuesta de diseño por fenómeno

El tipo de gráfico corresponde a la **tarea analítica**, no a lo llamativo que sea
(Anexo B.2.2). Las 50 preguntas del jurado se reparten en 16 de F1, 16 de F2 y 18 de F3, y
por tipo: 31 factuales, 7 prospectivas, 6 de tendencia, 4 de recomendación y 2
comparativas.

#### F1 · IA y capacidades estratégicas (459 documentos)

Las preguntas son sobre **actores, tecnologías y sus relaciones**: quién desarrolla qué,
qué barreras hay, de qué depende la cadena de suministro.

| Pregunta analítica | Tarea | Componente | Por qué |
| --- | --- | --- | --- |
| ¿Qué actores, tecnologías y capacidades aparecen conectados? | Relación | `red_entidades` | La pregunta es sobre vínculos, no sobre magnitudes. El grafo los tiene explícitos, con evidencia por arista |
| ¿Qué organización documenta qué tecnología? | Comparación | `matriz_calor` (entidad × organización) | Un cruce de dos categóricas es una matriz, no un mapa |
| ¿Cómo evoluciona la atención sobre una tecnología? | Tendencia | `linea_tiempo` | Con reaparición de entidades, para ver cuándo vuelve un tema |
| ¿De qué se compone la evidencia disponible? | Composición | `composicion_corpus` | Honestidad sobre la base: qué fuentes y formatos sostienen F1 |
| ¿En qué texto exacto se apoya esto? | Detalle | `panel_evidencia` | Acceso al fragmento original (B.6.2) |

#### F2 · Seguridad del entorno espacial (478 documentos)

Las preguntas son **comparativas entre Estados** y sobre **eventos en el tiempo**:
capacidades antisatélite, maniobras, incidentes.

| Pregunta analítica | Tarea | Componente | Por qué |
| --- | --- | --- | --- |
| ¿Qué países concentran las menciones de capacidades contraespaciales? | Espacial | `mapa_mundo` | La unidad de análisis es el país: el mapa es la codificación natural |
| ¿Qué país aparece con qué tipo de capacidad? | Comparación | `matriz_calor` (país × documento) | Conteo de menciones, sin ponderar ni puntuar |
| ¿Cómo se distribuyen en el tiempo las pruebas e incidentes mencionados? | Tendencia | `linea_tiempo` | Declarando la cobertura de fechas (ver limitaciones) |
| ¿Qué actores y sistemas aparecen juntos? | Relación | `red_entidades` | Vincula operadores, satélites y programas |
| ¿Qué dice la base curada de ADL? | Detalle | `panel_evidencia` | `sql_entidades` aporta 157 pares entidad-documento revisados |

#### F3 · Dinámicas territoriales (888 documentos)

Es el fenómeno **con más documentos y el único con geografía fina**: las alertas tempranas
traen municipio y código DIVIPOLA.

| Pregunta analítica | Tarea | Componente | Por qué |
| --- | --- | --- | --- |
| ¿Dónde se concentran las alertas tempranas? | Espacial | `mapa_colombia` | Coropleta por departamento o municipio, con capas por economía ilícita y agregación según el zoom (B.4.2) |
| ¿Qué territorios priorizar? | Comparación bivariada | `cuadrante_priorizacion` | **Intensidad = conteo total; tendencia = variación del conteo.** Sin índice compuesto: B.2.5 prohíbe los puntajes de riesgo inventados |
| ¿Qué grupos armados operan en qué territorios? | Relación | `red_entidades` | El control territorial es una red, no una tabla |
| ¿Cómo evolucionan las alertas por año? | Tendencia | `linea_tiempo` | Solo con `fecha IS NOT NULL` y declarando cobertura |
| ¿Qué dice la alerta original? | Detalle | `panel_evidencia` | La ficha de la Defensoría es la fuente |

#### Coordinación entre vistas (B.6.3)

- **Filtros globales** por fenómeno y rango de fechas, aplicados a todas las vistas.
- ***Brushing and linking***: seleccionar una entidad, un país o un municipio en una vista
  la resalta en las demás.
- **Panel de evidencia siempre a un clic**: cualquier dato clicable lleva sus `refs` con
  hasta 20 pares `doc_id`/`chunk_id`.
- **Accesibilidad**: paleta apta para daltonismo, leyendas con unidades, zonas con nombre y
  acceso por teclado a la evidencia.

---

## 5. Despliegue

El detalle está en
[`ARQUITECTURA_DESPLIEGUE_SEGURIDAD.md`](ARQUITECTURA_DESPLIEGUE_SEGURIDAD.md) §2. Lo que
condiciona la arquitectura:

| Recurso | Dominio | Puerto |
| --- | --- | --- |
| `agent` | `agent.aerocode.codefest2026.augusta.avaldigitallabs.com` | 8000 |
| `frontagent` | `frontagent.aerocode…` | 3000 |
| `dashboard` | `dashboard.aerocode…` | 8080 |

- **Un puerto HTTP por contenedor** (Anexo A.4). El tablero sirve su API y su SPA desde el
  mismo proceso, por eso es un solo contenedor y no dos.
- **Healthcheck que refleja el estado real:** `/health` responde 503 mientras la base
  vectorial carga, para que Coolify no enrute tráfico a un contenedor que aún no puede
  responder. `POST /chat` sí espera a que termine la carga, porque un 503 contaría como
  respuesta fallida en la evaluación.
- **Los modelos van dentro de la imagen**, descargados en la construcción: durante la
  ventana de evaluación el arranque no depende de la red de Hugging Face.
- **Ningún secreto en el repositorio ni en la imagen.** Un token de acceso restringido
  nunca se pasa como `ARG` ni como `ENV`, porque quedaría registrado en `docker history`.
- **Análisis estático en CI**, en cuatro trabajos paralelos: `agent` (ruff, bandit,
  pytest), `dashboard/api` (ruff, bandit, pytest contra la base real), `dashboard/datos`
  (ruff) y los dos frontends (eslint). Pesa el 25 % del bloque de Seguridad del Reto 1 y
  el 5 % del Reto 2, así que cubre los cuatro paquetes y no solo el agente.

---

## 6. Decisiones que descartamos, y por qué

Documentarlas importa tanto como las que tomamos: son las que un jurado esperaría ver.

| Descartado | Motivo |
| --- | --- |
| Debate multiagente | Wang et al. (ACL 2024) y Smit et al. (2023): no supera de forma fiable a un agente bien instruido, y cada ronda resta eficiencia |
| RAG multipaso (IRCoT) por defecto | 2–4 llamadas extra al modelo. 31 de las 50 preguntas son factuales de un salto |
| GraphRAG completo | Rinde por debajo del RAG clásico en preguntas factuales simples (Xiang et al., 2025) y el indexado con LLM no cabía en el tiempo |
| Modelo local | La especificación exige los modelos de Bedrock (§1.3) |
| Llama Prompt Guard 2 como filtro activo | Medido: detecta 8/24 ataques difíciles frente a 15/24 del clasificador abierto |
| Bedrock Guardrails | Añade latencia de red en el bloque que ya se puntúa contra otros equipos |
| APIs externas en vivo (GDELT, UCDP, ACLED) | §3.3: el tablero solo puede mostrar datos del corpus y de la base SQL, trazables |
| Índice municipal de riesgo | B.2.5 prohíbe los índices de riesgo inventados. Se reemplazó por conteos y variación de conteos |

---

## 7. Limitaciones conocidas

Las declaramos nosotros antes de que las encuentre un evaluador.

- **Fechas.** 1.277 de 1.825 documentos (70,0 %) no tienen fecha completa y 980 (53,7 %) no
  tienen ni año, porque la mayoría de los PDF no la exponen. Por fenómeno: F1 tiene 0 de
  459 con fecha completa, F2 158 de 478, F3 390 de 888. **Las series de tiempo solo se usan
  con el filtro de fecha no nula y declarando la cobertura.**
- **Países.** 232 de 528 nodos de tipo país no reciben ISO3: ruido de extracción
  («country», «países en desarrollo»), entidades históricas (URSS) y microestados que la
  geometría de Natural Earth 110m no incluye.
- **Grafo.** El atributo `chunks` de cada nodo está truncado a 21 fragmentos, así que el
  conteo de fragmentos por entidad es **un piso, no el total**.
- **Municipios.** 1 de 1.082 filas de alertas no empareja con DIVIPOLA («Santa Cruz de
  Mompox», que el DANE escribe «Mompós»).
- **Base SQL de ADL.** Cubre 19 de los 478 documentos de F2.
- **La calidad de recuperación no está medida con etiquetas verificadas.** Las
  comparaciones entre configuraciones usan los `doc_id` que asignamos a las 50 preguntas
  por título y colección, que sirven para comparar configuraciones entre sí pero no como
  medida absoluta. Con 50 consultas, diferencias de 2 o 3 preguntas están dentro del ruido.

---

## 8. Resumen

> Tres agentes que se invocan **solo cuando hacen falta**, y dos capas de defensa que **no
> consumen ni un token**. Elegimos no poner agentes a debatir porque las 260
> configuraciones medidas por Kim et al. muestran que, sin verificación central, los
> sistemas multiagente propagan más errores de los que corrigen. Bajamos la búsqueda de 29
> segundos a menos de dos comprobando que el resultado no cambiaba. Y cada cifra que
> mostramos, en el chat y en el tablero, se abre en el fragmento exacto del documento que
> la sustenta.
