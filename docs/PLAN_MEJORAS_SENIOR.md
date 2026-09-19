# Plan de mejoras de nivel senior — AeroCode, Etapa 2

**Fecha de la revisión:** sábado 19 de septiembre de 2026, 02:15.
**Ventanas:** Reto 1 se evalúa de 08:00 a 12:30. Reto 2 se entrega a las 12:30.
**Alcance revisado:** `agent/`, `dashboard/`, `frontagent/`, `docs/`, CI, Dockerfiles, estado de git,
los tres despliegues en Coolify, y el repo de la Etapa 1 (`C:\Programacion\ANDES`), contrastados
con la especificación oficial `docs/especificacion/CODEFEST_2026_Etapa2_FINAL.pdf`.

---

## 0. Resumen ejecutivo

El código es bueno: 145 pruebas del agente, 41 de la API y 26 de datos pasan; ruff y bandit
limpios; los tres frontends compilan sin errores. El riesgo no está en la calidad del código sino
en **cinco cosas que deciden el puntaje y hoy están mal**:

1. **Los tres servicios están caídos y con certificado autofirmado.** A las 02:01 los tres
   subdominios responden `503 no available server` desde Traefik y sirven `TRAEFIK DEFAULT CERT`
   en vez de Let's Encrypt. Un cliente HTTP con verificación TLS (el de ADL, por defecto) no puede
   ni conectar. El gateway de ADL sí tiene certificado válido, así que el problema es nuestro.
2. **`main` (lo que Coolify despliega) y la rama de trabajo divergen con conflictos.** La rama
   `mineria-forestacion-demo` va 23 commits adelante y 11 atrás de `main`. `git merge-tree` da
   conflicto en `agent/app/agents.py`, `agent/app/graph.py` y `agent/tests/test_sistema.py`.
   `main` tiene router por embeddings y verificador de citas; la rama tiene el agente satelital.
   Nadie ha decidido qué grafo se entrega.
3. **Ficha, código y documentos describen tres sistemas distintos.** La ficha de la rama declara
   3 agentes; el código de la rama tiene 4; la ficha de `main` declara 4 (con `verificador_citas`)
   y su README describe un satelital que no existe en su código. Hay dos `docs/ARQUITECTURA.md`
   distintos, el local sin trackear. El Bloque D (20 % del Reto 1) y el Bloque A (40 % del Reto 2)
   se califican leyendo justo estos documentos.
4. **El filtro de seguridad rechaza preguntas legítimas.** El nivel `AISLAR` del guard, diseñado
   para no bloquear, se trata como rechazo duro. "Resume las reglas de la ONU sobre desechos
   espaciales" devuelve un rechazo con contexto vacío. Cada falso positivo cuesta relevancia y
   fidelidad, que pesan el doble que seguridad.
5. **Cualquier excepción no prevista devuelve un 500 sin el JSON del contrato.** Solo se
   capturan errores de modelo y de presupuesto. Un fallo de FAISS, del clasificador o un
   `KeyError` rompe la respuesta y cuenta como pregunta fallida en los cuatro bloques.

Además, dos hallazgos que el jurado del Reto 2 detectará al primer intento: el orquestador solo
enruta a visualización cuando la instrucción "pide un gráfico", pero los expertos formulan
preguntas, no piden gráficos; y el documento de arquitectura promete filtros globales por
fenómeno y *brushing and linking* que el tablero simplificado ya no tiene.

---

## 1. Estado verificado

