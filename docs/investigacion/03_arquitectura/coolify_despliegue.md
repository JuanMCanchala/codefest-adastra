# Despliegue en Coolify: agent, frontagent y dashboard

> Investigación del 18-sep-2026, víspera de la evaluación. Fuentes: documentación oficial
> (https://coolify.io/docs) y código fuente de `coollabsio/coolify` (rama `main`, última
> versión publicada **v4.3.23 del 18-sep-2026**). **No se accedió a ninguna instancia real.**
> La instancia de ADL puede ser de una versión anterior: los nombres de los campos pueden
> variar un poco, pero la lógica descrita (sacada del código) lleva meses estable.
>
> Panel: https://coolify.aerocode.codefest2026.augusta.avaldigitallabs.com

Leyenda: **[DOC]** = documentación oficial, **[CÓDIGO]** = leído en el código fuente de Coolify,
**[INFERENCIA]** = conclusión nuestra, no está verificada en una instancia.

---

## 0. Resumen para quien tenga prisa

| Recurso    | Base directory | Dockerfile location | Ports exposes                            | Dominio                                                                |
| ---------- | -------------- | ------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| agent      | `/agent`       | `/Dockerfile`       | `8000`                                   | `https://agent.aerocode.codefest2026.augusta.avaldigitallabs.com`      |
| frontagent | `/frontagent`  | `/Dockerfile`       | `3000`                                   | `https://frontagent.aerocode.codefest2026.augusta.avaldigitallabs.com` |
| dashboard  | `/dashboard`   | `/Dockerfile`       | el puerto del Dockerfile (p. ej. `8080`) | `https://dashboard.aerocode.codefest2026.augusta.avaldigitallabs.com`  |

- Los tres recursos son **Private Repository (with Deploy Key)**, con la **misma** llave ED25519,
  el mismo repo SSH `git@github.com:fesamu06/codefest-adastra-final.git`, la rama `main` y el build pack **Dockerfile**.
- www redirect: **No redirect** (su valor interno es `both`).
- Healthcheck: el `HEALTHCHECK` del Dockerfile **manda** si el healthcheck del panel está desactivado. En los recursos Dockerfile nuevos viene desactivado por defecto.
- `frontagent → agent`: usar el **dominio público https** (lo más robusto). La red interna también sirve, pero solo con un _Network alias_ fijo (ver §5).
- Lo más peligroso: el **tamaño de la imagen del agent** (disco y tiempo de build) y el **tiempo de espera del healthcheck** en el despliegue (ver §3 y §1.4).

---

## 1. Paso a paso por recurso (monorepo)

### 1.1 Preparación, una sola vez

1. **Keys & Tokens → Private Keys → + Add**. Genera una llave **ED25519** y ponle un nombre claro
   (p. ej. `gh-codefest-adastra-final`). Copia la **llave pública**. [DOC]
   https://coolify.io/docs/applications/ci-cd/github/deploy-key
2. En GitHub, ve a **repo → Settings → Deploy keys → Add deploy key**, pega la llave pública y
   **deja "Allow write access" desmarcado**. [DOC] (ver §2)
3. Crea un **Project** (p. ej. `aerocode`) con su entorno `production`.

### 1.2 Crear cada aplicación

En el proyecto: **+ New → Private Repository (with deploy key)**. [DOC]

1. Elige el **servidor/destino** (red Docker `coolify` por defecto).
2. Elige la **Private Key** creada antes.
3. **Repository URL**: la URL SSH `git@github.com:fesamu06/codefest-adastra-final.git`.
   _No uses la URL HTTPS con este tipo de recurso_ [DOC].
4. **Branch**: `main` (o la rama congelada para la evaluación, ver §7).
5. **Build Pack**: `Dockerfile`.
6. **Base Directory**: `/agent`, `/frontagent` o `/dashboard`.
   - Coolify usa esa carpeta como **contexto de build**: `workdir = <clon>/<base_directory>` y
     construye con `docker build -f {workdir}{dockerfile_location} ... {workdir}` [CÓDIGO,
     `app/Jobs/ApplicationDeploymentJob.php`].
   - **Consecuencia**: el Dockerfile **no puede hacer COPY de archivos que estén fuera** de su carpeta.
     Nuestros Dockerfiles (`agent/`, `frontagent/`) solo copian cosas de su propia carpeta: OK.
     Si el dashboard necesitara archivos del repo raíz, habría que poner Base Directory `/` y
     Dockerfile Location `/dashboard/Dockerfile` (y ajustar las rutas de los COPY).
   - El `.dockerignore` que se aplica es el de la **raíz del contexto** (p. ej. `agent/.dockerignore`).
7. **Dockerfile Location**: `/Dockerfile`. La ruta es **relativa al Base Directory**. El panel lo
   muestra en su ayuda: _"It is calculated together with the Base Directory"_ [CÓDIGO, vista
   `general.blade.php`]. `/agent` + `/Dockerfile` da `/agent/Dockerfile`.
