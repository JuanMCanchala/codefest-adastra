# Síntesis ejecutiva de la investigación

Corte: 18 de septiembre de 2026. Esta síntesis cruza el trabajo de cuatro agentes Kiro que
leyeron el corpus oficial de ADL, la investigación web verificada, dos revisiones de literatura
científica, el monitoreo de redes sociales y la evaluación de repositorios. Cada dato remite a su
documento de detalle, donde está la fuente: un `doc_id` del corpus o una URL con su año.

**Convención de fuentes.** `F1-…`, `F2-…` y `F3-…` son `doc_id` del corpus oficial. "Web" indica
datos de 2024 a 2026 que no están en el corpus. Lo que no se pudo confirmar aparece como
**por verificar** en los documentos de detalle.

> **Importante: leer primero [contraste_especificacion.md](contraste_especificacion.md).** La
> especificación oficial de la Etapa 2 cambia varias decisiones de la sección 6:
>
> - Los modelos se consumen vía **Amazon Bedrock**, con una bolsa de USD 100. **No se usa modelo
>   local.**
> - El repo debe ser **privado**.
> - Se exigen **tres agentes como mínimo** y un contrato JSON de respuesta.
> - El tablero solo puede mostrar **datos del corpus o de la base SQL de ADL**, trazables hasta
>   `doc_id` y `chunk_id`, y **sin puntajes de riesgo inventados**.
> - El despliegue es en **Coolify**.
> - La evaluación del Reto 1 es el **sábado 19 de septiembre, de 08:00 a 12:30**, y el Reto 2 se
>   entrega ese día a las 12:30.
>
> Los datos web de este documento sirven para el pitch, no como contenido del sistema.

---

## 1. Lo esencial en una página

| Fenómeno                                               | Tesis central                                                                                                                                                                                                | Dato ancla                                                                                                | Fuente                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **F1 · IA y Capacidades Estratégicas**                 | La IA ya es presupuesto y doctrina en las potencias. Colombia tiene política de IA pero no una hoja de ruta de IA para defensa, mientras su amenaza principal, los drones de grupos armados, crece cada año. | Ataques con drones en Colombia: 119 (2024), 277 (2025), 292 (en lo corrido de 2026)                       | Web, [claude/f1](claude/f1_ia_capacidades_web.md)      |
| **F2 · Seguridad del Entorno Espacial**                | LEO ya es infraestructura crítica y a la vez un entorno finito y disputado. Las capacidades de contraespacio que se usan hoy son las no destructivas: interferencia, _spoofing_ y ciberataques.              | Más de 11.000 satélites activos y más de 1,2 millones de fragmentos mayores de 1 cm (ESA 2025)            | `F2-ESA-003`, `F2-ESA-028`                             |
| **F3 · Dinámicas Territoriales y Amenazas Regionales** | El control territorial de los grupos armados se financia cada vez más con oro y economías ambientales, y la Amazonía se volvió un espacio criminal compartido por 6 países.                                  | Coca en Colombia: 261.000 ha en 2024, máximo histórico (SIMCI). Grupos armados: más de 27.000 integrantes | Web, [claude/f3](claude/f3_amenazas_regionales_web.md) |

**Cruce más potente entre fenómenos.** Colombia enfrenta en su territorio una amenaza tecnológica
que avanza rápido, los drones con IA de grupos armados (F1×F3). Para responderla depende de
espacio ajeno: GPS y datos comerciales. En el ejercicio Resolute Sentinel 24, los operadores de
Colombia usaron datos comerciales porque no tenían acceso a las herramientas de EE. UU. (F1×F2,
`F2-SWF-124`). La selva, donde las alertas son más escasas, es donde crece el oro ilícito (F2×F3).

---

## 2. Hallazgos por fenómeno

### F1 · IA y Capacidades Estratégicas

