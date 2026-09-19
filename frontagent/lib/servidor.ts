/** Configuración leída del entorno en tiempo de ejecución (nunca en tiempo de construcción). */

export const MAX_PREGUNTA_CHARS = 4000;

const URL_AGENTE_POR_DEFECTO = "http://localhost:8000";

function sinBarraFinal(url: string): string {
  return url.replace(/\/+$/, "");
}

export function urlAgente(): string {
  const valor = process.env.AGENT_URL?.trim();
  return sinBarraFinal(valor && valor.length > 0 ? valor : URL_AGENTE_POR_DEFECTO);
}

/**
 * Detalles internos (ruta del orquestador, tokens, modelos, parámetros de las herramientas)
 * en la interfaz. Lo decide el despliegue, no el navegador: la consola que revisa el jurado
 * va limpia y la del equipo se enciende con VISTA_TECNICA=1.
 */
export function vistaTecnica(): boolean {
  const valor = process.env.VISTA_TECNICA?.trim().toLowerCase();
  return valor === "1" || valor === "true" || valor === "si" || valor === "sí";
}

export function urlTablero(): string | null {
  const valor = process.env.DASHBOARD_URL?.trim();
  return valor && valor.length > 0 ? sinBarraFinal(valor) : null;
}
