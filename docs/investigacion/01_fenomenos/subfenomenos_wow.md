# Subfenómenos diferenciales ("factor wow") para la final — CODEFEST AD ASTRA 2026

Fecha de corte: 18-sep-2026. Base: `docs/investigacion/claude/*.md`, `transversal/*.md`, `f1_ia_capacidades/`, `f2_seguridad_espacial/`, `f3_amenazas_regionales/` y verificación directa con grep sobre `C:/Programacion/ANDES/data/processed/text/<doc_id>.txt`.

## Convenciones

- **[H-corpus]**: hecho verificado en el texto del corpus oficial, con `doc_id`. Es lo que el asistente puede citar con recuperación real.
- **[H-web]**: hecho tomado de la investigación web del equipo (`claude/*.md`), con la URL que allí se abrió. No está en el corpus: el asistente solo puede decirlo si se añade como fuente externa o si el presentador lo aporta.
- **[I]**: interpretación nuestra.
- **Por verificar**: dato de buscador, dato contradictorio entre fuentes o dato no confirmado.
- **Cálculo propio**: agregación sobre datos del corpus (el método se indica).
- **Impacto** (1-5): cuánto sorprende al jurado militar y académico y cuánto le importa a la FAC. **Factibilidad**: A (alta, 3) = corpus listo o dato estructurado, menos de 4 h; M (media, 2) = requiere extracción manual o una fuente externa sencilla, 4-10 h; B (baja, 1) = requiere fuentes externas con cuenta, limpieza pesada o más de 10 h. **Puntaje = Impacto × Factibilidad** (máximo 15).

## 0. Hallazgos de la verificación que cambian el pitch

Estos resultados salieron del grep sobre el corpus y conviene conocerlos antes de elegir demos:

1. **FACSAT no aparece en el corpus** (0 coincidencias). Tampoco hay documentos de la FAC. Todo dato sobre FACSAT-1/2/3, el SpOC de Cali, Orión o Kepler es [H-web]. El asistente no lo recuperará si no se añade como fuente externa.
2. **Colombia sí aparece en el informe de contraespacio.** `F2-SWF-124` (SWF, _Global Counterspace Capabilities_) dice textualmente que en el ejercicio Resolute Sentinel 24 (junio de 2024) "operators from Brazil, Colombia, and Peru used commercially-provided data, however, since not all operators were able to access USSF tools". Es la única mención operativa de Colombia en F2 y es la mejor carta para el cruce F1×F2.
3. **La reivindicación colombiana de la órbita geoestacionaria está en el corpus.** `F2-SWF-126` (_Handbook for New Actors in Space_, 2024) explica la Declaración de Bogotá (1976) y afirma que la Constitución colombiana "continues to recognize the orbital slot above the country as part of its territory" y que esas reclamaciones "have not been widely re[cognized]".
4. **Cifra del Escudo Nacional Antidrones: tres versiones.** En el corpus, `F3-MAPPOEA-019` cita a la Presidencia con **6,3 billones de COP**. En la web: USD 1.668 millones (Infodefensa) y COP 1 billón (El Espectador). Por verificar. Que el asistente detecte y explique esta discrepancia es una demostración de rigor.
5. **Participación de ALC en la inversión mundial en IA: dos cifras.** 1,12 % en `F1-ILIA-009` (corpus) y 1,28 % en indicelatam.cl (web). Hay que citar la del corpus con su año.
6. **Brechas del corpus.** No cubre rutas aéreas ilícitas (q047), minerales estratégicos distintos del oro (q046) ni renta petrolera (q048). Tampoco trae datos de lavado de activos cuantificados, de GAFILAT ni de protestas. Hay que declararlas como límites y, si se quiere, cubrirlas con fuentes externas vivas (sección 7).
7. **CEEEP es el Centro de Estudios Estratégicos del Ejército del Perú**, no de Colombia. Citar como "revista del Ejército peruano".
8. **Las fichas de Alertas Tempranas tienen un campo de economías ilícitas.** El texto de cada alerta JSON incluye una línea "Mapa" con economías como Narcotráfico, Minería ilegal, Tala ilegal, Contrabando y Préstamos gota a gota (p. ej., `F3-ALERTAS-062`, `F3-ALERTAS-091`, `F3-ALERTAS-153`). Esto permite un mapa por economía casi sin trabajo de extracción.

---

## 1. Fenómeno 1 — IA y capacidades estratégicas

### F1-1. Del equipo de 2.000 al de 20: la IA comprime el ciclo de decisión

- **Por qué es wow.** Es una cifra física y fácil de recordar. Otros equipos hablarán de "IA en defensa" en abstracto. Este dato muestra la escala del cambio y abre la discusión de riesgos (sesgo de automatización, DIH).
- **Relevancia para Colombia y la FAC.** La EDAES 2042 compromete "toma de decisiones asistida por la IA" [H-web, FAC]. La FAC planea operaciones aéreas con ciclos de planeación deliberada. **[I]** Es el caso de uso de mayor retorno que no es letal por sí mismo (planeación y fusión de inteligencia).
- **Evidencia.**
  - [H-corpus] `F1-CSET-125` (CSET, jul-2026): el XVIII Cuerpo Aerotransportado hizo con Maven Smart System y **20 personas** lo que en 2003 requería **2.000**. El ciclo de planeación JATC de **72 horas** lleva décadas vigente. Cita del almirante Brad Cooper (11-mar-2026): procesos de horas o días "en segundos".
  - [H-corpus] `F1-CSET-103` (abr-2025): marco de riesgos de los sistemas de apoyo a la decisión (AI-DSS), incluida la falla fuera de la distribución de entrenamiento.
  - [H-web] La OTAN compró Maven Smart System en seis meses (DefenseScoop, 14-04-2025).
- **Pregunta demo.** "¿Cuánto puede acelerar la IA el ciclo de targeting y planeación de una fuerza aérea, y qué salvaguardas exige el DIH si la FAC lo adopta?"
- **Visualización.** Barra en escala logarítmica 2.000 → 20 personas, más una línea de tiempo 72 h → "segundos", con anotaciones de riesgo (`F1-CSET-103`). **Datos**: corpus (3 cifras). Plotly.
- **Factibilidad.** A. Riesgo: que el jurado lo lea como apología del targeting automatizado. Hay que cerrar con control humano significativo (F1-6).
- **Puntaje.** Impacto 4 × A = **12**.

### F1-2. La lista de deseos de IA del Ejército Popular de Liberación

- **Por qué es wow.** Son datos de adquisiciones reales del EPL: más de 9.000 solicitudes de propuesta y 2.857 contratos. Muestra al jurado que el asistente llega a la fuente primaria traducida y no se queda en titulares.
- **Relevancia.** **[I]** China es proveedor tecnológico de la región (ver T6). Entender qué compra el EPL (C5ISRT, contraespacio, reconocimiento facial) informa los riesgos de dependencia de Colombia (q005).
- **Evidencia.** [H-corpus] `F1-CSET-115`/`F1-CSET-117` (feb-2026): más de 9.000 RFP de IA del EPL (2023-2024), prioridad C5ISRT. `F1-CSET-031`/`-033` (sep-2025): 2.857 avisos de adjudicación, 1.560 ganadores, CETC con 90 contratos, 25 entidades con el 23 % de los contratos, valor de mayo a diciembre de USD 162,8 M (2023) a 183,2 M (2024).
- **Pregunta demo.** "¿Qué capacidades de IA está comprando el Ejército chino y quiénes concentran esos contratos?"
- **Visualización.** Treemap de concentración de proveedores (CETC, CASC, NORINCO, AVIC, universidades) y barras 2023 frente a 2024. **Datos**: corpus, con extracción manual a una tabla pequeña.
- **Factibilidad.** M. Riesgo bajo.
- **Puntaje.** 3 × M = **6**.

### F1-3. La paradoja colombiana: el mayor gasto de defensa relativo de la región, sin rastro de IA de defensa

