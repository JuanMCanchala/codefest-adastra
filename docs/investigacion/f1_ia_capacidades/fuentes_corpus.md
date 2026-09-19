# F1 — Fuentes del corpus: qué publica cada organización

Inventario del subcorpus del fenómeno 1 (`fenomeno: 1`) en `C:/Programacion/ANDES/data/processed/docs.jsonl`.

**Totales verificados:** 459 documentos F1 de 1.825 en el corpus completo. Por formato: 231 PDF, 205 JSON, 19 CSV, 4 XLSX.

| Organización | Docs | Prefijo doc_id | Rol en F1 |
|---|---|---|---|
| Atlantic Council (GeoTech Center) | 186 | `F1-ATLCOUNCIL-` | Geopolítica de la tecnología, gobernanza de IA, competencia EE. UU.–China |
| CSET Georgetown | 127 | `F1-CSET-` | Núcleo analítico: IA militar, China, semiconductores, ciberdefensa |
| AI Index (Stanford HAI) | 65 | `F1-AIINDEX-` | Serie de datos 2017–2026: inversión, talento, cómputo, política |
| DAIO (Defense AI Observatory) | 35 | `F1-DAIO-` | **Fuente más específica de defensa:** estudios país por país |
| CENIA (Chile) | 27 | `F1-CENIA-` | Centro nacional de IA de Chile; coeditor del ILIA |
| ILIA Latam | 10 | `F1-ILIA-` | Índice Latinoamericano de IA (CENIA + CEPAL), 2023–2025 |
| Ruta N / GEIAL | 7 | `F1-RUTAN-` | Ecosistemas de innovación urbana en ALC (Medellín, Bogotá) |
| Defensa21 LatAm | 2 | `F1-DEFENSA21-` | **Vacío: ambos archivos están vacíos o casi vacíos** |

---

## DAIO — Defense AI Observatory (Helmut Schmidt Universität, Hamburgo)

La fuente decisiva para F1. Es un observatorio que "monitorea y analiza el uso de inteligencia
artificial" en defensa, con una colección sistemática de **estudios país** más estudios temáticos.
Numeración interna `DAIO Study AA|NN` (año | secuencial). Todos en inglés salvo dos en alemán.

### Estudios país (el activo más valioso)

| doc_id | País | Título | Año |
|---|---|---|---|
| `F1-DAIO-009` | **EE. UU.** | *Risky Incrementalism. Defense AI in the United States* (Lauren A. Kahn) | 2023 |
| `F1-DAIO-015` | **China** | *"Overtaking on the Curve?" Defense AI in China* (John Lee) | 2023 |
| `F1-DAIO-013` | **Rusia** | *High Hopes Amid Hard Realities. Defense AI in Russia* (Katarzyna Zysk) | 2023 |
| `F1-DAIO-017` | **Israel** | *Embracing the Organized Mess. Defense AI in Israel* (Dolinko / Antebi) | 2023 |
| `F1-DAIO-023` | **Ucrania** | *Survival of the Smartest? Defense AI in Ukraine* (Vitaliy Goncharuk) | 2024 |
| `F1-DAIO-035` | **Brasil** | *Fragmented Efforts. Defense AI in Brasil* (Moralez / Rivas) | 2026 |
| `F1-DAIO-014` | Alemania | *Master and Servant* | 2023 |
| `F1-DAIO-019` | Francia | *A Winding Road Before Scaling-Up?* | 2023 |
| `F1-DAIO-006` | Reino Unido | *Bright Prospects – Big Challenges* | 2022 |
| `F1-DAIO-007` | Italia | *Exploring the Benefits of a New Force Enabler* | 2022 |
| `F1-DAIO-004` | Australia | *Evolution not Revolution* | 2022 |
| `F1-DAIO-010` | Turquía | *Enabling Technology of Future Warfare* | 2023 |
| `F1-DAIO-011` | Canadá | *When the Teeth Eat the Tail* | 2023 |
| `F1-DAIO-016` | Suecia | *A Fertile Soil for AI?* | 2023 |
| `F1-DAIO-018` | Finlandia | *Cautious Data-Driven Evolution* | 2023 |
| `F1-DAIO-020` | Dinamarca | *Servers Before Tanks?* | 2023 |
| `F1-DAIO-021` | Grecia | *Harnessing the Potential* | 2023 |
| `F1-DAIO-022` | Corea del Sur | *Will the One Ring Hold?* | 2024 |
| `F1-DAIO-024` | Japón | *Overcoming the Long Shadow of the Past* | 2024 |
| `F1-DAIO-025` | Taiwán | *Intelligent National Defense Amid Strategic Ambiguity?* | 2024 |
| `F1-DAIO-026` | Irán | *Heavy Thunder, No Rain* | 2024 |
| `F1-DAIO-029` | Pakistán | *An Underdeveloped Strategic Necessity* | 2025 |
| `F1-DAIO-030` | Polonia | *Guarding the Alliance's Eastern Frontiers* | 2025 |
| `F1-DAIO-031` | Estados árabes del Golfo | *Bonds That Separate* | 2025 |
| `F1-DAIO-032` | Indonesia | *A Careful Walk on Thin Ice* | 2025 |
| `F1-DAIO-033` | Rumanía | *From Laggard to Potential Regional Innovator?* | 2026 |
| `F1-DAIO-034` | Bélgica | *Controlled Adaptation and Integration* | 2026 |