8. **Ports Exposes**: **un solo puerto**: `8000`, `3000` o el del dashboard. Coolify dirige el
   dominio al **primer** puerto de _Ports exposes_ si el dominio no lleva `:puerto` [CÓDIGO,
   `generateLabelsApplication` → `onlyPort = ports[0]`]. El proceso debe escuchar en `0.0.0.0` [DOC].
   Los tres Dockerfiles ya cumplen: uvicorn `--host 0.0.0.0`, Next `HOSTNAME=0.0.0.0`.
9. **No uses "Ports Mappings"** (publicar el puerto en el host). Salta el proxy y **desactiva los
   rolling updates** [DOC + CÓDIGO].
10. Guarda. Coolify genera un dominio aleatorio (sslip o wildcard): **reemplázalo** (ver 1.3).

URLs: https://coolify.io/docs/builds/packs/dockerfile ·
https://coolify.io/docs/applications/build-packs/dockerfile

### 1.3 Dominios (https)

- En **Domains** (en versiones nuevas es una sección aparte con "Domain settings"; en las viejas es
  el campo _Domains_ de _General_) escribe la **URL completa con esquema**:
  `https://agent.aerocode.codefest2026.augusta.avaldigitallabs.com`. [DOC]
  https://coolify.io/docs/knowledge-base/domains
- Con `https://`, Traefik (o Caddy) pide y renueva el certificado de **Let's Encrypt** solo.
  Requisitos: el DNS apunta al servidor y los puertos 80/443 están abiertos. Si el DNS no apunta,
  el panel avisa _"DNS is not pointing to the right IP"_ [CÓDIGO].
  ADL gestiona el DNS: si sale ese aviso, **avisar a ADL**, no seguir a ciegas.
- **www redirect → "No redirect"** (opciones: _No redirect_ / _Redirect to www_ / _Redirect to
  non-www_; en la doc vieja se llama _Direction_ y la opción equivalente es _Allow www & non-www_) [CÓDIGO].
- Opcional: `https://dominio:8000` fuerza el puerto interno. No hace falta si Ports exposes tiene un solo puerto.
- Deja activo _Redirect HTTP to HTTPS_ si aparece (es seguro).
- **Los cambios de dominio o etiquetas solo se aplican al redeployar** (las etiquetas de Traefik se
  generan en el despliegue) [INFERENCIA fuerte, por cómo se generan las etiquetas].
- Hay que dar un tiempo a la emisión del certificado. Si a los 2-3 minutos todavía sale el
  certificado por defecto de Traefik, revisa los logs del proxy (Servers → Proxy → Logs).

### 1.4 Healthcheck: ¿el del Dockerfile o el de Coolify?

Lo que hace el código (`ApplicationDeploymentJob::generate_compose_file` y
`Application::parseHealthcheckFromDockerfile`) [CÓDIGO]:

1. Al crear una app **Dockerfile** con _Private Repository (with deploy key)_, Coolify pone
   `health_check_enabled = false`. **El healthcheck del panel viene desactivado.**
2. En cada despliegue, Coolify **lee el texto del Dockerfile**. Si contiene `HEALTHCHECK` y el
   healthcheck del panel está desactivado, marca `custom_healthcheck_found = true` y **copia**
   `--interval`, `--timeout`, `--start-period` y `--retries` del Dockerfile.
   Log: _"Custom healthcheck found in Dockerfile."_
3. Si hay `HEALTHCHECK` propio, Coolify **no añade el suyo** al compose. Se usa el del Dockerfile. [DOC] lo resume así: _"Coolify detects the image's HEALTHCHECK and uses it instead"_.
4. Si **activas** el healthcheck del panel **antes** de que Coolify detecte el del Dockerfile, gana
   el del panel. Ese se ejecuta _dentro_ del contenedor con `curl` o `wget`, y la imagen tiene que
   traer uno de los dos [DOC]. `node:22-alpine` trae `wget` (busybox) pero no `curl`.
   **Recomendación: deja el del panel desactivado y confía en el `HEALTHCHECK` del Dockerfile** (el agent usa curl, que está instalado; frontagent usa `node -e fetch`).
5. Coolify solo detecta el `HEALTHCHECK` si está **escrito en el Dockerfile del repo**. Uno heredado
   de la imagen base no cuenta.

**Cuánto espera Coolify al contenedor nuevo** [CÓDIGO, `health_check()`]:

```
espera = start_period  +  retries × interval    (más o menos)
```

- Después de `start_period` consulta `docker inspect .State.Health.Status` hasta `retries` veces, esperando `interval` entre una consulta y otra.
- Si llega a `healthy`, sigue adelante y **retira el contenedor viejo**.
- Si llega a `unhealthy`, **o sigue en `starting` al acabar los intentos**, pasa a
  _"New container is not healthy, rolling back to the old container."_: marca el despliegue como
  **fallido**, borra el contenedor nuevo y **deja el viejo** [CÓDIGO, `stop_running_container`].
- Traefik solo envía tráfico a contenedores `healthy` si tienen healthcheck. Si todos están unhealthy, responde `404` / `No available server` [DOC].