- **Global.** EE. UU. pidió USD 13.400 millones para autonomía en el año fiscal 2026, la primera
  vez que aparece como línea propia del presupuesto. Ucrania usa más de 70 sistemas con IA, y el
  dron ruso V2U ya selecciona blancos por su cuenta. Con Maven, el ciclo de selección de blancos
  pasó de unas 2.000 personas a unas 20 (`F1-CSET-125`).
- **Gobernanza fragmentada.** En la resolución de la ONU sobre armas autónomas (166–5–5), EE. UU.,
  Rusia e Israel votaron en contra. La cumbre REAIM 2026 reunió solo 35 respaldos. La CCW decide en
  noviembre de 2026 si se negocia un tratado, y Colombia está entre los 76 Estados a favor (web).
- **Región.** Colombia ocupa el 4.º lugar en el Índice Latinoamericano de IA 2025 (55,84 puntos),
  detrás de Chile, Brasil y Uruguay. La región recibe el **1,12 %** de la inversión mundial en IA
  según el corpus (`F1-ILIA-009`); la web da 1,28 %. **Se cita el dato del corpus.**
- **Colombia.** El CONPES 4144 de IA (COP 479.273 millones, 106 acciones hasta 2030) no tiene un
  eje de defensa. La paradoja: cerca del 3 % del PIB va a defensa y no hay IA de defensa
  documentada (`F1-DAIO-035`, `F1-ILIA-005`).
- Detalle: [f1_ia_capacidades/](f1_ia_capacidades/README.md), incluido `riesgos.md`, y
  [claude/f1_ia_capacidades_web.md](claude/f1_ia_capacidades_web.md).

### F2 · Seguridad del Entorno Espacial

- **Entorno orbital.** Según el corpus, la ESA estimó 54.000 objetos mayores de 10 cm al 1 de agosto
  de 2024 (`F2-ESA-028`). La web da unos 68.450 con el modelo de febrero de 2026. **Las dos cifras
  son compatibles porque corresponden a épocas distintas: hay que decir siempre la época.** El
  informe ESA 2026 dice que el entorno empeoró "un orden de magnitud" en un año (web).
- **Congestión.** Starlink tiene 11.112 satélites operativos y registró 355.000 maniobras de
  evasión en 12 meses. El indicador _CRASH Clock_, que mide cuántos días pasarían antes de una
  colisión si nadie maniobrara, cayó de 164 días en 2018 a unos 2,2 días en 2026 (web).
- **Legado de las pruebas antisatélite.** Siguen en órbita unos 2.300 fragmentos de la prueba china
  de 2007 (`F2-SWF-102`/`105`/`107`; web).
- **Contraespacio.** El informe SWF 2026 distingue cinco familias de capacidades. Las que se usan
  activamente son las no destructivas (`F2-SWF-120`).
- **Colombia.** El país opera el FACSAT-2 y firmó los Acuerdos Artemis. La Declaración de Bogotá,
  que reclamaba soberanía sobre la órbita geoestacionaria, aparece en el corpus (`F2-SWF-126`).
  **FACSAT y los documentos de la FAC no están en el corpus:** el asistente solo los puede citar si
  se agregan como fuente externa.
- Detalle: [f2_seguridad_espacial/](f2_seguridad_espacial/README.md) y
  [claude/f2_seguridad_espacial_web.md](claude/f2_seguridad_espacial_web.md).

### F3 · Dinámicas Territoriales y Amenazas Regionales

- **Región.** En 2025 hubo al menos 108.838 homicidios en América Latina y el Caribe (−5 %), aunque
  Haití (68,0 por 100.000) y Ecuador (50,9) llegaron a máximos. La región acoge 6,98 millones de
  migrantes venezolanos (R4V, ago-2026). En la Amazonía hay grupos armados en el 67 % de los
  municipios estudiados y 4.472 sitios de minería ilegal (web).
- **Colombia.** Los grupos armados crecieron 23,5 % hasta más de 27.000 integrantes. Hubo 322.688
  desplazados en 2025 (CICR). La crisis del Catatumbo dejó unos 92.000 desplazados (web).
