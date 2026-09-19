# Fuentes del corpus — fenómeno 3

888 documentos (`fenomeno: 3` en `data/processed/docs.jsonl`), repartidos en 7 organizaciones.
El texto extraído de cada uno está en `data/processed/text/<doc_id>.txt`.

| Organización | Docs | Carpeta en el corpus | Rango temporal | Formatos |
|---|---:|---|---|---|
| Alertas_Tempranas (Defensoría del Pueblo, Colombia) | 425 | `F3_Dinamicas_Territoriales/Alertas_Tempranas/` | 2017–2026 | 363 JSON + 62 PDF |
| SIPRI | 128 | `.../SIPRI/` | 2020–2026 | JSON (posts) + PDF (fact sheets, papers) |
| RESDAL | 107 | `.../RESDAL/` | 2005–2024 | PDF (Atlas comparativo de la defensa) |
| CEEEP (Centro de Estudios Estratégicos del Ejército del Perú) | 80 | `.../CEEEP/` | 2021–2026 | JSON (resúmenes de artículos) |
| Amazon_Underworld | 75 | `.../Amazon_Underworld/` | s.f. (dataset) | 1 CSV + 73 PBF (teselas vectoriales) + 1 JSON |
| CEOBS (Conflict and Environment Observatory) | 38 | `.../CEOBS/` | 2024–2026 | JSON (artículos) + PDF |
| MAPP_OEA | 35 | `.../MAPP_OEA/` | 2008–2026 | PDF (informes semestrales/periódicos + estudios) |

---

## 1. Alertas Tempranas — Defensoría del Pueblo de Colombia (425 docs)

Es la fuente **más densa y más operativa** del corpus F3 y la única que permite construir
granularidad municipal para Colombia.

### 1.1 Los 363 registros JSON (`F3-ALERTAS-001` … `F3-ALERTAS-363`)

Cada archivo es el *scrape* de una ficha de `alertastempranas.defensoria.gov.co`. La estructura
original (en `data/adl/corpus/.../alertas/ALERTAS_<codigo>-<detail_id>.json`) tiene un campo
`alerta_meta` con datos ya normalizados:

```json
{
  "codigo": "001-21",
  "tipo": "Estructural",
  "fecha_emision": "2021-01-07",
  "tema_clave": "El riesgo se configura a partir de la reconfiguración y reacomodamiento de los actores armados ilegal, con posterioridad a la firma del Acuerdo Final.",
  "municipios": "Curillo, San José del Fragua, Solita (Caquetá); Piamonte (Cauca); Puerto Guzmán (Putumayo)",
  "detail_url": "https://alertastempranas.defensoria.gov.co/Alerta/Details/91789",
  "detail_id": "91789"
}
```

El texto plano en `text/F3-ALERTAS-NNN.txt` concatena los `body_paragraphs` de la ficha, que
siempre siguen el mismo orden:

1. Veredas afectadas (lista separada por `;`)
2. Resguardos indígenas afectados
3. Grupos armados advertidos (lista)
4. Descripción del escenario de riesgo
5. Poblaciones en riesgo (lista separada por `;`)
6. Tipo de alerta (`Inminencia` / `Estructural`)
7. Municipios con su departamento entre paréntesis

Ejemplo mínimo completo (`F3-ALERTAS-001`, alerta de inminencia, Cartagena de Indias, Bolívar):
AGC como actor; riesgo por amenazas a líderes del Consejo Comunitario El Mango de Púa II;
poblaciones en riesgo: adolescentes, adultos mayores, afrodescendientes, campesinos, defensores
de DDHH, mujeres, niños y niñas, víctimas del conflicto, población desplazada.

**Cómo explotarlo:** el campo `municipios` es parseable con
`re.findall(r'\(([^)]*)\)', muni)` para departamento y el texto previo a cada paréntesis para
municipios. Esto es lo que permite la tabla por departamento de [`colombia.md`](colombia.md).

**Limitación:** el texto es la *ficha resumen*, no el documento de alerta. No trae conteos de
población afectada, ni el análisis de riesgo completo, ni las recomendaciones. Cuando una alerta
menciona 300 veredas, el texto las lista pero no dice cuántas personas viven allí.

Distribución por tipo y año (los 363 registros):

| | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Alertas | 1 | 86 | 56 | 54 | 29 | 34 | 39 | 27 | 20 | 17 | 363 |

