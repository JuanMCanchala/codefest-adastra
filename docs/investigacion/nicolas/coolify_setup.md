# Coolify local — listo para el 18 de septiembre

## Qué es Coolify

Plataforma open source self-hosted (alternativa a Heroku/Vercel) para desplegar y administrar
apps, bases de datos y servicios sobre servidores propios. Funciona como panel de control que
se conecta por SSH a servidores (locales o remotos), maneja los despliegues con Docker, dominios,
HTTPS, etc. Solo corre sobre Linux — no existe versión nativa para Windows ni funciona directo
sobre el motor de Docker Desktop.

## Cómo se instaló en esta máquina

1. **Distro Ubuntu 26.04 LTS en WSL2** (nueva, separada de la `docker-desktop` que ya existía):
   ```
   wsl --install -d Ubuntu --no-launch
   ```
2. **Docker Engine nativo** dentro de esa distro (no Docker Desktop — Coolify necesita control
   total del daemon, socket, systemd, etc.):
   ```
   curl -fsSL https://get.docker.com | sh
   ```
   Quedó corriendo como servicio systemd (`docker.service`, enabled).
3. **Coolify 4.3.21** con el instalador oficial:
   ```
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
   Levantó 5 contenedores: `coolify` (app), `coolify-proxy` (Traefik), `coolify-db` (Postgres),
   `coolify-redis`, `coolify-realtime`. Todos con política de reinicio automático.

Todo el proceso vive dentro de la distro Ubuntu de WSL, aislado de Docker Desktop y de este repo.

## Cómo arrancarlo mañana

WSL2 no arranca solo con Windows. Antes de usar Coolify:

```powershell
wsl -d Ubuntu -u root -- bash -c "docker ps"
```

Con eso alcanza: al arrancar la distro, systemd levanta `docker.service`, y Docker reinicia solo
los 5 contenedores de Coolify (política `restart: always`). Esperar ~15-20 segundos a que todos
digan `healthy`:

```powershell
wsl -d Ubuntu -u root -- bash -c "docker ps --format 'table {{.Names}}\t{{.Status}}'"
```

## Acceso

Dashboard: **http://localhost:8000** (WSL2 reenvía el puerto solo al host Windows).

Primer ingreso: pantalla "Create the root account for this instance" — pide Name, Email,
Password. **Esa cuenta hay que crearla vos manualmente** desde el navegador (no la creé yo:
regla de no entrar contraseñas ni crear cuentas, aunque sea instancia local propia). Usá un
email/clave que no te importe perder — es una instancia local descartable, no hace falta que sea
real.

## Próximos pasos para mañana (según el correo de la organización)

1. Entrar a http://localhost:8000 y crear la cuenta root.
2. Guía oficial de introducción: https://coolify.io/docs/get-started/introduction
3. Desde el dashboard: crear un **Server** (ya viene uno local preconfigurado, "localhost"),
   crear un **Project**, y desplegar un **servicio de ejemplo** (Coolify trae one-click services
   tipo PostgreSQL, Redis, N8N, etc., o se puede apuntar a un repo Git/Dockerfile propio).
4. Verificar que el servicio desplegado responde en el endpoint que Coolify expone
   (dominio local tipo `*.sslip.io` o puerto mapeado, visible en la vista del recurso).
5. Repetir con un servicio que se parezca a lo que se vaya a necesitar en el reto presencial.

## Notas técnicas

- Requisitos mínimos de Coolify: 2 CPU, 2 GB RAM, 10 GB disco — cumplidos.
- Puertos usados por Coolify: 80, 443, 8000 (dashboard), 8080, 6001-6002 (realtime).
- Backup recomendado por el propio instalador: `/data/coolify/source/.env` dentro de la
  distro Ubuntu (claves de la instancia). No se hizo backup externo todavía.
- Si algo se rompe y hay que reinstalar limpio: `wsl --unregister Ubuntu` y repetir los 3 pasos
  de instalación de arriba.
