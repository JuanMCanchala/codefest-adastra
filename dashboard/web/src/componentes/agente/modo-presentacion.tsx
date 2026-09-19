import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

import { CuerpoComponente } from "@/componentes/vistas/cuerpo-componente";
import type { NivelMapa } from "@/componentes/vistas/mapa-colombia";
import { SimboloFenomeno } from "@/componentes/ui/simbolo-fenomeno";
import { definicionDe } from "@/lib/catalogo";
import { fenomenoPorId } from "@/lib/fenomenos";
import type { EntradaHistorial } from "@/lib/historial";
import type { Seleccion } from "@/lib/seleccion";
import { cn } from "@/lib/utils";

interface Props {
  /** Más reciente primero, como lo guarda el tablero; aquí se recorre en orden cronológico. */
  historial: readonly EntradaHistorial[];
  /** Turno por el que se empieza; si no está en el recorrido, se empieza por el primero. */
  idInicial: string | null;
  onSalir: () => void;
}

/**
 * Narrativa guiada (Anexo B.6.1) sin contradecir §3.3.2.
 *
 * El anexo describe «una secuencia de vistas que conduce al usuario a través de un
 * argumento analítico, útil para presentar hallazgos frente al equipo de expertos». Una
 * secuencia fija chocaría con la exigencia de que sea el agente quien active los componentes
 * según lo que se pregunta. La salida es que la secuencia **la escribe quien pregunta**: cada
 * turno de la conversación que produjo una vista es una diapositiva —la pregunta, la
 * respuesta del agente, por qué eligió ese gráfico y el gráfico mismo, con sus datos ya
 * calculados—, y aquí se recorren con las flechas, sin volver a pedir nada al agente.
 */
