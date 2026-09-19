import { CHAT_URL, TABLERO_URL } from "./urls";

/**
 * Espera con reintentos a que los contenedores respondan antes de lanzar la suite.
 * Solo consulta rutas de salud: ninguna llama a los modelos.
 */

const ESPERA_MAXIMA_MS = Number(process.env["E2E_ESPERA_MS"] ?? 180_000);
const PAUSA_MS = 3_000;

interface Objetivo {
  nombre: string;
  url: string;
  valido: (cuerpo: unknown) => boolean;
}

const OBJETIVOS: Objetivo[] = [
  {
    nombre: "chat (frontagent) y agente",
    url: `${CHAT_URL}/api/health`,
    valido: (c) =>
      typeof c === "object" &&
      c !== null &&
      (c as { agente?: { alcanzable?: boolean } }).agente?.alcanzable === true,
  },
  {
    nombre: "tablero (dashboard)",
    url: `${TABLERO_URL}/api/salud`,
    valido: (c) =>
      typeof c === "object" &&
      c !== null &&
      (c as { estado?: string }).estado === "ok",
  },
];

async function esperar(objetivo: Objetivo): Promise<void> {
  const limite = Date.now() + ESPERA_MAXIMA_MS;
  let ultimo = "sin respuesta";
  while (Date.now() < limite) {
    try {
      const respuesta = await fetch(objetivo.url, {
        signal: AbortSignal.timeout(10_000),
      });
      const cuerpo: unknown = await respuesta.json().catch(() => null);
      if (respuesta.ok && objetivo.valido(cuerpo)) {
        return;
      }
      ultimo = `estado ${respuesta.status}: ${JSON.stringify(cuerpo).slice(0, 200)}`;
    } catch (error) {
      ultimo = error instanceof Error ? error.message : String(error);
    }
    await new Promise((r) => setTimeout(r, PAUSA_MS));
  }
  throw new Error(
    `El servicio ${objetivo.nombre} no respondió en ${ESPERA_MAXIMA_MS / 1000} s (${objetivo.url}). Último intento: ${ultimo}`,
  );
}

export default async function preparacionGlobal(): Promise<void> {
  await Promise.all(OBJETIVOS.map(esperar));
}
