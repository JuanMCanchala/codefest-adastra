"""Renderiza un recorte del ortomosaico ELDOR con la segmentación del modelo encima.

Las cifras del agente satelital salen de este mismo modelo, pero hasta ahora solo se
podían leer. Esto las hace mirables: elige el recorte del sitio con más actividad minera
según la máscara anotada, lo segmenta y escribe un tríptico —ortomosaico, predicción del
modelo, anotación humana— con su leyenda y su bloque de procedencia.

No sustituye a `eldor_precalcular.py`, que es quien produce las hectáreas. Esto es la
ventana por la que se ve lo que el modelo vio.

Uso:
    python scripts/eldor_recorte.py Anel
    python scripts/eldor_recorte.py Anel --encuadre bosque
    python scripts/eldor_recorte.py Anel --lado 3072 --con-leyenda
"""

from __future__ import annotations

import argparse
import json
import logging
import pathlib
import sys
import time

RAIZ = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "agent"))

from app.eldor import modelo as m
from app.eldor.sitios import (
    BOSQUE_PRIMARIO,
    CLASES,
    INDICADORES_MINERIA,
    REGENERACION,
    SITIOS,
    Sitio,
)

REPO_DATOS = "IRSC/ELDOR"
REVISION_DATOS = "def7a5eecd5de016825cca9c356f2cc12ca059a7"
SALIDA = RAIZ / "dashboard" / "web" / "public" / "eldor"
log = logging.getLogger("recorte")

# Paleta por clase canónica 1..14. Los indicadores de minería van en cálidos y el resto
# del terreno en fríos, para que la huella se lea de un vistazo sin consultar la leyenda.
# La regeneración natural va en oliva y no en verde: crece solo sobre suelo intervenido
# antes, así que tiene que distinguirse del bosque primario de un golpe de vista. En
# dos verdes parecidos, el frente de deforestación no se ve.
COLORES: dict[int, tuple[int, int, int]] = {
    1: (255, 214, 102),  # Edificación
    2: (255, 61, 61),  # Balsa minera
    3: (22, 122, 63),  # Bosque primario
    4: (255, 122, 0),  # Maquinaria pesada
    5: (56, 132, 255),  # Cuerpos de agua
    6: (168, 222, 106),  # Cultivo agrícola
    7: (214, 92, 40),  # Montículos compactos
    8: (240, 150, 60),  # Montículos de cascajo
    9: (140, 196, 120),  # Pasto
    10: (154, 168, 85),  # Regeneración natural tipo 1
    11: (185, 196, 122),  # Regeneración natural tipo 2
    12: (232, 196, 140),  # Suelo desnudo
    13: (198, 62, 148),  # Tolva
    14: (250, 90, 200),  # Vehículos
}


# Como se llama cada encuadre en la interfaz. La clave es el sufijo del archivo.
ENCUADRES: dict[str, str] = {
    "frontera": "frontera bosque/mina",
    "mineria": "maxima actividad minera",
    "bosque": "frente de deforestacion",
}


def descargar(sitio: Sitio, cual: str) -> pathlib.Path | None:
    from huggingface_hub import hf_hub_download
    from huggingface_hub.errors import EntryNotFoundError

    try:
        return pathlib.Path(
            hf_hub_download(
                repo_id=REPO_DATOS,
                repo_type="dataset",
                filename=f"{sitio.particion}/{cual}/{sitio.id}.png",
                revision=REVISION_DATOS,
            )
        )
    except EntryNotFoundError:
        return None


def _integral(mascara):
    """Imagen integral: la suma de cualquier ventana sale luego en cuatro lecturas."""
    import numpy as np

    alto, ancho = mascara.shape[:2]
    acumulado = np.zeros((alto + 1, ancho + 1), dtype=np.int64)
    acumulado[1:, 1:] = np.cumsum(np.cumsum(mascara, axis=0), axis=1)
    return acumulado


def _suma(integral, x: int, y: int, lado: int) -> int:
    return int(
        integral[y + lado, x + lado]
        - integral[y, x + lado]
        - integral[y + lado, x]
        + integral[y, x]
    )


