"use client";

import { FileText } from "lucide-react";

import type { Cita } from "@/lib/tipos";
import { cn, etiquetaDocumento, recortar } from "@/lib/utils";

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
      <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-apagado">
        <FileText aria-hidden="true" className="size-3.5" />
        Fuentes ({citas.length})
      </h4>
      <ul className="flex flex-wrap gap-2">
        {citas.map((cita) => (
          <li key={cita.n}>
            <button
              type="button"
              className={cn(
                "flex min-h-9 max-w-80 items-center gap-2 rounded border px-2.5 py-1.5 text-left text-sm transition-colors",
                nActiva === cita.n
                  ? "border-acento bg-acento/10 text-texto"
                  : "border-control/60 bg-elevado text-apagado hover:border-senal/70 hover:text-texto",
              )}
              onClick={() => onSeleccionar(cita.n)}
              onMouseEnter={() => onPrevisualizar(cita.n)}
              onMouseLeave={() => onPrevisualizar(null)}
            >
              <span className="font-mono text-xs text-senal">[{cita.n}]</span>
              <span className="truncate">{recortar(etiquetaDocumento(cita.titulo, cita.fuente), 60)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
