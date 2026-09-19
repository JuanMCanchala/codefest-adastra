import { History, TriangleAlert } from "lucide-react";

import { Insignia } from "@/componentes/ui/insignia";
import type { EntradaHistorial } from "@/lib/historial";
import { cn, recortar } from "@/lib/utils";

interface Props {
  entradas: readonly EntradaHistorial[];
  idActivo: string | null;
  onSeleccionar: (id: string) => void;
}

/** Historial de instrucciones: permite volver a cualquier análisis de la sesión. */
export function HistorialInstrucciones({ entradas, idActivo, onSeleccionar }: Props) {
  return (
    <section
      className="rounded-md border border-borde bg-panel"
      aria-labelledby="titulo-historial"
    >
      <h2
        id="titulo-historial"
        className="inline-flex items-center gap-2 border-b border-borde px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-apagado"
      >
        <History aria-hidden="true" className="size-3.5" />
        Historial de instrucciones
      </h2>
      {entradas.length === 0 ? (
        <p className="px-4 py-3 text-xs leading-relaxed text-apagado">
          Todavía no hay instrucciones en esta sesión.
        </p>
      ) : (
        <ol className="barra-fina max-h-64 divide-y divide-borde overflow-y-auto">
          {entradas.map((entrada) => {
            const activa = entrada.id === idActivo;
            const componente = entrada.respuesta?.especificacion?.componente ?? null;
            return (
              <li key={entrada.id}>
                <button
                  type="button"
                  aria-current={activa ? "true" : undefined}
                  onClick={() => onSeleccionar(entrada.id)}
                  className={cn(
                    "w-full px-4 py-2.5 text-left transition-colors",
                    activa ? "bg-acento/10" : "hover:bg-elevado/60",
                  )}
                >
                  <p className="text-xs leading-snug text-texto">
                    {recortar(entrada.instruccion, 110)}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Insignia>{entrada.hora}</Insignia>
                    {entrada.error ? (
                      <Insignia className="border-alerta/40 bg-alerta/10 text-alerta">
                        <TriangleAlert aria-hidden="true" className="size-3" />
                        error
                      </Insignia>
                    ) : componente ? (
                      <Insignia>{componente}</Insignia>
                    ) : (
                      <Insignia>solo texto</Insignia>
                    )}
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
