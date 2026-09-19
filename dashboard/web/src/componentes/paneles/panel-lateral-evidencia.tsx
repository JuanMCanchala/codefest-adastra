import { FileSearch, Hash, Quote, X } from "lucide-react";
import { useMemo } from "react";

import { obtenerEvidencia } from "@/api/cliente";
import type { Ref } from "@/api/tipos";
import { AvisoError, Cargando, Vacio } from "@/componentes/ui/estados";
import { Boton } from "@/componentes/ui/boton";
import { Insignia } from "@/componentes/ui/insignia";
import { fenomenoPorId } from "@/lib/fenomenos";
import type { Seleccion } from "@/lib/seleccion";
import { useRecurso } from "@/lib/usar-recurso";
import { chunkIdsDe, formatearEntero } from "@/lib/utils";

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
  const propias = seleccion?.refs ?? [];
  const usaGlobal = propias.length === 0;
  const refs = useMemo(
    () => (usaGlobal ? [...evidenciaGlobal] : propias),
    [evidenciaGlobal, propias, usaGlobal],
  );
  const chunkIds = useMemo(() => chunkIdsDe(refs), [refs]);
  const clave = chunkIds.slice(0, 50).join(",");
  const evidencia = useRecurso(clave, (senal) =>
    chunkIds.length === 0 ? Promise.resolve([]) : obtenerEvidencia(chunkIds, senal),
  );

  return (
    <aside
      className="flex h-full min-h-0 flex-col border-l border-borde bg-panel"
      aria-label="Panel de evidencia"
    >
      <header className="flex items-start gap-2 border-b border-borde px-4 py-3">
        <FileSearch aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-acento" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-apagado">
            Evidencia
          </h2>
          <p className="mt-0.5 truncate text-sm font-medium text-texto">
            {seleccion?.titulo ?? "Componente completo"}
          </p>
          {seleccion ? (
            <p className="mt-0.5 text-[11px] leading-relaxed text-apagado">{seleccion.detalle}</p>
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

      <div className="border-b border-borde bg-elevado/40 px-4 py-2 text-[11px] leading-relaxed text-apagado">
        <p>{notaMetodo || "La API no devolvió nota de método."}</p>
        <p className="mt-1.5 flex flex-wrap gap-1.5">
          <Insignia>{formatearEntero(totalEvidencia)} fragmentos en total</Insignia>
          <Insignia>{formatearEntero(chunkIds.length)} en este panel</Insignia>
          {usaGlobal ? <Insignia>evidencia del componente</Insignia> : null}
        </p>
      </div>

      <div className="barra-fina min-h-0 flex-1 overflow-y-auto">
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
                  <p className="text-xs font-medium leading-snug text-texto">
                    {fragmento.titulo || "Documento sin título"}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-apagado">
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
                  <blockquote className="mt-2 border-l-2 border-acento/60 bg-fondo/60 px-3 py-2 text-xs leading-relaxed text-texto">
                    <Quote aria-hidden="true" className="mb-1 size-3 text-apagado" />
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