- **Por qué es wow.** Es un dato incómodo y verificable que habla directamente al jurado de la FAC: capacidad de gasto sí, capacidad institucional de IA de defensa no documentada.
- **Relevancia.** Colombia 4.ª en el ILIA 2025 y 1.ª en demanda de cursos de IA, pero 7.ª en talento humano avanzado. No tiene estudio país en el DAIO. Brasil ya tiene LabIA y (según la web) una política de IA de defensa desde agosto de 2026.
- **Evidencia.**
  - [H-corpus] `F1-DAIO-035` (DAIO, Brasil, 2026): Brasil gasta 1,1 % del PIB, "behind Colombia (3%), Guyana (2.4%), Chile (1.9%), Uruguay (1.8%) and Ecuador (1.5%)". La Fuerza Aérea brasileña invirtió BRL 6,5 M (USD 1,2 M) en LabIA.
  - [H-corpus] `F1-ILIA-005`: Colombia 55,84 puntos, 4.º de 19; talento humano avanzado 10,81 (7.º, bajo el promedio de 13,32); HPC 18,42 (5.º); patentes 5,0 (11.º).
  - [H-corpus] `F1-ILIA-009`: más del 90 % del cómputo regional de alto rendimiento está en Brasil.
  - [H-web] SIPRI 2026: Colombia USD 14,5 mil M en 2025, 3,2 % del PIB. Brasil adoptó la Portaria GM-MD 4.360 (24-08-2026) (Forças Terrestres). CONPES 4144 sin eje de defensa.
  - **Por verificar**: la asignación de cada puntaje del ILIA a cada país en el ranking total (el texto extraído del PDF pierde la correspondencia; la web la da en La Tercera).
- **Pregunta demo.** "Si Colombia es el país que más gasta en defensa respecto a su PIB en la región, ¿por qué no aparece como referente de IA militar y qué haría falta?"
- **Visualización.** Dispersión: gasto en defensa (% PIB, `F1-DAIO-035`) contra puntaje ILIA 2025 (`F1-ILIA-009`/`-005`), con Colombia destacada, más un radar de subíndices de Colombia. **Datos**: corpus para 6 países; el resto del ranking, de la web.
- **Factibilidad.** A. Riesgo: tono crítico ante un jurado militar. Hay que presentarlo como oportunidad, no como reproche.
- **Puntaje.** 4 × A = **12**.

### F1-4. Ucrania como laboratorio: autonomía de último tramo contra la guerra electrónica

- **Por qué es wow.** Conecta IA con guerra electrónica y da la lección directamente trasladable a los drones de grupos armados en Colombia.
- **Evidencia.**
  - [H-corpus] `F1-DAIO-023` (Ucrania, 2024): más de 7.000 ingenieros de IA antes de la invasión.
  - [H-corpus] `F1-DAIO-001`: reclamación rusa de 36 de 59 Tomahawk desviados por Krasukha-4 en 2017. **El propio documento la califica de disputada**: solo puede citarse como afirmación de Moscú.
  - [H-corpus] `F2-SWF-124`: SpaceX cortó la conectividad de Starlink por encima de 75 km/h para impedir su uso en drones rusos. Rusia desarrolla "Kalinka" para detectar e interferir terminales Starlink.
  - [H-web] Más de 70 sistemas de IA en servicio y los impactos con guiado por IA multiplicados por 10 en 2026 (MoD Ucrania). El dron ruso V2U selecciona blancos con Jetson Orin y sin GPS (CSIS, 13-04-2026).
- **Pregunta demo.** "¿Qué lecciones de Ucrania sobre drones autónomos y guerra electrónica deberían preocupar a Colombia?"
- **Visualización.** Línea de tiempo de medidas y contramedidas (interferencia → autonomía sin GPS → geocerca de velocidad en Starlink → Kalinka). **Datos**: corpus más web.
- **Factibilidad.** M. Riesgo: cifras de bajas por drones del 70-80 % están **por verificar**; no usarlas.
- **Puntaje.** 4 × M = **8**.

### F1-5. Soberanía de cómputo y chips

- **Por qué es wow.** Responde q005, q014 y q015 con cifras regionales, y no solo con la rivalidad EE. UU.-China.
- **Evidencia.** [H-corpus] `F1-ILIA-004`/`-005`: más del 90 % del HPC regional en Brasil; más de la mitad de los 19 países sin infraestructura crítica de cómputo. `F1-ILIA-009`: ALC tiene el 1,12 % de la inversión mundial en IA frente al 6,6 % del PIB; Colombia es uno de los 4 países con industria robusta de centros de datos. `F1-ATLCOUNCIL-150` (brecha de cómputo), `F1-ATLCOUNCIL-174` (Chip Security Act). [H-corpus] `F1-AIINDEX-008`: la brecha entre modelos cerrados y abiertos pasó de 8,0 % a 1,7 % (ene-2024 a feb-2025).
- **Pregunta demo.** "¿Puede Colombia desarrollar IA de defensa soberana con el cómputo que tiene la región?"
- **Visualización.** Mapa coroplético de ALC con la ubicación del cómputo y barras de inversión frente a PIB. **Datos**: corpus (agregados) y World Bank API (PIB).
- **Factibilidad.** A/M. Riesgo: no hay cifra de cómputo por país en el corpus. El mapa debe ser cualitativo.
- **Puntaje.** 3 × A = **9**.

### F1-6. Noviembre de 2026: la decisión sobre armas autónomas

- **Por qué es wow.** Es de actualidad: la VII Conferencia de Examen de la CCW (16-20 de noviembre de 2026) decide si se negocia un instrumento vinculante. Colombia está entre los Estados que apoyan negociar. Ningún otro equipo lo tendrá fechado.
- **Evidencia.**
  - [H-corpus] `F3-SIPRI-027`, `F3-SIPRI-028`, `F3-SIPRI-044` (SIPRI sobre sistemas autónomos, DIH y responsabilidad).
  - [H-corpus] `F1-AIINDEX-017`: dataset de autonomía en sistemas militares, con la advertencia textual de que "is not a dataset listing Lethal Autonomous Weapon Systems".
  - [H-web] 76 Estados, Colombia entre ellos, apoyan negociar sobre el _rolling text_ (Automated Decision Research, 4-sep-2026). Resolución L.41 (156-5-8), copatrocinada por Colombia (Stop Killer Robots). REAIM 2026 reunió 35 respaldos, sin EE. UU. ni China (CFR). La fecha de la conferencia está **por verificar** en la fuente de UNODA.
- **Pregunta demo.** "¿Qué posición ha tomado Colombia frente a los sistemas de armas autónomos y qué se decide en noviembre de 2026?"
- **Visualización.** Línea de tiempo normativa 2023-2026 con votos (barras apiladas a favor/en contra/abstención) y los hitos colombianos. **Datos**: web (votos) y corpus (marco SIPRI).
- **Factibilidad.** A. Riesgo: posiciones de Colombia en REAIM y en la Declaración Política de EE. UU. **por verificar**.
- **Puntaje.** 4 × A = **12**.

### F1-7. Desinformación potenciada por IA (categoría Desinformación)

- **Por qué es wow.** Liga IA y seguridad cognitiva con el año electoral colombiano (2026).
- **Evidencia.**
  - [H-corpus] `F3-CEEEP-004` (revista del Ejército del Perú): _Inteligencia Artificial y Desinformación: Papel en los Conflictos del Siglo XXI_. Actores no estatales usan tecnología de punta y "amplían la zona gris entre la paz y la guerra".
  - [H-corpus] `F3-CEEEP-036` (propaganda y guerra híbrida) y `F3-CEEEP-080` (redes sociales).
  - [H-corpus] `F1-AIINDEX-023`: 362 incidentes de IA documentados en 2025, frente a 233 en 2024.
  - [H-corpus] En Colombia, la MAPP/OEA registra la desinformación como obstáculo para el Estatuto de migrantes y el Acuerdo de Paz (`F3-MAPPOEA-022`, `-028`, `-032`), no como campañas coordinadas.
  - [H-web] CSET: el EPL busca _deepfakes_ entre sus prioridades de compra.
