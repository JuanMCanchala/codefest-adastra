"use client";

import { cn, recortar } from "@/lib/utils";

/** Una consulta enviada al agente, para poder volver a ella desde la lista. */
export interface EntradaHistorial {
  /** El identificador del mensaje del usuario: es el ancla en el hilo. */
  id: string;
  instruccion: string;
  hora: string;
  error: boolean;
}

export function horaActual(): string {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

/**
 * La lista de consultas anteriores, idéntica a la de la ventana del agente del tablero:
 * misma fila, misma hora a la derecha y misma marca cuando la consulta falló. Quien pasa
 * de una vista a la otra encuentra el mismo historial y lo usa igual.
 */
export function PanelHistorial({
  entradas,
  idActivo,
  onRecuperar,
}: {
  entradas: readonly EntradaHistorial[];
  idActivo: string | null;
  onRecuperar: (id: string) => void;
}) {
  if (entradas.length === 0) {
    return <p className="px-2 py-3 text-sm text-apagado">Todavía no hay consultas.</p>;
  }

  return (
    <ol className="flex flex-col gap-0.5">
      {entradas.map((entrada) => (
        <li key={entrada.id}>
          <button
            type="button"
            aria-current={entrada.id === idActivo ? "true" : undefined}
            onClick={() => onRecuperar(entrada.id)}
            className={cn(
              "flex w-full items-baseline gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
              entrada.id === idActivo
                ? "bg-elevado text-texto"
                : "text-apagado hover:bg-elevado/60 hover:text-texto",
            )}
          >
            <span className="min-w-0 flex-1 truncate">
              {recortar(entrada.instruccion, 80)}
            </span>
            <span className="shrink-0 font-mono text-xs text-tenue">
              {entrada.error ? "error" : entrada.hora}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
