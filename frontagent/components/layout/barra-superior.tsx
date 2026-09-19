"use client";

import { ArrowUpRight, Radar } from "lucide-react";

import { IndicadorAgente } from "@/components/layout/indicador-agente";

/** Barra de mando compartida con el tablero: marca, salida al tablero y estado del agente. */
export function BarraSuperior({ urlTablero }: { urlTablero: string | null }) {
  return (
    <header className="franja-mando border-b border-borde bg-panel">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <h1 className="flex min-w-0 items-center gap-3 text-lg font-semibold leading-tight tracking-[-0.01em]">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-acento/50 bg-acento/10 text-acento">
            <Radar aria-hidden="true" className="size-5" />
          </span>
          <span className="truncate">
            <span className="text-acento">AeroCode</span>
            <span aria-hidden="true" className="mx-2 text-control">
              /
            </span>
            Consola de inteligencia
          </span>
        </h1>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {urlTablero ? (
            <a
              href={urlTablero}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-control bg-elevado px-3 text-sm text-texto transition-colors hover:border-acento/70"
            >
              Tablero de analítica
              <ArrowUpRight
                aria-hidden="true"
                className="size-4 text-apagado"
              />
            </a>
          ) : null}
          <IndicadorAgente />
        </div>
      </div>
    </header>
  );
}
