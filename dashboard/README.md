# Tablero de analítica visual (Reto 2)

Un solo contenedor sirve la API bajo `/api/*`, las geometrías bajo `/geo/*` y la SPA compilada
bajo `/`, en el puerto **8080** (Anexo A.4). Todos los valores son conteos y agregaciones de
`datos/dashboard.db` (nunca puntajes, Anexo B.2.5) y cada cifra es trazable a `doc_id` y
`chunk_id`; el texto de cada fragmento se lee de `metadata.jsonl` de la base vectorial de la
Etapa 1. El contrato completo está en [`API.md`](API.md).

## Arquitectura del contenedor

```
dashboard/
├── api/app/            FastAPI: main.py, db.py, evidencia.py, visualizar.py, settings.py
│   └── componentes/    un módulo por componente del catálogo cerrado (8)
├── datos/              dashboard.db (34,5 MB) y geo/*.geojson → se copian a /app/datos
├── web/                SPA (Vite) → se compila en la etapa 1 y queda en /app/web
└── Dockerfile          etapa 1 node:22-alpine (npm ci && npm run build)
                        etapa 2 python:3.12-slim (API + datos + SPA + metadata.jsonl)
```

- `db.py` abre SQLite en modo solo lectura (`file:...?mode=ro`, `PRAGMA query_only`) con una
  conexión por hilo. **Todas** las consultas son SQL estático con parámetros nombrados: ni los
  nombres de columna dependen del usuario (se eligen con `CASE :filtro WHEN ... END`), de modo
  que una inyección en un filtro solo puede producir un resultado vacío.
- `componentes/` valida los filtros de cada componente con pydantic. Las claves desconocidas y
  los valores imposibles se descartan y se informan en `filtros_ignorados`; la respuesta nunca
  falla por un filtro mal escrito por el agente.
- Los filtros `entidad` y `tipo_entidad` se normalizan antes de consultar
  (`componentes/base.py`): el grafo de la Etapa 1 guarda las entidades en minúsculas (`eln`,
  `farc-ep`) y tanto el jurado como el agente escriben `ELN` o `FARC-EP`. Se baja a minúsculas
  y, si no hay coincidencia exacta, se toma la entidad más mencionada que contenga el texto
  pedido. El título y la nota de método declaran la entidad que realmente se consultó.
- `evidencia.py` recorre `metadata.jsonl` (~200 MB) una sola vez al arrancar, en segundo plano,
  para anotar el desplazamiento de byte de cada `chunk_id`; después cada fragmento se lee con un
  `seek` a su línea. El archivo nunca se carga en memoria.
- `visualizar.py` llama a `POST {AGENT_URL}/chat` con httpx (timeout 90 s) y traduce los fallos a
  504 (sin respuesta a tiempo) o 502 (agente inalcanzable o respuesta no utilizable).
- La SPA se monta al final con fallback a `index.html`, para que las rutas del cliente funcionen
  sin capturar `/api` ni `/geo`.

