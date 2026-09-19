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

    candidatos = [t for t in tripticos if t["imagen"].endswith(f"-{f.encuadre}.png")]
    if f.sitio:
        candidatos = [t for t in candidatos if t["sitio"] == f.sitio]
    # Si ese sitio no tiene ese encuadre renderizado, manda el sitio: es lo que el usuario
    # acaba de pulsar. Se cae a cualquier encuadre suyo antes que saltar a otro sitio.
    if not candidatos and f.sitio:
        candidatos = [t for t in tripticos if t["sitio"] == f.sitio]
    elegido = candidatos[0] if candidatos else (tripticos[0] if tripticos else None)

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
                "triptico": {**elegido, "procedencia": procedencia},
            },
            evidencia=[],
            total_evidencia=0,
            nota_metodo=nota,
        ),
        f,
        ignorados,
    )