- **Alertas tempranas.** De los 425 documentos de la Defensoría, 363 son fichas geolocalizables. Kiro
  construyó con ellas una tabla por departamento (33 departamentos) lista para mapear. El campo de
  economías ilícitas registra: narcotráfico 84, contrabando 58, minería 55, préstamos "gota a gota"
  28 y tala 5.
- **Giro político de 2026.** El nuevo gobierno cerró las mesas de la Paz Total entre agosto y
  septiembre de 2026 (web). Es un dato muy reciente: hay que revisarlo en la fuente antes de citarlo.
- **Corrección.** El CEEEP es del **Ejército del Perú**, no de Colombia.
- Detalle: [f3_amenazas_regionales/](f3_amenazas_regionales/README.md) y
  [claude/f3_amenazas_regionales_web.md](claude/f3_amenazas_regionales_web.md).

---

## 3. Lo que evalúa el jurado

- Las 50 preguntas de ejemplo se agrupan en bloques cerrados: F1 `q001–q016`, F2 `q017–q032` y
  F3 `q033–q050`. Todas están en español, pero la evidencia está mezclada en español e inglés
  ([transversal/preguntas_jurado.md](transversal/preguntas_jurado.md)).
- **Vacíos del corpus frente a las preguntas:** rutas aéreas ilícitas (q047), minerales estratégicos
  distintos del oro (q046) y renta petrolera (q048). Estas se cubren con fuentes externas o se
  declaran como límite del sistema.
- Las tablas numéricas de los PDF de SIPRI y RESDAL se corrompen al extraerse. El gasto militar por
  país se toma de la web: Colombia gastó US$14.500 millones en 2025, el 3,2 % del PIB (SIPRI 2026).

---

## 4. Cifras con discrepancia (el asistente debe señalarlas, no esconderlas)

| Dato                            | Corpus                              | Web                                                           | Qué hacer                                                                                   |
| ------------------------------- | ----------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Presupuesto del Escudo Antidrón | COP 6,3 billones (`F3-MAPPOEA-019`) | USD 1.668 millones; COP 1 billón                              | Mostrar las tres cifras con su fuente. Detectarlo en vivo sirve como demostración de rigor. |
| Inversión de ALC en IA          | 1,12 % (`F1-ILIA-009`)              | 1,28 %                                                        | Citar el corpus.                                                                            |
| Objetos de más de 10 cm         | 54.000 (época ago-2024)             | 68.450 (modelo feb-2026)                                      | Indicar la época del dato.                                                                  |
| Deforestación en Colombia 2025  | —                                   | 72.409 ha frente a 119.483 ha                                 | **Por verificar**.                                                                          |
| Nombre de la Fuerza             | "Fuerza Aeroespacial Colombiana"    | Anuncio del 21-ago-2026 de volver a "Fuerza Aérea Colombiana" | Usar la sigla **FAC**.                                                                      |

---

## 5. Subfenómenos diferenciales (top 10)

Detalle y puntajes en [subfenomenos_wow.md](subfenomenos_wow.md).

1. Drones armados de grupos ilegales frente al Escudo Antidrón con IA (F1×F3).
2. La FAC depende de espacio ajeno: GPS, comunicaciones satelitales y Resolute Sentinel 24 (F1×F2).
3. **El punto ciego:** más grupos armados y menos alertas en Guainía, Vichada, Vaupés y Guaviare (F3).
4. El oro desplaza a la coca como fuente de financiación (F3).
5. Los fragmentos de las pruebas antisatélite siguen en órbita (F2).
6. La IA comprime el ciclo de selección de blancos de 2.000 personas a 20 (caso Maven) (F1).
7. La paradoja colombiana: 3 % del PIB en defensa y ninguna IA de defensa documentada (F1).
8. China en el hemisferio: estaciones terrenas en Neuquén, Santiago y Alcântara, y el puerto de
   Chancay (F1×F2×F3).
9. Armas autónomas: la decisión de la CCW en noviembre de 2026 (F1).
10. Vigilancia satelital de las economías ilícitas, con Starlink en la minería ilegal (F2×F3).

