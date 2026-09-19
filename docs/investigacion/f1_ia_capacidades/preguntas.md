# F1 — Preguntas del jurado y respuestas del corpus

De las 50 preguntas de `C:/Programacion/ANDES/data/adl/queries.jsonl`, **las 16 primeras (q001–q016)
corresponden a F1**. Las q017–q032 son F2 (espacio) y las q033–q050 son F3 (dinámicas territoriales).
El corte es limpio: los `query_id` están ordenados por fenómeno.

Cada entrada trae: la respuesta que el corpus permite sostener, los doc_id de soporte y una nota de
cobertura cuando el corpus no alcanza.

---

## q001 — ¿Cómo está transformando la IA la capacidad de los Estados para prevenir, detectar y contrarrestar amenazas NBQR?

**Cobertura del corpus: BAJA.** Esta es la pregunta peor cubierta de las 16. No hay ningún documento
F1 sobre IA aplicada a defensa nuclear, biológica, química o radiológica.

Lo que sí se puede sostener, con honestidad sobre el alcance:

1. **El riesgo NBQR aparece en el corpus como riesgo *generado* por la IA, no como capacidad de
   defensa.** El debate documentado es sobre modelos de pesos abiertos: los críticos advierten que
   *"plantean riesgos de seguridad significativos, incluyendo la difusión de desinformación y la
   creación de armas biológicas"* (`F1-AIINDEX-008`, `F1-AIINDEX-002`, `F1-AIINDEX-021`).
2. **Existe actividad legislativa específica.** El Senado de EE. UU. presentó la *Artificial
   Intelligence and Biosecurity Risk Assessment Act*, que ordena al subsecretario de preparación y
   respuesta evaluar y atender amenazas a la salud pública y la seguridad nacional derivadas de avances
   técnicos en IA, con énfasis en *"el uso potencial de la IA, incluidos modelos de código abierto,
   para desarrollar agentes dañinos"*, monitoreo de riesgos biológicos globales e integración de
   resúmenes de evaluación de riesgo en la Estrategia Nacional de Seguridad Sanitaria
   (`F1-AIINDEX-021`).
3. **La bioseguridad está subexplorada incluso en la literatura.** El AI Index 2026 halló que, aunque
   la discusión ética en publicaciones de IA médica más que se duplicó en 2025 (43,4 % de las
   publicaciones frente a 37,1 % en 2024), la conversación es estrecha: *"la gobernanza domina el
   discurso, mientras la responsabilidad algorítmica, la **bioseguridad** y la equidad en salud global
   permanecen subexploradas"*. En 2025 hubo 1.228 publicaciones sobre gobernanza frente a 874 sobre
   preocupaciones societales, y *"a pesar de la atención que recibe la bioseguridad en las discusiones
   de política, el tema está relativamente poco explorado"* (`F1-AIINDEX-023`).
4. **Marco metodológico transferible.** `F1-CSET-114` (*How to Assess the Likelihood of Malicious Use
   of Advanced AI Systems*) es el instrumento del corpus más aplicable para evaluar el riesgo de uso
   malicioso, incluido el NBQR.
5. **Detección temprana de brotes.** `F1-ATLCOUNCIL-143` menciona la *"detección temprana de brotes"*
   entre las aplicaciones de vigilancia con IA que se difunden globalmente — la única conexión del
   corpus con detección de amenazas biológicas.
6. **Capacidades genéricas aplicables.** Las tres capacidades de fusión de sensores que el EPL busca
   (mejorar retornos débiles de un sensor, combinar múltiples sensores, fusión multimodal) incluyen
   sensores **hiperespectrales y de radiofrecuencia** (`F1-CSET-115`), que son precisamente las
   modalidades usadas en detección de agentes químicos y radiológicos. La inferencia es razonable pero
   **el corpus no la hace explícita**; hay que presentarla como interpretación.

**Doc_id de soporte:** `F1-AIINDEX-008`, `F1-AIINDEX-002`, `F1-AIINDEX-021`, `F1-AIINDEX-023`,
`F1-CSET-114`, `F1-CSET-115`, `F1-ATLCOUNCIL-143`.

**Qué debe decir el asistente:** que el corpus documenta sólidamente la IA como *amplificador de
riesgo* NBQR y la respuesta regulatoria, pero que la IA como *capacidad de detección y respuesta*
NBQR no está cubierta, y señalar qué tipo de fuente habría que consultar. No inventar sistemas.

---

## q002 — ¿Cómo se emplean los sistemas no tripulados potenciados por IA para aumentar la efectividad de las operaciones militares?

**Cobertura: ALTA.** Es una de las preguntas mejor respondidas.

**1. El principio conceptual: de la masa a la masa inteligente.**
`F1-DAIO-027`: *"No es la masa, sino la masa inteligente lo que importa — y las tácticas de IA dan
forma a esa inteligencia."* La IA puede **autoaprender comportamiento táctico complejo**, lo que va
más allá de "refinar tecnologías existentes con IA" y abre la puerta a comportamiento novedoso para
sorprender al oponente.

**2. La diferencia técnica con los enjambres convencionales.**
Enjambre tradicional: *"los miembros ejecutan trayectorias de vuelo preplaneadas y usan reglas
relativamente simples para mantener distancia, conservar formación o implementar patrones rudimentarios
de cooperación."* Enfoque con IA: **control distribuido**, donde cada miembro persigue sus propios
objetivos y aprende a cooperar; la cooperación resulta de un análisis de beneficio individual —*"los
miembros del enjambre cooperarán si renunciar a objetivos individuales les ayuda a lograr un objetivo
común de mayor valor"* (`F1-DAIO-027`).

**3. Los tres efectos medidos** contra una constelación de defensa aérea terrestre (`F1-DAIO-027`):

- **Eficiencia:** se necesitan menos efectores, así que *"potencialmente, más blancos pueden ser atacados con un número dado de activos no tripulados"*.
- **Efectividad:** el enjambre *"ajusta el tempo de misión a los requerimientos"*, lo que le permite optar por trayectorias **bajas y lentas para infiltrarse en la 'zona muerta'** del sistema de defensa aérea.
- **Emergencia:** *"la capacidad de responder instantáneamente a movimientos adversarios imprevistos, definiendo y delegando tareas y subtareas entre miembros del enjambre a velocidad de campaña."*

**4. Evidencia de empleo real en Ucrania** (`F1-DAIO-023`): el dron **SAKER SCOUT**, de la empresa
Saker, *"equipado con IA, se usa en Ucrania para detección y enganche autónomo de blancos"*. Otros
sistemas documentados: **Roboneers** (UGV para vigilancia, apoyo de fuego, logística y evacuación, con
estaciones de armas remotas y software de C2 táctico), **SkyLab** (UAS resistentes a interferencia y
*spoofing*: cuadricóptero de ataque Shoolika MK-6, UGV Sirko-S1), **MPS Development** (simuladores,
estaciones de control terrestre, centros de C2, gestión de tráfico de drones).

**5. Uso en apoyo, no solo en ataque.** Brasil usa IA en su Fuerza Aérea para *"mantenimiento, gestión
de flota y **análisis de imágenes satelitales y de drones**"* (`F1-DAIO-035`). Este es el empleo de
mayor retorno y menor riesgo para una fuerza que está empezando.

**6. La advertencia deflacionaria obligada.** `F1-DAIO-001`: usar UAV en la primera ola para cegar
defensas aéreas *"no es único; más bien sigue conceptos SEAD probados y comprobados, con la única
diferencia de que tareas hasta ahora ejecutadas con aviones de combate tripulados se delegan ahora a
UAV, controlados por pilotos en centros de mando y control."* Delegar una tarea a una plataforma no
tripulada no es, por sí mismo, innovación.

**Doc_id:** `F1-DAIO-027`, `F1-DAIO-023`, `F1-DAIO-005`, `F1-DAIO-028`, `F1-DAIO-035`, `F1-DAIO-001`,
`F1-CSET-009`, `F1-CSET-115`.

---

## q003 — ¿Qué lecciones dejan los conflictos recientes sobre el empleo de IA en operaciones militares?

**Cobertura: ALTA.** `F1-DAIO-001` y `F1-DAIO-023` son documentos dedicados exactamente a esto.

**Lección 1 — Ucrania es el primer conflicto donde ambas partes compiten en y con IA.**
Cita central de `F1-DAIO-023`: *"A diferencia de otros conflictos de los últimos 30 años, esta es una
guerra entre países tecnológicamente avanzados. Por tanto, ambos lados comenzaron a desarrollar y
desplegar soluciones de IA para tareas como inteligencia geoespacial, operaciones con sistemas no
tripulados, entrenamiento militar y guerra cibernética. En consecuencia, la guerra en Ucrania se
convirtió en el primer conflicto donde ambas partes compiten en y con IA, que se ha vuelto un
componente crítico del éxito."*

**Lección 2 — Un ecosistema civil de IA es un activo de defensa movilizable.**
Ucrania entró a la guerra con **más de 7.000 ingenieros de IA**, primer lugar de Europa del Este en
número de empresas de IA, y oficinas de I+D de Amazon, Google, Samsung y Grammarly. Pero su sector de
defensa *"usaba IA solo esporádicamente"*: industria estatal, centrada en hardware tradicional, sin
reputación de innovación en software. **La guerra cambió casi todos esos parámetros** (`F1-DAIO-023`).
La lección para Colombia: el ecosistema civil importa más que el presupuesto de defensa, pero solo si
existe un mecanismo de movilización.

**Lección 3 — La resiliencia inicial vino de abajo, no de arriba.**
Los factores de resiliencia de 2022, en el orden del estudio: uso más activo de sistemas de conciencia
situacional; **iniciativas voluntarias y privadas de IA**; **crowdsourcing de datos**; uso de
**plataformas de código abierto**; y avances en el **uso descentralizado** de los activos. La
institucionalización llegó después: *"a partir de 2023, el Consejo de Ministros comenzó a lanzar
iniciativas de política para avanzar más sistemáticamente la IA de defensa"* (`F1-DAIO-023`).

**Lección 4 — La validación en combate se volvió moneda competitiva.**
*"Desarrolladores extranjeros de soluciones de IA están usando la guerra como campo de prueba para
evaluar el desempeño de sus soluciones en el campo de batalla. Algunos observadores de defensa incluso
sostienen que las soluciones de IA que no [han sido probadas en combate quedan en desventaja]"*
(`F1-DAIO-023`). Confirmación independiente: el sistema anti-dron polaco **SKYctrl** fue *"probado en
combate en Ucrania desde 2022"*, y ese hito *"contribuyó a la adopción de los productos de la empresa
no solo por Polonia sino también por las fuerzas armadas de Arabia Saudita, EAU y Qatar"*
(`F1-DAIO-030`).

**Lección 5 — Cuidado con confundir novedad tecnológica con innovación militar.**
`F1-DAIO-001` adopta la definición de Andrew Ross —innovación militar es *"cambio en cómo las fuerzas
militares se preparan para, combaten y ganan guerras"*— y añade el criterio decisivo: *"para proveer
valor agregado militar, el cambio respectivo necesita ofrecer elementos únicos que puedan traducirse en
ventaja militar"*, en dimensiones conceptual/cultural, organizacional o tecnológica, y siempre en
contexto con los requerimientos operacionales. Y advierte: *"la innovación militar es un proceso, no un
resultado estático"*, que *"se difunde y puede ser amplificado por partidarios o anulado por
opositores"*.

**Lección 6 — La guerra electrónica es el campo de batalla real del corto plazo.**
Las tres conclusiones de `F1-DAIO-001` sobre Ucrania, Siria, Libia y Nagorno-Karabaj:

1. Los activos de GE fueron usados **principalmente por una sola parte**, dándole ventaja operacional considerable; en Ucrania el despliegue ruso enfrentó a un adversario tecnológicamente inferior, lo que *"plantea preguntas respecto a las consecuencias para la OTAN"*. Siria puede ser más representativa del espectro electromagnético *"saturado, congestionado y disputado"* de la guerra futura. Y la consideración rusa de la GE incluye *"atacar la industria de defensa del adversario"* como tarea dedicada, lo que pone el énfasis en el frente interno.
2. Expertos rusos concluyen que la GE debe volverse **elemento integral de la defensa aérea** y el medio primario para contrarrestar UAV; ante futuros enjambres, empresas rusas concluyeron que las defensas aéreas **requieren misiles miniatura *hit-to-kill***. Ya se refleja en módulos de autoprotección para UAV.
3. El uso de GE contra activos dependientes de señales de posicionamiento, navegación y temporización desde el espacio abre rutas de desarrollo distintas — **es el puente directo con F2**.

**Lección 7 — El factor proxy.** Uso intensivo de fuerzas proxy (mercenarios chadianos en Libia,
sirios en Nagorno-Karabaj, Wagner en Ucrania, Libia y Siria) que, aunque operaron como infantería
ligera, *"proveen mano de obra adicional, aumentan la negación plausible de actores externos y
disminuyen el costo político de potenciales bajas"*. Además, personal militar turco operó en la sala
de operaciones del GNA libio y entrenó libios en la Escuela de Defensa Turca *"para mejorar su
proficiencia en el manejo de equipo contra-dron turco"* (`F1-DAIO-001`).