def elegir_recorte(etiqueta, lado: int, encuadre: str) -> tuple[int, int]:
    """Ventana más ilustrativa del sitio, según lo que se quiera enseñar.

    - ``mineria``: la de más huella minera. Sale un recorte que es mina de lado a lado.
    - ``frontera``: maximiza el mínimo entre minería y bosque primario, o sea el borde
      donde el bosque termina y la mina empieza.
    - ``bosque``: maximiza el mínimo entre bosque primario y regeneración natural. Es el
      frente de deforestación: selva en pie junto a terreno que ya fue desmontado y está
      rebrotando. La regeneración solo existe sobre suelo intervenido antes, así que ese
      contraste es la huella del desmonte aunque no haya una balsa minera a la vista.
    """
    import numpy as np

    alto, ancho = etiqueta.shape[:2]
    if lado >= min(alto, ancho):
        return 0, 0
    # Rejilla de medio lado: basta para encontrar la zona caliente y evita recorrer
    # 336 millones de píxeles ventana por ventana.
    paso = lado // 2
    int_mina = _integral(np.isin(etiqueta, list(INDICADORES_MINERIA)))
    int_bosque = _integral(etiqueta == BOSQUE_PRIMARIO)
    int_regen = _integral(np.isin(etiqueta, list(REGENERACION)))

    mejor, mejor_xy, detalle = -1, (0, 0), ""
    for y in range(0, alto - lado + 1, paso):
        for x in range(0, ancho - lado + 1, paso):
            if encuadre == "mineria":
                mina = _suma(int_mina, x, y, lado)
                puntaje, texto = mina, f"{mina} px de mineria"
            elif encuadre == "bosque":
                bosque = _suma(int_bosque, x, y, lado)
                regen = _suma(int_regen, x, y, lado)
                puntaje = min(bosque, regen)
                texto = f"{bosque} px de bosque y {regen} de regeneracion"
            else:
                mina = _suma(int_mina, x, y, lado)
                bosque = _suma(int_bosque, x, y, lado)
                puntaje = min(mina, bosque)
                texto = f"{mina} px de mineria y {bosque} de bosque"
            if puntaje > mejor:
                mejor, mejor_xy, detalle = puntaje, (x, y), texto
    log.info("recorte elegido en (%d, %d): %s", mejor_xy[0], mejor_xy[1], detalle)
    return mejor_xy


def colorear(mascara):
    """Mapa de clases 1..14 a RGB. La clase 0 (fondo) queda en negro."""
    import numpy as np

    rgb = np.zeros((*mascara.shape, 3), dtype=np.uint8)
    for clase, color in COLORES.items():
        rgb[mascara == clase] = color
    return rgb


