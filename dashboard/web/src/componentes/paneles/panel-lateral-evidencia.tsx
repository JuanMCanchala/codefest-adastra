import { PanelRightClose, X } from "lucide-react";
import { useMemo } from "react";

import { obtenerEvidencia } from "@/api/cliente";
import type { Ref } from "@/api/tipos";
import { AvisoError, Cargando, Vacio } from "@/componentes/ui/estados";
import { Boton } from "@/componentes/ui/boton";
import { fenomenoPorId } from "@/lib/fenomenos";
import type { Seleccion } from "@/lib/seleccion";
import { useRecurso } from "@/lib/usar-recurso";
import { useVistaTecnica } from "@/lib/vista-tecnica";
import { chunkIdsDe, etiquetaDocumento } from "@/lib/utils";

/** Tope del lote de `/api/evidencia`: el panel pide y muestra como máximo estos fragmentos. */
const MAX_PANEL = 50;

interface Props {
  seleccion: Seleccion | null;
  /** Evidencia del componente completo, que se usa cuando el elemento no trae refs propias. */
  evidenciaGlobal: readonly Ref[];
  onCerrar: () => void;
  onOcultar: () => void;
  /** Abre todos los fragmentos del documento: el enlace de la cita a su referencia. */
  onVerDocumento: (docId: string) => void;
}

/**
 * Trazabilidad: convierte las refs {doc_id, chunk_id} del elemento pulsado en el texto
 * original del fragmento, leído de la base vectorial de la Etapa 1.
 *
 * El panel es una sola columna de fragmentos. Los recuentos y la nota de método se leen en la
 * cabecera del componente, así que aquí no se repiten: lo que importa es el texto de la
 * fuente y el documento del que salió.
 */
export function PanelLateralEvidencia({
  seleccion,
  evidenciaGlobal,
  onCerrar,
  onOcultar,
  onVerDocumento,
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
    <aside className="flex h-full min-h-0 flex-col bg-panel" aria-label="Panel de evidencia">
      <header className="flex items-center gap-1 border-b border-borde px-4 py-2">
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-texto">
          Evidencia
          {seleccion ? (
            <span className="font-normal text-apagado"> · {seleccion.titulo}</span>
          ) : null}
        </h2>
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
        <Boton
          variante="fantasma"
          tamano="icono"
          onClick={onOcultar}
          aria-label="Ocultar la evidencia"
        >
          <PanelRightClose aria-hidden="true" className="size-4" />
        </Boton>
      </header>

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
          <ul>
            {evidencia.dato.map((fragmento) => {
              const fenomeno = fenomenoPorId(fragmento.fenomeno);
              return (
                <li
                  key={`${fragmento.doc_id}-${String(fragmento.chunk_id)}`}
                  className="border-b border-borde/60 px-4 py-3"
                >
                  {/* La cita se lee como una referencia y abre el documento del que salió. */}
                  <button
                    type="button"
                    onClick={() => onVerDocumento(fragmento.doc_id)}
                    title={`Ver todos los fragmentos de ${fragmento.doc_id}`}
                    className="block w-full text-left text-sm font-medium leading-snug text-texto underline decoration-borde decoration-dotted underline-offset-4 hover:decoration-acento"
                  >
                    {etiquetaDocumento(fragmento.titulo, fragmento.fuente)}
                  </button>
                  <p className="mt-0.5 truncate text-xs text-tenue">
                    {[
                      fragmento.organizacion,
                      fragmento.fecha,
                      fenomeno?.clave,
                      `fragmento ${String(fragmento.chunk_id)} de ${fragmento.doc_id}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {tecnica ? (
                    <p className="mt-0.5 break-all font-mono text-xs text-tenue">
                      {fragmento.fuente}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm leading-relaxed text-apagado">{fragmento.texto}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
