"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { useVistaTecnica } from "@/lib/vista-tecnica";

export function BurbujaUsuario({ id, texto }: { id?: string; texto: string }) {
  return (
    <div id={id} className="flex scroll-mt-4 justify-end">
      <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-elevado px-3.5 py-2.5 text-sm leading-relaxed text-texto">
        <span className="sr-only">Consulta: </span>
        {texto}
      </p>
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
    <div role="alert" className="flex items-start gap-3 text-alerta">
      <TriangleAlert
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-alerta"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-alerta">{texto}</p>
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
  const tecnica = useVistaTecnica();
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const inicio = Date.now();
    const intervalo = setInterval(() => {
      setSegundos(Math.floor((Date.now() - inicio) / 1000));
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div role="status" className="flex items-start gap-3">
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
          {tecnica
            ? "El orquestador decide la ruta, el agente de corpus recupera evidencia y, si aplica, el agente de visualización propone un componente. Suele tardar entre 2 y 7 s; la traza real aparece con la respuesta."
            : "Suele tardar entre 2 y 7 s."}
        </p>
      </div>
    </div>
  );
}
