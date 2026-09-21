# Plan — componente `poblacion_orbital` (F2 · seguridad del entorno espacial)

> Estado: **listo para implementar**. Las cifras de este plan se midieron sobre el
> `satcat.tsv` real de GCAT (actualizado el 2026-09-18) y sobre `dashboard.db`.
>
> Extensión (satélites inspectores y centelleo ionosférico sobre Colombia):
> [`PLAN_POBLACION_ORBITAL_EXTENSION.md`](PLAN_POBLACION_ORBITAL_EXTENSION.md).

## 1. Por qué

- **F2 es el fenómeno sin componente propio.** F3 tiene `mapa_colombia`, `deforestacion` y
  `evidencia_satelital`; F2 solo reutiliza los genéricos (`mapa_mundo`, `linea_tiempo`,
  `red_entidades`). La base SQL de ADL cubre 19 de sus 478 documentos.
- **El corpus ya tiene el texto; le falta el dato duro.** SWF (134 docs) y CSIS (214) hablan
  de ensayos ASAT y de Kessler, pero ningún componente _cuenta_ objetos en órbita.
- **Encaja en las reglas.** El Anexo B.1.1 admite variables derivadas «de fuentes externas
  durante la preparación de datos». Mismo patrón que `deforestacion`: un script descarga,
  precalcula y congela un JSON que viaja en la imagen. Sin APIs en vivo (ARQUITECTURA §9).
  Solo conteos: nada de probabilidades de colisión ni índices (B.2.5).

## 2. Fuente

**GCAT — General Catalog of Artificial Space Objects** (Jonathan C. McDowell),
`https://planet4589.org/space/gcat/tsv/cat/satcat.tsv`. Licencia **CC BY 4.0**: citar
«McDowell, J. C., General Catalog of Artificial Space Objects, https://planet4589.org/space/gcat».

Perfil medido (69.999 objetos catalogados):

| Campo                      | Uso                                              | Valores relevantes                                                  |
| -------------------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| `JCAT`, `Satcat`, `Piece`  | trazabilidad por objeto                          | `S25730`, `25730`, `1999-025A`                                      |
| `Type` (1.ª letra)         | clase de objeto                                  | `P` carga útil · `R` etapa de cohete · `C` componente · `D` desecho |
| `Type` (2.º código en `D`) | origen del desecho                               | **`W` = desecho de ensayo de arma** (6.760 objetos)                 |
| `Parent`                   | objeto del que salió el desecho                  | JCAT del satélite destruido                                         |
| `Status`                   | ¿sigue arriba?                                   | `O` en órbita · `R` reentrada · `C` destruido…                      |
| `LDate`, `DDate`           | lanzamiento / fin (fecha del ensayo en el padre) | texto `1957 Oct  4`                                                 |
| `State`                    | país responsable                                 | `US`, `CN`, `RU`, **`SU` (URSS, se deja aparte)**, `CO`…            |
| `OpOrbit`                  | régimen orbital                                  | `LLEO`, `LEO`, `MEO`, `GEO`, `HEO`, `GTO`                           |

Cifras ya verificadas que el componente reproducirá:

- **En órbita hoy: 32.346** objetos → 18.838 cargas útiles, 10.190 desechos, 2.017 etapas,
  1.301 componentes. ~10.700 de las cargas útiles son Starlink.
- **Cargas útiles lanzadas por año:** 118 (2000) → 478 (2019) → 1.248 (2020) → 4.511 (2025).
- **Ensayos ASAT (desechos `D·W` agrupados por `Parent`): 6.760 catalogados, 2.424 en órbita**,
  26 padres. Cuadra con SWF 2026 (6.904 / 2.773), que incluye además piezas no catalogadas
  por GCAT como `W`; la nota de método lo dirá.

