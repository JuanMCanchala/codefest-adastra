"use client";

import { Loader2, TriangleAlert, User } from "lucide-react";

export function BurbujaUsuario({ texto }: { texto: string }) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[85%] items-start gap-3 rounded-lg border border-acento/30 bg-acento/10 px-4 py-3">
        <p className="text-sm leading-relaxed text-texto">{texto}</p>
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded border border-acento/40 text-acento">
          <User aria-hidden="true" className="size-3.5" />
        </span>
      </div>
    </div>
  );
}

export function BurbujaError({ texto, detalle }: { texto: string; detalle?: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-alerta/40 bg-alerta/10 px-4 py-3"
    >
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-alerta" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-texto">{texto}</p>
        {detalle ? (
          <p className="mt-1 break-words font-mono text-xs text-apagado">{detalle}</p>
        ) : null}
      </div>
    </div>
  );
}

export function EstadoPensando() {
  return (
    <div
      aria-live="polite"
      className="flex items-start gap-3 rounded-lg border border-borde bg-panel px-4 py-3"
    >
      <Loader2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 animate-spin text-acento" />
      <div>
        <p className="text-sm font-medium">El sistema está pensando…</p>
        <p className="mt-1 text-xs text-apagado">
          El orquestador decide la ruta, el agente de corpus recupera evidencia y, si aplica, el
          agente de visualización propone un componente. La traza real de agentes, herramientas y
          tokens aparece al recibir la respuesta.
        </p>
      </div>
    </div>
  );
}
