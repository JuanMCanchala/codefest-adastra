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
| `panel_evidencia`        | `entidad` \| `doc_id` \| `consulta` (texto), `fenomeno`, `limite` (≤ 20)                                             | `[{doc_id, chunk_id, titulo, fuente, fragmento}]`                                                                                                                              |

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
