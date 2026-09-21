# Extensión del plan — amenazas que no dejan basura (F2)

> Complementa [`PLAN_POBLACION_ORBITAL.md`](PLAN_POBLACION_ORBITAL.md). Aquel cuenta lo que
> **destruye** (ensayos ASAT y su basura). Esta extensión cubre lo que **interfiere o espía**
> la señal de un satélite ya en órbita, que según SWF 2026 es lo único que se usa de verdad en
> los conflictos actuales.
>
> Estado: **E1 listo para implementar**; **E2 condicionado a un spike de datos** (§3.4).
> Cifras medidas sobre GCAT (actualizado el 2026-09-18) y `dashboard.db`.

## 1. Resumen

| Extensión                                | Qué añade                                                                                                                                               | Fuente                                                              | Evidencia del corpus                                                                                | Esfuerzo     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------ |
| **E1 · vista `inspectores`**             | Satélites de inspección y proximidad (RPO) que se acercan a otros para interceptar señales o ensayar armas: Luch/Olymp-K, GSSAP, Kosmos-2542/2543/2576… | GCAT (la misma del plan base) + una lista curada de identificadores | **Sí**: `luch` 16 docs / 31 frag., `gssap` 10 / 27, `cosmos 2543` 13 / 25, `sj-20`/`sj-21`, `tjs-3` | ≈1 h 30 min  |
| **E2 · componente `centelleo_colombia`** | Interferencia **natural** de la señal GNSS sobre Colombia: centelleo ionosférico por burbujas de plasma ecuatoriales, por mes y hora local              | Radio-ocultación COSMIC (S4) — por confirmar                        | **No** (0 entidades de centelleo/ionosfera)                                                         | ≈3 h + spike |

Orden recomendado: plan base → E1 → spike de E2 → E2 solo si el spike pasa.

---

## 2. E1 — vista `inspectores` dentro de `poblacion_orbital`

### 2.1 Por qué

- Luch/Olymp-K 1 (lanzado en 2014) se estacionó junto a satélites Intelsat y europeos en GEO,
  a 55–90 km, para interceptar sus comunicaciones. Visitó 30 posiciones, pasó a órbita
  cementerio en octubre de 2025 y **se fragmentó el 30 de enero de 2026**. GCAT ya cataloga ese
  fragmento (`S67745 deb Luch`, tipo `D XG`, en órbita).
- Kosmos-2543 soltó en 2020 un «proyectil» que GCAT cataloga aparte (`S45915 Kosmos-2543
projectile`): es el ensayo ASAT coorbital que el corpus discute.
- El corpus tiene el texto de todos ellos, pero hoy solo aparecen como nodos sueltos en
  `red_entidades`. Esta vista los junta, con fecha, órbita y estado, y enlaza a los fragmentos.

### 2.2 Datos

Una **lista curada** de satélites de inspección, versionada en el script. Cada entrada lleva su
identificador GCAT, los alias con los que aparece en `entidades` y la referencia pública que
justifica incluirla. Se declara que es curada: la inclusión es una decisión del equipo con
fuente, no un dato de GCAT.

| JCAT            | Nombre en GCAT             | País | Lanzamiento | Órbita | Estado GCAT      | Alias en el corpus          |
| --------------- | -------------------------- | ---- | ----------- | ------ | ---------------- | --------------------------- |
| S40258          | Luch (Olymp-K 1)           | RU   | 2014-09-27  | GEO    | O (+1 fragmento) | `luch`, `olymp-k`           |
| S55841          | Luch-5Kh No. 3 (Olymp-K 2) | RU   | 2023-03-12  | GEO/D  | O                | `luch`, `olymp-k`           |
| S40099 / S40100 | USA 253 / 254 (GSSAP 1-2)  | US   | 2014-07-28  | GEO/D  | O                | `gssap`, `gssap satellites` |
| S41744 / S41745 | USA 270 / 271 (GSSAP 3-4)  | US   | 2016-08-19  | GEO/D  | O                | `gssap`                     |
| S43917          | TJS-3 subsatellite         | CN   | 2018-12-24  | GEO    | O                | `tjs-3`                     |
| S44797          | Kosmos-2542                | RU   | 2019-11-25  | LEO    | R                | `cosmos 2542`               |
| S44835 / S45915 | Kosmos-2543 y su proyectil | RU   | 2019-11-25  | LEO    | R / O            | `cosmos 2543`               |
| S59773          | Kosmos-2576                | RU   | 2024-05-16  | LLEO   | O                | (verificar alias)           |
| S64095          | Kosmos-2588                | RU   | 2025-05-23  | LLEO   | O                | (verificar alias)           |
| por resolver    | Shijian-17 / 21 / 25       | CN   | —           | GEO    | —                | `sj-20`, `sj-21`            |

