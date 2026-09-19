"""Evidencia colombiana de minería ilegal (Amazon Mining Watch).

Complementa a `app.eldor`, que mide sobre ortomosaicos de dron en Perú. Aquí las cifras
son de Colombia y vienen de detecciones sobre Sentinel-2, publicadas por
`earthrise-media/mining-detector` (MIT) y reorganizadas por `scripts/amw_colombia.py`.

**Por qué dos fuentes y no una.** El modelo de ELDOR se entrenó a 5 cm/px y se derrumba
por debajo de ~0,30 m/px; la mejor imagen disponible de las zonas mineras colombianas es
de 0,59 m/px, y sobre ella el modelo etiqueta casi todo como agua. La medición está en
`docs/investigacion/03_arquitectura/deteccion_satelital_eldor.md`. Por eso Colombia se
responde con un modelo hecho para la resolución que sí existe, y ELDOR se conserva como
la parte validada contra máscaras anotadas.

**Trazabilidad.** Cada cifra se cita con la fuente, el commit exacto del repositorio, el
modelo, el sensor y el periodo. Los municipios llevan su código DIVIPOLA, que es lo que
permite cruzarlos con las alertas tempranas del corpus.
"""

from __future__ import annotations

import json
import logging
import pathlib
from dataclasses import dataclass, field

log = logging.getLogger(__name__)

RUTA_DATOS = pathlib.Path(__file__).resolve().parents[2] / "datos" / "amw" / "colombia.json"


@dataclass
class Colombia:
    """Detecciones de minería en Colombia, con su serie temporal y su desglose."""

    procedencia: dict = field(default_factory=dict)
    nacional: list[dict] = field(default_factory=list)
    departamentos: dict[str, list[dict]] = field(default_factory=dict)
    resguardos_indigenas: dict[str, list[dict]] = field(default_factory=dict)
    areas_protegidas: dict[str, list[dict]] = field(default_factory=dict)
    municipios: list[dict] = field(default_factory=list)

    @property
    def disponible(self) -> bool:
        return bool(self.nacional or self.municipios)

    @property
    def acumulado_ha(self) -> float:
        return self.nacional[-1]["acumulado_ha"] if self.nacional else 0.0

    @property
    def periodo_final(self) -> str:
        return self.nacional[-1]["etiqueta"] if self.nacional else "?"

    def _ultimos(self, serie: dict[str, list[dict]]) -> list[tuple[str, float]]:
        """Último acumulado de cada jurisdicción, de mayor a menor."""
        pares = [(n, s[-1]["acumulado_ha"]) for n, s in serie.items() if s]
        return sorted(pares, key=lambda x: -x[1])

    def departamentos_top(self) -> list[tuple[str, float]]:
        return self._ultimos(self.departamentos)

    def resguardos_top(self) -> list[tuple[str, float]]:
        return self._ultimos(self.resguardos_indigenas)

    def areas_protegidas_top(self) -> list[tuple[str, float]]:
        return self._ultimos(self.areas_protegidas)

    def crecimiento(self) -> tuple[float, float] | None:
        """Acumulado del primer y del último periodo, para hablar de tendencia."""
        if len(self.nacional) < 2:
            return None
        return self.nacional[0]["acumulado_ha"], self.nacional[-1]["acumulado_ha"]

    def referencia(self) -> str:
        """Cadena de procedencia, el análogo de `doc_id`/`chunk_id` para esta fuente."""
        p = self.procedencia
        return (
            f"{p.get('fuente', 'Amazon Mining Watch')} · {p.get('sensor', 'Sentinel-2')} · "
            f"modelo {p.get('modelo', '?')} · commit {str(p.get('commit', '?'))[:12]} · "
            f"publicado {p.get('fecha_publicacion', '?')} · licencia {p.get('licencia', '?')}"
        )

    def resumen(self) -> str:
        """Texto que se entrega al modelo como contexto recuperado."""
        partes = [
            f"Colombia acumula {self.acumulado_ha:.0f} ha de minería aurífera detectada "
            f"hasta {self.periodo_final}."
        ]
        crec = self.crecimiento()
        if crec:
            partes.append(
                f"La serie va de {crec[0]:.0f} ha en {self.nacional[0]['etiqueta']} "
                f"a {crec[1]:.0f} ha en {self.periodo_final}."
            )
        if dep := self.departamentos_top():
            partes.append(
                "Por departamento: " + ", ".join(f"{n} {v:.0f} ha" for n, v in dep[:5]) + "."
            )
        if res := self.resguardos_top():
            partes.append(
                "En resguardos indígenas: " + ", ".join(f"{n} {v:.0f} ha" for n, v in res[:3]) + "."
            )
        if ap := self.areas_protegidas_top():
            partes.append(
                "En áreas protegidas: " + ", ".join(f"{n} {v:.0f} ha" for n, v in ap[:3]) + "."
            )
        if self.municipios:
            partes.append(
                "Municipios con detecciones: "
                + ", ".join(
                    f"{m['municipio']} ({m['departamento']}, DIVIPOLA {m['divipola_mpio']}) "
                    f"{m['area_ha']:.0f} ha"
                    for m in self.municipios[:5]
                )
                + "."
            )
        partes.append(
            "Cobertura: cuenca amazónica. No incluye el Bajo Cauca antioqueño, "
            "que queda fuera del área monitoreada."
        )
        return " ".join(partes)


def cargar(ruta: pathlib.Path | None = None) -> Colombia:
    """Lee el JSON de detecciones. Devuelve un objeto vacío si no está en disco."""
    origen = ruta or RUTA_DATOS
    if not origen.is_file():
        return Colombia()
    try:
        d = json.loads(origen.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        log.warning("no se pudo leer %s", origen)
        return Colombia()
    return Colombia(
        procedencia=d.get("procedencia", {}),
        nacional=d.get("nacional", []),
        departamentos=d.get("departamentos", {}),
        resguardos_indigenas=d.get("resguardos_indigenas", {}),
        areas_protegidas=d.get("areas_protegidas", {}),
        municipios=d.get("municipios", []),
    )
