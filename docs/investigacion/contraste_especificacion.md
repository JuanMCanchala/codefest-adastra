# Contraste: especificación oficial de la Etapa 2 frente a nuestra investigación

Fuente: _CODEFEST AD ASTRA 2026 — Especificación Técnica, Etapa 2 · El Reto Presencial_, v1.0
(julio de 2026, 28 páginas). En este documento, "§" remite a una sección de esa especificación.

**Conclusión.** La investigación de los fenómenos, los artículos científicos y los patrones de
interfaz siguen siendo válidos. Cambian cinco decisiones técnicas:

1. **No usamos un modelo local.** Los modelos se consumen vía Amazon Bedrock, con una bolsa de
   USD 100.
2. **El repo es privado.** No se puede publicar.
3. **Tres agentes como mínimo**, con un contrato JSON exacto de respuesta.
4. **El tablero solo muestra datos del corpus o de la base SQL de ADL**, trazables hasta `doc_id`
   y `chunk_id`. No se permiten puntajes de riesgo inventados.
5. **Todo se despliega en Coolify con Dockerfile.**

---

## 1. Fechas (resuelve la duda anterior)

| Hito                                                 | Fecha y hora oficiales                                                                                           | §   |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --- |
| Evaluación del Reto 1: el endpoint debe estar arriba | **Sábado 19 de septiembre, de 08:00 a 12:30**                                                                    | 2.1 |
| Entrega del Reto 2                                   | **Sábado 19 de septiembre, 12:30**. La ventana sigue abierta hasta que los expertos revisen a todos los equipos. | 3.1 |

La diapositiva que decía "sábado 18" tenía un error: la fecha es el **sábado 19**. Hoy, viernes 18,
es el día de construcción.

---

## 2. Lo que exige la especificación

### 2.1 Arquitectura (§1.2)

- **Tres agentes como mínimo:** (i) el principal u orquestador, que recibe la consulta y la
  redirige; (ii) el agente de preguntas sobre el corpus; (iii) el agente generador de
  visualizaciones.
- **Los agentes adicionales dan puntos extra**, siempre que aporten al "análisis aumentado" de los
  tres fenómenos.

### 2.2 Modelos (§1.3)

- Se usan **solo vía API de Amazon Bedrock**: gpt-oss-20b, gpt-oss-120b, Llama 3.3 70B Instruct,
  Llama 4 Scout, Mixtral 8x7B, DeepSeek-R1-Distill-Llama-70B, Qwen3-Next-80B-A3B y Gemma 3 27B.