Tareas de datos (en `scripts/gcat_orbita.py`):

1. Constante `INSPECTORES = [{jcat, alias_corpus, referencia}]`.
2. Resolver los Shijian por nombre en GCAT (el patrón `Shijian-` no dio resultado; probar
   `Shi Jian`, `SJ-`) y los alias de Kosmos-2576 y 2588 en `entidades`.
3. Para cada JCAT, sacar de GCAT el nombre, país, `LDate`, `OpOrbit`, `Status` y `DDate`, más
   los **hijos** (fragmentos, subsatélites o proyectiles con `Parent` = ese JCAT) y cuántos
   siguen en órbita.
4. Añadir `inspectores: [...]` a `orbita.json`.

### 2.3 API y web

- `Filtros.vista` pasa a `Literal["crecimiento", "asat", "inspectores", "colombia"]`.
- `poblacion_orbital.py`: la vista `inspectores` devuelve la lista y resuelve la evidencia con
  los **mismos** mecanismos de la vista `asat` (alias → `menciones` → `doc_id`/`chunk_id`,
  consulta con parámetros).
- **Gráfico**: una línea de tiempo tipo Gantt (tarea: tendencia/evento), con una fila por
  satélite desde el lanzamiento hasta el fin o hasta hoy, color por país (Okabe-Ito + etiqueta),
  marcas para los hijos (✕ fragmento, ◆ proyectil) y la órbita escrita en la fila. Clic en una
  fila → fragmentos del corpus en el panel lateral.
- **Sin coordenadas de órbita en GEO ni «distancia al objetivo»**: GCAT no las trae, y
  calcularlas con TLE sería un dato nuevo sin trazabilidad. Las 30 posiciones de Luch se citan
  en texto (con su fuente) en la ficha, no se dibujan.
- `nota_metodo`: «Lista curada de N satélites de inspección y proximidad con referencia pública.
  Fechas, órbitas, estados y fragmentos según GCAT (CC BY 4.0). Que un satélite esté en la lista
  no afirma una intención: resume lo que documentan las fuentes citadas.»

### 2.4 Agente, pruebas y documentación

- `agent/app/catalogo.py`: añadir a la descripción de `poblacion_orbital`: «…, satélites
  inspectores o espías (Luch, Olymp-K, GSSAP, operaciones RPO) → `vista=inspectores`».
- `dashboard/api/tests/test_api.py`:
  - `test_inspectores_citan_fragmentos_reales` (los `chunk_id` existen y su `doc_id` coincide);
  - `test_luch_tiene_su_fragmento` (≥ 1 hijo en órbita);
  - `test_inspectores_es_lista_curada` (cada entrada tiene `referencia` no vacía).
- `tests/e2e`: la vista se abre y el clic en Luch abre la evidencia.
- `dashboard/API.md`, README y ARQUITECTURA: la vista nueva y la lista curada como decisión
  declarada.

Instrucciones que deben activarla:

| Instrucción                                                         | Espera                                              |
| ------------------------------------------------------------------- | --------------------------------------------------- |
| ¿Qué satélites espían o interceptan las señales de otros satélites? | `vista=inspectores`                                 |
| ¿Qué ha hecho el satélite ruso Luch?                                | `vista=inspectores` (+ respuesta citada en el chat) |
| Muéstrame las operaciones de proximidad en órbita                   | `vista=inspectores`                                 |

---

## 3. E2 — componente `centelleo_colombia`

### 3.1 Por qué

- Colombia está bajo la **anomalía de ionización ecuatorial**, la zona del planeta donde más
  centellea la señal GNSS. Después del atardecer se forman **burbujas de plasma**, y la señal
  que baja del satélite y las atraviesa fluctúa en fase y amplitud. El receptor pierde
  enganche o da errores de posición: aviación, agricultura de precisión, drones y
  sincronización.
- En el oeste de Sudamérica el pico ocurre en **octubre-noviembre y febrero-marzo**, entre las
  19:00 y las 03:00 hora local.
- **El país casi no se vigila a sí mismo.** De las cuatro estaciones LISN en Colombia (Bogotá,
  Leticia, Popayán, Santa Marta) **solo Leticia sigue operando en 2025** (Orduy Rodríguez et
  al., _Sensors_ 2026). Es un argumento directo para la FAC y para la Agencia Espacial.
