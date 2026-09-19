"use client";

import { ArrowUpRight } from "lucide-react";

import { IndicadorAgente } from "@/components/layout/indicador-agente";

/** Barra compartida con el tablero: marca, salida al tablero y estado del agente. */
export function BarraSuperior({ urlTablero }: { urlTablero: string | null }) {
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
