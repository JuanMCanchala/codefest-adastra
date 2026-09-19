"""Fichas de alertas tempranas y CSV georreferenciado de Amazon Underworld."""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path

from geo import normalizar

ECONOMIAS = {
    "narcotrafico",
    "contrabando",
    "mineria ilegal",
    "prestamos gota a gota",
    "tala ilegal",
}
PREFIJOS_TERRITORIO = (
    "veredas",
    "resguardos",
    "consejos",
    "corregimientos",
    "barrios",
    "comunas",
    "localidades",
    "zonas",
)
RE_CODIGOS = re.compile(r"^[\d\s\-;\.]+$")
RE_OTROS = re.compile(r"\s*(\.{2,}|…)\s*y\s+otros\s*$", re.IGNORECASE)
RE_DPTO = re.compile(r"^(?P<mpios>.+?)\s*\((?P<dpto>[^)]+)\)\s*$")
RE_FILA_CSV = re.compile(
    r"tile_zoom:\s*(\d+)\s*\|\s*tile_x:\s*(\d+)\s*\|\s*tile_y:\s*(\d+)\s*\|\s*fid:\s*(\d+)"
)

COLUMNAS_ALERTAS = (
    "codigo",
    "doc_id",
    "chunk_id",
    "tipo",
    "fecha",
    "anio",
    "departamento",
    "municipio",
    "divipola_mpio",
    "divipola_dpto",
    "grupos_armados",
    "economias_ilicitas",
    "poblaciones",
)

COLUMNAS_AMAZONIA = (
    "clave",
    "fid",
    "pais",
    "nivel1",
    "nivel2",
    "adm1_pcode",
    "adm2_pcode",
    "area_km2",
    "poblacion",
    "con_presencia",
    "sin_informacion",
    "total_grupos",
    "grupos_detalle",
    "grupo_emc",
    "grupo_embf",
    "grupo_eln",
    "grupo_cdf_agc",
    "grupo_seg_marq",
    "grupo_los_lobos",
    "grupo_los_choneros",
    "grupo_cv",
    "grupo_pcc",
    "grupo_otros",
    "divipola_mpio",
    "divipola_dpto",
    "doc_id",
    "chunk_id",
)

GRUPOS_CSV = (
    ("grupo_emc", "grupo_EMC"),
    ("grupo_embf", "grupo_EMBF"),
    ("grupo_eln", "grupo_ELN"),
    ("grupo_cdf_agc", "grupo_CDF_AGC"),
    ("grupo_seg_marq", "grupo_Seg_Marquetalia"),
    ("grupo_los_lobos", "grupo_Los_Lobos"),
    ("grupo_los_choneros", "grupo_Los_Choneros"),
    ("grupo_cv", "grupo_CV"),
    ("grupo_pcc", "grupo_PCC"),
    ("grupo_otros", "grupo_Others"),
)


def _clasificar_parrafos(parrafos: list[str], tema_clave: str) -> dict[str, str | None]:
    """Reparte los párrafos de la ficha en grupos armados, economías ilícitas y poblaciones."""
    campos: dict[str, str | None] = {
        "grupos_armados": None,
        "economias_ilicitas": None,
        "poblaciones": None,
    }
    for crudo in parrafos:
        parrafo = (crudo or "").strip()
        if not parrafo or parrafo == (tema_clave or "").strip():
            continue
        if normalizar(parrafo).split(" ")[0] in PREFIJOS_TERRITORIO:
            continue
        if RE_CODIGOS.match(parrafo):
            continue
        if ";" in parrafo:
            items = [t.strip() for t in parrafo.split(";") if t.strip()]
            if items and all(normalizar(t) in ECONOMIAS for t in items):
                campos["economias_ilicitas"] = "; ".join(items)
            else:
                campos["poblaciones"] = "; ".join(items)
        elif campos["grupos_armados"] is None:
            campos["grupos_armados"] = parrafo
    return campos


def _separar_municipios(texto: str, resolver) -> list[tuple[str, str | None]]:
    """'Curillo, Solita (Caquetá); Piamonte (Cauca)' -> [(municipio, departamento), ...]

    Respeta los nombres que llevan coma ('Bogotá, D.C.') porque intenta primero el bloque
    completo contra el listado DIVIPOLA y sólo lo separa por comas si no empareja.
    """
    salida: list[tuple[str, str | None]] = []
    for crudo in (texto or "").split(";"):
        bloque = RE_OTROS.sub("", crudo).strip()
        if not bloque:
            continue
        m = RE_DPTO.match(bloque)
        departamento = m.group("dpto").strip() if m else None
        cuerpo = (m.group("mpios") if m else bloque).strip()
        if "," not in cuerpo or resolver(cuerpo, departamento)[0] is not None:
            salida.append((cuerpo, departamento))
        else:
            salida.extend((p.strip(), departamento) for p in cuerpo.split(",") if p.strip())
    return salida


def _divipola(
    municipio: str, departamento: str | None, por_par: dict, unicos: dict
) -> tuple[str | None, str | None]:
    clave_mpio = normalizar(municipio)
    codigo = None
    if departamento:
        codigo = por_par.get((normalizar(departamento), clave_mpio))
    if codigo is None:
        codigo = unicos.get(clave_mpio)
    return (codigo, codigo[:2]) if codigo else (None, None)


def _chunk_de_alerta(
    textos: list[tuple[int, str]], municipios: list[str], por_defecto: int
) -> int:
    claves = [normalizar(m) for m in municipios if m]
    for chunk_id, texto in textos:
        normalizado = normalizar(texto)
        if any(clave and clave in normalizado for clave in claves):
            return chunk_id
    return por_defecto