197 de inminencia, 166 estructurales.

### 1.2 Los 62 PDF de informes (`F3-ALERTAS-364` … `F3-ALERTAS-425`)

Son los oficios y documentos de alerta remitidos al Ministerio del Interior (Secretaría Técnica
de la CIPRAT), casi todos de 2018–2020. Contienen el análisis de riesgo completo: contexto,
actores, conductas vulneratorias con cifras, casos, recomendaciones. La calidad del OCR es muy
variable (varios encabezados salen ilegibles).

Los más útiles:

- `F3-ALERTAS-386` — Informe de seguimiento a la **AT 026-18 sobre personas defensoras de DDHH y
  líderes sociales** (agosto de 2019). Contiene la línea base nacional: 886 conductas
  vulneratorias entre enero de 2016 y febrero de 2018, 260 homicidios registrados por el SAT
  hasta la emisión de la alerta, 322 municipios advertidos en 32 departamentos (frente a 277
  municipios del Informe de Riesgo 010-17).
- `F3-ALERTAS-410` — Alerta sobre Soacha (Cundinamarca): riesgo específico sobre población
  migrante venezolana y población socialmente estigmatizada, con cifras municipales de la
  Policía Nacional y cronología de hechos de "limpieza social".
- `F3-ALERTAS-375`, `F3-ALERTAS-421`, `F3-ALERTAS-366`, `F3-ALERTAS-405` — los de mayor densidad
  de menciones a minería ilegal.
- `F3-ALERTAS-396` — el de mayor densidad de menciones a deforestación.

---

## 2. MAPP/OEA (35 docs)

Misión de Apoyo al Proceso de Paz en Colombia de la OEA. **La mejor fuente narrativa y más
actual del corpus sobre Colombia.** Dos subconjuntos:

### 2.1 Informes semestrales / periódicos al Consejo Permanente

Serie continua del informe XXIII al 40. Los más recientes y, por tanto, los que hay que usar por
defecto:

| doc_id | Informe | Periodo cubierto | Publicación |
|---|---|---|---|
| `F3-MAPPOEA-019` | Cuadragésimo (40) | 1 jul – 31 dic 2025 | 22 may 2026 |
| `F3-MAPPOEA-014` | Trigésimo noveno (39) | 1 ene – 30 jun 2025 | 2 dic 2025 |
| `F3-MAPPOEA-018` | 35 | — | — |
| `F3-MAPPOEA-020` | 36 | — | — |
| `F3-MAPPOEA-013` / `-012` | 37 (esp / eng) | — | — |
| `F3-MAPPOEA-023` | XXXIV | — | — |
| `F3-MAPPOEA-021` / `-022` | XXXII / XXXIII | — | — |

Cobertura declarada del informe 40: 967 misiones en terreno, 272 centros poblados de 169
municipios en 20 departamentos; 260.210 km recorridos por vía terrestre y 3.050 km por vía
fluvial (`F3-MAPPOEA-019`). Informe 39: 977 misiones, 295 centros poblados, 161 municipios, 22
departamentos, 22 recomendaciones emitidas (`F3-MAPPOEA-014`).

Estructura estable de estos informes, útil para *routing* de preguntas:

1. Contexto de seguridad y dinámicas de los Grupos Armados (GA)
2. Conversaciones y diálogos de paz (un apartado por mesa: EGC, EMBF, Comuneros del Sur, CNEB,
   Buenaventura, estructuras urbanas)
3. Implementación del Acuerdo Final, víctimas, justicia transicional, restitución de tierras
4. Afectaciones a la población civil y a grupos de especial protección
5. Paz ambiental (afectaciones al medio ambiente, extracción ilícita de yacimientos mineros)
6. Escenarios fronterizos y flujos migratorios (en los informes anteriores al 39)

### 2.2 Estudios temáticos (2008–2016)

`F3-MAPPOEA-001` a `-011`, más `-024`, `-027`, `-017`. Cubren justicia y paz, restitución de
tierras (`-008`, `-009`, `-010`), DDR con enfoque de mujeres (`-007`), prueba social y de
contexto (`-011`), participación de víctimas ante la JEP (`-024`). Valor histórico, no de
coyuntura.

`F3-MAPPOEA-025` / `-026` son el catálogo (CSV/JSON) de la colección.

---

