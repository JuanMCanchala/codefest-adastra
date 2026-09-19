# Datos cuantitativos y graficables

Inventario derivado de `docs.jsonl` y rutas del corpus. La condición de graficable significa que existe un archivo estructurado o geoespacial; no presupone que todas sus variables estén limpias o que permitan una serie temporal sin revisar esquema, cobertura y licencia.

## Prioridad alta: datos estructurados explícitos

| Fenómeno | `doc_id` | Formato | Qué permite, sujeto a inspección de columnas |
|---|---|---|---|
| F1 | `F1-AIINDEX-024`–`F1-AIINDEX-029` | CSV | Conjuntos de ensayos clínicos por tema de IA: comparaciones por disciplina/periodo si hay fecha. |
| F1 | `F1-AIINDEX-041`–`F1-AIINDEX-064` | CSV | Literatura PubMed y líneas de tiempo de IA, visión, ML, NLP y robótica; series por año/campo. |
| F1 | `F1-AIINDEX-042`–`F1-AIINDEX-045` | XLSX | Literatura COVID, ciclo de autores, conferencias y publicaciones por campo. |
| F1 | `F1-DAIO-002`, `F1-RUTAN-001` | CSV | Catálogos, no indicadores sustantivos garantizados; útiles como metadatos. |
| F2 | `F2-SWF-130` | CSV | Datos del reporte Counterspace 2026: matriz/categorías por actor para barras, mapa o cronología tras confirmar campos. |
| F2 | `F2-SWF-131` | JSON | Misma familia de datos SWF; permite normalización para visualización. |
| F2 | `F2-CSIS-066` | JSON | Cronología de contraespacio: eventos por fecha, actor y capacidad si el esquema lo contiene. |
| F3 | `F3-AMAZONUW-074` | CSV | Datos de Amazon Underworld; usar para mapas/agrupaciones transfronterizas después de revisar geometría y atributos. |
| F3 | `F3-AMAZONUW-001`–`F3-AMAZONUW-073` | PBF | Teselas vectoriales: mapa interactivo de la Amazonía; no usar como tabla plana sin decodificar. |
| F3 | `F3-MAPPOEA-025`, `F3-RESDAL-098`, `F3-CEOBS-033`, `F3-SIPRI-112` | CSV | Catálogos de publicaciones, principalmente para navegación y cobertura, no indicadores de fenómeno. |

## Series y tablas extraíbles de PDF

| Familia documental | `doc_id` representativos | Dimensiones previsibles | Visualización recomendada |
|---|---|---|---|
| AI Index anual | `F1-AIINDEX-015`–`F1-AIINDEX-023` | Año, país, investigación, inversión, talento, desempeño y política (confirmar tabla por tabla). | Series temporales y comparaciones internacionales. |
| ILIA 2025 | `F1-ILIA-005`, `F1-ILIA-006`, `F1-ILIA-009` | Países de América Latina, talento e IA aplicada. | Barras/ranking regional; identificar explícitamente el año de cada indicador. |
| SWF Counterspace | `F2-SWF-121`–`F2-SWF-124` | Actor estatal, tipo de capacidad, evolución anual (confirmar taxonomía). | Matriz actor-capacidad y evolución 2022–2026. |
| ESA Space Environment | `F2-ESA-028`–`F2-ESA-038` | Objetos, fragmentación, maniobras y mitigación; reportes 2017–2026. | Series de tiempo y composición del entorno orbital. |
| CSIS Space Threat Assessment | `F2-CSIS-035`, `F2-CSIS-049`, `F2-CSIS-090`, `F2-CSIS-122` | Eventos/capacidades por actor y año; validar antes de cuantificar. | Cronología anotada o matriz de capacidades. |
| Alertas Tempranas | `F3-ALERTAS-001`–`F3-ALERTAS-425` | Fecha, territorio, población y riesgo, solo tras extraer metadatos individuales. | Mapa por departamento/municipio y serie de alertas. |
| MAPP/OEA | `F3-MAPPOEA-013`, `F3-MAPPOEA-019` | Periodo, departamento, actor y dinámica; requiere codificación desde texto/tablas. | Línea temporal y mapa de casos sustentados. |
| RESDAL Atlas 2024 | `F3-RESDAL-001`–`F3-RESDAL-030`, especialmente `F3-RESDAL-013` | País, presupuesto, institución y fuerza según capítulo. | Comparación regional; conservar nota metodológica del Atlas. |

## Reglas de uso

- Cite el `doc_id`, el año de observación (no solo el año de publicación) y el campo/tabla exactos.
- No mezcle unidades, definiciones de objeto espacial o categorías de actor sin armonización documentada.
- Para F3, no infiera presencia o ausencia de un grupo a partir de una alerta aislada; la cobertura temporal y territorial debe mostrarse.
- Los catálogos CSV/JSON no son evidencia temática por sí solos.
- Las imágenes (`F2-SWF-066`, `F2-SWF-076`, `F2-SWF-077`, `F2-SWF-089` y otras) sirven de referencia visual, pero la cifra debe rastrearse al informe/dato fuente.