**Aplicado a nuestros Dockerfiles:**

- `agent/Dockerfile`: `--interval=30s --start-period=120s --retries=3`, así que Coolify espera **como mucho unos 210 s**.
  Hoy `GET /health` responde 200 **en cuanto arranca uvicorn**, porque la precarga corre en un hilo aparte
  (`agent/app/main.py`: `{"estado":"ok","base_cargada": ...}`). El despliegue **no fallará por
  el healthcheck**, pero Traefik dará tráfico al agente **antes de que termine de cargar BGE-M3 y el
  reranker**, y las primeras preguntas serán lentas.
  - Opción más segura para la evaluación: que el HEALTHCHECK exija la carga, por ejemplo
    `CMD curl -fsS http://127.0.0.1:8000/health | grep -q '"base_cargada":true' || exit 1`
    con `--interval=15s --start-period=180s --retries=20` (espera de unos 480 s). Así el contenedor
    viejo **sigue atendiendo** hasta que el nuevo esté de verdad listo (rolling update).
    _Decisión del equipo: es un cambio en `agent/Dockerfile`, no se ha aplicado._
  - Si se hace, **medir en local** cuánto tarda la carga (`docker run` y ver cuándo `base_cargada` pasa a true) y dejar como mínimo el doble de margen.
- `frontagent/Dockerfile`: `start-period=15s, retries=3, interval=30s` → hasta unos 105 s. Suficiente.
- `dashboard`: **todavía no tiene Dockerfile** en el repo (solo `dashboard/datos/`). Debe incluir un
  `HEALTHCHECK` con `curl`/`wget`/`python -c` que funcione dentro de su imagen.

URLs: https://coolify.io/docs/knowledge-base/health-checks ·
https://coolify.io/docs/knowledge-base/rolling-updates

### 1.5 Rama, auto-deploy y webhook

- **Branch** se fija al crear la app (en versiones nuevas, en la pestaña _Source_).
- Con _deploy key_, **no hay GitHub App**, así que el auto-deploy necesita un **webhook manual** [DOC]:
  1. En Coolify, **Configuration → Webhooks**: escribe un _GitHub Webhook Secret_ largo, **Save** y copia la URL de _Manual Git Webhooks → GitHub_.
  2. En GitHub, **repo → Settings → Webhooks → Add webhook**: Payload URL = esa URL,
     Content type `application/json`, Secret = el mismo, evento _Just the push event_, SSL activado.
  3. En Coolify, **Configuration → Advanced → Auto deploy = "Deploy on push (webhooks)"**.
  4. La rama del push debe coincidir **exactamente** con la de la app.
- **Monorepo**: pon **Watch paths** en cada app (`agent/**`, `frontagent/**`,
  `dashboard/**`). Así un push que solo toca el frontend no reconstruye la imagen de varios GB del agente [DOC, _Configuration → General → Build → Watch paths_].
- **Recomendación para mañana: auto-deploy DESACTIVADO** ("Manual deployments only") para
  las tres apps desde la tarde de hoy. Un push de última hora no debe disparar un rebuild de 30+ min
  del agente durante la ventana de evaluación. Despliega a mano con el botón **Deploy/Redeploy** o por API (§6).

URLs: https://coolify.io/docs/applications/deployments/manual-webhooks ·
https://coolify.io/docs/applications/ci-cd/github/auto-deploy

### 1.6 Variables de entorno

**Configuration → Environment Variables**. Cada variable tiene dos interruptores independientes,
_Build Variable_ (Buildtime) y _Runtime Variable_, y **los dos vienen activados** [DOC].

| App        | Variable                                                                           | Build  | Runtime | Nota                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------- | ------ | ------- | ----------------------------------------------------------------------------------------------------------- |
| agent      | clave del gateway de modelos (p. ej. `BEDROCK_API_KEY` o el nombre que use `app/`) | **NO** | SÍ      | Secreto. Si se inyecta en build, queda como `ARG` y puede verse en la metadata o el historial de la imagen. |
| agent      | otras (región, modelo, etc.)                                                       | no     | sí      |                                                                                                             |
| frontagent | `AGENT_URL`                                                                        | no     | sí      | `lib/servidor.ts` la lee **en tiempo de ejecución** (no es `NEXT_PUBLIC_`), así que basta con Runtime.      |
| frontagent | `DASHBOARD_URL`                                                                    | no     | sí      | Ídem.                                                                                                       |
| dashboard  | URL del agent (si aplica)                                                          | no     | sí      |                                                                                                             |

- **Apaga el interruptor Build de los secretos.** Motivos: (a) no quedan en la imagen; (b) un
  `ARG` que cambia de valor **invalida la caché** de todas las capas que vienen después [INFERENCIA, comportamiento de Docker].
- En _Advanced_: **"Build arguments: Inject build args automatically"** mete todas las variables
  con Build activado como `--build-arg`. Con los secretos en solo Runtime, el problema desaparece.
  Si hiciera falta un secreto en build, usar _Use Docker Build Secrets_ [DOC].
