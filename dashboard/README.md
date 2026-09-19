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
| GET | `/api/catalogo` | los 8 componentes con sus filtros, opciones y valores por defecto |
| POST | `/api/componente` | `{componente, fenomeno?, filtros?}` → datos, `evidencia`, `nota_metodo`, `total_evidencia`, `filtros_ignorados` |
| POST | `/api/visualizar` | `{instruccion}` → agente del Reto 1 → especificación ejecutada |
| GET | `/api/evidencia/{chunk_id}` | fragmento con `doc_id`, fuente, metadatos del documento y texto |
| GET | `/api/evidencia?chunk_ids=1,2,3` | lote de hasta 50 fragmentos |
| GET | `/geo/{departamentos,municipios,paises}.geojson` | geometrías estáticas |

Componentes del catálogo cerrado (el mismo de `agent/app/catalogo.py`): `composicion_corpus`,
`linea_tiempo`, `matriz_calor`, `red_entidades`, `mapa_colombia`, `mapa_mundo`,
`cuadrante_priorizacion`, `panel_evidencia`. Límites: `evidencia` ≤ 200 elementos (con
`total_evidencia`), `refs` ≤ 20 por elemento cliqueable, `top` ≤ 30 (≤ 60 nodos en la red),
`limite` ≤ 20 en `panel_evidencia`.

### Navegación

El mapa se explora como un visor geoespacial: arrastrar mueve, la rueda acerca, el botón
derecho (o Ctrl+arrastrar) gira e inclina, y la brújula del control devuelve el norte. El
zoom llega hasta 19 en Colombia y 17 en el mundo —el tope de la imagen de Esri, unos 30 cm
por píxel—, así que se puede bajar hasta distinguir un frente de excavación; el relleno del
dato se desvanece al acercarse para no taparlo, y pasado el nivel 11 sobre el fondo analítico
el mapa ofrece cambiar a la imagen, que es lo que a ese detalle se está buscando. El botón
**Encuadrar** devuelve la cámara a las regiones con dato.

**Ampliar** saca el mapa de su banda de 520 px y lo lleva a la ventana entera; `Esc` o
**Reducir** lo devuelven. Al crecer el lienzo el zoom sube en la misma proporción, de modo
que el trozo de terreno que se estaba mirando llena la pantalla en vez de encogerse. La
leyenda y las notas del nivel viajan dentro del mapa (`superposicion` en `MapaCoropleta`),
porque en pantalla completa el lienzo se despega del flujo y las dejaría atrás.

Para que eso sea posible, ni un recálculo ni un cambio de nivel sustituyen el lienzo por el
estado de carga: se mantiene en pantalla el último resultado, atenuado, y la geometría
anterior hasta que llega la nueva. Si el mapa se desmontara, volvería a nacer en su encuadre
inicial y acercarse a un municipio sería imposible.

### Mapa base y HUD

Los dos componentes espaciales comparten `MapaCoropleta`. Sobre el lienzo hay dos controles:

- **Mapa base** (`web/src/lib/mapa-base.ts`): `Analítico` (predeterminado, sin descargas),
  `Callejero` (CARTO) y `Satélite` (Esri World Imagery). Ninguno pide llave. Las capas raster
  entran al estilo apagadas, así que sin encenderlas no se pide una sola tesela; si una falla,
  el mapa vuelve al fondo analítico y lo avisa. La elección se recuerda en `localStorage`.
- **HUD**: coordenadas del centro, retícula y encuadre de la región seleccionada con su
  conteo. Como el mapa se vuelve a montar al cambiar de modo, su estado también se recuerda.
- **Volumen**: levanta cada región en una columna proporcional a su dato (misma compresión
  por raíz cuadrada que el color) e inclina la cámara 52°, porque en planta una extrusión no
  se distingue de un relleno. Con un mapa base de imagen añade además el relieve del terreno
  (teselas terrarium de AWS, sin llave); sobre el fondo analítico no lo pide, para no
  descargar elevación que no tendría dónde apoyarse. No se ofrece en el globo: MapLibre
  parte la extrusión sobre la esfera.

`mapa_mundo` se dibuja con la proyección de globo de MapLibre y su atmósfera.

### Misiones satelitales

El interruptor **Órbitas** dibuja las plataformas que producen la evidencia satelital del
proyecto: Sentinel-2A/B/C y Sentinel-1A encendidas por defecto, y Landsat 8/9, Terra, Aqua,
NOAA-20 y NOAA-21 a un clic. De cada una se dibuja la traza en tierra (punteada la recorrida,
continua la que viene), la franja que el sensor está barriendo y un marcador con su nombre,
recalculados con SGP4 una vez por segundo.

Con un territorio elegido, el panel dice **cuándo lo miró y cuándo vuelve a mirarlo cada
misión**, y el mapa dibuja la banda de esa próxima pasada cruzando el país. Eso es lo que
explica por qué una alerta satelital tiene la fecha que tiene: sin pasada no hay imagen y sin
imagen no hay detección.

Detalles que sostienen la honestidad del cálculo (`web/src/lib/satelites.ts`):

- **Los elementos orbitales van embebidos** (`lib/tle-generado.ts`, generado por
  `node scripts/actualizar-tle.mjs` desde Celestrak, que es público y no pide llave). El
  tablero no consulta nada en tiempo de ejecución; el panel muestra la antigüedad del TLE y
  avisa a partir de dos semanas, porque una traza vieja se desvía.
- **Una pasada es una pasada útil.** Cuenta si el punto cae dentro de la franja del sensor y,
  en los ópticos, si además hay luz: Sentinel-2 cruza Colombia dos veces al día pero solo la
  de las 10:30 locales trae imagen. La nocturna se marca con luna y solo aparece en los
  sensores que sirven de noche (el radar de Sentinel-1, los térmicos de MODIS y VIIRS).
- **El barrido se reparte por misión** entre tareas del bucle de eventos —recorrer hasta
  dieciséis días de órbita, segundo a segundo alrededor de cada acercamiento, cuesta décimas
  de segundo por satélite— y el panel se va llenando en vez de congelar el tablero.

### Reproducción temporal

El botón **Reproducir**, junto al rango de años, recorre el rango año por año sobre el
componente activo: el rango global se estrecha a un solo año y avanza cada 1,1 s. No hay
dato nuevo ni interpolado —es el mismo filtro de siempre—, así que cada fotograma sigue
siendo un conteo real con su evidencia. Tres cuidados para que la animación no mienta ni
parpadee:

- La **escala de color se congela** en el máximo del rango completo. Con el máximo de cada
  año, uno de cinco alertas se vería tan intenso como uno de doscientas.
- La **cámara se queda quieta**: reencuadrar en cada año convertiría la lectura en un salto
  por fotograma.
- Un **año sin alertas no cambia la vista por el mensaje de vacío** y, entre año y año, se
  mantiene en pantalla el último resultado atenuado. Si el lienzo se desmontara, el mapa se
  reconstruiría en cada fotograma.

Tocar los filtros a mano cancela la reproducción y, al pausar o terminar, se restaura el
rango del usuario.

La cámara la dirige la consulta: cada vez que cambia la pregunta —una instrucción al agente
o un filtro— el mapa encuadra las regiones que tienen dato (`enfoque` en `MapaCoropleta`,
calculado en `App.tsx` como la clave de ejecución sin el nivel). No se mueve mientras el
usuario navega a mano, no cruza solo el umbral que pasa de departamentos a municipios, y si
la respuesta no trae datos se queda donde está. Con `prefers-reduced-motion` el salto es
instantáneo.

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
