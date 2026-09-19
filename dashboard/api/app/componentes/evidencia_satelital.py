"""Lo que el modelo de visión vio: ortomosaico, predicción y anotación, uno al lado del otro.

El agente satelital responde con hectáreas medidas sobre imagen, no con texto recuperado,
pero hasta aquí esas hectáreas solo se podían leer. Este componente enseña el recorte del
ortomosaico del que salieron, la segmentación que produjo el modelo y —cuando el sitio la
publica— la máscara anotada a mano contra la que se valida.

No consulta la base: los trípticos los precalcula `scripts/eldor_recorte.py` y viajan en la
SPA (`web/public/eldor/`), que la API ya sirve. Aquí solo se leen sus metadatos. Igual que
en `eldor_precalcular.py`, el modelo no corre en tiempo de respuesta.

La trazabilidad no es `doc_id`/`chunk_id` sino su equivalente espacial: sitio, CRS, ventana
del recorte en píxeles, resolución, fecha de vuelo y checkpoint.
"""

from __future__ import annotations

import json
import logging
import pathlib
from typing import Any, Literal

from ..db import BaseDatos
from ..evidencia import IndiceTextos
from ..settings import get_settings
from .base import FiltrosBase, Salida, resolver_filtros

log = logging.getLogger(__name__)

Encuadre = Literal["frontera", "mineria", "bosque"]

# El sufijo del archivo es el propio encuadre, tal y como lo escribe
# `scripts/eldor_recorte.py`. Un sitio puede no tener renderizados los tres.
SUFIJOS: tuple[str, ...] = ("frontera", "mineria", "bosque")

# Cuánto del recorte tiene que ser huella minera para decir que hay minería. El umbral va
# aquí, declarado y enseñado en la vista, porque es la única parte opinable del veredicto:
# la medición es del segmentador y la suma es aritmética. A 5,7 cm/px sobre un recorte de
# ~2,1 ha, el 5 % son ~1.000 m² de suelo desnudo y cascajo seguidos, que es un frente de
# trabajo, no ruido de clasificación. Los tres sitios de ELDOR están entre el 38 y el 42 %.
UMBRAL_MINERO_PCT = 5.0


def veredicto(triptico: dict[str, Any]) -> dict[str, Any]:
    """«Hay minería» o «no», decidido por la medición y no por un modelo de lenguaje.

    Suma las clases que el segmentador marca como huella minera y las compara con
    `UMBRAL_MINERO_PCT`. Viaja con el tríptico para que esté en pantalla aunque el resumen
    en prosa de `POST /api/interpretar` falle, tarde o no esté configurado.

    El límite que hay que declarar: dice que el suelo está desmontado como lo está un frente
    minero, no bajo qué permiso lo está. La legalidad no se mide sobre píxeles.
    """
    clases = triptico.get("clases") or []
    mineras = [c for c in clases if c.get("minera")]
    porcentaje = round(sum(c.get("porcentaje", 0.0) for c in mineras), 2)
    hay = porcentaje >= UMBRAL_MINERO_PCT
    return {
        "hay_mineria": hay,
        "etiqueta": "Minería detectada" if hay else "Sin minería apreciable",
        "porcentaje_minero": porcentaje,
        "umbral_pct": UMBRAL_MINERO_PCT,
        "clases_mineras": [c["clase"] for c in mineras],
    }


class Filtros(FiltrosBase):
    #: Sitio ELDOR. Sin valor, el primero disponible por orden alfabético.
    sitio: str | None = None
    #: `frontera` enseña el borde donde el bosque termina y la mina empieza; `mineria`,
    #: la zona de mayor actividad; `bosque`, el frente de deforestación, donde la selva en
    #: pie linda con terreno ya desmontado que está rebrotando.
    encuadre: Encuadre = "frontera"


# En el contenedor los trípticos llegan dentro de la SPA compilada (`WEB_DIST/eldor`),
# porque Vite copia `web/public/` a `dist/`. En desarrollo la SPA no está construida, así
# que se leen de donde Vite los publica, que es la misma carpeta antes de compilar.
EN_REPOSITORIO = pathlib.Path(__file__).resolve().parents[3] / "web" / "public" / "eldor"


def _directorio() -> pathlib.Path:
    """Carpeta de trípticos: la de la SPA compilada, o la del repositorio en desarrollo."""
    ruta = get_settings().web_dist / "eldor"
    return ruta if ruta.is_dir() else EN_REPOSITORIO


