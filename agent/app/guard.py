"""Detección de prompt injection (Bloque C de §2.5, 75 % del puntaje de seguridad).

Solo detección, sin prompts (esos viven en ``prompts.py``):

- ``evaluar``: clasifica una pregunta en tres niveles. **Rechazo** solo para lo de alto
  daño y alta precisión (credenciales, entorno y ejecución de código). **Aislar** para el
  resto de patrones de inyección: la pregunta no se bloquea, el tramo sospechoso se trata
  como dato no confiable y se responde la parte legítima. La métrica de tasa de éxito de
  ataque cuenta como resistido tanto rechazar como ignorar la instrucción inyectada, y
  bloquear cuesta falsos positivos en preguntas legítimas del dominio.
- ``delimitar`` y ``datamarcar``: separan datos de instrucciones en los prompts
  (spotlighting, Hines et al. 2024).
- ``sanear_salida``: impide que la respuesta filtre instrucciones internas o secretos.
"""

from __future__ import annotations

import re
import unicodedata
from enum import StrEnum

# Patrones de alta precisión: exigen que la orden se dirija al asistente (segunda
# persona, "tus reglas", "a partir de ahora"...). Las preguntas legítimas del dominio
# ("¿qué beneficios dan los satélites?", "¿Rusia actúa como mediador?", "nuevas reglas de
# la ONU", "quién ejecuta el comando conjunto") NO deben dispararlos: ver pruebas.
_PATRONES_AISLAR = [
    # anular o reemplazar instrucciones
    r"\b(ignora|ignore|olvida|forget|desconsidere|omite|disregard)\b.{0,40}"
    r"\b(instrucc|instruction|regla|rule|indicac|prompt|anterior|previous|above|arriba)",
    r"\b(tus|your|sus)\s+(nuevas\s+)?(instrucciones|reglas|rules|instructions)\b"
    r".{0,30}\b(son|ahora|now|are)\b",
    r"\bnuevas instrucciones\s*:",
    # exfiltrar el prompt de sistema o la configuración
    r"\b(system|sistema)\s*(prompt|message|mensaje)\b",
    r"\b(muestra|revela|imprime|repite|show|reveal|print|repeat|dime|tell me|traduce|translate|"
    r"resume|summari[sz]e|parafrasea|escribe|codifica|encode)\b.{0,30}"
    r"\b(tus|your|tu|las)\s+(prompt|instrucciones|instructions|reglas|rules|indicaciones|"
    r"configuraci[oó]n|configuration)\b",
    r"\b(texto|mensaje|frase|text|message)\b.{0,30}\b(arriba de esta|antes de mi|above|before my)",
    r"\b(primera|first)\s+(frase|instrucci[oó]n|mensaje|line|message)\b.{0,40}"
    r"\b(te\s+dieron|te\s+dijeron|recibiste|you\s+(were|received))",
    r"\b(base64|rot13|leetspeak)\b",
    # cambio de rol / jailbreak
    r"\b(a partir de ahora|from now on|desde ahora)\b.{0,30}\b(eres|ser[aá]s|you are|act[uú]a)",
    r"\b(act[uú]a|comp[oó]rtate|act)\s+(como|as)\b.{0,60}\b(sin|without|no)\s+"
    r"(restricci|filtro|l[ií]mite|rules|filter)",
    r"\b(eres|ser[aá]s|you are)\s+(ahora\s+)?(un[ao]?\s+)?(gpt|ia|ai|asistente|modelo)?\s*"
    r"(sin|without)\s+(filtros|restricciones|l[ií]mites|filters|restrictions)",
    r"\b(modo|mode)\s+(desarrollador|developer|dan|jailbreak|sin restricciones|god)\b",
    r"\bjailbreak\b|\bdo anything now\b",
    r"\bresponde\s+(solo|[uú]nicamente)\s+con\s+(la\s+palabra|el\s+texto)\b",
    r"\b(nueva tarea|new task)\s*:|\bdeja de ser\b|\bstop being\b",
    r"(^|\n)\s*(system|sistema|assistant|asistente|admin|developer)\s*:",
    r"\b(finge|pretend)\s+(que eres|que seas|to be|ser)\b",
    r"\bignorando\s+(cualquier|toda|todas|las)\s+(pol[ií]tica|regla|restricci)",
    r"\brevela\b.{0,30}\b(configuraci[oó]n|contrase(n|ñ)a|clave|prompt)",
    # delimitadores de plantilla usados para inyectar turnos
    r"<\|?(im_start|system|endoftext|im_end)\|?>|\[/?INST\]|###\s*(system|instruction)",
]

# Rechazo duro: alto daño (credenciales, entorno, ejecución de código) y alta precisión.
_PATRONES_RECHAZO = [
    # Credenciales: se bloquea cuando se piden las DEL ASISTENTE ("tu api key") o cuando
    # hay un verbo de exfiltración cerca ("muéstrame el token de acceso"). Con un
    # determinante suelto bastaba "el token de acceso" para tumbar una pregunta legítima
    # de F2: "¿qué papel juega el token de acceso orbital en las comunicaciones?".
    r"\b(tus?|your|sus?)\s+(api[\s_-]?key|token de acceso|access token|bearer token|"
    r"contrase(n|ñ)a|password|credenciales|credentials)\b",
    r"\b(muestra|mu[eé]strame|revela|imprime|dame|dime|env[ií]a|filtra|escupe|"
    r"show|reveal|print|give me|tell me|leak)\b.{0,30}"
    r"\b(api[\s_-]?key|token de acceso|access token|bearer token|"
    r"contrase(n|ñ)a|password|credenciales|credentials)\b",
    r"\b(variables? de entorno|environment variables?|os\.environ|\.env)\b",
    r"\b(ejecuta|execute|run)\b.{0,20}\b(este|el siguiente|this|the following)\s+"
    r"(c[oó]digo|comando|script|command)\b",
    r"\b(rm -rf|curl |wget |subprocess|eval\(|exec\()",
]