- **Límite.** El corpus no documenta campañas coordinadas de desinformación en Colombia. Para medirlas: GDELT (tono y volumen mediático por tema y lugar).
- **Pregunta demo.** "¿Cómo usan los actores estatales y no estatales la IA para desinformar, y qué riesgos plantea para Colombia?"
- **Visualización.** Serie de incidentes de IA 2024 frente a 2025 más una serie GDELT de cobertura sobre "drones" y "Catatumbo" (externa).
- **Factibilidad.** M. Riesgo: sin evidencia colombiana en el corpus.
- **Puntaje.** 3 × M = **6**.

---

## 2. Fenómeno 2 — Seguridad del entorno espacial

### F2-1. La FAC en Resolute Sentinel 24: conciencia situacional espacial con datos prestados

- **Por qué es wow.** El jurado no espera que el corpus internacional nombre a Colombia en un informe de contraespacio. Es la prueba documental de la dependencia de datos de terceros.
- **Relevancia.** La FAC opera satélites y tiene un Centro de Operaciones Espaciales, pero no tiene sensores propios de vigilancia espacial [H-web]. La conciencia situacional depende del Comando Espacial de EE. UU. (memorando de 2021) y de proveedores comerciales.
- **Evidencia.** [H-corpus] `F2-SWF-124` y `F2-SWF-123`: en Resolute Sentinel 23 (julio de 2023) SOUTHCOM hizo su primera operación de control espacial defensivo, respondiendo a interferencia electromagnética. En Resolute Sentinel 24 (junio de 2024), operadores de Brasil, Colombia y Perú usaron datos comerciales porque no todos podían acceder a las herramientas de la USSF. [H-web] Memorando SSA FAC–Comando Espacial de EE. UU. (Infoespacial, oct-2021); ejercicios Global Sentinel (FAC, 30-07-2024).
- **Pregunta demo.** "¿De quién depende Colombia para saber qué pasa en órbita, y qué evidencia hay de esa dependencia?"
- **Visualización.** Diagrama de flujo de datos SSA: sensores de EE. UU. / proveedores comerciales / catálogos públicos → Centro de Operaciones Espaciales de la FAC → decisiones, con el punto único de falla resaltado. **Datos**: corpus más web.
- **Factibilidad.** A. Riesgo bajo; no exagerar el alcance de una sola frase.
- **Puntaje.** 5 × A = **15** (se une a T2 en el TOP 10).

### F2-2. GNSS bajo ataque: _jamming_ y _spoofing_ como contraespacio cotidiano (categoría Ciberamenazas / Infraestructura crítica)

- **Por qué es wow.** Es la amenaza espacial más probable para Colombia y la más barata. Afecta aviación, sincronización financiera y eléctrica, y los drones.
- **Evidencia.**
  - [H-corpus] `F2-CSIS-142` (_Space Threat Assessment_ 2025): "widespread jamming and spoofing of GPS signals in and around conflict zones, including near and in Russia and throughout the Middle East". Un avión militar británico sufrió interferencia de GPS y comunicaciones durante unos 30 minutos cerca de Kaliningrado (marzo de 2024).
  - [H-corpus] `F2-SWF-120` (resumen en español, 2026): Irán ha demostrado interferencia persistente contra terminales Starlink.
  - [H-web] SWF 2025: más de 10.000 eventos de interferencia entre febrero de 2024 y febrero de 2025 (**por verificar** en el PDF). CSIS 2026: spoofing de GPS atribuido a Irán contra Starlink.
- **Pregunta demo.** "¿Qué pasaría con las operaciones de la FAC y la aviación civil si hubiera spoofing de GPS sobre el Catatumbo?"
- **Visualización.** Mapa mundial de zonas de interferencia GNSS con incidentes anotados. **Datos**: corpus (incidentes), CSIS Counterspace Timeline `F2-CSIS-066` (JSON, hasta 2022) y, como dato vivo, GPSJam.org (externo, derivado de ADS-B; licencia **por verificar**).
- **Factibilidad.** M. Riesgo: no atribuir incidentes que el documento no atribuye.
- **Puntaje.** 5 × M = **10**.

### F2-3. La herencia de los ASAT: la altitud manda

- **Por qué es wow.** Tres pruebas destructivas, tres destinos distintos. Es la visualización más limpia del fenómeno y usa solo datos del corpus.
- **Evidencia.** [H-corpus] `F2-SWF-102`: China 2007, 865 km, 3.532 fragmentos rastreables, **2.351 seguían en órbita en febrero de 2026**. `F2-SWF-107`: Rusia 2021 (Nudol), más de 1.800 catalogados, **5 en órbita** en febrero de 2026. `F2-SWF-105`: India 2019, unos 300 km, 130 fragmentos, más de 3 años en decaer. `F2-ESA-028`: 9,8 fragmentaciones no deliberadas al año en promedio durante dos décadas. [H-web] Resolución ONU 77/41 (155-9-9); 38 países con compromiso nacional de moratoria. **Por verificar**: el voto y el compromiso nacional de Colombia.
- **Pregunta demo.** "¿Qué prueba antisatélite dejó más basura y por qué sigue ahí casi 20 años después?"
- **Visualización.** Barras pareadas "creados frente a remanentes" por prueba, con la altitud en el eje X. Efecto: la china sigue casi entera y la rusa casi desaparece. **Datos**: corpus.
- **Factibilidad.** A. Riesgo bajo.
- **Puntaje.** 4 × A = **12**.

### F2-4. El único satélite colombiano en la capa más congestionada

- **Por qué es wow.** Poner el satélite colombiano en órbita, en 3D y en vivo, al lado de la nube de Starlink, es la imagen más memorable posible para la FAC.
- **Evidencia.**
  - [H-corpus] `F2-ESA-028` (informe ESA 2026).
  - [H-web] FACSAT-2 "Chiribiquete": lanzado el 15-04-2023, 4,7 m/píxel, SATCAT 56205 (FAC; Wikipedia). Estado a sep-2026 **por verificar**. Starlink: 11.127 satélites en órbita (McDowell, 17-09-2026). CRASH Clock: 2,2 días (OSI, 15-08-2026). FACSAT-1 reentró en 2023; un estudio de 2021 proyectaba 2030 (Redalyc).
- **Pregunta demo.** "¿Dónde está hoy el satélite colombiano y qué riesgo de colisión enfrenta?"
- **Visualización.** Globo 3D (CesiumJS o Plotly 3D) con la órbita del satélite colombiano propagada desde TLE y los satélites de Starlink cercanos; histograma de densidad por altitud. **Datos**: externos (CelesTrak GP/TLE, sin cuenta; Space-Track con cuenta).
- **Factibilidad.** M (propagación con `sgp4` o `skyfield`, 6-8 h). Riesgo: que el TLE esté desactualizado o el satélite inactivo. Tener una captura de respaldo.
- **Puntaje.** 5 × M = **10**.

### F2-5. El ciberataque que abrió una guerra: Viasat 2022 (categoría Ciberamenazas)

- **Por qué es wow.** Demuestra que el eslabón débil es el segmento terrestre y de usuarios, no el satélite. Eso aplica a las estaciones y terminales colombianos.
- **Evidencia.** [H-corpus] `F2-SWF-120`: casi todos los ciberataques contra sistemas espaciales se han dirigido al segmento de usuarios. El mayor fue el de Rusia contra Viasat en Europa, el primer día de la invasión a Ucrania (febrero de 2022). También hay una "clara tendencia hacia la reducción de las barreras de acceso". `F2-CSIS-142`, sección "The Drip-Drip of Cyber Attacks". [H-corpus] `F3-RESDAL-013`: el MinDefensa de Colombia tiene una Oficina de Respuesta a Incidentes Cibernéticos (CSIRT). `F1-ILIA-005` señala la ciberseguridad como brecha de Colombia. [H-web] CSIS 2026: 161 incidentes cibernéticos contra sistemas espaciales entre 2022 y 2025.
- **Pregunta demo.** "¿Cuál ha sido el ciberataque más grave contra infraestructura satelital y qué lecciones deja para las estaciones terrenas de Colombia?"
- **Visualización.** Diagrama de superficie de ataque (satélite / enlace / estación / terminal / proveedor de nube) con incidentes anotados.
- **Factibilidad.** A. Riesgo bajo.
- **Puntaje.** 4 × A = **12**.

