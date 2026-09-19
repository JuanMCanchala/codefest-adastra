"use client";

import { Fragment } from "react";

import { segmentarRespuesta } from "@/lib/citas";
import type { Cita } from "@/lib/tipos";
import { cn } from "@/lib/utils";

interface Props {
  texto: string;
  citas: Cita[];
  nActiva: number | null;
  onSeleccionar: (n: number) => void;
  onPrevisualizar: (n: number | null) => void;
}

export function TextoConCitas({ texto, citas, nActiva, onSeleccionar, onPrevisualizar }: Props) {
  const parrafos = segmentarRespuesta(texto);
  const disponibles = new Set(citas.map((cita) => cita.n));

  return (
    <div className="max-w-[75ch] space-y-4 text-base leading-[1.65] text-texto">
      {parrafos.map((segmentos, indiceParrafo) => (
        <p key={indiceParrafo}>
          {segmentos.map((segmento, indice) => {
            if (segmento.tipo === "texto") {
              return <Fragment key={indice}>{segmento.texto}</Fragment>;
            }
            if (!disponibles.has(segmento.n)) {
              return <Fragment key={indice}>[{segmento.n}]</Fragment>;
            }
            const activa = nActiva === segmento.n;
            return (
              <button
                key={indice}
                type="button"
                aria-label={`Ver evidencia de la cita ${segmento.n}`}
                className={cn(
                  "mx-0.5 inline-flex h-[22px] min-w-[22px] -translate-y-px items-center justify-center rounded border px-1 align-middle font-mono text-xs font-medium transition-colors",
                  activa
                    ? "border-acento bg-acento text-fondo"
                    : "border-senal/50 bg-elevado text-senal hover:border-senal hover:bg-senal/15",
                )}
                onClick={() => onSeleccionar(segmento.n)}
                onMouseEnter={() => onPrevisualizar(segmento.n)}
                onMouseLeave={() => onPrevisualizar(null)}
                onFocus={() => onPrevisualizar(segmento.n)}
                onBlur={() => onPrevisualizar(null)}
              >
                {segmento.n}
              </button>
            );
          })}
        </p>
      ))}
    </div>
  );
}