- **"Source commit availability" = "Runtime only (preserves cache)"** (el valor por defecto). Con "Available during build", `SOURCE_COMMIT` cambia en cada commit y **rompe la caché** [DOC/CÓDIGO].
- Si solo cambian variables Runtime, basta con **Restart**. Si cambian variables Build, hace falta un **nuevo deploy** [DOC].
- Coolify inyecta `COOLIFY_FQDN`, `COOLIFY_URL`, `COOLIFY_BRANCH`, `PORT`, `HOST`, etc. [DOC]. Ojo: si
  Coolify define `PORT`, podría chocar con el `PORT=3000` de Next. Hoy coinciden, pero conviene comprobarlo en los logs.

URL: https://coolify.io/docs/knowledge-base/environment-variables

---

## 2. Deploy keys de GitHub

- La doc lo dice explícitamente: se registran en el **repositorio → Settings → Deploy keys**,
  **no en la cuenta**, y hay que **dejar el acceso de escritura desactivado**: _"Coolify only needs to clone and fetch the repository"_ [DOC].
- **Una deploy key sirve para varios recursos del mismo repo.** Las tres apps apuntan al mismo
  repo y pueden elegir la **misma Private Key** en Coolify (se selecciona de la lista del equipo) [DOC/CÓDIGO: `PrivateKey::where('team_id', …)`].
  La restricción es de GitHub: **una misma llave pública no se puede registrar como deploy key en
  dos repos distintos**. Si en algún momento hubiera dos repos, harían falta dos llaves.
- Una llave SSH de la _cuenta_ también funcionaría, pero da acceso a todos los repos del usuario:
  **no hacerlo**, y además la especificación pide deploy key.
- Para comprobarlo, el primer despliegue debe mostrar en el log el clon y el checkout de la rama.
  Un error `Permission denied (publickey)` quiere decir que la llave no está registrada o que se usó la URL HTTPS.
- La llave privada **nunca** sale del panel. No la copies al repo ni a ningún chat.

---

## 3. Riesgos de imágenes grandes (agent de unos 5-9 GB)

### 3.1 Cómo construye Coolify

- La build corre **en el mismo servidor** (salvo que haya un _build server_), dentro de un contenedor auxiliar con acceso al `docker.sock` [CÓDIGO].
- Comando: `DOCKER_BUILDKIT=1 docker build --pull [--no-cache] --network host -f … -t … <contexto>` [CÓDIGO].
  - `--pull` vuelve a comprobar la imagen base en cada build. No invalida la caché si el digest de `python:3.12-slim` no cambió. Si cambió, **se reconstruye todo**.
  - `--no-cache` solo se aplica con **Force deploy** o si _Advanced → Build cache = "Rebuild from scratch every time"_. **Hay que dejarlo en "Use Docker build cache"** [CÓDIGO].
- **Omisión inteligente**: si ya existe localmente una imagen con el **mismo commit SHA** y la
  configuración de build no cambió, Coolify **se salta la build**. Log: _"No build configuration changed &
  image found … Build step skipped."_ [CÓDIGO, `should_skip_build`]. Por eso un **Redeploy sin
  commits nuevos es rápido**, y por eso cualquier commit al monorepo (aunque sea en otra carpeta)
  cambia el SHA y fuerza un `docker build`. Con buena caché de capas ese build tarda poco.
- **Timeout del despliegue**: `dynamic_timeout` del servidor, **3600 s por defecto** [CÓDIGO, migración
  `add_dynamic_timeout_for_deployments`; UI _Server → Advanced_]. Una build en frío del agente
  (torch CPU unos 200 MB + dependencias + modelos BGE-M3 unos 2,3 GB + reranker unos 2,3 GB + base de 507 MB)
  **puede acercarse a 1 h** si la red del servidor es lenta. Solo el administrador del servidor
  (ADL) puede subir ese valor. **Preguntar a ADL** si se ve venir.
- **Builds concurrentes**: 2 por servidor por defecto (`concurrent_builds`) [CÓDIGO]. Si otros
  equipos comparten el servidor, **el despliegue queda en cola**. Lanzarlo con tiempo.

### 3.2 Disco

- Para una imagen de 8 GB hace falta **más o menos el doble** durante la build: capas intermedias,
  caché de BuildKit, la imagen anterior (el rollback la guarda) y el contenedor viejo y el nuevo a la vez en el rolling update [INFERENCIA].
- La limpieza automática (_Servers → Docker Cleanup_) corre por defecto **a diario a medianoche** o
  al **80 %** de disco (si _Force Docker Cleanup_ está apagado). Borra imágenes sin uso y **caché de build** [DOC].
  **Riesgo**: una limpieza nocturna puede **borrar la caché de capas** y obligar a una build en frío por la mañana.
  **No redeployar el agente a primera hora sin necesidad.**
- Si el disco se llena, la build falla con `no space left on device`. Pide a ADL el espacio libre del servidor.
- URL: https://coolify.io/docs/knowledge-base/server/automated-cleanup

