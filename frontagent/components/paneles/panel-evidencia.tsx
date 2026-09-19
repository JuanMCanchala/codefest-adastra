"use client";

import { ArrowUpRight, FileSearch, Quote } from "lucide-react";

import type { RespuestaAgente } from "@/lib/tipos";
import { cn, etiquetaDocumento } from "@/lib/utils";

interface Props {
  datos: RespuestaAgente | null;
  nActiva: number | null;
  /** Tablero donde se abren todos los fragmentos del documento citado. */
  urlTablero: string | null;
  onSeleccionar: (n: number) => void;
}

/** Enlace a la referencia: el panel de evidencia del tablero, filtrado por ese documento. */
function enlaceDocumento(urlTablero: string, docId: string): string {
  const parametros = new URLSearchParams({
    componente: "panel_evidencia",
    doc_id: docId,
  });
  return `${urlTablero}/?${parametros.toString()}`;
}

function Vacio({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <FileSearch aria-hidden="true" className="size-6 text-apagado" />
      <p className="max-w-xs text-sm leading-relaxed text-apagado">{mensaje}</p>
    </div>
  );
}

export function PanelEvidencia({ datos, nActiva, urlTablero, onSeleccionar }: Props) {
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

              <p className="mt-1.5 text-xs text-apagado">
                fragmento {cita.chunk_id} de {cita.doc_id}
                {urlTablero ? (
                  <>
                    {" · "}
                    <a
                      href={enlaceDocumento(urlTablero, cita.doc_id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 text-senal underline decoration-dotted underline-offset-4 hover:text-acento"
                    >
                      ver el documento
                      <ArrowUpRight aria-hidden="true" className="size-3" />
                    </a>
                  </>
                ) : null}
              </p>

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
