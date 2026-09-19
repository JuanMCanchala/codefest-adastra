# Evaluación de arquitectura: qué tenemos, qué es lo mejor posible y cómo llegar

**Corte: 18 de septiembre de 2026, noche.** Quedan unas 10 horas hasta la ventana de
evaluación del Reto 1 (sábado 08:00) y unas 15 hasta la entrega del Reto 2 (12:30).

Este documento evalúa la arquitectura **realmente implementada** en `agent/`,
`dashboard/datos/` y `frontagent/` contra (a) la rúbrica oficial de la Etapa 2 y (b) el
estado del arte ya levantado en [`02_estado_del_arte/`](../02_estado_del_arte/). No
propone una reescritura: propone la arquitectura objetivo alcanzable esta noche y el
orden en que hay que tocarla.

Las cifras de latencia son **medidas propias** sobre la base vectorial real (90.613
fragmentos) en CPU, no estimaciones. El procedimiento está en [§7](#7-cómo-reproducir-las-mediciones).

---

## 1. Veredicto en una página

**La arquitectura de diseño es correcta y va por delante de lo que pide la
especificación. La implementación tiene cinco defectos concretos, todos medidos, y
cuatro se arreglan en menos de una hora cada uno.**

Lo primero que conviene fijar es que **"vanguardia" aquí no significa más agentes.** La
rúbrica premia eficiencia (20 %) comparándonos con los demás equipos en tokens, número
de llamadas y latencia, y la literatura que ya recopilamos
([`papers_rag_multiagente.md`](../02_estado_del_arte/papers_rag_multiagente.md), tema 4)
apunta en la misma dirección: Cemri et al. (MAST, NeurIPS 2025) documentan 14 modos de
fallo de los sistemas multiagente; Kim et al. (2025), sobre 260 configuraciones, miden de
+80,8 % a −70,0 % según la tarea y concluyen que **las arquitecturas sin verificación
central propagan más errores**; Wang et al. (ACL 2024) muestran que un solo agente bien
instruido casi iguala al debate. El equipo que gane no será el que tenga siete agentes
conversando: será el que responda **rápido, citando, y sepa callarse cuando no tiene
evidencia**.

Por eso la arquitectura objetivo (§5) no añade ni una llamada al modelo respecto de hoy.
Añade **una capa de verificación que no consume tokens** y quita trabajo inútil.

### Los cinco hallazgos, por impacto

| #      | Hallazgo                                                                                                                | Bloque afectado                   | Estado                                    |
| ------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------- |
| **H1** | El reranker era el **95–97,5 %** de la latencia de recuperación                                                        | Eficiencia 20 %                   | Medido · **resuelto** en `d0b335f` (12×)  |
| **H2** | El `Dockerfile` descargaba un reranker **distinto** del que declaraba `config.retrieval.yaml`                          | Despliegue, riesgo de caída       | **Resuelto** en `d0b335f`                 |
| **H3** | El filtro de inyección bloqueaba preguntas legítimas: `\bDAN\b` con `IGNORECASE` matchea el verbo español "dan"        | Calidad 40 %                      | **Resuelto**; queda un residual (§4.3)    |
| **H4** | La consulta se codifica **dos veces** con BGE-M3 (denso y disperso en pasadas separadas)                                | Eficiencia 20 %                   | Medido · **abierto**                      |
| **H5** | Los filtros del agente de visualización no se resuelven contra el vocabulario real: **`entidades` está en minúsculas**  | Ejecución dinámica **55 %** (R2)  | **Abierto y crítico** (§4.5)              |

Ninguno es un error de diseño. Los cinco son deuda de integración de las últimas horas, y
tres ya se cerraron en las dos horas siguientes a la primera versión de este documento.
**El que queda abierto y duele es H5.**

---

## 2. Qué hay hoy, realmente

```
POST /chat  (FastAPI, un puerto, Anexo A.4)
   │
   ├─ guard.detectar_inyeccion()         determinista, 0 llamadas al modelo
   │
   ├─ orquestador         gpt-oss-120b   JSON {ruta, fenomeno, consulta}   1 llamada
   │     ├─ corpus        llama-3.3-70b  respuesta citada [n]              1 llamada
   │     ├─ visualizacion gpt-oss-120b   JSON del catálogo cerrado         1 llamada
   │     └─ fuera_de_alcance             texto fijo                        0 llamadas
   │
   └─ contrato §2.4: respuesta + evaluacion + metadata (tokens reales del proveedor)
```

Lo que está **bien resuelto** y no hay que tocar:

- **El contrato §2.4 es exacto** y `tokens.total` suma todos los modelos (`tracker.py`),
  que es el requisito obligatorio de la especificación.
- **Trazabilidad de punta a punta.** Cada fragmento conserva `doc_id` y `chunk_id`; la
  base del tablero (34,5 MB) tiene pruebas que verifican que toda fila de las tablas
  analíticas apunta a un `chunk_id` existente y coherente con su `doc_id`. Es una regla
  dura de la especificación (§3.3, B.1.3) y no es fácil que otros equipos la cumplan.
- **Honestidad de los datos.** `dashboard/datos/README.md` declara sus propias
  limitaciones (70 % de documentos sin fecha completa, 232 nodos `pais` sin ISO3,
  `chunks` del grafo truncado a 21 por nodo). Esa transparencia vale puntos en el pitch y
  evita que un evaluador encuentre el problema antes que nosotros.
- **Catálogo cerrado de visualizaciones**, idéntico en `agent/app/catalogo.py` y
  `dashboard/API.md`. Es exactamente lo que mide el bloque del 55 %.
- **Abstención sin llamada al modelo**: si no hay fragmentos, no se invoca al redactor.
- **La imagen no lleva secretos** y el contenedor corre con un usuario sin privilegios.

---

## 3. Evaluación contra la rúbrica

### Reto 1

| Bloque             | Peso | Dónde estamos                                                                                                                                                                                       | Riesgo                                                                                                                                                                            |
| ------------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A · Calidad**    | 40 % | Citas obligatorias por fragmento, abstención, prompts con tono explícito. Redactor (Llama 3.3 70B) elegido por ser el único estable en las dos versiones de Vectara (4,0 % / 4,1 %)                 | **H3**: una pregunta legítima bloqueada cuenta como respuesta irrelevante. Además, en la ruta `visualizacion` el `retrieval_context` va vacío y el `actual_output` no está anclado |
| **B · Eficiencia** | 20 % | 2 llamadas en la ruta típica, contexto de 6 fragmentos, `max_tokens` cortos                                                                                                                         | **H1 y H4**: la latencia la domina la recuperación, no el modelo. 25–29 s medidos en contenedor frente a un objetivo de menos de 3 s                                              |
| **C · Seguridad**  | 20 % | Tres capas (patrones, separación instrucción/datos, saneo de salida), ruff + bandit + eslint en CI                                                                                                  | La **inyección indirecta** (ataque escondido en un fragmento recuperado) no está cubierta. La especificación no la exige, pero ADL puede probarla                                 |
| **D · Diseño**     | 20 % | Ficha del agente completa, tres agentes con roles claros                                                                                                                                            | `docs/ARQUITECTURA.md` **todavía no existe**. Es el 20 % completo y hoy vale cero                                                                                                 |

### Reto 2

| Bloque                     | Peso     | Dónde estamos                                                    | Riesgo                                                                                                                                                                     |
| -------------------------- | -------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B · Ejecución dinámica** | **55 %** | El agente elige componente del catálogo y emite filtros          | **H5**: si el experto escribe "las FARC" y la tabla dice `FARC-EP`, el componente se activa **correcto pero vacío**. Para el evaluador es indistinguible de un fallo       |
| **A · Diseño por fenómeno**| 40 %     | Propuesta esbozada en `contraste_especificacion.md` §4           | Falta escribirla en el documento de arquitectura, que es donde se evalúa                                                                                                    |
| **C · Calidad de código**  | 5 %      | CI en verde                                                      | —                                                                                                                                                                           |

**Dónde está el dinero:** `docs/ARQUITECTURA.md` (20 % del Reto 1 + 40 % del Reto 2) es,
por unidad de esfuerzo, lo más rentable que queda, y no depende de ningún despliegue.
Después, H5 (55 % del Reto 2) y H1 (latencia).

---

## 4. Los hallazgos, con su evidencia

### H1 · El reranker es el 96 % de la latencia

Perfilado del pipeline completo sobre la base real, CPU de 32 hilos, tres preguntas
representativas (una por fenómeno):

| Paso                                            | q. drones (F1)          | q. Kessler (F2)         | q. Chocó (F3)           |
| ----------------------------------------------- | ----------------------- | ----------------------- | ----------------------- |
| **rerank (30 candidatos, `max_length=8192`)**    | **33.810 ms · 95,0 %**  | **11.197 ms · 97,3 %**  | **13.491 ms · 97,5 %**  |
| encode denso (BGE-M3)                           | 1.562 ms                | 135 ms                  | 165 ms                  |
| encode disperso (BGE-M3)                        | 168 ms                  | 145 ms                  | 140 ms                  |
| `meta_by_id` (se reconstruye en cada consulta)  | 19 ms                   | 16 ms                   | 19 ms                   |
| búsqueda FAISS                                  | 17 ms                   | 11 ms                   | 9 ms                    |
| fusión RRF, split, agregación de documentos     | < 7 ms                  | < 2 ms                  | < 7 ms                  |
| **Total del pipeline**                          | **35,6 s**              | **11,5 s**              | **13,8 s**              |

La causa es el **tamaño del modelo multiplicado por el número de candidatos**:
`BAAI/bge-reranker-v2-m3` es XLM-RoBERTa **large** (567,8 M parámetros, 24 capas × 1024)
puntuando 30 pares en CPU, para entregar 6 fragmentos. `config.retrieval.yaml` ya bajó de
100 a 30 candidatos, pero el agente usa `FRAGMENTOS_CONTEXTO=6` y `final_fragments` sigue
en 10.

**Dos hipótesis que medí y resultaron falsas**, y que conviene no perseguir:

- **`max_length=8192` no es el problema.** Los fragmentos candidatos miden p50 = 346 y
  p90 = 401 tokens (máximo 711), y `sentence-transformers` rellena hasta el más largo del
  lote, no hasta `max_length`. Fijarlo en 512 **no acelera nada**: 13.496 ms → 15.395 ms,
  dentro del ruido. (En una primera medición sin calentamiento parecía dar un 3×; era el
  coste de la primera inferencia, no el parámetro.)
- **Subir el `batch_size` empeora.** De 8 a 32 el rerank pasó de 15.395 ms a 21.364 ms:
  con lotes grandes se rellena más y se desperdicia cómputo.

Barrido medido con calentamiento, mediana de 5 preguntas, y **solapamiento del top-6
contra la configuración de referencia** (30 candidatos), que es lo que de verdad importa:

| Candidatos       | Rerank     | Solape del top-6 | Lectura                                     |
| ---------------- | ---------- | ---------------- | ------------------------------------------- |
| 30 (referencia)  | 13.496 ms  | 100 %            | Hoy                                         |
| 20               | 11.707 ms  | 86,7 %           | Poco ahorro                                 |
| 16               | 9.803 ms   | 83,3 %           | Razonable                                   |
| 12               | 5.155 ms   | 70,0 %           | Empieza a doler                             |
| 10               | 3.293 ms   | 53,3 %           | **Ya casi no aporta**                       |
| 8                | 2.865 ms   | 46,7 %           | **Peor que no rerankear**                   |
| 0 (sin reranker) | 0 ms       | 50,0 %           | Punto de comparación                        |

**La conclusión es incómoda y hay que decirla claro: recortar candidatos no es gratis.**
Con 8 o 10 candidatos el top-6 que llega al redactor se parece al de *no rerankear en
absoluto* — se paga toda la latencia del cross-encoder para no obtener su beneficio. La
Calidad pesa 40 % y la Eficiencia 20 %: cambiar recuperación por velocidad en esa
proporción es un mal negocio.

Por eso la palanca correcta no es recortar candidatos, sino **cambiar de modelo**, que es
lo que hizo el commit `d0b335f`: `mmarco-mMiniLMv2-L12-H384` (117,6 M parámetros, 12 capas
× 384) en vez de `bge-reranker-v2-m3` (567,8 M). Medido con los dos modelos cargados a la
vez y su identidad verificada:

| Reranker                       | Candidatos | Latencia   | Solape del top-6 con bge@30 |
| ------------------------------ | ---------- | ---------- | --------------------------- |
| bge-reranker-v2-m3 (568 M)     | 30         | 16.599 ms  | 100 % (referencia)          |
| bge-reranker-v2-m3             | 20         | 11.140 ms  | 86,7 %                      |
| bge-reranker-v2-m3             | 12         | 6.273 ms   | 70,0 %                      |
| **mmarco-MiniLM (118 M)**      | 30         | **1.400 ms (12×)** | **50,0 %**          |
| sin reranker (RRF puro)        | —          | 0 ms       | 46,7 %                      |

El 12× de aceleración se confirma y valida el cambio. Pero **la mitad de la evidencia que
llega al redactor es distinta**, y en coincidencia con el modelo grande el MiniLM queda
apenas por encima de no rerankear (50 % frente a 46,7 %).

Cuidado con leer eso como "es casi igual de malo que no rerankear": el solapamiento mide
parecido con bge, no calidad. El MiniLM puede estar eligiendo fragmentos distintos e igual
de buenos. Para decidirlo hacen falta etiquetas, así que se midió.

#### El cambio de reranker no costó calidad

Etiqueta: los `doc_id` que el equipo asignó a cada una de las 50 preguntas en
[`preguntas_jurado.md`](../01_fenomenos/transversal/preguntas_jurado.md) (160 juicios).
Son **candidatos identificados por título y colección, no juicios verificados fragmento a
fragmento**, así que sirven para comparar configuraciones entre sí, no como medida
absoluta. Métrica sobre el top-6 que recibe el redactor:

| Configuración                             | acierto@6      | recall@6 | Latencia   |
| ----------------------------------------- | -------------- | -------- | ---------- |
| sin reranker (RRF puro)                   | 34,0 % (17/50) | 12,0 %   | 0 ms       |
| bge-reranker-v2-m3 (568 M), 30 candidatos | 30,0 % (15/50) | 10,3 %   | 23.005 ms  |
| **mmarco-MiniLM (118 M), 30 candidatos**  | **36,0 % (18/50)** | 13,2 % | 1.850 ms |
| mmarco-MiniLM, 40 candidatos (en producción) | 32,0 % (16/50) | 12,0 % | 1.973 ms  |

**Dos lecturas, y la segunda importa más que la primera:**

1. **El cambio a MiniLM no costó nada medible.** Queda igual o por encima del modelo
   grande en las tres filas, a 12 veces la velocidad. `d0b335f` era la decisión correcta y
   el 50 % de solapamiento no era una señal de alarma: eran fragmentos distintos, no
   peores.
2. **Ninguna configuración se distingue de las demás.** El rango entero va de 15 a 18
   preguntas acertadas de 50. Con n = 50 el error estándar ronda los 6,7 puntos, así que
   las cuatro filas caben dentro de una desviación. **No se puede concluir que rerankear
   ayude, ni que estorbe, con estas etiquetas.**

Lo que sí se puede concluir es operativo: **dejar de invertir tiempo en afinar el
reranker.** No hay evidencia de que mover `top_k_candidates` entre 30 y 40 cambie nada, y
el modelo ligero ya resolvió el problema de latencia. El tiempo que queda rinde mucho más
en H5.

La medición que de verdad decidiría esto no es de recuperación sino de respuesta:
fidelidad y relevancia al estilo DeepEval sobre las 50 preguntas, que es la batería de
Santiago. Estas etiquetas débiles no la sustituyen.

> Las latencias del MiniLM con 16 y 20 candidatos salieron **más altas** que con 30
> (4.014 y 5.100 ms frente a 1.400 ms), lo cual es imposible: es contención de CPU con
> otras mediciones en curso. Solo es fiable el orden de magnitud —unos 10×— y hay que
> repetirlo dentro del contenedor, en reposo.

El contenedor de Coolify tiene menos hilos que esta máquina, lo que explica los 25–29 s
reportados. Las proporciones se mantienen; los valores absolutos no.

### H2 · El `Dockerfile` y la configuración no hablan del mismo reranker

`agent/Dockerfile` descarga, en tiempo de construcción:

```
d('BAAI/bge-m3', ...); d('cross-encoder/mmarco-mMiniLMv2-L12-H384-v1', ...)
```

`agent/config.retrieval.yaml` declara:

```yaml
rerank:
  model_id: "BAAI/bge-reranker-v2-m3"
```

El comentario del propio `Dockerfile` dice que los modelos se descargan en la
construcción "para que el arranque no dependa de la red de Hugging Face durante la
evaluación". Con esta discrepancia pasa lo contrario: el contenedor arranca,
`CrossEncoderReranker` pide `BAAI/bge-reranker-v2-m3`, no lo encuentra en `/models` e
**intenta descargarlo durante la ventana de evaluación** — o falla, si el contenedor no
tiene salida a internet. El `README.md` del agente tampoco coincide: dice que la imagen
incluye `bge-reranker-v2-m3`.

Alguien ya decidió, con buen criterio, pasar al reranker MiniLM multilingüe (118 M
parámetros, unas cinco veces más pequeño). Solo faltó cerrar el cambio en los otros dos
sitios. **Es el hallazgo más urgente: puede tumbar el servicio a las 08:00.**

### H3 · El filtro de seguridad bloquea preguntas legítimas

`app/guard.py` compila todos sus patrones con `re.IGNORECASE`, incluido:

```python
r"\bjailbreak\b|\bDAN\b",
```

Con `IGNORECASE`, `\bDAN\b` matchea el verbo español **"dan"**. Reproducido:

| Pregunta                                                                | Resultado     |
| ----------------------------------------------------------------------- | ------------- |
| "¿Qué datos **dan** los informes sobre basura espacial?"                | **BLOQUEADA** |
| "¿Cuántas alertas tempranas **dan** cuenta de minería ilegal en Chocó?" | **BLOQUEADA** |
| "¿Qué organizaciones **dan** seguimiento a la congestión en LEO?"       | **BLOQUEADA** |
| "¿La IA **actúa como** multiplicador de fuerza en operaciones militares?"| **BLOQUEADA** |
| "¿Qué papel juega el **token** de acceso orbital?"                      | **BLOQUEADA** |

Una pregunta bloqueada devuelve el texto de rechazo: relevancia cero y fidelidad cero
para una pregunta perfectamente legítima.

**Cuánto duele, con datos.** Contra las 50 preguntas oficiales
(`ANDES/data/adl/queries.jsonl`) el filtro tiene **0 falsos positivos** — por eso nadie
lo ha visto. Pero la evaluación del Reto 1 usa la batería propia de ADL y en el Reto 2
**los expertos escriben sus propias preguntas**. En el corpus, "dan" aparece en el 0,43 %
de los fragmentos y "actúa como" en el 0,03 %; en preguntas redactadas al vuelo ("¿qué
cifras dan…?", "¿qué lecciones dan…?") la frecuencia es bastante mayor. No tengo una
medición de esa tasa sobre preguntas reales, así que el tamaño exacto del daño es
incierto — pero el arreglo cuesta cinco minutos y elimina el riesgo entero:

- `\bDAN\b` → quitar `IGNORECASE` para ese patrón concreto, o exigir contexto
  (`\bmodo DAN\b`, `\bDAN mode\b`).
- `act[uú]a como` → exigir que lo siga un rol (`actúa como (un|una|si)`), no cualquier
  sustantivo.
- `token`, `secret`, `credencial` → pedir un verbo de exfiltración cerca
  (`muestra|revela|dame|imprime`), no la palabra suelta.

Y añadir a `test_preguntas_legitimas_no_se_bloquean` las cinco preguntas de la tabla: hoy
solo cubre tres frases que no contienen ninguno de los disparadores.

**Estado: resuelto.** El patrón `DAN` quedó sensible a mayúsculas y los de rol y
credenciales se acotaron. Verificado: 4 de los 5 falsos positivos ya pasan, los 7 ataques
de control siguen bloqueados y 0 de las 50 preguntas oficiales se bloquean. **Queda un
residual:** *"¿Qué papel juega el token de acceso orbital…?"* sigue bloqueada por el
patrón de credenciales, que exige un verbo de exfiltración cerca pero acepta "el token de
acceso" como objeto directo.

Sobre la segunda capa que se añadió después (clasificador mDeBERTa, commit `12fdf5b`): es
la decisión correcta —no gasta tokens y degrada con elegancia si el modelo no carga— y se
midió frente a Llama Prompt Guard 2, que es el "Plan A" del documento de seguridad. El
resultado está en
[`reranking_y_seguridad.md`](reranking_y_seguridad.md) §2.7 y **descarta Prompt Guard 2**:
detecta 8 de 24 ataques difíciles frente a 15 de 24 del clasificador abierto que ya está
en producción.

### H4 · La consulta se codifica dos veces

`pipeline._search_one` llama a `encoder.encode()` (pasada densa) y después `retrieve()`
llama a `encoder.encode_sparse()`, una segunda pasada completa por el mismo modelo de
568 M. BGE-M3 devuelve denso, disperso y ColBERT en **una sola pasada**:

```python
out = self.model.encode(texts, return_dense=True, return_sparse=True, return_colbert_vecs=False)
```

Medido: 1.562 ms + 168 ms en la primera consulta, 135 ms + 145 ms en las siguientes. Son
150–300 ms regalados por pregunta. Poco al lado de H1, pero es la mitad del presupuesto
de latencia una vez arreglado H1.

### H5 · Los filtros del agente de visualización no se resuelven contra la base

Este es el 55 % del Reto 2 y hoy es el punto más frágil del sistema.

El flujo es: el experto escribe una instrucción → el agente devuelve
`{"componente": "red_entidades", "filtros": {"entidad": "las FARC"}}` → el backend
ejecuta la consulta. Si la tabla `entidades` guarda `FARC-EP`, la consulta devuelve cero
filas. **El agente acertó el componente y el tablero muestra un gráfico vacío**, que para
el evaluador es indistinguible de un fallo.

Lo mismo con `departamento: "Chocó"` frente a `CHOCO`, o `economia: "minería"` frente al
vocabulario cerrado real (`minería ilegal`). `dashboard/API.md` ya prevé
`filtros_ignorados`, pero ignorar un filtro no es lo mismo que resolverlo.

**Medido contra `dashboard.db`, y es peor de lo que parecía: la tabla `entidades` guarda
los nombres en minúscula, y `red_entidades` / `linea_tiempo` filtran con `m.entidad =
:entidad`, igualdad exacta y sin normalizar.** Resultado con los nombres que un experto
escribiría:

| Lo que escribe el experto | ¿Coincide exacto? | Lo que hay en la base                  |
| ------------------------- | ----------------- | -------------------------------------- |
| FARC                      | **NO**            | `farc-ep` (206), `farc` (47)           |
| ELN                       | **NO**            | `eln` (238)                            |
| Clan del Golfo            | **NO**            | `clan del golfo` (26)                  |
| Chocó                     | **NO**            | `chocó` (93)                           |
| China                     | **NO**            | `china` (1.364)                        |
| Starlink                  | **NO**            | `starlink` (23)                        |
| Defensoría del Pueblo     | **NO**            | `defensoría del pueblo` (451)          |
| Estados Unidos            | **NO**            | `estados unidos` (106)                 |

**9 de 9 fallan.** Cualquier nombre propio escrito con mayúscula inicial —es decir,
todos— devuelve cero filas.

El commit `bd80d1b` mitigó la parte enumerable del problema metiendo los vocabularios
cerrados en el prompt (`economia`, `tipo_alerta`, `tipo_entidad`), lo cual está bien. Pero
no puede resolver `entidad`: son 26.961 valores y no caben en un prompt.

Falta una pieza de unas 10 líneas, sin modelo y sin tokens: **normalizar los dos lados**
(`lower()` y sin tildes) antes de comparar, con `LIKE` como respaldo, más un
`SELECT DISTINCT` para las columnas enumerables. Y una regla de producto: **si el
resultado sale vacío, relajar el filtro más restrictivo y decirlo en `nota_metodo`**,
nunca devolver un componente en blanco.

Nota aparte: incluso escribiendo `farc` en minúscula se recuperan 47 menciones de 253,
porque `farc` y `farc-ep` son entidades distintas. Conviene que la coincidencia por
subcadena sume las variantes y lo declare en `nota_metodo`.

### Otros dos, menores

- **Trabajo inútil en cada consulta.** `retrieve()` reconstruye `meta_by_id` sobre los
  90.613 fragmentos en cada llamada (16–19 ms) y calcula el top-3 de **documentos**
  (`aggregate_documents`, `_select_diverse_docs`, `index.reconstruct`) que el agente nunca
  usa: solo consume `resultado.fragments[:k]`. Era un requisito de la Etapa 1, no de esta.
  Quitarlo es gratis.
- **JSON por expresión regular.** `agents.extraer_json` busca `\{.*\}` en la salida del
  modelo. Tanto gpt-oss como Qwen3-Next y Gemma 3 soportan **structured outputs** en
  Bedrock (ver [`benchmarks_modelos_bedrock.md`](benchmarks_modelos_bedrock.md) §1). Pasar
  el esquema — con `enum` de las cuatro rutas y `enum` de los ocho componentes del
  catálogo — elimina la rama de *fallback* y sube el acierto del bloque del 55 %.

---

## 5. La arquitectura objetivo

Mismo número de llamadas al modelo que hoy en la ruta típica (dos, y una si el
enrutamiento determinista acierta). Lo que cambia es que **la verificación y la
resolución de filtros son deterministas: cuestan milisegundos y cero tokens.**

```
POST /chat
  │
  ├─ 0 · Guarda (determinista, 0 llamadas)
  │      patrones de alta precisión + normalización NFKC
  │      + revisión de los fragmentos recuperados (inyección indirecta)
  │
  ├─ 1 · Orquestador  ·  Adaptive-RAG (Jeong et al., NAACL 2024)
  │      atajo determinista si la intención es inequívoca  → 0 llamadas
  │      si no → modelo pequeño, structured output, max_tokens 64
  │
  ├─ 2 · Recuperación (sin modelo generativo)
  │      BGE-M3 en UNA pasada (denso + disperso) → FAISS → RRF
  │      → rerank MiniLM multilingüe, 16 candidatos, max_length 512
  │      → top-6, mejores en los extremos (Lost in the Middle, TACL 2024)
  │      → si el mejor score < umbral: reescribir ES↔EN y reintentar  (CRAG, Yan 2024)
  │      → si sigue bajo: ABSTENERSE sin llamar al redactor
  │
  ├─ 3 · Redactor  ·  Llama 3.3 70B, citas [n] obligatorias  (ALCE, EMNLP 2023)
  │
  ├─ 4 · Verificador (0 llamadas al modelo)  ← el diferenciador
  │      reutiliza el cross-encoder YA CARGADO para puntuar
  │      (oración de la respuesta, fragmento que cita)
  │      las no sustentadas se marcan o se podan      (MiniCheck, EMNLP 2024)
  │
  └─ 5 · Visualización  ·  catálogo cerrado + structured output
         + resolutor de filtros contra el vocabulario real de la base
         + nunca devolver un componente vacío
```

### Por qué esta y no otra

1. **El verificador de la capa 4 es la mejor decisión disponible esta noche.** La
   literatura es inequívoca en que las citas sin verificar fallan la mitad de las veces
   (ALCE) y en que la abstención por *prompt* no basta: los modelos responden el 41,6 % de
   las preguntas con contexto engañoso, y un chequeo externo lo baja al 13,3 % (Setiawan,
   AACL-IJCNLP 2026). Lo habitual es pagarlo con otra llamada al modelo, lo que nos
   costaría puntos de eficiencia. **Nosotros ya tenemos un cross-encoder multilingüe
   cargado en RAM para el reranking.** Puntuar cinco pares (oración, fragmento citado)
   cuesta unos cientos de milisegundos y **cero tokens**. Es fidelidad (30 % de la
   Calidad) prácticamente gratis, y es la frase más fuerte del pitch.
2. **Enrutamiento adaptativo antes que más agentes.** Adaptive-RAG y la cascada de Gao et
   al. (2025) respaldan saltarse el modelo cuando la consulta es obvia: ahorra en las tres
   métricas de eficiencia a la vez. Se activa **solo si mide bien**; si el atajo acierta
   menos del 95 % sobre preguntas etiquetadas, se deja la llamada al orquestador.
3. **Agentes extra sin llamadas extra.** La especificación da puntos por agentes
   adicionales que aporten al análisis aumentado (§1.2). El **verificador** y el
   **resolutor de evidencia** son agentes declarables en `agent_card.json` con
   herramientas deterministas y sin modelo: suman diseño (20 %) sin restar eficiencia
   (20 %). Es la única forma honesta de ganar en los dos lados de esa tensión.
4. **El grafo se queda apagado en la recuperación.** `GRAFO_EN_RECUPERACION` carga GLiNER,
   y la literatura propia (Xiang et al., 2025) dice que GraphRAG rinde por debajo del RAG
   clásico en preguntas factuales simples, que son la mayoría de las 50. El grafo ya
   aporta donde sí sirve: la red de entidades del tablero, con 97.182 aristas trazables.
   Además, `gliner` no está en `requirements.txt`: activarlo hoy rompería el contenedor.

### Lo que hay que descartar explícitamente

Lo enumero porque "vanguardia" invita a añadir, y esta noche añadir es el riesgo
principal:

| Idea                                            | Por qué no                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Debate entre agentes / multiagente conversacional | Wang et al. (ACL 2024) y Smit et al. (2023): no supera de forma fiable a un agente bien instruido, y cada ronda resta eficiencia                |
| RAG multipaso (IRCoT) por defecto               | 2–4 llamadas extra. Reservarlo, si acaso, para preguntas compuestas detectadas por el enrutador                                                   |
| Bedrock Guardrails                               | Añade latencia justo en el bloque que ya estamos perdiendo, y el filtro propio cubre el vector directo                                            |
| GraphRAG completo, Self-RAG, Search-R1           | Requieren indexado con LLM o entrenamiento. No caben en 10 horas                                                                                 |
| Cambiar de redactor sin medir                    | Llama 3.3 70B es el único estable en las dos versiones de Vectara. gpt-oss-120b pasó de 2,4 % a 14,2 % de alucinación entre versiones del test    |

---

## 6. Plan de implementación

Ordenado por puntos en juego ÷ horas. Los tiempos son de implementación, no de medición.

### Bloque 1 — Antes de las 02:00 · lo que puede tumbar la entrega

| #   | Acción                                                                                                                                                                | Dónde                                       | Esfuerzo | Gana                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------- | -------------------------------------------------- |
| ~~1~~ | ~~Unificar el reranker~~ — **hecho** en `d0b335f`                                                                                                                   | —                                           | —        | Evitada la caída a las 08:00 · H2                  |
| ~~3~~ | ~~Arreglar los patrones del filtro~~ — **hecho**; queda el residual de "token de acceso"                                                                            | `app/guard.py`                              | 5 min    | Calidad 40 % · H3                                  |
| **1** | **Normalizar los filtros de entidad en la API del tablero** (minúsculas, sin tildes, `LIKE` de respaldo) y no devolver nunca un componente vacío                    | `dashboard/api/app/componentes/`            | 30 min   | **55 % del Reto 2** · H5. Hoy falla 9 de 9 nombres |
| **2** | **Escribir `docs/ARQUITECTURA.md`** con las decisiones de este documento y la propuesta por fenómeno                                                                | `docs/`                                     | 2–3 h    | **20 % del Reto 1 + 40 % del Reto 2**, hoy en cero |
| ~~3~~ | ~~Confirmar que el reranker ligero no costó recuperación~~ — **hecho**: no costó nada medible (§4.1). No tocar más el reranker                                       | —                                           | —        | Cambio validado                                    |

### Bloque 2 — Antes de las 04:00 · lo que sube la nota

| #   | Acción                                                                                    | Dónde                              | Esfuerzo | Gana                                              |
| --- | ------------------------------------------------------------------------------------------ | ---------------------------------- | -------- | ------------------------------------------------- |
| 5   | **Resolutor de filtros** contra el vocabulario real + nunca devolver componente vacío     | `dashboard/api`                    | 1,5 h    | **55 % del Reto 2** · H5                          |
| 6   | **Structured outputs** con `enum` de rutas y de componentes                                | `app/llm.py`, `app/agents.py`      | 45 min   | Acierto del enrutado y del catálogo               |
| 7   | **Una sola pasada de BGE-M3**, `meta_by_id` cacheado y sin el top-3 de documentos          | `etapa1/retrieval/pipeline.py`     | 45 min   | 200–400 ms por pregunta · H4                      |
| 8   | **Verificador con el cross-encoder ya cargado**, declarado como cuarto agente sin modelo   | `app/agents.py`, `agent_card.json` | 1,5 h    | Fidelidad 30 % + diseño 20 %, a coste cero de tokens |

### Bloque 3 — Antes de las 06:00 · si sobra tiempo

| #   | Acción                                                                        | Esfuerzo | Gana                                        |
| --- | ----------------------------------------------------------------------------- | -------- | ------------------------------------------- |
| 9   | Caché LRU de consulta → fragmentos (los evaluadores repiten preguntas)        | 30 min   | Latencia                                    |
| 10  | Atajo determinista del orquestador, **solo si mide ≥ 95 % de acierto**        | 1 h      | Una llamada menos en la ruta mayoritaria    |
| 11  | Revisar los fragmentos recuperados en busca de inyección indirecta            | 30 min   | Seguridad 20 %                              |
| 12  | Ordenar el contexto con los mejores fragmentos en los extremos                | 15 min   | Calidad                                     |

### Una advertencia sobre el orden

Los puntos 1, 2 y 3 son de bajo riesgo y alto impacto: **hacerlos primero, medir y
congelar.** Los puntos 8 y 10 tocan el camino crítico de la respuesta; si a las 05:00 no
están funcionando con pruebas en verde, hay que descartarlos, no depurarlos. La regla del
plan de trabajo (después de las 06:00 el núcleo del agente se congela) es correcta y hay
que respetarla.

---

## 7. Cómo reproducir las mediciones

Las cifras de §4 salen de dos guiones que perfilan el pipeline real contra
`C:/Programacion/ANDES/entrega/base_vectorial` (90.613 fragmentos), forzando
`device="cpu"` para simular el contenedor de Coolify:

1. **Desglose por paso** (`denso_encode`, `faiss`, `sparse_encode`, `fusion`, `rerank`,
   `split`, agregación de documentos), con tres preguntas, una por fenómeno.
2. **Barrido del reranker**: producto de `top_k_candidates` × `max_length` × `batch_size`,
   midiendo latencia y el **solapamiento del top-6 contra la configuración actual**, para
   no comprar velocidad a costa de recuperación.

Antes de congelar hay que repetir la medición **dentro del contenedor**, que tiene menos
hilos: las proporciones se mantienen, los valores absolutos no.

Lo que **no** está medido todavía, y sigue pendiente del plan de trabajo: latencia y
tokens reales de los modelos en el gateway de ADL, acierto del JSON con y sin structured
outputs, y la batería de inyección de Santiago. Nada de este documento sustituye esas
mediciones.

---

## 8. Resumen para el pitch

> Nuestra arquitectura tiene tres agentes que se invocan **solo cuando hacen falta**, y
> dos piezas de verificación que **no consumen ni un token**: el filtro de seguridad y el
> verificador de citas, que reutiliza el modelo de reranking ya cargado en memoria.
> Elegimos no poner agentes a debatir porque las 260 configuraciones medidas por Kim et
> al. muestran que, sin verificación central, los sistemas multiagente propagan más
> errores de los que corrigen. Y cada cifra que mostramos, en el chat y en el tablero, se
> abre en el fragmento exacto del documento que la sustenta.
