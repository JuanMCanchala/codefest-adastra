import { Sparkles, Timer, TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";

import type { ResultadoComponente } from "@/api/tipos";
import { Insignia } from "@/componentes/ui/insignia";
import { definicionDe } from "@/lib/catalogo";
import type { EntradaHistorial } from "@/lib/historial";
import { metricasDe } from "@/lib/metricas";
import { useVistaTecnica } from "@/lib/vista-tecnica";
import { cn, formatearEntero, formatearLatencia, recortar } from "@/lib/utils";

interface Props {
  ocupado: boolean;
  /** Lo que se está dibujando ahora mismo: de aquí salen las cifras de la respuesta. */
  resultado: ResultadoComponente | null;
  /** En la ventana ampliada las cifras van junto al gráfico, no dentro de la conversación. */
  conMetricas: boolean;
  /** La lista de consultas se enseña bajo demanda, desde el reloj de la cabecera. */
  verHistorial: boolean;
  /** Más reciente primero, como lo guarda el tablero. */
  historial: readonly EntradaHistorial[];
  idActivo: string | null;
  onRecuperar: (id: string) => void;
}

/**
 * La conversación con el agente, como hilo.
 *
 * Cada turno es lo que se pidió y lo que contestó, en orden, para poder leer de dónde
 * salió lo que hay en pantalla. Las cifras del resultado acompañan solo al turno activo,
 * que es el que está dibujado detrás: en los anteriores mentirían.
 */
export function PanelConversacion({
  ocupado,
  resultado,
  conMetricas,
  verHistorial,
  historial,
  idActivo,
  onRecuperar,
}: Props) {
  const tecnica = useVistaTecnica();
  const fondo = useRef<HTMLDivElement | null>(null);
  const turnos = [...historial].reverse();

  // El hilo se queda en el último turno, como cualquier chat.
  useEffect(() => {
    fondo.current?.scrollIntoView({ block: "end" });
  }, [historial, ocupado]);

  if (verHistorial) {
    return (
      <div className="px-2 py-2">
        {historial.length === 0 ? (
          <p className="px-2 py-3 text-sm text-apagado">Todavía no hay consultas.</p>
        ) : (
          <ol className="flex flex-col gap-0.5">
            {historial.map((entrada) => (
              <li key={entrada.id}>
                <button
                  type="button"
                  aria-current={entrada.id === idActivo ? "true" : undefined}
                  onClick={() => onRecuperar(entrada.id)}
                  className={cn(
                    "flex w-full items-baseline gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                    entrada.id === idActivo
                      ? "bg-elevado text-texto"
                      : "text-apagado hover:bg-elevado/60 hover:text-texto",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {recortar(entrada.instruccion, 80)}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-tenue">
                    {entrada.error ? "error" : entrada.hora}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  }

  // Estado inicial: centrado y sin nada más, como cualquier consola de chat en reposo.
  if (turnos.length === 0) {
    return (
      <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full border border-borde bg-elevado text-apagado">
          <Sparkles aria-hidden="true" className="size-5" />
        </span>
        <p className="text-base font-semibold text-texto">¿Qué quiere ver?</p>
        <p className="max-w-[30ch] text-sm leading-relaxed text-apagado">
          Pídalo en lenguaje natural: el componente, el filtro o el rango de años.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-3 py-3">
      {turnos.map((turno) => {
        const especificacion = turno.respuesta?.especificacion ?? null;
        const traza = turno.respuesta?.traza ?? null;
        const tokens = traza?.tokens ?? {};
        const totalTokens = tokens["total"] ?? (tokens["input"] ?? 0) + (tokens["output"] ?? 0);
        const esperando = turno.respuesta === null && turno.error === null;
        const activo = turno.id === idActivo;

        return (
          <div key={turno.id} className="flex flex-col gap-2">
            {/* Lo que se pidió. */}
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-elevado px-3 py-2 text-sm leading-relaxed text-texto">
                {turno.instruccion}
              </p>
            </div>

            {/* Lo que contestó. */}
            <div className="flex gap-2">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-borde bg-panel text-apagado">
                <Sparkles aria-hidden="true" className="size-3" />
              </span>

              <div className="min-w-0 flex-1">
                {esperando ? (
                  <p className="text-sm text-apagado" role="status" aria-live="polite">
                    Consultando al agente de visualización…
                  </p>
                ) : null}

                {turno.error ? (
                  <p
                    role="alert"
                    className="flex items-start gap-2 text-sm leading-relaxed text-alerta"
                  >
                    <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    {turno.error}
                  </p>
                ) : null}

                {turno.respuesta ? (
                  <>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-texto">
                      {turno.respuesta.respuesta_agente || "El agente no devolvió texto."}
                    </p>

                    {especificacion?.justificacion ? (
                      <p className="mt-2 text-sm leading-relaxed text-apagado">
                        {especificacion.justificacion}
                      </p>
                    ) : null}

                    {!especificacion ? (
                      <p className="mt-2 text-sm leading-relaxed text-apagado">
                        No propuso ninguna visualización para esta instrucción. Pida el
                        componente que quiere ver.
                      </p>
                    ) : null}

                    {/* Las cifras son las del componente dibujado, así que solo valen
                        para el turno activo. */}
                    {conMetricas && activo && resultado ? (
                      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-borde pt-3">
                        {metricasDe(resultado).map((metrica) => (
                          <div key={metrica.etiqueta}>
                            <dt className="text-xs uppercase tracking-[0.06em] text-tenue">
                              {metrica.etiqueta}
                            </dt>
                            <dd className="font-mono text-sm text-texto">{metrica.valor}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}

                    {traza ? (
                      <p className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {especificacion ? (
                          <Insignia className="border-acento/50 text-texto">
                            {tecnica
                              ? `${definicionDe(especificacion.componente).etiqueta} · ${especificacion.componente}`
                              : definicionDe(especificacion.componente).etiqueta}
                          </Insignia>
                        ) : null}
                        {traza.agentes_invocados.map((agente) => (
                          <Insignia key={agente}>{agente}</Insignia>
                        ))}
                        <Insignia>
                          <Timer aria-hidden="true" className="size-3" />
                          {formatearLatencia(traza.latencia_ms)}
                        </Insignia>
                        {tecnica && totalTokens > 0 ? (
                          <Insignia>{formatearEntero(totalTokens)} tokens</Insignia>
                        ) : null}
                      </p>
                    ) : null}

                    {/* Volver a un turno anterior redibuja el tablero con lo que entregó
                        el agente entonces, sin preguntar otra vez. */}
                    {!activo && turno.respuesta.especificacion ? (
                      <button
                        type="button"
                        onClick={() => onRecuperar(turno.id)}
                        className="mt-2 text-sm text-senal underline-offset-2 hover:underline"
                      >
                        Volver a esta vista
                      </button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={fondo} />
    </div>
  );
}