export function ModoPresentacion({ historial, idInicial, onSalir }: Props) {
  const pasos = useMemo(
    () =>
      [...historial]
        .reverse()
        .filter((entrada) => entrada.respuesta?.especificacion && entrada.respuesta.resultado),
    [historial],
  );
  const [indice, setIndice] = useState(() => {
    const posicion = pasos.findIndex((p) => p.id === idInicial);
    return posicion >= 0 ? posicion : 0;
  });
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [nivelColombia, setNivelColombia] = useState<NivelMapa>("departamento");

  const anterior = useCallback(() => setIndice((i) => Math.max(0, i - 1)), []);
  const siguiente = useCallback(
    () => setIndice((i) => Math.min(pasos.length - 1, i + 1)),
    [pasos.length],
  );

  useEffect(() => {
    setSeleccion(null);
  }, [indice]);

  // Flechas y Escape, como cualquier presentación proyectada.
  useEffect(() => {
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "ArrowRight" || evento.key === "PageDown" || evento.key === " ") {
        evento.preventDefault();
        siguiente();
      } else if (evento.key === "ArrowLeft" || evento.key === "PageUp") {
        evento.preventDefault();
        anterior();
      } else if (evento.key === "Escape") {
        onSalir();
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [anterior, onSalir, siguiente]);

  const paso = pasos[indice];
  const respuesta = paso?.respuesta ?? null;
  const resultado = respuesta?.resultado ?? null;
  const especificacion = respuesta?.especificacion ?? null;
  const fenomeno = fenomenoPorId(resultado?.fenomeno ?? null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Presentación del recorrido analítico"
      className="fixed inset-0 z-50 flex flex-col bg-fondo"
      style={{ "--alto-vista": "calc(100dvh - 8.5rem)" } as CSSProperties}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-borde bg-panel px-4 py-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-texto">
          <Sparkles aria-hidden="true" className="size-4 text-senal" />
          Recorrido
        </span>
        <span className="font-mono text-xs text-apagado" aria-live="polite">
          {pasos.length > 0 ? `${String(indice + 1)} / ${String(pasos.length)}` : "0 / 0"}
        </span>
        {/* Puntos de progreso: se ve cuánto queda y se salta a cualquier paso. */}
        <ol className="hidden items-center gap-1 sm:flex" aria-label="Pasos">
          {pasos.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                aria-label={`Paso ${String(i + 1)}: ${p.instruccion}`}
                aria-current={i === indice ? "step" : undefined}
                onClick={() => setIndice(i)}
                className={cn(
                  "block size-2 rounded-full transition-colors",
                  i === indice ? "bg-senal" : "bg-control hover:bg-apagado",
                )}
              />
            </li>
          ))}
        </ol>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={anterior}
            disabled={indice === 0}
            aria-label="Paso anterior"
            title="Anterior (←)"
            className="inline-flex size-8 items-center justify-center rounded-md text-apagado transition-colors hover:bg-elevado hover:text-texto disabled:opacity-40"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            onClick={siguiente}
            disabled={indice >= pasos.length - 1}
            aria-label="Paso siguiente"
            title="Siguiente (→)"
            className="inline-flex size-8 items-center justify-center rounded-md text-apagado transition-colors hover:bg-elevado hover:text-texto disabled:opacity-40"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            onClick={onSalir}
            aria-label="Salir de la presentación"
            title="Salir (Esc)"
            className="ml-2 inline-flex size-8 items-center justify-center rounded-md text-apagado transition-colors hover:bg-elevado hover:text-texto"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      </header>

      {!paso || !resultado || !especificacion ? (
        <p className="flex flex-1 items-center justify-center px-6 text-center text-sm text-apagado">
          Todavía no hay ninguna vista en la conversación. Pregunte algo al agente y vuelva.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* La pregunta y la respuesta a un lado: es el argumento; el gráfico, la prueba. */}
          {/* Las dos regiones se desplazan: sin tabIndex no se pueden leer con teclado
              (WCAG 2.1.1, axe scrollable-region-focusable). */}
          <aside
            tabIndex={0}
            aria-label="Pregunta y respuesta del paso"
            className="barra-fina flex shrink-0 flex-col gap-4 overflow-y-auto border-b border-borde bg-panel px-5 py-4 lg:w-[380px] lg:border-b-0 lg:border-r"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.06em] text-tenue">Pregunta</p>
              <p className="mt-1 text-base font-medium leading-snug text-texto">
                {paso.instruccion}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.06em] text-tenue">Respuesta del agente</p>
              <p className="mt-1 text-sm leading-relaxed text-texto">
                {respuesta?.respuesta_agente || "El agente no devolvió texto."}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.06em] text-tenue">Por qué esta vista</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-apagado">
                <span className="text-texto">{definicionDe(resultado.componente).etiqueta}</span>
                {fenomeno ? (
                  <span className="inline-flex items-center gap-1">
                    <SimboloFenomeno fenomeno={fenomeno} />
                    {fenomeno.clave}
                  </span>
                ) : null}
              </p>
              {especificacion.justificacion ? (
                <p className="mt-1 text-sm leading-relaxed text-apagado">
                  {especificacion.justificacion}
                </p>
              ) : null}
            </div>
            {respuesta && respuesta.citas.length > 0 ? (
              <div>
                <p className="text-xs uppercase tracking-[0.06em] text-tenue">Fuentes citadas</p>
                <ul className="mt-1 flex flex-col gap-0.5 font-mono text-xs text-apagado">
                  {respuesta.citas.slice(0, 8).map((cita) => (
                    <li key={`${cita.doc_id}-${String(cita.chunk_id)}`}>
                      [{String(cita.n)}] {cita.doc_id} · fragmento {String(cita.chunk_id)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {seleccion ? (
              <div className="rounded-md border border-borde bg-elevado px-3 py-2">
                <p className="text-xs uppercase tracking-[0.06em] text-tenue">Seleccionado</p>
                <p className="mt-0.5 text-sm text-texto">{seleccion.titulo}</p>
                <p className="text-xs text-apagado">{seleccion.detalle}</p>
              </div>
            ) : null}
          </aside>

          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-panel">
            <h2 className="border-b border-borde px-5 py-2 text-sm font-semibold text-texto">
              {resultado.titulo || definicionDe(resultado.componente).etiqueta}
            </h2>
            <div
              className="barra-fina min-h-0 flex-1 overflow-y-auto"
              tabIndex={0}
              role="region"
              aria-label="Gráfico del paso"
            >
              <CuerpoComponente
                key={paso.id}
                resultado={resultado}
                seleccion={seleccion}
                onSeleccionar={setSeleccion}
                nivelColombia={nivelColombia}
                onCambiarNivelColombia={setNivelColombia}
              />
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
