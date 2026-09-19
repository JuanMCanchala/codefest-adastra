import { ArrowUpRight, Compass, Radar, Terminal } from "lucide-react";
import type { ReactNode } from "react";

import { obtenerSalud } from "@/api/cliente";
import { useRecurso } from "@/lib/usar-recurso";
import { cn } from "@/lib/utils";

export type Modo = "instruccion" | "manual";

interface Props {
  modo: Modo;
  onCambiarModo: (modo: Modo) => void;
}

/**
 * Encabezado: marca, selector de modo y salida hacia la consola de chat.
 *
 * El corpus en línea solo se anuncia cuando falla: mientras responde, el dato ya está en la
 * vista y el aviso solo ocupa sitio.
 */
export function BarraSuperior({ modo, onCambiarModo }: Props) {
  const salud = useRecurso("salud", (senal) => obtenerSalud(senal));
  const urlConsola = salud.fase === "listo" ? (salud.dato.consola_url ?? null) : null;

  return (
    <header className="franja-mando sticky top-0 z-20 border-b border-borde bg-panel">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <h1 className="flex min-w-0 items-center gap-3 text-lg font-semibold leading-tight tracking-[-0.01em]">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-acento/50 bg-acento/10 text-acento">
            <Radar aria-hidden="true" className="size-5" />
          </span>
          <span className="truncate">
            <span className="text-acento">AeroCode</span>
            <span aria-hidden="true" className="mx-2 text-control">
              /
            </span>
            Analítica visual
          </span>
        </h1>

        <nav
          className="ml-auto flex items-center gap-1 rounded-md border border-borde bg-fondo p-1"
          aria-label="Modo de trabajo"
        >
          <BotonModo
            activo={modo === "instruccion"}
            etiqueta="Instrucción"
            onClick={() => onCambiarModo("instruccion")}
            icono={<Terminal aria-hidden="true" className="size-3.5" />}
          />
          <BotonModo
            activo={modo === "manual"}
            etiqueta="Exploración"
            onClick={() => onCambiarModo("manual")}
            icono={<Compass aria-hidden="true" className="size-3.5" />}
          />
        </nav>

        {urlConsola ? (
          <a
            href={urlConsola}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-control bg-elevado px-3 text-sm text-texto transition-colors hover:border-acento/70"
          >
            Consola de chat
            <ArrowUpRight aria-hidden="true" className="size-4 text-apagado" />
          </a>
        ) : null}

        {salud.fase === "error" ? (
          <p
            className="inline-flex h-9 items-center gap-2 rounded-md border border-alerta/50 bg-fondo px-3 text-sm text-apagado"
            role="status"
          >
            <span aria-hidden="true" className="size-2 rounded-full bg-alerta" />
            Corpus no disponible
          </p>
        ) : null}
      </div>
    </header>
  );
}

interface PropsBotonModo {
  activo: boolean;
  etiqueta: string;
  icono: ReactNode;
  onClick: () => void;
}

function BotonModo({ activo, etiqueta, icono, onClick }: PropsBotonModo) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded px-3 text-sm font-medium transition-colors",
        activo ? "bg-acento/15 text-texto ring-1 ring-acento/60" : "text-apagado hover:text-texto",
      )}
    >
      {icono}
      {etiqueta}
    </button>
  );
}
