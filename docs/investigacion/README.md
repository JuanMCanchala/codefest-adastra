# Investigación — CODEFEST AD ASTRA 2026, Final (Etapa 2)

Toda la investigación está compilada en un solo PDF:
[`../Investigacion_CODEFEST_AD_ASTRA_2026.pdf`](../Investigacion_CODEFEST_AD_ASTRA_2026.pdf).
Para regenerarlo, correr `python scripts/build_pdf.py` desde la raíz del repositorio.

**Por dónde empezar:** leer [la síntesis](00_sintesis/sintesis.md) y luego el
[contraste con la especificación oficial](00_sintesis/contraste_especificacion.md). El contraste
explica qué decisiones cambió la especificación de la Etapa 2 (modelos de Bedrock, repositorio
privado, tres agentes, trazabilidad del tablero y despliegue en Coolify).

## Estructura

| Carpeta                                      | Contenido                                                                                                                           |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`00_sintesis/`](00_sintesis/)               | Síntesis ejecutiva, contraste con la especificación y análisis de la base SQL de ADL                                                |
| [`01_fenomenos/`](01_fenomenos/)             | Investigación de los tres fenómenos sobre el corpus, verificación web, análisis transversal del jurado y subfenómenos diferenciales |
| [`02_estado_del_arte/`](02_estado_del_arte/) | Revisión de literatura científica y conversación en redes sociales                                                                  |
| [`03_arquitectura/`](03_arquitectura/)       | Arquitectura empresarial, worldmonitor, fuentes de datos, modelo local, repositorios y licencias                                    |
| [`99_primera_pasada/`](99_primera_pasada/)   | Primer borrador rápido, superado por el resto; se conserva como histórico                                                           |
| [`nicolas/`](nicolas/README.md)              | Investigación previa de Nicolás (arquitectura multiagente, catálogo de visualizaciones, notas de despliegue en Coolify); subida como respaldo e insumo adicional |

### 00 · Síntesis

- [`sintesis.md`](00_sintesis/sintesis.md): hallazgos por fenómeno, cifras con discrepancia, top 10 de subfenómenos y decisiones de diseño.
- [`contraste_especificacion.md`](00_sintesis/contraste_especificacion.md): reglas de la Etapa 2 y lo que cambian en el diseño.
- [`base_sql_adl.md`](00_sintesis/base_sql_adl.md): base SQLite de F2 (`space_corpus.sql`), con su esquema y el mapeo a `doc_id`.

### 01 · Fenómenos

- [`f1_ia_capacidades/`](01_fenomenos/f1_ia_capacidades/README.md): F1, IA y Capacidades Estratégicas (corpus).
- [`f2_seguridad_espacial/`](01_fenomenos/f2_seguridad_espacial/README.md): F2, Seguridad del Entorno Espacial (corpus).
- [`f3_amenazas_regionales/`](01_fenomenos/f3_amenazas_regionales/README.md): F3, Dinámicas Territoriales y Amenazas Regionales (corpus).
- [`web_verificada/`](01_fenomenos/web_verificada/): cifras de 2024 a 2026 verificadas en la web, una por fenómeno. **Se usan solo para el pitch, no como contenido del sistema.**
- [`transversal/`](01_fenomenos/transversal/README.md): las 50 preguntas del jurado clasificadas, el inventario del corpus, los datos graficables y las conexiones entre fenómenos.
- [`subfenomenos_wow.md`](01_fenomenos/subfenomenos_wow.md): 29 subfenómenos diferenciales, con su top 10 y el guion de las demos.

Cada fenómeno sigue la misma estructura de archivos: `README`, `fuentes_corpus`, `cifras_clave`,
`global`, `regional`, `colombia` y `preguntas`.

### 02 · Estado del arte

- [`papers_rag_multiagente.md`](02_estado_del_arte/papers_rag_multiagente.md): 71 artículos sobre RAG agéntico, grafos, citas, multiagente y evaluación.
- [`papers_visual_dominio.md`](02_estado_del_arte/papers_visual_dominio.md): unos 55 artículos sobre generación de visualizaciones desde lenguaje natural, agentes geoespaciales, alerta temprana, espacio y defensa.
- [`social_listening.md`](02_estado_del_arte/social_listening.md): conversación en Reddit, X, Hacker News y YouTube, y soluciones en construcción.

### 03 · Arquitectura

- [`arquitectura_empresarial.md`](03_arquitectura/arquitectura_empresarial.md): referentes (Palantir, Donovan, Perplexity), stack web y plan por horas.
- [`worldmonitor_datos_agentes.md`](03_arquitectura/worldmonitor_datos_agentes.md): worldmonitor como base, APIs probadas y diseño con LangGraph y CrewAI.
- [`reincorporados_copyleft.md`](03_arquitectura/reincorporados_copyleft.md): proyectos AGPL o GPL reutilizables y lista de cumplimiento.
- [`proyectos_referencia.md`](03_arquitectura/proyectos_referencia.md) y [`repos_utiles.md`](03_arquitectura/repos_utiles.md): proyectos y librerías evaluados.
- [`modelo_local.md`](03_arquitectura/modelo_local.md): modelo local. **Queda descartado para la entrega**, porque la especificación exige usar los modelos de Bedrock.

## Convenciones

- `F1-…`, `F2-…` y `F3-…` son `doc_id` del corpus oficial de ADL.
- Lo marcado **por verificar** no se pudo confirmar en una fuente abierta.
- Los datos web llevan su URL y su año.
