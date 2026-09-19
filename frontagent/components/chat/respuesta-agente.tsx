"use client";

import { Bot, Clock, Coins, GitBranch, Route } from "lucide-react";

import { ListaFuentes } from "@/components/chat/lista-fuentes";
import { TextoConCitas } from "@/components/chat/texto-con-citas";
import { TarjetaVisualizacion } from "@/components/paneles/tarjeta-visualizacion";
import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import type { MensajeAgente } from "@/lib/tipos";
import { formatearEntero, formatearLatencia } from "@/lib/utils";

interface Props {
  mensaje: MensajeAgente;
  urlTablero: string | null;
  nActiva: number | null;
  onSeleccionar: (idMensaje: string, n: number) => void;
  onPrevisualizar: (idMensaje: string, n: number | null) => void;
  onVerTraza: (idMensaje: string) => void;
}

export function RespuestaAgente({
  mensaje,
  urlTablero,
  nActiva,
  onSeleccionar,
  onPrevisualizar,
  onVerTraza,
}: Props) {
  const { datos } = mensaje;
  const citas = datos.extras?.citas ?? [];
  const visualizacion = datos.extras?.visualizacion ?? null;
  const ruta = datos.extras?.ruta ?? null;

  return (
    <article className="rounded-lg border border-borde bg-panel p-4">
      <header className="mb-3 flex flex-wrap items-center gap-2 border-b border-borde pb-3">
        <span className="flex size-7 items-center justify-center rounded border border-borde bg-elevado text-acento">
          <Bot aria-hidden="true" className="size-4" />
        </span>
        <span className="mr-auto text-xs font-medium uppercase tracking-wider text-apagado">
          Respuesta del sistema
        </span>
        {ruta ? (
          <Insignia>
            <Route aria-hidden="true" className="size-3" />
            {ruta}
          </Insignia>
        ) : null}
        <Insignia>
          <Clock aria-hidden="true" className="size-3" />
          {formatearLatencia(datos.metadata.latencia_ms)}
        </Insignia>
        <Insignia>
          <Coins aria-hidden="true" className="size-3" />
          {formatearEntero(datos.metadata.tokens.total)} tokens
        </Insignia>
      </header>

      <TextoConCitas
        citas={citas}
        nActiva={nActiva}
        texto={datos.respuesta}
        onPrevisualizar={(n) => onPrevisualizar(mensaje.id, n)}
        onSeleccionar={(n) => onSeleccionar(mensaje.id, n)}
      />

      <ListaFuentes
        citas={citas}
        nActiva={nActiva}
        onPrevisualizar={(n) => onPrevisualizar(mensaje.id, n)}
        onSeleccionar={(n) => onSeleccionar(mensaje.id, n)}
      />

      {visualizacion ? (
        <TarjetaVisualizacion spec={visualizacion} urlTablero={urlTablero} />
      ) : null}

      <footer className="mt-4 flex flex-wrap items-center gap-2 border-t border-borde pt-3">
        <Boton tamano="sm" variante="fantasma" type="button" onClick={() => onVerTraza(mensaje.id)}>
          <GitBranch aria-hidden="true" className="size-3.5" />
          Ver traza del sistema
        </Boton>
        <span className="font-mono text-[11px] text-apagado">
          {datos.metadata.agentes_invocados.join(" → ") || "sin agentes registrados"}
        </span>
      </footer>
    </article>
  );
}