def _disponibles() -> list[dict[str, Any]]:
    """Trípticos con imagen y metadatos en disco, por sitio y encuadre."""
    carpeta = _directorio()
    if not carpeta.is_dir():
        return []
    salida = []
    for meta in sorted(carpeta.glob("*.json")):
        if not meta.with_suffix(".png").is_file():
            continue
        try:
            datos = json.loads(meta.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            log.warning("tríptico ilegible: %s", meta.name)
            continue
        datos.setdefault("imagen", f"/eldor/{meta.stem}.png")
        salida.append(datos)
    return salida


def _elegir(
    tripticos: list[dict[str, Any]], sitio: str | None, encuadre: str
) -> dict[str, Any] | None:
    candidatos = [t for t in tripticos if t["imagen"].endswith(f"-{encuadre}.png")]
    if sitio:
        candidatos = [t for t in candidatos if t["sitio"] == sitio]
    # Si ese sitio no tiene ese encuadre renderizado, manda el sitio: es lo que el usuario
    # acaba de pulsar. Se cae a cualquier encuadre suyo antes que saltar a otro sitio.
    if not candidatos and sitio:
        candidatos = [t for t in tripticos if t["sitio"] == sitio]
    return candidatos[0] if candidatos else (tripticos[0] if tripticos else None)


def buscar_triptico(sitio: str | None, encuadre: str) -> dict[str, Any] | None:
    """El mismo tríptico que enseñaría la vista con esos filtros, o `None` si no hay ninguno.

    `POST /api/interpretar` lee de aquí, y no por su cuenta, para que el resumen hable
    siempre del recorte que el usuario tiene delante y no de otro elegido con otras reglas.
    """
    tripticos = _disponibles()
    if sitio and sitio not in {t["sitio"] for t in tripticos}:
        sitio = None
    elegido = _elegir(tripticos, sitio, encuadre)
    # Con el veredicto ya puesto, como lo sirve `calcular`: las dos rutas tienen que leer la
    # misma forma, o el resumen en prosa acabaría explicando un veredicto que no existe.
    return None if elegido is None else {**elegido, "veredicto": veredicto(elegido)}


def calcular(
    bd: BaseDatos, filtros: dict[str, Any], textos: IndiceTextos
) -> tuple[Salida, Filtros, list[str]]:
    f, ignorados = resolver_filtros(Filtros, filtros)
    tripticos = _disponibles()

    sitios = sorted({t["sitio"] for t in tripticos})
    # Un sitio que no se ha renderizado no es un error del jurado: se informa y se cae al
    # primero disponible, igual que hacen los demás componentes con un filtro que no casa.
    if f.sitio and f.sitio not in sitios:
        ignorados = sorted({*ignorados, "sitio"})
        f = f.model_copy(update={"sitio": None})

    elegido = _elegir(tripticos, f.sitio, f.encuadre)

    if elegido is None:
        return (
            Salida(
                titulo="Sin trípticos renderizados",
                datos={"sitios": [], "encuadres": [], "triptico": None},
                evidencia=[],
                total_evidencia=0,
                nota_metodo=(
                    "No hay recortes en disco. Se generan con "
                    "`python scripts/eldor_recorte.py Anel --encuadre bosque`."
                ),
            ),
            f,
            ignorados,
        )

    # Los encuadres que este sitio tiene en disco, para que la vista no ofrezca un salto
    # que acabaría devolviendo otra cosa.
    disponibles = [
        s
        for s in SUFIJOS
        if any(
            t["sitio"] == elegido["sitio"] and t["imagen"].endswith(f"-{s}.png") for t in tripticos
        )
    ]
    f = f.model_copy(update={"sitio": elegido["sitio"]})
    recorte = elegido.get("recorte_px") or [0, 0, 0, 0]
    resolucion = elegido.get("resolucion_m_px") or 0.0
    procedencia = (
        f"{elegido['sitio']} (Madre de Dios, Perú) · vuelo {elegido.get('fecha_captura', '?')} · "
        f"{resolucion * 100:.2f} cm/px · recorte {recorte[2]}×{recorte[3]} px en "
        f"({recorte[0]}, {recorte[1]}) · {elegido.get('crs', '?')} · {elegido.get('modelo', '?')}"
    )
    nota = (
        "Segmentación semántica de 14 clases sobre ortomosaico de dron. El modelo barre el "
        "recorte en tiles de 512 px sin solape, que es exactamente como se calcularon las "
        "hectáreas del agente satelital; por eso se ven las costuras entre tiles. La "
        "anotación humana es la del conjunto ELDOR y no interviene en la predicción."
    )
    nota += (
        f" El veredicto de minería lo decide la medición, no un modelo de lenguaje: se suman "
        f"las clases que el segmentador marca como huella minera y se comparan con un umbral "
        f"de {UMBRAL_MINERO_PCT:.0f} % del recorte. Dice que el suelo está desmontado como lo "
        "está un frente minero, no bajo qué permiso: la legalidad no se mide sobre píxeles."
    )
    if f.encuadre == "bosque":
        # El límite hay que decirlo aquí, no en el pie de una diapositiva: lo que se mide es
        # cobertura en una fecha, no pérdida entre dos. ELDOR publica un vuelo por sitio.
        nota += (
            " El área intervenida es el recorte menos el bosque primario: una resta sobre "
            "áreas medidas en un solo vuelo, no una estimación de pérdida de bosque, que "
            "exigiría dos fechas del mismo sitio. La regeneración natural sí marca suelo "
            "desmontado antes, porque solo crece sobre terreno ya intervenido."
        )
    # El país va en el título, no solo en la nota de método. ELDOR es el único conjunto
    # público con anotación humana a esta resolución, y está en Perú: quien mira la imagen
    # tiene que saberlo antes de preguntarlo. Declarado deja de ser un error y pasa a ser
    # una elección; escondido, lo primero que se le nota.
    sitio = f"{elegido['sitio']} (Madre de Dios, Perú)"
    titulos = {
        "bosque": f"Bosque medido sobre imagen — sitio {sitio}",
        "mineria": f"Minería medida sobre imagen — sitio {sitio}",
        "frontera": f"Minería medida sobre imagen — sitio {sitio}",
    }
    return (
        Salida(
            titulo=titulos[f.encuadre],
            datos={
                "sitios": sitios,
                "encuadres": disponibles,
                "triptico": {
                    **elegido,
                    "procedencia": procedencia,
                    "veredicto": veredicto(elegido),
                },
            },
            evidencia=[],
            total_evidencia=0,
            nota_metodo=nota,
        ),
        f,
        ignorados,
    )
