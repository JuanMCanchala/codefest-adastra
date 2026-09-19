"""Lectura del corpus de la Etapa 1: documentos, fragmentos, fechas e idioma."""

from __future__ import annotations

import json
import re
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

from langdetect import DetectorFactory, LangDetectException, detect

DetectorFactory.seed = 0

IDIOMAS = ("es", "en", "pt")
CLAVES_FECHA = ("date", "published_at", "published", "fecha", "fecha_emision", "datePublished")
CLAVES_TITULO = ("title", "titulo", "headline", "name")
CHARS_IDIOMA = 1500

RE_FECHA_ISO = re.compile(r"(\d{4})-(\d{2})-(\d{2})")
RE_FECHA_NOMBRE = re.compile(r"(?<!\d)(\d{4})[-_](\d{2})[-_](\d{2})(?!\d)")
RE_ANIO_NOMBRE = re.compile(r"(?<!\d)(19[89]\d|20[0-2]\d)(?!\d)")


@dataclass
class Corpus:
    """Todo lo que el resto del pipeline necesita del corpus de la Etapa 1."""

    documentos: dict[str, dict] = field(default_factory=dict)
    fragmentos: list[tuple[int, str, int, int]] = field(default_factory=list)
    doc_por_chunk: dict[int, str] = field(default_factory=dict)
    primer_chunk: dict[str, int] = field(default_factory=dict)
    textos: dict[str, list[tuple[int, str]]] = field(default_factory=dict)

    def doc_por_fuente(self, sufijo: str) -> str | None:
        for doc_id, doc in self.documentos.items():
            if doc["fuente"].endswith(sufijo):
                return doc_id
        return None

    def docs_de_organizacion(self, organizacion: str) -> dict[str, dict]:
        return {k: v for k, v in self.documentos.items() if v["organizacion"] == organizacion}


def _normalizar_fecha(valor) -> str | None:
    """Devuelve YYYY-MM-DD si el valor contiene una fecha ISO reconocible."""
    if not isinstance(valor, str):
        return None
    m = RE_FECHA_ISO.search(valor)
    if not m:
        return None
    anio, mes, dia = (int(g) for g in m.groups())
    if not (1900 <= anio <= 2100 and 1 <= mes <= 12 and 1 <= dia <= 31):
        return None
    return f"{anio:04d}-{mes:02d}-{dia:02d}"


def _campos_json(ruta: Path) -> tuple[str | None, str | None]:
    """Extrae (fecha, titulo) de un JSON de artículo; tolera formatos inesperados."""
    try:
        with ruta.open(encoding="utf-8") as fh:
            datos = json.load(fh)
    except (OSError, ValueError):
        return None, None
    if not isinstance(datos, dict):
        return None, None
    fecha = None
    for clave in CLAVES_FECHA:
        fecha = _normalizar_fecha(datos.get(clave))
        if fecha:
            break
    meta = datos.get("alerta_meta")
    if fecha is None and isinstance(meta, dict):
        fecha = _normalizar_fecha(meta.get("fecha_emision"))
    titulo = None
    for clave in CLAVES_TITULO:
        valor = datos.get(clave)
        if isinstance(valor, str) and valor.strip():
            titulo = valor.strip()
            break
    if isinstance(meta, dict) and meta.get("codigo"):
        titulo = f"Alerta Temprana {meta['codigo']} ({meta.get('tipo') or 's. t.'})"
    return fecha, titulo


def _fecha_de_nombre(nombre: str) -> tuple[str | None, int | None]:
    m = RE_FECHA_NOMBRE.search(nombre)
    if m:
        fecha = _normalizar_fecha("-".join(m.groups()))
        if fecha:
            return fecha, int(m.group(1))
    anios = RE_ANIO_NOMBRE.findall(nombre)
    if anios:
        return None, int(anios[-1])
    return None, None


def titulos_inventario(ruta: Path) -> dict[str, str]:
    """Mapa nombre_de_archivo -> nombre estandarizado del Índice de Datos de ADL."""
    import openpyxl

    libro = openpyxl.load_workbook(ruta, data_only=True, read_only=True)
    if "Inventario de Archivos" not in libro.sheetnames:
        return {}
    hoja = libro["Inventario de Archivos"]
    filas = hoja.iter_rows(min_row=2, values_only=True)
    mapa = {}
    for fila in filas:
        nombre = fila[4] if len(fila) > 4 else None
        if isinstance(nombre, str) and nombre.strip():
            mapa[nombre.strip()] = nombre.strip()
    libro.close()
    return mapa