| Ensayo                                                | País  | Fecha      | Catalogados | En órbita |
| ----------------------------------------------------- | ----- | ---------- | ----------- | --------- |
| Fengyun-1C                                            | CN    | 2007-01-11 | 3.533       | **2.091** |
| Kosmos-1408                                           | SU/RU | 2021-11-15 | 1.805       | 4         |
| P78-1 (ASM-135)                                       | US    | 1985-09-13 | 284         | 0         |
| USA-193                                               | US    | 2008-02-21 | 174         | 0         |
| Kosmos-252 (IS)                                       | SU    | 1968-11-01 | 135         | 33        |
| Microsat-R (Mission Shakti)                           | IN    | 2019-03-27 | 129         | 0         |
| Kosmos-970 (IS)                                       | SU    | 1977-12-21 | 119         | 113       |
| … 19 padres más (programa IS soviético, Kosmos-2535…) |       |            |             |           |

- **Colombia (`State = CO`):** Libertad-1 (2007-04-17, sigue en órbita, inactivo),
  FACSAT (2018-11-29, reentró 2023-06-03), FACSAT-2 Chiribiquete (2023-04-15, reentró
  2025-10-27 según GCAT — **verificar con la FAC antes del pitch**).

**Cruce con el corpus (medido en `entidades`/`menciones`):** `fengyun 1c` (7 docs, 12
fragmentos), `cosmos 1408` + `kosmos 1408 anti-satellite missile test` (≈10 docs),
`mission shakti` (4 docs, 5 fragmentos), `asat` (32 docs, 109 fragmentos). USA-193 y FACSAT no
aparecen: esas filas mostrarán «sin fragmentos en el corpus» en vez de inventar un vínculo.

## 3. Diseño del componente

Un solo componente con tres vistas, elegidas por el filtro `vista`. Cada vista responde a una
pregunta analítica distinta del F2 (ARQUITECTURA §3.3, numeral 1):

| `vista`                 | Pregunta                                                               | Gráfico (tarea B.2.1)                                                                                                | Datos                        |
| ----------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `crecimiento` (defecto) | ¿Cuánto ha crecido la población en órbita y de qué está hecha?         | Área apilada por año de lanzamiento × clase (tendencia + composición) y barra de «en órbita hoy» por régimen orbital | conteos por `LDate` y `Type` |
| `asat`                  | ¿Cuánta basura dejaron los ensayos antisatélite y cuánta sigue arriba? | Barras horizontales pareadas: catalogados vs. en órbita por ensayo (comparación)                                     | `D·W` por `Parent`           |
| `colombia`              | ¿Qué ha puesto Colombia en órbita?                                     | Línea de tiempo con 3 hitos y su estado                                                                              | `State = CO`                 |

**Filtros** (pydantic, tolerantes como los demás):

```python
class Filtros(FiltrosBase):
    vista: Literal["crecimiento", "asat", "colombia"] = "crecimiento"
    pais: str | None = None          # código GCAT (US, CN, RU, SU, IN, CO…); el que no casa → filtros_ignorados
    desde: int = Field(default=1957, ge=1957, le=2100)
    hasta: int = Field(default=2026, ge=1957, le=2100)
    top: int = Field(default=10, ge=3, le=26)   # ensayos en la vista asat
```

**Trazabilidad** (la del conjunto, como `deforestacion`, más la del corpus donde existe):

- `procedencia`: fuente, URL, licencia, fecha de actualización del TSV (`# Updated …`),
  fecha de descarga, filas leídas.
- Cada ensayo y cada satélite colombiano lleva `jcat`/`satcat`/`cospar`: con eso cualquier
  cifra se verifica en GCAT, CelesTrak o Space-Track.
- **Evidencia del corpus en la vista `asat`**: para cada ensayo, una lista fija de alias
  (`fengyun 1c`, `fengyun-1c`, `chinese fengyun-1c engagement` / `cosmos 1408`, `cosmos-1408`,
  `kosmos 1408 anti-satellite missile test` / `mission shakti`) se resuelve contra la tabla
  `menciones` en tiempo de consulta y devuelve `doc_id`/`chunk_id` reales con `base.evidencia()`.
  Clic en la barra → panel lateral de evidencia con esos fragmentos.
