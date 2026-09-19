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
    <header className="franja-mando sticky top-0 z-20 border-b border-borde bg-panel">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-2.5 pt-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-acento/50 bg-acento/10 text-acento">
            <Radar aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight tracking-[-0.01em]">
              <span className="text-acento">AeroCode</span>
              <span aria-hidden="true" className="mx-2 text-control">
                /
              </span>
              Analítica visual
            </h1>
            <p className="hidden text-sm text-apagado sm:block">
              Cada dato abre su fragmento · uso académico, CODEFEST AD ASTRA 2026
            </p>
          </div>
        </div>

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

        <p
          className="inline-flex h-9 items-center gap-2 rounded-md border border-borde bg-fondo px-3 text-sm text-apagado"
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
                  : "bg-tenue animate-pulse",
            )}
          />
          {salud.fase === "listo" ? (
            <>
              <span className="hidden sm:inline">Corpus en línea · </span>
              {formatearEntero(fragmentos)} fragmentos
            </>
          ) : salud.fase === "error" ? (
            "Corpus no disponible"
          ) : (
            "Verificando la conexión…"
          )}
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
        "inline-flex h-8 items-center gap-1.5 rounded px-3 text-sm font-medium transition-colors",
        activo ? "bg-acento/15 text-texto ring-1 ring-acento/60" : "text-apagado hover:text-texto",
      )}
    >
      {icono}
      {etiqueta}
    </button>
  );
}
