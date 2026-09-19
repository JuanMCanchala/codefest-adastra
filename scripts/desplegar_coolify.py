"""Crea y despliega en Coolify las tres aplicaciones del reto (Anexo A.4 y A.6).

Coolify se configura a mano desde la interfaz sin problema —el README describe pantalla
por pantalla lo mismo que hace este script—, pero a mano son tres aplicaciones con
dominio, puerto, directorio base y una docena de variables de entorno: suficiente
superficie para una errata que solo aparece cuando el jurado abre la consola. Este script
lo deja escrito una vez y lo vuelve repetible.

Es **idempotente**: si la aplicación ya existe, no la duplica; actualiza su configuración
y sus variables. Se puede correr las veces que haga falta.

Uso:

    export COOLIFY_URL=https://coolify.aerocode.codefest2026.augusta.avaldigitallabs.com
    export COOLIFY_TOKEN=...          # token de API con permiso de escritura
    export LLM_API_KEY=sk-...         # clave del gateway de ADL (solo se envía, no se guarda)
    python scripts/desplegar_coolify.py --rama main

    python scripts/desplegar_coolify.py --rama main --desplegar   # además, dispara la construcción

Ninguna credencial se escribe en el repositorio: las tres llegan por el entorno del
proceso y viajan a las variables de Coolify, que es donde deben vivir.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any

DOMINIO = "aerocode.codefest2026.augusta.avaldigitallabs.com"
REPOSITORIO = "git@github.com:fesamu06/codefest-adastra-final.git"
PROYECTO = "aerocode"
ENTORNO = "production"

URL_AGENTE = f"https://agent.{DOMINIO}"
URL_TABLERO = f"https://dashboard.{DOMINIO}"
URL_CONSOLA = f"https://frontagent.{DOMINIO}"

# El orden importa: el agente se construye primero porque su imagen descarga los modelos
# y la base vectorial (507 MB comprimidos) y es, con diferencia, la más lenta.
APLICACIONES: list[dict[str, Any]] = [
    {
        "name": "agent",
        "base_directory": "/agent",
        "ports_exposes": "8000",
        "domains": URL_AGENTE,
        # La imagen tarda en cargar modelos: el healthcheck del Dockerfile ya espera 180 s.
        "variables": {
            # LLM_API_KEY se añade aparte, desde el entorno: nunca literal en este archivo.
            "LLM_BASE_URL": "https://litellm.admin-adl.codefest2026.augusta.avaldigitallabs.com/v1",
            "CORS_ORIGINS": f"{URL_CONSOLA},{URL_TABLERO}",
        },
    },
    {
        "name": "dashboard",
        "base_directory": "/dashboard",
        "ports_exposes": "8080",
        "domains": URL_TABLERO,
        "variables": {
            "AGENT_URL": URL_AGENTE,
            "CONSOLA_URL": URL_CONSOLA,
        },
    },
    {
        "name": "frontagent",
        "base_directory": "/frontagent",
        "ports_exposes": "3000",
        "domains": URL_CONSOLA,
        "variables": {
            "AGENT_URL": URL_AGENTE,
            "DASHBOARD_URL": URL_TABLERO,
            # La consola que revisa el jurado va limpia; el equipo la enciende con 1.
            "VISTA_TECNICA": "0",
        },
    },
]


class Coolify:
    """Cliente mínimo de la API v1. Solo urllib: el script no añade dependencias."""

    def __init__(self, base: str, token: str) -> None:
        self.base = base.rstrip("/")
        self.token = token

    def _pedir(self, metodo: str, ruta: str, cuerpo: dict | None = None) -> Any:
        datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
        peticion = urllib.request.Request(
            f"{self.base}/api/v1{ruta}",
            data=datos,
            method=metodo,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Accept": "application/json",
                **({"Content-Type": "application/json"} if datos else {}),
            },
        )
        try:
            with urllib.request.urlopen(peticion, timeout=120) as respuesta:
                texto = respuesta.read().decode()
        except urllib.error.HTTPError as error:
            detalle = error.read().decode()
            raise SystemExit(f"{metodo} {ruta} → HTTP {error.code}: {detalle}") from error
        return json.loads(texto) if texto.strip() else None

    def get(self, ruta: str) -> Any:
        return self._pedir("GET", ruta)

    def post(self, ruta: str, cuerpo: dict) -> Any:
        return self._pedir("POST", ruta, cuerpo)

    def patch(self, ruta: str, cuerpo: dict) -> Any:
        return self._pedir("PATCH", ruta, cuerpo)


def uuid_servidor(api: Coolify) -> str:
    servidores = api.get("/servers")
    usables = [s for s in servidores if s.get("is_usable") and s.get("is_reachable")]
    if not usables:
        raise SystemExit("ningún servidor de Coolify está accesible")
    return usables[0]["uuid"]


def uuid_proyecto(api: Coolify) -> str:
    for proyecto in api.get("/projects"):
        if proyecto.get("name") == PROYECTO:
            return proyecto["uuid"]
    creado = api.post("/projects", {"name": PROYECTO, "description": "CODEFEST AD ASTRA 2026"})
    print(f"proyecto «{PROYECTO}» creado")
    return creado["uuid"]


def uuid_llave(api: Coolify, nombre: str) -> str:
    """Localiza la llave de despliegue; no la crea, porque su pública ya está en GitHub."""
    llaves = api.get("/security/keys")
    for llave in llaves:
        if llave.get("name") == nombre:
            return llave["uuid"]
    disponibles = ", ".join(sorted(str(k.get("name")) for k in llaves)) or "ninguna"
    raise SystemExit(
        f"no existe la llave «{nombre}» en Coolify (hay: {disponibles}).\n"
        "Créala en Keys & Tokens → Private Keys y registra su pública como deploy key\n"
        "del repositorio en GitHub, o pasa --llave con el nombre correcto."
    )


def aplicacion_existente(api: Coolify, nombre: str) -> dict | None:
    for app in api.get("/applications"):
        if app.get("name") == nombre:
            return app
    return None


def sincronizar_variables(api: Coolify, uuid: str, variables: dict[str, str]) -> None:
    """Deja las variables como dicen `variables`, todas de ejecución y no de construcción.

    `is_buildtime: False` es deliberado y no es el valor por omisión: la API 4.3.23 crea
    las variables como de construcción si no se dice lo contrario, y una variable de
    construcción queda registrada en las capas de la imagen, así que filtraría la clave
    del gateway a cualquiera que haga `docker history`.
    """
    actuales = {v["key"]: v for v in (api.get(f"/applications/{uuid}/envs") or [])}
    for clave, valor in variables.items():
        cuerpo = {
            "key": clave,
            "value": valor,
            "is_preview": False,
            "is_buildtime": False,
            "is_runtime": True,
            "is_literal": False,
        }
        if clave in actuales:
            api.patch(f"/applications/{uuid}/envs", cuerpo)
        else:
            api.post(f"/applications/{uuid}/envs", cuerpo)
        oculto = "«oculta»" if "KEY" in clave or "TOKEN" in clave else valor
        print(f"    {clave} = {oculto}")


def main() -> int:
    analizador = argparse.ArgumentParser(description=__doc__)
    analizador.add_argument("--rama", default="main", help="rama del repositorio a desplegar")
    analizador.add_argument("--llave", default="codefest-deploy-key", help="nombre de la llave en Coolify")
    analizador.add_argument("--desplegar", action="store_true", help="dispara la construcción al terminar")
    args = analizador.parse_args()

    base = os.environ.get("COOLIFY_URL")
    token = os.environ.get("COOLIFY_TOKEN")
    if not base or not token:
        raise SystemExit("faltan COOLIFY_URL y COOLIFY_TOKEN en el entorno")

    llm_api_key = os.environ.get("LLM_API_KEY", "")
    if not llm_api_key:
        print("aviso: LLM_API_KEY no está en el entorno; el agente quedará sin clave", file=sys.stderr)

    api = Coolify(base, token)
    servidor = uuid_servidor(api)
    proyecto = uuid_proyecto(api)
    llave = uuid_llave(api, args.llave)

    creadas: list[tuple[str, str]] = []
    for plantilla in APLICACIONES:
        nombre = plantilla["name"]
        comun = {
            "name": nombre,
            "git_branch": args.rama,
            "base_directory": plantilla["base_directory"],
            "dockerfile_location": "/Dockerfile",
            "ports_exposes": plantilla["ports_exposes"],
            "domains": plantilla["domains"],
            # El proxy de Coolify llega al contenedor por la red interna: publicar el
            # puerto en el host (ports_mappings) lo saltaría y rompería el dominio.
            "instant_deploy": False,
        }
        existente = aplicacion_existente(api, nombre)
        if existente:
            uuid = existente["uuid"]
            api.patch(f"/applications/{uuid}", comun)
            print(f"{nombre}: configuración actualizada ({uuid})")
        else:
            creada = api.post(
                "/applications/private-deploy-key",
                {
                    **comun,
                    "project_uuid": proyecto,
                    "server_uuid": servidor,
                    "environment_name": ENTORNO,
                    "private_key_uuid": llave,
                    "git_repository": REPOSITORIO,
                    "build_pack": "dockerfile",
                },
            )
            uuid = creada["uuid"]
            print(f"{nombre}: creada ({uuid})")

        variables = dict(plantilla["variables"])
        if nombre == "agent" and llm_api_key:
            variables["LLM_API_KEY"] = llm_api_key
        sincronizar_variables(api, uuid, variables)
        creadas.append((nombre, uuid))

    if args.desplegar:
        # En este orden: el agente primero, porque los otros dos lo consultan al arrancar.
        for nombre, uuid in creadas:
            # POST, no GET: la 4.3.23 cambió el método de este endpoint.
            api.post(f"/deploy?uuid={uuid}&force=false", {})
            print(f"{nombre}: despliegue encolado")

    print("\nComprobación cuando terminen las construcciones:")
    for url in (f"{URL_AGENTE}/health", f"{URL_TABLERO}/api/salud", f"{URL_CONSOLA}/api/health"):
        print(f"  curl -s {url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
