"use client";

import { PanelEvidencia } from "@/components/paneles/panel-evidencia";
import { PanelTraza } from "@/components/paneles/panel-traza";
import type { RespuestaAgente } from "@/lib/tipos";
import { cn } from "@/lib/utils";

export type Pestana = "evidencia" | "traza";

interface Props {
  datos: RespuestaAgente | null;
  nActiva: number | null;
  pestana: Pestana;
  onCambiarPestana: (pestana: Pestana) => void;
  onSeleccionar: (n: number) => void;
}

const PESTANAS: ReadonlyArray<{ clave: Pestana; etiqueta: string }> = [
  { clave: "evidencia", etiqueta: "Evidencia" },
  { clave: "traza", etiqueta: "Traza" },
];

export function PanelLateral({
  datos,
  nActiva,
  pestana,
  onCambiarPestana,
  onSeleccionar,
}: Props) {
  return (
    <aside className="flex min-h-0 flex-col border-borde bg-panel lg:w-96 lg:border-l xl:w-[26rem]">
      <div role="tablist" aria-label="Paneles de inspección" className="flex border-b border-borde">
        {PESTANAS.map(({ clave, etiqueta }) => (
          <button
            key={clave}
            role="tab"
            type="button"
            id={`pestana-${clave}`}
            aria-selected={pestana === clave}
            aria-controls={`panel-${clave}`}
            className={cn(
              "flex-1 px-4 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors",
              pestana === clave
                ? "border-b-2 border-acento text-texto"
                : "border-b-2 border-transparent text-apagado hover:text-texto",
            )}
            onClick={() => onCambiarPestana(clave)}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="panel-evidencia"
        aria-labelledby="pestana-evidencia"
        hidden={pestana !== "evidencia"}
        className="min-h-0 flex-1"
      >
        {pestana === "evidencia" ? (
          <PanelEvidencia datos={datos} nActiva={nActiva} onSeleccionar={onSeleccionar} />
        ) : null}
      </div>

      <div
        role="tabpanel"
        id="panel-traza"
        aria-labelledby="pestana-traza"
        hidden={pestana !== "traza"}
        className="min-h-0 flex-1"
      >
        {pestana === "traza" ? <PanelTraza datos={datos} /> : null}
      </div>
    </aside>
  );
}
