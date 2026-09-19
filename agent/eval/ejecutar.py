"""CLI del banco de evaluación (Parte 1).

Ejemplos:
    python -m eval.ejecutar correr --endpoint http://localhost:8000 --etiqueta baseline
    python -m eval.ejecutar correr --endpoint http://localhost:8000 --etiqueta router_v1 \\
        --juez mixtral-8x7b-instruct --n-preguntas 10
    python -m eval.ejecutar comparar baseline router_v1
"""

from __future__ import annotations

import argparse
import sys

from eval.corrida import ejecutar_corrida, guardar
from eval.juez import MODELO_POR_DEFECTO, JuezGateway
from eval.reporte import comparar, imprimir_resumen


def _cmd_correr(args: argparse.Namespace) -> None:
    juez = JuezGateway(modelo=args.juez)
    resultado = ejecutar_corrida(
        endpoint=args.endpoint,
        etiqueta=args.etiqueta,
        juez=juez,
        juez_nombre=args.juez,
        n_preguntas=args.n_preguntas,
        n_ataques=args.n_ataques,
    )
    ruta = guardar(resultado)
    print(f"Corrida guardada en {ruta}")
    imprimir_resumen(resultado)


def _cmd_comparar(args: argparse.Namespace) -> None:
    comparar(args.etiqueta_a, args.etiqueta_b)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m eval.ejecutar")
    sub = parser.add_subparsers(dest="comando", required=True)

    p_correr = sub.add_parser("correr", help="corre el harness contra un endpoint")
    p_correr.add_argument("--endpoint", required=True, help="p.ej. http://localhost:8000")
    p_correr.add_argument("--etiqueta", required=True, help="nombre de la corrida, p.ej. baseline")
    p_correr.add_argument("--juez", default=MODELO_POR_DEFECTO)
    p_correr.add_argument("--n-preguntas", type=int, default=None, help="submuestra para iterar")
    p_correr.add_argument("--n-ataques", type=int, default=None)
    p_correr.set_defaults(func=_cmd_correr)

    p_comparar = sub.add_parser("comparar", help="compara dos corridas ya guardadas")
    p_comparar.add_argument("etiqueta_a")
    p_comparar.add_argument("etiqueta_b")
    p_comparar.set_defaults(func=_cmd_comparar)

    args = parser.parse_args(argv)
    args.func(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