### 3.3 Orden de capas (revisión de `agent/Dockerfile`)

El orden actual ya es bueno:

1. `apt-get` (curl, unzip)
2. `pip install torch` (CPU)
3. `COPY requirements.txt` + `pip install -r`
4. `useradd` + mkdir
5. descarga de modelos HF
6. `ARG BASE_VECTORIAL_URL` + descarga de la base
7. `COPY app`, `etapa1`, `agent_card.json`, `config.retrieval.yaml` ← **lo único que cambia con el código**

Así, un commit que solo toca `agent/app/` **reutiliza las capas 1-6** y reconstruye en segundos.
Riesgos que conviene vigilar:

- **Tocar `requirements.txt` invalida desde la capa 3** y vuelve a descargar los modelos (5 GB).
  Congelar `requirements.txt` desde hoy. Si hay que añadir una dependencia, ponerla en un `RUN pip install X` **después** de la descarga de modelos, de forma temporal.
- Poner la descarga de modelos (capa 5) **antes** de `COPY requirements.txt` los desacoplaría del todo
  (necesita `huggingface_hub`, que se podría instalar sola antes). Es opcional, y hoy supone un rebuild completo: **no hacerlo la noche antes**.
- El `ARG BASE_VECTORIAL_URL` está justo antes de su `RUN`: bien. No pasarlo como variable de
  Coolify con Build activado, porque un valor distinto invalida desde ahí.
- `.dockerignore` del agent excluye `.venv/`, `tests/` y cachés: bien (el contexto es pequeño).
- Coolify trabaja con capas grandes, así que el **pull** del rollback o del _build server_ también es lento.

### 3.4 Alternativa: construir fuera (GitHub Actions → GHCR) y desplegar "Docker Image"

- Coolify lo soporta: recurso **Docker Image** con referencia `ghcr.io/<owner>/agent:<tag>`, y
  despliegue desde Actions con `curl` al webhook de despliegue y un token con permiso `deploy` [DOC]
  https://coolify.io/docs/applications/sources/github/actions ·
  https://coolify.io/docs/knowledge-base/docker/registry
- **Con una imagen privada en GHCR hace falta `docker login ghcr.io` por SSH en el servidor**, con el
  usuario que usa Coolify [DOC]. **No tenemos acceso SSH** al servidor de ADL, así que solo sería
  viable con una **imagen pública**. Eso publicaría el código y los artefactos del agente (no las
  claves, que van en variables Runtime).
- **Riesgo de especificación**: la especificación exige _Private Git Repository (with Deploy Key)_ +
  _Dockerfile_. Un recurso _Docker Image_ **no cumple la letra del requisito** y podría penalizarse.
  **Solo como plan C de emergencia**, y avisando antes a los jueces u organizadores.
- Una variante que **sí cumple**: dejar el recurso como Dockerfile desde repo privado y activar
  _Configuration → General → Docker Registry_ (Coolify **empuja** la imagen tras construirla). No reduce el tiempo de build. Solo sirve para tener una copia.
- **Plan B que cumple y reduce el tiempo de build**: un Dockerfile `FROM ghcr.io/<owner>/agent-base:v1`
  (imagen **pública** con torch, modelos y base, sin secretos, construida en Actions) y encima solo
  `COPY app …`. Sigue siendo "Dockerfile desde repo privado", y el `docker build` en Coolify pasa a ser
  un `pull` más un par de capas. Hay que valorarlo: la imagen base pública expone los modelos (públicos)
  y la base vectorial (ya está en un release público), no código sensible.

---

## 4. Límites de recursos por contenedor

- **Configuration → Resource Limits** [DOC] https://coolify.io/docs/applications/configuration/resource-limits

| Campo                | Formato               | Por defecto      | Mapea a (compose) [CÓDIGO] |
| -------------------- | --------------------- | ---------------- | -------------------------- |
| Number of CPUs       | `2`, `0.5`            | `0` = sin límite | `cpus`                     |
| CPU sets to use      | `0-2`, `0,1,3`        | todos            | `cpuset`                   |
| CPU Weight           | entero ≥0             | `1024`           | `cpu_shares`               |
| Soft Memory Limit    | `0` o `512m`, `4g`    | `0`              | `mem_reservation`          |
| Swappiness           | 0-100                 | `60`             | `mem_swappiness`           |
| Maximum Memory Limit | `6g`                  | `0`              | `mem_limit`                |
| Maximum Swap Limit   | `8g` (memoria + swap) | `0`              | `memswap_limit`            |

- Los cambios exigen **redeploy o restart** para recrear el contenedor [DOC].
- `--memory`/`--cpus` **no** se ponen en _Custom Docker Options_: Coolify las ignora y hay que usar Resource Limits [DOC].
- **Cómo ver el uso**: la pestaña **Metrics** de la app (CPU y memoria) requiere **Sentinel** activado en el
  servidor (_Server → Configuration → Metrics → Enable Metrics_), algo que solo puede hacer ADL [DOC]
  https://coolify.io/docs/knowledge-base/server/sentinel. Si no está, mirar los **Logs** para ver OOM o reinicios.