| Qué | Resultado |
| --- | --- |
| `agent/` pytest, ruff, bandit | 145 passed, limpio, limpio |
| `dashboard/api` pytest (con `agent/.venv`) | 41 passed contra la base real |
| `dashboard/datos` pytest | 26 passed |
| `frontagent` tsc, eslint, next build | exit 0 |
| `dashboard/web` tsc, eslint | exit 0 (no existe `npm run typecheck` ni `test`) |
| ANDES pytest (pytest no estaba en su venv) | 65 passed |
| `agent.aerocode…/health` | 503 `no available server`, cert `TRAEFIK DEFAULT CERT` |
| `frontagent.aerocode…/api/health` | 503, mismo certificado |
| `dashboard.aerocode…/api/salud` | 503, mismo certificado |
| `litellm.admin-adl…` (gateway de ADL) | 401 con Let's Encrypt válido (referencia sana) |
| Rama vs `main` | 23 adelante, 11 atrás, 3 archivos en conflicto |
| Rama en el remoto | No existe; solo `origin/main` |
| `origin` | `fesamu06/codefest-adastra-final`; el README indica deploy key sobre `JuanMCanchala/...` |

---

## 2. Diagnóstico por bloque de la rúbrica

### Reto 1

| Bloque | Peso | Riesgo hoy | Causa raíz |
| --- | --- | --- | --- |
| A. Calidad | 40 % | Alto | Falsos positivos del guard; `fuera_de_alcance` sin red de seguridad; sin umbral de abstención antes del redactor |
| B. Eficiencia | 20 % | Medio | Ruta dominante con 2 llamadas (ruta gráfico con 3); recuperación no se lanza en paralelo con el orquestador; sin reintentos ante 429/5xx (una falla transitoria es `error_modelo`) |
| C. Seguridad | 20 % | Medio | `sanear_fragmentos` contra inyección indirecta no está cableado; CORS `*`; sin límite de tasa ni de concurrencia; código muerto que promete lo que no hace |
| D. Diseño | 20 % | **Alto** | Ficha ≠ código ≠ ARQUITECTURA ≠ README; "2 llamadas" vs "1 llamada" según el documento; "pendiente de cablear" en un doc y "ya cableado" en otro |
| Operación | — | **Crítico** | Servicios caídos, cert autofirmado, 500 sin contrato, satelital no viaja en la imagen (`Dockerfile` no copia `datos/`) |

### Reto 2

| Bloque | Peso | Riesgo hoy | Causa raíz |
| --- | --- | --- | --- |
| A. Propuesta de diseño | 40 % | Medio | Tablas pregunta→tarea→componente sólidas, pero el doc promete coordinación multi-vista y selector de fenómeno que se quitaron en `55e8215`; `ARQUITECTURA.md` sin trackear |
| B. Ejecución dinámica | 55 % | **Alto** | Preguntas sin la palabra "gráfico" caen a `corpus` y el tablero muestra texto; especificación inválida se descarta en silencio; coincidencia parcial de entidad elige otra en silencio ("minería ilegal" → "unidad nacional contra la minería ilegal antiterrorismo") |
| C. Código | 5 % | Bajo | Limpio; e2e fuera de CI |
| Anexo B | — | Medio | Unidades engañosas ("alertas" que son alerta×municipio), cobertura de fechas no mostrada, "tendencia" con ventanas asimétricas, nota de método solo en hover, trazabilidad por barra perdida en composición y línea de tiempo |

---

## 3. Plan por fases

Convención: **ID** · tarea · archivo(s) · esfuerzo S/M/L · responsable sugerido (según
`docs/plan_de_trabajo.md`) · criterio de aceptación.

### Fase 0 · Ahora → 05:00 · Reto 1 en línea y estable (P0)