- `nota_metodo`: «Conteos del GCAT (McDowell, CC BY 4.0, actualizado AAAA-MM-DD). Desechos de
  ensayo = objetos tipo D con origen W, agrupados por el satélite destruido. En órbita = estado
  O en la fecha de actualización. La URSS (SU) y Rusia (RU) se cuentan por separado, como en la
  fuente. No incluye objetos no catalogados (<10 cm).»

## 4. Tareas

### Fase 1 — Datos (≈45 min)

1. **`scripts/gcat_orbita.py`** (patrón de `scripts/deforestacion_choco.py`: `urllib`, sin
   dependencias, `--salida`, `logging`, docstring con el porqué).
   - Descarga `satcat.tsv` a memoria (18 MB; **no** se versiona).
   - Lee la cabecera `#JCAT…` y la línea `# Updated …` para la procedencia.
   - Precalcula y escribe **`dashboard/datos/orbita/orbita.json`** (objetivo < 150 KB):
     - `serie`: `[{anio, tipo, pais, lanzados, en_orbita}]` agregado por año × clase × país
       (solo los ~12 países con más objetos + `OTROS`, para que el JSON no crezca).
     - `en_orbita_por_regimen`: `[{regimen, tipo, n}]`.
     - `asat`: `[{jcat, satcat, cospar, nombre, pais, fecha_ensayo, catalogados, en_orbita}]`.
     - `colombia`: `[{jcat, satcat, cospar, nombre, operador, lanzamiento, estado, fin}]`.
     - `procedencia`: `{fuente, url, licencia, actualizado, descargado, filas}`.
   - Parseo de fechas GCAT robusto (`1957 Oct  4`, `2021 Nov 15 0250?`, `-`).
2. Ejecutarlo una vez y versionar `orbita.json`.
3. **`dashboard/Dockerfile`**: `COPY --chown=tablero datos/orbita ./datos/orbita`.

### Fase 2 — API (≈45 min)

4. **`dashboard/api/app/componentes/poblacion_orbital.py`**, calcado de `deforestacion.py`:
   `_directorio()`, `_cargar()`, salida vacía con instrucción si falta el JSON, `desde>hasta`
   se invierte, `pais` desconocido → `filtros_ignorados`.
   Alias ASAT→entidades en una constante; consulta a `menciones` con `bd.consultar` y
   parámetros (nunca interpolación).
5. **`componentes/__init__.py`**: importar, añadir a `CATALOGO` y `MODULOS`.
6. **`dashboard/api/tests/test_api.py`**:
   - añadir a `SIN_CORPUS` (las vistas `crecimiento`/`colombia` no citan chunks);
   - `test_poblacion_orbital_es_trazable_a_gcat`: procedencia con licencia y fecha;
     en órbita = suma por clase; latencia < 500 ms (registrar en `LATENCIAS`);
   - `test_asat_cita_fragmentos_reales`: cada `chunk_id` de evidencia existe en `fragmentos`
     y su `doc_id` coincide;
   - `test_asat_fengyun_domina_en_orbita`: Fengyun-1C es el primero por `en_orbita`;
   - `test_pais_desconocido_se_ignora` y `test_colombia_tiene_tres_objetos`.

### Fase 3 — Agente (≈20 min)

7. **`agent/app/catalogo.py`**: entrada nueva, con la misma disciplina de la de
   `deforestacion` (cuándo usarlo y cuándo **no**):
   > «Población de objetos en órbita según el catálogo GCAT (tendencia/comparación). Úsalo
   > para crecimiento de satélites, basura espacial, síndrome de Kessler, desechos de
   > ensayos antisatélite (ASAT) o satélites de Colombia (FACSAT). NO lo uses para preguntas
   > sobre documentos o menciones. Filtros: vista=crecimiento|asat|colombia, pais, desde,
   > hasta, top.»
