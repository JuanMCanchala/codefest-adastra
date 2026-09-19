# Base SQL de ADL para el Reto 2 (`space_corpus.sql`)

Es el insumo que la especificación de la Etapa 2 menciona en §1.3 ("base de datos SQL (reto 2)").
Lo analizamos el 18-sep-2026.

## Qué es

- **Formato:** un volcado de **SQLite**. Empieza con `PRAGMA foreign_keys=OFF; BEGIN TRANSACTION;`,
  pesa 1,7 MB y tiene 384 inserciones.
- **Carga local:** `sqlite3 data/space_corpus.db < space_corpus.sql`. En Windows, con Python:
  `sqlite3.connect(db).executescript(open(sql).read())`. Ya está cargado en
  `C:/Programacion/ANDES/data/space_corpus.db`.
- **Cobertura:** solo **F2 (Seguridad del Entorno Espacial)**, con 19 documentos de CSIS (10),
  UNOOSA (5) y ESA (4). **No hay datos de F1 ni de F3.** Para esos fenómenos, el tablero se alimenta
  de la metadata de la Etapa 1, el grafo GLiNER y los campos propios de cada fuente, como las fichas
  de alertas tempranas o el CSV de Amazon Underworld.

## Esquema

| Tabla                        | Filas   | Columnas                                                                                                                                                                          | Para qué sirve                                                                                                                                   |
| ---------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `document`                   | 19      | `id`, `source` (CSIS/UNOOSA/ESA), `origin` (URL o archivo), `title`, `published_at` (solo CSIS, de mar-2025 a abr-2026), `excerpt`, `body_text`, `page_count` (solo UNOOSA y ESA) | Documentos con fecha: alimentan la línea de tiempo de CSIS                                                                                       |
| `entity`                     | 59      | `id`, `name`, `type`                                                                                                                                                              | Entidades con **tipo curado**: organization 19, program 11, country 11, international_body 5, technical_standard 5, treaty 4, place 3, company 1 |
| `document_entity`            | 157     | `document_id`, `entity_id`, `mention_count`                                                                                                                                       | **Pesos listos** para la matriz de calor de entidad × documento y para la red de co-ocurrencia                                                   |
| `topic` / `document_topic`   | 18 / 69 | temas de CSIS y ESA                                                                                                                                                               | Composición por tema                                                                                                                             |
| `author` / `document_author` | 12 / 25 | `name`, `kind`                                                                                                                                                                    | Red de autores (Clayton Swope firma 6 documentos)                                                                                                |
| `resource`                   | 20      | `document_id`, `kind` (pdf 18, image 2), `url`                                                                                                                                    | Enlaces a los PDF originales del panel de evidencia                                                                                              |

**Entidades con más menciones:** Earth 620, European Space Agency 287, Moon 184, GNSS 138,
United States 105, Registration Convention 97, NASA 93, UN General Assembly 93,
UN Secretary-General 91, Mars 85, ISO 85, FAO 78, DRAMA 74, COPUOS 45 y ESSB-ST-U-007 43.

## Trazabilidad hasta `doc_id` (requisito de §3.3)

Los **19 documentos se emparejan uno a uno** con los `doc_id` del corpus de la Etapa 1. Para
CSIS se usó el _slug_ de la URL y para UNOOSA y ESA el nombre del archivo:

| SQL `id` | `doc_id`    | SQL `id` | `doc_id`                                                                             |
| -------- | ----------- | -------- | ------------------------------------------------------------------------------------ |
| 1        | F2-CSIS-115 | 11       | F2-UNOOSA-019                                                                        |
| 2        | F2-CSIS-116 | 12       | F2-UNOOSA-023                                                                        |
| 3        | F2-CSIS-117 | 13       | F2-UNOOSA-024                                                                        |
| 4        | F2-CSIS-118 | 14       | F2-UNOOSA-027                                                                        |
| 5        | F2-CSIS-119 | 15       | F2-ESA-011                                                                           |
| 6        | F2-CSIS-120 | 16       | F2-ESA-014                                                                           |
| 7        | F2-CSIS-121 | 17       | F2-ESA-027                                                                           |
| 8        | F2-CSIS-122 | 18       | F2-ESA-039 (en la base aparece con `source` UNOOSA y archivo `ESA_st-space-49e.pdf`) |
| 9        | F2-CSIS-123 | 19       | F2-ESA-040                                                                           |
| 10       | F2-CSIS-124 |          |                                                                                      |

**`chunk_id`:** la base no los trae. Para cumplir la trazabilidad a nivel de fragmento, en la
preparación de datos se buscan las menciones de cada `entity.name` dentro de los fragmentos de su
`doc_id` en el almacén de metadata de la Etapa 1. Así se guarda, por cada par documento–entidad, la
lista de `chunk_id` donde aparece. El `mention_count` de la base se muestra tal cual y se atribuye a
ADL como fuente.

## Uso propuesto en el tablero (F2)

- **Matriz de calor de entidad × documento** con `mention_count`. Es el ejemplo exacto de B.2.3.
- **Red de co-ocurrencia** de entidades, donde el peso de cada arista es el número de documentos
  compartidos (B.3.1), con color por `type` y filtros por tipo de entidad.
- **Línea de tiempo de CSIS** (mar-2025 a abr-2026) que marca la reaparición de entidades (B.5.2),
  por ejemplo "Golden Dome/Iron Dome" o "U.S. Space Force".
- **Composición** por fuente y por tema, con barras apiladas.
- **Panel de evidencia:** `excerpt`, enlace al PDF desde `resource`, y `doc_id` y `chunk_id`.

## Limitaciones

- Cubre 19 de los 478 documentos de F2. Sirve para mostrar un análisis estructurado y bien curado,
  no para representar todo el fenómeno.
- UNOOSA y ESA no tienen fecha de publicación.
- El documento 18 tiene una inconsistencia de fuente (`source` = UNOOSA con un archivo `ESA_…`).
  Se muestra la fuente según nuestro `doc_id` y se anota la discrepancia.