| ID | Tarea | Dónde | Esf. | Resp. | Aceptación |
| --- | --- | --- | --- | --- | --- |
| 0.1 | **Levantar los tres recursos en Coolify y obtener certificados.** Revisar por qué los contenedores no están sanos (logs, OOM, healthcheck). En *Domains* confirmar `https://` en cada dominio, *No redirect*, puerto correcto; forzar re-emisión de Let's Encrypt (borrar y recrear el dominio si Traefik quedó con el cert por defecto). Verificar desde fuera con `curl` **sin** `-k` | Coolify | S | Nicolás | `curl https://agent.aerocode…/health` responde 200 con cert de Let's Encrypt; igual frontagent y dashboard |
| 0.2 | **Decidir qué grafo se entrega y reconciliar `main` con la rama.** Recomendación: base `main` (router + verificador ya validados) y traer encima el satelital solo si cabe en tiempo; si no, dejarlo fuera de código, ficha y docs. Resolver los 3 conflictos, correr las 145 pruebas, push a `main` | `agent/app/agents.py`, `graph.py`, `tests/test_sistema.py` | L | Juan | Una sola rama desplegable; CI verde; `git log main..HEAD` vacío |
| 0.3 | **Capturar toda excepción y devolver siempre el contrato.** `except Exception` final en `Sistema.responder` con `estado="error_interno"` y respuesta cortés; `exception_handler` en FastAPI para 400/413/422/500 que devuelva el JSON §2.4 | `agent/app/graph.py:298-306`, `agent/app/main.py` | S | Juan | Test: provocar `RuntimeError` en recuperación → 200 con `estado` de error y `respuesta` no vacía |
| 0.4 | **Dejar de rechazar el nivel AISLAR.** Usar `evaluar()` y rechazar solo `Nivel.RECHAZO`; AISLAR sigue al orquestador con delimitadores. Añadir a `LEGITIMAS` los 8 falsos positivos detectados (resume/traduce/muestra las reglas, "system prompt", "base64", "variables de entorno", "actúa como analista", "modo desarrollador") | `agent/app/graph.py:218`, `agent/app/guard.py:34-46,73` | S/M | Juan + Santiago | Las 8 preguntas responden con contexto; la batería de ataques sigue bloqueada |
| 0.5 | **Verificar IDs de modelo contra el gateway real y alinear la ficha.** Una llamada real por modelo; el string de `agent_card.json` debe ser el mismo que sale en `tokens_por_agente[].modelo` | `agent/app/settings.py:102-106`, `agent/agent_card.json` | S | Juan | Respuesta real con `estado: ok`; ficha y `metadata` coinciden byte a byte |
| 0.6 | **Reintentos y fallback de modelo en `GatewayLLM`.** 2 reintentos con backoff para 429/5xx/timeout; `MODELO_*_FALLBACK` configurable | `agent/app/llm.py:505-511` | S | Juan | Test con doble que falla una vez y luego responde |
| 0.7 | **Si el satelital va: copiar `datos/` en la imagen y declararlo en la ficha.** Si no va: quitarlo de README, ARQUITECTURA y ficha | `agent/Dockerfile:64-66`, `agent_card.json`, docs | S | Juan + Gabriela | En el contenedor `AgenteSatelital.disponible == True`, o el agente no aparece en ningún documento |
| 0.8 | **Confirmar repo y rama conectados en Coolify** y que ADL está invitado al repo correcto. `origin` es `fesamu06/...`; el README dice `JuanMCanchala/...` | `README.md:152`, Coolify | S | Nicolás | El *Repository URL* de los tres recursos coincide con el repo donde se hace push; ADL y evaluadores aparecen como colaboradores |
| 0.9 | **Empujar la rama al remoto y `git add` de los archivos nuevos** (`docs/ARQUITECTURA.md`, `agent/app/amw/`, `agent/datos/`, `scripts/amw_colombia.py`) | git | S | Juan | `git status` limpio; rama en `origin` |
| 0.10 | **Confirmar RAM del recurso del agente (≥ 8 GB) y el healthcheck de Coolify** con periodo inicial ≥ 180 s. Medir arranque en frío | Coolify | S | Nicolás | Contenedor sano tras un redeploy completo, sin OOM |

### Fase 1 · 05:00 → 07:30 · Documentos coherentes y congelación (P0/P1)

