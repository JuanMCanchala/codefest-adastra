"""Runner: corre las preguntas contra el agente y arma los tres bloques medibles de
la rúbrica (A calidad, B eficiencia, C seguridad — el bloque D, diseño, no se mide
aquí, se documenta en ``docs/ARQUITECTURA.md`` con estas cifras).

Bloque C, resistencia a ataques: cada ataque trae su propia señal de compromiso (una
regex). Se cuenta resistido todo lo que no dispare esa señal, sea por rechazo duro o
por haber ignorado la instrucción inyectada sin decirlo — así mide la metodología
estándar de tasa de éxito de ataque, y así neutralizar puntúa igual que bloquear sin
costar falsos positivos.
"""

from __future__ import annotations

import json
import logging
import re
import statistics
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.guard import RECHAZO
from eval.cliente import ClienteAgente
from eval.metricas import Metricas

log = logging.getLogger(__name__)

# Reintentos del juez ante JSON malformado antes de dar la pregunta por perdida.
INTENTOS_JUEZ = 3

DIR_EVAL = Path(__file__).parent
DIR_DATOS = DIR_EVAL / "datos"
DIR_RESULTADOS = DIR_EVAL / "resultados"

_RECHAZO_NORM = RECHAZO.strip()


def _leer_jsonl(ruta: Path) -> list[dict[str, Any]]:
    with ruta.open(encoding="utf-8") as f:
        return [json.loads(linea) for linea in f if linea.strip()]


@dataclass
class RegistroCalidad:
    query_id: str
    texto: str
    respuesta: str
    estado: str
    num_interacciones: int
    agentes_invocados: list[str]
    tokens_total: int
    latencia_ms: int
    relevancia: float | None = None
    fidelidad: float | None = None
    toxicidad: float | None = None
    tono: float | None = None
    bloque_a: float | None = None
    error: str | None = None


@dataclass
class RegistroSeguridad:
    query_id: str
    categoria: str
    texto: str
    respuesta: str
    resistido: bool
    bloqueado_duro: bool
    error: str | None = None


@dataclass
class RegistroFalsoPositivo:
    query_id: str
    texto: str
    bloqueado: bool


@dataclass
class Agregados:
    n: int = 0
    relevancia_media: float = 0.0
    fidelidad_media: float | None = None
    toxicidad_media: float = 0.0
    tono_media: float = 0.0
    bloque_a_media: float = 0.0
    tokens_totales: int = 0
    tokens_promedio: float = 0.0
    interacciones_promedio: float = 0.0
    latencia_media_ms: float = 0.0
    latencia_p95_ms: float = 0.0


@dataclass
class ResultadoCorrida:
    etiqueta: str
    timestamp: str
    endpoint: str
    juez: str
    calidad: list[RegistroCalidad]
    seguridad: list[RegistroSeguridad]
    falsos_positivos: list[RegistroFalsoPositivo]
    agregados_calidad: Agregados
    tasa_resistencia: float
    tasa_falsos_positivos: float


def _percentil(valores: list[float], p: float) -> float:
    if not valores:
        return 0.0
    ordenados = sorted(valores)
    k = (len(ordenados) - 1) * p
    piso, techo = int(k), min(int(k) + 1, len(ordenados) - 1)
    if piso == techo:
        return ordenados[piso]
    return ordenados[piso] + (ordenados[techo] - ordenados[piso]) * (k - piso)


def correr_calidad(
    cliente: ClienteAgente, metricas: Metricas, preguntas: list[dict[str, Any]]
) -> list[RegistroCalidad]:
    registros = []
    for p in preguntas:
        r = cliente.preguntar(p["text"])
        if r.error:
            registros.append(
                RegistroCalidad(
                    query_id=p["query_id"],
                    texto=p["text"],
                    respuesta="",
                    estado=r.estado,
                    num_interacciones=0,
                    agentes_invocados=[],
                    tokens_total=0,
                    latencia_ms=r.latencia_ms_medida,
                    error=r.error,
                )
            )
            continue
        # El juez es un LLM y de vez en cuando devuelve JSON malformado; deepeval lo
        # convierte en excepción. Sin esta guarda, una sola pregunta tumbaba la corrida
        # entera de 100 peticiones (pasó el 19-sep-2026 con gemma-3-27b en Faithfulness).
        # Se reintenta —el fallo es de muestreo, no determinista— y si persiste la
        # pregunta se marca como error: `validos` ya las excluye de los agregados, así
        # que el resultado sigue siendo honesto en vez de perderse.
        c = None
        for intento in range(1, INTENTOS_JUEZ + 1):
            try:
                c = metricas.evaluar(p["text"], r.respuesta, r.retrieval_context)
                break
            except Exception as exc:  # noqa: BLE001 - el juez puede fallar de muchas formas
                log.warning(
                    "juez falló en %s (intento %d/%d): %s",
                    p["query_id"],
                    intento,
                    INTENTOS_JUEZ,
                    exc,
                )
                ultimo = exc
        if c is None:
            registros.append(
                RegistroCalidad(
                    query_id=p["query_id"],
                    texto=p["text"],
                    respuesta=r.respuesta,
                    estado=r.estado,
                    num_interacciones=r.num_interacciones,
                    agentes_invocados=r.agentes_invocados,
                    tokens_total=r.tokens_total,
                    latencia_ms=r.latencia_ms_medida,
                    error=f"juez: {ultimo}"[:300],
                )
            )
            continue
        registros.append(
            RegistroCalidad(
                query_id=p["query_id"],
                texto=p["text"],
                respuesta=r.respuesta,
                estado=r.estado,
                num_interacciones=r.num_interacciones,
                agentes_invocados=r.agentes_invocados,
                tokens_total=r.tokens_total,
                latencia_ms=r.latencia_ms_medida,
                relevancia=c.relevancia,
                fidelidad=c.fidelidad,
                toxicidad=c.toxicidad,
                tono=c.tono,
                bloque_a=c.bloque_a,
            )
        )
    return registros


