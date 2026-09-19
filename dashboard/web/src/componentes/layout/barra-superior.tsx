import { Compass, Radar, Terminal } from "lucide-react";
import type { ReactNode } from "react";

import { obtenerSalud } from "@/api/cliente";
import { useRecurso } from "@/lib/usar-recurso";
import { cn, formatearEntero } from "@/lib/utils";

export type Modo = "instruccion" | "manual";

interface Props {
  modo: Modo;
  onCambiarModo: (modo: Modo) => void;
}

/** Encabezado con la identidad del producto, el estado de la API y el selector de modo. */
export function BarraSuperior({ modo, onCambiarModo }: Props) {
  const salud = useRecurso("salud", (senal) => obtenerSalud(senal));
  const fragmentos = salud.fase === "listo" ? (salud.dato.tablas["fragmentos"] ?? 0) : 0;

  return (
    <header className="sticky top-0 z-20 border-b border-borde bg-fondo/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-3 px-4 py-2.5">
        <span className="flex size-8 items-center justify-center rounded-md border border-acento/40 bg-acento/10 text-acento">
          <Radar aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold tracking-tight">Analítica visual del corpus</h1>
          <p className="text-[11px] text-apagado">
            Reto 2 · CODEFEST AD ASTRA 2026 · trazabilidad a fragmento
          </p>
        </div>

        <nav className="ml-auto flex items-center gap-1 rounded-md border border-borde bg-panel p-1" aria-label="Modo de trabajo">
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

        <p
          className="flex items-center gap-1.5 rounded-md border border-borde bg-panel px-2.5 py-1.5 text-[11px] text-apagado"
          role="status"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-2 rounded-full",
              salud.fase === "listo"
                ? "bg-ok"
                : salud.fase === "error"
                  ? "bg-alerta"
                  : "bg-apagado animate-pulse",
            )}
          />
          {salud.fase === "listo"
            ? `API en línea · ${formatearEntero(fragmentos)} fragmentos indexados`
            : salud.fase === "error"
              ? "API no disponible"
              : "Verificando la API…"}
        </p>
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
        "inline-flex h-8 items-center gap-1.5 rounded px-3 text-xs transition-colors",
        activo ? "bg-acento/15 text-acento" : "text-apagado hover:text-texto",
      )}
    >
      {icono}
      {etiqueta}
    </button>
  );
}
