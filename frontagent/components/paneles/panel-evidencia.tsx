"use client";

import { FileSearch, Hash, Quote } from "lucide-react";

import { Insignia } from "@/components/ui/insignia";
import type { RespuestaAgente } from "@/lib/tipos";
import { cn, etiquetaDocumento } from "@/lib/utils";

interface Props {
  datos: RespuestaAgente | null;
  nActiva: number | null;
  onSeleccionar: (n: number) => void;
}

function Vacio({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <FileSearch aria-hidden="true" className="size-6 text-apagado" />
      <p className="max-w-xs text-sm leading-relaxed text-apagado">{mensaje}</p>
    </div>
  );
}

export function PanelEvidencia({ datos, nActiva, onSeleccionar }: Props) {
  if (!datos) {
    return (
      <Vacio mensaje="Envíe una consulta: aquí aparecerán los fragmentos del corpus que sustentan cada afirmación." />
    );
  }

  const citas = datos.extras?.citas ?? [];
  if (citas.length === 0) {
    return (
      <Vacio mensaje="Esta respuesta no se apoyó en fragmentos del corpus, por lo que no hay evidencia para inspeccionar." />
    );
  }

  return (
    <div className="barra-fina h-full overflow-y-auto">
      <ul className="divide-y divide-borde">
        {citas.map((cita) => {
          const fragmento = datos.evaluacion.retrieval_context[cita.n - 1];
          const activa = nActiva === cita.n;
          return (
            <li
              key={cita.n}
              id={`evidencia-${cita.n}`}
              className={cn(
                "scroll-mt-2 px-4 py-3 transition-colors",
                activa ? "bg-elevado" : "hover:bg-elevado/60",
              )}
            >
              <button
                type="button"
                className="w-full text-left"
                aria-expanded={activa}
                onClick={() => onSeleccionar(cita.n)}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded border font-mono text-xs font-medium",
                      activa
                        ? "border-acento bg-acento text-fondo"
                        : "border-senal/50 bg-elevado text-senal",
                    )}
                  >
                    {cita.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-texto">
                      {etiquetaDocumento(cita.titulo, cita.fuente)}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-xs text-tenue">
                      {cita.fuente}
                    </p>
                  </div>
                </div>
              </button>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <Insignia>
                  <Hash aria-hidden="true" className="size-3" />
                  doc {cita.doc_id}
                </Insignia>
                <Insignia>
                  <Hash aria-hidden="true" className="size-3" />
                  chunk {cita.chunk_id}
                </Insignia>
              </div>

              {activa ? (
                <blockquote className="mt-3 rounded border border-borde bg-fondo px-3 py-2.5 text-sm leading-relaxed text-texto">
                  <Quote aria-hidden="true" className="mb-1 size-3.5 text-senal" />
                  {fragmento ?? "El agente no devolvió el texto de este fragmento."}
                </blockquote>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