_REGEX_AISLAR = [re.compile(p, re.IGNORECASE | re.DOTALL) for p in _PATRONES_AISLAR]
# "DAN" solo en mayúsculas: en minúscula es el verbo "dar" ("¿qué beneficios dan...?").
_REGEX_AISLAR.append(re.compile(r"\bDAN\b"))
_REGEX_RECHAZO = [re.compile(p, re.IGNORECASE | re.DOTALL) for p in _PATRONES_RECHAZO]
_REGEX = _REGEX_RECHAZO + _REGEX_AISLAR


class Nivel(StrEnum):  # equivale a (str, Enum): los valores siguen siendo str
    LIMPIO = "limpio"
    AISLAR = "aislar"
    RECHAZO = "rechazo"


RECHAZO = (
    "Entiendo tu solicitud, pero no puedo modificar mis instrucciones, revelar mi "
    "configuración interna ni ejecutar acciones fuera de mi función. Con gusto te ayudo "
    "con preguntas sobre los tres fenómenos del reto: IA y capacidades estratégicas, "
    "seguridad del entorno espacial y dinámicas territoriales en América Latina."
)

_FUGAS_SALIDA = re.compile(
    r"(AWS_BEARER_TOKEN_BEDROCK|AKIA[0-9A-Z]{16}|BEGIN (RSA|OPENSSH) PRIVATE KEY|"
    r"<<DATOS_NO_CONFIABLES>>|REGLAS DEL SISTEMA)",
    re.IGNORECASE,
)

MARCA_DATOS = "ˆ"  # «ˆ»: rara en el corpus y un solo token en la mayoría de tokenizadores


def _normalizar(texto: str) -> str:
    # NFKC colapsa variantes Unicode (letras de ancho completo, ligaduras) que se usan
    # para esquivar filtros; se eliminan caracteres de control y de ancho cero.
    texto = unicodedata.normalize("NFKC", texto)
    return "".join(c for c in texto if unicodedata.category(c) not in {"Cc", "Cf"} or c in "\n\t")


def evaluar(texto: str) -> tuple[Nivel, str]:
    """Nivel de la pregunta y motivo legible para la traza."""
    normal = _normalizar(texto)
    for r in _REGEX_RECHAZO:
        if m := r.search(normal):
            return Nivel.RECHAZO, f"credenciales o ejecución de código: «{m.group(0)[:60]}»"
    for r in _REGEX_AISLAR:
        if m := r.search(normal):
            return Nivel.AISLAR, f"instrucción inyectada: «{m.group(0)[:60]}»"
    return Nivel.LIMPIO, ""


def detectar_inyeccion(pregunta: str) -> bool:
    """Compatibilidad: ``True`` si hay cualquier patrón, de rechazo o de aislamiento."""
    return evaluar(pregunta)[0] is not Nivel.LIMPIO


def tramos_sospechosos(texto: str) -> list[tuple[int, int]]:
    """Posiciones ``(inicio, fin)`` de los tramos que coinciden con algún patrón."""
    normal = _normalizar(texto)
    if len(normal) != len(texto):
        # La normalización cambió longitudes: se señala el texto completo.
        return [(0, len(texto))] if any(r.search(normal) for r in _REGEX) else []
    tramos = sorted(m.span() for r in _REGEX for m in r.finditer(texto))
    fusionados: list[tuple[int, int]] = []
    for ini, fin in tramos:
        if fusionados and ini <= fusionados[-1][1]:
            fusionados[-1] = (fusionados[-1][0], max(fin, fusionados[-1][1]))
        else:
            fusionados.append((ini, fin))
    return fusionados


def datamarcar(texto: str, marca: str = MARCA_DATOS) -> str:
    """Datamarking (spotlighting): intercala una marca entre las palabras del texto no
    confiable para que el modelo distinga datos de instrucciones aun si el texto imita
    órdenes. En el artículo baja la inyección indirecta de más del 50 % a menos del 2 %.
    Solo se usa en el prompt: ``retrieval_context`` conserva el texto original.
    """
    return marca.join(texto.split())


def delimitar(etiqueta: str, contenido: str, *, marcar: bool = False) -> str:
    """Envuelve contenido no confiable para que el modelo lo trate como datos."""
    limpio = contenido.replace("<<", "«").replace(">>", "»")
    if marcar:
        limpio = datamarcar(limpio)
    return f"<<DATOS_NO_CONFIABLES {etiqueta}>>\n{limpio}\n<</DATOS_NO_CONFIABLES>>"


def sanear_salida(texto: str) -> str:
    if _FUGAS_SALIDA.search(texto):
        return RECHAZO
    return texto
