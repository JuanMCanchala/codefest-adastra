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
    <div className="space-y-3 text-sm leading-relaxed text-texto">
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
                  "mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded border px-1 align-super font-mono text-[10px] transition-colors",
                  activa
                    ? "border-acento bg-acento text-fondo"
                    : "border-acento/40 bg-acento/10 text-acento hover:bg-acento/25",
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
