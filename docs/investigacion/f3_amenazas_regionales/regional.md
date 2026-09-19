# Perspectiva regional — América Latina y el Caribe

---

## 1. La violencia letal baja en el agregado y se concentra en focos

**Hecho.** En 2025 al menos **108.838 personas fueron asesinadas** en América Latina y el Caribe.
La tasa mediana de homicidios se situó en torno a **17,6 por 100.000 habitantes**, más de 5 % por
debajo de 2024, pese al uso cada vez más extendido de estados de excepción, a una respuesta más
militarizada frente al crimen organizado y al crecimiento de las economías criminales
(https://insightcrime.org/es/noticias/balance-insight-crime-homicidios-2025/, marzo de 2026).

| País | Tasa 2024 | Tasa 2025 | Variación | Dinámica dominante |
|---|---:|---:|---:|---|
| Haití | ~62 | 68 | +9,7 % | Control pandillero territorial; 8.100 asesinatos hasta noviembre; expansión a Artibonite y Centre |
| Ecuador | ~38,8 | 50,9 | +31,2 % | Guerra Choneros–Lobos tras la captura de "Fito"; 75 muertos en 4 motines carcelarios |
| Colombia | 25,3 | 25,8 | +1,9 % | Estabilidad relativa en homicidios pero aumento de enfrentamientos entre grupos en la mitad de los departamentos |
| Brasil | 21 | 19,2 | −8,5 % | Tendencia a la baja desde 2019; 3.615 víctimas menos; alzas en Acre, Rondônia, Roraima, Río Grande do Norte, Río de Janeiro y Distrito Federal |
| Guyana | 14,1 | 15,6 | +10,5 % | Auge de minería ilegal y narcotráfico, con homicidios ligados al oro ilícito en Esequibo |
| Perú | 10,1 | 10,7 | +6,3 % | Extorsión (transporte, préstamos "gota a gota"), delitos ambientales, ataques a defensores ambientales y líderes indígenas |

Fuente de toda la tabla: https://insightcrime.org/es/noticias/balance-insight-crime-homicidios-2025/

**Interpretación.** La lectura agregada engaña. Lo que ocurre es una **redistribución**: Brasil,
que pesa mucho en el promedio, baja; y suben países pequeños o medianos donde la disputa criminal
es aguda (Ecuador, Haití, Guyana). Para el análisis territorial esto significa que la unidad de
observación útil no es el país sino el corredor: la frontera Colombia–Ecuador, el Esequibo, el
Catatumbo, Puerto Príncipe.

**Interpretación.** El caso de Brasil merece una nota: InSight Crime atribuye parte de la caída al
**desplazamiento de la actividad criminal hacia el ciberdelito**, que genera daño sin violencia
física. Es una hipótesis relevante para F3 porque implica que la métrica homicidio pierde poder
como indicador de la fuerza del crimen organizado.

## 2. La Amazonía como un solo espacio criminal de seis países

El dataset georreferenciado de Amazon Underworld (`F3-AMAZONUW-074`) permite cuantificar la
huella criminal en la cuenca amazónica municipio por municipio.

**Hecho.** De 987 municipios amazónicos con datos, **662 (67,1 %) tienen presencia documentada**
de al menos un grupo armado o criminal. En esos municipios viven **32,89 millones de personas**,
sobre 40,47 millones en el total del área cubierta: el **81 % de la población amazónica vive en
un municipio con presencia de grupos armados o criminales** (cálculo propio sobre
`F3-AMAZONUW-074`).

| País | Municipios con datos | Con presencia | % | Población en municipios con presencia | Sin información |
|---|---:|---:|---:|---:|---:|
| Brasil | 772 | 481 | 62,3 % | 24.145.556 | 291 |
| Colombia | 87 | 79 | 90,8 % | 1.695.471 | 8 |
| Ecuador | 40 | 40 | 100 % | 733.952 | 0 |
| Bolivia | 34 | 29 | 85,3 % | 4.188.602 | 5 |
| Perú | 32 | 14 | 43,8 % | 1.498.746 | 18 |
| Venezuela | 22 | 19 | 86,4 % | 631.544 | 3 |
| **Total** | **987** | **662** | **67,1 %** | **32.893.871** | **325** |

Cálculo propio sobre `F3-AMAZONUW-074`.

**Advertencia.** Los 325 municipios "sin información" (291 en Brasil, 18 en Perú) significan que
el porcentaje real de presencia es probablemente mayor. La cifra de Perú (43,8 %) refleja más un
vacío de investigación que una ausencia de actores.

### 2.1 Huella municipal por grupo

**Hecho** (cálculo propio sobre `F3-AMAZONUW-074`):

| Grupo | Municipios | Distribución |
|---|---:|---|
| Comando Vermelho | 403 | Brasil 398, Perú 4, Bolivia 1 |
| PCC (Primeiro Comando da Capital) | 165 | Brasil 163, Bolivia 2 |
| Otros grupos locales | 148 | Brasil 57, Bolivia 29, Ecuador 29, Colombia 13, Perú 11, Venezuela 9 |
| EMC (Estado Mayor Central, disidencias FARC) | 57 | Colombia 54, Ecuador 2, Brasil 1 |
| Clan del Golfo / EGC | 41 | Colombia 19, **Ecuador 17**, Perú 3, Brasil 2 |
| Los Lobos | 40 | Ecuador 40 |
| EMBF (Estado Mayor de Bloques y Frentes) | 31 | Colombia 31 |
| Segunda Marquetalia | 31 | Colombia 19, **Venezuela 12** |
| ELN | 25 | Colombia 13, **Venezuela 12** |
| Los Choneros | 18 | Ecuador 17, Perú 1 |

**Interpretación.** Tres patrones se leen directamente de la tabla:

1. **Las facciones brasileñas son el actor dominante por extensión**, no las colombianas. El
   Comando Vermelho está en 4 de cada 10 municipios amazónicos con datos. Cualquier análisis de la
   Amazonía como espacio de seguridad que arranque desde Colombia subestima este hecho.
2. **La expansión colombiana hacia el exterior es real y medible.** El ELN y la Segunda
   Marquetalia tienen prácticamente la misma huella en Venezuela (12 municipios cada uno) que en
   la Amazonía colombiana (13 y 19). El Clan del Golfo / EGC tiene casi tantos municipios en
   Ecuador (17) como en Colombia (19).
3. **Ecuador es el punto de máxima densidad relativa**: 100 % de sus municipios amazónicos con
   presencia documentada, y con cuatro actores distintos superpuestos (Los Lobos, Los Choneros,
   Comandos de la Frontera, y facciones del EMC como Carolina Ramírez y Comuneros del Sur).

**Hecho.** Los municipios con **cuatro grupos simultáneos** son: Inírida (Guainía); Cumaribo, La
Primavera, Puerto Carreño y Santa Rosalía (Vichada); Aguarico, La Joya de los Sachas, Loreto y
Orellana (Orellana, Ecuador); Cascales, Putumayo y Sucumbíos (Sucumbíos, Ecuador). En los de
Vichada y Guainía coinciden el ELN (Frente Jorge Daniel Pérez Carrero), el EMC (Bloque Amazonas
de Iván Mordisco y Frente 10), la Segunda Marquetalia y el EGC (`F3-AMAZONUW-074`).

**Interpretación.** Los corredores Guainía–Vichada (frontera con Venezuela, cuenca del Orinoco) y
Sucumbíos–Orellana–Putumayo (frontera Colombia–Ecuador) son los dos nodos de máxima superposición
de actores en la Amazonía. Son las zonas donde una herramienta de analítica visual debería
enfocar primero.

### 2.2 La lectura académica de la Panamazonía

**Hecho.** El CEEEP caracteriza la Amazonía como región donde convergen tres dimensiones de
amenaza: geopolíticas o tradicionales; de seguridad, ligadas a vulnerabilidades estatales,
debilidades institucionales y lucha contra ilícitos; y socioambientales. Al ser un espacio
colectivo de ocho países con desafíos similares, propone la **Organización del Tratado de
Cooperación Amazónica (OTCA)** como la mejor vía de respuesta (`F3-CEEEP-068`, Medeiros Filho).
Un segundo artículo analiza específicamente el potencial de la OTCA para combatir el crimen
organizado transnacional desde una perspectiva ambiental, reemplazando a UNASUR como foro
(`F3-CEEEP-006`).

**Hecho.** Sobre la triple frontera Brasil–Colombia–Perú, el corpus documenta la convergencia de
grupos armados organizados y grupos de delincuencia organizada con el crimen organizado
transnacional, reforzada por economías ilícitas fronterizas, y cuestiona si los mecanismos
previstos en las políticas de defensa y seguridad de los tres países han alcanzado los resultados
esperados (`F3-CEEEP-040`).

**Hecho.** En el Alto Putumayo, del lado peruano, los grupos armados organizados residuales
(GAOR) son los principales actores del tráfico ilícito de drogas en la zona fronteriza. Ante la
ausencia del Estado peruano se han consolidado, y sus actividades económicas constituyen en gran
medida **la única alternativa de la población aledaña para salir de la pobreza**
(`F3-CEEEP-041`).

**Interpretación.** Esa última frase es la clave del problema de gobernanza regional: la economía
ilícita no compite con la economía legal, la sustituye. Las intervenciones de erradicación o
interdicción que no ofrecen una alternativa económica real trasladan el costo a las comunidades,
lo que el corpus documenta también en Colombia, donde las comunidades valoraron la intervención
de minas pero advirtieron que estas acciones afectan la economía local (`F3-MAPPOEA-014`).

## 3. El efecto derrame del proceso de paz colombiano

**Hecho.** El acuerdo de paz de 2016 entre el Gobierno de Colombia y las FARC produjo efectos
colaterales continentales: los grupos que no participaron en la negociación continuaron sus
acciones delictivas, se trasladaron a países limítrofes y establecieron alianzas con bandas
criminales de esos Estados. El ELN, facciones de las FARC y el Clan del Golfo migraron a países
vecinos, **especialmente a Ecuador**, convirtiendo en transnacional una criminalidad antes local y
perturbando la gobernabilidad del país contiguo (`F3-CEEEP-079`).

**Hecho.** La MAPP/OEA documenta la contraparte reciente y concreta: en Nariño y Putumayo, en las
zonas de frontera con Ecuador y Perú, los grupos armados continuaron con la extracción ilícita de
yacimientos mineros y **establecieron alianzas con bandas delincuenciales extranjeras** para
promover esa práctica (`F3-MAPPOEA-019`).

**Interpretación.** La cadena causal que el corpus permite sostener es: acuerdo de paz → vacío de
control en corredores → reacomodo de actores no firmantes → internacionalización de alianzas →
deterioro de seguridad en países vecinos. El dato de Amazon Underworld sobre 17 municipios
amazónicos ecuatorianos con presencia del Clan del Golfo / EGC y 40 con Los Lobos es la
manifestación medible de ese proceso.

## 4. Una tipología nueva: la exo-criminalidad de riesgo

**Hecho.** Zeballos y Farah proponen el concepto de **Exo-Criminalidad de Riesgo (ECR)**: una
variante delictiva que se diferencia de la criminalidad organizada tradicional porque se origina
en factores externos —dinámicas migratorias, crisis sociales y otras presiones exógenas— en lugar
de una planificación estratégica de una cúpula criminal. Se caracteriza por adaptabilidad y
flexibilidad operativa, se integra rápidamente en ecosistemas criminales locales y modifica los
patrones convencionales de adscripción delictual. El estudio distingue dos modelos de expansión
criminal: el COT estratégico y la ECR (`F3-CEEEP-018`, 2025).

**Interpretación.** El concepto explica fenómenos que la categoría "cartel" no explica bien: la
expansión del Tren de Aragua a lo largo de las rutas migratorias venezolanas, o la aparición de
bandas locales en ciudades receptoras de migración. Es relevante para Colombia: el Tren de Aragua
aparece en una alerta temprana de Bogotá (`F3-ALERTAS-035` y siguientes del conjunto de Bogotá
D.C.), y 98 de las 363 alertas incluyen a población migrante o venezolana entre los grupos en
riesgo (cálculo propio sobre `F3-ALERTAS-001`…`-363`). La víctima de la ECR y su base de
reclutamiento son en parte la misma población.

## 5. Minería ilegal de oro como amenaza regional

**Hecho.** En Perú, la minería ilegal habría movilizado más de **104 toneladas de oro en 2025**
según el Instituto Peruano de Economía (https://www.rumbominero.com, marzo de 2026). En Colombia,
las exportaciones de oro crecieron 36,8 % en 2025 respecto a 2024
(https://www.lasillavacia.com, enero de 2026) y la Asociación Colombiana de Minería estima en 5
billones de pesos las regalías que el Estado pierde por extracción ilegal
(https://www.larepublica.co, octubre de 2025).

**Hecho.** El CEEEP documenta el caso de **La Rinconada (Puno, Perú)**: organizaciones criminales
dedicadas al tráfico de oro, contrabando y crimen transnacional, con acceso a armamento y
financiamiento ilícito; control territorial basado en violencia y corrupción que debilita la
autoridad del Estado, explota a los trabajadores mineros y monopoliza el comercio ilegal de
insumos, sosteniendo una economía clandestina paralela con alcance nacional e internacional
(`F3-CEEEP-014`, 2025). También analiza el corredor minero del sur del Perú como problema de
gobernabilidad (`F3-CEEEP-020`) y la destrucción de la seguridad hídrica asociada
(`F3-CEEEP-070`).

**Hecho.** En Guyana, InSight Crime vincula parte del aumento de homicidios en 2025 al auge de la
minería ilegal y el narcotráfico en regiones estratégicas como **Esequibo**, con asesinatos
ligados a la industria ilícita del oro
(https://insightcrime.org/es/noticias/balance-insight-crime-homicidios-2025/).

**Interpretación.** El oro es la economía ilícita que más claramente se ha vuelto regional y
transversal: opera en Perú, Colombia, Guyana, Venezuela, Ecuador y Brasil, con las mismas lógicas
(control de insumos, renta sobre la maquinaria, monopolio de comercialización, contaminación por
mercurio) y con precios internacionales al alza que superaron los 4.000 dólares por onza en
octubre de 2025 (https://www.eltiempo.com). A diferencia de la cocaína, tiene una vía de
lavado directa hacia el mercado formal vía exportación, lo que hace más difícil su interdicción.

## 6. Migración venezolana: menos personas en tránsito, más personas por integrar

**Hecho.** A agosto de 2026, la plataforma R4V reporta **6.978.009 refugiados y migrantes
venezolanos** en los 17 países de su respuesta en América Latina y el Caribe
(https://www.r4v.info/en/refugeeandmigrants). La propia plataforma advierte que la cifra suma los
reportes de los gobiernos anfitriones, no implica identificación individual, y que al no
contabilizarse los venezolanos sin estatus regular el total real es probablemente mayor.

**Hecho.** El tránsito irregular por el **Darién colapsó**: 3.091 migrantes cruzaron la selva en
todo 2025, una caída del 99 % respecto a 2024 (https://www.portafolio.co, enero de 2026), y en el
primer semestre de 2026 volvió a caer 90,4 % frente al mismo periodo del año anterior
(https://caracol.com.co, agosto de 2026). La OIM reportó 26 muertes y 8 desapariciones de
migrantes en Centroamérica en 2025 (https://www.laprensagrafica.com, mayo de 2026).

**Interpretación.** El eje de la política migratoria regional se desplazó del **tránsito** a la
**integración y el retorno**. Con el Darién cerrado de facto y flujos de retorno hacia el sur, la
presión se concentra en los países de acogida —sobre todo Colombia, Perú y Brasil— y en la
capacidad de sus sistemas locales de salud, educación y protección. El corpus ya documentaba la
profundización de sentimientos xenófobos por el aumento de asentamientos informales en Antioquia,
Bolívar, Cesar, Guaviare, Meta, Norte de Santander y Valle del Cauca, y la sobrecarga de los
sistemas de atención (`F3-MAPPOEA-023`).

**Hecho.** El corpus documenta el uso persistente de **"trochas"** (pasos informales) en la
frontera colombo-venezolana pese a la reapertura de pasos autorizados, explicado por: el
desconocimiento de la población venezolana sobre la documentación migratoria requerida; el temor
a presuntos actos de corrupción de autoridades de ambos países; la distancia desde zonas rurales
apartadas; y la persistencia de economías informales e ilícitas en esos territorios
(`F3-MAPPOEA-023`).

## 7. Gasto militar y armas en la región

**Hecho.** América del Sur gastó **56.300 millones de dólares** en defensa en 2025, un 3,4 % más
que en 2024 pero solo 5,7 % más que en 2016. América Central y el Caribe gastaron **17.100
millones**, un 27 % menos que en 2024 aunque 64 % más que en 2016 (`F3-SIPRI-076`).

**Hecho.** Los movimientos por país en 2025 (`F3-SIPRI-076`):

- **México**: cayó un tercio, a 13.600 millones, tras un aumento del 71 % en 2024. México domina
  la serie de América Central y el Caribe, por lo que su caída explica el −27 % subregional.
- **Brasil**: subió 13 %, a 23.900 millones, principalmente por inversión en desarrollo
  tecnológico naval y mayores costos de personal militar.
- **Guyana**: subió 16 %, a 248 millones, impulsado por la escalada de tensiones con Venezuela
  por la región petrolera del Esequibo.
- **Venezuela**: no ha reportado públicamente cifras de gasto durante varios años; SIPRI excluye
  a Cuba y Venezuela de los totales regionales.

**Hecho.** Las importaciones de armas de América del Sur crecieron **31 %** entre 2016–20 y
2021–25, con 6 de 12 Estados aumentando. Brasil recibió el 60 % de las importaciones
subregionales, un 150 % más que en 2016–20. Los principales proveedores de la subregión fueron
**Francia (41 %), Estados Unidos (12 %) y Suecia (11 %)** (`F3-SIPRI-094`).

**Hecho.** Programas de adquisición en curso citados por SIPRI: Argentina encargó aviones de
combate a Dinamarca; **Brasil y Colombia** encargaron aviones de combate a Suecia; Brasil también
encargó fragatas a Alemania y submarinos a Francia; Perú encargó una fragata y submarinos a Corea
del Sur (`F3-SIPRI-094`). El contrato colombiano se firmó con Saab el 14 de noviembre de 2025 por
17 aviones Gripen E/F, con un presupuesto aprobado en torno a 4.300 millones de dólares
(https://www.infodefensa.com, https://www.defensa.com, nov. de 2025).

**Interpretación.** El dato más significativo es el desplazamiento del proveedor: Francia y Suecia
por delante de Estados Unidos en América del Sur. Es un cambio estructural de dependencia
tecnológica que tiene consecuencias de interoperabilidad, sostenimiento logístico y alineamiento
político a 30 años vista, no solo un dato de compras.

## 8. El marco institucional comparado de la defensa (RESDAL)

El Atlas Comparativo de la Defensa en América Latina y Caribe, edición 2024 (`F3-RESDAL-092`), es
la referencia del corpus para el marco legal e institucional. Hechos directamente citables:

- **Las fuerzas armadas latinoamericanas tienen mandatos de seguridad interior explícitos en la
  ley.** En Colombia, el Decreto 1512 de 2000 (art. 79) prevé la asistencia militar cuando la
  Policía Nacional no está por sí sola en capacidad de contener un grave desorden o enfrentar una
  catástrofe. Bolivia, Cuba y otros países tienen disposiciones análogas.
- **Varios países asignan a las fuerzas armadas un mandato ambiental.** En Colombia, la ley que
  organiza el Sistema Nacional Ambiental (art. 103) les encarga velar en todo el territorio
  nacional por la protección y defensa del medio ambiente y los recursos naturales renovables.
  En Cuba, la ley de defensa nacional (art. 34) prevé su empleo en actividades de provecho para
  el desarrollo económico social y la protección del medio ambiente.
- **La finalidad primordial de las Fuerzas Militares de Colombia** es la defensa de la soberanía,
  la independencia, la integridad del territorio nacional y el orden constitucional (Decreto
  1512-2000, art. 27).
- **Despliegue ante desastres**: la Operación Taquiri 2 movilizó más de 15.000 efectivos de las
  Fuerzas Armadas brasileñas en Río Grande do Sul, con 42 aeronaves, 243 embarcaciones y 2.500
  vehículos y equipos de ingeniería; Perú movilizó 5.000 efectivos ante el ciclón Yaku.
- **El CEEEP debate el mismo problema desde el lado peruano**: definir el apoyo de las Fuerzas
  Armadas a la Policía Nacional (`F3-CEEEP-009`) y su rol en el control del orden interno
  (`F3-CEEEP-013`).

**Interpretación.** El mandato ambiental legal de las fuerzas armadas es el enganche
jurídico-institucional entre el eje "seguridad ambiental" y el eje "actores armados" del fenómeno
3. En Colombia existe base legal para que la Fuerza Pública actúe contra la minería ilícita y la
deforestación como misión propia, no solo como apoyo a otras autoridades.

**Advertencia.** Las tablas comparativas del Atlas (presupuesto de defensa por país, % del PIB,
efectivos, personal militar por 10.000 habitantes) **no son recuperables** del texto extraído: los
valores quedan desligados de sus encabezados. Cualquier cifra comparada de presupuestos o
efectivos de la región tomada de RESDAL debe consultarse en el PDF original.

## 9. Gobernanza, informalidad y desigualdad

**Hecho.** El CEEEP trata la informalidad, la corrupción y la impunidad como **amenazas
estructurales a la seguridad nacional** (`F3-CEEEP-021`, 2025), y analiza la relación entre
radicalización ideológica, crimen organizado y seguridad nacional en el marco de la intervención
de las fuerzas armadas (`F3-CEEEP-012`). También examina el potencial secesionista de movimientos
regionales en el sur del Perú (`F3-CEEEP-072`) y la ciudadanía como problema público con impacto
en seguridad y defensa (`F3-CEEEP-029`).

**Hecho.** SIPRI aporta el ángulo de fragilidad estatal y construcción de paz (`F3-SIPRI-017`,
`F3-SIPRI-046`), el apoyo a seguridad, justicia y gobernanza inclusiva en entornos restrictivos
(`F3-SIPRI-043`, `F3-SIPRI-117`) y la reforma del sector de seguridad en transiciones de la ONU
(`F3-SIPRI-069`).

**Interpretación y vacío.** La dimensión de **desigualdad** del fenómeno 3 está mal cubierta por
el corpus: no hay fuentes de CEPAL, PNUD ni DANE. El argumento de desigualdad tiene que
construirse de forma indirecta, a partir de tres elementos que sí están: (1) la economía ilícita
como única vía de salida de la pobreza en zonas de frontera (`F3-CEEEP-041`); (2) la
incapacidad fiscal de los municipios para atender el desplazamiento forzado, documentada en
Antioquia, Arauca, Bolívar, Cauca, Córdoba y Norte de Santander (`F3-MAPPOEA-019`); y (3) el
déficit presupuestal para indemnizar a un universo creciente de víctimas (`F3-MAPPOEA-014`).