- Es el hueco más colombiano del F2, y **el corpus no lo cubre** (0 entidades de centelleo o
  ionosfera). Justamente por eso aporta: el tablero enseñaría algo que el texto no dice.

### 3.2 Fuentes evaluadas

| Fuente                                                       | Qué da                                                                                                             | Acceso / licencia                                                                   | Veredicto                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **COSMIC-2 (FORMOSAT-7), producto `scnLv2`/S4** — UCAR CDAAC | Índice S4 de centelleo por evento de radio-ocultación, con lat/lon/hora, desde 2019, franja ±40° (Colombia dentro) | Público en CDAAC; **confirmar en el spike** si pide registro y qué licencia declara | **Primera opción**                                       |
| **COSMIC-1 S4max 2007-2018** — Zenodo 10.5281/zenodo.8272777 | Mismo índice, misión anterior                                                                                      | **CC BY 4.0**, 304 MB zip → 12,8 GB HDF5                                            | **Respaldo**: licencia clara, pero pesado y antiguo      |
| LISN (IGP, Perú)                                             | S4 de estaciones en tierra                                                                                         | Portal web; en Colombia solo Leticia opera                                          | Descartado: una sola estación y sin licencia clara       |
| IGS `BOGT00COL` (UNAL) / IGAC MAGNA-ECO                      | RINEX GNSS; con ellos se calcula ROTI                                                                              | IGAC publica solo los últimos 60 días; el histórico se pide por correo              | Descartado para hoy: procesar RINEX es un proyecto en sí |
| NASA GOLD (SES-14, 47,5°O)                                   | Imágenes UV de burbujas sobre Sudamérica                                                                           | Datos de nivel 2 públicos                                                           | Futuro: vistoso, pero es imagen y no un conteo           |

### 3.3 Diseño

- **Recorte**: caja de Colombia (lat −4,3 a 13,5; lon −79 a −66,8), más un margen de 2° para
  tener eventos suficientes. El margen se declara.
- **Métrica: conteos, no un índice propio** (B.2.5). S4 es una medida física de la fuente;
  lo que el tablero cuenta es **cuántos eventos superan un umbral estándar de la literatura**
  (S4 ≥ 0,3 moderado y S4 ≥ 0,5 fuerte), sobre el total de eventos en la celda. Siempre se
  muestran juntos numerador y denominador.
- **Vistas**:
  - `estacionalidad` (defecto): **mapa de calor mes × hora local** con el número de eventos
    fuertes (tarea: distribución/tendencia). Debe dejar ver el pico nocturno y el de
    equinoccios.
  - `mapa`: celdas de 2°×2° sobre Colombia con el conteo de eventos fuertes (tarea:
    espacial), sobre las geometrías de departamentos que ya usa el tablero.
- **Filtros**: `vista`, `umbral` (`0.3`|`0.5`), `desde`/`hasta` (años).
- **Trazabilidad**: la del conjunto, como `deforestacion`: misión, producto, versión,
  DOI/URL, periodo, número de eventos leídos, caja y umbral. Cada celda lleva su recuento de
  eventos. Va en `SIN_CORPUS`, con su propia prueba de trazabilidad.
- `nota_metodo`: «Eventos de radio-ocultación COSMIC-2 con S4 ≥ U dentro de la caja de Colombia
  (± 2°), por mes y hora local. Es un conteo de mediciones, no un pronóstico ni un nivel de
  riesgo. La radio-ocultación mide en el limbo: la posición es la del punto tangente, con una
  incertidumbre de cientos de km.»

### 3.4 Spike de datos (≤ 1 h, go/no-go)

Antes de escribir el componente, `scripts/centelleo_explorar.py` en el scratchpad:

1. Confirmar la URL de descarga del S4 de COSMIC-2 y si pide registro. Si pide credenciales,
   la descarga se hace **fuera del build** y solo se versiona el JSON agregado: nunca se
   versionan credenciales.
2. Bajar un mes de equinoccio (p. ej. marzo de 2024, cerca del máximo solar) y contar los
   eventos dentro de la caja.
3. **Pasa** si: licencia o términos permiten redistribuir el agregado, hay ≥ 200 eventos por
   mes en la caja y el pico nocturno se ve a simple vista. **No pasa** → se intenta con el
   respaldo de Zenodo (CC BY) limitado a 2014-2018; si tampoco, E2 queda documentado en
   ARQUITECTURA §10 como trabajo futuro, con las fuentes de esta tabla.

### 3.5 Tareas si el spike pasa

1. `scripts/centelleo_colombia.py`: descarga por meses, filtra por caja, agrega a
   `dashboard/datos/centelleo/colombia.json` (< 100 KB) con `procedencia`.
