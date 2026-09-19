"use client";

import { Activity, CircleCheck, CircleX, Cpu, Wrench } from "lucide-react";

import { Insignia } from "@/components/ui/insignia";
import type { RespuestaAgente } from "@/lib/tipos";
import { useVistaTecnica } from "@/lib/vista-tecnica";
import { cn, formatearEntero, formatearLatencia } from "@/lib/utils";

interface Props {
  datos: RespuestaAgente | null;
}

function Encabezado({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-apagado">
      {children}
    </h3>
  );
}

export function PanelTraza({ datos }: Props) {
  const tecnica = useVistaTecnica();

  if (!datos) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
        <Activity aria-hidden="true" className="size-6 text-apagado" />
        <p className="max-w-xs text-sm leading-relaxed text-apagado">
          Aquí se registran los agentes que atendieron la consulta, las
          herramientas que usaron y el tiempo que tardaron.
        </p>
      </div>
    );
  }

  const { metadata, evaluacion } = datos;
  const correcto = metadata.estado === "ok";

  return (
    <div className="barra-fina h-full space-y-5 overflow-y-auto px-4 py-4">
      <section>
        <Encabezado>Estado de la ejecución</Encabezado>
        <div className="flex flex-wrap gap-1.5">
          <Insignia className={correcto ? "text-ok" : "text-alerta"}>
            {correcto ? (
              <CircleCheck aria-hidden="true" className="size-3" />
            ) : (
              <CircleX aria-hidden="true" className="size-3" />
            )}
            {metadata.estado}
          </Insignia>
          <Insignia>{formatearLatencia(metadata.latencia_ms)}</Insignia>
          {tecnica ? (
            <Insignia>{metadata.num_interacciones} interacciones</Insignia>
          ) : null}
        </div>
      </section>

      <section>
        <Encabezado>Agentes invocados</Encabezado>
        {metadata.agentes_invocados.length === 0 ? (
          <p className="text-xs text-apagado">Ningún agente fue invocado.</p>
        ) : (
          <ol className="space-y-2">
            {metadata.agentes_invocados.map((agente, indice) => (
              <li
                key={`${agente}-${indice}`}
                className="flex items-center gap-2"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-control bg-elevado font-mono text-xs text-texto">
                  {indice + 1}
                </span>
                <span className="font-mono text-sm text-texto">{agente}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <Encabezado>Herramientas llamadas</Encabezado>
        {evaluacion.tools_called.length === 0 ? (
          <p className="text-xs text-apagado">
            No se llamó ninguna herramienta.
          </p>
        ) : (
          <ul className="space-y-2">
            {evaluacion.tools_called.map((herramienta, indice) => (
              <li
                key={`${herramienta.name}-${indice}`}
                className="rounded border border-borde bg-elevado p-2"
              >
                <p className="flex items-center gap-1.5 font-mono text-xs text-texto">
                  <Wrench
                    aria-hidden="true"
                    className="size-3.5 text-apagado"
                  />
                  {herramienta.name}
                </p>
                {tecnica ? (
                  <dl className="mt-1.5 space-y-0.5">
                    {Object.entries(herramienta.input_parameters).map(
                      ([clave, valor]) => (
                        <div
                          key={clave}
                          className="flex gap-2 font-mono text-xs"
                        >
                          <dt className="shrink-0 text-apagado">{clave}:</dt>
                          <dd className="min-w-0 break-words text-texto">
                            {typeof valor === "object"
                              ? JSON.stringify(valor)
                              : String(valor)}
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                ) : null}
                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-apagado">
                  {herramienta.output}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* El consumo por agente y el modelo de cada uno son cuentas del equipo. */}
      {tecnica ? (
        <section>
          <Encabezado>Consumo de tokens</Encabezado>
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr className="text-apagado">
                <th className="border-b border-borde py-1 text-left font-normal">
                  Agente
                </th>
                <th className="border-b border-borde py-1 text-right font-normal">
                  Entrada
                </th>
                <th className="border-b border-borde py-1 text-right font-normal">
                  Salida
                </th>
                <th className="border-b border-borde py-1 text-right font-normal">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {metadata.tokens_por_agente.map((fila, indice) => (
                <tr key={`${fila.agente}-${indice}`}>
                  <td className="border-b border-borde/60 py-1 pr-2">
                    <span className="block truncate text-texto">
                      {fila.agente}
                    </span>
                    <span className="block truncate text-xs text-apagado">
                      {fila.modelo}
                    </span>
                  </td>
                  <td className="border-b border-borde/60 py-1 text-right text-apagado">
                    {formatearEntero(fila.input)}
                  </td>
                  <td className="border-b border-borde/60 py-1 text-right text-apagado">
                    {formatearEntero(fila.output)}
                  </td>
                  <td className="border-b border-borde/60 py-1 text-right text-texto">
                    {formatearEntero(fila.total)}
                  </td>
                </tr>
              ))}
              <tr
                className={cn(
                  "font-semibold",
                  metadata.tokens_por_agente.length > 0 && "pt-1",
                )}
              >
                <td className="py-1.5 pr-2 text-texto">
                  <span className="flex items-center gap-1.5">
                    <Cpu aria-hidden="true" className="size-3.5 text-apagado" />
                    Total
                  </span>
                </td>
                <td className="py-1.5 text-right text-texto">
                  {formatearEntero(metadata.tokens.input)}
                </td>
                <td className="py-1.5 text-right text-texto">
                  {formatearEntero(metadata.tokens.output)}
                </td>
                <td className="py-1.5 text-right text-texto">
                  {formatearEntero(metadata.tokens.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