### F2-6. La Declaración de Bogotá: Colombia reclama su trozo de órbita geoestacionaria

- **Por qué es wow.** Casi nadie sabe que la Constitución colombiana (art. 101) incluye el segmento de la órbita geoestacionaria. Es una pregunta trampa ideal para el jurado académico.
- **Evidencia.** [H-corpus] `F2-SWF-126` (SWF, 2024): la Declaración de Bogotá (1976) buscaba el control del espacio sobre el territorio de los Estados ecuatoriales, y la Constitución colombiana sigue reconociendo el segmento orbital, reclamación "not widely recognized". `F2-UNOOSA-030`: principio de no apropiación del Tratado de 1967. [H-web] Ley 2107 de 2021 y sentencia C-206/22 con declaración interpretativa (Corte Constitucional). **Por verificar**: la fecha del depósito y las objeciones de otros Estados.
- **Pregunta demo.** "¿Es compatible la reclamación de Colombia sobre la órbita geoestacionaria con el Tratado del Espacio de 1967?"
- **Visualización.** Línea de tiempo 1967 → 1976 → 1991 → 2021/2022, con un esquema del arco geoestacionario sobre Colombia.
- **Factibilidad.** A. Riesgo: tema diplomáticamente sensible. Presentar ambas posiciones.
- **Puntaje.** 4 × A = **12**.

### F2-7. Reabastecimiento chino en órbita geoestacionaria y maniobras de proximidad

- **Evidencia.** [H-corpus] SJ-21 en `F2-SWF-*` (10 documentos) y `F2-CSIS-*` (6). Fichas `F2-SWF-103`/`-104`/`-108` (q028, q029). [H-web] CSIS 2026: recarga de combustible de SJ-21 y SJ-25.
- **Pregunta demo.** "¿Qué demostró China al reabastecer un satélite en órbita geoestacionaria y por qué preocupa militarmente?"
- **Visualización.** Animación esquemática de la maniobra de proximidad. Solo valor visual; relevancia para Colombia baja.
- **Factibilidad.** M. **Puntaje** 3 × M = **6**.

---

## 3. Fenómeno 3 — Dinámicas territoriales y amenazas regionales (por categoría)

### F3-1. Economías ilícitas: el oro desplaza a la coca

- **Por qué es wow.** Cambia la narrativa de "narcotráfico" a "minería de oro". Muestra que el asistente lee la MAPP/OEA más reciente.
- **Evidencia.**
  - [H-corpus] `F3-MAPPOEA-014` (Informe 39, primer semestre de 2025): la extracción ilícita "en algunos casos sustituyó a la narcoactividad por su mayor margen de ganancia". La renta equivale al valor de un gramo de oro o hasta el 15 % del mineral extraído en una semana. La fuerza pública intervino 3.383 minas (+14,3 %) e incautó 400 máquinas (+29 %).
  - [H-corpus] `F3-MAPPOEA-019` (Informe 40): 262.179 ha de coca según el SIIMA (agosto de 2025); alianzas con bandas extranjeras en la frontera con Ecuador y Perú.
  - **Cálculo propio** sobre `F3-ALERTAS-001`…`-363` (menciones en la ficha, un piso): narcotráfico 84 alertas, contrabando 58, minería ilegal 55, préstamos gota a gota 28, tala ilegal 5 (`F3-ALERTAS-062`, `-091`, `-153`).
  - [H-corpus] Tráfico de fauna: `F3-AMAZONUW-074` registra "Grupos de traficantes de fauna no identificados" en `grupos_detalle_ES`.
  - [H-web] Oro de US$1.060 a ~US$4.030 la onza entre 2015 y 2025 (InSight Crime). 261.000 ha de coca en 2024, SIMCI (Infobae). Minería ilegal: 4.472 sitios en la Amazonía (Amazon Underworld). **Por verificar**: la inconsistencia en las cifras de deforestación de 2025 (72.409 frente a 119.483 ha).
- **Pregunta demo.** "¿Está la minería ilegal de oro superando al narcotráfico como fuente de financiación de los grupos armados en Colombia?"
- **Visualización.** Mapa de pequeños múltiplos: un mapa de Colombia por economía (narcotráfico, minería, contrabando, gota a gota, tala) a partir del campo de economía de las alertas, más una línea del precio del oro. **Datos**: corpus (alertas) y externos: precio del oro (World Bank Pink Sheet), coca (UNODC Data / SIMCI), EVOA.
- **Factibilidad.** A. Riesgo: los conteos de las alertas miden menciones, no intensidad. Decirlo en el gráfico.
- **Puntaje.** 5 × A = **15**.

### F3-2. Crimen organizado transfronterizo: la Amazonía como un solo espacio criminal

- **Evidencia.** [H-corpus] `F3-AMAZONUW-074` (cálculo propio de `f3_amenazas_regionales/cifras_clave.md`): 662 de 987 municipios amazónicos con presencia (67,1 %). Colombia: 79 de 87 (90,8 %). Comando Vermelho en 403 municipios y PCC en 165. Inírida, Cumaribo, La Primavera, Puerto Carreño y Santa Rosalía con 4 grupos simultáneos. Tren de Aragua en 5 alertas (`F3-ALERTAS-035` y otras) y en `F3-AMAZONUW-074`. `F3-CEEEP-079`: grupos no firmantes migraron a Ecuador. `F3-CEEEP-040` (triple frontera) y `F3-CEEEP-041` (Alto Putumayo). Tráfico de armas: desvío de armas pequeñas en `F3-SIPRI-080` (ATT Monitor) y `F3-SIPRI-113` (datos de Colombia **no** confirmados).
- **Pregunta demo.** "¿Qué grupos armados colombianos operan en más de un país amazónico y dónde se superponen con Comando Vermelho y el PCC?"
- **Visualización.** Mapa coroplético de 6 países, coloreado por número de grupos, con un filtro por grupo. **Datos**: CSV del corpus, listo. Teselas PBF opcionales.
- **Factibilidad.** A. Riesgo: el dataset no tiene fecha ("s.f."). Declararlo.
- **Puntaje.** 4 × A = **12**.

### F3-3. Violencia política y riesgo electoral (categoría Violencia política)

- **Evidencia.** [H-corpus] `F3-MAPPOEA-014`: asesinato del senador y precandidato Miguel Uribe Turbay (atentado el 7-jun-2025, muerte el 11-ago-2025). `F3-MAPPOEA-019`: monitoreo de 16 Circunscripciones Transitorias Especiales de Paz y presiones sobre liderazgos en el ciclo electoral 2026. La MAPP recomienda privilegiar el diálogo "en casos de protestas violentas y vías de hecho". **Cálculo propio**: líderes sociales y defensores en riesgo en 331 de 363 alertas. `F3-ALERTAS-386`: 886 conductas vulneratorias y 260 homicidios de líderes (2016-2018). [H-web] Alerta Temprana Electoral: 69 municipios de acción inmediata, 168 urgente, 433 prioritaria (Defensoría, feb-2026); 42 % de cumplimiento estatal. Indepaz: 187 líderes asesinados en 2025.
- **Límite.** El corpus no trae series de protestas o disturbios. Fuentes externas: ACLED (con cuenta; tiene la categoría _Protests/Riots_), GDELT o UCDP GED (violencia organizada, sin protestas).
- **Pregunta demo.** "¿Qué municipios combinaron riesgo electoral alto y presencia de grupos armados en 2026?"
- **Visualización.** Mapa bivariado: alertas con líderes en riesgo × municipios de la alerta electoral. **Datos**: corpus y web o datos.gov.co.
- **Factibilidad.** M (la lista municipal de la alerta electoral es externa). **Puntaje** 4 × M = **8**.

