# Contrato de la API del tablero (Reto 2)

Un solo contenedor (`dashboard/`) sirve la API bajo `/api/*` y la SPA compilada bajo `/`, en un
único puerto, como exige el Anexo A.4. Los datos salen de `dashboard/datos/dashboard.db` (ver
`datos/README.md`). El texto de los fragmentos se lee de `metadata.jsonl`, la base vectorial de la
Etapa 1.

**Reglas:**

- Toda respuesta con datos incluye `evidencia`, una lista de `{doc_id, chunk_id}` que sustentan los
  valores mostrados.
- Solo se devuelven conteos, frecuencias y agregaciones. **Nunca puntajes ni índices inventados**
  (Anexo B.2.5).
- `nota_metodo` explica en una frase cómo se calculó el valor, por ejemplo: "número de alertas
  tempranas por municipio emitidas entre 2017 y 2026".
- **Los filtros de texto se resuelven contra el vocabulario real de la base**, sin distinguir
  mayúsculas ni tildes, y admiten coincidencia parcial. `entidad` y `tipo_entidad` se llevan al
  nombre guardado en el grafo (`"FARC"` → `farc`, `"Chocó"` → `chocó`); `economia` y `tipo_alerta`
  se llevan al que escribe la Defensoría (`"mineria"` → `Minería ilegal`, `"inminencia"` →
  `Inminencia`, `"gota a gota"` → `Préstamos gota a gota`). El valor efectivo se devuelve en
  `filtros_aplicados`.
- **Un componente nunca se devuelve vacío por un filtro que no existe.** Si el valor pedido no se
  parece a ninguno de la base (`economia: "pesca ilegal"`), el filtro se descarta, se informa en
  `filtros_ignorados` y se responde con los datos sin ese filtro. Devolver un gráfico en blanco es
  indistinguible de un fallo para quien lo mira.

## Endpoints

| Método | Ruta                                             | Descripción                                                                  |
| ------ | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| GET    | `/api/salud`                                     | `{estado: "ok", tablas: {...conteos}}`                                       |
| GET    | `/api/catalogo`                                  | Componentes disponibles y los filtros que admite cada uno                    |
| POST   | `/api/componente`                                | Calcula un componente: cuerpo `{componente, fenomeno?, filtros?}`            |
| POST   | `/api/visualizar`                                | Instrucción en lenguaje natural → agente del Reto 1 → especificación → datos |
| GET    | `/api/evidencia/{chunk_id}`                      | `{chunk_id, doc_id, fuente, titulo, organizacion, fenomeno, fecha, texto}`   |
| GET    | `/api/evidencia?chunk_ids=1,2,3`                 | Lote de hasta 50 fragmentos                                                  |
| GET    | `/geo/{departamentos,municipios,paises}.geojson` | Geometrías estáticas                                                         |

### Respuesta de `POST /api/componente`

```json
{
  "componente": "mapa_colombia",
  "titulo": "Alertas tempranas por departamento",
  "fenomeno": 3,
  "filtros_aplicados": { "nivel": "departamento", "economia": "mineria" },
  "datos": { "...": "forma según el componente (tabla de abajo)" },
  "evidencia": [{ "doc_id": "F3-ALERTAS-012", "chunk_id": "81234" }],
  "nota_metodo": "Número de alertas (una por municipio alcanzado) con mención de minería.",
  "total_evidencia": 214
}
```

Si hay muchas filas de evidencia, se devuelven como máximo 200 y `total_evidencia` indica el total.
Cada elemento de `datos` que se pueda cliquear lleva también su propia lista `refs`, con hasta 20
`{doc_id, chunk_id}`, para el _drill-down_.

### Componentes (el mismo catálogo cerrado de `agent/app/catalogo.py`)

