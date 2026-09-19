import { Timer, TriangleAlert } from "lucide-react";

import type { RespuestaVisualizar, ResultadoComponente } from "@/api/tipos";
import { Insignia } from "@/componentes/ui/insignia";
import { definicionDe } from "@/lib/catalogo";
import type { EntradaHistorial } from "@/lib/historial";
import { metricasDe } from "@/lib/metricas";
import { useVistaTecnica } from "@/lib/vista-tecnica";
import { cn, formatearEntero, formatearLatencia, recortar } from "@/lib/utils";

interface Props {
  ocupado: boolean;
  respuesta: RespuestaVisualizar | null;
  error: string | null;
  /** Lo que se está dibujando ahora mismo: de aquí salen las cifras de la respuesta. */
  resultado: ResultadoComponente | null;
  /** En la ventana ampliada las cifras van junto al gráfico, no dentro de la conversación. */
  conMetricas: boolean;
  historial: readonly EntradaHistorial[];
  idActivo: string | null;
  onRecuperar: (id: string) => void;
  onPreguntar: (instruccion: string) => void;
}

/**
 * Cuatro entradas para quien abre el tablero por primera vez. No son «ejemplos» pegados
 * bajo un campo: son el único estado de la ventana vacía y desaparecen con la primera
 * respuesta. Al no haber mandos manuales, son también la forma de descubrir que el
 * componente, los filtros y los años se piden hablando.
 */
const SUGERENCIAS: readonly string[] = [
  "Alertas tempranas por departamento",
  "Cómo evolucionan las alertas por año",
  "Red de entidades del conflicto",
  "Qué países se mencionan más",
];

/**
 * Lo que el agente contestó y lo que se le preguntó antes, sin ninguna caja propia: la
 * burbuja ya es el contenedor.
 *
 * Con la ventana compacta la respuesta trae sus cifras, para no tener que interpretar el
 * gráfico del fondo; al ampliar, el gráfico entra en la propia ventana y las cifras se van
 * con él, porque repetirlas dos veces en la misma pantalla sobra.
 */
export function PanelConversacion({
  ocupado,
  respuesta,
  error,
  resultado,
  conMetricas,
  historial,
  idActivo,
  onRecuperar,
  onPreguntar,
}: Props) {
  const tecnica = useVistaTecnica();
  const especificacion = respuesta?.especificacion ?? null;
  const traza = respuesta?.traza ?? null;
  const tokens = traza?.tokens ?? {};
  const totalTokens = tokens["total"] ?? (tokens["input"] ?? 0) + (tokens["output"] ?? 0);

  return (
    <div className="flex flex-col">
      {ocupado ? (
        <p className="px-3 py-3 text-sm text-apagado" role="status" aria-live="polite">
          Consultando al agente de visualización…
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-1.5 px-3 py-3 text-sm leading-relaxed text-alerta"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}

      {respuesta && !ocupado ? (
        <div className="px-3 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-texto">
            {respuesta.respuesta_agente || "El agente no devolvió texto."}
          </p>

          {especificacion?.justificacion ? (
            <p className="mt-2 text-sm leading-relaxed text-apagado">
              {especificacion.justificacion}
            </p>
          ) : null}

          {!especificacion ? (
            <p className="mt-2 text-sm leading-relaxed text-apagado">
              No propuso ninguna visualización para esta instrucción. Puede elegir el
              componente en «Ajustar».
            </p>
          ) : null}

          {conMetricas && resultado ? (
            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-borde pt-2.5">
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
        </div>
      ) : null}

      {!respuesta && !ocupado && !error ? (
        <div className="px-3 py-3">
          <p className="text-sm leading-relaxed text-apagado">
            Pida lo que quiere ver en lenguaje natural: el componente, el filtro o el rango
            de años. El tablero de detrás cambia con la respuesta.
          </p>
          <ul className="mt-2.5 flex flex-col gap-1.5">
            {SUGERENCIAS.map((sugerencia) => (
              <li key={sugerencia}>
                <button
                  type="button"
                  onClick={() => onPreguntar(sugerencia)}
                  className="w-full rounded-md border border-borde bg-elevado px-2.5 py-1.5 text-left text-sm text-texto transition-colors hover:border-control"
                >
                  {sugerencia}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {historial.length > 0 ? (
        <div className="border-t border-borde">
          <h3 className="px-3 pb-1 pt-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-tenue">
            Antes en esta sesión
          </h3>
          <ol>
            {historial.map((entrada) => (
              <li key={entrada.id}>
                <button
                  type="button"
                  aria-current={entrada.id === idActivo ? "true" : undefined}
                  onClick={() => onRecuperar(entrada.id)}
                  className={cn(
                    "flex w-full items-baseline gap-2 px-3 py-1.5 text-left text-sm transition-colors",
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
        </div>
      ) : null}
    </div>
  );
}
