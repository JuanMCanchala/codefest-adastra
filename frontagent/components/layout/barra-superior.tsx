"use client";

import { Radar } from "lucide-react";

import { IndicadorAgente } from "@/components/layout/indicador-agente";

export function BarraSuperior() {
  return (
    <header className="border-b border-borde bg-panel/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 border-b border-borde px-4 py-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-apagado">
          Uso académico · CODEFEST AD ASTRA 2026 · Etapa 2
        </p>
        <IndicadorAgente />
      </div>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded border border-borde bg-elevado text-acento">
          <Radar aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h1 className="text-base font-semibold leading-tight tracking-tight">
            Consola de Inteligencia
          </h1>
          <p className="text-xs text-apagado">
            Sistema multiagente con evidencia verificable sobre el corpus de la Etapa 1
          </p>
        </div>
      </div>
    </header>
  );
}