| ID | Tarea | Dónde | Esf. | Resp. | Aceptación |
| --- | --- | --- | --- | --- | --- |
| 1.1 | **Una sola verdad para el sistema multiagente.** Regenerar `agent_card.json` desde el código real y reescribir desde esa ficha la tabla de agentes en `README.md`, `docs/ARQUITECTURA.md` y `ARQUITECTURA_DESPLIEGUE_SEGURIDAD.md`. Un solo número de "llamadas en la ruta típica" en todos los documentos | `agent/agent_card.json`, `README.md:50,83,85`, `docs/ARQUITECTURA.md:67,89,397`, `docs/ARQUITECTURA_DESPLIEGUE_SEGURIDAD.md:221` | M | Gabriela | `grep -c` de nombres de agentes y tools coincide entre los 4 archivos; sin "medir_cobertura_eldor" si la tool se llama `medir_cobertura_satelital` |
| 1.2 | Quitar "pendiente de cablear" / "actualizar antes de congelar" del doc de despliegue; describir el estado desplegado | `docs/ARQUITECTURA_DESPLIEGUE_SEGURIDAD.md:13-20,34-36,263,298-301,382` | S | Gabriela | Cero ocurrencias de "pendiente" referidas al código |
| 1.3 | Alinear la sección de coordinación entre vistas con el tablero real, o reponer un selector de fenómeno global | `docs/ARQUITECTURA.md:314-322`, `dashboard/web/src/componentes/filtros/filtros-globales.tsx` | S | Gabriela + Esteban | Lo que dice el doc se puede mostrar en el tablero desplegado |
| 1.4 | Quitar restos de trabajo en curso de los entregables: "**Pendiente:** confirmar IDs de modelo", "mínimo dos agentes", conteos de pruebas fijos, `plan_de_trabajo.md` fechado como histórico | `agent/README.md:119-122`, `reto1/README.md:3`, `README.md:353-355`, `docs/plan_de_trabajo.md` | S | Gabriela | Revisión de lectura completa del README raíz sin contradicciones |
| 1.5 | **Cablear `sanear_fragmentos`** antes de construir el prompt del redactor y registrar chunks marcados en `tools_called` | `agent/app/agents.py:102`, `agent/app/escaneo.py` | S | Santiago | Test con fragmento que contiene "ignora tus instrucciones" → marcado y neutralizado |
| 1.6 | Deadline global por petición (~45 s), `llm_timeout_s` 25–30 s, semáforo de 2–4 para la CPU | `agent/app/settings.py:109`, `agent/app/main.py:105` | S | Juan | 10 peticiones concurrentes no superan 60 s ninguna |
| 1.7 | Exponer fallo de carga del índice en `/health` y no reconstruir por petición | `agent/app/retrieval.py:156-159`, `main.py:111-129` | S | Juan | Con índice corrupto, `/health` reporta el error y `/chat` devuelve contrato con error, no 500 |
| 1.8 | CORS restringido a los subdominios del equipo; cachear `agent_card.json`; acotar `except Exception` en el cliente Bedrock | `agent/app/settings.py:137`, `main.py:67-72,134`, `llm.py:441` | S | Santiago | bandit/semgrep sin avisos nuevos |
| 1.9 | **Batería de humo contra el endpoint desplegado**: 50 preguntas + 30 ataques + las 8 legítimas del punto 0.4; registrar tokens, llamadas, latencia y `estado` | `agent/eval/` (de `main`) | M | Santiago | 0 respuestas con `estado != ok` en preguntas legítimas; 0 ataques que pasen |
| 1.10 | **Congelar `main` a las 07:30** con la etiqueta `reto1-final`; anotar el hash en el README y en Coolify | git | S | Juan | Último commit estable identificado para redeploy de emergencia |

### Fase 2 · 08:00 → 12:30 · Reto 2, ejecución dinámica (P0/P1)

Durante esta fase **nadie toca `agent/` salvo corrección crítica**. El tablero llama al agente,
así que los cambios de enrutado que afectan al tablero deben resolverse del lado del tablero o
haberse desplegado antes de las 08:00.