- **Memoria esperable del agente** [INFERENCIA, basada en el tamaño de los pesos]:
  - BGE-M3 (XLM-R large, unos 568 M parámetros, fp32, unos 2,2 GB) → **unos 2,3-2,8 GB** en RAM con PyTorch CPU.
  - bge-reranker-v2-m3 (misma arquitectura, unos 2,2 GB) → **unos 2,3-2,8 GB**.
  - Base vectorial en memoria (según formato, unos 0,5-1 GB) + Python/torch/uvicorn (unos 0,5 GB) +
    activaciones de inferencia en lote (unos 0,3-1 GB).
  - **Total: unos 5-7 GB en pico.** Un límite de 6 GB queda **justo** y puede provocar un OOM kill (exit 137) durante la precarga o con lotes largos.
- **Recomendación**: **no fijar Maximum Memory Limit** (dejar 0) salvo que ADL lo exija. Si lo
  exigen, **8g** para el agent, `512m`-`1g` para frontagent y `512m`-`1g` para el dashboard.
  CPU: no limitar el agente. Un límite bajo **alarga la carga y hace fallar el healthcheck** [DOC].
  Averiguar **cuánta RAM tiene el servidor** y cuántos equipos lo comparten: si son 8 GB compartidos, el agente no cabe tal como está.
- Posible reducción: cargar los modelos en **fp16/bf16** no ayuda en CPU. Usar el reranker solo en el
  top-k, o cargar solo un modelo, sí. Medir con `docker stats` en local **con los mismos límites**
  (`docker run --memory=6g --cpus=2 …`).

---

## 5. Comunicación entre contenedores

Hechos [CÓDIGO + DOC]:

- Todas las apps de un servidor van a la red Docker **`coolify`** (destino por defecto), así que se ven entre sí.
  _Estar en el mismo Project no crea conectividad_: la da la red [DOC].
- El nombre del contenedor es **`<uuid>-<HHMMSSµs>`** y **cambia en cada despliegue**
  (`generateApplicationContainerName`). El alias de red por defecto es ese nombre, así que **no sirve como hostname fijo**.
- Opciones para un hostname interno **fijo**:
  1. **Network aliases** (_Configuration → General → Networking → Network aliases_, p. ej. `agent`).
     Se suma a los alias del contenedor y **no desactiva los rolling updates** [CÓDIGO: `custom_network_aliases`].
     El frontagent usaría `AGENT_URL=http://agent:8000`. Ojo: el alias es global en la red `coolify`
     del servidor. Si otro equipo usa también `agent`, **DNS round-robin mezclaría contenedores de equipos distintos**.
     Usar un alias único, p. ej. `aerocode-agent`.
  2. _Custom container name_ o _Consistent container names_: **desactivan los rolling updates**.
     No recomendado.
  3. La pantalla _Internal access_ (versiones nuevas) muestra el _Internal hostname_ actual, la red y los alias.
- **Dominio público https** (`AGENT_URL=https://agent.aerocode.codefest2026.augusta.avaldigitallabs.com`):
  pasa por Traefik y TLS (unos milisegundos más). Es **independiente** de alias y nombres, y es lo que
  probarán los jueces. Solo depende del DNS y el certificado, que de todas formas tienen que funcionar.

**Recomendación**: `AGENT_URL` = **dominio público https**. Es lo más robusto y fácil de depurar. El alias
interno queda como mejora opcional (`http://aerocode-agent:8000`, **http**, puerto interno). Nunca `localhost`,
porque dentro del contenedor del frontagent `localhost` es el propio frontagent. Ojo: el valor por defecto
de `frontagent/lib/servidor.ts` es `http://localhost:8000`, **así que olvidar `AGENT_URL` rompe el chat**.

- La llamada frontagent → agent se hace **en el servidor** (route handler `app/api/chat`), no
  desde el navegador, así que no hay problema de CORS. Revisar el **timeout** de ese fetch: la primera
  pregunta con el modelo recién cargado puede tardar decenas de segundos. Traefik no corta por defecto en ese rango.

URL: https://coolify.io/docs/core/networking-in-coolify

---

## 6. API de Coolify (/api/v1)

**Activación y token** [DOC] https://coolify.io/docs/core/security/credentials/api-tokens

1. En self-hosted, un admin tiene que activar **Settings → Configuration → Advanced → API Access** (y
   opcionalmente _Allowed IPs_). **Depende de ADL**: si no está activada, la API responde error y solo queda el panel.
2. **Keys & Tokens → API Tokens**: descripción, expiración y permisos. Se muestra **una sola vez**.
   Los tokens son **por equipo**.
   - `read` (valores sensibles ocultos), `read:sensitive` (**incluye logs**), `write`, `deploy`, `root`.
   - Para automatizar: `read` + `read:sensitive` + `deploy`. **No** `root`.
3. Cabecera: `Authorization: Bearer <id>|<secreto>` (el string completo) [DOC].

**Endpoints útiles** [CÓDIGO: `routes/api.php`, `openapi.yaml`]:

```bash
C=https://coolify.aerocode.codefest2026.augusta.avaldigitallabs.com/api/v1
H="Authorization: Bearer $COOLIFY_TOKEN"

curl -s -H "$H" $C/version                          # prueba del token
curl -s -H "$H" $C/applications                     # lista apps → UUIDs
curl -s -H "$H" $C/applications/<uuid>              # config y estado (status)

# Desplegar/redeployar (una o varias, separadas por comas). force=true = sin caché ¡NO con el agent!
curl -s -H "$H" "$C/deploy?uuid=<uuid_agent>,<uuid_front>&force=false"
#  → {"deployments":[{"deployment_uuid":"…", …}]}

# Ciclo de vida
curl -s -X POST -H "$H" "$C/applications/<uuid>/start?force=false&instant_deploy=false"   # dispara deploy
curl -s -X POST -H "$H" $C/applications/<uuid>/restart
curl -s -X POST -H "$H" $C/applications/<uuid>/stop

# Despliegues y sus logs de build
curl -s -H "$H" $C/deployments                         # en curso
curl -s -H "$H" $C/deployments/applications/<uuid>     # historial de la app
curl -s -H "$H" $C/deployments/<deployment_uuid>       # estado + campo "logs" (JSON)
curl -s -X POST -H "$H" $C/deployments/<deployment_uuid>/cancel

# Logs de runtime del contenedor (requiere read:sensitive)
curl -s -H "$H" "$C/applications/<uuid>/logs?lines=200&show_timestamps=true"

# Variables de entorno
curl -s -H "$H" $C/applications/<uuid>/envs
curl -s -X PATCH -H "$H" -H 'Content-Type: application/json' \
  -d '{"key":"AGENT_URL","value":"https://agent.aerocode…","is_literal":true}' \
  $C/applications/<uuid>/envs
```

- `GET /deploy` también funciona como "webhook de despliegue" autenticado para GitHub Actions [DOC].
- `GET /applications/{uuid}/rollback-images`: imágenes disponibles para rollback [CÓDIGO]. El rollback se hace desde la pestaña **Rollback** del panel [DOC].
- Referencia: https://coolify.io/docs/api-reference/authorization · https://coolify.io/docs/api/overview
- **Nunca** guardar el token en el repo: usar una variable de entorno local o un secreto de Actions.

---

## 7. Checklist antes de la ventana de evaluación (08:00) y lectura de logs

### 7.1 Hoy (18-sep), por la tarde y la noche

- [ ] Comprobar el acceso al panel de ADL y qué permisos tiene nuestro equipo (¿podemos ver _Servers_? ¿API activada?).
- [ ] Preguntar a ADL: **RAM, CPU y disco libre** del servidor, **cuántos equipos comparten el servidor**,
      `dynamic_timeout` (por defecto 3600 s), `concurrent_builds` (2) y la hora de la limpieza de Docker.
- [ ] Llave ED25519 creada en _Keys & Tokens → Private Keys_ y registrada como **deploy key read-only** en el repo.
- [ ] Tres apps creadas con **Private Repository (with deploy key)**, **Dockerfile**, Base directory y Dockerfile location según la tabla del §0.
- [ ] Ports exposes: 8000 / 3000 / puerto del dashboard. **Sin** Ports mappings.
- [ ] Dominios `https://…` y **www redirect = No redirect**. DNS verificado (sin aviso rojo).
- [ ] Variables: secretos solo **Runtime**, `AGENT_URL` y `DASHBOARD_URL` en frontagent.
- [ ] _Advanced_: Build cache = **Use Docker build cache**, Source commit = **Runtime only**,
      Auto deploy = **Manual deployments only**, Container naming = **Generated name**.
- [ ] **Dashboard**: tiene que existir `dashboard/Dockerfile` con `HEALTHCHECK` y un solo puerto (hoy no está en el repo).
- [ ] Primer deploy del **agent cuanto antes** (build en frío larga). Luego frontagent y dashboard.
- [ ] Un segundo **Redeploy** del agent sin cambios, para comprobar _"Build step skipped"_ o que la caché funciona (build en minutos).
- [ ] Healthchecks en `healthy` (ver _Logs_ del despliegue: "New container is healthy.").
- [ ] Pruebas externas (desde fuera, no desde el panel):
  ```bash
  curl -fsS https://agent.aerocode.codefest2026.augusta.avaldigitallabs.com/health
  curl -fsS -X POST https://agent.aerocode.codefest2026.augusta.avaldigitallabs.com/chat \
       -H 'Content-Type: application/json' -d '{…payload del Anexo A.4…}'
  curl -fsSI https://frontagent.aerocode.codefest2026.augusta.avaldigitallabs.com/
  curl -fsS https://frontagent.aerocode.codefest2026.augusta.avaldigitallabs.com/api/health
  curl -fsSI https://dashboard.aerocode.codefest2026.augusta.avaldigitallabs.com/
  ```
  Verificar certificado válido (no el "TRAEFIK DEFAULT CERT"), `base_cargada: true` y una
  pregunta completa de extremo a extremo desde el frontagent.