| `componente`             | Filtros                                                                                                              | `datos`                                                                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `composicion_corpus`     | `dimension`: `organizacion` \| `formato` \| `idioma`; `fenomeno`                                                     | `[{fenomeno, categoria, documentos, fragmentos}]`                                                                                                                              |
| `linea_tiempo`           | `fenomeno`, `entidad`, `desde`, `hasta` (años)                                                                       | `{series: [{fenomeno, anio, documentos}], reapariciones: [{entidad, anio, doc_id, chunk_id}]}`                                                                                 |
| `matriz_calor`           | `filas`: `entidad` \| `pais`; `columnas`: `organizacion` \| `fenomeno` \| `documento`; `tipo_entidad`; `top` (10–30) | `{filas: [], columnas: [], celdas: [{fila, columna, valor, refs}]}`                                                                                                            |
| `red_entidades`          | `entidad` (centro opcional), `tipo_entidad`, `fenomeno`, `top` (≤ 60 nodos), `min_peso`                              | `{nodos: [{id, tipo, menciones}], aristas: [{origen, destino, relacion, peso, refs}]}`                                                                                         |
| `mapa_colombia`          | `nivel`: `departamento` \| `municipio`; `economia`; `tipo_alerta`; `desde`, `hasta`                                  | `[{divipola, nombre, departamento, alertas, refs}]`                                                                                                                            |
| `mapa_mundo`             | `fenomeno`, `top`                                                                                                    | `[{iso3, nombre, menciones, documentos, refs}]`                                                                                                                                |
| `cuadrante_priorizacion` | `sujeto`: `departamento` \| `entidad`; `fenomeno`; `anio_corte`                                                      | `[{item, intensidad, tendencia, refs}]`. Intensidad = conteo total; tendencia = conteo en o después de `anio_corte` menos el conteo anterior. Solo conteos, sin ponderaciones. |
| `distribucion`           | `variable` (`fragmentos_por_documento` \| `entidades_por_documento` \| `paises_por_documento` \| `alertas_por_municipio` \| `menciones_por_entidad`), `fenomeno`, `barras` (4–30) | `{variable, sujetos, unidad, total, resumen:{minimo, mediana, media, maximo, p90}, barras:[{desde, hasta, etiqueta, cuenta, ejemplos, refs}]}` — solo en el selector del tablero: el catálogo del agente quedó congelado con la evaluación del Reto 1 |
| `evidencia_satelital`    | `sitio` (id ELDOR), `encuadre`: `frontera` \| `mineria` \| `bosque` | `{sitios: [], triptico: {sitio, imagen, encuadre, con_anotacion, recorte_px, fecha_captura, resolucion_m_px, crs, modelo, huella_minera_ha, bosque_ha, regeneracion_ha, intervenida_ha, area_total_ha, clases: [{clase, porcentaje, minera, color}], procedencia}, encuadres: []}` — medición sobre imagen: no lleva `doc_id`/`chunk_id`, su trazabilidad es espacial. Los trípticos los precalcula `scripts/eldor_recorte.py`; sin ellos, `triptico` es `null`. El encuadre `bosque` encabeza con bosque primario, área intervenida y regeneración: es cobertura medida en **un solo vuelo**, no pérdida entre dos fechas. Solo en el selector del tablero |
| `deforestacion`          | `causa` (`Minería`, `Incendio`, `Cultivo`, `Ganadería`…; la que no casa se descarta y se avisa), `desde`, `hasta` (2014-2021), `top` (3-30 municipios) | `{serie: [{anio, ha, poligonos}], causas: [{causa, ha}], municipios: [{divipola, nombre, departamento, ha, poligonos, por_causa}], municipios_totales, total_ha, causa, procedencia}` — **no lleva `doc_id`/`chunk_id`**: sale de un conjunto oficial, no del corpus, y su trazabilidad es el conjunto (`iczg-dyt3`), el método (fotointerpretación sobre Sentinel-2), el periodo y el código DIVIPOLA de cada municipio, que es lo que lo empalma con las alertas tempranas. Cubre el Chocó, donde Amazon Mining Watch no llega. Los precalcula `scripts/deforestacion_choco.py`; sin ellos, `procedencia` es `null`. Solo en el selector del tablero |
| `panel_evidencia`        | `chunk_id` \| `entidad` \| `doc_id` \| `consulta` (texto), `curado` (solo los 157 pares de `sql_entidades` revisados a mano por ADL; se combina con `entidad` y, si esa pareja no da nada, repliega declarando el filtro en `filtros_ignorados`), `fenomeno`, `limite` (≤ 20)                                             | `[{doc_id, chunk_id, titulo, fuente, fragmento}]`                                                                                                                              |
| `poblacion_orbital`      | `vista`: `crecimiento` \| `asat` \| `colombia` \| `inspectores`; `pais` (código GCAT: `US`, `CN`, `RU`, `SU`, `CO`…; el que no casa se descarta y se avisa); `desde`, `hasta` (1957-2026, solo afecta `crecimiento`); `top` (3-26 ensayos, solo `asat`) | Por `vista`: `crecimiento` → `{serie: [{anio, tipo, pais, lanzados}], en_orbita_por_regimen: [{regimen, tipo, n}], total_lanzados, total_en_orbita, procedencia}`; `asat` → `{asat: [{jcat, satcat, cospar, nombre, pais, fecha_ensayo, catalogados, en_orbita, refs}], procedencia}`; `colombia` → `{colombia: [{jcat, satcat, cospar, nombre, lanzamiento, estado, fin}], procedencia}`; `inspectores` → `{inspectores: [{jcat, satcat, cospar, nombre, pais, lanzamiento, orbita, estado, fin, alias_corpus, referencia, hijos, refs}], procedencia}` — fuente: GCAT (McDowell, CC BY 4.0); `crecimiento` y `colombia` no llevan `doc_id`/`chunk_id`, su trazabilidad es el catálogo de origen (`jcat`/`satcat`/`cospar` por objeto); `asat` e `inspectores` sí citan fragmentos reales del corpus, resueltos por una lista fija de alias contra `menciones` (no todas las filas tienen evidencia: se muestran igual, sin inventar un vínculo). `inspectores` es una lista curada por el equipo, con `referencia` pública por entrada. Los precalcula `scripts/gcat_orbita.py`; sin ellos, `procedencia` es `null`. Solo en el selector del tablero |