### F3-4. Lavado de activos y testaferrato minero (categoría Lavado)

- **Evidencia (débil).** [H-corpus] `F3-ALERTAS-425`: capitales mineros foráneos y "entrada de capitales clandestinos a través del testaferrato, lavado de activos, especulación y concentración de tierras". `F3-ALERTAS-391`: Neiva, operación del narcotráfico (lavado, extorsión, sicariato) atribuida al Cartel de Sinaloa. `F3-MAPPOEA-019`: la estrategia del Estado incluye la "persecución de finanzas ilícitas, lavado de activos y redes empresariales". Nuevas modalidades de extorsión con códigos QR y "paz y salvo" (`F3-MAPPOEA-014`). No hay cifras de flujos ni tipologías GAFILAT en el corpus.
- **Pregunta demo.** "¿Cómo se lava el dinero del oro ilegal y qué señales dejan las alertas tempranas?"
- **Visualización.** Grafo actor → economía → mecanismo (testaferrato, compra de tierras, exportación de oro), construido desde el grafo de entidades de la Etapa 1. **Datos**: corpus y externos (tipologías GAFILAT, UIAF; exportaciones de oro en datos.gov.co o DANE).
- **Factibilidad.** B/M. Riesgo alto de afirmar más de lo que dicen las fuentes. **Puntaje** 4 × B = **4**.

### F3-5. Terrorismo: explosivos, drones y oleoductos (categoría Terrorismo)

- **Evidencia.** [H-corpus] `F3-MAPPOEA-014`: explosivos en animales de carga y objetos cotidianos; químicos que causan quemaduras en minas antipersonal (norte de Antioquia); 21 atentados contra oleoductos en el primer semestre de 2025 (+600 %). `F3-MAPPOEA-019`: 135 víctimas de minas y artefactos explosivos en 2025. `F3-CEEEP-071`: narcotráfico y terrorismo en el VRAEM peruano (comparación regional). [H-web] Atentado de Cajibío (abril de 2026): 21 muertos (Infobae).
- **Límite.** El financiamiento del terrorismo apenas aparece (`F3-MAPPOEA-*`, 1 documento). Fuentes externas: UCDP GED (con API), GTD (**por verificar** su cobertura de 2025-2026).
- **Pregunta demo.** "¿Qué nuevas tácticas explosivas documenta la MAPP/OEA en 2025 y dónde?"
- **Visualización.** Línea de tiempo de hechos por departamento. **Factibilidad** M. **Puntaje** 4 × M = **8**.

### F3-6. Migración y crisis humanitaria

- **Evidencia.** [H-corpus] **Cálculo propio**: 98 de 363 alertas incluyen población migrante o venezolana; en Arauca, 7 de 8. `F3-ALERTAS-410`: Soacha, riesgo sobre migrantes y "limpieza social". `F3-MAPPOEA-014`: más de 74.000 personas confinadas (enero-abril de 2025) y más de 64.000 desplazadas en el Catatumbo, solo 8 % incluidas en el Registro Único de Víctimas. `F3-MAPPOEA-022`/`-023`: Permisos por Protección Temporal y desinformación sobre el Estatuto. `F3-SIPRI-029`: clima, movilidad y seguridad. [H-web] R4V: 6.978.009 venezolanos en ALC (ago-2026), 2,81 M en Colombia. CICR: 322.688 desplazados en 2025.
- **Pregunta demo.** "¿Dónde coinciden la población migrante en riesgo y las disputas armadas en la frontera con Venezuela?"
- **Visualización.** Diagrama de Sankey Venezuela → departamentos de Colombia (R4V) superpuesto con alertas que mencionan migrantes. **Datos**: corpus y externos (R4V, HDX, ReliefWeb API).
- **Factibilidad.** M. **Puntaje** 3 × M = **6**.

### F3-7. Infraestructura crítica: oleoductos, cables, puertos y estaciones

- **Evidencia.** [H-corpus] Oleoductos Caño Limón-Coveñas y Bicentenario con +600 % de atentados (`F3-MAPPOEA-014`). Cable submarino Firmina y ciberdefensa regional (`F3-RESDAL-092`/`-030`). Daño a cables de Taiwán en 2025 (`F3-SIPRI-091`). Corte de un cable submarino a una estación terrena de Svalbard en 2022 (`F2-CSIS-180`). Megapuerto de Chancay y su impacto geoestratégico (`F3-CEEEP-054`). Viasat (`F2-SWF-120`).
- **Pregunta demo.** "¿Qué infraestructura crítica de Colombia y la región está más expuesta a ataques físicos y cibernéticos?"
- **Visualización.** Mapa de infraestructura (oleoductos, cables, puertos, estaciones terrenas) con capas de amenaza. **Datos**: externos (TeleGeography Submarine Cable Map, geodatos de oleoductos en datos.gov.co **por verificar**) y hechos del corpus.
- **Factibilidad.** M. **Puntaje** 4 × M = **8**.

### F3-8. Riesgo climático y conflicto

- **Evidencia.** [H-corpus] `F3-SIPRI-031` (hoja informativa de clima, paz y seguridad de Haití, 2025). `F3-SIPRI-029`. `F3-MAPPOEA-014`: los grupos ordenan talas cerca de las vías y determinan cuánto se puede deforestar. `F3-RESDAL-092`: mandato ambiental de las Fuerzas Militares (ley del SINA, art. 103) y despliegues en desastres (Operación Taquari 2 en Brasil: más de 15.000 efectivos). `F2-INPE-055`: el DETER sumó 4.689,40 km² de alertas de deforestación entre agosto de 2025 y junio de 2026 (−7,9 %), con satélites CBERS-04, CBERS-04A y Amazonia-1.
- **Límite.** El corpus no cubre incendios ni inundaciones colombianas. Fuentes externas: NASA FIRMS (incendios, API con clave gratuita), IDEAM y UNGRD (datos.gov.co), ReliefWeb (desastres).
- **Pregunta demo.** "¿Cómo convierten los grupos armados la deforestación en una herramienta de control territorial?"
- **Visualización.** Focos de calor de FIRMS sobre municipios con presencia armada (Amazon Underworld). **Factibilidad** M. **Puntaje** 4 × M = **8**.

### F3-9. MUSE: el nuevo problema de desminado que traen los drones

- **Por qué es wow.** Es un efecto de segundo orden que casi nadie menciona: los explosivos lanzados desde drones que no detonan contaminan escuelas y caminos.
- **Evidencia.** [H-corpus] `F3-MAPPOEA-019`: el lanzamiento de artefactos desde drones generó contaminación de caminos, viviendas y centros educativos con Municiones Sin Explosionar (MUSE). En El Tarra impidió clases presenciales. Plazo de desminado hasta 2030.
- **Pregunta demo.** "¿Qué efectos humanitarios indirectos tiene el uso de drones por grupos armados?"
- **Visualización.** Incluida en la demo T1. **Factibilidad** A. **Puntaje** 3 × A = **9**.

---

## 4. Subfenómenos transversales (cruces entre fenómenos)

### T1. Drones armados de grupos ilegales frente a un escudo antidrón con IA (F1 × F3) ★

- **Por qué es wow.** Es la amenaza aérea número uno en el territorio de la FAC, documentada en el corpus. Une la tecnología de F1 (contra-UAS, enjambres), la táctica de F3 y la respuesta estatal.
- **Evidencia.**
  - [H-corpus] `F3-MAPPOEA-014`: drones contra la fuerza pública en 8 departamentos (Antioquia, Bolívar, Cauca, Chocó, Guaviare, Nariño, Norte de Santander, Valle del Cauca) en el primer semestre de 2025. El ELN usó francotiradores y drones.
  - [H-corpus] `F3-MAPPOEA-019`: los grupos incrementaron el uso de drones en el segundo semestre de 2025. Casos: Buenos Aires (Cauca), Calamar (Guaviare), El Tarra. Escudo Nacional Antidrones: 6,3 billones de COP según la Presidencia.
  - [H-corpus] Tácticas y contramedidas: `F1-DAIO-027` (enjambres en el _air littoral_), `F1-DAIO-005` (GhostPlay: IA contra enjambres de UAV), q010.
  - [H-web] Ataques con drones: 119 (2024) → 277 (2025) → 292 (2026 en lo corrido) según inteligencia (El Tiempo, 11-09-2026). MinDefensa: 8.395 intentos en 2025, 333 efectivos. Defensoría: +146 %. Batallón de drones del Ejército (BANT) con análisis de IA (Infodefensa). Dron Dragom de CIAC con modo autónomo (Pucará). **Las cifras difieren por definición** [I].