### Estudios temáticos

| doc_id | Título | Relevancia |
|---|---|---|
| `F1-DAIO-001` | *Beware the Hype* — Ucrania, Siria, Libia, Nagorno-Karabaj | Lecciones de conflictos recientes; marco de innovación militar |
| `F1-DAIO-027` | *His Hands Can't Hit What His Eyes Can't See* — tácticas IA en el *air littoral* | Enjambres de reconocimiento-ataque, "smart mass" |
| `F1-DAIO-028` | *Thinking Before Sinking* — tácticas IA rojo/azul en combate naval | Simulación adversarial |
| `F1-DAIO-005` | *Free Jazz on the Battlefield* — proyecto GhostPlay, defensa aérea | IA contra enjambres de UAV; SEAD |
| `F1-DAIO-008` / `F1-DAIO-012` | *Wie KI Innere Führung lernt* / *How AI Learns the Bundeswehr's "Innere Führung"* | Ingeniería basada en valores, IEEE 7000-2021 |
| `F1-DAIO-002` / `F1-DAIO-003` | Catálogos CSV/JSON del acervo DAIO | Metadatos: `study_id`, título, subtítulo, país, autores, año, URL |

**Nota operativa:** `F1-DAIO-002` es un catálogo tabulado con `study_id | title | subtitle | country | authors | year | url_page`. Es el mejor punto de entrada para enrutar preguntas por país.

---

## CSET Georgetown (Center for Security and Emerging Technology)

127 documentos con **nombres de archivo genéricos y no informativos**
(`CSET_center-for-security-and-emerging-technology-NN.pdf`), organizados por tipo de publicación en
subcarpetas: `Reports/`, `Translation/`, `Issue Brief`, `Data_Snapshot/`, `Data_Brief/`,
`Testimony/`, `Formal_Response/`, `Annual_Report/`. El título real solo aparece en el texto extraído.

### Documentos más importantes para F1 (título recuperado del texto)

