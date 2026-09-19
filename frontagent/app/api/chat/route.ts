import { NextResponse } from "next/server";

import { MAX_PREGUNTA_CHARS, urlAgente } from "@/lib/servidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tope de espera del agente: la ruta completa puede encadenar varias llamadas al modelo. */
const TIEMPO_LIMITE_MS = 90_000;

interface CuerpoEntrante {
  pregunta?: unknown;
}

export async function POST(peticion: Request): Promise<NextResponse> {
  let cuerpo: CuerpoEntrante;
  try {
    cuerpo = (await peticion.json()) as CuerpoEntrante;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la petición no es JSON válido." }, { status: 400 });
  }

  const pregunta = typeof cuerpo.pregunta === "string" ? cuerpo.pregunta.trim() : "";
  if (pregunta.length === 0) {
    return NextResponse.json({ error: "La pregunta no puede estar vacía." }, { status: 400 });
  }
  if (pregunta.length > MAX_PREGUNTA_CHARS) {
    return NextResponse.json(
      { error: `La pregunta supera el límite de ${MAX_PREGUNTA_CHARS} caracteres.` },
      { status: 413 },
    );
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => {
    controlador.abort();
  }, TIEMPO_LIMITE_MS);

  try {
    const respuesta = await fetch(`${urlAgente()}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ pregunta, incluir_extras: true }),
      signal: controlador.signal,
      cache: "no-store",
    });

    const texto = await respuesta.text();

    if (!respuesta.ok) {
      return NextResponse.json(
        {
          error: `El agente respondió con estado ${respuesta.status}.`,
          detalle: texto.slice(0, 600),
        },
        { status: 502 },
      );
    }

    try {
      return NextResponse.json(JSON.parse(texto) as unknown);
    } catch {
      return NextResponse.json(
        { error: "El agente devolvió una respuesta que no es JSON válido." },
        { status: 502 },
      );
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: `El agente no respondió en ${TIEMPO_LIMITE_MS / 1000} segundos.` },
        { status: 504 },
      );
    }
    return NextResponse.json(
      {
        error: "No fue posible contactar al agente.",
        detalle: error instanceof Error ? error.message : undefined,
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(temporizador);
  }
}
