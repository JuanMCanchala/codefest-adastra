"""Lectura de las detecciones precalculadas y su traducción a evidencia citable.

El agente no ejecuta el modelo: lee los JSON que produjo `scripts/eldor_precalcular.py`.
Así la respuesta del chat no paga la latencia de la segmentación y toda cifra que se
muestra es reproducible corriendo de nuevo el script sobre el mismo ortomosaico.

**Trazabilidad.** Un fragmento del corpus se cita con `doc_id` + `chunk_id`. Una medición
de imagen se cita con su equivalente espacial: sitio, CRS, bbox en longitud/latitud,
resolución, fecha de vuelo y el checkpoint exacto que la produjo. La función
:func:`referencia` arma esa cadena de una línea.
"""

from __future__ import annotations

import json
import logging
import pathlib
from dataclasses import dataclass, field

from .sitios import BOSQUE_PRIMARIO, CLASES, INDICADORES_MINERIA, REGENERACION, SITIOS

log = logging.getLogger(__name__)

DIR_DATOS = pathlib.Path(__file__).resolve().parents[2] / "datos" / "eldor"

_NOMBRE_MINERIA = frozenset(CLASES[c] for c in INDICADORES_MINERIA)
_NOMBRE_REGENERACION = frozenset(CLASES[c] for c in REGENERACION)
_NOMBRE_BOSQUE = CLASES[BOSQUE_PRIMARIO]


@dataclass
class Deteccion:
    """Resultado de un sitio, con las agregaciones que el agente puede afirmar."""

    sitio: str
    fecha: str
    area_total_ha: float
    area_por_clase_ha: dict[str, float]
    procedencia: dict = field(default_factory=dict)
    modelo: dict = field(default_factory=dict)
    validacion: dict = field(default_factory=dict)

    @property
    def area_mineria_ha(self) -> float:
        """Suma de las clases que son infraestructura minera o remoción de material."""
        return round(sum(v for k, v in self.area_por_clase_ha.items() if k in _NOMBRE_MINERIA), 2)

    @property
    def area_bosque_ha(self) -> float:
        return round(self.area_por_clase_ha.get(_NOMBRE_BOSQUE, 0.0), 2)

    @property
    def area_regeneracion_ha(self) -> float:
        return round(
            sum(v for k, v in self.area_por_clase_ha.items() if k in _NOMBRE_REGENERACION), 2
        )

    @property
    def area_intervenida_ha(self) -> float:
        """Área del polígono que no es bosque primario: la huella de la intervención.

        Es una resta sobre áreas medidas, no un índice ponderado. No estima *pérdida* de
        bosque: para eso harían falta dos vuelos del mismo sitio en fechas distintas, y
        ELDOR publica uno solo por sitio.
        """
        return round(self.area_total_ha - self.area_bosque_ha, 2)

    def referencia(self) -> str:
        """Cadena de procedencia, análoga a un `doc_id`/`chunk_id` del corpus."""
        p = self.procedencia
        lon, lat = p.get("bbox_lon", ["?", "?"]), p.get("bbox_lat", ["?", "?"])
        return (
            f"ELDOR/{self.sitio} · {p.get('crs', '?')} · "
            f"lon [{lon[0]}, {lon[1]}] lat [{lat[0]}, {lat[1]}] · "
            f"vuelo {self.fecha} · {self.modelo.get('arquitectura', '?')} "
            f"({self.modelo.get('checkpoint', '?')})"
        )

    def resumen(self) -> str:
        """Texto compacto que se entrega al modelo como contexto recuperado."""
        partes = [
            f"Sitio {self.sitio} (Madre de Dios, Perú), vuelo del {self.fecha}.",
            f"Área segmentada {self.area_total_ha:.1f} ha.",
            f"Huella minera {self.area_mineria_ha:.1f} ha.",
            f"Bosque primario en pie {self.area_bosque_ha:.1f} ha.",
            f"Área intervenida (no bosque primario) {self.area_intervenida_ha:.1f} ha.",
            f"Regeneración natural {self.area_regeneracion_ha:.1f} ha.",
        ]
        if self.validacion.get("miou_presentes") is not None:
            partes.append(
                f"Validación contra la máscara anotada del sitio: "
                f"mIoU {self.validacion['miou_presentes']:.3f}, "
                f"exactitud por píxel {self.validacion['exactitud_pixel']:.3f}."
            )
        return " ".join(partes)


def _leer(ruta: pathlib.Path) -> Deteccion | None:
    try:
        datos = json.loads(ruta.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        log.warning("no se pudo leer la detección %s", ruta)
        return None
    proc = datos.get("procedencia", {})
    cob = datos.get("cobertura", {})
    sitio = proc.get("sitio", ruta.stem)
    return Deteccion(
        sitio=sitio,
        fecha=proc.get("fecha_captura", SITIOS[sitio].fecha if sitio in SITIOS else "?"),
        area_total_ha=float(cob.get("area_total_ha", 0.0)),
        area_por_clase_ha={k: float(v) for k, v in (cob.get("area_por_clase_ha") or {}).items()},
        procedencia=proc,
        modelo=datos.get("modelo", {}),
        validacion=datos.get("validacion", {}),
    )


def cargar_detecciones(directorio: pathlib.Path | None = None) -> dict[str, Deteccion]:
    """Todas las detecciones disponibles en disco, indexadas por sitio.

    Devuelve un diccionario vacío si el directorio no existe: el agente satelital se
    desactiva solo y el resto del sistema sigue igual.
    """
    raiz = directorio or DIR_DATOS
    if not raiz.is_dir():
        return {}
    encontradas = {}
    for ruta in sorted(raiz.glob("*.json")):
        det = _leer(ruta)
        if det is not None:
            encontradas[det.sitio] = det
    return encontradas


def agregado(detecciones: dict[str, Deteccion]) -> dict[str, float]:
    """Totales sobre todos los sitios disponibles, para responder «en conjunto»."""
    if not detecciones:
        return {}
    return {
        "sitios": len(detecciones),
        "area_total_ha": round(sum(d.area_total_ha for d in detecciones.values()), 2),
        "area_mineria_ha": round(sum(d.area_mineria_ha for d in detecciones.values()), 2),
        "area_bosque_ha": round(sum(d.area_bosque_ha for d in detecciones.values()), 2),
        "area_intervenida_ha": round(sum(d.area_intervenida_ha for d in detecciones.values()), 2),
    }