| doc_id | Título / contenido | Fecha |
|---|---|---|
| `F1-CSET-115` | **China's Military AI Wish List: C5ISRT** — análisis de miles de RFP del EPL | feb 2026 |
| `F1-CSET-117` | Resumen ejecutivo del anterior | feb 2026 |
| `F1-CSET-031` | **Pulling Back the Curtain on China's Military-Civil Fusion** — 2.857 contratos IA del EPL | sep 2025 |
| `F1-CSET-033` | Resumen ejecutivo del anterior | sep 2025 |
| `F1-CSET-103` | **AI for Military Decision-Making** — marco de riesgos para AI-DSS | abr 2025 |
| `F1-CSET-104` | Resumen del anterior | abr 2025 |
| `F1-CSET-125` | **Beyond Targeting: The Untapped Role of AI in Military Decision-Making** | jul 2026 |
| `F1-CSET-069` / `F1-CSET-071` | **Honchoing AI in the Air Force** — talento y liderazgo, no superinteligencia | jun 2025 |
| `F1-CSET-085` / `F1-CSET-100` | **Anticipating AI's Impact on the Cyber Offense-Defense Balance** | may 2025 |
| `F1-CSET-095` | *Defending Against Intelligent Attackers at Large Scales* (preprint) | abr 2025 |
| `F1-CSET-009` | **The U.S. Aerial Drone Market** — industria UAV, Replicator, dependencia china | nov 2025 |
| `F1-CSET-119` | *Physical AI: A Primer on AI-Robotics Convergence* | feb 2026 |
| `F1-CSET-003` | *China's Embodied AI: A Path to AGI* | dic 2025 |
| `F1-CSET-114` | *How to Assess the Likelihood of Malicious Use of Advanced AI Systems* | mar 2025 |
| `F1-CSET-011` / `F1-CSET-013` | *The Mechanisms of AI Harm: Lessons Learned from AI Incidents* | oct 2025 |
| `F1-CSET-005` / `F1-CSET-007` | *AI Governance at the Frontier* | nov 2025 |
| `F1-CSET-027` / `F1-CSET-029` | *Harmonizing AI Guidance* — marco unificado de estándares voluntarios | sep 2025 |
| `F1-CSET-098` | *Operationalizing AI Guidance* (guía de referencia; contiene bibliografía extensa) | abr 2026 |
| `F1-CSET-017` | *U.S. AI Statecraft: From Gulf Deals to an International Framework* | oct 2025 |
| `F1-CSET-032` | **Winning the Race: America's AI Action Plan** (Casa Blanca) | jul 2025 |
| `F1-CSET-024` | Memorando del **Secretary of War** a altos cargos del Pentágono | 9 ene 2026 |
| `F1-CSET-065` / `F1-CSET-067` | *AI on the Edge of Space* — superioridad espacial (puente a F2) | jun 2025 |
| `F1-CSET-079` / `F1-CSET-081` | *Advanced Space: Challenges and Opportunities for U.S. National Security* | jun 2025 |
| `F1-CSET-041` | *Sustaining the U.S. Edge in Remote Sensing, Launch and Advanced Technologies* | jul 2025 |
| `F1-CSET-089` / `F1-CSET-091` | *Wuhan's AI Development* — ruta alternativa china hacia la AGI | may 2025 |
| `F1-CSET-045` / `F1-CSET-053` | *Big Tech in Taiwan: Beyond Semiconductors* | jul 2025 |
| `F1-CSET-019` | *SIA Factbook 2024* — industria de semiconductores de EE. UU. | 2024 |
| `F1-CSET-122` | *Identifying the AI Development Workforce* | jun 2026 |
| `F1-CSET-050` | *Beyond P(doom) for AI Risk* | may 2026 |
| `F1-CSET-111` | *Open Models, Soft Power, and the Spectrum of U.S.-China AI Competition* | mar 2026 |
| `F1-CSET-001` | *When AI Builds AI* — automatización de la I+D en IA | ene 2026 |

### Subcarpeta `Translation/` (≈40 docs)

Traducciones al inglés de documentos oficiales chinos, cada una con una nota introductoria de CSET
("*The following …*"). Cubren: controles de exportación de doble uso (`F1-CSET-002`), plan del 15.º
Plan Quinquenal aprobado en el 5.º Pleno del XX Comité Central del PCCh, octubre de 2025
(`F1-CSET-008`), estrategia "IA+" 2025-2035 (`F1-CSET-054`), Ley de Ciberseguridad reformada en
octubre de 2025 (`F1-CSET-120`), estándares de seguridad para IA generativa, controles a tierras
raras (`F1-CSET-042`), ley coreana de IA de enero de 2025 (`F1-CSET-062`), y planes sectoriales
(manufactura, energía, educación, agricultura). **Es la mejor vía documental para responder qué
quiere China oficialmente, en sus propias palabras.**

