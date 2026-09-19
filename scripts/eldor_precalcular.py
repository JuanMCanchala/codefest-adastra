"""Corre el segmentador ELDOR sobre un ortomosaico y escribe la evidencia trazable.

El resultado es un JSON por sitio en `agent/datos/eldor/`, con el área en hectáreas de
cada clase, el bloque de procedencia (sitio, CRS, bbox, fecha de vuelo) y —cuando el
sitio trae máscara de referencia— el IoU por clase medido contra ella. El agente solo
lee ese JSON: no ejecuta el modelo en tiempo de respuesta, así que la latencia del chat
no cambia y las cifras son reproducibles.

Uso:
    python scripts/eldor_precalcular.py Anel
    python scripts/eldor_precalcular.py Anel ElEngano --hilos 8
    python scripts/eldor_precalcular.py --todos-test
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
from app.eldor.sitios import CLASES, SITIOS, Sitio

REPO_DATOS = "IRSC/ELDOR"
# Igual que los pesos: se fija la revisión para que las áreas sean reproducibles.
REVISION_DATOS = "def7a5eecd5de016825cca9c356f2cc12ca059a7"
SALIDA = RAIZ / "agent" / "datos" / "eldor"
log = logging.getLogger("eldor")


def descargar_imagen(sitio: Sitio, cual: str) -> pathlib.Path | None:
    """Baja `image` o `label` del sitio. Devuelve None si el split no lo publica."""
    from huggingface_hub import hf_hub_download
    from huggingface_hub.errors import EntryNotFoundError

    try:
        ruta = hf_hub_download(
            repo_id=REPO_DATOS,
            repo_type="dataset",
            filename=f"{sitio.particion}/{cual}/{sitio.id}.png",
            revision=REVISION_DATOS,
        )
    except EntryNotFoundError:
        return None
    return pathlib.Path(ruta)


def segmentar_sitio(seg: m.Segmentador, ruta_img: pathlib.Path, sitio: Sitio):
    """Barre el ortomosaico en tiles de 512 y acumula el conteo de píxeles por clase."""
    import numpy as np
    from PIL import Image

    Image.MAX_IMAGE_PIXELS = None
    imagen = Image.open(ruta_img).convert("RGB")
    ancho, alto = imagen.size
    lado = m.LADO_TILE
    conteo = np.zeros(len(CLASES), dtype=np.int64)
    predicciones: dict[tuple[int, int], np.ndarray] = {}

    tiles_x = (ancho + lado - 1) // lado
    tiles_y = (alto + lado - 1) // lado
    total = tiles_x * tiles_y
    log.info("%s: %dx%d px -> %d tiles", sitio.id, ancho, alto, total)

    hecho, t0 = 0, time.perf_counter()
    for ty in range(tiles_y):
        for tx in range(tiles_x):
            x, y = tx * lado, ty * lado
            recorte = imagen.crop((x, y, min(x + lado, ancho), min(y + lado, alto)))
            arr = np.array(recorte)
            # El borde derecho e inferior queda incompleto: se rellena para que el
            # modelo reciba 512x512 y luego se recorta el relleno del resultado.
            alto_r, ancho_r = arr.shape[:2]
            if (alto_r, ancho_r) != (lado, lado):
                relleno = np.zeros((lado, lado, 3), dtype=arr.dtype)
                relleno[:alto_r, :ancho_r] = arr
                arr = relleno
            pred = seg.predecir_tile(arr)[:alto_r, :ancho_r]
            predicciones[(x, y)] = pred
            conteo += np.bincount(pred.ravel(), minlength=len(CLASES))[: len(CLASES)]
            hecho += 1
            if hecho % 100 == 0 or hecho == total:
                transcurrido = time.perf_counter() - t0
                log.info(
                    "  %d/%d tiles (%.0f s, %.2f s/tile)",
                    hecho,
                    total,
                    transcurrido,
                    transcurrido / hecho,
                )
    return conteo, predicciones, (ancho, alto)


def iou_contra_referencia(predicciones, ruta_lbl: pathlib.Path, dimensiones) -> dict:
    """IoU por clase entre la predicción y la máscara anotada del sitio."""
    import numpy as np
    from PIL import Image

    Image.MAX_IMAGE_PIXELS = None
    etiqueta = np.array(Image.open(ruta_lbl))
    ancho, alto = dimensiones
    if etiqueta.shape[:2] != (alto, ancho):
        log.warning(
            "la máscara (%s) no coincide con el ortomosaico (%s); se omite el IoU",
            etiqueta.shape[:2],
            (alto, ancho),
        )
        return {}

    interseccion = np.zeros(len(CLASES), dtype=np.int64)
    union = np.zeros(len(CLASES), dtype=np.int64)
    aciertos = vistos = 0
    for (x, y), pred in predicciones.items():
        real = etiqueta[y : y + pred.shape[0], x : x + pred.shape[1]]
        aciertos += int((pred == real).sum())
        vistos += real.size
        for c in range(len(CLASES)):
            pc, rc = pred == c, real == c
            interseccion[c] += int((pc & rc).sum())
            union[c] += int((pc | rc).sum())
    por_clase = {
        CLASES[c]: round(float(interseccion[c] / union[c]), 4)
        for c in range(len(CLASES))
        if union[c] > 0
    }
    presentes = list(por_clase.values())
    return {
        "iou_por_clase": por_clase,
        "miou_presentes": round(float(sum(presentes) / len(presentes)), 4)
        if presentes
        else None,
        "exactitud_pixel": round(aciertos / vistos, 4) if vistos else None,
    }


def procesar(seg: m.Segmentador, sitio: Sitio) -> dict:
    ruta_img = descargar_imagen(sitio, "image")
    if ruta_img is None:
        raise SystemExit(f"{sitio.id}: el dataset no publica la imagen de este sitio")
    conteo, predicciones, dimensiones = segmentar_sitio(seg, ruta_img, sitio)

    total_px = int(conteo.sum())
    areas = {
        CLASES[c]: round(sitio.hectareas(int(conteo[c])), 4)
        for c in range(len(CLASES))
        if conteo[c] > 0
    }
    registro = {
        "procedencia": sitio.procedencia(),
        "modelo": {
            "repo": m.REPO_CHECKPOINT,
            "checkpoint": m.RUTA_CHECKPOINT,
            "arquitectura": "SegFormer MiT-B2",
            "base": m.MODELO_BASE,
            "tile_px": m.LADO_TILE,
        },
        "cobertura": {
            "pixeles_evaluados": total_px,
            "area_total_ha": round(sitio.hectareas(total_px), 4),
            "area_por_clase_ha": areas,
        },
    }
    ruta_lbl = descargar_imagen(sitio, "label")
    if ruta_lbl is not None:
        registro["validacion"] = iou_contra_referencia(
            predicciones, ruta_lbl, dimensiones
        )
    return registro


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("sitios", nargs="*", help="ids de sitio; por defecto, los de test")
    p.add_argument(
        "--todos-test", action="store_true", help="procesa la partición de test"
    )
    p.add_argument(
        "--hilos", type=int, default=4, help="hilos de torch para la inferencia"
    )
    args = p.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
    elegidos = args.sitios or [s.id for s in SITIOS.values() if s.particion == "test"]
    desconocidos = [s for s in elegidos if s not in SITIOS]
    if desconocidos:
        raise SystemExit(f"sitios desconocidos: {desconocidos}")

    log.info("descargando el checkpoint ELDOR…")
    seg = m.cargar(m.descargar_checkpoint(), hilos=args.hilos)
    SALIDA.mkdir(parents=True, exist_ok=True)

    for sid in elegidos:
        destino = SALIDA / f"{sid}.json"
        if destino.exists():
            log.info("%s ya estaba calculado; se omite", sid)
            continue
        registro = procesar(seg, SITIOS[sid])
        destino.write_text(
            json.dumps(registro, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        log.info("escrito %s", destino)


if __name__ == "__main__":
    main()
