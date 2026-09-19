# Capa de datos del tablero (Reto 2)

`preparar.py` construye `dashboard.db` (SQLite) y las geometrías de `geo/` a partir del corpus
real de la Etapa 1 y de los archivos originales de ADL. **Todas las variables son conteos,
frecuencias o agregaciones de campos existentes en las fuentes; no se estima ni se puntúa nada.**
Cada fila de las tablas analíticas lleva `doc_id` y `chunk_id`, de modo que cualquier cifra del
tablero se puede abrir en el fragmento exacto que la sustenta (Anexo B.1 de la especificación).

## Uso

```bash
pip install -r dashboard/datos/requirements.txt
python dashboard/datos/preparar.py            # ~35 s, imprime conteos y tamaños
python -m pytest dashboard/datos/tests -q     # pruebas de trazabilidad
ruff check dashboard/datos
```

El script es idempotente: recrea todas las tablas en cada corrida, cachea las descargas
geográficas en `.cache/` y vuelve a escribir `geo/*.geojson`. Las rutas de entrada son
argumentos (`--metadata`, `--grafo`, `--docs`, `--corpus`, `--inventario`, `--sql-adl`,
`--salida`, `--geo`, `--cache`); por defecto apuntan a `C:/Programacion/ANDES`, que se lee sin
modificar nada.

## Fuentes

| Fuente                                                   | Qué aporta                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| `entrega/base_vectorial/encoder_bge-m3/metadata.jsonl`    | 90.613 fragmentos: `chunk_id` global, `doc_id`, posición, tokens |
| `entrega/base_vectorial/grafo/grafo.graphml`              | 26.961 entidades GLiNER y 97.182 aristas con `doc_id`/`chunk_id` |
| `data/processed/docs.jsonl`                               | 1.825 documentos: `doc_id`, fuente, fenómeno, formato        |
| `data/adl/Indice_Datos_Codefest.xlsx`                     | nombre estandarizado de archivo (hoja «Inventario de Archivos») |
| `data/adl/corpus/**`                                      | JSON de artículos (fecha, título), fichas de alertas, CSV de Amazon Underworld |
| `data/space_corpus.db`                                    | base SQL de ADL (19 documentos de F2, entidades curadas)     |
| Natural Earth 110m / MGN 2018 del DANE                    | geometrías de países, departamentos y municipios             |

## Tablas

| Tabla            | Filas   | Origen y trazabilidad                                                                                                                                                        |
| ---------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `documentos`     | 1.825   | `docs.jsonl` + campos de los archivos originales. `fecha_origen` declara de dónde salió la fecha (`metadata_json`, `alerta`, `sql_adl`, `nombre_archivo`, `NULL`); `idioma` se detecta con `langdetect` sobre los primeros 1.500 caracteres del documento. Clave: `doc_id`. |
| `fragmentos`     | 90.613  | Una fila por línea de `metadata.jsonl`, sin texto (el asistente lee el texto del propio `metadata.jsonl`). Es la tabla puente de toda la trazabilidad: `chunk_id` PK, `doc_id` FK. |
| `entidades`      | 26.961  | Nodos del grafo con su `tipo`; `n_documentos` y `n_fragmentos` son conteos derivados de `menciones`.                                                                          |
| `menciones`      | 190.445 | Unión del atributo `chunks` de cada nodo y de los extremos de cada arista. El `doc_id` no se copia del grafo: se resuelve desde `fragmentos` por `chunk_id`, así que siempre coincide. |
| `relaciones`     | 97.182  | Aristas del grafo (`relacion`, `peso`) con el `doc_id`/`chunk_id` que trae el propio grafo, filtradas a los pares que existen en `fragmentos`.                                |
| `paises`         | 296     | Entidades de tipo `pais` normalizadas a ISO3 con los nombres ES/EN/PT de Natural Earth más variantes formales («República Bolivariana de Venezuela» → `VEN`).                 |
| `menciones_pais` | 16.896  | Menciones de esas entidades, con `fenomeno` del documento. Permite mapas coropléticos por fenómeno con evidencia por fragmento.                                              |
| `alertas`        | 1.082   | Una fila por alerta × municipio de las 363 fichas de la Defensoría (`alerta_meta`). `grupos_armados`, `economias_ilicitas` y `poblaciones` se reparten desde `body_paragraphs` con reglas cerradas (ver abajo). `chunk_id` = primer fragmento del documento que nombra al municipio. |
| `amazonia`       | 1.409   | CSV georreferenciado de Amazon Underworld, deduplicado por unidad territorial (`b_ADM2_PCODE`, o `fid` si no tiene código). `chunk_id` = fragmento donde aparece esa fila serializada (`tile_zoom … fid`). |
| `sql_documentos` | 19      | `document` de `space_corpus.db` con el `doc_id` emparejado en `docs/investigacion/00_sintesis/base_sql_adl.md`.                                                               |
| `sql_entidades`  | 157     | `document_entity` × `entity` con `mention_count` tal cual lo publica ADL; el `chunk_id` es el primer fragmento del documento donde aparece el nombre de la entidad.           |
| `metadatos`      | 18      | Rutas de las fuentes, fecha de generación y las métricas de cobertura que se citan abajo.                                                                                     |

