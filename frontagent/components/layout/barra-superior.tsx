"use client";

import { ArrowUpRight, Radar, Wrench } from "lucide-react";

import { IndicadorAgente } from "@/components/layout/indicador-agente";
import { alternarVistaTecnica, useVistaTecnica } from "@/lib/vista-tecnica";
import { cn } from "@/lib/utils";

/** Barra de mando compartida con el tablero: marca, puesto y estado del sistema. */
export function BarraSuperior({ urlTablero }: { urlTablero: string | null }) {
  const tecnica = useVistaTecnica();

  return (
    <header className="franja-mando border-b border-borde bg-panel">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-2.5 pt-3">
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
              Consola de inteligencia
            </h1>
            <p className="hidden text-sm text-apagado sm:block">
              Respuestas citadas al corpus oficial · uso académico, CODEFEST AD ASTRA 2026
            </p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {urlTablero ? (
            <a
              href={urlTablero}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-control bg-elevado px-3 text-sm text-texto transition-colors hover:border-acento/70"
            >
              Tablero de analítica
              <ArrowUpRight
                aria-hidden="true"
                className="size-4 text-apagado"
              />
            </a>
          ) : null}
          <button
            type="button"
            aria-pressed={tecnica}
            onClick={alternarVistaTecnica}
            title="Muestra la ruta interna, el consumo de tokens, los modelos y los parámetros de las herramientas"
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors",
              tecnica
                ? "border-acento bg-acento/10 text-texto"
                : "border-control bg-elevado text-apagado hover:text-texto",
            )}
          >
            <Wrench aria-hidden="true" className="size-3.5" />
            Vista técnica
          </button>
          <IndicadorAgente />
        </div>
      </div>
    </header>
  );
}
