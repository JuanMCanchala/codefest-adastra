"""Carga del checkpoint ELDOR de segmentación y barrido por tiles.

El checkpoint elegido es `segformer_b2_baseline2_augv2_weighted_ce_dice` de
`IRSC/ELDOR-checkpoints`: SegFormer MiT-B2 (27,4 M de parámetros) con pérdida
`weighted_ce+dice`, el mejor `test_miou_present` del benchmark ELDOR (0,4010) entre los
modelos que corren en CPU a un costo razonable.

Dos detalles del checkpoint que no están documentados en el repositorio de origen y que
hubo que deducir midiendo (ver `docs/investigacion/03_arquitectura/deteccion_satelital_eldor.md`):

1. **Nomenclatura de claves.** Se entrenó con `transformers` 4.x. La versión 5.x renombró
   el árbol de SegFormer (`segformer.encoder.block.{s}.{b}` → `segformer.stages.{s}.blocks.{b}`,
   `mlp.dense1` → `mlp.fc1`, `attention.self.query` → `attention.q_proj`, …). Sin el
   remapeo, `load_state_dict(strict=False)` descarta las 372 claves en silencio y el
   modelo predice con pesos aleatorios.
2. **Desfase de clases.** El head tiene 14 salidas para las etiquetas canónicas **1..14**;
   `0=Background` se entrena como `ignore_index`. El índice `i` del `argmax` corresponde a
   la clase canónica `i + 1`. Sin el desplazamiento la exactitud por píxel cae a 0,007.
"""

from __future__ import annotations

import logging
import os
import pathlib
import re
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover - solo para anotaciones
    import numpy as np

log = logging.getLogger(__name__)

REPO_CHECKPOINT = "IRSC/ELDOR-checkpoints"
RUTA_CHECKPOINT = "segmentation/checkpoints/segformer_b2_baseline2_augv2_weighted_ce_dice/best.pt"
MODELO_BASE = "nvidia/segformer-b2-finetuned-ade-512-512"
# Revisiones fijas: sin esto, el Hub sirve lo que haya en `main` y una actualización
# silenciosa del repositorio cambiaría los pesos bajo los pies de las cifras publicadas.
REVISION_CHECKPOINT = "52b79605717a144f5e80ead3cbf0965d3dc510a8"
REVISION_BASE = "de01bae28967510f9ddd496c60a969357195400c"
NUM_CLASES = 14
LADO_TILE = 512

# Normalización ImageNet, la del preprocesamiento de SegFormer en `transformers`.
MEDIA = (0.485, 0.456, 0.406)
DESVIACION = (0.229, 0.224, 0.225)

_SUSTITUCIONES = (
    (r"^segformer\.encoder\.patch_embeddings\.(\d+)\.", r"segformer.stages.\1.patch_embeddings."),
    (r"^segformer\.encoder\.layer_norm\.(\d+)\.", r"segformer.stages.\1.layer_norm."),
    (r"^segformer\.encoder\.block\.(\d+)\.(\d+)\.", r"segformer.stages.\1.blocks.\2."),
    (r"^decode_head\.linear_c\.(\d+)\.", r"decode_head.linear_projections.\1."),
)
_RENOMBRES = (
    ("attention.self.query.", "attention.q_proj."),
    ("attention.self.key.", "attention.k_proj."),
    ("attention.self.value.", "attention.v_proj."),
    ("attention.output.dense.", "attention.o_proj."),
    ("attention.self.sr.", "attention.sequence_reduction.sequence_reduction."),
    ("attention.self.layer_norm.", "attention.sequence_reduction.layer_norm."),
    ("layer_norm_1.", "layernorm_before."),
    ("layer_norm_2.", "layernorm_after."),
    ("mlp.dense1.", "mlp.fc1."),
    ("mlp.dense2.", "mlp.fc2."),
)