2. `dashboard/Dockerfile`: `COPY --chown=tablero datos/centelleo ./datos/centelleo`.
3. `dashboard/api/app/componentes/centelleo_colombia.py`, calcado de `deforestacion.py`
   (salida vacía con instrucción si falta el JSON, `desde>hasta` se invierte, umbral inválido →
   `filtros_ignorados`). Registrar en `componentes/__init__.py`.
4. Pruebas: trazable a su conjunto; la suma de las celdas es igual al total de eventos fuertes;
   umbral 0,5 ≤ umbral 0,3 en cada celda; latencia < 500 ms.
5. `agent/app/catalogo.py`: «Centelleo ionosférico de la señal GNSS sobre COLOMBIA (burbujas de
   plasma), por mes y hora o por celda. Úsalo para interferencia natural de señales satelitales,
   GPS degradado, clima espacial o ionosfera sobre Colombia. NO lo uses para interferencia
   intencional (jamming): eso es `red_entidades`/`panel_evidencia` sobre el corpus.»
6. Web: `tipos.ts`, `catalogo.ts` (familia `distribucion`, icono `Radio` de lucide),
   `vistas/centelleo-colombia.tsx` (heatmap ECharts con escala viridis y leyenda con
   unidades; mapa con MapLibre sobre `departamentos.geojson`), `cuerpo-componente.tsx`.
7. Documentación: API.md, README (13 componentes), ARQUITECTURA (propuesta F2 + B.1.1 + límite
   de la radio-ocultación).

Instrucciones que deben activarlo:

| Instrucción                                                 | Espera                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| ¿Cuándo se degrada más la señal GPS sobre Colombia?         | `centelleo_colombia`, `vista=estacionalidad`                                          |
| ¿Dónde afecta más la ionosfera a los satélites en Colombia? | `vista=mapa`                                                                          |
| ¿Qué son las burbujas de plasma y cómo afectan al GPS?      | ruta `ambos`: el chat se abstiene si no hay corpus y el tablero muestra el componente |

---

## 4. Riesgos

- **Lista curada (E1).** Un jurado puede preguntar por qué está un satélite y no otro. Cada
  entrada lleva su referencia y la nota dice que la lista no afirma intención.
- **Nombres en GCAT.** Los Shijian y algunos Kosmos no casan por nombre a la primera; la
  resolución se hace por JCAT fijo, no por búsqueda de texto en tiempo de consulta.
- **Centelleo sin corpus (E2).** El chat no podrá citarlo; se asume y se declara, igual que con
  `deforestacion`. La nota de método evita que se lea como pronóstico.
- **Ciclo solar.** 2024-2025 es máximo solar, y el centelleo es mucho mayor que en el mínimo.
  Si solo se usan esos años, la nota lo dice para que no se lea como tendencia.
- **Plazo.** E1 cabe en la misma jornada que el plan base. E2 es trabajo posterior a la
  entrega del Reto 2 salvo que el spike salga en menos de una hora.

## 5. Fuentes

- Luch/Olymp-K: [RAND 2026](https://www.rand.org/pubs/commentary/2026/03/how-russia-is-intercepting-communications-from-european.html),
  [Gunter's Space Page](https://space.skyrocket.de/doc_sdat/olimp-k.htm),
  [SatTrackCam Leiden](https://sattrackcam.blogspot.com/2025/03/the-russian-eavesdropping-satellite.html).
- Detección de interferencia desde el espacio: [HawkEye 360 – GPS World](https://www.gpsworld.com/hawkeye-360-launches-advanced-gnss-interference-detection-capabilities/).
- Centelleo en Colombia: [Orduy Rodríguez et al., _Sensors_ 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC13030329/),
  [climatología sudamericana](https://www.sciencedirect.com/science/article/abs/pii/S1364682622000463),
  [LISN](http://lisn.igp.gob.pe/), [SBAS para Colombia, _Aerospace_ 2026](https://doi.org/10.3390/aerospace13030264).
- Datos: [CDAAC COSMIC](https://www.cosmic.ucar.edu/what-we-do/data-processing-center/data),
  [formato scnLv1](https://cdaac-www.cosmic.ucar.edu/cdaac/cgi_bin/fileFormats.cgi?type=scnLv1),
  [COSMIC-1 S4max en Zenodo (CC BY 4.0)](https://zenodo.org/records/8272777),
  [IGAC MAGNA-ECO](https://geoportal.igac.gov.co/contenido/geodesia-archivos-en-formato-rinex-estaciones-red-magna-eco),
  [GOLD y burbujas de plasma](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2023GL103510).