### Ruido detectado en CSET

Algunos archivos de la carpeta CSET **no son de CSET**: `F1-CSET-034` (System Card de Claude Opus 4,
Anthropic), `F1-CSET-061` (Responsible Scaling Policy de Anthropic), `F1-CSET-028` (blog de
Anthropic), `F1-CSET-049` (informe "Humanoid 100" de Morgan Stanley), `F1-CSET-074` (*Anti-Satellite
Weapons, Countermeasures, and Arms Control*, OTA del Congreso de EE. UU., 1985), `F1-CSET-048` y
`F1-CSET-123` (estándares y artículos de desechos orbitales de NASA), `F1-CSET-022` (informe técnico
NASA), `F1-CSET-107` (GAO-24-105980), `F1-CSET-106` (memorando OMB M-24-10), `F1-CSET-075` (World
Robotics 2024, IFR). Varios de estos son en realidad **material de F2** mal clasificado. Hay que
tenerlo en cuenta al enrutar preguntas.

---

## AI Index (Stanford HAI)

Serie anual completa de informes y datasets. Cobertura 2017–2026.

| doc_id | Contenido |
|---|---|
| `F1-AIINDEX-023` | **AI Index Report 2026** (9.ª edición, informe completo) — el más actualizado |
| `F1-AIINDEX-022` | AI Index Report 2025 (completo) |
| `F1-AIINDEX-015` … `021` | Informes anuales 2017, 2018, 2019, 2021, 2022, 2023, 2024 |
| `F1-AIINDEX-007` … `013` | Capítulos sueltos de la edición 2025: I+D, desempeño técnico, IA responsable, economía, ciencia, educación, **política y gobernanza** |
| `F1-AIINDEX-001` … `006` | Capítulos sueltos de la edición 2024 |
| `F1-AIINDEX-014` | AI Index 2025, versión en chino |
| `F1-AIINDEX-013` | Capítulo 7 de 2025 (educación) — ojo: el nombre de archivo dice *policy-governance* pero el contenido extraído es educación |
| `F1-AIINDEX-030`–`040`, `046`–`054`, `065` | *Policy briefs* de HAI: propaganda generada por IA, etiquetado de contenido, agentes que simulan comportamiento humano, ecosistema chino de pesos abiertos (`F1-AIINDEX-050`), reporte de eventos adversos, benchmarks |
| `F1-AIINDEX-032`–`036` | Informes anuales de HAI 2020-21 a 2024-25 |
| `F1-AIINDEX-017` | **Contiene el dataset de autonomía en sistemas militares** con su advertencia metodológica explícita: *"This is not a dataset listing Lethal Autonomous Weapon Systems (LAWS), but a dataset intended to map out the development of autonomy in military systems"* |

**Datasets (CSV/XLSX):** `F1-AIINDEX-024`–`029`, `041`–`045`, `055`–`064`. Son extracciones de
PubMed y ClinicalTrials.gov (IA, visión por computador, ML, NLP, robótica) más metadatos de
publicaciones MAG. Algunos son enormes (`F1-AIINDEX-056`: 48,8 M de caracteres) y otros están
**vacíos** (`F1-AIINDEX-041`: 0 caracteres). Son de dominio biomédico, no de defensa: útiles para
gráficos de tendencia en analítica visual, inútiles para preguntas de F1 militar.

---

## ILIA Latam — Índice Latinoamericano de Inteligencia Artificial

Producido por CENIA con CEPAL. Tres ediciones en el corpus.

| doc_id | Documento |
|---|---|
| `F1-ILIA-009` | **ILIA 2025, documento principal** (el de referencia; incluye los once hallazgos y todos los subindicadores) |
| `F1-ILIA-008` | Versión web del ILIA 2025 (contenido equivalente) |
| `F1-ILIA-005` | **ILIA 2025: fichas de país y aspectos metodológicos** — imprescindible para la ficha de Colombia |
| `F1-ILIA-006` / `F1-ILIA-007` | ILIA 2025, hallazgos principales: IA aplicada y talento humano (ES / EN) |
| `F1-ILIA-004` | ILIA 2025, resumen ejecutivo en inglés |
| `F1-ILIA-002` / `F1-ILIA-003` | ILIA 2024 (dos versiones). Contiene el repaso comparado de políticas nacionales de IA por país, incluida la de Colombia |
| `F1-ILIA-001` / `F1-ILIA-010` | ILIA 2023 (línea base) |

