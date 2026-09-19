"use client";

import { FileText } from "lucide-react";

import type { Cita } from "@/lib/tipos";
import { cn, recortar } from "@/lib/utils";

interface Props {
  citas: Cita[];
  nActiva: number | null;
  onSeleccionar: (n: number) => void;
  onPrevisualizar: (n: number | null) => void;
}

export function ListaFuentes({ citas, nActiva, onSeleccionar, onPrevisualizar }: Props) {
  if (citas.length === 0) {
    return null;
  }

  return (
    <section className="mt-4 border-t border-borde pt-3">
      <h4 className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-apagado">
        <FileText aria-hidden="true" className="size-3.5" />
        Fuentes ({citas.length})
      </h4>
      <ul className="flex flex-wrap gap-2">
        {citas.map((cita) => (
          <li key={cita.n}>
            <button
              type="button"
              className={cn(
                "flex max-w-70 items-center gap-2 rounded border px-2 py-1 text-left text-xs transition-colors",
                nActiva === cita.n
                  ? "border-acento bg-acento/15 text-texto"
                  : "border-borde bg-elevado text-apagado hover:border-acento/50 hover:text-texto",
              )}
              onClick={() => onSeleccionar(cita.n)}
              onMouseEnter={() => onPrevisualizar(cita.n)}
              onMouseLeave={() => onPrevisualizar(null)}
            >
              <span className="font-mono text-[10px] text-acento">[{cita.n}]</span>
              <span className="truncate">{recortar(cita.titulo || cita.fuente, 60)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