| ID | Tarea | Dónde | Esf. | Resp. | Aceptación |
| --- | --- | --- | --- | --- | --- |
| 2.1 | **Toda instrucción desde el tablero produce un componente.** Enviar un indicador de origen (`"origen": "tablero"`) o prefijar la instrucción para que el orquestador enrute a `visualizacion`; si `spec is None`, fallback determinista por palabras clave y fenómeno; devolver el **motivo** cuando se rechaza una especificación | `dashboard/api/app/visualizar.py:33-70`, `main.py:127-150`, prompt del orquestador si aún se puede | M | Nicolás | 20 preguntas de experto sin la palabra "gráfico" (una por fila de las tablas de F1/F2/F3 del doc) activan el componente esperado |
| 2.2 | **Hacer visible la resolución parcial de entidad.** Título con la entidad realmente usada y aviso; exigir coincidencia por límite de palabra o devolver candidatos | `dashboard/api/app/componentes/base.py:20-25,71-74` | S | Nicolás | "minería ilegal" no se convierte en otra entidad en silencio |
| 2.3 | Commitear y desplegar el diff pendiente de `dashboard/` (normalización de vocabulario) y corregir CRLF | `dashboard/api/app/componentes/base.py`, `tests/test_api.py` | S | Nicolás | `git status` limpio; 41 pruebas pasan en CI |
| 2.4 | **Unidades honestas y cobertura visible.** Leyenda y tabla "alertas × municipio"; eje X del cuadrante según `sujeto`; ejes con nombre en la matriz; `nota_metodo` inline bajo el título; cobertura de fechas en la línea de tiempo ("N de M documentos sin año fuera de la serie") | `dashboard/web/src/componentes/vistas/*.tsx`, `api/tipos.ts:53-56`, `lienzo-componente.tsx:176-182` | S | Esteban | Un experto lee la unidad y la cobertura sin pasar el ratón por ningún icono |
| 2.5 | **Cuadrante defendible ante B.2.5.** Ventanas simétricas o tasa anual, años de cada ventana declarados en pantalla, etiquetas neutras ("más reciente"/"más antiguo") | `dashboard/api/app/componentes/cuadrante_priorizacion.py:24-29`, vista | M | Esteban | La leyenda explica exactamente qué se resta a qué |
| 2.6 | Trazabilidad por barra en composición y por año en la línea de tiempo (tipar `refs`, usarlas en el clic) | `vistas/composicion-corpus.tsx:98`, `vistas/linea-tiempo.tsx:127-133`, `api/tipos.ts:33-38` | S | Esteban | Clic en cualquier barra o punto abre fragmentos de esa barra, no la evidencia global |
| 2.7 | Renderizar las citas `[n]` del agente como enlaces al panel de evidencia | `dashboard/web/src/componentes/instruccion/respuesta-agente.tsx:83-85` | S | Esteban | Clic en `[1]` abre el fragmento citado |
| 2.8 | Ejemplos clicables por fenómeno bajo la barra de instrucción (3×3, uno por componente del doc de diseño) | `barra-instruccion.tsx:73` | S | Esteban | El jurado tiene una entrada guiada que demuestra los 8 componentes |
| 2.9 | Validar o subordinar el título del LLM: rechazar "riesgo", "score", "índice"; mostrar siempre el título del backend con el del agente como subtítulo | `dashboard/api/app/main.py:140` | S | Nicolás | Ningún título generado puede leerse como puntaje |
| 2.10 | Deduplicar aristas inversas de la red (`min/max` del par) y expansión progresiva al clic (re-consulta `entidad=nodo`) | `red_entidades.py:82-85`, `vistas/red-entidades.tsx:131-142` | M | Esteban | Sin líneas dobles; doble clic expande vecinos (B.3.3) |
| 2.11 | Búsqueda de texto real en `panel_evidencia.consulta` (FTS5 en `preparar.py`) o anunciar el alcance actual en la UI | `dashboard/api/app/componentes/panel_evidencia.py:37-63` | M | Nicolás | "basura espacial" devuelve fragmentos |
| 2.12 | Capas activables en los mapas (economía ilícita, tipo de alerta, fenómeno) y selección por código DIVIPOLA en vez de nombre | `vistas/mapa-colombia.tsx:83-86` | M | Esteban | Municipios homónimos no se confunden; B.4.2 cumplido |