def remapear_claves(estado: dict) -> dict:
    """Traduce un `state_dict` de SegFormer de `transformers` 4.x al layout de 5.x."""
    salida = {}
    for clave, valor in estado.items():
        nueva = clave
        for patron, reemplazo in _SUSTITUCIONES:
            nueva = re.sub(patron, reemplazo, nueva)
        for viejo, nuevo in _RENOMBRES:
            nueva = nueva.replace(viejo, nuevo)
        salida[nueva] = valor
    return salida


@dataclass
class Segmentador:
    """Envuelve el modelo cargado. Se construye con :func:`cargar`."""

    modelo: object
    hilos: int = 4

    def predecir_tile(self, tile: np.ndarray) -> np.ndarray:
        """Segmenta un tile RGB `(512, 512, 3)` uint8 y devuelve clases canónicas 1..14."""
        import numpy as np
        import torch

        x = tile.astype(np.float32) / 255.0
        x = (x - np.asarray(MEDIA)) / np.asarray(DESVIACION)
        t = torch.from_numpy(x.transpose(2, 0, 1)).float().unsqueeze(0)
        with torch.no_grad():
            logits = self.modelo(pixel_values=t).logits
        logits = torch.nn.functional.interpolate(
            logits, size=tile.shape[:2], mode="bilinear", align_corners=False
        )
        # +1: el head predice 1..14; 0=Background es ignore_index en el entrenamiento.
        return (logits.argmax(1)[0].numpy() + 1).astype("uint8")


def descargar_checkpoint(destino: pathlib.Path | None = None) -> pathlib.Path:
    """Baja el checkpoint del Hub (~329 MB) y devuelve la ruta local cacheada."""
    from huggingface_hub import hf_hub_download

    ruta = hf_hub_download(
        repo_id=REPO_CHECKPOINT,
        filename=RUTA_CHECKPOINT,
        revision=REVISION_CHECKPOINT,
        local_dir=str(destino) if destino else None,
    )
    return pathlib.Path(ruta)


def _cargar_pesos(checkpoint: pathlib.Path) -> dict:
    """Lee el `.pt` sin ejecutar pickle arbitrario.

    ELDOR tiene cero descargas en el Hub y no está firmado, así que se carga con
    `weights_only=True`: solo tensores y las clases que se permitan de forma explícita.
    La única que hace falta es `pathlib.PosixPath`, porque el bloque `args` guarda las
    rutas del clúster donde se entrenó. Se permite por nombre (no por clase) para que en
    Windows la resuelva `WindowsPath`, ya que `PosixPath` no se puede instanciar ahí.
    """
    import torch

    torch.serialization.add_safe_globals([(pathlib.WindowsPath, "pathlib.PosixPath")])
    original = pathlib.PosixPath
    if os.name == "nt":
        pathlib.PosixPath = pathlib.WindowsPath
    try:
        return torch.load(checkpoint, map_location="cpu", weights_only=True)
    finally:
        pathlib.PosixPath = original


def cargar(checkpoint: pathlib.Path, hilos: int = 4) -> Segmentador:
    """Construye el SegFormer y le carga los pesos de ELDOR. Falla si sobra o falta una clave."""
    import torch
    from transformers import SegformerConfig, SegformerForSemanticSegmentation

    torch.set_num_threads(hilos)
    datos = _cargar_pesos(checkpoint)

    cfg = SegformerConfig.from_pretrained(
        MODELO_BASE, num_labels=NUM_CLASES, revision=REVISION_BASE
    )
    modelo = SegformerForSemanticSegmentation(cfg)
    faltantes, sobrantes = modelo.load_state_dict(remapear_claves(datos["model"]), strict=False)
    if faltantes or sobrantes:
        # Silenciar esto es exactamente el error que deja el modelo en pesos aleatorios.
        raise RuntimeError(
            f"el checkpoint no encaja con el modelo: {len(faltantes)} claves faltantes, "
            f"{len(sobrantes)} sobrantes. Primeras faltantes: {faltantes[:3]}"
        )
    modelo.eval()
    log.info(
        "checkpoint ELDOR cargado (epoch=%s, best_miou=%s)",
        datos.get("epoch"),
        datos.get("best_miou"),
    )
    return Segmentador(modelo=modelo, hilos=hilos)
