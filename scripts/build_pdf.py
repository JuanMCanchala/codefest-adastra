"""Compila la investigación de docs/investigacion/ en un único PDF.

Uso: python scripts/build_pdf.py
Requiere el paquete `markdown` y Google Chrome (impresión headless a PDF).
"""

from __future__ import annotations

import datetime as dt
import html
import re
import subprocess
import sys
from pathlib import Path

import markdown

RAIZ = Path(__file__).resolve().parents[1]
INV = RAIZ / "docs" / "investigacion"
SALIDA = RAIZ / "docs" / "Investigacion_CODEFEST_AD_ASTRA_2026.pdf"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")

# (título de la parte, archivos en orden). Los archivos ausentes se omiten.
PARTES = [
    ("Síntesis", ["sintesis.md"]),
    ("Contraste con la especificación oficial de la Etapa 2", [
        "contraste_especificacion.md", "base_sql_adl.md",
    ]),
    ("Subfenómenos diferenciales (factor wow)", ["subfenomenos_wow.md"]),
    ("Análisis transversal del corpus y del jurado", [
        "transversal/README.md", "transversal/preguntas_jurado.md",
        "transversal/inventario_corpus.md", "transversal/indice_datos.md",
        "transversal/datos_graficables.md", "transversal/conexiones.md",
    ]),
    ("Fenómeno 1 · IA y Capacidades Estratégicas", [
        "f1_ia_capacidades/README.md", "claude/f1_ia_capacidades_web.md",
        "f1_ia_capacidades/cifras_clave.md", "f1_ia_capacidades/global.md",
        "f1_ia_capacidades/regional.md", "f1_ia_capacidades/colombia.md",
        "f1_ia_capacidades/riesgos.md",
        "f1_ia_capacidades/fuentes_corpus.md", "f1_ia_capacidades/preguntas.md",
    ]),
    ("Fenómeno 2 · Seguridad del Entorno Espacial", [
        "f2_seguridad_espacial/README.md", "claude/f2_seguridad_espacial_web.md",
        "f2_seguridad_espacial/cifras_clave.md", "f2_seguridad_espacial/global.md",
        "f2_seguridad_espacial/regional.md", "f2_seguridad_espacial/colombia.md",
        "f2_seguridad_espacial/fuentes_corpus.md", "f2_seguridad_espacial/preguntas.md",
    ]),
    ("Fenómeno 3 · Dinámicas Territoriales y Amenazas Regionales", [
        "f3_amenazas_regionales/README.md", "claude/f3_amenazas_regionales_web.md",
        "f3_amenazas_regionales/cifras_clave.md", "f3_amenazas_regionales/global.md",
        "f3_amenazas_regionales/regional.md", "f3_amenazas_regionales/colombia.md",
        "f3_amenazas_regionales/fuentes_corpus.md", "f3_amenazas_regionales/preguntas.md",
    ]),
    ("Conversación en redes y soluciones en construcción", ["social_listening.md"]),
    ("Estado del arte científico", [
        "papers_rag_multiagente.md", "papers_visual_dominio.md",
    ]),
    ("Anexo · Arquitectura de la solución", [
        "arquitectura_empresarial.md", "worldmonitor_datos_agentes.md",
        "reincorporados_copyleft.md", "modelo_local.md",
        "proyectos_referencia.md",
        "repos_utiles.md",
        "arquitectura_multiagente.md", "analitica_visual_agente.md",
    ]),
]