## Endpoints

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/api/salud` | `{estado, tablas: {...conteos}, textos: {disponible, indexado}}` |
| GET | `/api/catalogo` | los 11 componentes (los 8 del agente más `distribucion`, `evidencia_satelital` y `orden_observacion`) con sus filtros, opciones y valores por defecto |
| POST | `/api/componente` | `{componente, fenomeno?, filtros?}` → datos, `evidencia`, `nota_metodo`, `total_evidencia`, `filtros_ignorados` |
| POST | `/api/visualizar` | `{instruccion}` → agente del Reto 1 → especificación ejecutada |
| GET | `/api/evidencia/{chunk_id}` | fragmento con `doc_id`, fuente, metadatos del documento y texto |
| GET | `/api/evidencia?chunk_ids=1,2,3` | lote de hasta 50 fragmentos |
| GET | `/geo/{departamentos,municipios,paises}.geojson` | geometrías estáticas |

Componentes del catálogo cerrado (el mismo de `agent/app/catalogo.py`): `composicion_corpus`,
`linea_tiempo`, `matriz_calor`, `red_entidades`, `mapa_colombia`, `mapa_mundo`,
`cuadrante_priorizacion`, `panel_evidencia`; más `distribucion` (histograma, Anexo B.2.1) y
`evidencia_satelital` (el ortomosaico, la segmentación del modelo y la anotación humana del
sitio minero, uno al lado del otro) y `orden_observacion` (la ficha «de la mención al
sobrevuelo»: alertas del municipio, presencia armada, minería medida por Amazon Mining Watch
y el punto sobre el que la SPA propaga las pasadas satelitales), que solo se alcanzan desde
el selector del tablero o por URL porque el catálogo del agente quedó congelado con la
evaluación del Reto 1.

`evidencia_satelital` es el único componente que no consulta la base: enseña los trípticos que
precalcula `scripts/eldor_recorte.py` y que viajan dentro de la SPA (`web/public/eldor/`). Su
trazabilidad no es `doc_id`/`chunk_id` sino la espacial —sitio, CRS, ventana del recorte,
resolución, fecha de vuelo y checkpoint—, así que su `evidencia` va vacía a propósito. Sin
trípticos en disco devuelve `triptico: null` y la vista lo dice, en vez de salir en blanco.

Tres encuadres del mismo modelo, según qué se quiera enseñar: `mineria` (la zona de más
actividad), `frontera` (el borde donde el bosque termina y la mina empieza) y `bosque` (el
frente de deforestación: selva en pie junto a terreno desmontado que rebrota). El de `bosque`
encabeza con bosque primario, área intervenida y regeneración natural en vez de con la huella
minera, y su nota de método advierte de lo que la cifra **no** es: cobertura medida en un solo
vuelo, no pérdida de bosque entre dos fechas, que exigiría dos vuelos del mismo sitio.

Límites: `evidencia` ≤ 200 elementos (con
`total_evidencia`), `refs` ≤ 20 por elemento cliqueable, `top` ≤ 30 (≤ 60 nodos en la red),
`limite` ≤ 20 en `panel_evidencia`.

## Variables de entorno

| Variable | Valor en la imagen | Descripción |
| --- | --- | --- |
| `AGENT_URL` | — | Agente del Reto 1, p. ej. `https://agent.aerocode.codefest2026.augusta.avaldigitallabs.com` |
| `AGENT_TIMEOUT_S` | `90` | Timeout de `POST /chat` |
| `DB_PATH` | `/app/datos/dashboard.db` | Base analítica |
| `METADATA_PATH` | `/data/base_vectorial/encoder_bge-m3/metadata.jsonl` | Texto de los fragmentos |
| `GEO_DIR` | `/app/datos/geo` | GeoJSON servidos en `/geo` |
| `WEB_DIST` | `/app/web` | SPA compilada |
| `CORS_ORIGINS` | `*` | Orígenes permitidos, separados por coma |
| `CONSOLA_URL` | _(vacía)_ | Base de la consola de chat del Reto 1. Si está, el encabezado enlaza a ella; si no, el enlace no aparece |
| `CORPUS_DIR` | _(vacía)_ | Raíz del corpus original de la Etapa 0, montada en el contenedor. Si está, cada fragmento de evidencia enlaza al archivo del que salió (`GET /api/documento/{chunk_id}`); si no, el enlace no aparece |
| `VISTA_TECNICA` | `0` | Detalles internos en la interfaz: identificadores del catálogo, claves crudas de los filtros, consumo de tokens y rutas del corpus. El tablero que revisa el jurado va limpio |

## Desarrollo y pruebas

```bash
pip install -r api/requirements.txt
cd api
python -m pytest -q      # usa la base real y el metadata.jsonl local (METADATA_PATH)
ruff check .
bandit -q -r app
uvicorn app.main:app --port 8080 --app-dir .   # DB_PATH/GEO_DIR/METADATA_PATH por entorno
```

Las pruebas ejercen la API con `TestClient` contra `datos/dashboard.db`: cada componente devuelve
datos no vacíos con sus filtros por defecto, todo `doc_id`/`chunk_id` de `datos` y `evidencia`
existe en la tabla `fragmentos` y coincide entre sí, los filtros inválidos no rompen la respuesta,
las cargas de inyección SQL no alteran los conteos de la base, `/api/evidencia` devuelve el texto
exacto de `metadata.jsonl` y `/api/visualizar` se prueba contra un agente simulado por un servidor
falso local. La prueba `test_latencia_de_cada_componente` falla si algún componente pasa de 500 ms.

## Despliegue en Coolify

1. Aplicación tipo **Dockerfile**, repositorio del proyecto, **Base Directory** `/dashboard`
   (el contexto de construcción es esa carpeta: la imagen no necesita nada de fuera).
2. Puerto expuesto: **8080**. Dominio:
   `dashboard.aerocode.codefest2026.augusta.avaldigitallabs.com`.
3. Variables: `AGENT_URL` apuntando al servicio del Reto 1. Las demás ya vienen con el valor
   correcto en la imagen.
4. Healthcheck: `GET /api/salud` (ya declarado en el `HEALTHCHECK` del Dockerfile).
5. La construcción descarga el zip de la base vectorial y extrae solo `metadata.jsonl`; el resto
   de la imagen no requiere red en tiempo de ejecución.