## 3. Amazon Underworld (75 docs) — dataset georreferenciado

No es texto: es un **dataset de presencia de grupos criminales por municipio en la cuenca
amazónica**. Pieza clave para visualización.

- `F3-AMAZONUW-074` (`AMAZONUW_amazonunderworld-data.csv`): 4.369 filas = 987 municipios únicos
  con datos, repetidos en varias teselas de zoom. Columnas:
  `au_country`, `au_level1` (departamento/estado/provincia), `au_level2` (municipio),
  `b_ADM1_PCODE`/`b_ADM2_PCODE` (códigos administrativos), `au_area_km2`, `au_population`,
  `au_invest_with_presence` (booleano: se documentó presencia), `au_no_info`,
  `grupo_EMC`, `grupo_EMBF`, `grupo_ELN`, `grupo_CDF_AGC`, `grupo_Seg_Marquetalia`,
  `grupo_Los_Lobos`, `grupo_Los_Choneros`, `grupo_CV` (Comando Vermelho), `grupo_PCC`,
  `grupo_Others`, `total_grupos_presentes`, `grupos_detalle_ES/PT/EN` (nombres de frentes y
  estructuras concretas, en texto libre).
- `F3-AMAZONUW-001` … `-073`: teselas vectoriales `.pbf` de la misma capa (`au_compilado_R02`) a
  distintos niveles de zoom. Contienen la misma información en formato de mapa.
- `F3-AMAZONUW-075`: índice de teselas.

Los booleanos usan los valores `VERDADERO`/`FALSO` (locale español). Deduplicar por
`au_ID_concatenated`.

Cobertura: Brasil 772 municipios, Colombia 87, Ecuador 40, Bolivia 34, Perú 32, Venezuela 22.

---

## 4. SIPRI (128 docs)

Dos formatos: posts/resúmenes en JSON y publicaciones completas en PDF. Los documentos con datos
duros sobre la región:

| doc_id | Documento | Utilidad para F3 |
|---|---|---|
| `F3-SIPRI-076` | *Trends in World Military Expenditure, 2025* (fact sheet, abril 2026) | Gasto militar mundial, Américas, América Central y el Caribe, América del Sur, por país |
| `F3-SIPRI-094` | *Trends in International Arms Transfers, 2025* (fact sheet) | Importaciones de armas de las Américas y América del Sur, proveedores, programas en curso |
| `F3-SIPRI-052` / `-048` | Resúmenes JSON de los dos anteriores | Titulares y cifras principales |
| `F3-SIPRI-093` | *SIPRI Top 100 arms-producing companies, 2024* | Industria de defensa (Brasil es el único país de la región con presencia relevante) |
| `F3-SIPRI-080` | *ATT Monitor Report 2025* | Cumplimiento del Tratado sobre el Comercio de Armas; desvío de armas pequeñas |
| `F3-SIPRI-113` | *Report on international arms flows* | Flujos de armas, incluido el desvío hacia actores no estatales |
| `F3-SIPRI-031` | *Climate, Peace and Security Fact Sheet: Haiti 2025* | El único fact sheet clima-paz-seguridad de la región en el corpus |
| `F3-SIPRI-029` / `-109` | *Climate change, human mobility and security* | Marco conceptual clima–movilidad–seguridad, aplicable a migración latinoamericana |
| `F3-SIPRI-040` / `-115` | *Rebalancing military spending towards sustainable development* | Tensión gasto militar vs. ODS; argumento útil para gobernanza y desigualdad |
| `F3-SIPRI-017` / `-046` | *Lasting solutions to fragility depend on peacebuilding* | Fragilidad estatal y construcción de paz |

**Limitación importante:** las tablas de los fact sheets (`table 1`, `table 2`, con el gasto por
país) pierden la correspondencia entre encabezados y valores al extraerse a texto. Aparecen las
listas de países (`... Belgium Colombia Mexico Pakistan ...`) y las listas de cifras por
separado. El gasto militar específico de Colombia **no es recuperable de forma fiable** desde el
texto extraído; sí lo son los agregados regionales y los países citados en el texto corrido.

---

## 5. RESDAL (107 docs)

Red de Seguridad y Defensa de América Latina. El corpus trae el **Atlas Comparativo de la Defensa
en América Latina y Caribe** en varias ediciones (2005, 2010, 2012, 2014, 2016, 2024), tanto
completo como por capítulos.