def segmentar(seg: m.Segmentador, recorte):
    """Barre el recorte en tiles de 512 y devuelve la máscara predicha."""
    import numpy as np

    alto, ancho = recorte.shape[:2]
    lado = m.LADO_TILE
    salida = np.zeros((alto, ancho), dtype=np.uint8)
    tiles = ((alto + lado - 1) // lado) * ((ancho + lado - 1) // lado)
    hecho, t0 = 0, time.perf_counter()
    for y in range(0, alto, lado):
        for x in range(0, ancho, lado):
            trozo = recorte[y : y + lado, x : x + lado]
            alto_r, ancho_r = trozo.shape[:2]
            if (alto_r, ancho_r) != (lado, lado):
                relleno = np.zeros((lado, lado, 3), dtype=trozo.dtype)
                relleno[:alto_r, :ancho_r] = trozo
                trozo = relleno
            salida[y : y + alto_r, x : x + ancho_r] = seg.predecir_tile(trozo)[
                :alto_r, :ancho_r
            ]
            hecho += 1
            if hecho % 8 == 0 or hecho == tiles:
                log.info(
                    "  %d/%d tiles (%.0f s)", hecho, tiles, time.perf_counter() - t0
                )
    return salida


def _fuente(tamano: int):
    """Arial del sistema; si no está, la de mapa de bits de PIL."""
    from PIL import ImageFont

    for nombre in ("arial.ttf", "DejaVuSans.ttf", "segoeui.ttf"):
        try:
            return ImageFont.truetype(nombre, tamano)
        except OSError:
            continue
    return ImageFont.load_default()


def componer(
    rgb,
    prediccion,
    anotacion,
    sitio: Sitio,
    x: int,
    y: int,
    ancho_panel: int,
    con_leyenda: bool,
):
    """Tríptico de tres paneles. Devuelve la imagen y las cifras del recorte.

    Con ``con_leyenda`` la imagen se basta sola —leyenda y procedencia impresas— para
    una diapositiva. Sin ella salen solo los paneles, que es lo que quiere el tablero:
    allí la leyenda y la procedencia van en HTML, donde se pueden leer y seleccionar.
    """
    import numpy as np
    from PIL import Image, ImageDraw

    paneles = [
        ("Ortomosaico de dron", rgb, "lo que ve la cámara"),
        ("Predicción del modelo", colorear(prediccion), "SegFormer MiT-B2, 14 clases"),
    ]
    if anotacion is not None:
        paneles.append(
            ("Anotación humana", colorear(anotacion), "referencia del dataset")
        )

    titulo_f, subtitulo_f, leyenda_f, pie_f = (
        _fuente(19),
        _fuente(14),
        _fuente(15),
        _fuente(14),
    )
    escala = ancho_panel / rgb.shape[1]
    alto_panel = int(rgb.shape[0] * escala)
    margen, cabecera = 20, 62
    # Sin leyenda el pie es solo el aire de abajo; con ella, cinco filas y la procedencia.
    pie = 150 if con_leyenda else 16
    ancho = margen + len(paneles) * (ancho_panel + margen)
    alto = cabecera + alto_panel + pie

    lienzo = Image.new("RGB", (ancho, alto), (14, 16, 20))
    dibujo = ImageDraw.Draw(lienzo)
    for i, (titulo, arreglo, subtitulo) in enumerate(paneles):
        panel = Image.fromarray(arreglo).resize(
            (ancho_panel, alto_panel), Image.LANCZOS
        )
        izq = margen + i * (ancho_panel + margen)
        lienzo.paste(panel, (izq, cabecera))
        dibujo.rectangle(
            [izq - 1, cabecera - 1, izq + ancho_panel, cabecera + alto_panel],
            outline=(58, 64, 74),
        )
        dibujo.text((izq, cabecera - 44), titulo, fill=(236, 238, 242), font=titulo_f)
        dibujo.text(
            (izq, cabecera - 22), subtitulo, fill=(132, 140, 152), font=subtitulo_f
        )

    # Solo las clases que aparecen de verdad en el recorte, ordenadas por área.
    presentes = [int(c) for c in np.unique(prediccion) if int(c) in COLORES]
    presentes.sort(key=lambda c: -int((prediccion == c).sum()))
    base = cabecera + alto_panel + 20
    for i, clase in enumerate(presentes[:15] if con_leyenda else []):
        col, fila = i // 5, i % 5
        px, py = margen + col * 300, base + fila * 21
        minera = clase in INDICADORES_MINERIA
        porcentaje = 100.0 * float((prediccion == clase).sum()) / prediccion.size
        dibujo.rectangle([px, py + 4, px + 12, py + 16], fill=COLORES[clase])
        dibujo.text(
            (px + 20, py),
            f"{CLASES[clase]} - {porcentaje:.1f} %"
            + ("  (huella minera)" if minera else ""),
            fill=(228, 176, 120) if minera else (170, 178, 190),
            font=leyenda_f,
        )

    m2 = sitio.m2_por_pixel
    minera_ha = (
        float(np.isin(prediccion, list(INDICADORES_MINERIA)).sum()) * m2 / 10_000
    )
    bosque_ha = float((prediccion == BOSQUE_PRIMARIO).sum()) * m2 / 10_000
    regeneracion_ha = float(np.isin(prediccion, list(REGENERACION)).sum()) * m2 / 10_000
    # Todo lo que no es bosque primario dentro del recorte. Es una resta sobre áreas
    # medidas, no una estimación de pérdida: para eso harían falta dos vuelos del sitio.
    total_ha = float(prediccion.size) * m2 / 10_000
    intervenida_ha = total_ha - bosque_ha
    procedencia = (
        f"{sitio.id} (Madre de Dios, Peru) · vuelo {sitio.fecha} · "
        f"{sitio.resolucion_m * 100:.2f} cm/px · recorte {prediccion.shape[1]}x"
        f"{prediccion.shape[0]} px en ({x}, {y}) · EPSG:32719 · SegFormer MiT-B2 · "
        f"huella minera {minera_ha:.2f} ha · bosque primario {bosque_ha:.2f} ha · "
        f"area intervenida {intervenida_ha:.2f} ha"
    )
    if con_leyenda:
        dibujo.text((margen, alto - 28), procedencia, fill=(140, 148, 162), font=pie_f)
    clases = [
        {
            "clase": CLASES[c],
            "porcentaje": round(
                100.0 * float((prediccion == c).sum()) / prediccion.size, 2
            ),
            "minera": c in INDICADORES_MINERIA,
            "color": "#{:02x}{:02x}{:02x}".format(*COLORES[c]),
        }
        for c in presentes
    ]
    return lienzo, {
        "huella_minera_ha": round(minera_ha, 2),
        "bosque_ha": round(bosque_ha, 2),
        "regeneracion_ha": round(regeneracion_ha, 2),
        "intervenida_ha": round(intervenida_ha, 2),
        "area_total_ha": round(total_ha, 2),
        "clases": clases,
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "sitio", help="id del sitio ELDOR (Anel, ElEngano, Linda, Paolita...)"
    )
    p.add_argument("--lado", type=int, default=2048, help="lado del recorte en pixeles")
    p.add_argument(
        "--ancho-panel", type=int, default=640, help="ancho de cada panel del triptico"
    )
    p.add_argument("--hilos", type=int, default=8)
    p.add_argument(
        "--encuadre",
        choices=("frontera", "mineria", "bosque"),
        default="frontera",
        help=(
            "que buscar en el ortomosaico: 'frontera' el borde bosque/mina, "
            "'mineria' la zona de mas actividad, 'bosque' el frente de deforestacion"
        ),
    )
    p.add_argument(
        "--con-leyenda",
        action="store_true",
        help="imprimir leyenda y procedencia dentro de la imagen (para diapositivas)",
    )
    p.add_argument("--salida", type=pathlib.Path, default=SALIDA)
    args = p.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(message)s")
    import numpy as np
    from PIL import Image

    Image.MAX_IMAGE_PIXELS = None

    sitio = SITIOS.get(args.sitio)
    if sitio is None:
        log.error("sitio desconocido: %s. Conocidos: %s", args.sitio, ", ".join(SITIOS))
        return 2

    ruta_lbl = descargar(sitio, "label")
    etiqueta = np.array(Image.open(ruta_lbl)) if ruta_lbl else None
    if etiqueta is None:
        log.warning(
            "%s no publica mascara anotada; el recorte sale del centro", sitio.id
        )

    ruta_img = descargar(sitio, "image")
    log.info("abriendo %s (%s)", ruta_img.name, sitio.id)
    imagen = Image.open(ruta_img).convert("RGB")

    lado = min(args.lado, *imagen.size)
    if etiqueta is not None:
        x, y = elegir_recorte(etiqueta, lado, args.encuadre)
    else:
        x, y = (imagen.size[0] - lado) // 2, (imagen.size[1] - lado) // 2

    rgb = np.array(imagen.crop((x, y, x + lado, y + lado)))
    del imagen
    anotacion = etiqueta[y : y + lado, x : x + lado] if etiqueta is not None else None

    checkpoint = m.descargar_checkpoint()
    seg = m.cargar(checkpoint, hilos=args.hilos)
    prediccion = segmentar(seg, rgb)

    lienzo, cifras = componer(
        rgb, prediccion, anotacion, sitio, x, y, args.ancho_panel, args.con_leyenda
    )
    args.salida.mkdir(parents=True, exist_ok=True)
    nombre = f"{sitio.id}-{args.encuadre}"
    destino = args.salida / f"{nombre}.png"
    lienzo.save(destino, optimize=True)

    meta = {
        "sitio": sitio.id,
        "imagen": f"/eldor/{nombre}.png",
        "encuadre": "frontera bosque/mina"
        if args.frontera
        else "maxima actividad minera",
        "con_anotacion": anotacion is not None,
        "recorte_px": [x, y, lado, lado],
        "fecha_captura": sitio.fecha,
        "resolucion_m_px": sitio.resolucion_m,
        "crs": "EPSG:32719",
        "modelo": "SegFormer MiT-B2 - segformer_b2_baseline2_augv2_weighted_ce_dice",
        **cifras,
    }
    (args.salida / f"{nombre}.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    log.info("escrito %s (%s)", destino, json.dumps(cifras, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
