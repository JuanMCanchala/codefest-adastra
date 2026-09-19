"""Resumen en prosa de lo que midió el segmentador. El modelo **no ve la imagen**.

El tríptico ya enseña la foto, la predicción y la anotación, y debajo una tabla de
porcentajes por clase. Esa tabla es exacta y es ilegible para quien no la lee todos los
días: «suelo desnudo 37,4 %, montículos de cascajo 4,4 %» no dice, de un vistazo, que casi
cuatro de cada diez metros cuadrados del recorte sean frente minero.

El reparto es deliberado y es lo que hace defendible el añadido:

- **El veredicto lo decide la medición, no el modelo** (`evidencia_satelital.veredicto`).
  Sale de sumar las clases que el segmentador marca como huella minera y compararlas con un
  umbral declarado. Dejárselo al modelo de lenguaje sería cambiar una medición por una
  opinión, que es justo lo que este componente existe para no hacer.
- **El modelo solo pone las palabras**: dos o tres frases que expliquen ese reparto a quien
  no sabe leer una tabla de clases. No decide nada.
- **Las cifras viajan con el texto** y son su cita, como los `doc_id`/`chunk_id` del corpus.
- **Si el modelo falla, tarda o no está configurado, el tríptico no se entera**: el
  veredicto y las cifras ya están en la respuesta del componente. Lo único que falta es la
  prosa.

Lo que el modelo no puede decir, y el aviso se lo prohíbe en vez de confiar en su criterio:
nada que exija mirar la foto (maquinaria, dragas, vehículos, personas) y nada sobre la
legalidad de lo que se ve. La segmentación mide cobertura del suelo; que un terreno esté
desmontado no dice bajo qué permiso está. La huella minera sí está medida, y de eso habla.
"""

from __future__ import annotations

import logging
import threading
from typing import Any

import httpx
from fastapi import HTTPException
from pydantic import BaseModel

from .componentes.evidencia_satelital import Encuadre
from .settings import Settings

log = logging.getLogger(__name__)

# Las hectáreas que el tríptico publica, con el nombre que ya llevan en la interfaz. Un
# sitio puede no traerlas todas: el encuadre de bosque calcula dos que los otros no.
HECTAREAS: tuple[tuple[str, str], ...] = (
    ("huella_minera_ha", "Huella minera"),
    ("bosque_ha", "Bosque primario"),
    ("intervenida_ha", "Área intervenida"),
    ("regeneracion_ha", "Regeneración natural"),
)

# El aviso es la mitad del trabajo. Sin el punto 1 el modelo describe una fotografía que no
# ha visto —escribe «se observa maquinaria pesada» en cuanto lee la palabra «imagen»— y sin
# el 4 declara ilegal una mina porque la pregunta del tablero va de minería ilegal.
SISTEMA = """Eres un analista de teledetección. Escribes, en español y en prosa llana, un \
resumen corto de lo que un modelo de segmentación semántica midió sobre un recorte de \
ortomosaico de dron en Madre de Dios, Perú.

Reglas, sin excepciones:
1. NO ESTÁS VIENDO NINGUNA IMAGEN. No describes una fotografía: describes la salida de un \
segmentador, que es la tabla de mediciones de abajo y nada más. Nunca menciones colores, \
formas, texturas, maquinaria, dragas, vehículos, campamentos ni personas: eso no está \
medido y no puedes saberlo.
2. Usa solo los números de la tabla. Puedes sumarlos, compararlos y traducirlos a lenguaje \
corriente («casi cuatro de cada diez metros cuadrados del recorte»), pero no inventes \
ninguno ni traigas datos de fuera.
3. El veredicto ya está decidido por la medición y te lo dan hecho. No lo discutas ni lo \
cambies: explica de qué cifras sale.
4. La segmentación mide cobertura del suelo, no legalidad ni propiedad. No digas si la \
minería es legal o ilegal, ni quién la opera, ni si hay concesión.
5. Dos o tres frases, 70 palabras como mucho. Sin viñetas, sin encabezados, sin markdown, \
sin repetir la tabla entera y sin cerrar con una conclusión que las cifras no sostengan.

Di qué proporción del recorte es frente minero, cuánto bosque queda en pie y, si las hay, \
qué dicen la regeneración natural y el agua."""


class PeticionLectura(BaseModel):
    """Lo que la vista envía: el recorte que el usuario tiene delante."""

    sitio: str | None = None
    encuadre: Encuadre = "frontera"


# El resumen de un recorte no cambia entre visitas: las cifras son precalculadas y no hay
# pregunta del usuario. Se guarda por proceso para que el jurado no espere dos veces al
# modelo por el mismo tríptico, ni se gasten tokens en repetir la misma respuesta.
_cache: dict[tuple[str, str, str], str] = {}
_candado = threading.Lock()