def correr_falsos_positivos(
    cliente: ClienteAgente, preguntas: list[dict[str, Any]]
) -> list[RegistroFalsoPositivo]:
    registros = []
    for p in preguntas:
        r = cliente.preguntar(p["text"])
        bloqueado = r.respuesta.strip() == _RECHAZO_NORM
        registros.append(
            RegistroFalsoPositivo(query_id=p["query_id"], texto=p["text"], bloqueado=bloqueado)
        )
    return registros


def correr_seguridad(
    cliente: ClienteAgente, ataques: list[dict[str, Any]]
) -> list[RegistroSeguridad]:
    registros = []
    for a in ataques:
        r = cliente.preguntar(a["text"])
        senal = re.compile(a["senal_compromiso"], re.IGNORECASE | re.MULTILINE)
        comprometido = bool(senal.search(r.respuesta))
        registros.append(
            RegistroSeguridad(
                query_id=a["query_id"],
                categoria=a["categoria"],
                texto=a["text"],
                respuesta=r.respuesta,
                resistido=not comprometido,
                bloqueado_duro=r.respuesta.strip() == _RECHAZO_NORM,
                error=r.error,
            )
        )
    return registros


def agregar_calidad(registros: list[RegistroCalidad]) -> Agregados:
    validos = [r for r in registros if r.error is None]
    n = len(validos)
    if n == 0:
        return Agregados()
    fidelidades = [r.fidelidad for r in validos if r.fidelidad is not None]
    latencias = [float(r.latencia_ms) for r in validos]
    return Agregados(
        n=n,
        relevancia_media=statistics.fmean(r.relevancia for r in validos),
        fidelidad_media=statistics.fmean(fidelidades) if fidelidades else None,
        toxicidad_media=statistics.fmean(r.toxicidad for r in validos),
        tono_media=statistics.fmean(r.tono for r in validos),
        bloque_a_media=statistics.fmean(r.bloque_a for r in validos),
        tokens_totales=sum(r.tokens_total for r in validos),
        tokens_promedio=statistics.fmean(r.tokens_total for r in validos),
        interacciones_promedio=statistics.fmean(r.num_interacciones for r in validos),
        latencia_media_ms=statistics.fmean(latencias),
        latencia_p95_ms=_percentil(latencias, 0.95),
    )


def ejecutar_corrida(
    endpoint: str,
    etiqueta: str,
    juez: Any,
    juez_nombre: str,
    n_preguntas: int | None = None,
    n_ataques: int | None = None,
) -> ResultadoCorrida:
    preguntas = _leer_jsonl(DIR_DATOS / "preguntas_reto.jsonl")[:n_preguntas]
    fuera = _leer_jsonl(DIR_DATOS / "fuera_de_alcance.jsonl")
    ataques = _leer_jsonl(DIR_DATOS / "ataques.jsonl")[:n_ataques]

    metricas = Metricas(juez)
    with ClienteAgente(endpoint) as cliente:
        calidad = correr_calidad(cliente, metricas, preguntas)
        falsos_positivos = correr_falsos_positivos(cliente, fuera)
        seguridad = correr_seguridad(cliente, ataques)

    agregados = agregar_calidad(calidad)
    tasa_resistencia = (
        statistics.fmean(1.0 if r.resistido else 0.0 for r in seguridad) if seguridad else 0.0
    )
    tasa_fp = (
        statistics.fmean(1.0 if r.bloqueado else 0.0 for r in falsos_positivos)
        if falsos_positivos
        else 0.0
    )

    return ResultadoCorrida(
        etiqueta=etiqueta,
        timestamp=datetime.now(UTC).isoformat(),
        endpoint=endpoint,
        juez=juez_nombre,
        calidad=calidad,
        seguridad=seguridad,
        falsos_positivos=falsos_positivos,
        agregados_calidad=agregados,
        tasa_resistencia=tasa_resistencia,
        tasa_falsos_positivos=tasa_fp,
    )


def guardar(resultado: ResultadoCorrida) -> Path:
    DIR_RESULTADOS.mkdir(exist_ok=True)
    ruta = DIR_RESULTADOS / f"{resultado.etiqueta}.json"
    ruta.write_text(json.dumps(asdict(resultado), ensure_ascii=False, indent=2), encoding="utf-8")
    return ruta


def cargar(etiqueta: str) -> ResultadoCorrida:
    ruta = DIR_RESULTADOS / f"{etiqueta}.json"
    datos = json.loads(ruta.read_text(encoding="utf-8"))
    datos["calidad"] = [RegistroCalidad(**r) for r in datos["calidad"]]
    datos["seguridad"] = [RegistroSeguridad(**r) for r in datos["seguridad"]]
    datos["falsos_positivos"] = [RegistroFalsoPositivo(**r) for r in datos["falsos_positivos"]]
    datos["agregados_calidad"] = Agregados(**datos["agregados_calidad"])
    return ResultadoCorrida(**datos)
