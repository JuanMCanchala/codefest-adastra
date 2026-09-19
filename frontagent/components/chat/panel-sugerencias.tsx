"use client";

import { FENOMENOS } from "@/lib/fenomenos";
import { SUGERENCIAS } from "@/lib/sugerencias";
import { cn } from "@/lib/utils";

interface Props {
  deshabilitado: boolean;
  onElegir: (pregunta: string) => void;
}

export function PanelSugerencias({ deshabilitado, onElegir }: Props) {
  return (
    <section aria-labelledby="titulo-sugerencias" className="space-y-4">
      <div>
        <h2 id="titulo-sugerencias" className="text-sm font-semibold tracking-tight">
          Consultas preparadas por fenómeno
        </h2>
        <p className="mt-1 text-xs text-apagado">
          Cada respuesta se sustenta en fragmentos citados del corpus, con su documento de origen.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {FENOMENOS.map((fenomeno) => (
          <div
            key={fenomeno.id}
            className={cn("rounded-lg border bg-panel p-3", fenomeno.borde)}
          >
            <h3 className="flex items-center gap-2 text-xs font-semibold">
              <span aria-hidden="true" className={cn("size-2 rounded-full", fenomeno.punto)} />
              <span className={cn("font-mono", fenomeno.texto)}>{fenomeno.clave}</span>
              {fenomeno.nombre}
            </h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-apagado">
              {fenomeno.descripcion}
            </p>
            <ul className="mt-3 space-y-2">
              {SUGERENCIAS.filter((sugerencia) => sugerencia.fenomeno === fenomeno.id).map(
                (sugerencia) => (
                  <li key={sugerencia.pregunta}>
                    <button
                      type="button"
                      disabled={deshabilitado}
                      className="w-full rounded border border-borde bg-elevado px-3 py-2 text-left text-xs leading-relaxed text-apagado transition-colors hover:border-acento/50 hover:text-texto disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => onElegir(sugerencia.pregunta)}
                    >
                      {sugerencia.pregunta}
                    </button>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
