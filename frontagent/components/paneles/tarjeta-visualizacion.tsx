"use client";

import { ArrowUpRight, ChartNoAxesColumn } from "lucide-react";

import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import { Tarjeta, TarjetaCuerpo, TarjetaEncabezado, TarjetaTitulo } from "@/components/ui/tarjeta";
import { fenomenoPorId } from "@/lib/fenomenos";
import type { SpecVisualizacion } from "@/lib/tipos";
import { cn } from "@/lib/utils";

interface Props {
  spec: SpecVisualizacion;
  urlTablero: string | null;
}

function enlaceTablero(urlTablero: string, spec: SpecVisualizacion): string {
  const parametros = new URLSearchParams({ componente: spec.componente });
  if (spec.fenomeno !== null) {
    parametros.set("fenomeno", String(spec.fenomeno));
  }
  for (const [clave, valor] of Object.entries(spec.filtros)) {
    if (valor !== null && valor !== undefined && typeof valor !== "object") {
      parametros.set(clave, String(valor));
    }
  }
  return `${urlTablero}/?${parametros.toString()}`;
}

export function TarjetaVisualizacion({ spec, urlTablero }: Props) {
  const fenomeno = fenomenoPorId(spec.fenomeno);
  const filtros = Object.entries(spec.filtros);

  return (
    <Tarjeta className={cn("mt-4 bg-elevado", fenomeno?.borde)}>
      <TarjetaEncabezado>
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded border border-borde bg-panel text-acento">
          <ChartNoAxesColumn aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <TarjetaTitulo>{spec.titulo || "Visualización propuesta"}</TarjetaTitulo>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Insignia className="text-acento">{spec.componente}</Insignia>
            {fenomeno ? (
              <Insignia className={fenomeno.texto}>
                {fenomeno.clave} · {fenomeno.nombre}
              </Insignia>
            ) : null}
          </div>
        </div>
      </TarjetaEncabezado>
      <TarjetaCuerpo className="space-y-3">
        {spec.justificacion ? <p className="text-apagado">{spec.justificacion}</p> : null}

        {filtros.length > 0 ? (
          <dl className="grid gap-x-4 gap-y-1 font-mono text-xs sm:grid-cols-2">
            {filtros.map(([clave, valor]) => (
              <div key={clave} className="flex gap-2 truncate">
                <dt className="text-apagado">{clave}:</dt>
                <dd className="truncate text-texto">
                  {typeof valor === "object" ? JSON.stringify(valor) : String(valor)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="flex items-center gap-3">
          {urlTablero ? (
            <a href={enlaceTablero(urlTablero, spec)} target="_blank" rel="noreferrer">
              <Boton tamano="sm" variante="primario" type="button">
                Abrir en el tablero
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Boton>
            </a>
          ) : (
            <p className="text-xs text-apagado">
              El render se hace en el tablero del Reto 2. Configure <code>DASHBOARD_URL</code> para
              habilitar el enlace.
            </p>
          )}
        </div>
      </TarjetaCuerpo>
    </Tarjeta>
  );
}
