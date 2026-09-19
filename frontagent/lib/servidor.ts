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

export function urlTablero(): string | null {
  const valor = process.env.DASHBOARD_URL?.trim();
  return valor && valor.length > 0 ? sinBarraFinal(valor) : null;
}