**Dato disputado que hay que manejar con cuidado:** según Moscú, el sistema ruso Krasukha-4 hizo que
**36 de 59 misiles Tomahawk** fallaran en el ataque a Al-Shayrat (2017). `F1-DAIO-001` marca
explícitamente que *"la evidencia independiente es difícil de establecer"* y cita una visión
contraria. **Atribuir siempre a Moscú; nunca presentar como hecho.**

**Doc_id:** `F1-DAIO-001`, `F1-DAIO-023`, `F1-DAIO-030`, `F1-DAIO-013`, `F1-DAIO-033`, `F1-CSET-115`.

---

## q004 — ¿Qué riesgos representa la escasez de talento especializado en IA para el desarrollo de capacidades de defensa?

**Cobertura: MUY ALTA.** Es el riesgo más documentado del corpus. Ver `riesgos.md` §5.

**Tesis central** (`F1-CSET-069`, *Honchoing AI in the Air Force*, subtítulo: *"If AI Is Important, the
People Are Indispensable"*):

> *"Las visiones populares de la IA militar pueden evocar una superinteligencia que todo lo ve
> dirigiendo enjambres de drones autónomos —mientras los miembros del servicio se sientan lejos del
> peligro y también de la toma de decisiones. Esta exageración no se corresponde todavía con la
> realidad. Más importante aún, distrae de la oportunidad real."*

Los tres requisitos que identifica:

1. **Incrustar ingenieros de IA en unidades operacionales y de apoyo** para identificar, desarrollar e iterar aplicaciones rápidamente.
2. **Empoderar a un líder senior "trilingüe"** —fluido en tecnología, operaciones y adquisiciones— con permanencia de **6 a 10 años** para guiar y escalar la innovación.
3. **Retener talento crítico:** operadores, ingenieros y líderes.

Y la síntesis: *"mientras la difusión impulsa la amplitud y velocidad de la innovación en IA, el
liderazgo y la experticia aseguran su profundidad y dirección."*

**Evidencia comparada de que es el cuello de botella dominante:**

| País | Hallazgo |
|---|---|
| Francia | *"Uno de los mayores obstáculos para la operacionalización de la IA en las Fuerzas Armadas es el reto de recursos humanos: la capacidad de atraer y retener suficiente talento de IA"* (`F1-DAIO-019`) |
| Rumanía | *"Escasez de talento, competencia del sector privado y **limitada alfabetización en IA dentro de las estructuras de mando militar reducen la demanda de soluciones avanzadas**"* (`F1-DAIO-033`) |
| Indonesia | *"Escasez actual de talentos de IA"* junto a restricciones fiscales de largo plazo (`F1-DAIO-032`) |
| Rusia | Éxodo de personal científico cualificado, acelerado con la movilización de sep 2022 (`F1-DAIO-013`) |
| Brasil | *"La falta de personal cualificado constituye uno de los principales obstáculos"*; *"hasta la fecha no se han observado medidas para escalar significativamente el número de profesionales de defensa con experticia en IA"* (`F1-DAIO-035`) |
| Taiwán | *"Ciertamente no hay escasez de talentos del lado civil"*; el reto es **la infraestructura institucional** para aprovecharlos (`F1-DAIO-025`) |

**El mecanismo de daño, no solo el síntoma.** Rumanía explica cómo la escasez de talento destruye
capacidad: la baja alfabetización en IA en el mando **reduce la demanda de soluciones avanzadas**, por
lo que *"los marcos de innovación siguen insuficientemente institucionalizados y las iniciativas
prometedoras corren el riesgo de estancarse una vez terminan las fases piloto."* Sin *"incentivos
estructurales, trayectorias de carrera flexibles, metas de capacidad tangibles, líneas presupuestales
dedicadas y una visión estratégica unificada"*, no se retiene experticia ni se convierte
experimentación en beneficio operacional. Conclusión: *"la innovación y adopción tecnológica de punta
son tanto un reto humano como técnico"* (`F1-DAIO-033`).

**El contexto macro empeora el problema.** Los investigadores y desarrolladores de IA que se mudan a
EE. UU. cayeron **89 % desde 2017**, con **80 % de caída solo en el último año** (`F1-AIINDEX-023`).
Si la potencia con USD 285.900 millones de inversión privada pierde atractivo, la competencia por
talento es global y brutal. En ALC, *"la brecha de penetración relativa de talento en IA respecto del
promedio mundial se ha ampliado con mayor rapidez desde 2022, traduciéndose en una pérdida acelerada
de talentos"* (`F1-ILIA-009`).

**Mitigaciones documentadas:** el modelo israelí de flujo de personal entre FDI, academia e industria
vía servicio obligatorio y reserva, con unidades como la **8200** y **LOTEM** alimentando el ecosistema
civil (`F1-DAIO-017`); las *nauchnye roty* rusas (`F1-DAIO-013`); las clases uniformadas de TI polacas
bajo patrocinio del Comando Cibernético, con más de 130 subtenientes de ciberseguridad incorporados en
agosto de 2025 (`F1-DAIO-030`).

**Para Colombia:** talento humano avanzado en **10,81 puntos frente al promedio regional de 13,32**,
7.º lugar, por *"oferta de posgrados en IA limitada"* — pero **1.º regional en demanda de cursos de IA
con ≈5 veces el promedio** (`F1-ILIA-005`, `F1-ILIA-009`). Hay demanda sin oferta avanzada.

**Doc_id:** `F1-CSET-069`, `F1-CSET-071`, `F1-DAIO-019`, `F1-DAIO-033`, `F1-DAIO-032`, `F1-DAIO-013`,
`F1-DAIO-035`, `F1-DAIO-025`, `F1-DAIO-017`, `F1-DAIO-030`, `F1-AIINDEX-023`, `F1-ILIA-009`,
`F1-ILIA-005`, `F1-CSET-122`.

---

## q005 — ¿Qué implicaciones estratégicas tiene la dependencia de tecnologías extranjeras de IA para la autonomía y la seguridad nacional de Colombia?

**Cobertura: MEDIA-ALTA** para el mecanismo general; **BAJA** para el caso colombiano específico.

**1. La dependencia de cómputo es la restricción raíz.**
**Brasil concentra más del 90 % de la capacidad de cómputo de alto rendimiento de ALC**, y **más de la
mitad de los 19 países del ILIA carece de infraestructura crítica de cómputo** (`F1-ILIA-004`,
`F1-ILIA-005`, `F1-ILIA-009`). Colombia tiene HPC en 18,42 puntos (5.º lugar regional) y **cobertura 5G
de 15,3 puntos (10.º lugar)** (`F1-ILIA-005`). Sin cómputo soberano, afinar modelos sobre datos
operacionales clasificados obliga a exportarlos.

**2. El cómputo es ya un instrumento de coerción entre potencias.**
Los controles de exportación estadounidenses de octubre de 2022 sobre semiconductores se justificaron
*"expresamente por el imperativo de restringir los avances chinos en IA de defensa"*, porque los
sistemas chinos *"se están usando para mejorar la velocidad y precisión de la toma de decisiones,
planeación y logística militares, así como de sus sistemas militares autónomos"* (`F1-DAIO-015`).
China respondió con controles sobre doble uso (`F1-CSET-002`) y **tierras raras** (`F1-CSET-042`). Y
**Rusia quedó atrapada**: las sanciones occidentales y los controles estadounidenses *"han impuesto
límites a los beneficios de la cooperación tecnológica de Rusia con China"* (`F1-DAIO-013`). Un tercer
país que depende de ambos bloques está expuesto a los dos.

**3. Los sistemas de armas traen IA extranjera embarcada — y eso es opacidad, no solo suministro.**
El caso análogo más útil es brasileño: los programas navales **Prosub** (cuatro submarinos Scorpène y
uno nuclear) y **Prosuper** (cuatro fragatas clase Tamandaré) *"incluirán sistemas electrónicos que
hacen uso extensivo de IA"*, y `F1-DAIO-035` deja la pregunta abierta: *"Cómo acomodará la Armada
brasileña estas soluciones de IA extranjeras queda por verse."* Un sistema de IA cuyo comportamiento
no se puede auditar es un sistema cuyo modo de falla se desconoce.

**4. La dependencia en plataformas no tripuladas es estructural y global.**
*"El mercado comercial global está ahora dominado por plataformas de doble uso de bajo costo, muchas
producidas por empresas chinas"*, y EE. UU. reaccionó con la orden ejecutiva *"Unleashing American
Drone Dominance"* y la iniciativa **Replicator** por *"preocupaciones sobre dependencias de cadena de
suministro y controles de exportación chinos"* (`F1-CSET-009`). Si la mayor potencia militar lo
considera riesgo estratégico, para un importador neto el riesgo es de otro orden. El mismo informe
advierte que persisten *"brechas significativas en datos públicos sobre capacidad de manufactura y
resiliencia de la cadena de suministro"*.

**5. La dependencia también es normativa.**
El ILIA advierte sobre la escasa participación regional en **ISO SC 42 y SC 27**: *"Esta ausencia no es
solo simbólica: implica que las normas técnicas adoptadas por la región serán definidas por otros,
posiblemente sin considerar nuestros contextos sociotécnicos, realidades de infraestructura o valores
culturales"* (`F1-ILIA-009`). Y el riesgo del *"cumplimiento simbólico"*: firmar declaraciones
internacionales sin traducirlas en política interna.

**6. Colombia reconoce oficialmente la brecha industrial.**
El CONPES 4144 afirma: *"persiste un bajo nivel de capacidades en la industria nacional y al interior
del Sector Defensa para desarrollar estrategias de alta tecnología requeridos por la Fuerza Pública"*
([DNP](https://colaboracion.dnp.gov.co/CDT/Conpes/Econ%C3%B3micos/4144.pdf)). Y la EDAES 2042 fija
como visión *"autonomía tecnológica en sus capacidades satelitales"* al 2042
([FAC](https://www.fac.mil.co/sites/default/files/2026-03/edaes_2edicion.pdf)) — es decir, reconoce
que hoy no la tiene.

**7. La vía de mitigación que el corpus respalda: código abierto.**
El ILIA identifica el código abierto como *"la oportunidad para América Latina y el Caribe"* porque
*"permite generar soluciones locales sin depender de licencias privativas o infraestructuras costosas,
a la vez que fomenta [la colaboración regional]"* y *"promueve la transparencia algorítmica"*
(`F1-ILIA-009`). El argumento se fortalece con un dato técnico: la brecha entre el mejor modelo cerrado
y el mejor de pesos abiertos cayó de **8,0 % (ene 2024) a 1,7 % (feb 2025)** (`F1-AIINDEX-008`). Para
una fuerza con restricción presupuestal y exigencia de soberanía de datos, los modelos de pesos
abiertos desplegados localmente son la única opción que satisface ambas. Contrapeso obligado: el corpus
también recoge la advertencia de que los pesos abiertos *"plantean riesgos de seguridad
significativos"* (`F1-AIINDEX-008`, `F1-AIINDEX-050`, `F1-CSET-111`).

**Doc_id:** `F1-ILIA-004`, `F1-ILIA-005`, `F1-ILIA-009`, `F1-DAIO-015`, `F1-DAIO-013`, `F1-DAIO-035`,
`F1-CSET-009`, `F1-CSET-002`, `F1-CSET-042`, `F1-CSET-115`, `F1-AIINDEX-008` + CONPES 4144 y EDAES 2042
(web).

---

## q006 — ¿Qué riesgos operacionales y jurídicos implica incorporar IA en inteligencia militar sin doctrina, políticas y protocolos consolidados?

**Cobertura: ALTA.** `F1-CSET-103` responde el eje operacional casi punto por punto.

### Riesgos operacionales — el marco de tres ejes de CSET

**Alcance:** cambios de contexto (*"los sistemas de IA tienden a fallar si se usan en escenarios
significativamente distintos de sus datos de entrenamiento"*); confusión entre proyección física y
predicción de comportamiento humano; **sistemas de alcance mal definido** que *"sin casos de uso bien
definidos ni salvaguardas confunden a los operadores y llevan al mal uso"*; e **incertidumbre
irreducible** (*"preguntas como '¿qué hará el enemigo?' tienen un nivel inherente de incertidumbre que
no puede eliminarse. Los usuarios deben entender que la certeza es una meta imposible"*).

**Datos:** *"datos de alta calidad y relevantes son críticos pero difíciles de reunir y mantener. Los
datos de comportamiento humano son particularmente difíciles de usar eficazmente, por su
observabilidad indirecta y variabilidad demográfica."* Y: *"los comandantes militares tienen dificultad
para obtener datos precisos."* **Para inteligencia militar, que trabaja exactamente sobre
comportamiento humano en entorno adversarial, esta es la advertencia central.**

**Interacción humano-máquina:** ¿cómo entiende el operador las salidas? ¿cuáles son las capacidades y
límites que debe conocer?

### Riesgos jurídicos

La formulación de `F1-CSET-103`:

> *"Los humanos son la última línea de defensa para asegurar que el empleo de estos sistemas sea
> apropiado y se haga en cumplimiento del derecho internacional humanitario."*

Sin doctrina, esa "última línea de defensa" no tiene criterios. El corpus muestra que el problema de
atribución de responsabilidad **no está resuelto en ninguna jurisdicción**: Pakistán invoca *"las
deficiencias del DIH como marco regulatorio"* y habla de *"ambigüedades legales, brechas de
responsabilidad y preocupaciones de escalamiento"* (`F1-DAIO-029`); Polonia reconoce los desafíos de
delegar decisión a sistemas de combate pero *"provee poco detalle sobre consideraciones específicas"*
(`F1-DAIO-030`); Rusia sitúa la responsabilidad en *"el operador del sistema o la programación"*, una
disyunción que no resuelve nada (`F1-DAIO-013`).

### Riesgo institucional: el estancamiento post-piloto

`F1-DAIO-033` (Rumanía) describe el resultado de adoptar sin institucionalizar: *"los marcos de
innovación siguen insuficientemente institucionalizados, y las iniciativas prometedoras corren el
riesgo de estancarse una vez terminan las fases piloto."*

### Las mitigaciones concretas

De `F1-CSET-103`:

- **Criterios de despliegue basados en contexto y riesgo.** El comandante debe considerar tiempo, lugar y contexto de aplicación.
- **El despliegue debe ser reversible**, y *"ajustarse o terminarse conforme los factores en terreno cambien de maneras que afectarían el desempeño de la IA"*.
- Un proceso y criterios explícitos para el despliegue continuado, que consideren el alcance de la tecnología, el contexto operacional y **la preparación de la organización** para aprovechar el sistema *"conforme a reglas de enfrentamiento con tácticas, técnicas y procedimientos codificados y adaptados"*.

**El método para traducir principios en requisitos técnicos:** la ingeniería basada en valores con
**IEEE 7000-2021** que Alemania usó para compatibilizar la IA con la *Innere Führung* de la Bundeswehr
(`F1-DAIO-008`, `F1-DAIO-012`), partiendo de que *"en caso de conflicto, la dignidad del enemigo
también debe ser respetada y mantenida"*, apoyándose en el DIH y en el propio entendimiento moral
institucional.

**El modelo de gobernanza previa más cercano:** Brasil, donde *"los tres servicios han puesto esfuerzo
significativo en establecer marcos de gobernanza que aseguren el uso responsable de la IA de defensa en
pleno cumplimiento de las regulaciones nacionales e internacionales"* y *"están considerando la IA
principalmente para funciones de asistencia y apoyo, asegurándose de que los operadores humanos cedan
tan poco poder de decisión a la IA como sea posible"* (`F1-DAIO-035`).

Referencia normativa estadounidense: los cinco principios éticos del DoD adoptados en **febrero de
2020** (responsable, equitativo, trazable, confiable, gobernable) y la **Directiva 3000.09**, que
*"estableció salvaguardas para la autonomía en sistemas de armas"* (`F1-DAIO-009`).

**Doc_id:** `F1-CSET-103`, `F1-CSET-104`, `F1-CSET-125`, `F1-DAIO-029`, `F1-DAIO-030`, `F1-DAIO-013`,
`F1-DAIO-033`, `F1-DAIO-008`, `F1-DAIO-012`, `F1-DAIO-035`, `F1-DAIO-009`, `F1-DAIO-018`.

---

## q007 — ¿Qué desafíos plantea el empleo de sistemas autónomos o semiautónomos frente al DIH y la atribución de responsabilidades?

**Cobertura: ALTA** en posiciones estatales y arquitectura normativa; el corpus **documenta la brecha
de atribución sin resolverla**, y eso es exactamente lo que hay que reportar.

### El estado del régimen internacional

No existe instrumento vinculante. Tres capas (detalle completo en `global.md` §5):

- **CCW y su GGE sobre LAWS**, con los **Once Principios Rectores** endosados en 2019 (`F1-DAIO-034`).
- **Resolución 78/241 de la AGNU** (dic 2023), **proyecto L.77** en la Primera Comisión del 79.º periodo (oct 2024) y **Resolución 80/57** (dic 2025), que *"busca una respuesta urgente a las armas autónomas letales y una prohibición internacional"* (`F1-DAIO-029`, `F1-DAIO-034`). Conferencia de Viena *"Humanity at the Crossroads"* (abr 2024).
- **REAIM** (La Haya feb 2023 con su *Call to Action*; Seúl 2024 con el *Blueprint for Action*) y la **Political Declaration on Responsible Military Use of AI and Autonomy** lanzada por EE. UU. el 9 de noviembre de 2023 (`F1-DAIO-022`, `F1-DAIO-031`, `F1-CSET-098`).

Matiz importante del REAIM 2023 que suele omitirse: su *Call to Action* enfatizó la IA responsable
*"pero también planteó preocupaciones de que un énfasis indebido en regulaciones adicionales pudiera
obstaculizar el progreso tecnológico y plantear riesgos al avance de capacidades de defensa habilitadas
por IA"* (`F1-DAIO-022`). El foro no es unívocamente restrictivo.

### El espectro de posiciones estatales

| Posición | Estado | Contenido |
|---|---|---|
| **Prohibicionista** | Pakistán | Primer Estado en pedir prohibición completa (**2013**); los LAWS *"son inmorales y —independientemente de su nivel de sofisticación— no pueden ser instruidos para adherir al DIH"*; propone enfoque de dos niveles con prohibiciones y restricciones en la CCW; endosó el resumen de Viena 2024 (`F1-DAIO-029`) |
| **Control humano + estabilidad estratégica** | China | Documento de posición ante la CCW (2021): *"los sistemas de armas deben estar bajo control humano"*, con *"la interacción humano-máquina necesaria a lo largo de todo el ciclo de vida"*; llama a *"abstenerse de buscar ventaja militar absoluta"*; en feb 2023 pidió *"oponerse a buscar ventaja militar absoluta y hegemonía a través de la IA"* y firmó la declaración no vinculante. Sus escritos sobre guerra "inteligentizada" enfatizan el **equipo híbrido humano-máquina, con la inteligencia de máquina como aumento y no reemplazo del control humano** (`F1-DAIO-015`) |
| **Retórica de control, rechazo a lo vinculante** | Rusia | La pérdida de control humano significativo *"es inadmisible"*, y la responsabilidad recae en *"el operador del sistema o la programación"*; pero será *"muy difícil desarrollar criterios de qué significa 'significativo' sin politizar el asunto"*, y **se opone sistemáticamente a instrumentos vinculantes**, en parte porque frenarían el ritmo de su desarrollo (`F1-DAIO-013`) |
| **Dos pasos europeo** | Dinamarca, Bélgica, Finlandia, Polonia | Regulación conforme al DIH como centro; Dinamarca rechazó prohibición nacional pero ve *"necesidad de un marco internacional"* (`F1-DAIO-020`); Bélgica coauspició la Resolución 80/57 y jugó papel clave en los Once Principios (`F1-DAIO-034`) |
| **Pragmatismo pro-desarrollo** | Finlandia | Las mismas reglas del DIH aplican en principio a los sistemas autónomos, **y la IA tiene potencial para *mejorar* el cumplimiento del DIH**; pero *"no se autorregula más estrictamente de lo que exige la ley"* y la regulación *"no debe impedir el desarrollo de soluciones de IA éticamente justificadas, necesarias y apropiadas"* (`F1-DAIO-018`) |
| **Regulación nacional** | EE. UU., Corea del Sur | Directiva **3000.09** del DoD y cinco principios éticos de feb 2020 (`F1-DAIO-009`); ley coreana de IA aprobada en ene 2025, vigente desde ene 2026 (`F1-CSET-062`) |

### La brecha de atribución, explícitamente

Ningún documento del corpus la resuelve. Pakistán la usa como argumento para un protocolo
suplementario que *"fortalecerá el marco legal internacional que controla los LAWS"* reconociendo
*"las deficiencias del DIH como marco regulatorio"* (`F1-DAIO-029`). Polonia reconoce *"los desafíos
éticos relacionados con delegar autoridad de toma de decisiones a sistemas de combate, particularmente
en el uso de medidas cinéticas para destruir blancos seleccionados"* pero *"provee poco detalle"*
(`F1-DAIO-030`). **El patrón —reconocer sin resolver— es la norma.**

### Lo que sí ofrece el corpus como respuesta práctica

1. **El humano como última línea de defensa**, con despliegue reversible y criterios basados en contexto y riesgo (`F1-CSET-103`).
2. **Ingeniería basada en valores con IEEE 7000-2021** como método para traducir obligaciones éticas y jurídicas en requisitos técnicos (`F1-DAIO-008`, `F1-DAIO-012`).
3. **Diseño conservador por defecto**: IA en funciones de asistencia y apoyo, con los operadores cediendo el mínimo poder de decisión (`F1-DAIO-035`).

### Precisión terminológica obligada

`F1-AIINDEX-017` advierte, sobre su propio dataset de autonomía militar: *"Este no es un dataset que
liste Sistemas de Armas Autónomas Letales (LAWS), sino un dataset destinado a mapear el desarrollo de
la autonomía en sistemas militares. **Muchos de los sistemas incluidos no son sistemas de armas**, sino
sistemas militares no armados que presentan algunas capacidades autónomas notables."* Y añade que el
dataset *"no es verdaderamente global ni exhaustivo"* y que *"algunos países no son transparentes sobre
sus programas de desarrollo y adquisición de armas"*. **Confundir autonomía con letalidad es el error
conceptual más común en este debate.**

**Doc_id:** `F1-DAIO-029`, `F1-DAIO-034`, `F1-DAIO-013`, `F1-DAIO-015`, `F1-DAIO-018`, `F1-DAIO-020`,
`F1-DAIO-022`, `F1-DAIO-030`, `F1-DAIO-031`, `F1-DAIO-008`, `F1-DAIO-012`, `F1-DAIO-009`,
`F1-DAIO-035`, `F1-CSET-103`, `F1-CSET-098`, `F1-CSET-062`, `F1-AIINDEX-017`, `F1-AIINDEX-012`,
`F1-ATLCOUNCIL-107`.

---

## q008 — ¿Cómo emplean las fuerzas militares el análisis de inteligencia asistido por IA, el *targeting* inteligente y los enjambres de drones, y qué oportunidades representan para países con geografías complejas como Colombia?

**Cobertura: ALTA** en las tres capacidades; la extrapolación a Colombia es interpretación fundada.

### Análisis de inteligencia asistido por IA

El caso mejor documentado es el estadounidense. **Project Maven** —originalmente el *Algorithmic
Warfare Cross-Functional Team*— nació para aplicar IA contra ISIS (`F1-DAIO-009`). El resultado
medido: el **XVIII Cuerpo Aerotransportado** con el **Maven Smart System** logró con un equipo de
**20 personas** lo que en 2003 requería **2.000** (`F1-CSET-125`). Los AI-DSS de esa familia están hoy
desplegados en cuarteles de mandos combatientes en todo el mundo.

Del lado chino, los RFP del EPL piden (`F1-CSET-115`):

- **AI-DSS que aprovechen datos de fuente abierta para toma de decisiones estratégica.**
- Síntesis de información textual de fuente abierta sobre *"cambios de política, tendencias tecnológicas, investigación de laboratorios extranjeros, informes de think tanks, dinámica epidémica o 'eventos especiales'"*.
- Análisis de audio y video con traducción al inglés como capacidad clave.
- Traducción automática de *"textos, documentos e imágenes en ucraniano"*.
- Agregación y almacenamiento de datos de recursos empresariales y de fuente abierta.

### Fusión de sensores y *targeting*

`F1-CSET-115` describe tres niveles de sofisticación creciente en el procesamiento de datos de
sensores militares y comerciales —ópticos, infrarrojos, **hiperespectrales**, de radiofrecuencia y
geomagnéticos—:

1. Usar IA para **mejorar retornos débiles o degradados** de un sensor individual.
2. Sistemas que **combinan datos de múltiples sensores para localizar e identificar objetos**, en particular **blancos terrestres vistos desde plataformas aéreas o espaciales**.
3. Lo más ambicioso: **capacidades de fusión multimodal**.

El nivel 2 es exactamente el caso de uso de una fuerza aeroespacial con satélites propios y drones.

### Enjambres

Ver q002. Lo esencial: control distribuido con cooperación aprendida, que produce eficiencia (menos
efectores por blanco), efectividad (tempo adaptable, infiltración por la zona muerta del sistema de
defensa aérea) y emergencia (redefinición de tareas a velocidad de campaña) (`F1-DAIO-027`).

### La oportunidad para Colombia

Esta parte es **interpretación fundada en el corpus**, no cita directa. Debe presentarse como tal.

**1. El caso de uso de mayor retorno y menor riesgo ya está identificado y es análogo.** La Fuerza
Aérea brasileña usa IA para *"mantenimiento, gestión de flota y **análisis de imágenes satelitales y de
drones**"* (`F1-DAIO-035`). La FAC tiene **FACSAT-1 y FACSAT-2** y drones en inventario. Hay datos
propios, la tarea es de clasificación acotada, el valor operacional es inmediato y la exposición
jurídica es mínima. Encaja además con el nivel 2 de fusión de sensores de `F1-CSET-115`.

**2. La geografía compleja es simultáneamente la oportunidad y el riesgo.** Oportunidad: gran extensión
con baja densidad de observación es el escenario donde el análisis automatizado de imágenes tiene mayor
ventaja marginal sobre el analista humano. Riesgo: `F1-CSET-103` advierte que *"los sistemas de IA
tienden a fallar si se usan en escenarios significativamente distintos de sus datos de
entrenamiento"* — y la selva, el páramo y el manglar colombianos están severamente subrepresentados en
los conjuntos de datos comerciales de detección satelital. **La ventaja solo se materializa si se
construyen datos propios.** Esto conecta directamente con q012.

**3. La formación descentralizada tiene un modelo probado.** El Ejército brasileño usa educación a
distancia y simuladores *"para asegurar que el personal en áreas remotas, como la Amazonía, tenga
acceso al mismo estándar de formación tecnológica que las unidades en centros urbanos"*
(`F1-DAIO-035`). Colombia tiene el mismo problema y **cobertura 3G del 100 %, primera de la región**,
pero 5G en 15,3 puntos (`F1-ILIA-005`). **Diseñar para 3G, no para 5G** — es una restricción de
arquitectura, no un impedimento.

**4. La EDAES 2042 ya lo compromete.** La FAC proyecta *"dependencias que gestionen sistemas autónomos,
enjambres de drones y vehículos espaciales no tripulados"*, *"toma de decisiones asistida por la IA"* y
*"autonomía en inteligencia, contrainteligencia y ciberinteligencia aérea y espacial"*
([EDAES 2042](https://www.fac.mil.co/sites/default/files/2026-03/edaes_2edicion.pdf)).

**5. Empezar por lo no cinético.** `F1-CSET-125` es el argumento más fuerte: los AI-DSS sirven para
mucho más que *targeting*. Sus dos casos de estudio son deliberadamente logísticos —reabastecimiento de
munición y el **Ciclo Conjunto de Asignación de Tareas Aéreas (JATC)**— y permitirían ejecutar procesos
*"más rápido, con más flexibilidad y con menos personal, manteniendo calidad y juicio humano"*. Para el
JATC, abrirían la oportunidad de revisar el cronograma de **72 horas** vigente desde décadas. Para una
fuerza aérea con operaciones dispersas y recursos limitados, la planeación de salidas y el
sostenimiento son el retorno más grande y el riesgo jurídico más bajo.

**Doc_id:** `F1-CSET-125`, `F1-CSET-115`, `F1-CSET-103`, `F1-DAIO-009`, `F1-DAIO-027`, `F1-DAIO-035`,
`F1-DAIO-023`, `F1-ILIA-005` + EDAES 2042 (web).

---

## q009 — ¿Cómo está redefiniendo la IA las tácticas y conceptos de operación en los conflictos armados contemporáneos?

**Cobertura: ALTA.** `F1-DAIO-027` y `F1-DAIO-005` son documentos dedicados a tácticas emergentes.

**1. La IA no solo mejora tácticas existentes: genera tácticas nuevas.**
`F1-DAIO-027` marca la diferencia: la IA puede **autoaprender comportamiento táctico complejo**, lo
que *"empuja el sobre de conceptos y tecnología más allá del patrón actual de refinar tecnologías
existentes con IA. Las tácticas de IA abren la puerta a comportamiento novedoso en el campo de batalla
para sorprender al oponente y ganar la delantera."*

**2. Concepto nuevo: "smart mass".** *"No es la masa, sino la masa inteligente lo que importa."* Es un
desplazamiento doctrinal explícito respecto a la lógica de saturación por cantidad.

**3. Descentralización del mando y control como principio táctico.**
`F1-DAIO-005` (GhostPlay) desarrolla el caso defensivo: redes federadas de defensa aérea que coordinan
sensores y efectores *"mediante comportamiento emergente sin ayuda de soluciones de C2 centrales y
jerárquicas"*. La clave es de supervivencia: *"GhostPlay incrusta la capacidad de C2 en cada elemento
de la red de defensa aérea en lugar de delegar el C2 a un sistema dedicado **que los adversarios
pueden identificar y atacar**. Este enfoque hace la red mucho más fluida, ágil y resiliente."*
El nodo de C2 deja de ser el centro de gravedad atacable.

**4. Diagnóstico de por qué los UAV han ganado la mano.**
`F1-DAIO-005`: *"en los conflictos más recientes los UAV ganaron la delantera frente a la defensa
aérea, porque las soluciones de defensa aérea han sido **frágiles** (*brittle*). La fragilidad resulta
de una falta de integración adecuada de todos los sensores y efectores relevantes para crear una
federación potente de defensa aérea."* El problema es de integración y coordinación, no de calidad
individual de los sistemas.

**5. Un hueco de capacidad concreto en la OTAN.** *"Las capacidades de Supresión de Defensas Aéreas
Enemigas (SEAD) se han atrofiado en la mayoría de las naciones de la UE/OTAN desde el fin de la Guerra
Fría"* (`F1-DAIO-005`).

**6. Contraevolución documentada.** Expertos rusos concluyeron que ante futuros ataques de enjambre
*"las defensas aéreas requieren misiles miniatura de impacto directo (hit-to-kill)"*, y ya aparecen
**módulos de autoprotección para UAV** (`F1-DAIO-001`). La táctica y la contratáctica coevolucionan.

**7. Aceleración del tempo decisional como cambio de concepto.**
La cita del almirante Brad Cooper (11 de marzo de 2026): *"las herramientas avanzadas de IA pueden
convertir procesos que solían tomar horas y a veces incluso días en segundos"*, precedida por su
afirmación de que *"los humanos siempre tomarán las decisiones finales sobre qué disparar y qué no
disparar y cuándo disparar"* (`F1-CSET-125`). El mismo documento plantea revisar el ciclo de **72
horas** del JATC.

**8. Guerra cognitiva y dominio de la información.** El EPL trata la guerra de opinión pública,
psicológica y legal como *"elementos integrales de las operaciones"*, *"dando pleno juego a la función
operacional militar del trabajo político"*, y desarrolla conceptos de **guerra cognitiva**
(`F1-DAIO-015`). `F1-ATLCOUNCIL-137` aborda la guerra de información como engaño militar y civil de
todos los dominios hacia 2030.

**9. La espiral de conceptos entre grandes potencias.** El concepto chino MDPW es descrito por
funcionarios estadounidenses como respuesta a **JADC2**; pero autores del EPL reconocen que la
**Tercera Estrategia de Compensación** estadounidense —para la cual *"la IA provee la salsa
tecnológica"*— responde a su vez al desarrollo chino de capacidades **A2/AD** (`F1-DAIO-015`).

**10. El freno de realidad.** `F1-DAIO-001` insiste en que delegar a un UAV una tarea SEAD antes hecha
por un caza tripulado *"no es único"*. Y `F1-DAIO-015` recuerda que el EPL *"sigue muy lejos de
implementar usos revolucionarios de la IA de defensa"*.

**Doc_id:** `F1-DAIO-027`, `F1-DAIO-005`, `F1-DAIO-028`, `F1-DAIO-001`, `F1-DAIO-015`, `F1-DAIO-023`,
`F1-CSET-125`, `F1-CSET-115`, `F1-ATLCOUNCIL-137`.

---

## q010 — ¿Qué capacidades basadas en IA fortalecen la detección, identificación y neutralización de drones utilizados por actores armados?

**Cobertura: MEDIA-ALTA.** Hay sistemas concretos documentados, pero dispersos en estudios país.

### Sistemas C-UAS con IA identificados en el corpus

**SKYctrl** (Advanced Protection Systems, Polonia) — `F1-DAIO-030`:
> *"La IA y el aprendizaje automático están también entre las tecnologías clave usadas en el sistema
> anti-dron SKYctrl. El sistema integra, entre otros componentes, **radares 3D MIMO, sistemas de
> seguimiento e identificación apoyados por IA, así como interferidores (jammers)**, y está
> reportadamente listo para integrarse con sistemas hard-kill."*
Fue *"probado en combate en Ucrania desde 2022"*, y ese hito *"contribuyó a la adopción de los
productos de la empresa no solo por Polonia sino también por las fuerzas armadas de Arabia Saudita,
EAU y Qatar."*

**Merops** (EE. UU., entregado a Rumanía) — `F1-DAIO-033`:
> *"A finales de 2025, EE. UU. suministró a Rumanía el sistema compacto contra-dron Merops para
> pruebas, como parte de esfuerzos más amplios de la OTAN para fortalecer las defensas aéreas en el
> Flanco Oriental de la Alianza. El sistema Merops, desarrollado por EE. UU., **usa IA para detectar,
> clasificar y neutralizar sistemas aéreos no tripulados hostiles incluso en entornos con interferencia
> o comunicaciones interrumpidas**."*
Este último detalle es el más importante operacionalmente: la capacidad de funcionar bajo *jamming* es
lo que separa un sistema útil de una demostración.

**Programa East Shield / *Tarcza Wschód*** (Polonia) — `F1-DAIO-030`:
> *"Estas soluciones incluirán el despliegue de sistemas de detección y seguimiento de drones,
> incorporando **radares, imagen térmica y monitoreo acústico**. Estas capacidades fortalecerán la
> capacidad de contrarrestar vehículos aéreos no tripulados, que se han vuelto crecientemente
> prevalentes en conflictos recientes, como lo demuestra la guerra en Ucrania."*
El mismo estudio documenta el uso de IA en la "barrera técnica" modernizada en la frontera con
Bielorrusia.

**Omega360** (Fincantieri–Barzan Holdings, Qatar) — `F1-DAIO-031`: MoU de 2024 para un sistema
anti-dron con suministro y producción local de radares Omega360, que *"incluye componentes de IA para
detectar, clasificar e identificar amenazas de drones"*. El estudio anota la incógnita relevante: *"No
está claro si este proyecto también involucra transferencia de IA a Qatar como parte de la producción
local"* — un problema de dependencia tecnológica idéntico al de q005.

**Piranha Tech** (Ucrania) — `F1-DAIO-023`: *"desarrolla y produce herramientas de guerra electrónica
como interferidores de radio para misiones contra-UAS."*

**Equipo contra-dron turco** — `F1-DAIO-001`: personal turco entrenó a libios en la Escuela de Defensa
Turca *"para mejorar su proficiencia en el manejo de equipo contra-dron turco"*.

**GhostPlay** — `F1-DAIO-005`: el enfoque más avanzado conceptualmente. Modela defensa aérea que
*"aprende comportamiento táctico superior que resiste y contrarresta enjambres de UAV"* mediante redes
federadas con C2 distribuido. Su diagnóstico de la fragilidad de la defensa aérea actual (falta de
integración de sensores y efectores) es el marco correcto para evaluar cualquier adquisición C-UAS.

### El patrón técnico común

Los sistemas efectivos combinan cuatro elementos:

1. **Sensores múltiples y heterogéneos:** radar 3D MIMO, imagen térmica, monitoreo acústico, radiofrecuencia.
2. **IA para detección, clasificación e identificación** (distinguir dron hostil de ave, de dron propio, de aeronave civil) — el problema difícil no es detectar, es clasificar.
3. **Efectores graduados:** *soft kill* (interferencia) y *hard kill* (interceptación cinética).
4. **Resiliencia a degradación**: operar bajo *jamming* y con comunicaciones interrumpidas (Merops).

Y la lección de contraevolución: ante enjambres, *"las defensas aéreas requieren misiles miniatura de
impacto directo (hit-to-kill)"* (`F1-DAIO-001`), porque el costo por interceptación con misiles
convencionales es insostenible contra plataformas de bajo costo.

### Advertencia estructural sobre el adversario

`F1-CSET-009`: *"el mercado comercial global está ahora dominado por plataformas de doble uso de bajo
costo, muchas producidas por empresas chinas."* El actor armado no estatal se abastece del mercado
comercial civil, que es global, barato y de ciclo de renovación rápido. La amenaza C-UAS es
estructuralmente asimétrica en costo. **Esta es la conexión más directa entre F1 y F3.**

### Brecha para Colombia

**La EDAES 2042 no menciona "contra-dron" ni "anti-dron".** Contempla defensa aérea de largo alcance,
interdicción y guerra electrónica, pero no una capacidad C-UAS con IA explícita
([EDAES 2042](https://www.fac.mil.co/sites/default/files/2026-03/edaes_2edicion.pdf)). Dado que es la
amenaza más inmediata y mejor documentada en Ucrania, Polonia y Rumanía, es la brecha doctrinal más
señalable. *El inventario C-UAS efectivamente desplegado por la Fuerza Pública colombiana queda por
verificar.*

**Doc_id:** `F1-DAIO-030`, `F1-DAIO-033`, `F1-DAIO-031`, `F1-DAIO-005`, `F1-DAIO-023`, `F1-DAIO-001`,
`F1-CSET-009`, `F1-CSET-115`.

---

## q011 — ¿Cuáles son las principales barreras para incorporar IA en los procesos operacionales y de inteligencia de las Fuerzas Militares?

**Cobertura: MUY ALTA.** Los 27 estudios país del DAIO son, en esencia, un catálogo comparado de
barreras. El patrón es notablemente consistente: **las barreras dominantes son organizacionales, no
tecnológicas.**

### Barrera 1 — Falta de autoridad para obligar a colaborar

El fracaso relativo del JAIC estadounidense es el caso mejor documentado: aunque bien financiado,
*"carecía de autoridad real 'para obligar a los servicios militares y otras instituciones a
colaborar'"* en proyectos de IA, y quedó *"dividido entre ser un desarrollador de algoritmos y ser un
habilitador que ayuda a los servicios militares a descubrir cómo desarrollar e implementar
algoritmos"* (`F1-DAIO-009`). La lección: crear una oficina de IA sin autoridad transversal produce
una oficina, no capacidad.

### Barrera 2 — Talento y alfabetización en el mando

La formulación de Rumanía es la más precisa sobre el mecanismo de daño (`F1-DAIO-033`):
> *"Escasez de talento, competencia del sector privado y **limitada alfabetización en IA dentro de las
> estructuras de mando militar reducen la demanda de soluciones avanzadas**. Por eso los marcos de
> innovación siguen insuficientemente institucionalizados, y las iniciativas prometedoras corren el
> riesgo de estancarse una vez terminan las fases piloto."*

No es solo que falte quien construya: falta quien sepa pedir. Ver q004 para el desarrollo completo.

### Barrera 3 — Fragmentación entre servicios

Brasil: *"solo unas pocas iniciativas limitadas dentro de las Fuerzas Armadas y **poca integración
entre ellas**"*; *"la cooperación entre servicios para avanzar la IA es limitada"* (`F1-DAIO-035`).
Israel: *"a mayo de 2023 no existe un único organismo israelí responsable de supervisar el campo de la
IA de defensa"* (`F1-DAIO-017`). El título mismo del estudio brasileño —*Fragmented Efforts*— es el
diagnóstico.

### Barrera 4 — Ausencia de estrategia, presupuesto y gestión central

Israel: *"el desafío de competir en una carrera global ferozmente agresiva por el dominio en el campo
de la IA, **sin una estrategia nacional, presupuesto ni gestión central apropiados** para
sostenerlo"* (`F1-DAIO-017`). Dinamarca: *"una falta general de gobernanza y directrices políticas"*
más *"una falta de claridad conceptual en el discurso político y público danés sobre la IA de defensa"*
derivada de *"una brecha entre el nivel nacional de ambición y [la realidad]"* (`F1-DAIO-020`).
Rumanía señala la ausencia de *"líneas presupuestales dedicadas"* como causa del estancamiento
post-piloto (`F1-DAIO-033`).

### Barrera 5 — Datos

`F1-CSET-103`: *"datos de alta calidad y relevantes son críticos para sistemas de IA efectivos, pero
difíciles de reunir y mantener"*, y *"los comandantes militares tienen dificultad para obtener datos
precisos"*. Finlandia identifica el problema y su solución: la disponibilidad de datos de entrenamiento
*"necesita asegurarse **derribando barreras legales y organizacionales**, mejorando los sistemas de
almacenamiento de datos y habilitando el intercambio de datos sin comprometer la integridad y la
protección apropiada"* (`F1-DAIO-018`). Brasil muestra el costo del extremo opuesto: *"el énfasis de
Brasil en la soberanía nacional, que limita el intercambio de datos, constituye un desafío para la
cooperación internacional en IA de defensa"* (`F1-DAIO-035`).

### Barrera 6 — Restricciones fiscales y de infraestructura

Indonesia: *"esta ambición se topa con una realidad dura caracterizada por las **restricciones fiscales
de larga data** del país, la escasez actual de talentos de IA y los riesgos percibidos de la tecnología
de IA"*, lo que produce un enfoque *"muy cuidadoso e incremental — análogo a una caminata cuidadosa
sobre una capa fina de hielo"* (`F1-DAIO-032`). Brasil: *"las restricciones de recursos y un arreglo
institucional subdesarrollado, así como la falta de personal cualificado, constituyen actualmente los
principales obstáculos"* (`F1-DAIO-035`).

### Barrera 7 — Desconexión con el ecosistema civil

Taiwán invierte el problema y da la formulación más útil (`F1-DAIO-025`):
> *"Ciertamente no hay escasez de talentos del lado civil de la ecuación […] El desafío parecía estar
> en montar la infraestructura apropiada donde el establecimiento de defensa de Taiwán pueda
> beneficiarse y aprovechar adecuadamente los esfuerzos civiles de base, **sin una noción preconcebida
> de cuál debería ser la ruta de desarrollo**."*
Y una recomendación incómoda pero honesta: *"dejar de instrumentalizar la innovación y la industria de
defensa para obtener ganancias económicas"*.

### Barrera 8 — La cultura de la adquisición

`F1-DAIO-009` resume el problema estructural estadounidense: *"la infraestructura organizacional y
burocrática no estaba bien adaptada a una tecnología que, por definición, era amplia en sus formas,
aplicaciones y casos de uso."* El ciclo de adquisición de plataformas no sirve para software que se
itera semanalmente.

### Barrera 9 — La exageración como distractor

`F1-CSET-069`: la mitología de la superinteligencia *"distrae de la oportunidad real"*, que es
*"transferir de humanos a máquinas las tareas onerosas de baja complejidad"*.

### Síntesis aplicada a Colombia

| Barrera | Evidencia para Colombia |
|---|---|
| Talento avanzado | 10,81 vs. 13,32 regional; posgrados en IA limitados (`F1-ILIA-005`) |
| Capacidades industriales y sectoriales | *"bajo nivel de capacidades en la industria nacional y al interior del Sector Defensa"* (CONPES 4144) |
| Presupuesto de IA de defensa | Sin desagregar en el CONPES 4144; sin líneas identificables en la EDAES |
| Institucionalidad | *"células de innovación"* son objetivo de la EDAES, no hecho; sin laboratorio de IA de defensa documentado (*por verificar*) |
| Datos | 2.º regional en capacidad de datos (70,53) — **esta no es una barrera, es una fortaleza** (`F1-ILIA-009`) |
| Infraestructura | 5G en 15,3 puntos, 10.º lugar; sin HPC de frontera (`F1-ILIA-005`, `F1-ILIA-004`) |
| Desconexión civil-militar | Red civil de IA robusta (Los Andes/CinfonIA, AudacIA, SCALAC) **sin vínculo documentado con defensa** |

**Doc_id:** `F1-DAIO-009`, `F1-DAIO-033`, `F1-DAIO-035`, `F1-DAIO-017`, `F1-DAIO-020`, `F1-DAIO-032`,
`F1-DAIO-025`, `F1-DAIO-018`, `F1-DAIO-019`, `F1-CSET-103`, `F1-CSET-069`, `F1-ILIA-005`,
`F1-ILIA-009`.

---

## q012 — ¿Cómo puede la experiencia operacional acumulada por las Fuerzas Militares convertirse en conocimiento útil para entrenar sistemas de IA?

**Cobertura: MEDIA.** El corpus no tiene un documento dedicado, pero aporta todos los elementos para
una respuesta fundada. **Es, además, la pregunta donde Colombia tiene la ventaja comparativa más
genuina.**

### Por qué importa para Colombia específicamente

`F1-DAIO-035` explica que el atraso regional en IA de defensa se debe a que *"la ausencia de conflictos
convencionales y el hecho de que América Latina se considera una 'zona de paz' ha reducido las
inversiones en defensa durante los últimos 40 años"*. Colombia es la excepción: gasta **3 % del PIB**
—el triple de Brasil— y la FAC es descrita como *"una de las fuerzas más entrenadas y con mayor
experiencia en combate en el continente después de la Fuerza Aérea de los Estados Unidos"*
([Wikipedia ES](https://es.wikipedia.org/wiki/Fuerza_A%C3%A9rea_Colombiana)).

**Décadas de experiencia operacional continua en geografía compleja e ISR sobre conflicto irregular es
un activo que ningún otro país de la región tiene.** Es el insumo que no se puede comprar ni importar.

### La advertencia que debe encabezar cualquier respuesta

`F1-CSET-103` es inequívoco sobre los límites:

- *"Los sistemas de IA tienden a fallar si se usan en escenarios significativamente distintos de sus datos de entrenamiento."*
- *"Hay una diferencia importante entre predicciones basadas en leyes físicas y aquellas que involucran interacciones humanas. Para las últimas, carecemos de modelos precisos y de datos observados directamente."*
- *"Los datos de comportamiento humano son particularmente difíciles de usar eficazmente, debido a su observabilidad indirecta y variabilidad demográfica."*
- *"Datos sesgados: los comandantes militares tienen dificultad para obtener datos precisos."*
- **Incertidumbre irreducible:** *"preguntas como '¿qué hará el enemigo?' tienen un nivel inherente de incertidumbre que no puede eliminarse."*

**Implicación práctica:** la experiencia operacional es excelente insumo para tareas de **percepción
acotada** (detectar una pista clandestina, clasificar una embarcación, reconocer un patrón logístico) y
mal insumo para **predicción de comportamiento adversario**. La respuesta honesta distingue los dos
usos.

### Vías documentadas en el corpus

**1. Aprendizaje por refuerzo en simulación adversarial.**
`F1-DAIO-005` y `F1-DAIO-027` modelan *"soluciones basadas en IA para defensa aérea y enjambres
agresores que aprenden a superarse mutuamente"*. La experiencia operacional entra como **modelo del
entorno y del adversario** dentro del simulador, no como etiquetas de un dataset supervisado. Es la vía
más viable cuando los datos reales son escasos o clasificados. `F1-DAIO-028` la extiende a combate
naval.

**2. Entornos de simulación institucionales.**
El modelo concreto es brasileño: **ASA-SimaaS** (*Ambiente de Simulação Aeroespacial*) de la Fuerza
Aérea, *"un servicio de simulación personalizado basado en la nube para crear, configurar y ejecutar
simulaciones de escenarios de defensa"* (`F1-DAIO-035`). Convierte doctrina y experiencia en escenarios
ejecutables y reutilizables.

**3. Crowdsourcing y datos descentralizados.**
Ucrania obtuvo resiliencia en 2022 mediante *"crowdsourcing de datos"*, *"iniciativas voluntarias y
privadas de IA"*, *"uso de plataformas de código abierto"* y *"avances en el uso descentralizado de los
respectivos activos"* (`F1-DAIO-023`). Es el precedente de que la captura distribuida de datos
operacionales funciona bajo presión.

**4. Modelos de lenguaje para corpus doctrinal e institucional.**
El EPL busca *"síntesis habilitada por IA de información basada en texto de fuente abierta"* y
capacidades de análisis de audio y video (`F1-CSET-115`). Aplicado al propio acervo: informes de
misión, lecciones aprendidas, doctrina y órdenes de operaciones son un corpus institucional
inmediatamente aprovechable, **y es exactamente lo que hace un asistente conversacional como el de
este reto.**

**5. Modelos específicos de lengua y contexto local.**
Israel montó el **Plan Nacional de Procesamiento de Lenguaje Natural** con la Autoridad de Innovación,
IMOD DDR&D y el Ministerio de Innovación, Ciencia y Tecnología, *"enfocado específicamente en atender
los desafíos únicos que plantean lenguas semíticas como el hebreo y el árabe"* (`F1-DAIO-017`). El
paralelo colombiano: variedades del español, jerga operacional, toponimia local y lenguas indígenas
están subrepresentadas en modelos comerciales.

**6. Fusión de sensores propios.**
El nivel 2 de las tres capacidades de fusión que busca el EPL —*"sistemas que combinan datos de
múltiples sensores para localizar e identificar objetos, particularmente blancos terrestres vistos
desde plataformas aéreas o espaciales"*— es directamente aplicable a los históricos de imágenes de
FACSAT y de drones de la FAC (`F1-CSET-115`).

### El prerrequisito que el corpus subraya

Nada de esto funciona sin gobernanza de datos. Finlandia lo formula como tarea explícita: asegurar la
disponibilidad de datos de entrenamiento *"derribando barreras legales y organizacionales, mejorando
los sistemas de almacenamiento de datos y habilitando el intercambio de datos sin comprometer la
integridad y la protección apropiada de los datos"* (`F1-DAIO-018`).

**Colombia está bien posicionada para esto:** 2.º lugar regional en el pilar Capacidad del Barómetro de
Datos (**70,53**) y 3.º en Gobernanza (**67,25**) (`F1-ILIA-009`). Es la fortaleza que hace viable esta
línea de trabajo. Pero el ILIA advierte el riesgo regional: *"la ciberseguridad cuenta con marcos
normativos robustos en la región, pero estos no siempre se traducen en capacidades operativas"* — y la
ficha de Colombia marca las capacidades de ciberseguridad como brecha a cerrar (`F1-ILIA-005`).

### El compromiso ya existente

La EDAES 2042 contempla *"organización orientada a gestión del conocimiento: la toma de decisiones se
basará en modelos organizacionales que utilicen inteligencia artificial y análisis masivo de datos"* y
*"empleo de la inteligencia artificial y el análisis masivo de datos en el proceso de toma de
decisiones"*
([EDAES 2042](https://www.fac.mil.co/sites/default/files/2026-03/edaes_2edicion.pdf)).

**Doc_id:** `F1-CSET-103`, `F1-CSET-115`, `F1-CSET-125`, `F1-DAIO-005`, `F1-DAIO-027`, `F1-DAIO-028`,
`F1-DAIO-035`, `F1-DAIO-023`, `F1-DAIO-017`, `F1-DAIO-018`, `F1-ILIA-009`, `F1-ILIA-005` + EDAES 2042
(web).

---

## q013 — ¿Cuáles son las principales amenazas cibernéticas que afectan el despliegue seguro de sistemas de IA en infraestructuras críticas?

**Cobertura: ALTA.** `F1-CSET-085` y `F1-CSET-100` responden directamente.

### La tesis que hay que entender primero

`F1-CSET-085` empieza reconociendo el alcance del problema: *"el dominio ciber toca casi todos los
sistemas y aspectos de la sociedad, así que cualquier cambio en el balance relativo ofensa-defensa en
ciber podría ser muy impactante. Como tecnología digital, se puede esperar que la IA tenga un efecto
más directo sobre esos balances que en otros dominios."*

Y la conclusión, deliberadamente no concluyente, que debe citarse con esa honestidad:
> *"No hay una respuesta única a la pregunta de si la IA hará dominante la ofensiva o la defensa
> cibernética. Los atacantes y defensores tienen demasiados objetivos distintos que pueden lograrse de
> múltiples formas, **pero es probable que la IA cambie el panorama ciber de maneras que pueden
> predecirse y quizá controlarse hasta cierto punto**."*

Las cinco categorías de análisis: cambios al ecosistema digital, endurecimiento de entornos digitales,
aspectos tácticos de los enfrentamientos digitales, incentivos y oportunidades, y efectos estratégicos
en conflicto y crisis.

### Las amenazas específicas al despliegue de IA

**1. Los componentes de IA son ellos mismos vulnerables.**
> *"Los sistemas de IA podrían reemplazar debilidades humanas conocidas, **pero los componentes de IA
> son frecuentemente vulnerables**."* (`F1-CSET-085`)
Sustituir un operador humano falible por un modelo introduce una superficie de ataque nueva, no solo
elimina una antigua.

**2. Concentración excesiva de información y control.**
> *"Los componentes de IA también podrían **agregar demasiada información o control en blancos
> digitales de alto riesgo**."* (`F1-CSET-085`)
Un AI-DSS que fusiona todas las fuentes de un teatro se convierte en el punto único de compromiso más
valioso del sistema. El mismo razonamiento que lleva a GhostPlay a **distribuir el C2 en cada elemento
de la red** en lugar de centralizarlo en *"un sistema dedicado que los adversarios pueden identificar y
atacar"* (`F1-DAIO-005`) aplica a la arquitectura de datos.

**3. Pérdida de resiliencia por eliminación de controles manuales.**
> *"**Eliminar controles manuales podría reducir la resiliencia durante los ataques.**"* (`F1-CSET-085`)
Es la advertencia más directamente aplicable a infraestructura crítica: la automatización que mejora la
eficiencia en operación normal puede eliminar la vía de recuperación bajo ataque. El documento se dirige
explícitamente a *"diseñadores de sistemas, funcionarios de adquisición"*.

**4. Expansión de la superficie defensiva.**
La IA *"aumentará el alcance de las tareas defensivas al hacer el ecosistema digital más grande y más
complejo"*, aunque *"también puede reducir el alcance de las tareas defensivas de otras maneras, como
disminuyendo el número de conexiones de red a monitorear"* (`F1-CSET-085`).

**5. Ataques a escala por adversarios inteligentes.**
`F1-CSET-095` (*Defending Against Intelligent Attackers at Large Scales*) y `F1-CSET-100` (*The Impact
of AI on the Cyber Offense-Defense Balance and the Character of Cyber Conflict*) desarrollan el
escenario de ataques automatizados de gran volumen.

**6. Adversarios estatales invirtiendo en ambos lados de la ecuación.**
`F1-CSET-115`: los RFP del EPL en comunicaciones y ciber demuestran que *"China está buscando y
experimentando activamente con una amplia variedad de soluciones para proteger sus redes y sondear las
redes de otros. Estos hallazgos sustancian aún más las advertencias de los profesionales de
ciberseguridad sobre el potencial de la IA para volver el ciberespacio menos seguro y la necesidad
urgente de adoptar soluciones de IA para ciberdefensa."*

**7. Uso malicioso y modelos abiertos.**
`F1-CSET-114` (*How to Assess the Likelihood of Malicious Use of Advanced AI Systems*) provee el marco
de evaluación. El debate sobre pesos abiertos —riesgos de seguridad significativos frente a una brecha
de capacidad que se cerró de 8,0 % a 1,7 % entre enero de 2024 y febrero de 2025— está en
`F1-AIINDEX-008` y `F1-CSET-111`.

**8. Incidentes en aumento y medición insuficiente.**
Los incidentes de IA documentados subieron a **362 en 2025** desde 233 en 2024 (`F1-AIINDEX-023`), y
*"la IA responsable no está siguiendo el ritmo de la capacidad de la IA, con benchmarks de seguridad
rezagados"*. Peor: *"mejorar una dimensión de IA responsable, como la seguridad, puede degradar otra,
como la exactitud"*, y ningún benchmark compara ese *trade-off*. `F1-CSET-011` sistematiza los
mecanismos de daño a partir de incidentes reales.

### Relevancia para Colombia

La ficha del ILIA marca **las capacidades de ciberseguridad como una de las brechas explícitas** que
Colombia debe cerrar para avanzar de etapa (`F1-ILIA-005`). Y el diagnóstico regional aplica
directamente: *"en ciberseguridad y protección de datos hay avances legales, pero sin capacidades
técnicas suficientes"*; *"la ciberseguridad cuenta con marcos normativos robustos en la región, pero
estos no siempre se traducen en capacidades operativas en la materia"* (`F1-ILIA-009`).

El CONPES 4144 identifica *"la ciberseguridad y ciberdefensa"* entre las áreas clave de IA para el
sector Defensa ([DNP](https://colaboracion.dnp.gov.co/CDT/Conpes/Econ%C3%B3micos/4144.pdf)), y la
EDAES 2042 compromete formación en ciberdefensa *"en todos los niveles de la Fuerza"* y proyectos de
*"autonomía en inteligencia, contrainteligencia y ciberinteligencia aérea y espacial"*. Brasil ya usa
IA *"para apoyar la ciberdefensa"* (`F1-DAIO-035`) — precedente regional concreto.

**Nota de alcance:** el corpus trata la ciberseguridad de sistemas de IA en general y el balance
ofensa-defensa. **No contiene** un análisis de amenazas a infraestructura crítica colombiana
específica (sector eléctrico, hidrocarburos, financiero). *Por verificar* el estado del Comando
Conjunto Cibernético y de la política sectorial de ciberseguridad de infraestructura crítica.

**Doc_id:** `F1-CSET-085`, `F1-CSET-100`, `F1-CSET-095`, `F1-CSET-114`, `F1-CSET-115`, `F1-CSET-011`,
`F1-CSET-013`, `F1-CSET-111`, `F1-DAIO-005`, `F1-DAIO-035`, `F1-AIINDEX-023`, `F1-AIINDEX-008`,
`F1-ILIA-005`, `F1-ILIA-009`.

---

## q014 — ¿Cómo limita la disponibilidad de infraestructura de cómputo avanzado el desarrollo de capacidades nacionales de IA para defensa?

**Cobertura: ALTA** para el mecanismo y las cifras regionales.

### La concentración regional es el dato central

> *"Brasil concentra más del 90 % de la capacidad de cómputo de alto rendimiento de la región. Aunque
> Uruguay, Costa Rica y **Colombia** muestran mejores indicadores per cápita en Unidades de
> Procesamiento Gráfico (GPU), **más de la mitad de los países carece de infraestructura crítica**."*
> (`F1-ILIA-005`, `F1-ILIA-004`, `F1-ILIA-009`)

Colombia: **HPC en 18,42 puntos, 5.º lugar regional**; **cobertura 5G en 15,3 puntos, 10.º lugar**;
velocidad de descarga móvil 25,6 puntos, 13.º lugar (`F1-ILIA-005`). Es uno de los cuatro países con
industria robusta de centros de datos (con Brasil, Chile y México) (`F1-ILIA-009`) —capacidad de
alojamiento— pero sin cómputo científico de frontera.

### El mecanismo de limitación, en cuatro pasos

**1. Sin cómputo soberano no hay entrenamiento sobre datos clasificados.** Afinar un modelo con datos
operacionales exige exportarlos a una nube extranjera o renunciar al afinamiento. Ninguna de las dos
opciones es aceptable para inteligencia militar. El corpus no lo formula así explícitamente, pero es la
consecuencia directa de combinar la escasez de HPC (`F1-ILIA-005`) con el requisito de soberanía de
datos que Brasil ya enfrenta (`F1-DAIO-035`).

**2. El cómputo se volvió instrumento de coerción geopolítica.** Los controles estadounidenses de
octubre de 2022 se justificaron *"expresamente por el imperativo de restringir los avances chinos en IA
de defensa"*, porque los sistemas de supercomputación chinos *"se están usando para mejorar la
velocidad y precisión de la toma de decisiones, planeación y logística militares, así como de sus
sistemas militares autónomos —como los usados en guerra electrónica cognitiva, radar, inteligencia de
señales e interferencia— y para mejorar los cálculos en el diseño y prueba de armas"* (`F1-DAIO-015`).
El acceso al cómputo es hoy una variable de política exterior, no de mercado.

**3. Incluso el actor mejor dotado depende de hardware ajeno.** El EPL *"busca semiconductores
avanzados de diseño estadounidense, así como aprovecha modelos de lenguaje entrenados en GPU
estadounidenses"* (`F1-CSET-115`). Si China no logra independencia de cómputo, la expectativa realista
para un país de ingreso medio es dependencia estructural.

**4. La escala del gasto global hace inviable competir.** Google reportó más de **USD 150.000 millones**
de capex anual en 2025; la capacidad de energía de centros de datos de IA llegó a **29,6 GW**,
comparable al estado de Nueva York en demanda pico (`F1-AIINDEX-023`). El corpus también documenta que
*"la sostenibilidad del cómputo raramente se menciona en las conversaciones actuales sobre gobernanza de
la IA"* (`F1-ATLCOUNCIL-178`), y `F1-ATLCOUNCIL-150` aborda directamente *"la brecha de cómputo en IA"*.

### Lo que el corpus ofrece como salida

**1. Código abierto y modelos pequeños.** El ILIA identifica el código abierto como *"la oportunidad
para América Latina y el Caribe"* porque *"permite generar soluciones locales sin depender de licencias
privativas o infraestructuras costosas"* (`F1-ILIA-009`). El respaldo técnico: la brecha entre el mejor
modelo cerrado y el mejor de pesos abiertos cayó de **8,0 % a 1,7 %** entre enero de 2024 y febrero de
2025 (`F1-AIINDEX-008`). Y el AI Index 2026 documenta que **el tamaño no lo es todo**: un modelo de
lenguaje de proteínas de 111 millones de parámetros superó a los métodos líderes previos, y un modelo
genómico de 200 millones de parámetros *"superó a un modelo casi 200 veces más grande"*
(`F1-AIINDEX-023`). Para tareas acotadas de defensa —clasificación de imágenes satelitales,
mantenimiento predictivo, análisis de texto doctrinal— los modelos pequeños afinados localmente son
suficientes y viables.

**2. La inversión regional se está reactivando.** *"La inversión en centros de datos soberanos y
privados, de distintas escalas, se ha reactivado con fuerza durante este año en la región, con
inversiones públicas de casi **200 USD millones** en total, y anuncios privados que superan los **8.000
USD millones** en los próximos 10 años"* (`F1-ILIA-009`).

**3. Cooperación regional.** **SCALAC** (Sistema de Cómputo Avanzado para América Latina y el Caribe),
cuyo coordinador general Carlos Barrios es colombiano, aparece en los créditos del ILIA 2025
(`F1-ILIA-006`, `F1-ILIA-009`). Es el vehicio institucional existente para acceso compartido a HPC.

**4. Diseñar para la infraestructura que existe.** Colombia tiene **cobertura 3G del 100 %, primera de
la región**, y 5G en 15,3 puntos (`F1-ILIA-005`). Cualquier capacidad desplegada a unidades remotas
debe asumir 3G. El precedente brasileño de formación por educación a distancia y simuladores para
unidades amazónicas funciona bajo esa restricción (`F1-DAIO-035`).

### Compromiso institucional colombiano

El CONPES 4144 asigna al DAPRE, con MinTIC, DNP, **Ministerio de Defensa Nacional** e IGAC, la tarea de
diseñar entre 2025 y 2027 *"una estrategia para el fortalecimiento de infraestructura tecnológica de IA
en el sector público"*, con diagnóstico de necesidades, plan de fortalecimiento sectorial y *"plan de
cofinanciamiento y alianzas público privadas y academia"*
([DNP](https://colaboracion.dnp.gov.co/CDT/Conpes/Econ%C3%B3micos/4144.pdf)). **Es la línea de acción
del CONPES donde Defensa aparece nominalmente.** La EDAES 2042 contempla un *"Complejo espacial FAC"* y
un *"centro nacional de ensamble (laboratorios)"* como requerimientos de infraestructura.

**Doc_id:** `F1-ILIA-004`, `F1-ILIA-005`, `F1-ILIA-009`, `F1-ILIA-006`, `F1-DAIO-015`, `F1-DAIO-035`,
`F1-CSET-115`, `F1-AIINDEX-023`, `F1-AIINDEX-008`, `F1-ATLCOUNCIL-150`, `F1-ATLCOUNCIL-178` + CONPES
4144 y EDAES 2042 (web).

---

## q015 — ¿Qué riesgos estratégicos genera la dependencia de semiconductores y hardware especializado para el desarrollo de capacidades militares basadas en IA?

**Cobertura: ALTA.** El corpus documenta la cadena completa de la guerra de semiconductores.

### Riesgo 1 — El hardware es una palanca de coerción, y ya se usó como tal

Los controles de exportación estadounidenses de **octubre de 2022** sobre el sector de semiconductores
chino fueron *"oficialmente justificados por la necesidad de restringir las capacidades de
supercomputación e IA de China"*, con el argumento textual de que tales sistemas *"están siendo usados
para mejorar la velocidad y precisión de la toma de decisiones, planeación y logística militares de
China, así como de sus sistemas militares autónomos, como los usados en guerra electrónica cognitiva,
radar, inteligencia de señales e interferencia, y para mejorar los cálculos en el diseño y prueba de
armas"* (`F1-DAIO-015`). El mismo estudio señala que *"el temor al potencial chino fue suficiente para
que EE. UU. introdujera a finales de 2022 controles de exportación severos […] expresamente
justificados por el imperativo de constreñir los avances chinos en IA de defensa"*.

**La lección estratégica:** el hardware de IA ya es un instrumento declarado de política de seguridad.
Cualquier país que dependa de un proveedor único queda expuesto a decisiones ajenas.

### Riesgo 2 — La escalada es bidireccional y ningún tercero está cubierto

China respondió con su propio arsenal de controles, todo traducido en el corpus:

| Medida | doc_id |
|---|---|
| Regulación de control de exportaciones de artículos y tecnologías de doble uso (supervisión del Ministerio de Comercio) | `F1-CSET-002` |
| Expansión de controles a **tierras raras**, con aprobación gubernamental requerida para exportadores chinos y extranjeros | `F1-CSET-042` |
| Catálogo actualizado de exportaciones prohibidas y restringidas (jul 2025) | `F1-CSET-058` |
| 22 tecnologías relacionadas con cómputo priorizadas hacia 2026, con convocatoria a empresas e institutos | `F1-CSET-066` |
| Prioridades del 15.º Plan Quinquenal aprobadas en el 5.º Pleno del XX Comité Central (oct 2025) | `F1-CSET-008` |

Contexto adicional: `F1-CSET-019` (SIA Factbook 2024 sobre la industria estadounidense),
`F1-ATLCOUNCIL-174` (*Chip Security Act* y "comercio confiable" con socios de EE. UU.),
`F1-ATLCOUNCIL-062` (siguiente fase del desacople), `F1-CSET-045` y `F1-CSET-053` (*Big Tech in Taiwan*
y la concentración geográfica del riesgo), `F1-CSET-076` (Oxford Semiconductor Conference sobre
alineamiento entre socios y aliados en tecnologías críticas).

### Riesgo 3 — Quedar atrapado entre bloques

El caso ruso es la demostración: *"las sanciones occidentales y los controles de exportación
estadounidenses que restringen el acceso de China a tecnología extranjera **han impuesto límites a los
beneficios de la cooperación tecnológica de Rusia con China**"* (`F1-DAIO-013`). Rusia no fue
sancionada por EE. UU. en este eje específico: fue afectada por sanciones dirigidas a su socio. **Un
tercer país que depende de cadenas que atraviesan ambos bloques hereda los riesgos de los dos.**

### Riesgo 4 — La dependencia persiste incluso con voluntad política y recursos

El EPL, con fusión militar-civil y fondos estatales de USD 184.000 millones desplegados en IA entre
2000 y 2023 (`F1-AIINDEX-023`), **sigue buscando semiconductores estadounidenses** y modelos entrenados
en GPU estadounidenses. CSET concluye que *"relajar los controles de exportación facilitaría el
desarrollo y uso chino de tecnologías C5ISRT habilitadas por IA"* (`F1-CSET-115`). Si el segundo actor
mundial no logra independencia, la expectativa realista para Colombia es gestionar la dependencia, no
eliminarla.

### Riesgo 5 — Plataformas: la dependencia más inmediata

`F1-CSET-009`: *"el mercado comercial global está ahora dominado por plataformas de doble uso de bajo
costo, muchas producidas por empresas chinas. En respuesta a preocupaciones sobre dependencias de
cadena de suministro y controles de exportación chinos, el gobierno de EE. UU. está priorizando el
crecimiento de una industria doméstica de drones autosuficiente"* —vía la orden ejecutiva *"Unleashing
American Drone Dominance"* y **Replicator**. El informe advierte que persisten *"brechas significativas
en datos públicamente disponibles, particularmente sobre capacidad de manufactura y resiliencia de la
cadena de suministro, ambos factores críticos"*. Es decir: **ni EE. UU. conoce bien su propia
exposición**.

Y el problema de inversión: *"la actividad de inversión se concentra en empresas que producen drones
comerciales más pequeños, mientras el interés de capital de riesgo es limitado en desarrolladores de
sistemas militares más grandes"* (`F1-CSET-009`).

### Riesgo 6 — Opacidad de la IA embarcada en sistemas adquiridos

El caso brasileño es el más útil por análogo: **Prosub** (cuatro submarinos Scorpène y uno nuclear) y
**Prosuper** (cuatro fragatas clase Tamandaré) *"incluirán sistemas electrónicos que hacen uso extensivo
de IA"*, y `F1-DAIO-035` deja la pregunta abierta: *"Cómo acomodará la Armada brasileña estas soluciones
de IA extranjeras queda por verse."* En el Golfo, el corpus documenta el mismo patrón con acuerdos de
radares con IA y la duda recurrente sobre si incluyen transferencia tecnológica (`F1-DAIO-031`).
**Un sistema de IA cuyo comportamiento no se puede auditar es un sistema cuyo modo de falla se
desconoce.**

### Mitigaciones que el corpus respalda

1. **Diversificación de proveedores y cooperación con "socios confiables"** (`F1-ATLCOUNCIL-174`, `F1-CSET-076`).
2. **Exigir transferencia tecnológica y auditabilidad en los contratos**, dado que el propio corpus registra como problema abierto la falta de claridad al respecto (`F1-DAIO-031`, `F1-DAIO-035`).
3. **Código abierto y modelos pequeños** para reducir la dependencia de cómputo de frontera (`F1-ILIA-009`, `F1-AIINDEX-008`, `F1-AIINDEX-023`).
4. **Participar en la definición de estándares.** El ILIA advierte que la ausencia regional en **ISO SC 42 y SC 27** implica que *"las normas técnicas adoptadas por la región serán definidas por otros"* (`F1-ILIA-009`).
5. **Reconocimiento oficial como punto de partida.** El CONPES 4144 ya admite el *"bajo nivel de capacidades en la industria nacional y al interior del Sector Defensa para desarrollar estrategias de alta tecnología requeridos por la Fuerza Pública"*, y la EDAES 2042 fija *"autonomía tecnológica en sus capacidades satelitales"* como visión 2042 y un *"centro nacional de ensamble"* como requerimiento de infraestructura.

**Doc_id:** `F1-DAIO-015`, `F1-DAIO-013`, `F1-DAIO-031`, `F1-DAIO-035`, `F1-CSET-115`, `F1-CSET-009`,
`F1-CSET-002`, `F1-CSET-042`, `F1-CSET-058`, `F1-CSET-066`, `F1-CSET-008`, `F1-CSET-019`, `F1-CSET-045`,
`F1-CSET-076`, `F1-AIINDEX-023`, `F1-AIINDEX-008`, `F1-ATLCOUNCIL-174`, `F1-ATLCOUNCIL-062`,
`F1-ILIA-009` + CONPES 4144 y EDAES 2042 (web).

---

## q016 — ¿Qué ventajas estratégicas obtienen los actores que incorporan IA y drones de bajo costo, y cuáles son los riesgos de retrasar la transformación tecnológica en defensa?

**Cobertura: ALTA.** Es la pregunta que mejor cierra el fenómeno, porque combina la evidencia de
Ucrania con el argumento de costo de oportunidad.

### Las ventajas

**1. Asimetría de costo.** El mercado está dominado por *"plataformas de doble uso de bajo costo"*
(`F1-CSET-009`). Contra ellas, la contraevolución documentada es reveladora: empresas rusas de guerra
electrónica concluyeron que ante enjambres *"las defensas aéreas requieren misiles miniatura de impacto
directo (hit-to-kill)"* (`F1-DAIO-001`) — precisamente porque interceptar drones baratos con misiles
caros es insostenible. **El actor de bajo costo impone al defensor una ecuación económica perdedora.**

**2. Eficiencia en el uso de activos escasos.** El enjambre con tácticas de IA necesita *"menos [efectores]
para enfrentar una constelación GBAD, lo que significa que —potencialmente— más blancos pueden ser
atacados con un número dado de activos no tripulados"* (`F1-DAIO-027`). Para una fuerza con inventario
limitado, la ganancia es directa.

**3. Efectividad por adaptación de tempo.** El enjambre *"ajusta el tempo de misión a los
requerimientos"*, permitiendo *"trayectorias bajas y lentas para infiltrarse en la 'zona muerta' del
GBAD"* (`F1-DAIO-027`).

**4. Emergencia: respuesta a lo imprevisto.** *"La capacidad de responder instantáneamente a movimientos
adversarios imprevistos, definiendo y delegando tareas y subtareas entre miembros del enjambre a
velocidad de campaña"* (`F1-DAIO-027`).

**5. Compresión radical del ciclo decisional.** El XVIII Cuerpo Aerotransportado hizo con **20 personas**
lo que en 2003 requería **2.000** (`F1-CSET-125`); y según el almirante Brad Cooper, la IA convierte
*"procesos que solían tomar horas y a veces incluso días en segundos"* (11 de marzo de 2026, en
`F1-CSET-125`).

**6. Reducción de carga de personal.** Los AI-DSS permiten ejecutar procesos *"más rápido, con más
flexibilidad y con menos personal, manteniendo calidad y juicio humano"* (`F1-CSET-125`).

**7. Validación en combate como activo comercial y estratégico.** SKYctrl, probado en Ucrania desde
2022, fue adoptado luego por Arabia Saudita, EAU y Qatar (`F1-DAIO-030`). En Ucrania, *"desarrolladores
extranjeros están usando la guerra como campo de prueba"*, y algunos observadores sostienen que las
soluciones sin validación de combate quedan en desventaja (`F1-DAIO-023`).

**8. Movilización rápida del ecosistema civil.** Ucrania transformó su sector de TI *"de desarrollar
productos civiles a productos de doble uso"* y comenzó a *"reclutar activamente a los mejores talentos
en el campo de la IA"* (`F1-DAIO-023`).

### Los riesgos de retrasar

**1. La ventana de adopción se cierra, no la de capacidad.** El argumento más importante del corpus:
*"que las empresas estadounidenses de IA sigan liderando el mundo con los modelos de IA generativa más
avanzados no significa que el ejército de EE. UU. vaya a superar al EPL en despliegue de IA"*
(`F1-CSET-115`). **La carrera que un país de ingreso medio puede perder o ganar es la de adopción.**

**2. Estancamiento post-piloto: el modo de fracaso más probable.** Rumanía (`F1-DAIO-033`) es la
advertencia: la baja alfabetización en IA en el mando *"reduce la demanda de soluciones avanzadas"*, por
lo que *"los marcos de innovación siguen insuficientemente institucionalizados, y las iniciativas
prometedoras corren el riesgo de estancarse una vez terminan las fases piloto"*. Sin *"incentivos
estructurales, trayectorias de carrera flexibles, metas de capacidad tangibles, líneas presupuestales
dedicadas y una visión estratégica unificada"*, no hay retención ni conversión de experimentación en
beneficio operacional.

**3. Fragmentación: capacidad dispersa que no suma.** El título del estudio brasileño lo dice —
*Fragmented Efforts*— y su hallazgo es que hay *"solo unas pocas iniciativas limitadas dentro de las
Fuerzas Armadas y poca integración entre ellas"*, con *"cooperación entre servicios limitada"*
(`F1-DAIO-035`).

**4. Fuga de talento acumulativa.** *"La brecha de penetración relativa de talento en IA respecto del
promedio mundial se ha ampliado con mayor rapidez desde 2022, traduciéndose en una pérdida acelerada de
talentos"* (`F1-ILIA-009`). Cada año de retraso es talento formado que se va.

**5. Normas escritas por otros.** *"Esta ausencia no es solo simbólica: implica que las normas técnicas
adoptadas por la región serán definidas por otros, posiblemente sin considerar nuestros contextos
sociotécnicos, realidades de infraestructura o valores culturales"* (`F1-ILIA-009`).

**6. Atrofia de capacidades.** El corpus da el precedente: *"las capacidades SEAD se han atrofiado en la
mayoría de las naciones de la UE/OTAN desde el fin de la Guerra Fría"* (`F1-DAIO-005`). Las capacidades
no se congelan: se degradan.

**7. El riesgo inverso: apresurarse sin doctrina.** `F1-CSET-103` insiste en que los humanos son *"la
última línea de defensa"* para el cumplimiento del DIH, y `F1-DAIO-001` demuestra que sustituir una
plataforma por otra *"no es único"* ni constituye innovación. La prisa sin doctrina produce
responsabilidad jurídica sin ventaja operacional.

### La conclusión que integra ambos lados

El corpus sostiene una posición intermedia y defendible: **actuar rápido en adopción de bajo riesgo y
alto retorno, y despacio en autonomía letal.** La receta concreta, en tres citas:

- *"Transferir de humanos a máquinas las tareas onerosas de baja complejidad"* (`F1-CSET-069`).
- IA *"principalmente para funciones de asistencia y apoyo, asegurándose de que los operadores humanos cedan tan poco poder de decisión a la IA como sea posible"*, con marcos de gobernanza establecidos de antemano (`F1-DAIO-035`).
- Los AI-DSS sirven para mucho más que *targeting*: logística, sostenimiento y planeación son donde está el retorno mayor y el riesgo jurídico menor (`F1-CSET-125`).

**Para Colombia:** gasta **3 % del PIB** en defensa —el triple de Brasil (`F1-DAIO-035`)—, tiene mandato
constitucional aeroespacial y ciberespacial desde noviembre de 2024, una estrategia institucional con
IA explícita (EDAES 2042, 2.ª edición 2026), y es **1.º regional en demanda de cursos de IA con ≈5 veces
el promedio** (`F1-ILIA-009`). Los insumos existen. El riesgo dominante no es la falta de recursos: es
la falta de articulación institucional entre activos que ya están ahí.

**Doc_id:** `F1-CSET-115`, `F1-CSET-125`, `F1-CSET-069`, `F1-CSET-009`, `F1-CSET-103`, `F1-DAIO-027`,
`F1-DAIO-023`, `F1-DAIO-030`, `F1-DAIO-033`, `F1-DAIO-035`, `F1-DAIO-001`, `F1-DAIO-005`,
`F1-ILIA-009`, `F1-ILIA-005`.

---

# Otras preguntas probables del jurado

Preguntas que el jurado puede formular y que no están en `queries.jsonl`, con la respuesta breve y su
soporte.

## Sobre el corpus y el método

**¿Qué fuentes del corpus sustentan cada respuesta y cuáles son sus límites?**
Ver `fuentes_corpus.md`. Los tres límites que conviene declarar proactivamente: (i) **Defensa21 LatAm
está vacío** (`F1-DEFENSA21-001`: 0 caracteres), así que la perspectiva regional de defensa se
reconstruye desde `F1-DAIO-035`; (ii) los 186 documentos de **Atlantic Council comparten ~1.500
caracteres de menú de navegación**, lo que contamina la búsqueda léxica por país; (iii) varios archivos
de la carpeta CSET **no son de CSET ni son de F1** (`F1-CSET-074` es un informe de la OTA de 1985 sobre
armas antisatélite; `F1-CSET-034` y `F1-CSET-061` son de Anthropic; `F1-CSET-048` y `F1-CSET-123` son de
desechos orbitales de NASA).

**¿Cuál es el documento más importante del corpus para F1?**
Depende del eje: para defensa por país, la colección **DAIO** (27 estudios país, índice en
`F1-DAIO-002`); para China militar con cifras, `F1-CSET-115` y `F1-CSET-031`; para riesgos de AI-DSS,
`F1-CSET-103`; para lecciones de conflicto, `F1-DAIO-023` y `F1-DAIO-001`; para cifras macro,
`F1-AIINDEX-023`; para la región, `F1-ILIA-009` y `F1-ILIA-005`.

**¿Por qué hay documentos fechados en 2026?**
El corpus incluye material hasta **julio de 2026** (`F1-CSET-125`) y el AI Index 2026 es la 9.ª edición
(`F1-AIINDEX-023`). El "presente" del corpus es 2026. Al citar hay que usar el año del dato, no el de
publicación.

## Sobre Colombia

**¿Tiene Colombia una política de IA?**
Sí: **CONPES 4144, Política Nacional de Inteligencia Artificial**, aprobado el **14 de febrero de
2025**, horizonte 2030, **106 acciones**, **COP 479.273 millones**, con el **Ministerio de Defensa
Nacional como una de las ocho entidades formuladoras**
([DNP](https://colaboracion.dnp.gov.co/CDT/Conpes/Econ%C3%B3micos/4144.pdf)). El ILIA 2025 califica la
madurez de la estrategia colombiana en **87 puntos, 4.º regional** (`F1-ILIA-009`).

**¿Qué dice el CONPES 4144 sobre defensa?**
Identifica como áreas clave de IA para el sector *"la identificación automatizada de blancos, la
inteligencia de datos, la ciberseguridad y ciberdefensa"*, y reconoce que *"persiste un bajo nivel de
capacidades en la industria nacional y al interior del Sector Defensa"*. Pero **no asigna al sector un
pilar, línea de acción propia ni presupuesto desagregado**: aparece como coordinador en la línea 2.2 de
infraestructura tecnológica. Ver `colombia.md` §2.

**¿La FAC tiene una estrategia que incluya IA?**
Sí: la **Estrategia para el Desarrollo Aéreo y Espacial (EDAES) 2042, segunda edición 2026**
([FAC](https://www.fac.mil.co/sites/default/files/2026-03/edaes_2edicion.pdf)), con horizontes 2026,
2034 y 2042. Compromete explícitamente toma de decisiones asistida por IA, *"dependencias que gestionen
sistemas autónomos, enjambres de drones y vehículos espaciales no tripulados"*, *"alfabetización digital
y formación en inteligencia artificial, big data, ciberdefensa en todos los niveles de la Fuerza"*,
células de innovación y *"autonomía tecnológica en sus capacidades satelitales"*. Ver `colombia.md` §3.

**¿Por qué la fuerza se llama Aeroespacial?**
Por **Acto Legislativo aprobado por el Congreso el 8 de noviembre de 2024**, incorporado a la
Constitución ese mismo mes. Un intento previo por ley ordinaria fue **negado por la Corte
Constitucional**. El detonante material fueron los nanosatélites **FACSAT-1 y FACSAT-2**
([Wikipedia ES](https://es.wikipedia.org/wiki/Fuerza_A%C3%A9rea_Colombiana)).

**¿Cuánto gasta Colombia en defensa comparado con la región?**
**3 % del PIB**, el más alto de los países citados por `F1-DAIO-035`: Guyana 2,4 %, Chile 1,9 %,
Uruguay 1,8 %, Ecuador 1,5 %, Brasil 1,1 %. El promedio regional histórico de 40 años está *"alrededor
o por debajo del 1 %"*.

**¿Cuánto gasta Colombia en IA de defensa?**
**Por verificar.** El CONPES 4144 no lo desagrega. La única referencia de escala regional es que en
Brasil está *"en el rango bajo de uno o dos dígitos de millones de dólares"* anuales (`F1-DAIO-035`).

**¿Tiene Colombia un laboratorio de IA de defensa?**
**Por verificar.** Brasil tiene el **LabIA** de su Fuerza Aérea (`F1-DAIO-035`). La EDAES 2042 dice que
la FAC *"debe institucionalizar células de innovación y transformación digital"* — objetivo, no hecho
consumado.

**¿Colombia firmó REAIM o la Declaración Política sobre uso militar responsable de IA?**
**Por verificar.** El corpus documenta la posición de otros países pero no la de Colombia, y la página
consultada del Departamento de Estado contiene el texto de la declaración sin la lista de suscriptores.
Lo mismo aplica al voto de Colombia en las resoluciones **78/241** (dic 2023) y **80/57** (dic 2025) de
la AGNU sobre LAWS.

**¿Cuál es la mayor fortaleza de Colombia en IA?**
Tres, medidas: **1.º regional en demanda de cursos de IA** con ≈5 veces el promedio; **1.º regional en
presencia de centros de investigación en IA** (100/100 frente a un promedio de 38,2); **2.º regional en
capacidad de datos** (70,53) (`F1-ILIA-005`, `F1-ILIA-009`). Y tres de las seis ciudades con mejores
condiciones sistémicas de emprendimiento dinámico de ALC son colombianas: **Manizales, Bogotá y
Medellín** (`F1-RUTAN-003`).

**¿Cuál es la mayor brecha?**
**Talento humano avanzado: 10,81 puntos frente al promedio regional de 13,32**, 7.º lugar, por *"oferta
de posgrados en IA limitada"*. Más 5G en 15,3 puntos (10.º) y patentes en 5,0 (11.º) (`F1-ILIA-005`).
Colombia produce cantidad en la base y no la convierte en profundidad.

## Sobre contenido sustantivo

**¿Está China por delante de EE. UU. en IA militar?**
No en capacidad de modelos: EE. UU. invirtió **USD 285,9 mil millones** frente a **USD 12,4 mil
millones** de China en 2025 (`F1-AIINDEX-023`), y el EPL *"sigue muy lejos de implementar usos
revolucionarios"* (`F1-DAIO-015`). Pero CSET advierte que la métrica correcta es la adopción, no la
capacidad (`F1-CSET-115`), y que la inversión privada **subestima** el gasto chino por los fondos
estatales de orientación (USD 184 mil millones entre 2000 y 2023).

**¿Existen ya armas autónomas letales desplegadas?**
El corpus no lo afirma. `F1-AIINDEX-017` advierte expresamente que su dataset de autonomía militar *"no
es un dataset que liste LAWS"* y que *"muchos de los sistemas incluidos no son sistemas de armas"*.
`F1-CSET-115` reporta que en los RFP del EPL *"no identificamos ninguna solicitud de sistemas de armas
mayores"*. Lo mejor documentado es el dron ucraniano **SAKER SCOUT**, *"equipado con IA, usado en
Ucrania para detección y enganche autónomo de blancos"* (`F1-DAIO-023`). **Confundir autonomía con
letalidad es el error conceptual más común del debate.**

**¿La IA hace la ciberdefensa más fácil o más difícil?**
*"No hay una respuesta única"* (`F1-CSET-085`). Ver q013.

**¿Qué tan capaz es realmente la IA hoy?**
Contrapeso obligatorio al *hype*: robots con **12 % de éxito en tareas domésticas** pero **89,4 % en
simulación**; agentes que fallan **1 de cada 3** intentos; el mejor modelo lee relojes analógicos
correctamente el **50,1 %** de las veces (`F1-AIINDEX-023`).

**¿Cuál es el primer paso concreto que debería dar Colombia?**
Ver `colombia.md` §5, ordenado por relación retorno/costo. El primero: convertir la demanda de cursos de
IA (1.º regional, ≈5× el promedio) en capacidad de defensa, replicando el **"Curso de IA Aplicada a
Sistemas Militares"** que la Armada brasileña montó en 2024 con la Fundación Getulio Vargas
(`F1-DAIO-035`), con Los Andes / CinfonIA como contraparte. Costo bajo, retorno alto, plazo de meses.

## Preguntas transversales entre fenómenos

**¿Dónde se cruzan F1 y F2?**
En cuatro puntos documentados: `F1-CSET-065` y `F1-CSET-067` (*AI on the Edge of Space*),
`F1-CSET-079` y `F1-CSET-081` (tecnologías espaciales avanzadas para seguridad nacional), la conclusión
de `F1-DAIO-001` sobre guerra electrónica contra activos dependientes de señales de posicionamiento,
navegación y temporización desde el espacio, y la denominación constitucional **Aeroespacial** de la
FAC con FACSAT-1 y FACSAT-2.

**¿Dónde se cruzan F1 y F3?**
En la difusión de capacidades hacia actores armados no estatales: el mercado de drones está dominado por
*"plataformas de doble uso de bajo costo"* (`F1-CSET-009`), y existen drones con IA para detección y
enganche autónomo desarrollados por empresas pequeñas (`F1-DAIO-023`). La barrera de entrada a
capacidades antes exclusivamente estatales se está derrumbando. Complementos: `F1-CSET-114` (uso
malicioso) y `F1-ATLCOUNCIL-143` (difusión global de vigilancia con IA).