- **Pregunta demo.** "¿Dónde usan drones los grupos armados en Colombia, cómo ha crecido la amenaza y qué capacidades de IA ayudarían a detectarlos y neutralizarlos?"
- **Visualización.** (1) Mapa de departamentos con uso de drones documentado, por semestre (corpus); (2) serie 2024-2026 con tres líneas por fuente, mostrando la discrepancia (web); (3) una tarjeta con las tres cifras del Escudo, marcada "fuentes en conflicto".
- **Factibilidad.** A. Riesgo: mezclar series con definiciones distintas. Mostrarlas separadas.
- **Puntaje.** 5 × A = **15**.

### T2. Una FAC que depende del espacio ajeno: GNSS, SATCOM y conciencia situacional (F1 × F2) ★

- **Por qué es wow.** Une IA (drones que vuelan sin GPS), contraespacio (spoofing) y una prueba documental de la dependencia de Colombia (F2-1).
- **Evidencia.** `F2-SWF-124` (Resolute Sentinel 24; Starlink y drones; Kalinka), `F2-CSIS-142` (GPS jamming/spoofing), `F2-SWF-120` (Irán contra Starlink; Viasat), `F1-CSET-065` (_AI on the Edge of Space_: IA a bordo y en tierra para conciencia situacional espacial y evitar sorpresas en órbita), `F2-UNOOSA-005` (IA responsable en espacio y observación de la Tierra). [H-web] Proyectos FAC-Uniandes Orión (conciencia situacional espacial) y Kepler (IA para constelaciones) (Uniandes, 25-03-2026). Internet fijo satelital +111,4 % en Colombia en 2025 (CRC vía Forbes).
- **Pregunta demo.** "Si mañana se degrada el GPS sobre Colombia, ¿qué capacidades de la FAC se afectan y qué ha aprendido el mundo de Ucrania e Irán?"
- **Visualización.** Matriz de dependencias: servicio espacial (GNSS, SATCOM, observación, conciencia situacional) × misión FAC (navegación, drones, C2, vigilancia), coloreada por proveedor extranjero o propio y anotada con incidentes del corpus.
- **Factibilidad.** A. **Puntaje** 5 × A = **15**.

### T3. El ojo satelital sobre las economías ilícitas (F2 × F3)

- **Por qué es wow.** Responde a "¿para qué sirve un satélite colombiano?" con la guerra real del territorio. Brasil ya lo hace a escala con el DETER.
- **Evidencia.** [H-corpus] `F2-INPE-055`: alertas diarias del DETER a partir de CBERS-04/04A y Amazonia-1. `F2-INPE-049`: DETER Amazônia y cooperación con la OTCA. `F3-CEOBS-008` y `-023`: monitoreo satelital de minería artesanal de oro (Sudán), metodología trasladable. `F3-CEEEP-006`: la OTCA contra el crimen organizado desde la perspectiva ambiental. [H-web] Las imágenes de FACSAT-2 se usan para deforestación, cultivos ilícitos y fronteras (FAC). SIMCI y EVOA como sistemas de monitoreo.
- **Pregunta demo.** "¿Cómo puede la observación satelital detectar minería ilegal y deforestación en zonas con presencia de grupos armados, y qué hace Brasil que Colombia no?"
- **Visualización.** Mapa en capas: presencia armada (`F3-AMAZONUW-074`) + alertas de deforestación (externas: GLAD/Global Forest Watch o TerraBrasilis) + minería (Amazon Underworld, externo).
- **Factibilidad.** M. **Puntaje** 5 × M = **10**.

### T4. Starlink en la selva: conectividad LEO al servicio de las economías ilícitas (F2 × F3)

