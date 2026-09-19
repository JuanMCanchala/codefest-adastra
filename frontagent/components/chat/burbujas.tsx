"use client";

import { Loader2, TriangleAlert, User } from "lucide-react";
import { useEffect, useState } from "react";

export function BurbujaUsuario({ texto }: { texto: string }) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[85%] items-start gap-3 rounded-md border border-control/60 bg-elevado px-4 py-3">
        <p className="text-base leading-relaxed text-texto">{texto}</p>
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded border border-control/60 text-apagado">
          <User aria-hidden="true" className="size-4" />
          <span className="sr-only">Consulta del usuario</span>
        </span>
      </div>
    </div>
  );
}

export function BurbujaError({
  texto,
  detalle,
}: {
  texto: string;
  detalle?: string;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-md border border-alerta/50 bg-alerta/10 px-4 py-3"
    >
      <TriangleAlert
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-alerta"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-texto">{texto}</p>
        <p className="mt-1 text-sm text-apagado">
          Puede reformular la consulta o enviarla de nuevo; la conversación
          anterior se conserva.
        </p>
        {detalle ? (
          <p className="mt-2 break-words font-mono text-xs text-tenue">
            {detalle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Espera honesta: muestra el tiempo real transcurrido, sin simular etapas. */
export function EstadoPensando() {
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const inicio = Date.now();
    const intervalo = setInterval(() => {
      setSegundos(Math.floor((Date.now() - inicio) / 1000));
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-md border border-borde bg-panel px-4 py-3"
    >
      <Loader2
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 animate-spin text-acento"
      />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-medium">
          <span>Consultando al sistema multiagente…</span>
          <span className="font-mono text-xs text-apagado" aria-hidden="true">
            {segundos} s
          </span>
        </p>
        <p className="mt-1 text-sm leading-relaxed text-apagado">
          El orquestador decide la ruta, el agente de corpus recupera evidencia
          y, si aplica, el agente de visualización propone un componente. Suele
          tardar entre 2 y 7 s; la traza real aparece con la respuesta.
        </p>
      </div>
    </div>
  );
}
