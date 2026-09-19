import { NextResponse } from "next/server";

import { urlAgente } from "@/lib/servidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Espera corta: este endpoint responde al HEALTHCHECK del contenedor. */
const TIEMPO_LIMITE_MS = 5_000;

export async function GET(): Promise<NextResponse> {
  let agente: { alcanzable: boolean; estado?: number; detalle?: string };

  const controlador = new AbortController();
  const temporizador = setTimeout(() => {
    controlador.abort();
  }, TIEMPO_LIMITE_MS);

  try {
    const respuesta = await fetch(`${urlAgente()}/health`, {
      signal: controlador.signal,
      cache: "no-store",
    });
    agente = { alcanzable: respuesta.ok, estado: respuesta.status };
  } catch (error) {
    agente = {
      alcanzable: false,
      detalle: error instanceof Error ? error.message : "error desconocido",
    };
  } finally {
    clearTimeout(temporizador);
  }

  // El frontend está sano aunque el agente no lo esté: son contenedores independientes.
  return NextResponse.json({ estado: "ok", servicio: "frontagent", agente });
}
