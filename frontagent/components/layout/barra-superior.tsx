"use client";

import { ArrowUpRight, History, Moon, Sun, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { IndicadorAgente } from "@/components/layout/indicador-agente";
import { alternarTema, useModoTema } from "@/lib/tema";
import { cn } from "@/lib/utils";

interface Props {
  urlTablero: string | null;
  /** Mandos del hilo, los mismos que la ventana del agente del tablero. */
  verHistorial: boolean;
  onAlternarHistorial: () => void;
  onLimpiar: () => void;
}

/** Barra compartida con el tablero: marca, salida al tablero y estado del agente. */
export function BarraSuperior({
  urlTablero,
  verHistorial,
  onAlternarHistorial,
  onLimpiar,
}: Props) {
  const modo = useModoTema();

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-borde bg-panel px-4 py-2.5">
      <h1 className="min-w-0 truncate text-sm font-semibold tracking-[-0.01em]">
        AeroCode
        <span aria-hidden="true" className="mx-2 text-tenue">
          /
        </span>
        <span className="font-normal text-apagado">Consola de inteligencia</span>
      </h1>

      <div className="ml-auto flex flex-wrap items-center gap-3">
        <IndicadorAgente />
        <BotonCabecera
          activo={verHistorial}
          onClick={onAlternarHistorial}
          etiqueta="Consultas anteriores"
        >
          <History aria-hidden="true" className="size-4" />
        </BotonCabecera>
        <BotonCabecera onClick={onLimpiar} etiqueta="Limpiar la conversación">
          <Trash2 aria-hidden="true" className="size-4" />
        </BotonCabecera>
        <button
          type="button"
          onClick={alternarTema}
          aria-label={modo === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          title={modo === "oscuro" ? "Modo claro" : "Modo oscuro"}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-apagado transition-colors hover:bg-elevado hover:text-texto"
        >
          {modo === "oscuro" ? (
            <Sun aria-hidden="true" className="size-4" />
          ) : (
            <Moon aria-hidden="true" className="size-4" />
          )}
        </button>
        {urlTablero ? (
          <a
            href={urlTablero}
            className="inline-flex items-center gap-1.5 text-sm text-apagado transition-colors hover:text-texto"
          >
            Tablero de analítica
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
        ) : null}
      </div>
    </header>
  );
}

function BotonCabecera({
  activo,
  onClick,
  etiqueta,
  children,
}: {
  activo?: boolean;
  onClick: () => void;
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      aria-pressed={activo}
      title={etiqueta}
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
        activo ? "bg-elevado text-texto" : "text-apagado hover:bg-elevado hover:text-texto",
      )}
    >
      {children}
    </button>
  );
}
