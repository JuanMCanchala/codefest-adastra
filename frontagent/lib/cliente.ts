import type { ErrorProxy, RespuestaAgente } from "@/lib/tipos";

export interface ResultadoConsulta {
  ok: true;
  datos: RespuestaAgente;
}

export interface FalloConsulta {
  ok: false;
  error: string;
  detalle?: string;
}

/** Llama al proxy interno `/api/chat`, que a su vez consulta al agente. */
export async function consultarAgente(pregunta: string): Promise<ResultadoConsulta | FalloConsulta> {
  let respuesta: Response;
  try {
    respuesta = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pregunta }),
    });
  } catch (error) {
    return {
      ok: false,
      error: "No fue posible comunicarse con el servidor de la consola.",
      detalle: error instanceof Error ? error.message : undefined,
    };
  }

  let cuerpo: unknown;
  try {
    cuerpo = await respuesta.json();
  } catch {
    return { ok: false, error: "La respuesta del servidor no es JSON válido." };
  }

  if (!respuesta.ok) {
    const fallo = cuerpo as ErrorProxy;
    return {
      ok: false,
      error: fallo.error ?? `El servidor respondió con estado ${respuesta.status}.`,
      detalle: fallo.detalle,
    };
  }

  const datos = cuerpo as Partial<RespuestaAgente>;
  if (typeof datos.respuesta !== "string" || !datos.evaluacion || !datos.metadata) {
    return { ok: false, error: "La respuesta del agente no cumple el contrato esperado." };
  }

  return { ok: true, datos: datos as RespuestaAgente };
}
