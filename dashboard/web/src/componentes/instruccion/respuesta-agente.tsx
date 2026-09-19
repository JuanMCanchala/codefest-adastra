import { Bot, Lightbulb, Route, Timer } from "lucide-react";

import type { RespuestaVisualizar } from "@/api/tipos";
import { Insignia } from "@/componentes/ui/insignia";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { definicionDe } from "@/lib/catalogo";
import { formatearEntero, formatearLatencia } from "@/lib/utils";

interface Props {
  respuesta: RespuestaVisualizar;
}

/** Respuesta textual del agente, el componente que eligió y su justificación. */
export function RespuestaAgente({ respuesta }: Props) {
  const especificacion = respuesta.especificacion;
  const etiqueta = especificacion ? definicionDe(especificacion.componente).etiqueta : null;
  const totalTokens = Object.values(respuesta.traza?.tokens ?? {}).reduce(
    (suma, valor) => suma + valor,
    0,
  );

  return (
    <Tarjeta className="overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-acento/40 bg-acento/10 text-acento">
          <Bot aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-apagado">
            Respuesta del agente
          </h2>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-texto">
            {respuesta.respuesta_agente || "El agente no devolvió texto."}
          </p>
        </div>
      </div>

      {especificacion ? (
        <div className="border-t border-borde bg-elevado/40 px-4 py-2.5">
          <p className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-apagado">
              <Lightbulb aria-hidden="true" className="size-3 text-f1" />
              Componente elegido
            </span>
            <Insignia className="border-acento/40 bg-acento/10 text-acento">
              {etiqueta} · {especificacion.componente}
            </Insignia>
          </p>
          {especificacion.justificacion ? (
            <p className="mt-1.5 text-[11px] leading-relaxed text-apagado">
              {especificacion.justificacion}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="border-t border-borde bg-elevado/40 px-4 py-2.5 text-[11px] text-apagado">
          El agente no propuso ninguna visualización para esta instrucción: solo hay respuesta
          textual. Use el modo de exploración manual para elegir un componente.
        </p>
      )}

      {respuesta.traza ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-borde px-4 py-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-apagado">
            <Route aria-hidden="true" className="size-3" />
            Traza
          </span>
          {respuesta.traza.agentes_invocados.map((agente) => (
            <Insignia key={agente}>{agente}</Insignia>
          ))}
          {totalTokens > 0 ? <Insignia>{formatearEntero(totalTokens)} tokens</Insignia> : null}
          <Insignia>
            <Timer aria-hidden="true" className="size-3" />
            {formatearLatencia(respuesta.traza.latencia_ms)}
          </Insignia>
          {respuesta.citas.length > 0 ? (
            <Insignia>{formatearEntero(respuesta.citas.length)} citas</Insignia>
          ) : null}
        </div>
      ) : null}
    </Tarjeta>
  );
}