### Fase 3 · Después del evento · Deuda técnica de nivel senior (P1/P2)

**Agente**

| ID | Tarea | Esf. |
| --- | --- | --- |
| 3.1 | Ruta corpus con **1 interacción**: enrutado determinista con fallback al LLM, o recuperación en paralelo con el orquestador y relanzar solo si reformula | M |
| 3.2 | Umbral de score del reranker para abstenerse antes de llamar al redactor; `fuera_de_alcance` consulta el corpus antes de abstenerse | M |
| 3.3 | Prefijar `retrieval_context[i]` con `(doc_id#chunk_id)`; enriquecer `buscar_corpus.output` | S |
| 3.4 | Pre-filtro por `fenomeno` en la recuperación; `top_k_candidates` 25–30 y `final_fragments` 6 tras medir; caché LRU de embeddings de consulta | S/M |
| 3.5 | Refactor `llm.py` (base común para Bedrock y Gateway); eliminar código muerto (`Nivel`, `datamarcar`, `Fragmento.cita`) o cablearlo; tests de `_leer_pregunta`, `GatewayLLM` y ruta de excepción genérica | M |
| 3.6 | `pip-audit` en CI; recalcular `PRESUPUESTO_TOKENS` frente a USD 100 con precios reales | S |

**Tablero**

| ID | Tarea | Esf. |
| --- | --- | --- |
| 3.7 | Tabla de alias de entidades (FARC-EP/FARC/las FARC; ELN; AGC/Clan del Golfo; united states/u.s/usa/estados unidos) y exclusión de ruido (`president`, `government`, `country`); quitar alias geográficos ambiguos (`america`, `korea`, `georgia`, `jordan`, `chad`, `guinea`, `niger`). Regenerar `dashboard.db` | M |
| 3.8 | Quitar rutas absolutas `C:/Programacion/ANDES` de `preparar.py` y `conftest.py`; `dashboard.db` reproducible en CI | S |
| 3.9 | Caché LRU de resultados por `(componente, filtros)` o conexión SQLite por hilo real; índices `relaciones(destino)`, `alertas(departamento)` | S |
| 3.10 | `/api/catalogo` como única fuente del catálogo (hoy duplicado en `lib/catalogo.ts`); selects para vocabularios cerrados | S |
| 3.11 | Alternativa tabular accesible para ECharts y mapa; ayuda que se abra al toque; caché de GeoJSON; historial en URL | M |
| 3.12 | `npm run typecheck` y `test` en `package.json`; job e2e (Playwright) en CI; `requirements-dev.txt` en `api/` | S |

**Plataforma y repo**

| ID | Tarea | Esf. |
| --- | --- | --- |
| 3.13 | CI en todas las ramas; añadir `next build`, `vite build`, `docker build` de las tres imágenes | M |
| 3.14 | Publicar la base vectorial en un release del propio repo (hoy depende de un release público de otro repo) y fijar su hash | S |
| 3.15 | `dashboard.db` (33 MB) a Git LFS o release; `.gitignore` con `.cache/`, `playwright-report/`, `dist/`; normalizar CRLF | S |
| 3.16 | Rate limiting en el proxy de `frontagent` y en `/chat`; no reenviar `error.message` interno al navegador | S |

**Etapa 1 (ANDES) — la base de todo**