### `POST /api/visualizar`

Cuerpo: `{instruccion: string}`. El backend llama a `POST {AGENT_URL}/chat` con
`{"pregunta": instruccion, "incluir_extras": true}`. Si `extras.visualizacion` trae una
especificación, ejecuta el componente con sus filtros. Responde:

```json
{
  "respuesta_agente": "texto del agente",
  "especificacion": {
    "componente": "...",
    "fenomeno": 3,
    "filtros": {},
    "titulo": "",
    "justificacion": ""
  },
  "resultado": { "...": "misma forma que POST /api/componente" },
  "traza": { "agentes_invocados": [], "tokens": {}, "latencia_ms": 0 },
  "citas": [{ "n": 1, "doc_id": "", "chunk_id": "" }]
}
```

Si el agente no devuelve especificación, `resultado` es `null` y la SPA muestra la respuesta
textual. Los filtros desconocidos se ignoran y se informan en `filtros_ignorados`.

## Variables de entorno

| Variable        | Descripción                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `AGENT_URL`     | URL del agente del Reto 1, por ejemplo `https://agent.aerocode.codefest2026.augusta.avaldigitallabs.com` |
| `METADATA_PATH` | Ruta de `metadata.jsonl`. En la imagen: `/data/base_vectorial/encoder_bge-m3/metadata.jsonl`             |
| `DB_PATH`       | Ruta de `dashboard.db`. En la imagen: `/app/datos/dashboard.db`                                          |