Duplicación relevante: 009 ≈ 008, 002 ≈ 003, 001 ≈ 010. Al indexar conviene deduplicar o el
recuperador devolverá el mismo pasaje varias veces.

---

## CENIA (Centro Nacional de Inteligencia Artificial, Chile)

| doc_id | Documento |
|---|---|
| `F1-CENIA-017` | **Memoria anual 2024** — el documento sustantivo (138 K caracteres) |
| `F1-CENIA-018` | Memoria anual 2023 |
| `F1-CENIA-019` | Memoria 2022 |
| `F1-CENIA-015` / `F1-CENIA-023` | Líneas de investigación (ES / EN) |
| `F1-CENIA-005` | Capacitación y formación |
| `F1-CENIA-007`, `024`, `025` | Convenios y resoluciones de subsidio (ANID, Innova) |
| `F1-CENIA-001`–`003`, `010`, `011` | Balances financieros firmados |

Nexo directo con Colombia: `F1-CENIA-017` documenta que CENIA lideró con la OEA y el **Centro de
Excelencia AudacIA (Colombia)** sesiones de formación en IA para sociedad civil en las Américas, y
que existen planes con el BID para replicar iniciativas en otros países "comenzando por Colombia".
`F1-CENIA-019` registra la alianza con el **Centro de Investigación y Capacitación en Inteligencia
Artificial de la Universidad de los Andes** para nutrir el AI-Index regional.

Varios archivos son prácticamente vacíos: `F1-CENIA-008` (13 caracteres), `F1-CENIA-012` (14),
`F1-CENIA-016` (33), `F1-CENIA-022` (22).

---

## Ruta N / GEIAL

Observatorio de ecosistemas de emprendimiento e innovación en ciudades de ALC.

| doc_id | Documento |
|---|---|
| `F1-RUTAN-003` | **Informe GEIAL Latam** — ranking de ecosistemas urbanos |
| `F1-RUTAN-004` | Informe GEIAL Medellín |
| `F1-RUTAN-006` | Documento CEPAL (`s2200488-es`) sobre políticas públicas de innovación en las cuatro mayores economías urbanas de la región |
| `F1-RUTAN-005` | Resultados de encuesta de innovación (empresas, Colombia) |
| `F1-RUTAN-007` | Socialización GEIAL Medellín (presentación) |
| `F1-RUTAN-001` / `F1-RUTAN-002` | Catálogos (810 y 237 caracteres) |

Aporte concreto: `F1-RUTAN-003` sitúa a **Manizales, Bogotá y Medellín** —junto con São Paulo y
Santiago— en el primer escalón del nivel medio-alto del ranking GEIAL. Es la mejor evidencia del
corpus sobre ecosistemas de innovación colombianos, aunque no es material de defensa.

---

## Defensa21 LatAm — fuente inutilizable

| doc_id | Archivo | Caracteres |
|---|---|---|
| `F1-DEFENSA21-001` | `DEFENSA21_articulos-2.json` | **0** |
| `F1-DEFENSA21-002` | `DEFENSA21_catalog-2.json` | **87** |

La única fuente del corpus de F1 dedicada específicamente a defensa latinoamericana **no tiene
contenido extraído**. Esto es un hueco estructural: la perspectiva regional de defensa hay que
reconstruirla desde `F1-DAIO-035` (Brasil, que generaliza a América Latina) y desde fuera del corpus.

---

## Atlantic Council — GeoTech Center

186 archivos JSON raspados del blog *GeoTech Cues*, distribuidos en 22 páginas de paginación
(`page_01` … `page_22`). La mayoría son *event recaps* y ensayos de opinión de 2020-2021 sobre
COVID-19, cadenas de suministro, monedas digitales de banco central, sistemas alimentarios y
soberanía digital. **Densidad baja para F1 militar.**