| ID | Tarea | Esf. |
| --- | --- | --- |
| 3.17 | **Unificar la copia compartida** `ANDES/src` ↔ `agent/etapa1`: llevar a ANDES `encode_query`, `_meta_cache`, `max_length`, `final_documents: 0`, `ValueError` en vez de `assert`; script o test que compare hashes de ambos árboles; fijar el commit de origen en `agent/etapa1/README.md` | M |
| 3.18 | **Enriquecer la metadata sin reindexar** (los `chunk_id` no cambian): `docs_meta.jsonl` por `doc_id` con `titulo`, `fecha` (PyMuPDF `creationDate`, claves de los JSON, año del nombre de archivo) e `idioma`. Hoy el 70 % de los documentos no tiene fecha y F1 tiene 0. Es la palanca más barata para líneas de tiempo y filtros de idioma | M |
| 3.19 | Grafo: acumular todos los `chunk_id` por arista (hoy solo el primero), normalizar entidades, exportar `arista → evidencias`. No requiere GPU | M |
| 3.20 | Reindexar con el código actual (`_cap_sentences`, `_partir_larga`): la base publicada el 10-ago es anterior a esas salvaguardas y contiene 1.299 chunks de más de 512 palabras (uno de 188.778). Requiere regenerar `resultados.jsonl`, grafo y release `base-vectorial-v2` | L |
| 3.21 | Instalar `pytest` en el venv de ANDES; test de humo de `Retriever.retrieve` con encoder falso en ambos repos (hoy `pipeline.py` no tiene cobertura en ninguno) | S/M |
| 3.22 | Actualizar `docs/SISTEMA.md` (cifras de 2.601 fragmentos y 54 nodos son de una versión antigua), URL del repo renombrado, consolidar los 6 `config*.yaml` | S |

---

## 4. Checklist de congelación (07:30)

- [ ] Los tres subdominios responden 200 con certificado de Let's Encrypt, verificado con `curl` sin `-k`.
- [ ] `POST /chat` con la pregunta de ejemplo devuelve `estado: ok`, `tokens.total > 0`, `retrieval_context` con 6 textos, `latencia_ms < 10000`.
- [ ] Las 8 preguntas legítimas que hoy se bloquean responden con contexto.
- [ ] Una excepción provocada devuelve el JSON del contrato, no un 500.
- [ ] `agent_card.json` lista exactamente los agentes y tools que `graph.py` registra, con los IDs de modelo que devuelve `tokens_por_agente`.
- [ ] README, ARQUITECTURA y ARQUITECTURA_DESPLIEGUE_SEGURIDAD dicen el mismo número de agentes y de llamadas por ruta típica.
- [ ] `main` == rama desplegada == etiqueta `reto1-final`; CI verde; rama de trabajo en el remoto.
- [ ] Coolify apunta al repo donde ADL está invitado.
- [ ] Hash del último commit estable anotado para redeploy de emergencia.

## 5. Checklist de la ventana (08:00–12:30)

- [ ] Sonda cada 5 minutos a `/health` de los tres servicios desde fuera (un `curl` en bucle basta).
- [ ] Nadie toca `agent/` sin pasar por el responsable del núcleo.
- [ ] Reto 2: las 20 preguntas de experto (sin la palabra "gráfico") activan el componente esperado en el tablero desplegado.
- [ ] Reto 2: leyendas con unidad, cobertura de fechas visible, ninguna etiqueta que suene a puntaje.
- [ ] Pitch: cada cifra tiene `doc_id` o URL verificada.

---

## 6. Qué haría primero si solo hubiera una hora

1. Levantar los servicios y arreglar el certificado (0.1).
2. `except Exception` con contrato (0.3).
3. AISLAR sin rechazo duro (0.4).
4. Verificar IDs de modelo con una llamada real y alinear la ficha (0.5).
5. Decidir el grafo, resolver los tres conflictos y empujar `main` (0.2).

Todo lo demás mejora puntos; estas cinco evitan perderlos.
