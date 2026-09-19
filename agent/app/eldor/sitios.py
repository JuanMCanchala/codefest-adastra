"""Metadatos espaciales de los sitios ELDOR y el mapa de clases canónicas.

Los valores se copian de la ficha del dataset (`huggingface.co/datasets/IRSC/ELDOR`,
tabla "Spatial metadata table") y son los que dan **trazabilidad** a cada detección:
cada área reportada se ancla a un sitio, un sistema de referencia (EPSG:32719, UTM 19S),
un rango de longitud/latitud y una fecha de captura del ortomosaico.

Todos los sitios son minas de oro aluvial en Madre de Dios (Perú). Son la Amazonía
occidental, no territorio colombiano: ver la sección de límites en
`docs/investigacion/03_arquitectura/deteccion_satelital_eldor.md`.
"""

from __future__ import annotations

from dataclasses import dataclass

CRS = "EPSG:32719"

# Clases canónicas de ELDOR tras la fusión de etiquetas. El `id` es el valor del PNG de
# etiqueta; el head del modelo tiene 14 salidas que corresponden a los ids 1..14, porque
# 0=Background se entrena como `ignore_index`.
CLASES: dict[int, str] = {
    0: "Fondo",
    1: "Edificación",
    2: "Balsa minera",
    3: "Bosque primario",
    4: "Maquinaria pesada",
    5: "Cuerpos de agua",
    6: "Cultivo agrícola",
    7: "Montículos compactos",
    8: "Montículos de cascajo",
    9: "Pasto",
    10: "Regeneración natural tipo 1",
    11: "Regeneración natural tipo 2",
    12: "Suelo desnudo",
    13: "Tolva",
    14: "Vehículos",
}

# Clases que evidencian actividad minera directa (infraestructura y remoción de material).
INDICADORES_MINERIA = frozenset({2, 4, 7, 8, 12, 13})
# Cobertura boscosa intacta. Su complemento dentro del polígono es el área intervenida.
BOSQUE_PRIMARIO = 3
# Vegetación en recuperación sobre terreno previamente intervenido.
REGENERACION = frozenset({10, 11})


@dataclass(frozen=True)
class Sitio:
    """Un ortomosaico de dron georreferenciado del conjunto ELDOR."""

    id: str
    ancho: int
    alto: int
    #: Resolución del ortomosaico en metros por píxel (cuadrada).
    resolucion_m: float
    lon_min: float
    lon_max: float
    lat_min: float
    lat_max: float
    #: Fecha de captura del vuelo (ISO 8601).
    fecha: str
    particion: str
    #: Área de primer plano etiquetada en hectáreas, según la ficha del dataset.
    area_ha: float

    @property
    def m2_por_pixel(self) -> float:
        return self.resolucion_m * self.resolucion_m

    def hectareas(self, pixeles: int) -> float:
        """Convierte un conteo de píxeles a hectáreas con la resolución del sitio."""
        return pixeles * self.m2_por_pixel / 10_000.0

    def procedencia(self) -> dict[str, object]:
        """Bloque de trazabilidad que acompaña a toda cifra derivada de este sitio."""
        return {
            "sitio": self.id,
            "crs": CRS,
            "bbox_lon": [self.lon_min, self.lon_max],
            "bbox_lat": [self.lat_min, self.lat_max],
            "resolucion_m_px": self.resolucion_m,
            "fecha_captura": self.fecha,
            "particion": self.particion,
        }


SITIOS: dict[str, Sitio] = {
    s.id: s
    for s in (
        Sitio(
            "AcumulacionAaron2B",
            38122,
            17643,
            0.056308,
            -70.419597,
            -70.399788,
            -12.627643,
            -12.618558,
            "2022-04-24",
            "train",
            212.0501,
        ),
        Sitio(
            "Anel",
            18274,
            18420,
            0.056620,
            -69.714044,
            -69.699976,
            -12.713767,
            -12.701071,
            "2022-04-08",
            "test",
            102.7175,
        ),
        Sitio(
            "Clavelito",
            19556,
            40304,
            0.075601,
            -70.605945,
            -70.591929,
            -12.961391,
            -12.933761,
            "2022-05-09",
            "val",
            344.5330,
        ),
        Sitio(
            "ElEngano",
            17575,
            17770,
            0.057233,
            -69.962478,
            -69.949966,
            -13.020161,
            -13.007312,
            "2022-03-03",
            "test",
            101.2404,
        ),
        Sitio(
            "Kotsimba",
            57328,
            53959,
            0.072760,
            -70.283655,
            -70.244998,
            -13.136635,
            -13.100951,
            "2022-05-26",
            "train",
            693.7270,
        ),
        Sitio(
            "Linda",
            17852,
            17888,
            0.057632,
            -69.953378,
            -69.940789,
            -13.020082,
            -13.007688,
            "2022-02-28",
            "test",
            98.8187,
        ),
        Sitio(
            "Los5Rebeldes",
            33490,
            66672,
            0.030000,
            -70.672354,
            -70.660084,
            -13.034336,
            -13.013573,
            "2022-02-04",
            "train",
            199.9257,
        ),
        Sitio(
            "Nayda",
            17954,
            17908,
            0.056610,
            -69.721603,
            -69.709746,
            -12.713363,
            -12.701313,
            "2022-08-04",
            "val",
            101.9933,
        ),
        Sitio(
            "Paolita",
            53943,
            27054,
            0.055446,
            -69.630457,
            -69.600462,
            -12.689889,
            -12.673012,
            "2022-02-21",
            "test",
            445.5226,
        ),
        Sitio(
            "PlayaMirador1",
            17624,
            8883,
            0.056792,
            -70.377536,
            -70.365474,
            -13.063390,
            -13.051829,
            "2022-03-10",
            "train",
            50.1027,
        ),
        Sitio(
            "PlayaMirador2",
            17624,
            8883,
            0.056792,
            -70.377536,
            -70.365474,
            -13.063390,
            -13.051829,
            "2022-03-10",
            "val",
            50.1021,
        ),
        Sitio(
            "SantaInesDosMil",
            17387,
            17267,
            0.058193,
            -70.386657,
            -70.374307,
            -13.063436,
            -13.050589,
            "2022-03-10",
            "test",
            100.9625,
        ),
    )
}


def tile_a_lonlat(sitio: Sitio, x: int, y: int, lado: int) -> dict[str, list[float]]:
    """Esquinas geográficas de un tile, para rastrear un hallazgo hasta el terreno.

    Aproxima con interpolación lineal sobre el bbox del ortomosaico: es exacto para
    comparar y ubicar tiles dentro del sitio, no sustituye una reproyección con GDAL.
    """
    lon_por_px = (sitio.lon_max - sitio.lon_min) / sitio.ancho
    # La fila 0 del raster es el borde norte: la latitud decrece al avanzar en y.
    lat_por_px = (sitio.lat_max - sitio.lat_min) / sitio.alto
    return {
        "lon": [sitio.lon_min + x * lon_por_px, sitio.lon_min + (x + lado) * lon_por_px],
        "lat": [sitio.lat_max - (y + lado) * lat_por_px, sitio.lat_max - y * lat_por_px],
    }
