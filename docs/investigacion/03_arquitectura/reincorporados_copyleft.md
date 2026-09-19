# Proyectos reincorporados tras aceptar el copyleft (AGPL/GPL)

Fecha: 18-sep-2026. **Decisión del equipo**: nuestro repositorio de la final se publica como
**público y bajo AGPL-3.0**. Por eso la licencia AGPL/GPL **ya no es motivo de descarte** y podemos
forkear y reutilizar código AGPL-3.0 y GPL-3.0.

Este documento revisa lo que `repos_utiles.md` y `proyectos_referencia.md` habían descartado o
dejado como "solo inspiración" por su licencia. En `arquitectura_empresarial.md` no hay ningún
descarte por licencia. Los metadatos (licencia, estrellas, último push y archivado) se consultaron
hoy con `gh api repos/<owner>/<repo>`. La estructura de cada repo se revisó con
`gh api repos/<o>/<r>/contents`. Algunas estimaciones de horas se basan en esa estructura y no en
una lectura completa del código; se indica en cada caso.

**worldmonitor** no se evalúa aquí: lo analiza otro agente en `worldmonitor_datos_agentes.md`.

---

## 1. Tabla resumen

| Repo                                                                                                | Licencia (verificada)                                                              | ★ / último push / archivado | Antes                                      | Ahora                                                       | Componente a reutilizar                                                                                                                                               | Reto                  | Horas | Riesgo en demo         |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----- | ---------------------- |
| [koala73/worldmonitor](https://github.com/koala73/worldmonitor)                                     | AGPL-3.0                                                                           | 86.934 / 2026-09-18 / no    | Inspiración de layout                      | **Ver `worldmonitor_datos_agentes.md`**                     | —                                                                                                                                                                     | R2                    | —     | —                      |
| [Dev-next-gen/orodruin](https://github.com/Dev-next-gen/orodruin)                                   | AGPL-3.0                                                                           | 52 / 2026-09-11 / no        | Solo inspiración (agente que maneja la UI) | **Reutilizar código**                                       | Despachador de herramientas de UI (`fly_to`, `toggle_layer`, `filter_events`, `focus_entity`) y el constructor del grafo de co-ocurrencia de actores enlazado al mapa | R1↔R2 (F3)            | 6–8   | Medio (proyecto joven) |
| [BigBodyCobain/Shadowbroker](https://github.com/BigBodyCobain/Shadowbroker)                         | AGPL-3.0                                                                           | 11.187 / 2026-09-18 / no    | Inspiración (estética, dossier)            | **Reutilizar código**                                       | Dossier por clic sobre el mapa (Next.js + MapLibre, **nuestro mismo stack**) y los estilos HUD oscuros                                                                | R2 (F3, vista COP)    | 4–6   | Bajo-medio             |
| [AndrewCTF/velocity](https://github.com/AndrewCTF/velocity)                                         | AGPL-3.0 (+ `NOTICE`)                                                              | 92 / 2026-09-17 / no        | Inspiración (procedencia, informe)         | **Reutilizar código**                                       | Insignia de procedencia y frescura por dato y exportador de informe HTML con procedencia por afirmación                                                               | R1 (verificador) + R2 | 4–6   | Bajo                   |
| [thkruz/keeptrack.space](https://github.com/thkruz/keeptrack.space)                                 | AGPL-3.0                                                                           | 1.594 / 2026-09-17 / no     | Iframe o enlace, sin fork                  | **Fork y autoalojamiento**                                  | Build estático de KeepTrack servido desde nuestro repo (modo debris y rupturas) con nuestro caché de CelesTrak                                                        | R2 (F2)               | 6–10  | Medio (build pesado)   |
| [gephi/gephi-lite](https://github.com/gephi/gephi-lite)                                             | GPL-3.0                                                                            | 352 / 2026-09-18 / no       | Solo inspiración                           | **Reutilizar código**                                       | Apariencia por métrica, filtros y layouts sobre graphology/sigma (nuestra misma base), o la app completa autoalojada para "abrir en Gephi Lite"                       | R2 (grafo)            | 3–5   | Bajo                   |
| [calesthio/Crucix](https://github.com/calesthio/Crucix)                                             | AGPL-3.0                                                                           | 11.751 / 2026-05-20 / no    | Solo inspiración (alertas)                 | **Opcional**                                                | Lógica de delta y alertas "qué cambió desde la última sesión"                                                                                                         | R2 (paneles F1–F3)    | 3     | Bajo                   |
| [khoj-ai/khoj](https://github.com/khoj-ai/khoj)                                                     | AGPL-3.0                                                                           | 37.405 / 2026-08-02 / no    | Solo inspiración                           | **Sigue sin usarse** (por alcance)                          | Nada: su RAG duplica el nuestro (Django)                                                                                                                              | —                     | 0     | —                      |
| [CaviraOSS/Akashic](https://github.com/CaviraOSS/Akashic)                                           | AGPL-3.0 (API: NOASSERTION; el LICENSE declara material adaptado de World Monitor) | 128 / 2026-09-13 / no       | Descartado (AGPL + material de WM)         | **Permitido, sin prioridad**                                | Derivado de worldmonitor; ver ese documento antes de tomar nada                                                                                                       | R2                    | —     | —                      |
| [esa/dSGP4](https://github.com/esa/dSGP4)                                                           | GPL-3.0                                                                            | 96 / 2026-08-07 / no        | Descartado                                 | **Sigue descartado** (técnico)                              | Nada: exige PyTorch y satellite.js ya propaga                                                                                                                         | —                     | 0     | —                      |
| SatNOGS Network (GitLab)                                                                            | AGPL-3.0                                                                           | No está en GitHub           | Descartado                                 | **Sigue descartado** (alcance)                              | Nada                                                                                                                                                                  | —                     | 0     | —                      |
| [MISP/MISP](https://github.com/MISP/MISP) / [IntelOwl](https://github.com/intelowlproject/IntelOwl) | AGPL-3.0                                                                           | 6.544 / 4.724, activos      | Descartados                                | **Siguen descartados** (alcance: ciberinteligencia técnica) | Nada                                                                                                                                                                  | —                     | 0     | —                      |

**Siguen sin poder copiarse aunque aceptemos el copyleft.** Son licencias incompatibles o repos sin
licencia:

| Repo                                                                                                                                                     | Licencia                                 | Motivo                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [assafkip/kipi](https://github.com/assafkip/kipi)                                                                                                        | Elastic License 2.0 (LICENSE verificado) | No es de código abierto y es incompatible con la AGPL. Solo sirve como idea: grados de evidencia y analíticas de grafo.                                                                                                                                                          |
| [h9zdev/GeoSentinel](https://github.com/h9zdev/GeoSentinel)                                                                                              | CC BY-NC 4.0 (LICENSE verificado)        | La cláusula no comercial es una restricción adicional, así que es incompatible.                                                                                                                                                                                                  |
| [hipcityreg/situation-monitor](https://github.com/hipcityreg/situation-monitor), [jeyoder/StuffInSpace](https://github.com/jeyoder/StuffInSpace)         | Sin licencia                             | Todos los derechos reservados.                                                                                                                                                                                                                                                   |
| [nasa-gibs/worldview](https://github.com/nasa-gibs/worldview)                                                                                            | NASA Open Source Agreement 1.3           | La FSF la considera incompatible con la GPL. Solo el diseño del timeline.                                                                                                                                                                                                        |
| [open-webui/open-webui](https://github.com/open-webui/open-webui)                                                                                        | BSD-3 + cláusula de marca                | La obligación de conservar su marca es una restricción adicional que la AGPL §7/§10 no admite. No mezclar.                                                                                                                                                                       |
| **[caticoa3/colombia_mapa](https://github.com/caticoa3/colombia_mapa), [santiblanko/colombia.geojson](https://github.com/santiblanko/colombia.geojson)** | **Sin licencia**                         | **Alerta**: `repos_utiles.md` marca colombia_mapa como "Usar", pero publicar el repo no arregla la falta de licencia. Lo seguro es generar el GeoJSON/TopoJSON nosotros desde el **MGN del DANE** (dato público, con cita a la fuente) o usar geoBoundaries (licencia por país). |

No encontramos ningún repo **GPL-2.0-only** ni SSPL entre los candidatos.

---

## 2. Detalle por repo

### Dev-next-gen/orodruin (AGPL-3.0)

- **Estructura**: `frontend/` (Vite + JS: `src/`, `vite.config.js`) y `backend/` (`app/`,
  `requirements.txt`, Python), `docker-compose.yml` y `AUTHORS`. Es muy joven (creado en
  marzo-2026) y su README lo declara "en desarrollo".
- **Qué reutilizamos como código**:
  1. El **contrato y el despachador de comandos de UI** que emite el analista IA (recentrar el
     mapa, activar capas, filtrar eventos, enfocar una entidad). Se porta a nuestras partes
     `data-*` del UI Message Stream: por ejemplo `data-ui-command` → `mapRef.flyTo(...)`.
  2. El **constructor del grafo de co-ocurrencia de actores**: tamaño = grado, grosor =
     frecuencia, y el enlace "clic en actor → sus eventos en el mapa". Se adapta de GDELT a
     nuestro graphml de GLiNER.
- **Dónde encaja**: es el puente entre el chat (Reto 1) y la analítica (Reto 2). El agente de
  visualización gana herramientas de UI además de las plantillas.
- **Esfuerzo**: 6–8 h, porque hay que portar de JS/Vite a nuestros componentes React/TS. Hay que
  leer `frontend/src` para ubicar los archivos exactos (no se hizo aquí).
- **Riesgo**: medio. Tiene poca madurez; conviene copiar funciones sueltas y no depender del repo.
- **Atribución**: conservar sus cabeceras de copyright y agregar su `AUTHORS` a nuestro `NOTICE`.

### BigBodyCobain/Shadowbroker (AGPL-3.0)

- **Estructura**: `frontend/` en Next.js + Tailwind (igual que nuestro stack) y `backend/` en
  Python, más `DATA-ATTRIBUTION.md`, `helm`, `privacy-core` y un "mesh". Es muy grande; **no se
  forkea entero**.
- **Qué reutilizamos**: el **componente de dossier al hacer clic** (clic derecho → ficha
  contextual) y los **tokens y estilos HUD oscuros** (paleta, paneles plegables). En nuestra
  plataforma, el clic en un municipio o departamento abre una ficha con los documentos del corpus,
  las entidades del grafo y la serie temporal.
- **Qué NO tomar**: las capas de cámaras, escáneres de policía, Shodan y la mesh. No encajan con
  el tono institucional de la FAC y traen datos de terceros con otros términos.
- **Encaje**: vista COP `situacion/page.tsx`, `ColombiaMap`, F3.
- **Esfuerzo**: 4–6 h. **Riesgo**: bajo-medio. Solo se copia la UI; nuestros datos son locales.

### AndrewCTF/velocity (AGPL-3.0 + NOTICE)

- **Estructura**: monorepo pnpm con `apps/{api,web,desktop,ml}` y `packages/shared`, y además
  un `NOTICE` y un `DISCLAIMER.md`. El `NOTICE` aclara que la AGPL cubre **solo el código**; los
  datos que consume tienen términos propios.
- **Qué reutilizamos**: (1) la **insignia de procedencia y frescura** (fuentes que coinciden y edad
  del dato) aplicada a cada cita del verificador; (2) el **exportador de informe HTML** en el que
  cada afirmación lleva su fuente. El PPTX queda como opción si sobra tiempo.
- **Encaje**: `EvidencePanel` / `InlineCitation` (Reto 1) y exportar el análisis (Reto 2).
- **Esfuerzo**: 4–6 h. **Riesgo**: bajo. **Obligación**: reproducir su `NOTICE` en el nuestro.

### thkruz/keeptrack.space (AGPL-3.0)

- **Estructura**: TypeScript con pnpm; incluye `tsconfig.library.json`, `public/`, `src/` y un
  `CITATION.cff`. El repo pesa unos 1,1 GB, de modo que el fork tiene que ser **shallow**.
- **Antes**: iframe a `embed.keeptrack.space`, que **dependía de internet en la sede**.
- **Ahora**: fork, build estático y servirlo desde `frontend/public/keeptrack/` (o como ruta
  propia) apuntando a nuestro `tle_cache.json`. Así se elimina la dependencia de red y queda el
  "wow" de F2 (más de 50.000 objetos, rupturas de Cosmos-2251, Fengyun-1C e Iridium-33).
- **Encaje**: panel F2, botón "Abrir en modo debris" desde la tarjeta `data-orbit`. Cesium o
  react-globe.gl siguen siendo el globo propio que maneja el agente.
- **Esfuerzo**: 6–10 h (build de Node, configurar la fuente de TLE y quitar las llamadas
  externas). **Riesgo**: medio. **Plan B**: el iframe en línea de siempre.
- **Atribución**: citar con `CITATION.cff` y dejar visible en el panel "Basado en KeepTrack
  (AGPL-3.0)".

### gephi/gephi-lite (GPL-3.0)

- **Estructura**: monorepo lerna con `packages/{gephi-lite,sdk,broadcast}`. Está construido sobre
  graphology + sigma.js, **la misma base que `@react-sigma/core`**.
- **Qué reutilizamos**: la lógica de **apariencia por métrica** (tamaño y color por centralidad o
  comunidad), los **filtros** y la configuración de layouts (ForceAtlas2). Otra opción es
  autoalojar el build y ofrecer "Abrir en Gephi Lite" con nuestro graphml. Falta verificar el
  mecanismo de carga por URL.
- **Encaje**: `EntityGraph` (Reto 2). Cubre también las analíticas que antes tomábamos de kipi
  (centralidad, comunidades) sin tocar su ELv2.
- **Licencias**: combinar GPL-3.0 con AGPL-3.0 está permitido expresamente (§13 de ambas). Ver §4.
- **Esfuerzo**: 3–5 h. **Riesgo**: bajo.

### calesthio/Crucix (AGPL-3.0), opcional

- **Estructura**: Node (`server.mjs`, `lib/`, `apis/`, `dashboard/`). Último push en mayo-2026.
- **Qué reutilizamos**: el cálculo de **deltas entre ejecuciones** y las alertas, para un
  indicador de "cambios desde la última sesión" en cada panel F1/F2/F3.
- **Esfuerzo**: unas 3 h. **Riesgo**: bajo. Solo si sobra tiempo.

### khoj, Akashic, dSGP4, SatNOGS, MISP, IntelOwl

Ahora están **permitidos por licencia**, pero siguen fuera por motivos técnicos o de alcance:

- **khoj**: duplica nuestro RAG.
- **Akashic**: es un derivado de worldmonitor, así que se remite a ese documento.
- **dSGP4**: exige PyTorch y no hace falta.
- **SatNOGS, MISP e IntelOwl**: tienen otro dominio.

---

## 3. Stack actualizado recomendado

Parte de `arquitectura_empresarial.md` §4.1, que no cambia en su base: Next.js 16 + shadcn + AI
Elements, FastAPI + SSE + LangGraph, FAISS + BGE-M3 + reranker + graphml. Se agregan:

| Capa                        | Antes                                                                  | Ahora (con copyleft)                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Control de UI por el agente | Solo plantillas `data-*`                                               | + `data-ui-command` con el contrato portado de **orodruin** (`fly_to`, `toggle_layer`, `filter_events`, `focus_entity`)             |
| Mapa Colombia (F3)          | react-map-gl + deck.gl                                                 | Igual + **dossier por clic y estilos HUD de Shadowbroker**. GeoJSON **regenerado desde el MGN del DANE** (sin copiar colombia_mapa) |
| Globo LEO (F2)              | Cesium/Resium o react-globe.gl + satellite.js; iframe KeepTrack online | Igual + **KeepTrack autoalojado offline** como "modo debris" (iframe al sitio público como plan B)                                  |
| Grafo de entidades          | @react-sigma/core                                                      | Igual + **módulos de apariencia, filtros y layout de gephi-lite** (centralidad, comunidades)                                        |
| Evidencia y citas (R1)      | InlineCitation + EvidencePanel                                         | + **insignia de procedencia y frescura e informe HTML exportable de velocity**                                                      |
| Paneles F1/F2/F3            | Estáticos                                                              | + (opcional) **deltas y alertas de Crucix**                                                                                         |
| Layout general              | Inspirado en worldmonitor                                              | Según `worldmonitor_datos_agentes.md`                                                                                               |

Orden sugerido por impacto/hora: orodruin (el agente maneja la UI, que es lo que pide el reto),
luego velocity (credibilidad ante el jurado), gephi-lite, Shadowbroker, KeepTrack y por último
Crucix. Total: unas 26–38 h, repartibles entre 3 personas.

---

## 4. Checklist de cumplimiento AGPL-3.0 para nuestro repo

**Compatibilidad entre licencias:**

- [ ] AGPL-3.0 + GPL-3.0: permitido por la §13 de cada una. El conjunto se distribuye bajo AGPL-3.0,
      y las partes GPL-3.0 conservan su licencia.
- [ ] MIT, BSD-2/3, ISC y Apache-2.0: se pueden incorporar. Apache-2.0 es compatible con (A)GPL-**3**
      (no con GPL-2.0-only). Conservar sus avisos y, en Apache, su `NOTICE`.
- [ ] **No mezclar**: GPL-2.0-only, ELv2 (kipi), SSPL, CC BY-NC (GeoSentinel), NOSA (worldview),
      la cláusula de marca de Open WebUI, las carpetas `ee/` de OpenCTI/Onyx/PandasAI, ni repos sin
      licencia (situation-monitor, StuffInSpace, colombia_mapa, colombia.geojson).
- [ ] Cada dependencia nueva de npm o pip: revisar la licencia antes de añadirla. Se puede
      automatizar con `npx license-checker --summary` y `pip-licenses`, y hacer fallar el CI si
      aparece alguna de la lista negra.

**Archivos del repo:**

- [ ] `LICENSE` en la raíz con el texto íntegro de la AGPL-3.0, sin modificar.
- [ ] Aviso en cada archivo fuente propio: `Copyright (C) 2026 <equipo>` +
      `SPDX-License-Identifier: AGPL-3.0-or-later` (o `-only`, a decidir y aplicar de forma uniforme).
- [ ] **No borrar** las cabeceras de copyright de los archivos copiados. Si se modifican, añadir la
      línea "Modificado por <equipo>, 2026" (AGPL §5a).
- [ ] Código de terceros en `third_party/<repo>/` (o con cabecera clara), incluyendo su `LICENSE`.
- [ ] `NOTICE` (o `THIRD_PARTY_NOTICES.md`) con repo, URL, commit copiado, licencia y autores de
      cada origen: orodruin (`AUTHORS`), Shadowbroker, velocity (reproducir su `NOTICE`), KeepTrack
      (`CITATION.cff`), gephi-lite, Crucix y las librerías MIT/Apache.
- [ ] `DATA_SOURCES.md`: los datos **no quedan relicenciados** por la AGPL (lo advierte el NOTICE de
      velocity). Citar DANE MGN, CelesTrak, GDELT y el corpus, cada uno con sus términos.
- [ ] README: indicar la licencia, cómo compilar y ejecutar (las "Fuentes Correspondientes"
      incluyen los scripts de build) y la lista de componentes reutilizados.

**Uso en red (§13):**

- [ ] **Enlace visible en la UI al código fuente** de la versión exacta que se ejecuta: pie de
      página o menú "Acerca de" con "Código fuente (AGPL-3.0)" → `https://github.com/<org>/<repo>/tree/<commit>`.
      El commit se inyecta en el build (`NEXT_PUBLIC_GIT_SHA`).
- [ ] La API FastAPI expone `GET /api/source` (o la cabecera `X-Source-Code`) con la misma URL.
- [ ] El KeepTrack autoalojado y los forks muestran su propio aviso o enlace (el panel lo indica).
- [ ] El repo público se actualiza **antes** de la demo y el código desplegado coincide con el
      commit publicado. Nada de parches locales sin subir.

**Higiene:**

- [ ] No publicar secretos: `.env` ignorado y claves de LLM fuera del repo. La AGPL obliga a
      publicar el código, no las credenciales.
- [ ] Añadir al CI (ya existe el workflow) una verificación de que existen `LICENSE` y `NOTICE`
      y de que no hay licencias prohibidas.