- **Por qué es wow.** Da la vuelta a la narrativa espacial: la megaconstelación que congestiona LEO también conecta la minería ilegal.
- **Evidencia.** [H-corpus] `F2-SWF-124`: SpaceX puede limitar el servicio por velocidad o geografía; precedente de "geocerca". `F3-SIPRI-003`: China señala el papel de Starlink en conflictos armados. [H-web] El Gobierno de Brasil incautó 50 antenas Starlink en garimpos ilegales de la Tierra Indígena Yanomami en 2024 ([Agência Pública](https://apublica.org/2024/07/elon-musk-governo-apreende-50-antenas-starlink-em-garimpos-ilegais-na-terra-yanomami/)). El Ibama incautó kits en Raposa Serra do Sol ([Revista Cenarium](https://revistacenarium.com.br/garimpo-ilegal-usa-starlink-na-terra-indigena-raposa-serra-do-sol-aponta-ibama/)). **Por verificar**: casos en Colombia.
- **Pregunta demo.** "¿Qué riesgos plantea para la seguridad que grupos ilegales usen internet satelital de órbita baja, y qué palancas regulatorias tiene Colombia?"
- **Visualización.** Tarjeta de caso con mapa de incautaciones; sin serie cuantitativa.
- **Factibilidad.** M (el corpus lo cubre en parte). Riesgo: extrapolar el caso brasileño a Colombia. **Puntaje** 5 × M = **10**.

### T5. El punto ciego: donde hay más grupos armados, menos alertas (F3 + analítica con IA) ★

- **Por qué es wow.** Es un hallazgo original del equipo, no de una fuente. Cruza dos datasets del corpus y descubre una brecha de cobertura estatal. Es exactamente el tipo de "insight" que un agente analítico debe producir.
- **Evidencia (cálculo propio de `f3_amenazas_regionales/colombia.md`).** Guainía, Vichada, Vaupés y Guaviare tienen 3, 4, 4 y 5 alertas tempranas en el corpus (`F3-ALERTAS-*`). Según `F3-AMAZONUW-074`, esos mismos departamentos tienen la densidad de actores más alta: presencia en el 100 % de sus municipios del dataset y 4 grupos simultáneos en Inírida, Cumaribo, La Primavera, Puerto Carreño y Santa Rosalía. **[I]** Es un déficit de cobertura del Sistema de Alertas Tempranas en la Orinoquía-Amazonía, no una ausencia de riesgo. Advertencia: el corpus contiene una muestra de alertas, no el universo. Hay que compararlo con el total de la Defensoría (**por verificar**).
- **Relevancia FAC.** La Orinoquía-Amazonía es territorio donde la presencia estatal es sobre todo aérea y fluvial.
- **Pregunta demo.** "¿Qué departamentos tienen mucha presencia de grupos armados pero pocas alertas tempranas?"
- **Visualización.** Dispersión por departamento: eje X = grupos presentes (Amazon Underworld), eje Y = alertas del corpus, con el cuadrante "alto riesgo, baja alerta" resaltado. Luego, el mapa bivariado.
- **Factibilidad.** A (dos tablas ya calculadas). **Puntaje** 5 × A = **15**.

### T6. China en el hemisferio: estaciones terrenas, tecnología digital y puertos (F1 × F2 × F3)

- **Evidencia.** [H-corpus] `F2-SWF-080`: China tiene acuerdos para estaciones de seguimiento, telemetría y control (TT&C) en Santiago (Chile), Alcântara (Brasil) y Neuquén (Argentina), coordinadas por el Centro de Control de Xi'an. `F3-CEEEP-034`: _El Avance Digital de China en América Latina_ (R. E. Ellis). `F3-CEEEP-054`: Chancay. `F3-CEEEP-048`: la región en un eventual conflicto por Taiwán. `F1-CSET-115`: compras del EPL (contraespacio incluido). [H-web] Brasil-China CBERS-6 (Decreto 12.496/2025). Túpac Katari financiado en un 85 % por China.
- **Pregunta demo.** "¿Qué infraestructura espacial y digital tiene China en Sudamérica y qué implica para la seguridad de Colombia?"
- **Visualización.** Mapa de puntos (estaciones terrenas, puertos, satélites cooperativos) con enlaces. Coordenadas manuales.
- **Factibilidad.** A. Riesgo: tono geopolítico. Citar la fuente de cada punto. **Puntaje** 4 × A = **12**.

### T7. Grafo tri-fenómeno: SIPRI y CEEEP como puentes

- **Evidencia.** `transversal/conexiones.md`: SIPRI (catalogado en F3) trata IA militar, armas autónomas y espacio (`F3-SIPRI-027`, `-028`, `-044`, `-003`). CEEEP cruza IA, desinformación y crimen (`F3-CEEEP-004`, `-040`). Atlantic Council y CSIS cruzan ciber y espacio.
- **Pregunta demo.** "Muéstrame cómo se conectan los drones, el spoofing y la minería ilegal en las fuentes."
- **Visualización.** Subgrafo PyVis del `grafo.graphml` de la Etapa 1, filtrado por las entidades de la respuesta y coloreado por fenómeno. Es la firma visual del asistente.
- **Factibilidad.** A (el grafo existe). Riesgo: que salga ilegible; limitar a 30-50 nodos. **Puntaje** 4 × A = **12**.

---

## 5. Matriz resumen

| #    | Subfenómeno                                         | Cruce    | Impacto | Fact. | Puntaje | Evidencia principal                               |
| ---- | --------------------------------------------------- | -------- | ------: | :---: | ------: | ------------------------------------------------- |
| T1   | Drones armados vs. escudo antidrón con IA           | F1×F3    |       5 |   A   |      15 | `F3-MAPPOEA-014`, `F3-MAPPOEA-019`, `F1-DAIO-027` |
| T2   | La FAC depende del espacio ajeno (GNSS/SSA)         | F1×F2    |       5 |   A   |      15 | `F2-SWF-124`, `F2-CSIS-142`, `F1-CSET-065`        |
| T5   | Punto ciego de las alertas en la Orinoquía-Amazonía | F3+IA    |       5 |   A   |      15 | `F3-ALERTAS-*`, `F3-AMAZONUW-074`                 |
| F3-1 | El oro desplaza a la coca                           | F3       |       5 |   A   |      15 | `F3-MAPPOEA-014`, `F3-MAPPOEA-019`, alertas       |
| F1-1 | De 2.000 a 20 personas (Maven)                      | F1       |       4 |   A   |      12 | `F1-CSET-125`, `F1-CSET-103`                      |
| F1-3 | Paradoja: 3 % del PIB sin IA de defensa             | F1       |       4 |   A   |      12 | `F1-DAIO-035`, `F1-ILIA-005`                      |
| F2-3 | Herencia de los ASAT                                | F2       |       4 |   A   |      12 | `F2-SWF-102`, `F2-SWF-105`, `F2-SWF-107`          |
| T6   | China en el hemisferio                              | F1×F2×F3 |       4 |   A   |      12 | `F2-SWF-080`, `F3-CEEEP-034`, `F3-CEEEP-054`      |
| F1-6 | Armas autónomas: decisión de noviembre de 2026      | F1       |       4 |   A   |      12 | `F3-SIPRI-027`/`028`/`044` + web                  |
| F2-6 | Declaración de Bogotá y la órbita geoestacionaria   | F2       |       4 |   A   |      12 | `F2-SWF-126`, `F2-UNOOSA-030`                     |
| F2-5 | Viasat y el segmento terrestre                      | F2       |       4 |   A   |      12 | `F2-SWF-120`, `F3-RESDAL-013`                     |
| F3-2 | Amazonía como espacio criminal único                | F3       |       4 |   A   |      12 | `F3-AMAZONUW-074`, `F3-CEEEP-040`                 |
| T7   | Grafo tri-fenómeno                                  | Todos    |       4 |   A   |      12 | `grafo.graphml`, `conexiones.md`                  |
| F2-2 | GNSS jamming/spoofing                               | F2       |       5 |   M   |      10 | `F2-CSIS-142`, `F2-SWF-120`                       |
| F2-4 | El satélite colombiano en 3D                        | F2       |       5 |   M   |      10 | `F2-ESA-028` + TLE externo                        |
| T3   | Ojo satelital sobre economías ilícitas              | F2×F3    |       5 |   M   |      10 | `F2-INPE-055`, `F3-CEOBS-008`                     |
| T4   | Starlink en la selva                                | F2×F3    |       5 |   M   |      10 | `F2-SWF-124` + web                                |
| F1-5 | Soberanía de cómputo                                | F1       |       3 |   A   |       9 | `F1-ILIA-004`/`-009`                              |
| F3-9 | MUSE por drones                                     | F1×F3    |       3 |   A   |       9 | `F3-MAPPOEA-019`                                  |
| F1-4 | Ucrania: autonomía contra la guerra electrónica     | F1×F2    |       4 |   M   |       8 | `F1-DAIO-023`, `F2-SWF-124`                       |
| F3-3 | Violencia política y riesgo electoral               | F3       |       4 |   M   |       8 | `F3-MAPPOEA-014`, `-019`                          |
| F3-5 | Terrorismo: explosivos y oleoductos                 | F3       |       4 |   M   |       8 | `F3-MAPPOEA-014`                                  |
| F3-7 | Infraestructura crítica                             | F2×F3    |       4 |   M   |       8 | `F3-MAPPOEA-014`, `F3-RESDAL-092`, `F3-CEEEP-054` |
| F3-8 | Riesgo climático y conflicto                        | F2×F3    |       4 |   M   |       8 | `F3-MAPPOEA-014`, `F2-INPE-055`, `F3-SIPRI-031`   |
| F1-2 | Lista de deseos del EPL                             | F1       |       3 |   M   |       6 | `F1-CSET-115`, `F1-CSET-031`                      |
| F1-7 | Desinformación con IA                               | F1×F3    |       3 |   M   |       6 | `F3-CEEEP-004`, `F1-AIINDEX-023`                  |
| F2-7 | Reabastecimiento chino en GEO                       | F2       |       3 |   M   |       6 | `F2-SWF-103`/`104`                                |
| F3-6 | Migración y crisis humanitaria                      | F3       |       3 |   M   |       6 | alertas, `F3-MAPPOEA-014`                         |
| F3-4 | Lavado de activos                                   | F3       |       4 |   B   |       4 | `F3-ALERTAS-425`, `F3-MAPPOEA-019`                |

---

## 6. TOP 10 (impacto × factibilidad; el desempate prioriza relevancia para la FAC y cruce de fenómenos)

1. **T1 — Drones armados de grupos ilegales vs. escudo antidrón con IA (F1×F3).** 15. Es la amenaza aérea número uno en el territorio de la FAC. El asistente además expone la discrepancia entre las tres cifras del Escudo.
2. **T2 — La FAC depende del espacio ajeno: GNSS, SATCOM y la frase de Resolute Sentinel 24 (F1×F2).** 15. Es la única mención operativa de Colombia en el corpus de contraespacio.
3. **T5 — El punto ciego: más grupos armados, menos alertas en la Orinoquía-Amazonía (F3 + IA).** 15. Es un insight original obtenido al cruzar dos datasets del corpus.
4. **F3-1 — El oro desplaza a la coca.** 15. Mapa de pequeños múltiplos con el campo de economía de las alertas y los datos de la MAPP/OEA de 2025.
5. **F2-3 — La herencia de los ASAT: la altitud manda.** 12. Visualización limpia con datos 100 % del corpus.
6. **F1-1 — De 2.000 a 20 personas: la IA comprime el ciclo de decisión.** 12. Cifra memorable, que se cierra con salvaguardas de DIH.
7. **F1-3 — La paradoja colombiana: 3 % del PIB en defensa sin IA de defensa documentada.** 12. Contraste con Brasil y el ILIA.
8. **T6 — China en el hemisferio: estaciones terrenas, tecnología digital y Chancay (F1×F2×F3).** 12. Mapa geopolítico que cruza los tres fenómenos.
9. **F1-6 — Armas autónomas: la decisión de noviembre de 2026 y la posición de Colombia.** 12. Es el tema más oportuno por fecha.
10. **T3 + T4 — El ojo satelital sobre las economías ilícitas, con "Starlink en la selva" como gancho (F2×F3).** 10. Responde "¿para qué sirve un satélite colombiano?".

Menciones de reserva: F2-6 (Declaración de Bogotá, excelente como respuesta a una pregunta sorpresa del jurado), F2-4 (el satélite colombiano en 3D, si hay horas para integrar el TLE) y T7 (grafo, como firma visual de todas las demos).

---

## 7. Datos externos vivos por subfenómeno (cuando el corpus no alcanza)

| Fuente                                   | Acceso                                     | Alimenta                                                                                 | Nota                                                                     |
| ---------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| GDELT (DOC 2.0 / GKG)                    | API abierta                                | F1-7 desinformación, F3-3 violencia política, T1 (volumen mediático de "drones")         | Mide cobertura mediática, no hechos.                                     |
| UCDP API (GED)                           | Abierta (token gratuito **por verificar**) | F3-5 terrorismo, F3-3                                                                    | Violencia organizada georreferenciada; revisar el rezago de publicación. |
| ACLED                                    | Requiere cuenta                            | F3-3 protestas y disturbios, T1 (eventos con drones)                                     | Es la mejor fuente para protestas; revisar licencia y términos.          |
| ReliefWeb API                            | Abierta                                    | F3-6 crisis humanitaria, F3-8 desastres                                                  | Informes de situación del Catatumbo.                                     |
| HDX (Humanitarian Data Exchange)         | Abierta                                    | F3-6 desplazamiento, confinamiento                                                       | Conjuntos de OCHA Colombia.                                              |
| UNODC Data                               | Abierta                                    | F3-1 coca, incautaciones                                                                 | Complementa SIMCI.                                                       |
| Datos Abiertos Colombia (datos.gov.co)   | API Socrata abierta                        | F3-1 exportaciones de oro, F3-3 alerta electoral, F3-8 UNGRD/IDEAM, F3-7 infraestructura | Verificar cada conjunto por ID.                                          |
| GAFILAT                                  | Informes PDF                               | F3-4 tipologías de lavado                                                                | No es API; extraer a mano.                                               |
| World Bank API                           | Abierta                                    | F1-3 y F1-5 (PIB, gasto militar % PIB), F3-1 (precio del oro)                            | Indicador MS.MIL.XPND.GD.ZS.                                             |
| CelesTrak (GP/TLE)                       | Abierta                                    | F2-4 órbita del satélite colombiano y Starlink                                           | Space-Track requiere cuenta.                                             |
| GPSJam.org                               | Web (derivado de ADS-B)                    | F2-2 mapa de interferencia GNSS                                                          | Licencia y API **por verificar**.                                        |
| NASA FIRMS                               | API con clave gratuita                     | F3-8 incendios                                                                           |                                                                          |
| INPE TerraBrasilis / Global Forest Watch | Abierta                                    | T3 deforestación                                                                         |                                                                          |

---

## 8. Guion sugerido de 3 demos en vivo (7-8 minutos en total)

Principio: cada demo empieza con una pregunta en lenguaje natural, recibe una respuesta con citas `doc_id`, genera una visualización y cierra con una pregunta de seguimiento que salta de fenómeno. Tener capturas de respaldo de cada paso.

### Demo 1 — "La amenaza que vuela bajo" (F1 × F3; T1 → F3-9 → F1-1 → F1-6)

1. **Pregunta:** "¿Dónde usan drones los grupos armados en Colombia y cómo ha evolucionado la amenaza?"
   - **Respuesta:** los 8 departamentos (`F3-MAPPOEA-014`) y el aumento del segundo semestre de 2025 (`F3-MAPPOEA-019`).
   - **Visualización:** mapa por semestre.
2. **Seguimiento:** "¿Cuánto cuesta el Escudo Antidrón?"
   - **Respuesta:** el asistente muestra las tres cifras y explica que no cuadran (6,3 billones de COP en `F3-MAPPOEA-019` frente a las fuentes web). **Aquí está el momento wow de rigor.**
3. **Seguimiento:** "¿Qué capacidades de IA ayudarían a neutralizarlos y qué límites impone el DIH?"
   - **Respuesta:** `F1-DAIO-027` y `F1-DAIO-005` (IA contra enjambres), `F1-CSET-125` (de 2.000 a 20 personas) y el cierre con SIPRI y la decisión de la CCW en noviembre de 2026.
   - **Visualización:** grafo T7 filtrado.

### Demo 2 — "La FAC y el espacio que no controla" (F1 × F2; T2 → F2-2 → F2-3 → F2-6)

1. **Pregunta:** "Si mañana hay spoofing de GPS sobre Colombia, ¿qué se afecta y qué evidencia internacional existe?"
   - **Respuesta:** Kaliningrado (`F2-CSIS-142`), Irán contra Starlink (`F2-SWF-120`) y la geocerca de 75 km/h de Starlink contra drones (`F2-SWF-124`).
   - **Visualización:** matriz de dependencias servicio × misión.
2. **Seguimiento:** "¿Y Colombia tiene conciencia situacional espacial propia?"
   - **Respuesta:** la frase de Resolute Sentinel 24 (`F2-SWF-124`).
   - Opcional: el satélite colombiano en 3D (F2-4).
3. **Seguimiento:** "¿Qué pasaría si hubiera una prueba antisatélite en su órbita?"
   - **Visualización:** barras de la herencia de los ASAT (2.351 fragmentos siguen en órbita contra 5).
   - **Cierre:** "Por cierto, Colombia reclama un segmento de la órbita geoestacionaria" (`F2-SWF-126`).

### Demo 3 — "La selva que nadie alerta" (F2 × F3; T5 → F3-1 → T3/T4 → T6)

1. **Pregunta:** "¿Qué departamentos tienen mucha presencia armada pero pocas alertas tempranas?"
   - **Visualización:** dispersión y mapa bivariado T5 (Guainía, Vichada, Vaupés, Guaviare).
   - **Cierre del paso:** se explica que es un hallazgo del cruce de datos, con advertencia de muestra.
2. **Seguimiento:** "¿De qué viven allí los grupos armados?"
   - **Respuesta:** el oro desplaza a la coca (`F3-MAPPOEA-014`); presencia transfronteriza (`F3-AMAZONUW-074`).
   - **Visualización:** pequeños múltiplos por economía.
3. **Seguimiento:** "¿Cómo podría vigilarlo la FAC desde el espacio?"
   - **Respuesta:** DETER con CBERS y Amazonia-1 (`F2-INPE-055`), metodología de CEOBS (`F3-CEOBS-008`), Starlink en garimpos (web, señalada como externa) y, si hay tiempo, el mapa de estaciones chinas (`F2-SWF-080`).
   - **Cierre:** recomendación fundamentada con hechos e interpretación separados.

---

## 9. Riesgos transversales y reglas para el pitch

- No mezclar series de ataques con drones (inteligencia, MinDefensa y Defensoría miden cosas distintas).
- Todo lo que sea FACSAT, SpOC, Orión, Kepler o EDAES es [H-web]. Si se quiere que el asistente lo responda, hay que añadirlo como fuente externa trazable.
- Nombre de la institución: el 21-ago-2026 el Gobierno anunció el regreso a "Fuerza Aérea Colombiana"; el nombre constitucional vigente sería "Fuerza Aeroespacial Colombiana" (**por verificar** el trámite). Usar la sigla "FAC".
- Los conteos de las alertas del corpus son una muestra (363 fichas), no el universo de la Defensoría.
- Las preguntas del jurado q046, q047 y q048 no tienen respaldo suficiente en el corpus. El asistente debe decirlo explícitamente en lugar de inventar.
