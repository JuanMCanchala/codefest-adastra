import { FileSearch, Hash, Quote, X } from "lucide-react";
import { useMemo } from "react";

import { obtenerEvidencia } from "@/api/cliente";
import type { Ref } from "@/api/tipos";
import { Ayuda } from "@/componentes/ui/ayuda";
import { AvisoError, Cargando, Vacio } from "@/componentes/ui/estados";
import { Boton } from "@/componentes/ui/boton";
import { Insignia } from "@/componentes/ui/insignia";
import { fenomenoPorId } from "@/lib/fenomenos";
import type { Seleccion } from "@/lib/seleccion";
import { useRecurso } from "@/lib/usar-recurso";
import { useVistaTecnica } from "@/lib/vista-tecnica";
import { chunkIdsDe, etiquetaDocumento, formatearEntero } from "@/lib/utils";

/** Tope del lote de `/api/evidencia`: el panel pide y muestra como máximo estos fragmentos. */
const MAX_PANEL = 50;

interface Props {
  seleccion: Seleccion | null;
  /** Evidencia del componente completo, que se usa cuando el elemento no trae refs propias. */
  evidenciaGlobal: readonly Ref[];
  notaMetodo: string;
  totalEvidencia: number;
  onCerrar: () => void;
}

/**
 * Panel lateral de trazabilidad: convierte las refs {doc_id, chunk_id} del elemento pulsado
 * en el texto original del fragmento, leído de la base vectorial de la Etapa 1.
 */
export function PanelLateralEvidencia({
  seleccion,
  evidenciaGlobal,
  notaMetodo,
  totalEvidencia,
  onCerrar,
}: Props) {
  const tecnica = useVistaTecnica();
  const propias = seleccion?.refs ?? [];
  const usaGlobal = propias.length === 0;
  const refs = useMemo(
    () => (usaGlobal ? [...evidenciaGlobal] : propias),
    [evidenciaGlobal, propias, usaGlobal],
  );
  const chunkIds = useMemo(() => chunkIdsDe(refs).slice(0, MAX_PANEL), [refs]);
  const clave = chunkIds.join(",");
  const evidencia = useRecurso(clave, (senal) =>
    chunkIds.length === 0 ? Promise.resolve([]) : obtenerEvidencia(chunkIds, senal),
  );

  return (
    <aside
      className="flex h-full min-h-0 flex-col rounded-md border border-borde bg-panel lg:rounded-none lg:border-y-0 lg:border-r-0"
      aria-label="Panel de evidencia"
    >
      <header className="flex items-start gap-2 border-b border-borde px-4 py-3">
        <FileSearch aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-senal" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-apagado">
            Evidencia
          </h2>
          <p className="mt-0.5 truncate text-base font-semibold text-texto">
            {seleccion?.titulo ?? "Componente completo"}
          </p>
          {seleccion ? (
            <p className="mt-0.5 text-sm leading-relaxed text-apagado">{seleccion.detalle}</p>
          ) : null}
        </div>
        {seleccion ? (
          <Boton
            variante="fantasma"
            tamano="icono"
            onClick={onCerrar}
            aria-label="Quitar la selección"
          >
            <X aria-hidden="true" className="size-4" />
          </Boton>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-borde bg-elevado/40 px-4 py-2">
        <Insignia>
          {formatearEntero(chunkIds.length)} de {formatearEntero(totalEvidencia)} fragmentos
        </Insignia>
        {tecnica ? (
          <>
            {usaGlobal ? <Insignia>evidencia del componente</Insignia> : null}
            <Ayuda titulo="Cómo se calculó">
              {notaMetodo || "La API no devolvió nota de método."}
            </Ayuda>
          </>
        ) : null}
      </div>

      {/* La lista se desplaza y sus fragmentos no son enfocables: sin tabIndex no hay
          forma de leerla con el teclado (WCAG 2.1.1, axe scrollable-region-focusable). */}
      <div
        className="barra-fina min-h-0 flex-1 overflow-y-auto"
        tabIndex={0}
        role="region"
        aria-label="Fragmentos de evidencia"
      >
        {chunkIds.length === 0 ? (
          <Vacio
            titulo="Sin fragmentos que mostrar"
            detalle="Pulse una región, un punto, una celda o una arista para abrir la evidencia que la sustenta."
          />
        ) : evidencia.fase === "cargando" ? (
          <Cargando mensaje="Leyendo los fragmentos originales…" />
        ) : evidencia.fase === "error" ? (
          <AvisoError mensaje={evidencia.mensaje} onReintentar={evidencia.recargar} />
        ) : (
          <ul className="divide-y divide-borde">
            {evidencia.dato.map((fragmento) => {
              const fenomeno = fenomenoPorId(fragmento.fenomeno);
              return (
                <li key={`${fragmento.doc_id}-${String(fragmento.chunk_id)}`} className="px-4 py-3">
                  <p className="text-sm font-medium leading-snug text-texto">
                    {etiquetaDocumento(fragmento.titulo, fragmento.fuente)}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-tenue">
                    {fragmento.fuente}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Insignia>
                      <Hash aria-hidden="true" className="size-3" />
                      doc {fragmento.doc_id}
                    </Insignia>
                    <Insignia>
                      <Hash aria-hidden="true" className="size-3" />
                      chunk {String(fragmento.chunk_id)}
                    </Insignia>
                    {fenomeno ? <Insignia>{fenomeno.clave}</Insignia> : null}
                    {fragmento.organizacion ? <Insignia>{fragmento.organizacion}</Insignia> : null}
                    {fragmento.fecha ? <Insignia>{fragmento.fecha}</Insignia> : null}
                  </div>
                  <blockquote className="mt-3 rounded border border-borde bg-fondo px-3 py-2.5 text-sm leading-relaxed text-texto">
                    <Quote aria-hidden="true" className="mb-1 size-3.5 text-senal" />
                    {fragmento.texto}
                  </blockquote>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
