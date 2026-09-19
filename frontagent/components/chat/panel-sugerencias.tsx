"use client";

import { CornerDownLeft } from "lucide-react";

import { Ayuda } from "@/components/ui/ayuda";
import { SimboloFenomeno } from "@/components/ui/simbolo-fenomeno";
import { FENOMENOS } from "@/lib/fenomenos";
import { SUGERENCIAS } from "@/lib/sugerencias";
import { cn } from "@/lib/utils";

interface Props {
  deshabilitado: boolean;
  onElegir: (pregunta: string) => void;
}

/** Estado inicial: consultas preparadas agrupadas por fenómeno, en una sola lista de mando. */
export function PanelSugerencias({ deshabilitado, onElegir }: Props) {
  return (
    <section aria-labelledby="titulo-sugerencias" className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 id="titulo-sugerencias" className="text-lg font-semibold">
          ¿Qué necesita verificar?
        </h2>
        <Ayuda titulo="Cómo leer las respuestas">
          Escriba su propia pregunta abajo o parta de una consulta preparada. Cada afirmación de
          la respuesta llevará su cita al fragmento del corpus, con su documento de origen.
        </Ayuda>
      </div>

      <ul className="divide-y divide-borde rounded-md border border-borde bg-panel">
        {FENOMENOS.map((fenomeno) => (
          <li
            key={fenomeno.id}
            className="grid grid-cols-[minmax(0,1fr)] gap-3 px-4 py-4 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-6"
          >
            <div>
              {/* El botón de ayuda va fuera del encabezado: dentro contaminaría su nombre. */}
              <div className="flex items-center gap-2">
                <h3 className="flex flex-1 items-center gap-2 text-sm font-semibold">
                  <SimboloFenomeno fenomeno={fenomeno} />
                  <span className={cn("font-mono", fenomeno.texto)}>{fenomeno.clave}</span>
                  {fenomeno.nombre}
                </h3>
                <Ayuda titulo={`${fenomeno.clave} · ${fenomeno.nombre}`}>
                  {fenomeno.descripcion}
                </Ayuda>
              </div>
            </div>
            <ul className="space-y-2">
              {SUGERENCIAS.filter((sugerencia) => sugerencia.fenomeno === fenomeno.id).map(
                (sugerencia) => (
                  <li key={sugerencia.pregunta}>
                    <button
                      type="button"
                      disabled={deshabilitado}
                      className="group flex w-full items-start gap-3 rounded-md border border-control/60 bg-elevado px-3 py-2.5 text-left text-sm leading-relaxed text-texto transition-colors hover:border-acento/70 disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => onElegir(sugerencia.pregunta)}
                    >
                      <span className="flex-1">{sugerencia.pregunta}</span>
                      <CornerDownLeft
                        aria-hidden="true"
                        className="mt-1 size-3.5 shrink-0 text-tenue group-hover:text-acento"
                      />
                    </button>
                  </li>
                ),
              )}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