Índices: `fragmentos(doc_id)`, `menciones(doc_id)`, `relaciones(doc_id)`, `menciones_pais(doc_id)`,
`alertas(divipola_mpio)`, `alertas(anio)`, `amazonia(divipola_mpio)`, `documentos(fenomeno, anio)`.
La base pesa **34,5 MB** tras `VACUUM` (límite fijado: 60 MB).

### Reparto de los párrafos de las fichas de alertas

Las fichas no traen campos separados para grupos armados, economías ilícitas ni poblaciones: la
información viene en `body_paragraphs`, sin orden fijo. El reparto es determinista y sin
inferencias:

- se descarta el párrafo igual a `tema_clave`, los que empiezan por un encabezado territorial
  («Veredas:», «Resguardos indígenas:», «Consejos Comunitarios:»…) y los que sólo contienen
  códigos de otras alertas;
- un párrafo separado por `;` cuyos elementos pertenecen todos al vocabulario cerrado de
  economías ilícitas (narcotráfico, contrabando, minería ilegal, préstamos gota a gota, tala
  ilegal) va a `economias_ilicitas`; cualquier otro párrafo separado por `;` va a `poblaciones`;
- el párrafo restante, sin `;`, va a `grupos_armados` como texto literal de la fuente.

Cobertura: 924 filas con grupos armados, 236 con economías ilícitas, 951 con poblaciones.

### Geometrías (`geo/`)

| Archivo                  | Tamaño  | Fuente                                                              |
| ------------------------ | ------- | ------------------------------------------------------------------- |
| `paises.geojson`         | 0,18 MB | Natural Earth 110m `admin_0_countries`, propiedades `iso3`/`nombre_es`/`nombre_en` |
| `departamentos.geojson`  | 0,05 MB | MGN 2018 del DANE, `divipola_dpto` (33 departamentos)               |
| `municipios.geojson`     | 0,44 MB | MGN 2018 del DANE, `divipola_mpio` (1.122 municipios)               |

Se simplifican quitando toda propiedad que el tablero no use y redondeando coordenadas
(2 decimales en el mundo, 3 en Colombia), sin dependencias geoespaciales. Los códigos DIVIPOLA
de `alertas` y `amazonia` son subconjunto de los de `municipios.geojson` (lo verifica una prueba).

## Limitaciones

- **Fechas:** 1.277 de 1.825 documentos (**70,0 %**) no tienen fecha completa y 980 (53,7 %) no
  tienen ni año, porque `metadata.jsonl` no guarda fecha y la mayoría de los PDF no la exponen en
  el nombre. Por fenómeno, documentos con fecha: F1 0 de 459 (46 con año), F2 158 de 478 (270 con
  año), F3 390 de 888 (529 con año). Las series de tiempo sólo deben usarse con el filtro
  `fecha IS NOT NULL` y declarando la cobertura.
- **Idioma:** 52 documentos quedan sin idioma (fragmentos muy cortos o tablas numéricas).
  Distribución: 1.037 en inglés, 606 en español, 130 en portugués.
- **Municipios:** 1 de 1.082 filas de `alertas` (0,1 %) no empareja con DIVIPOLA
  («Santa Cruz de Mompox», que el DANE escribe «Mompós»). En `amazonia`, las 121 unidades
  colombianas emparejan; los demás países usan códigos de OCHA (`b_ADM*_PCODE`), no DIVIPOLA.
- **Países:** 232 de 528 nodos de tipo `pais` no reciben ISO3. Son, en su mayoría, ruido de
  extracción (ciudades, «country», «países en desarrollo»), entidades históricas (URSS), nombres
  en otros idiomas (francés, coreano) y microestados que Natural Earth 110m no incluye
  (Singapur, Barbados, Malta…). Los 296 nombres restantes cubren 156 países distintos.
- **Menciones por entidad:** el atributo `chunks` del grafo está truncado a 21 fragmentos por
  nodo, así que `entidades.n_fragmentos` es un piso, no el total del corpus.
- **`sql_entidades`:** 31 de 157 pares no encuentran el nombre literal de la entidad en los
  fragmentos de su documento (el PDF usa siglas o variantes); en esos casos el `chunk_id` es el
  primer fragmento del documento, que sigue siendo evidencia válida a nivel documental.
- **`amazonia`:** el CSV repite cada unidad territorial en varios niveles de zoom; se conserva la
  fila más completa por unidad, de modo que la tabla no sirve para analizar los mosaicos.
- La base SQL de ADL cubre 19 de los 478 documentos de F2, y UNOOSA/ESA no traen fecha.

## Pruebas

`tests/test_datos.py` verifica que cada fila de `menciones`, `relaciones`, `alertas`,
`menciones_pais`, `amazonia` y `sql_entidades` tenga un `chunk_id` existente en `fragmentos`, un
`doc_id` existente en `documentos` y que ambos coincidan entre sí; que no haya fechas posteriores
al 2026-09-18; que al menos el 90 % de las filas de `alertas` tenga DIVIPOLA válido de cinco
dígitos presente en el GeoJSON municipal; y que la base pese menos de 60 MB.