CSS = """
@page { size: A4; margin: 18mm 16mm 20mm 16mm; }
body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 10pt; line-height: 1.45;
       color: #1d2330; }
h1, h2, h3, h4 { color: #0d2a4d; line-height: 1.2; break-after: avoid; }
h1 { font-size: 17pt; border-bottom: 2px solid #c8102e; padding-bottom: 4px; margin-top: 18px; }
h2 { font-size: 13.5pt; margin-top: 16px; }
h3 { font-size: 11.5pt; }
h4 { font-size: 10.5pt; }
.parte { break-before: page; font-size: 22pt; color: #fff; background: #0d2a4d; padding: 28px 22px;
         border-left: 10px solid #c8102e; margin: 0 0 12px 0; }
.doc { break-before: page; }
.origen { font-size: 8pt; color: #6b7280; margin: 0 0 6px 0; }
table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 8.4pt;
        break-inside: auto; }
tr { break-inside: avoid; }
th, td { border: 1px solid #cfd6e0; padding: 3px 5px; vertical-align: top; text-align: left;
         overflow-wrap: anywhere; }
th { background: #e8eef6; }
code { font-family: Consolas, monospace; font-size: 8.5pt; background: #f2f4f7; padding: 0 2px; }
pre { background: #f2f4f7; padding: 6px; white-space: pre-wrap; font-size: 8pt; }
a { color: #0b5cad; text-decoration: none; overflow-wrap: anywhere; }
blockquote { border-left: 3px solid #c8102e; margin: 6px 0; padding: 2px 10px; color: #374151; }
.portada { height: 250mm; display: flex; flex-direction: column; justify-content: center; }
.portada h1 { font-size: 30pt; border: none; margin: 0; }
.portada .sub { font-size: 15pt; color: #c8102e; margin: 8px 0 30px 0; }
.portada p { font-size: 11pt; }
.toc li { margin: 2px 0; }
"""


def md_a_html(texto: str) -> str:
    return markdown.markdown(texto, extensions=["tables", "fenced_code", "sane_lists"])


def main() -> int:
    if not CHROME.exists():
        print(f"No se encontró Chrome en {CHROME}", file=sys.stderr)
        return 1
    hoy = dt.date.today().isoformat()
    cuerpo, indice, faltantes = [], [], []
    for n, (titulo, archivos) in enumerate(PARTES, 1):
        presentes = [a for a in archivos if (INV / a).exists()]
        faltantes += [a for a in archivos if a not in presentes]
        if not presentes:
            continue
        indice.append(f"<li><b>{html.escape(titulo)}</b></li>")
        cuerpo.append(f'<div class="parte">{n}. {html.escape(titulo)}</div>')
        for i, a in enumerate(presentes):
            texto = (INV / a).read_text(encoding="utf-8")
            clase = "" if i == 0 else ' class="doc"'
            cuerpo.append(f'<section{clase}><p class="origen">Archivo: docs/investigacion/{a}</p>'
                          f"{md_a_html(texto)}</section>")
    portada = (
        '<div class="portada"><h1>CODEFEST AD ASTRA 2026</h1>'
        '<div class="sub">Investigación de los fenómenos de interés · Final</div>'
        "<p>F1 · IA y Capacidades Estratégicas<br>F2 · Seguridad del Entorno Espacial<br>"
        "F3 · Dinámicas Territoriales y Amenazas Regionales</p>"
        f"<p>Fuerza Aeroespacial Colombiana · Universidad de los Andes<br>Compilado el {hoy}</p>"
        '<h2>Contenido</h2><ol class="toc">' + "".join(indice) + "</ol></div>"
    )
    doc = (f'<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Investigación '
           f"CODEFEST AD ASTRA 2026</title><style>{CSS}</style></head><body>{portada}"
           + "".join(cuerpo) + "</body></html>")
    # Chrome no resuelve rutas relativas de los enlaces internos; no hacen falta en el PDF.
    doc = re.sub(r'href="(?!https?:|mailto:|#)[^"]*"', 'href="#"', doc)
    tmp = SALIDA.with_suffix(".html")
    tmp.write_text(doc, encoding="utf-8")
    subprocess.run([str(CHROME), "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={SALIDA}", tmp.as_uri()], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    tmp.unlink()
    if faltantes:
        print("Omitidos (no existen):", ", ".join(faltantes))
    print(f"PDF: {SALIDA} ({SALIDA.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