def filas_alertas(directorio: Path, corpus, por_par: dict, unicos: dict) -> tuple[list[tuple], int]:
    """Una fila por alerta x municipio, con doc_id y chunk_id del corpus."""
    por_archivo = {doc["archivo"]: doc_id for doc_id, doc in corpus.documentos.items()}
    filas: list[tuple] = []
    sin_codigo = 0
    for ruta in sorted(directorio.glob("*.json")):
        doc_id = por_archivo.get(ruta.name)
        if doc_id is None:
            continue
        with ruta.open(encoding="utf-8") as fh:
            ficha = json.load(fh)
        meta = ficha.get("alerta_meta") or {}
        codigo = (meta.get("codigo") or "").strip()
        if not codigo:
            continue
        campos = _clasificar_parrafos(ficha.get("body_paragraphs") or [], meta.get("tema_clave"))
        fecha = corpus.documentos[doc_id]["fecha"]
        anio = corpus.documentos[doc_id]["anio"]
        pares = _separar_municipios(
            meta.get("municipios") or "",
            lambda mpio, dpto: _divipola(mpio, dpto, por_par, unicos),
        )
        textos = corpus.textos.get(doc_id, [])
        chunk_id = _chunk_de_alerta(
            textos, [m for m, _ in pares], corpus.primer_chunk.get(doc_id, -1)
        )
        if chunk_id < 0:
            continue
        for municipio, departamento in pares or [("", None)]:
            mpio_cod, dpto_cod = _divipola(municipio, departamento, por_par, unicos)
            if mpio_cod is None:
                sin_codigo += 1
            filas.append(
                (
                    codigo,
                    doc_id,
                    chunk_id,
                    meta.get("tipo"),
                    fecha,
                    anio,
                    departamento or "",
                    municipio,
                    mpio_cod,
                    dpto_cod,
                    campos["grupos_armados"],
                    campos["economias_ilicitas"],
                    campos["poblaciones"],
                )
            )
    return filas, sin_codigo


def _entero(valor: str) -> int | None:
    try:
        return int(float(valor))
    except (TypeError, ValueError):
        return None


def _real(valor: str) -> float | None:
    try:
        return float(valor)
    except (TypeError, ValueError):
        return None


def _si_no(valor: str) -> int | None:
    texto = (valor or "").strip().upper()
    if texto in {"SI", "SÍ", "YES", "1"}:
        return 1
    if texto in {"NO", "0"}:
        return 0
    return None


def _indice_chunks_csv(textos: list[tuple[int, str]]) -> dict[tuple[str, str, str, str], int]:
    indice: dict[tuple[str, str, str, str], int] = {}
    for chunk_id, texto in textos:
        for coincidencia in RE_FILA_CSV.finditer(texto):
            indice.setdefault(coincidencia.groups(), chunk_id)
    return indice


def _completitud(fila: dict) -> int:
    return sum(1 for valor in fila.values() if (valor or "").strip())


def filas_amazonia(
    ruta_csv: Path, corpus, municipios: dict[str, dict]
) -> tuple[list[tuple], int, int]:
    """Deduplica el CSV por unidad territorial y ancla cada fila a un chunk_id."""
    doc_id = corpus.doc_por_fuente("AMAZONUW_amazonunderworld-data.csv")
    if doc_id is None:
        return [], 0, 0
    with ruta_csv.open(encoding="utf-8-sig", newline="") as fh:
        crudas = list(csv.DictReader(fh))
    mejores: dict[str, dict] = {}
    for fila in crudas:
        clave = fila.get("b_ADM2_PCODE") or f"fid-{fila.get('fid')}"
        actual = mejores.get(clave)
        if actual is None or _completitud(fila) > _completitud(actual):
            mejores[clave] = fila

    indice = _indice_chunks_csv(corpus.textos.get(doc_id, []))
    por_defecto = corpus.primer_chunk.get(doc_id, -1)
    filas: list[tuple] = []
    sin_chunk = 0
    sin_divipola = 0
    for clave, fila in sorted(mejores.items()):
        llave = (fila["tile_zoom"], fila["tile_x"], fila["tile_y"], fila["fid"])
        chunk_id = indice.get(llave, por_defecto)
        if chunk_id == por_defecto and llave not in indice:
            sin_chunk += 1
        pcode = (fila.get("b_ADM2_PCODE") or "").strip()
        mpio_cod = dpto_cod = None
        if pcode.startswith("CO") and pcode[2:].isdigit():
            candidato = pcode[2:].zfill(5)
            if candidato in municipios:
                mpio_cod, dpto_cod = candidato, candidato[:2]
            else:
                sin_divipola += 1
        filas.append(
            (
                clave,
                _entero(fila.get("fid")),
                fila.get("au_country") or None,
                fila.get("au_level1") or fila.get("b_ADM1_ES") or None,
                fila.get("au_level2") or fila.get("b_ADM2_ES") or None,
                fila.get("b_ADM1_PCODE") or None,
                pcode or None,
                _real(fila.get("au_area_km2")),
                _entero(fila.get("au_population")),
                _si_no(fila.get("au_invest_with_presence")),
                _si_no(fila.get("au_no_info")),
                _entero(fila.get("total_grupos_presentes")),
                fila.get("grupos_detalle_ES") or None,
                *[_si_no(fila.get(origen)) for _, origen in GRUPOS_CSV],
                mpio_cod,
                dpto_cod,
                doc_id,
                chunk_id,
            )
        )
    return filas, sin_chunk, sin_divipola