- **Requisito obligatorio:** la bolsa es de USD 100. Si se supera, la API Key deja de funcionar.
- ADL entrega además un **enlace de Drive con el corpus y una base de datos SQL para el Reto 2**
  (https://shorturl.at/YPQg0). **Todavía no lo hemos descargado ni revisado.**

### 2.3 Reto 1: contrato de datos (§2.3, §2.4)

- **Ficha del agente en JSON** con la estructura propia de ADL: `agente`, `orquestador` (con
  `modelo`, `proveedor` y `tools`) y `subagentes[]` (con `id`, `modelo`, `proveedor`,
  `activado_por`, `ejemplos_de_activacion` y `tools`). El modelo declarado ahí es el que se usa
  para calcular el costo.
- **Cada respuesta** es un JSON con tres bloques:
  - `respuesta`.
  - `evaluacion`: `input`, `actual_output`, `retrieval_context[]` y `tools_called[]` con `name`,
    `input_parameters` y `output`.
  - `metadata`: `num_interacciones`, `agentes_invocados`, `tokens{input,output,total}`,
    `tokens_por_agente[]`, `latencia_ms` y `estado`.
- **Requisito obligatorio:** `tokens.total` suma **todos** los modelos invocados.

### 2.4 Reto 1: evaluación (§2.5)

| Bloque         | Peso | Cómo se mide                                                                                          | Qué hacemos                                                                                                                                                                                             |
| -------------- | ---- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A · Calidad    | 40 % | Relevancia de la respuesta 30 %, fidelidad al `retrieval_context` 30 %, toxicidad 15 %, **tono 25 %** | Son métricas al estilo DeepEval. La respuesta debe salir **solo** de los fragmentos que se devuelven en `retrieval_context`. El tono debe ser profesional, claro y empático.                            |
| B · Eficiencia | 20 % | Tokens 40 %, interacciones 30 % y latencia 30 %, **en comparación con los demás equipos**             | Pocas llamadas al modelo, contexto corto (5 a 8 fragmentos) y un modelo rápido para enrutar.                                                                                                            |
| C · Seguridad  | 20 % | Resistencia a _prompt injection_ 75 % con ataques de ADL; análisis estático 25 %                      | Guardas de entrada y salida, instrucciones de sistema que el usuario no puede sobrescribir, nunca exponer credenciales, más linters y análisis de seguridad (ruff, bandit, eslint) y manejo de errores. |
| D · Diseño     | 20 % | Ficha del agente y documento de arquitectura, con puntaje cualitativo                                 | Roles claros y una justificación con respaldo en la literatura.                                                                                                                                         |

**Tensión de diseño.** Cada agente extra suma puntos de diseño, pero cada llamada al modelo resta
eficiencia. Por eso los subagentes se invocan **solo cuando la pregunta lo requiere**, y la ruta
más frecuente debe hacer dos llamadas: el orquestador y el agente de preguntas.

### 2.5 Reto 2: tablero (§3.3, §3.4, Anexo B)

| Bloque                  | Peso     | Qué exige                                                                                                                                                                     |
| ----------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A · Propuesta de diseño | 40 %     | Qué preguntas analíticas responde cada fenómeno y qué componentes las responden. **Se justifica en el documento de arquitectura.**                                            |
| B · Ejecución dinámica  | **55 %** | Los expertos escriben sus propias preguntas y se evalúa si **el agente activa el componente correcto con los datos correctos**. No vale un tablero estático con todo visible. |
| C · Calidad del código  | 5 %      | Análisis estático.                                                                                                                                                            |

**Reglas duras del tablero:**

- **Trazabilidad:** cada dato mostrado debe rastrearse hasta `doc_id` y `chunk_id` (§3.3, B.1.3).
- **Datos reales:** solo la base de la Etapa 1 o el corpus y la base SQL de ADL. No se aceptan datos
  simulados (§3.3).
- **Nada de puntajes inventados:** ningún índice o nivel de riesgo calculado sin método; los
  conteos, frecuencias y agregaciones sí están permitidos (B.2.5).
- **El tipo de gráfico debe corresponder a la tarea analítica.** No se permite un mapa o grafo "por
  llamativo" cuando la tarea es una comparación simple (B.2.2).
- **Vistas mínimas recomendadas** (B.6.2): comparación, distribución y composición de la metadata;
  grafo de relaciones; mapa; línea de tiempo; y acceso al texto original.
- **Coordinación entre vistas** (B.6.3): filtros globales por fenómeno y fecha, y _brushing and
  linking_ (al seleccionar datos en una vista, se resaltan en las demás).
- **Componentes sugeridos:** matriz de calor, cuadrante de priorización (intensidad frente a
  tendencia), mapas de puntos, coropléticos y de calor con capas y agregación según el zoom, grafo
  con layout de fuerzas, jerárquico o radial y expansión de vecinos, línea de tiempo con la
  reaparición de entidades, y panel de evidencia.

### 2.6 Despliegue (§2.2, Anexo A)

- **Coolify** con build pack **Dockerfile**. Un puerto HTTP por contenedor, con _healthcheck_. Las
  claves van en variables de entorno de Coolify y nunca en el código.
- **Subdominios:**
  - `agent.<equipo>.codefest2026.augusta.avaldigitallabs.com` (`POST /chat`)
  - `frontagent.<equipo>…` (chat)
  - `dashboard.<equipo>…` (tablero público)
- **Repo de GitHub PRIVADO, "nunca público"** (A.2), con ADL y los evaluadores como colaboradores.
  Coolify lo clona con una _deploy key_ ED25519.
- El README debe traer el despliegue, el **documento de arquitectura con su justificación** y las
  instrucciones de uso.

### 2.7 Pitch (§5.3)

Se evalúan ocho puntos: problema, arquitectura y metodología, resultados clave, demostración,
desafíos, aplicabilidad a cada fenómeno, patrones y hallazgos, y **verificación de fuentes**.

---

## 3. Qué cambia en nuestra investigación

| Tema de la investigación                                                                                 | Veredicto                       | Motivo y ajuste                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Modelo local** (Qwen3.5-9B, Bonsai 2 27B), [modelo_local.md](modelo_local.md)                          | **Se descarta para la entrega** | §1.3: los modelos son los de Bedrock, y el costo se calcula con el modelo declarado en la ficha. El análisis sirve solo como contingencia de desarrollo.                                                                                                                                                                                            |
| Elección del LLM                                                                                         | **Nueva decisión**              | Candidatos: **gpt-oss-20b** como orquestador y enrutador (rápido y barato), y **gpt-oss-120b** o **Qwen3-Next-80B-A3B** para responder. Hay que **medir en Bedrock** la latencia, los tokens y la calidad sobre las 50 preguntas de la Etapa 1 antes de fijar la ficha, y verificar los precios de Bedrock para cuidar la bolsa de USD 100.         |
| **AGPL con repo público** ([reincorporados_copyleft.md](reincorporados_copyleft.md))                     | **Conflicto**                   | A.2 exige un repo privado. La AGPL obliga a ofrecer el código a quienes usan el servicio por red, y aquí esos usuarios son los evaluadores, que tienen acceso al repo. Reutilizar código AGPL es sostenible si se conservan `LICENSE` y las atribuciones, pero **no se publica el repo**. Es decisión del equipo.                                   |
| **worldmonitor como base**                                                                               | **Pierde peso**                 | Su valor está en las noticias en vivo y las capas globales, que no son datos del corpus y no se pueden rastrear hasta `doc_id` y `chunk_id`. Sirve como referencia de interfaz (mapa, capas, paneles), no como fuente de datos. Ver [worldmonitor_datos_agentes.md](worldmonitor_datos_agentes.md).                                                 |
| **APIs externas** (GDELT, UCDP, ACLED…)                                                                  | **Fuera del tablero**           | §3.3 exige datos de la Etapa 1, del corpus o de la base SQL. Como mucho sirven de contexto en el pitch, nunca como componente evaluado.                                                                                                                                                                                                             |
| **Investigación web de los fenómenos** ([claude/](claude/))                                              | **Útil solo para el pitch**     | El asistente se evalúa por su fidelidad al `retrieval_context`, así que no debe responder con datos web. Esos datos sirven para los puntos "hallazgos" y "verificación de fuentes" del pitch.                                                                                                                                                       |
| **Subfenómenos diferenciales** ([subfenomenos_wow.md](subfenomenos_wow.md))                              | **Filtrar**                     | Se conservan los que tienen respaldo en el corpus: drones frente al Escudo, Resolute Sentinel 24, el punto ciego de las alertas, el oro frente a la coca, las pruebas antisatélite, Maven, la paradoja colombiana y China en el hemisferio. Se descartan como componentes del tablero los que dependen de la web (FACSAT y Starlink en la minería). |
| **"Índice municipal de riesgo"** ([papers_visual_dominio.md](papers_visual_dominio.md))                  | **Se descarta**                 | B.2.5 prohíbe los índices de riesgo inventados. Se reemplaza por conteos trazables: alertas por municipio, menciones de economías ilícitas y un cuadrante de intensidad (conteo) frente a tendencia (variación temporal del conteo).                                                                                                                |
| **Interfaz empresarial** (Next.js y FastAPI, [arquitectura_empresarial.md](arquitectura_empresarial.md)) | **Se mantiene**                 | Encaja con los tres contenedores: API del agente, frontend de chat y tablero. Hay que ajustar el contrato del backend a §2.4.                                                                                                                                                                                                                       |
| **Visualización con un catálogo cerrado de componentes**                                                 | **Se mantiene y se refuerza**   | Es justo lo que evalúa el Bloque B del Reto 2 (55 %): el agente elige el componente y lo llena con datos y filtros.                                                                                                                                                                                                                                 |
| **Citas por oración, verificador y abstención** ([papers_rag_multiagente.md](papers_rag_multiagente.md)) | **Se mantiene**                 | Suma directamente a la fidelidad (30 % de la calidad) y a la verificación de fuentes del pitch. Si el verificador usa una llamada al modelo, suma una interacción; conviene que sea un modelo NLI pequeño dentro del contenedor, o nada.                                                                                                            |
| **Guardas contra _prompt injection_**                                                                    | **Nuevo, obligatorio**          | Pesa el 75 % del bloque de seguridad y no estaba en la investigación. Hay que investigarlo y construirlo: filtrado de entrada, separación de instrucciones y datos, y respuestas de rechazo con buen tono.                                                                                                                                          |
| **Base SQL de ADL para el Reto 2**                                                                       | **Nuevo, pendiente**            | Hay que descargarla y revisarla. Probablemente tenga metadatos estructurados (fechas, lugares) que resuelven las líneas de tiempo y el mapa.                                                                                                                                                                                                        |
| **Grafo GLiNER**                                                                                         | **Se mantiene**                 | Alimenta la red (B.3) y la reaparición de entidades en la línea de tiempo (B.5.2). Cada arista debe guardar su `doc_id` y `chunk_id`.                                                                                                                                                                                                               |
| **Datos PBF**                                                                                            | **Revalorizado**                | B.1.1 y B.4.2 mencionan explícitamente los atributos geográficos de los PBF y su jerarquía de zoom. En la Etapa 1 verificamos que son Mapbox Vector Tiles.                                                                                                                                                                                          |

---

## 4. Diseño recomendado, ajustado a la especificación

**Agentes** (la ficha declara modelo y proveedor por agente):

| Agente                                   | Rol                                                                                                      | Modelo candidato                  | Cuándo se invoca            |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------- |
| `orquestador`                            | Clasifica la intención (pregunta, visualización o ambas), aplica las guardas y delega                    | gpt-oss-20b                       | Siempre                     |
| `agente_corpus`                          | RAG sobre FAISS con BGE-M3 y reranker; responde con citas                                                | gpt-oss-120b o Qwen3-Next-80B-A3B | Preguntas sobre el corpus   |
| `agente_visualizacion`                   | Elige el componente del catálogo y lo llena con filtros sobre la metadata, el grafo o la base SQL        | gpt-oss-20b (salida JSON)         | Pedidos de visualización    |
| `agente_grafo` _(extra)_                 | Consulta vecinos, rutas y co-ocurrencias en el grafo para las preguntas relacionales                     | gpt-oss-20b                       | Solo preguntas relacionales |
| `agente_verificador` _(extra, opcional)_ | Revisa la fidelidad de cada afirmación con NLI dentro del contenedor, sin llamar al modelo si es posible | Modelo pequeño local en CPU       | Respuestas con cifras       |

- **Ruta típica:** dos interacciones, el orquestador y un especialista.
- **Tokens:** contexto de 5 a 8 fragmentos y respuestas concisas.

**Componentes del tablero por fenómeno** (se justifican en el documento de arquitectura):

- **F1:** matriz de calor de entidad × fuente; red de actores y tecnologías; línea de tiempo de
  menciones con la reaparición de entidades.
- **F2:** línea de tiempo de incidentes y pruebas antisatélite mencionados; matriz de países ×
  tipo de capacidad de contraespacio (conteo de menciones); red de actores.
- **F3:** mapa coroplético de Colombia con las alertas tempranas por departamento o municipio y
  capas por economía ilícita; cuadrante de intensidad frente a tendencia (conteos); red de grupos
  armados y territorios.
- **Transversales:** composición del corpus por fenómeno, fuente, formato e idioma; panel de
  evidencia con `doc_id`, `chunk_id` y el texto original.

---

## 5. Pendientes nuevos, por prioridad

1. **Descargar el enlace de ADL** (corpus y base SQL del Reto 2) y revisar el esquema de la base.
2. **Probar Bedrock** con la API Key: latencia y tokens de gpt-oss-20b, gpt-oss-120b y
   Qwen3-Next-80B-A3B sobre las 50 preguntas, con un tope de gasto fijado de antemano.
3. **Esqueleto que ya cumpla el contrato:** `POST /chat` con el JSON de §2.4, la ficha del agente,
   los tres Dockerfile con _healthcheck_ y un despliegue de prueba en Coolify.
4. **Investigar y construir las guardas contra _prompt injection_** y el análisis estático
   (ruff, bandit y eslint en CI).
5. **Decidir el tema AGPL** con el repo privado (§3).
