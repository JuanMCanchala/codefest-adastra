"""Pasa cada texto por las dos capas de entrada (patrones + clasificador). Costo cero.

Corre dentro de la imagen del agente, que ya trae el clasificador descargado:
    docker cp agent CONT:/tmp/wt/ && docker cp scripts/red_team CONT:/tmp/ca
    docker exec -w /tmp/ca CONT python evaluar_offline.py
"""

import json
import sys
import time
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, "/tmp/wt/agent")
DATOS = Path(__file__).parent / "datos"
from app.clasificador import ClasificadorInyeccion
from app.guard import Nivel, evaluar

clf = ClasificadorInyeccion()
clf.cargar()
print("clasificador:", clf.estado, flush=True)

filas = [
    json.loads(x)
    for x in (DATOS / "ataques_publicos.jsonl").read_text(encoding="utf-8").splitlines()
]
for f in ["ataques.jsonl", "fuera_de_alcance.jsonl", "preguntas_reto.jsonl"]:
    for x in (
        Path(f"/tmp/wt/agent/eval/datos/{f}").read_text(encoding="utf-8").splitlines()
    ):
        j = json.loads(x)
        filas.append(
            {
                "id": j.get("query_id"),
                "fuente": "banco_" + f.split(".")[0],
                "categoria": j.get("categoria", "legitima"),
                "text": j.get("text") or j.get("pregunta"),
                "ataque": f == "ataques.jsonl",
            }
        )

t0 = time.time()
for i, f in enumerate(filas):
    nivel, _ = evaluar(f["text"])
    f["patrones"] = str(nivel)
    f["clasificador"] = clf.es_ataque(f["text"])
    f["capa"] = (
        "rechazo"
        if nivel is Nivel.RECHAZO
        else "aislar_patron"
        if nivel is Nivel.AISLAR
        else "aislar_clf"
        if f["clasificador"]
        else "limpio"
    )
    if i % 500 == 0:
        print(i, round(time.time() - t0), "s", flush=True)

with open(DATOS / "resultado_offline.jsonl", "w", encoding="utf-8") as o:
    for f in filas:
        o.write(json.dumps(f, ensure_ascii=False) + "\n")

agg = defaultdict(lambda: defaultdict(int))
for f in filas:
    agg[(f["fuente"], f["ataque"])][f["capa"]] += 1
print(
    f"{'fuente':28}{'atq':>4}{'n':>6}{'rechazo':>9}{'patron':>8}{'clf':>6}{'limpio':>8}{'%detect':>9}"
)
for (fu, at), c in sorted(agg.items()):
    n = sum(c.values())
    det = n - c["limpio"]
    print(
        f"{fu:28}{str(at)[0]:>4}{n:>6}{c['rechazo']:>9}{c['aislar_patron']:>8}"
        f"{c['aislar_clf']:>6}{c['limpio']:>8}{100 * det / n:>8.1f}%"
    )