- `F3-RESDAL-092` — Atlas 2024 completo en español (950 KB de texto). La edición más reciente.
- `F3-RESDAL-001` … `-030` — Capítulos sueltos de la edición en español: la región, marco legal,
  instituciones, presupuesto, fuerzas armadas, relaciones internacionales, mujer-paz-seguridad,
  gestión del riesgo, Caribe, y un capítulo por país (Colombia: `F3-RESDAL-013`).
- `F3-RESDAL-034` … `-062` — Capítulos de la edición 2014 en inglés (Colombia:
  `F3-RESDAL-050`).
- `F3-RESDAL-063` … `-091` — Edición 2016 en inglés.
- `F3-RESDAL-096`, `-097`, `-104` — Boletines sobre el rol de las fuerzas armadas en la COVID-19.
- `F3-RESDAL-101` — Tendencias de seguridad y democracia para 2023.
- `F3-RESDAL-031`, `-106`, `-107` — Género en instituciones de defensa (acoso, MOWIP Uruguay).

**Valor real:** el marco **institucional y legal comparado**, que ninguna otra fuente del corpus
da. Ejemplos de lo que se puede citar directamente desde `F3-RESDAL-092`:

- Asistencia militar cuando la Policía Nacional no está en capacidad de contener grave desorden
  (Decreto 1512 de 2000, art. 79 — Colombia).
- Mandato de las fuerzas militares de velar por la protección y defensa del medio ambiente y los
  recursos naturales renovables (ley del Sistema Nacional Ambiental, art. 103 — Colombia).
- Finalidad primordial de las Fuerzas Militares: defensa de la soberanía, la independencia, la
  integridad territorial y el orden constitucional (Decreto 1512-2000, art. 27 — Colombia).
- Participación de las FFAA en desastres: Operación Taquiri 2 en Río Grande do Sul, Brasil,
  con más de 15.000 efectivos, 42 aeronaves, 243 embarcaciones y 2.500 vehículos; Perú, 5.000
  efectivos por el ciclón Yaku.

**Limitación:** igual que SIPRI, las tablas comparativas de presupuesto, efectivos y personal
militar por cada 10.000 habitantes quedan ilegibles en el texto plano.

---

## 6. CEEEP (80 docs)

**Ojo con la atribución:** el CEEEP es el **Centro de Estudios Estratégicos del Ejército del
Perú**, no del Ejército de Colombia. Los documentos son resúmenes (abstract + autores + DOI) de
los artículos de su revista, con foco peruano y regional. Varios artículos sí son de autores
colombianos o sobre Colombia.

Los relevantes para F3, agrupados:

**Crimen organizado y fronteras**
- `F3-CEEEP-040` — *Crimen Organizado Transnacional en la Triple Frontera entre Brasil, Colombia
  y Perú* (Aristizábal González).
- `F3-CEEEP-041` — *Grupos Armados Organizados Residuales y Amenazas Transfronterizas en el Alto
  Putumayo* (Villagra).
- `F3-CEEEP-018` — *La Exo-Criminalidad de Riesgo* (Zeballos y Farah, 2025): tipología que
  distingue el COT estratégico de una criminalidad originada en factores exógenos (migración,
  crisis sociales).
- `F3-CEEEP-012` — Radicalización ideológica, crimen organizado y seguridad nacional.
- `F3-CEEEP-079` — *Consecuencias Transnacionales del Proceso de Paz Colombia–FARC*.

**Amazonía y medio ambiente**
- `F3-CEEEP-068` — *La Naturaleza de las Amenazas en la Panamazonía* (Medeiros Filho).
- `F3-CEEEP-006` — *La OTCA como herramienta de combate al COT desde una perspectiva ambiental*.
- `F3-CEEEP-046` — Cambio climático y su relación con seguridad y defensa.

**Minería ilegal**
- `F3-CEEEP-014` — *La Rinconada: Zona de Amenazas y Desafíos para la Seguridad Nacional* (Puno,
  Perú).
- `F3-CEEEP-020` — Minería, seguridad nacional y gobernabilidad en el corredor minero del sur del
  Perú.
- `F3-CEEEP-070` — Destrucción de la seguridad hídrica y minería en el sur del Perú.

