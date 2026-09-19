import { FileText, Hash } from "lucide-react";

import type { FilaEvidencia } from "@/api/tipos";
import { Vacio } from "@/componentes/ui/estados";
import { Insignia } from "@/componentes/ui/insignia";
import type { PropsVista } from "@/lib/seleccion";
import { cn, etiquetaDocumento } from "@/lib/utils";

/** Fragmentos originales del corpus: el componente más directo de trazabilidad. */
export function VistaPanelEvidencia({
  datos,
  seleccion,
  onSeleccionar,
}: PropsVista<FilaEvidencia[]>) {
  if (datos.length === 0) {
    return (
      <Vacio
        titulo="Ningún fragmento coincide"
        detalle="Ajuste la consulta, la entidad o el documento en los filtros."
      />
    );
  }

  return (
    <ul className="divide-y divide-borde">
      {datos.map((fila) => {
        const activa = seleccion?.titulo === fila.titulo && seleccion.origen === "panel_evidencia";
        return (
          <li key={`${fila.doc_id}-${String(fila.chunk_id)}`}>
            <button
              type="button"
              aria-pressed={activa}
              className={cn(
                "w-full px-4 py-3 text-left transition-colors",
                activa ? "bg-acento/10" : "hover:bg-elevado/60",
              )}
              onClick={() =>
                onSeleccionar({
                  titulo: fila.titulo || fila.doc_id,
                  detalle: `Fragmento del documento ${fila.doc_id}`,
                  origen: "panel_evidencia",
                  refs: [{ doc_id: fila.doc_id, chunk_id: fila.chunk_id }],
                })
              }
            >
              <div className="flex items-start gap-2">
                <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-senal" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-texto">
                    {etiquetaDocumento(fila.titulo, fila.fuente)}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-tenue">{fila.fuente}</p>
                </div>
              </div>
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-apagado">
                {fila.fragmento}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Insignia>
                  <Hash aria-hidden="true" className="size-3" />
                  doc {fila.doc_id}
                </Insignia>
                <Insignia>
                  <Hash aria-hidden="true" className="size-3" />
                  chunk {String(fila.chunk_id)}
                </Insignia>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