**Guion de tres demostraciones:** "La amenaza que vuela bajo" (F1×F3), "La FAC y el espacio que no
controla" (F1×F2) y "La selva que nadie alerta" (F2×F3).

---

## 6. Decisiones de diseño respaldadas por la investigación

| Decisión                                                                                                                                                                                                            | Respaldo                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Consola web de nivel empresarial: Next.js + shadcn/ui + AI Elements, con un único backend FastAPI que responde por SSE. **Se descarta Streamlit.**                                                                  | [arquitectura_empresarial.md](arquitectura_empresarial.md)                                                               |
| Base visual: **fork de worldmonitor**. El repo se publica bajo AGPL-3.0 (decisión del equipo).                                                                                                                      | [worldmonitor_datos_agentes.md](worldmonitor_datos_agentes.md), [reincorporados_copyleft.md](reincorporados_copyleft.md) |
| Orquestador con agentes especialistas (LangGraph) sobre **un solo LLM local**. CrewAI entra como nodo para tareas de informe por roles. Sin debate entre agentes: la evidencia no muestra que mejore.               | [papers_rag_multiagente.md](papers_rag_multiagente.md)                                                                   |
| Enrutador según la complejidad de la pregunta (Adaptive-RAG) y un evaluador correctivo (CRAG) que usa el puntaje del reranker. El sistema **se abstiene** cuando la evidencia no alcanza.                           | ídem                                                                                                                     |
| Citas por oración, revisadas por un verificador pequeño aparte (MiniCheck o LettuceDetect). No basta pedirlo en el prompt: un modelo de 3,8B a 8B igual responde el 41,6 % de las preguntas con evidencia engañosa. | ídem                                                                                                                     |
| El grafo GLiNER entra como señal complementaria, no como buscador principal. Construirlo sin LLM fue lo correcto: en 8 GB, los modelos de menos de unos 7B no logran construir un grafo al estilo GraphRAG.         | ídem                                                                                                                     |
| Modelo local **Qwen3.5-9B** en Ollama; respaldos Qwen3.5-4B y phi4-mini. Bonsai 2 27B solo como modo opcional si pasa el benchmark.                                                                                 | [modelo_local.md](modelo_local.md)                                                                                       |
| El agente de visualización produce especificaciones declarativas validadas por esquema (Vega-Lite/ECharts) desde un catálogo cerrado. No ejecuta código generado.                                                   | [papers_visual_dominio.md](papers_visual_dominio.md)                                                                     |
| Geocodificación: se detectan los topónimos con NER y el LLM solo elige entre los candidatos de DIVIPOLA.                                                                                                            | ídem                                                                                                                     |
| El LLM **no pronostica** conflicto: se usa un índice municipal interpretable con intervalos de confianza. Tampoco se calculan probabilidades de colisión orbital propias.                                           | ídem                                                                                                                     |
| Diseño contra el sesgo de automatización: evidencia visible, nivel de confianza y decisión humana. Es un argumento clave ante un jurado militar.                                                                    | ídem                                                                                                                     |
| Demo sin red: datos de CelesTrak y de las APIs guardados en disco, modo de repetición, dos máquinas y video de respaldo.                                                                                            | [arquitectura_empresarial.md](arquitectura_empresarial.md)                                                               |

---

## 7. Pendientes antes de la final

1. Confirmar con los organizadores la fecha y hora reales de entrega. Las diapositivas dicen
   "sábado 18 de septiembre", pero el 18-sep-2026 es viernes.
2. Correr el benchmark del modelo local (unos 10 minutos, [modelo_local.md](modelo_local.md) §5)
   con el sistema de recuperación cargado.
3. Agregar como fuente externa los documentos de la FAC y de FACSAT, que no están en el corpus.
4. Confirmar las cifras marcadas **por verificar**, en especial las de los hechos políticos de 2026.
5. Guardar en disco los datos externos para la demo: CelesTrak, GDELT, UCDP, datos.gov.co y los
   límites municipales del DANE.
