# F1 — Riesgos

Seis familias de riesgo documentadas en el corpus, más un séptimo riesgo de segundo orden que el
propio corpus nombra explícitamente.

---

## 1. Fragilidad técnica: los sistemas fallan donde más importa

`F1-CSET-103` (*AI for Military Decision-Making*, abr 2025) enumera los modos de falla de los
sistemas de apoyo a la decisión:

- **Cambios de contexto.** *"Los sistemas de IA tienden a fallar si se usan en escenarios
  significativamente distintos de sus datos de entrenamiento."* En defensa esto es la norma, no la
  excepción: el adversario cambia de comportamiento precisamente para invalidar tu modelo.
- **Proyección vs. predicción.** Hay una diferencia importante entre predicciones basadas en leyes
  físicas y predicciones que involucran interacciones humanas; para las segundas *"carecemos de
  modelos precisos y de datos observados directamente"*.
- **Alcance flexible o mal definido.** Sin casos de uso definidos ni salvaguardas, los AI-DSS
  *"confunden a los operadores y llevan al mal uso"*.
- **Incertidumbre irreducible.** *"Preguntas como '¿qué hará el enemigo?' tienen un nivel inherente de
  incertidumbre que no puede eliminarse."*
- **Datos sesgados y de baja fidelidad.** Los datos de comportamiento humano son particularmente
  difíciles por su observabilidad indirecta y variabilidad demográfica; *"los comandantes militares
  tienen dificultad para obtener datos precisos"*.

Las métricas del AI Index 2026 (`F1-AIINDEX-023`) confirman que esto no es cautela retórica:

| Medida | Resultado |
|---|---|
| Robots en tareas domésticas | **12 % de éxito** |
| Manipulación robótica en simulación (RLBench) | 89,4 % |
| Agentes de IA en tareas reales de computador (OSWorld) | ≈66 %, **fallan ~1 de cada 3 intentos** |
| Lectura de relojes analógicos por el mejor modelo | **50,1 %** |

La brecha entre 89,4 % en simulación y 12 % en el mundo físico es el dato más importante de esta
sección. Todo lo que se valide en simulador debe considerarse no validado.

`F1-CSET-011` (*The Mechanisms of AI Harm*, oct 2025) sistematiza incidentes reales, y el AI Index
registra que los **incidentes documentados subieron a 362 en 2025, desde 233 en 2024**
(`F1-AIINDEX-023`).

**Mitigación del corpus** (`F1-CSET-103`): despliegue **reversible**, con criterios basados en
contexto y riesgo, ajustable o terminable cuando cambien los factores en terreno; y la regla de oro:
*"los humanos son la última línea de defensa para asegurar que el empleo de estos sistemas sea
apropiado y se haga en cumplimiento del derecho internacional humanitario."*

---

## 2. La IA como superficie de ataque