### Los pocos relevantes

| doc_id | Título |
|---|---|
| `F1-ATLCOUNCIL-137` | *Information warfare: An all-domain military and civil deception, from today to 2030* (feb 2021) |
| `F1-ATLCOUNCIL-143` | *The West, China, and AI surveillance* (dic 2020) |
| `F1-ATLCOUNCIL-009` | *The human dimensions of autonomous systems employing AI* (jun 2021) |
| `F1-ATLCOUNCIL-045` | *Building smarter military bases for climate-resilient communities* |
| `F1-ATLCOUNCIL-046` | *DeepSeek shows the US and EU the costs of failing to govern AI* (abr 2025) |
| `F1-ATLCOUNCIL-087` | *Did DeepSeek just trigger a paradigm shift?* |
| `F1-ATLCOUNCIL-025` | *EU AI Act sets the stage for global AI governance* |
| `F1-ATLCOUNCIL-044` | *AI governance on a global stage: key themes from the biggest week in AI policy* |
| `F1-ATLCOUNCIL-184` | *Navigating the new reality of international AI policy* |
| `F1-ATLCOUNCIL-107` | Acuerdos tecnológicos globales y poblaciones envejecidas — **cita la resolución de la ONU de marzo de 2024 y el Pacto para el Futuro de sep 2024** |
| `F1-ATLCOUNCIL-118` | *How India's AI talent playbook can provide a blueprint for aspiring AI powers* |
| `F1-ATLCOUNCIL-174` | *How the Chip Security Act could usher in an era of trusted trade* |
| `F1-ATLCOUNCIL-062` | *The next phase of US-China economic and tech decoupling* |
| `F1-ATLCOUNCIL-150` | *Computing to win: the AI compute divide* |
| `F1-ATLCOUNCIL-111` | *Data strategies for an AI-powered government* |
| `F1-ATLCOUNCIL-081` / `F1-ATLCOUNCIL-104` | Camino hacia la AI Impact Summit: infraestructura y escalamiento de la adopción |

### Advertencia crítica de ingeniería

**Los 186 documentos de Atlantic Council comparten un bloque de navegación idéntico de ~1.500
caracteres** (menú de países: *"South Africa Sudan Somalia Americas All Americas … Latin America
Brazil Caribbean Colombia Mexico Central America Venezuela …"* y taxonomía de temas). Una búsqueda
léxica por "Colombia" devuelve los 186 archivos con cero señal. El contenido real de cada artículo
suele ser solo el titular más un *dek* de dos líneas. **Para el asistente conversacional hay que
recortar ese encabezado antes de indexar**, o Atlantic Council dominará artificialmente cualquier
recuperación por país.

---

## Recomendación de enrutamiento para el asistente

1. **Pregunta sobre defensa de un país concreto** → `F1-DAIO-*` (usar `F1-DAIO-002` como índice).
2. **China militar, cifras de adquisiciones, C5ISRT** → `F1-CSET-115`, `F1-CSET-117`, `F1-CSET-031`, `F1-CSET-033`.
3. **IA en toma de decisiones, *targeting*, riesgos de AI-DSS** → `F1-CSET-103`, `F1-CSET-104`, `F1-CSET-125`.
4. **Lecciones de conflictos** → `F1-DAIO-001`, `F1-DAIO-023`.
5. **Enjambres y tácticas emergentes** → `F1-DAIO-027`, `F1-DAIO-005`, `F1-DAIO-028`.
6. **Ciberdefensa** → `F1-CSET-085`, `F1-CSET-100`, `F1-CSET-095`.
7. **Cifras macro de IA (inversión, talento, cómputo)** → `F1-AIINDEX-023` (2026), `F1-AIINDEX-022` (2025).
8. **América Latina y Colombia** → `F1-ILIA-009`, `F1-ILIA-005`, `F1-DAIO-035`.
9. **Política oficial china en su propia voz** → subcarpeta `Translation/` de CSET.