8. **`agent/tests/test_sistema.py`**: `test_catalogo_incluye_poblacion_orbital`.
9. Decisión de equipo: ARQUITECTURA §10 declara congelado el catálogo del agente. Ya hay
   cambios locales en `catalogo.py` para `deforestacion`, así que se sigue el mismo camino;
   si se decide no tocarlo, el componente sigue accesible desde el selector y por URL.

### Fase 4 — Web (≈1 h 15 min)

10. **`web/src/api/tipos.ts`**: `"poblacion_orbital"` en `NombreComponente`,
    `DatosPoblacionOrbital` y su rama en la unión discriminada.
11. **`web/src/lib/catalogo.ts`**: entrada con `familia: "temporal"`, icono `Orbit`
    (lucide), `usaAnios: true`, filtro `vista` de opciones y `pais` de texto.
12. **`web/src/componentes/vistas/poblacion-orbital.tsx`** (ECharts, como
    `deforestacion.tsx`):
    - `crecimiento`: área apilada (cargas / etapas / componentes / desechos), paleta
      Okabe-Ito, leyenda con unidades, eje «objetos catalogados por año de lanzamiento»;
      debajo, barras de «en órbita hoy» por régimen.
    - `asat`: barras horizontales pareadas catalogados / en órbita, etiqueta con país y año;
      clic → `panel-lateral-evidencia` con los fragmentos del corpus del ensayo.
    - `colombia`: tres hitos con fecha de lanzamiento, fin y estado (texto + forma, no solo
      color).
    - Pie con `nota_metodo` y la cita CC BY.
13. **`cuerpo-componente.tsx`**: `case "poblacion_orbital"`.
14. `npm run lint` y `npm run build`.

### Fase 5 — Documentación y E2E (≈30 min)

15. `dashboard/API.md` (fila de filtros), `dashboard/README.md` (12 componentes; fuente
    externa y cómo regenerarla), `docs/ARQUITECTURA.md` (propuesta F2, justificación B.1.1,
    fila en §10: «GCAT no incluye objetos < 10 cm; el conteo ASAT es un piso»), README raíz
    (tres instrucciones de ejemplo).
16. `tests/e2e/pruebas/tablero.spec.ts`: un caso por vista (render + clic en Fengyun-1C
    abre evidencia).

## 5. Instrucciones de ejemplo que deben activar el componente

| Instrucción                                               | Espera                                               |
| --------------------------------------------------------- | ---------------------------------------------------- |
| ¿Cuánto ha crecido el número de satélites en órbita?      | `poblacion_orbital`, `vista=crecimiento`             |
| ¿Cuánta basura espacial dejaron los ensayos antisatélite? | `vista=asat`                                         |
| Muéstrame la basura del ensayo chino de 2007              | `vista=asat`, `pais=CN`                              |
| ¿Qué satélites ha lanzado Colombia?                       | `vista=colombia`                                     |
| Explícame el síndrome de Kessler y muéstralo              | ruta `ambos`: respuesta citada + `vista=crecimiento` |

## 6. Riesgos y recortes

- **Plazo.** Si no alcanza antes de las 12:30, el mínimo que vale la pena entregar es
  Fase 1 + Fase 2 + vista `asat` en web (es la que une dato duro y corpus). `crecimiento` y
  `colombia` se añaden después sin romper contrato.
- **FACSAT-2**: la reentrada de 2025-10-27 sale de GCAT; confirmarla antes de decirla en
  el pitch.
- **SU vs. RU**: no se fusionan; se explica en la nota. Fusionarlos sería una decisión
  editorial que la fuente no toma.
- **Diferencia con SWF (6.760 vs. 6.904)**: declarada en la nota, no «corregida».
- **Tamaño**: el TSV no entra al repositorio ni a la imagen; solo el JSON agregado.