`F1-CSET-085` (*Anticipating AI's Impact on the Cyber Offense-Defense Balance*, may 2025) invierte el
marco habitual: la IA no es solo un escudo, es un blanco nuevo.

- *"Los sistemas de IA podrían reemplazar debilidades humanas conocidas, **pero los componentes de IA
  son frecuentemente vulnerables**."*
- *"Los componentes de IA también podrían **agregar demasiada información o control en blancos
  digitales de alto riesgo**."*
- *"**Eliminar controles manuales podría reducir la resiliencia durante los ataques.**"*

Esta última es la advertencia de diseño más directamente aplicable a infraestructura crítica: la
automatización que mejora la eficiencia en operación normal puede eliminar la vía de recuperación bajo
ataque.

La conclusión general es deliberadamente no concluyente y hay que citarla con esa honestidad: *"No hay
una respuesta única a la pregunta de si la IA hará dominante la ofensiva o la defensa cibernética."*
Pero la IA sí *"aumentará el alcance de las tareas defensivas al hacer el ecosistema digital más
grande y complejo"*.

Corroboración desde el lado adversario: la amplitud de RFP del EPL en comunicaciones y ciber —para
*"proteger sus redes y sondear las redes de otros"*— *"sustancia las advertencias de los profesionales
de ciberseguridad sobre el potencial de la IA para hacer el ciberespacio menos seguro y la necesidad
urgente de adoptar soluciones de IA para ciberdefensa"* (`F1-CSET-115`).

Complementos: `F1-CSET-095` y `F1-CSET-100` (defensa contra atacantes inteligentes a gran escala).

---

## 3. Brechas jurídicas y de atribución de responsabilidad

**Ningún documento del corpus resuelve la atribución de responsabilidad.** Varios la nombran como el
problema abierto, y ese patrón —reconocer sin resolver— es en sí mismo el hallazgo.

- **Pakistán** (`F1-DAIO-029`) sostiene que los LAWS *"son inmorales y —independientemente de su nivel
  de sofisticación— no pueden ser instruidos para adherir al DIH"*, y justifica un protocolo
  suplementario por *"las deficiencias del DIH como marco regulatorio"*. Un académico citado en el
  mismo estudio enmarca el problema como *"ambigüedades legales, brechas de responsabilidad y
  preocupaciones de escalamiento"*.
- **Polonia** (`F1-DAIO-030`) reconoce explícitamente *"los desafíos éticos relacionados con delegar
  autoridad de toma de decisiones a sistemas de combate, particularmente en el uso de medidas
  cinéticas para destruir blancos seleccionados"*, pero su estrategia *"provee poco detalle sobre
  consideraciones específicas en este sentido"*.
- **Rusia** (`F1-DAIO-013`) afirma que la pérdida de control humano significativo es inadmisible y que
  la responsabilidad recae en *"el operador del sistema o la programación"* —una disyunción que no
  resuelve nada— y simultáneamente **se opone a instrumentos vinculantes**, en parte porque las
  restricciones *"podrían frenar el ritmo del desarrollo ruso de IA"*.
- **Finlandia** (`F1-DAIO-018`) aporta el contrapunto útil: las mismas reglas del DIH deben aplicarse
  en principio a los sistemas autónomos, y además la IA tiene **potencial para *mejorar* el
  cumplimiento del DIH**. Pero su administración *"no se autorregula más estrictamente de lo que exige
  la ley"*.
- **Dinamarca** (`F1-DAIO-020`) es el caso de vacío puro: *"una falta general de gobernanza y
  directrices políticas"*, con un Ministro de Relaciones Exteriores que rechazó una prohibición
  nacional pero declaró ver *"necesidad de un marco internacional"*. El estudio califica la respuesta
  de "vaga" y "sintomática" de la tendencia a *"externalizar tales asuntos a foros internacionales"*.

**Riesgo concreto para una fuerza sin doctrina consolidada:** adoptar la herramienta antes de la
doctrina significa que el primer incidente definirá la política, en condiciones de crisis y
escrutinio. `F1-DAIO-033` (Rumanía) describe el resultado: marcos *"insuficientemente
institucionalizados"* e iniciativas que *"se estancan una vez terminan las fases piloto"*.

**El único método concreto en el corpus** para cerrar la brecha entre principio ético y requisito
técnico: la **ingeniería basada en valores con IEEE 7000-2021** que Alemania aplicó para hacer la IA
compatible con la *Innere Führung* de la Bundeswehr (`F1-DAIO-008`, `F1-DAIO-012`), partiendo de que
*"en caso de conflicto, la dignidad del enemigo también debe ser respetada y mantenida"*.

---

## 4. Dependencia tecnológica y de cadena de suministro

La cadena causal está completa en el corpus:

1. Los controles de exportación estadounidenses de **octubre de 2022** apuntaron a los semiconductores
   chinos y se justificaron *"expresamente por el imperativo de constrñir los avances chinos en IA de
   defensa"*, porque los sistemas chinos *"se están usando para mejorar la velocidad y precisión de la
   toma de decisiones, planeación y logística militares, así como de sus sistemas militares autónomos
   —como los usados en guerra electrónica cognitiva, radar, inteligencia de señales e interferencia—"*
   (`F1-DAIO-015`).
2. El EPL busca activamente **semiconductores avanzados de diseño estadounidense** y aprovecha modelos
   de lenguaje entrenados en **GPU estadounidenses** (`F1-CSET-115`).
3. China responde con controles propios: artículos de doble uso (`F1-CSET-002`), **tierras raras**
   (`F1-CSET-042`), catálogo de exportaciones prohibidas y restringidas de julio de 2025
   (`F1-CSET-058`), y 22 tecnologías de cómputo priorizadas hacia 2026 (`F1-CSET-066`).
4. **Rusia queda atrapada:** las sanciones y los controles estadounidenses *"han impuesto límites a
   los beneficios de la cooperación tecnológica de Rusia con China"* (`F1-DAIO-013`).

### Drones: la dependencia más aguda

`F1-CSET-009` (nov 2025): aunque EE. UU. lideró históricamente el desarrollo de drones militares,
*"el mercado comercial global está ahora dominado por plataformas de doble uso de bajo costo, muchas
producidas por empresas chinas"*. Incluso EE. UU. reaccionó con una orden ejecutiva y con
**Replicator** por *"preocupaciones sobre dependencias de cadena de suministro y controles de
exportación chinos"*. El informe advierte que persisten *"brechas significativas en datos públicos
disponibles, particularmente sobre capacidad de manufactura y resiliencia de la cadena de
suministro"*.

Si la mayor potencia militar del mundo considera esto un riesgo estratégico, para un país que importa
prácticamente todas sus plataformas el riesgo es de otro orden.

### Cómputo

**Brasil concentra más del 90 % de la capacidad de cómputo de alto rendimiento de América Latina**, y
**más de la mitad de los 19 países del ILIA carece de infraestructura crítica de cómputo**
(`F1-ILIA-004`, `F1-ILIA-005`). Sin cómputo soberano no se pueden entrenar ni afinar modelos sobre
datos operacionales clasificados sin exportarlos.

### Sistemas extranjeros embarcados

`F1-DAIO-035` plantea el problema con un caso concreto: los programas navales brasileños **Prosub** y
**Prosuper** *"incluirán sistemas electrónicos que hacen uso extensivo de IA"*, y el estudio deja la
pregunta abierta: *"Cómo acomodará la Armada brasileña estas soluciones de IA extranjeras queda por
verse."* El riesgo no es solo de suministro: es de **opacidad**. Un sistema de IA adquirido cuyo
comportamiento no se puede auditar es un sistema cuyo modo de falla se desconoce.

---

## 5. Escasez y fuga de talento: el cuello de botella dominante

Es el riesgo que más se repite en el corpus, por encima de cualquier limitación técnica o
presupuestal.

| Fuente | Hallazgo |
|---|---|
| `F1-DAIO-019` (Francia) | *"Uno de los mayores obstáculos para la operacionalización de la IA en las Fuerzas Armadas es el reto de recursos humanos: la capacidad de atraer y retener suficiente talento de IA."* |
| `F1-DAIO-033` (Rumanía) | *"Escasez de talento, competencia del sector privado y limitada alfabetización en IA dentro de las estructuras de mando militar reducen la demanda de soluciones avanzadas."* |
| `F1-DAIO-032` (Indonesia) | *"Escasez actual de talentos de IA"* como restricción central junto a las limitaciones fiscales |
| `F1-DAIO-013` (Rusia) | **Éxodo de personal científico cualificado**, en particular de TI, acelerado con la movilización de septiembre de 2022 |
| `F1-DAIO-025` (Taiwán) | Invierte el problema: *"ciertamente no hay escasez de talentos del lado civil"*; falta la infraestructura institucional para aprovecharlos |
| `F1-AIINDEX-023` | Los investigadores de IA que se mudan a EE. UU. cayeron **−89 % desde 2017**, con **−80 % solo en el último año** |
| `F1-ILIA-009` | *"La brecha de penetración relativa de talento en IA respecto del promedio mundial se ha ampliado con mayor rapidez desde 2022, traduciéndose en una **pérdida acelerada de talentos**."* |
| `F1-ILIA-005` | Colombia: talento humano avanzado **10,81 vs. promedio regional 13,32**, 7.º lugar, por *"oferta de posgrados en IA limitada"* |

La formulación más aguda es la de Rumanía: *"la innovación y adopción tecnológica de punta son tanto
un reto humano como técnico."* Y la advertencia operativa: sin *"incentivos estructurales,
trayectorias de carrera flexibles, metas de capacidad tangibles, líneas presupuestales dedicadas y una
visión estratégica unificada"*, no se retiene experticia ni se convierte experimentación en beneficio
operacional.

**Mitigaciones documentadas:**

- **Israel** (`F1-DAIO-017`): el servicio obligatorio y de reserva genera un intercambio único de personal entre FDI, academia e industria. Unidades como la **8200** y **LOTEM** alimentan indirectamente el ecosistema civil de IA. **La calidad del flujo de personal compensa la ausencia de estrategia central.**
- **EE. UU.** (`F1-CSET-069`): un líder senior "trilingüe" con **6 a 10 años** de permanencia, más ingenieros de IA incrustados en unidades operacionales.
- **Rusia** (`F1-DAIO-013`): compañías científicas militares (*nauchnye roty*) con conscriptos desde 2013.
- **Polonia** (`F1-DAIO-030`): clases uniformadas de TI bajo patrocinio del Comando Cibernético; más de **130 subtenientes** graduados de programas de ciberseguridad incorporados en agosto de 2025.

---

## 6. Proliferación y uso malicioso

- **Modelos de pesos abiertos.** El debate está recogido sin resolver: los críticos advierten que
  *"plantean riesgos de seguridad significativos, incluyendo la difusión de desinformación y la
  creación de armas biológicas"* (`F1-AIINDEX-008`). El contrapeso factual del mismo informe: la
  brecha de desempeño entre modelos cerrados y abiertos se redujo de **8,0 % (ene 2024) a 1,7 %
  (feb 2025)**, así que el argumento de que la brecha de capacidad limita el riesgo se está agotando.
  Ver también `F1-AIINDEX-050` (ecosistema chino de pesos abiertos) y `F1-CSET-111`.
- **Evaluación de uso malicioso.** `F1-CSET-114` ofrece la metodología: *How to Assess the Likelihood
  of Malicious Use of Advanced AI Systems*.
- **Vigilancia masiva.** Los RFP del EPL piden reconocimiento facial con identificación de perfil a
  60° con hasta **97 % de precisión**, almacenamiento de **5 millones de rostros y 5 millones de
  vehículos**, reconocimiento de voz y **análisis de marcha** (`F1-CSET-115`).
  `F1-ATLCOUNCIL-143` documenta que estas herramientas se difunden globalmente y que *"Estados
  autoritarios y democráticos por igual emplean crecientemente estos instrumentos para rastrear,
  vigilar, anticipar e incluso calificar el comportamiento de sus propios ciudadanos."*
- **Propaganda y engaño.** `F1-AIINDEX-048` (propaganda generada por IA), `F1-ATLCOUNCIL-137` (guerra
  de información como engaño militar y civil de todos los dominios). El EPL trata la guerra de opinión
  pública, psicológica y legal como elementos integrales de sus operaciones y desarrolla conceptos de
  **guerra cognitiva** (`F1-DAIO-015`).
- **Difusión hacia actores no estatales.** El corpus no lo trata directamente, pero la lógica es
  explícita: el mercado comercial está dominado por plataformas de doble uso de bajo costo
  (`F1-CSET-009`) y en Ucrania hay drones con IA para *"detección y enganche autónomo de blancos"*
  desarrollados por empresas pequeñas (`F1-DAIO-023`). La barrera de entrada a capacidades
  anteriormente estatales se está derrumbando. **Esta es la conexión más directa entre F1 y F3.**

---

## 7. El riesgo de segundo orden: el *hype* mismo

El corpus nombra la exageración como riesgo operativo, no como molestia retórica.

`F1-CSET-069` lo dice de frente:

> *"Las visiones populares de la inteligencia artificial militar pueden evocar una superinteligencia
> que todo lo ve dirigiendo enjambres de drones autónomos —mientras los miembros del servicio se
> sientan lejos del peligro y también de la toma de decisiones. Esta exageración sobre la IA todavía
> no se corresponde con la realidad. Más importante aún, **distrae de la oportunidad real**."*

`F1-DAIO-001` (*Beware the Hype*) dedica un estudio entero a demostrarlo, con el criterio
metodológico correcto: *"para proveer valor agregado militar, el cambio respectivo necesita ofrecer
elementos únicos que puedan traducirse en ventaja militar"*. Su ejemplo deflacionario es excelente:
usar UAV en la primera ola para cegar defensas aéreas *"no es único; más bien sigue conceptos SEAD
probados y comprobados, con la única diferencia de que tareas hasta ahora ejecutadas con aviones de
combate tripulados se delegan ahora a UAV, controlados por pilotos en centros de mando y control."*

Y `F1-AIINDEX-023` documenta el desbalance estructural que sostiene el problema:

> *"La IA responsable no está siguiendo el ritmo de la capacidad de la IA, con benchmarks de seguridad
> rezagados e incidentes en fuerte aumento. Casi todos los desarrolladores líderes de modelos de
> frontera reportan resultados en benchmarks de capacidad, pero el reporte de benchmarks de IA
> responsable sigue siendo irregular. […] Investigación reciente encontró que **mejorar una dimensión
> de IA responsable, como la seguridad, puede degradar otra, como la exactitud**."*

Esa última frase es la más incómoda del corpus: la seguridad y el desempeño pueden estar en conflicto
técnico directo, y el AI Index señala que *"ningún benchmark compara estos trade-offs"*, lo que hace
imposible saber si el campo está mejorando en gestionarlos.

**Riesgo derivado para el proyecto y para el pitch:** prometer capacidades que la tecnología no tiene
es el error más fácil de detectar por un jurado experto y el que más rápido destruye credibilidad. La
posición defendible es la de CSET: transferir tareas onerosas de baja complejidad de humanos a
máquinas, con el humano como última línea de defensa.

---

## Resumen: matriz de riesgos para el caso colombiano

| Riesgo | Severidad para Colombia | Evidencia principal |
|---|---|---|
| Escasez y fuga de talento avanzado | **Alta** — 10,81 vs. 13,32 regional; posgrados limitados | `F1-ILIA-005`, `F1-CSET-069` |
| Adoptar herramienta antes de doctrina | **Alta** — no hay doctrina de IA de defensa localizada | `F1-DAIO-033`, `F1-CSET-103` |
| Dependencia de cómputo y plataformas extranjeras | **Alta** — sin HPC de frontera, sin industria de drones | `F1-ILIA-004`, `F1-CSET-009` |
| Opacidad de sistemas de IA adquiridos | **Alta** | `F1-DAIO-035` |
| Fragilidad por cambio de contexto en geografía y conflicto irregular | **Alta** — los datos de comportamiento humano son los más difíciles | `F1-CSET-103` |
| IA como superficie de ataque en infraestructura crítica | **Media-alta** — ciberseguridad marcada como brecha | `F1-CSET-085`, `F1-ILIA-005` |
| Difusión de capacidades a actores armados no estatales | **Alta** — enlace directo con F3 | `F1-CSET-009`, `F1-DAIO-023` |
| Estancamiento post-piloto por falta de línea presupuestal | **Alta** — el CONPES 4144 no desagrega presupuesto de defensa | `F1-DAIO-033` |
| Cumplimiento simbólico de compromisos internacionales | **Media** — patrón regional documentado | `F1-ILIA-009` |
| Normas técnicas definidas por otros (ISO SC 42, SC 27) | **Media** | `F1-ILIA-009` |
| Sobrepromesa y pérdida de credibilidad institucional | **Media-alta** | `F1-CSET-069`, `F1-DAIO-001` |