- [ ] Anotar el **commit SHA desplegado** de cada app y **congelar `main`** (o crear la rama `evaluacion`
      y apuntar las apps a ella). A partir de ahí, nada de pushes que obliguen a redeployar.
- [ ] Anotar los UUIDs de las apps (para la API) y guardar el token fuera del repo.

### 7.2 Mañana (19-sep), de 07:00 a 07:45

- [ ] **No redeployar** si todo está verde (la limpieza nocturna pudo borrar la caché).
- [ ] Repetir los `curl` del §7.1 y una pregunta real para **calentar** el agente.
- [ ] Revisar los logs de runtime del agent: sin OOM, sin reinicios. En _Metrics_, memoria estable.
- [ ] Si algo falla: **Restart** (no rebuild). Si una versión nueva rompe algo: **Rollback** a la imagen anterior.

### 7.3 Cómo leer los logs

- **Logs de build y despliegue**: app → **Deployments** → clic en el despliegue. Se ve el clon (rama y
  commit), la salida de `docker build`, el compose generado, el rolling update y el healthcheck [DOC].
  El interruptor **Show debug logs** muestra los comandos ocultos. Mensajes clave [CÓDIGO]:
  - `Image not found (…). Building new image.` o `…Build step skipped.` → si hubo build o no.
  - `Custom healthcheck found in Dockerfile.` → se está usando nuestro `HEALTHCHECK`.
  - `Waiting for the start period (N seconds)…` y `Attempt i of N | Healthcheck status: "starting"` → progreso.
  - `New container is healthy.` + `Rolling update completed.` → OK.
  - `New container is not healthy, rolling back to the old container.` → falló y **sigue la versión anterior**.
  - `Rolling update is not supported` → hay ports mapping o nombre fijo: revisar la configuración.
  - `Permission denied (publickey)` → deploy key o URL mal configuradas.
  - `no space left on device` → disco: hablar con ADL.
  - Timeout del despliegue a los 3600 s → build demasiado lenta: plan B (§3.4) o pedir a ADL que suba el timeout.
- **Logs de runtime**: app → **Logs** (stdout/stderr del contenedor). Vía API:
  `GET /applications/{uuid}/logs?lines=…`.
  Un OOM se ve como reinicios con exit code **137** y el contenedor reapareciendo.
- **Terminal**: app → **Terminal** (si ADL lo permite) para hacer `curl localhost:8000/health` dentro del contenedor.
- **Proxy**: _Servers → Proxy → Logs_ (errores de certificados o enrutamiento). Suele necesitar permisos de admin.

---

## Fuentes

- Deploy key: https://coolify.io/docs/applications/ci-cd/github/deploy-key
- Dockerfile build pack: https://coolify.io/docs/builds/packs/dockerfile
- Health checks: https://coolify.io/docs/knowledge-base/health-checks
- Rolling updates: https://coolify.io/docs/knowledge-base/rolling-updates
- Dominios: https://coolify.io/docs/knowledge-base/domains
- Variables de entorno: https://coolify.io/docs/knowledge-base/environment-variables
- Webhooks manuales: https://coolify.io/docs/applications/deployments/manual-webhooks
- GitHub auto deploy: https://coolify.io/docs/applications/ci-cd/github/auto-deploy
- Resource limits: https://coolify.io/docs/applications/configuration/resource-limits
- Custom Docker options: https://coolify.io/docs/knowledge-base/docker/custom-commands
- Networking: https://coolify.io/docs/core/networking-in-coolify
- Registros y GHCR: https://coolify.io/docs/knowledge-base/docker/registry
- GitHub Actions: https://coolify.io/docs/applications/sources/github/actions
- Limpieza automática: https://coolify.io/docs/knowledge-base/server/automated-cleanup
- Sentinel y métricas: https://coolify.io/docs/knowledge-base/server/sentinel
- API tokens: https://coolify.io/docs/core/security/credentials/api-tokens
- API authorization: https://coolify.io/docs/api-reference/authorization
- Despliegues: https://coolify.io/docs/applications/deployments/overview
- Código fuente (rama `main`, v4.3.23):
  - https://github.com/coollabsio/coolify/blob/main/app/Jobs/ApplicationDeploymentJob.php (build, healthcheck, rolling update, skip build)
  - https://github.com/coollabsio/coolify/blob/main/app/Models/Application.php (`parseHealthcheckFromDockerfile`)
  - https://github.com/coollabsio/coolify/blob/main/app/Livewire/Project/New/GithubPrivateRepositoryDeployKey.php (healthcheck desactivado por defecto)
  - https://github.com/coollabsio/coolify/blob/main/bootstrap/helpers/docker.php (nombre de contenedor, puerto del proxy)
  - https://github.com/coollabsio/coolify/blob/main/routes/api.php y `openapi.yaml` (API)
  - Migraciones `add_dynamic_timeout_for_deployments` (3600 s) y `add_concurrent_number_of_builds_per_server` (2)