**Narcotráfico y contrainsurgencia**
- `F3-CEEEP-005`, `-071` — VRAEM (inteligencia militar; narcotráfico y terrorismo).
- `F3-CEEEP-078` — El Alto Huallaga como caso de éxito de intervención estatal.
- `F3-CEEEP-063` — Modelos comparados de contrainsurgencia.

**Gobernanza, Estado y actores extrarregionales**
- `F3-CEEEP-021` — Informalidad, corrupción e impunidad como amenazas estructurales.
- `F3-CEEEP-009`, `-013` — Rol de las FFAA en el orden interno y apoyo a la policía.
- `F3-CEEEP-034` — El avance digital de China en América Latina (Ellis).
- `F3-CEEEP-048` — Papel estratégico de América Latina en un conflicto global por Taiwán (Ellis).
- `F3-CEEEP-066` — Reanudación de relaciones de Irán con países de América Latina (Ellis).
- `F3-CEEEP-042` — Mirada desde Washington al nuevo rumbo de Colombia y la "paz total" (Ellis).
- `F3-CEEEP-054` — Megapuerto de Chancay y su impacto geoestratégico.
- `F3-CEEEP-062`, `-064` — Artículos sobre el Ejército Nacional de Colombia.

---

## 7. CEOBS (38 docs)

Conflict and Environment Observatory. **No cubre América Latina.** Sus casos son Sudán, Ucrania,
Irán, Mar Negro. Su valor para F3 es el **marco conceptual y jurídico de la seguridad ambiental
en conflicto**, directamente trasladable a la Amazonía y al conflicto colombiano:

- `F3-CEOBS-016` / `-015` — **WISEN**, base de datos de incidentes bélicos con impacto ambiental
  y su metodología de monitoreo sistemático y comparable entre conflictos.
- `F3-CEOBS-010` — Análisis de la nueva *Policy on Addressing Environmental Damage Through the
  Rome Statute* de la Fiscalía de la Corte Penal Internacional, publicada en diciembre de 2025.
- `F3-CEOBS-037` — Texto del Estatuto de Roma.
- `F3-CEOBS-008` / `-023` — Monitoreo satelital de minería artesanal de oro (Sudán) y campamentos
  mineros como nodos de migración: **metodología directamente aplicable a la minería ilegal
  amazónica**.
- `F3-CEOBS-030` — Evaluación inicial del Convenio de Minamata (mercurio) para Sudán.
- `F3-CEOBS-028` — Guía de la *Green Field Tool*.
- `F3-CEOBS-017` — Cumplimiento ambiental y climático en desminado humanitario (IMAS 07.13).
- `F3-CEOBS-011`, `-012`, `-013`, `-036`, `-014` — Evaluaciones rápidas de daño ambiental en
  Irán y Ucrania.
- `F3-CEOBS-033` — CSV con el listado de publicaciones.

Los archivos `F3-CEOBS-001`, `-002`, `-004` … `-007`, `-019`, `-020`, `-021` tienen 979
caracteres idénticos: son páginas vacías o de navegación. Descartables.

---

## Recomendación de uso por tipo de pregunta

| Si la pregunta es sobre… | Ir primero a… |
|---|---|
| Riesgo en un municipio o departamento de Colombia | Alertas Tempranas (JSON), campo `municipios` + `tema_clave` |
| Qué grupo opera dónde en Colombia | Alertas Tempranas + `F3-MAPPOEA-019` / `-014` |
| Qué grupo opera dónde en la Amazonía (6 países) | `F3-AMAZONUW-074` (CSV), columna `grupos_detalle_ES` |
| Paz total, mesas de diálogo, justicia transicional | `F3-MAPPOEA-019` (lo más reciente), luego `-014` |
| Economías ilícitas y su vínculo con control territorial | `F3-MAPPOEA-014` §5, `F3-MAPPOEA-019` §5 |
| Innovación táctica de los grupos armados (drones, AEI) | `F3-MAPPOEA-019`, `F3-MAPPOEA-014` |
| Gasto militar y compras de armas | `F3-SIPRI-076`, `F3-SIPRI-094` |
| Marco legal e institucional de la defensa | `F3-RESDAL-092`, capítulo del país |
| Crimen organizado transfronterizo, Perú, Amazonía | CEEEP (`-040`, `-041`, `-068`, `-018`) |
| Daño ambiental en conflicto, marco jurídico | CEOBS (`-010`, `-016`) |
