"""Tabla comparable entre dos corridas — el "terminado cuando" de la Parte 1."""

from __future__ import annotations

from eval.corrida import ResultadoCorrida, cargar


def _fmt(valor: float | None, decimales: int = 3) -> str:
    return "-" if valor is None else f"{valor:.{decimales}f}"


def imprimir_resumen(r: ResultadoCorrida) -> None:
    a = r.agregados_calidad
    print(f"=== {r.etiqueta} ({r.timestamp}) — endpoint={r.endpoint} juez={r.juez} ===")
    print(f"Calidad (n={a.n})")
    print(f"  relevancia          {_fmt(a.relevancia_media)}")
    print(f"  fidelidad           {_fmt(a.fidelidad_media)}")
    print(f"  toxicidad           {_fmt(a.toxicidad_media)}")
    print(f"  tono                {_fmt(a.tono_media)}")
    print(f"  bloque A            {_fmt(a.bloque_a_media)}")
    print("Eficiencia")
    print(f"  tokens/pregunta     {_fmt(a.tokens_promedio, 1)}")
    print(f"  interacciones/preg  {_fmt(a.interacciones_promedio, 2)}")
    print(f"  latencia media ms   {_fmt(a.latencia_media_ms, 0)}")
    print(f"  latencia p95 ms     {_fmt(a.latencia_p95_ms, 0)}")
    print("Seguridad")
    print(f"  resistencia ataques {_fmt(r.tasa_resistencia)}  (n={len(r.seguridad)})")
    print(f"  falsos positivos    {_fmt(r.tasa_falsos_positivos)}  (n={len(r.falsos_positivos)})")


def comparar(etiqueta_a: str, etiqueta_b: str) -> None:
    ra, rb = cargar(etiqueta_a), cargar(etiqueta_b)
    aa, ab = ra.agregados_calidad, rb.agregados_calidad

    filas: list[tuple[str, float | None, float | None]] = [
        ("relevancia", aa.relevancia_media, ab.relevancia_media),
        ("fidelidad", aa.fidelidad_media, ab.fidelidad_media),
        ("toxicidad", aa.toxicidad_media, ab.toxicidad_media),
        ("tono", aa.tono_media, ab.tono_media),
        ("bloque A", aa.bloque_a_media, ab.bloque_a_media),
        ("tokens/pregunta", aa.tokens_promedio, ab.tokens_promedio),
        ("interacciones/pregunta", aa.interacciones_promedio, ab.interacciones_promedio),
        ("latencia media ms", aa.latencia_media_ms, ab.latencia_media_ms),
        ("resistencia a ataques", ra.tasa_resistencia, rb.tasa_resistencia),
        ("falsos positivos", ra.tasa_falsos_positivos, rb.tasa_falsos_positivos),
    ]

    ancho = max(len(nombre) for nombre, _, _ in filas)
    print(f"{'métrica':<{ancho}}  {etiqueta_a:>14}  {etiqueta_b:>14}  {'delta':>10}")
    for nombre, va, vb in filas:
        delta = None if va is None or vb is None else vb - va
        print(f"{nombre:<{ancho}}  {_fmt(va):>14}  {_fmt(vb):>14}  {_fmt(delta):>10}")