def _detectar_idioma(muestra: str) -> str | None:
    if len(muestra.strip()) < 40:
        return None
    try:
        codigo = detect(muestra)
    except LangDetectException:
        return None
    return codigo if codigo in IDIOMAS else None


def _recorrer_metadata(ruta: Path, con_texto: set[str], corpus: Corpus) -> dict[str, str]:
    """Recorre metadata.jsonl una sola vez y llena fragmentos, índices y muestras."""
    muestras: dict[str, list[str]] = defaultdict(list)
    largos: dict[str, int] = defaultdict(int)
    with ruta.open(encoding="utf-8") as fh:
        for linea in fh:
            if not linea.strip():
                continue
            reg = json.loads(linea)
            doc_id = reg["doc_id"]
            chunk_id = int(reg["chunk_id"])
            posicion = int(reg["posicion"])
            corpus.fragmentos.append((chunk_id, doc_id, posicion, int(reg["num_tokens"])))
            corpus.doc_por_chunk[chunk_id] = doc_id
            if doc_id not in corpus.primer_chunk:
                corpus.primer_chunk[doc_id] = chunk_id
            texto = reg.get("texto") or ""
            if largos[doc_id] < CHARS_IDIOMA:
                muestras[doc_id].append(texto[:CHARS_IDIOMA])
                largos[doc_id] += len(texto)
            if doc_id in con_texto:
                corpus.textos.setdefault(doc_id, []).append((chunk_id, texto))
    return {doc_id: " ".join(partes)[:CHARS_IDIOMA] for doc_id, partes in muestras.items()}


def cargar_corpus(
    metadata: Path, docs: Path, corpus_dir: Path, inventario: Path, con_texto: set[str]
) -> Corpus:
    """Construye el Corpus a partir de metadata.jsonl, docs.jsonl y los archivos originales."""
    corpus = Corpus()
    with docs.open(encoding="utf-8") as fh:
        registros = [json.loads(linea) for linea in fh if linea.strip()]

    nombres = titulos_inventario(inventario) if inventario.exists() else {}

    for reg in registros:
        fuente = reg["fuente"]
        partes = fuente.split("/")
        corpus.documentos[reg["doc_id"]] = {
            "doc_id": reg["doc_id"],
            "fuente": fuente,
            "fenomeno": int(reg["fenomeno"]),
            "organizacion": partes[1] if len(partes) > 1 else None,
            "formato": reg.get("formato"),
            "archivo": partes[-1],
            "titulo": None,
            "fecha": None,
            "anio": None,
            "fecha_origen": None,
            "idioma": None,
            "n_fragmentos": 0,
        }

    muestras = _recorrer_metadata(metadata, con_texto, corpus)
    for chunk in corpus.fragmentos:
        doc = corpus.documentos.get(chunk[1])
        if doc is not None:
            doc["n_fragmentos"] += 1

    for doc in corpus.documentos.values():
        _completar_documento(doc, corpus_dir, nombres, muestras.get(doc["doc_id"], ""))
    return corpus


def _completar_documento(
    doc: dict, corpus_dir: Path, nombres: dict[str, str], muestra: str
) -> None:
    fecha = titulo = None
    if doc["formato"] == "json":
        fecha, titulo = _campos_json(corpus_dir / doc["fuente"])
    if fecha:
        doc["fecha"] = fecha
        doc["anio"] = int(fecha[:4])
        doc["fecha_origen"] = "alerta" if "/alertas/" in doc["fuente"] else "metadata_json"
    else:
        fecha_nombre, anio = _fecha_de_nombre(doc["archivo"])
        if fecha_nombre or anio:
            doc["fecha"] = fecha_nombre
            doc["anio"] = anio
            doc["fecha_origen"] = "nombre_archivo"
    doc["titulo"] = titulo or nombres.get(doc["archivo"]) or doc["archivo"]
    doc["idioma"] = _detectar_idioma(muestra)


def filas_documentos(corpus: Corpus) -> list[tuple]:
    columnas = (
        "doc_id",
        "fenomeno",
        "organizacion",
        "formato",
        "titulo",
        "fecha",
        "anio",
        "fecha_origen",
        "idioma",
        "n_fragmentos",
    )
    return [tuple(doc[col] for col in columnas) for doc in corpus.documentos.values()]