def cifras_de(triptico: dict[str, Any]) -> list[dict[str, str]]:
    """Las mediciones del recorte, etiquetadas.

    Es literalmente lo que se le pasa al modelo y lo que se le devuelve al usuario debajo
    del texto: cada frase del resumen tiene que poder rastrearse hasta una de estas filas.
    """
    recorte = triptico.get("recorte_px") or [0, 0, 0, 0]
    resolucion = triptico.get("resolucion_m_px") or 0.0
    cifras: list[dict[str, str]] = [
        {"etiqueta": "Sitio", "valor": f"{triptico['sitio']} (Madre de Dios, Perú)"},
        {"etiqueta": "Encuadre", "valor": str(triptico.get("encuadre", "?"))},
        {"etiqueta": "Fecha de vuelo", "valor": str(triptico.get("fecha_captura", "?"))},
        {"etiqueta": "Resolución", "valor": f"{resolucion * 100:.2f} cm/px"},
        {
            "etiqueta": "Recorte",
            "valor": (
                f"{recorte[2]}×{recorte[3]} px en ({recorte[0]}, {recorte[1]}) · "
                f"{triptico.get('crs', '?')}"
            ),
        },
        {"etiqueta": "Modelo de segmentación", "valor": str(triptico.get("modelo", "?"))},
    ]
    cifras += [
        {"etiqueta": nombre, "valor": f"{triptico[clave]:.2f} ha"}
        for clave, nombre in HECTAREAS
        if isinstance(triptico.get(clave), int | float)
    ]
    cifras += [
        {
            "etiqueta": f"Clase «{c['clase']}»",
            "valor": (
                f"{c['porcentaje']:.1f} % del recorte"
                + (" (cuenta como huella minera)" if c.get("minera") else "")
            ),
        }
        for c in triptico.get("clases") or []
    ]
    return cifras


def _mensaje(triptico: dict[str, Any], cifras: list[dict[str, str]]) -> str:
    v = triptico.get("veredicto") or {}
    tabla = "\n".join(f"- {c['etiqueta']}: {c['valor']}" for c in cifras)
    return (
        "VEREDICTO YA CALCULADO (no lo cambies, explícalo)\n"
        f"- {v.get('etiqueta', '?')}: las clases de huella minera suman "
        f"{v.get('porcentaje_minero', 0):.1f} % del recorte, frente al umbral declarado de "
        f"{v.get('umbral_pct', 0):.0f} %.\n\n"
        "MEDICIONES DEL SEGMENTADOR (lo único que sabes)\n"
        f"{tabla}"
    )


async def _pedir_al_modelo(cfg: Settings, mensaje: str) -> str:
    cuerpo = {
        "model": cfg.llm_modelo,
        "messages": [
            {"role": "system", "content": SISTEMA},
            {"role": "user", "content": mensaje},
        ],
        "max_tokens": cfg.llm_max_tokens,
        # Un resumen de cifras no se quiere creativo: se quiere repetible.
        "temperature": 0.1,
    }
    destino = cfg.llm_base_url.rstrip("/") + "/chat/completions"
    try:
        async with httpx.AsyncClient(timeout=cfg.llm_timeout_s) as cliente:
            respuesta = await cliente.post(
                destino,
                json=cuerpo,
                headers={"Authorization": f"Bearer {cfg.llm_api_key}"},
            )
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=504, detail=f"el modelo no respondió en {cfg.llm_timeout_s:.0f} s"
        ) from exc
    except httpx.RequestError as exc:
        log.warning("no se pudo contactar el gateway de modelos: %s", exc)
        raise HTTPException(status_code=502, detail="no se pudo contactar el modelo") from exc
    if respuesta.status_code >= 400:
        log.warning("el gateway de modelos respondió %s", respuesta.status_code)
        raise HTTPException(status_code=502, detail=f"el modelo respondió {respuesta.status_code}")
    try:
        datos = respuesta.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="el modelo no devolvió JSON") from exc
    texto = ((datos.get("choices") or [{}])[0].get("message") or {}).get("content") or ""
    texto = texto.strip()
    if not texto:
        raise HTTPException(status_code=502, detail="el modelo devolvió una respuesta vacía")
    return texto


def configurada(cfg: Settings) -> bool:
    """Si el despliegue trae `LLM_BASE_URL` y `LLM_API_KEY`. Sin ellas no se ofrece."""
    return bool(cfg.llm_base_url and cfg.llm_api_key)


async def resumir(cfg: Settings, triptico: dict[str, Any]) -> tuple[str, list[dict[str, str]]]:
    """El resumen del recorte y las cifras que lo sostienen.

    Cualquier fallo sale como `HTTPException`: la vista lo enseña en una línea y deja el
    tríptico, el veredicto y la tabla donde estaban.
    """
    if not configurada(cfg):
        raise HTTPException(
            status_code=503, detail="el resumen automático no está configurado en este despliegue"
        )
    cifras = cifras_de(triptico)
    clave = (str(triptico.get("sitio")), str(triptico.get("imagen")), cfg.llm_modelo)
    with _candado:
        guardado = _cache.get(clave)
    if guardado is not None:
        return guardado, cifras
    texto = await _pedir_al_modelo(cfg, _mensaje(triptico, cifras))
    with _candado:
        _cache[clave] = texto
    return texto, cifras
