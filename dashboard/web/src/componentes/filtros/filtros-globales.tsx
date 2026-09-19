import { CalendarRange, Layers } from "lucide-react";

import { ANIO_MAXIMO, ANIO_MINIMO, type FiltrosGlobales } from "@/lib/filtros";
import { SimboloFenomeno } from "@/componentes/ui/simbolo-fenomeno";
import { FENOMENOS, type Fenomeno } from "@/lib/fenomenos";
import { cn } from "@/lib/utils";

interface Props {
  filtros: FiltrosGlobales;
  /** Indica si el componente activo usa el rango de años. */
  usaAnios: boolean;
  onCambiar: (filtros: FiltrosGlobales) => void;
}

/** Filtros globales que se propagan al componente activo. */
export function ControlesFiltrosGlobales({ filtros, usaAnios, onCambiar }: Props) {
  return (
    <section
      className="flex flex-wrap items-end gap-x-8 gap-y-3 rounded-md border border-borde bg-panel px-4 py-3"
      aria-labelledby="titulo-filtros"
    >
      <h2 id="titulo-filtros" className="sr-only">
        Filtros globales
      </h2>

      <fieldset className="min-w-0">
        <legend className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-apagado">
          <Layers aria-hidden="true" className="size-3" />
          Fenómeno
        </legend>
        <div className="flex flex-wrap gap-1.5">
          <BotonFenomeno
            activo={filtros.fenomeno === null}
            etiqueta="Los tres"
            onClick={() => onCambiar({ ...filtros, fenomeno: null })}
          />
          {FENOMENOS.map((fenomeno) => (
            <BotonFenomeno
              key={fenomeno.id}
              activo={filtros.fenomeno === fenomeno.id}
              etiqueta={fenomeno.clave}
              descripcion={fenomeno.nombre}
              fenomeno={fenomeno}
              onClick={() => onCambiar({ ...filtros, fenomeno: fenomeno.id })}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="min-w-0" disabled={!usaAnios}>
        <legend className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-apagado">
          <CalendarRange aria-hidden="true" className="size-3" />
          Rango de años
          {usaAnios ? null : (
            <span className="font-normal normal-case tracking-normal">· no aplica a este componente</span>
          )}
        </legend>
        <div className="flex items-center gap-2">
          <CampoAnio
            id="anio-desde"
            etiqueta="Desde"
            valor={filtros.desde}
            maximo={filtros.hasta}
            onCambiar={(desde) => onCambiar({ ...filtros, desde })}
          />
          <span aria-hidden="true" className="text-apagado">
            –
          </span>
          <CampoAnio
            id="anio-hasta"
            etiqueta="Hasta"
            valor={filtros.hasta}
            minimo={filtros.desde}
            onCambiar={(hasta) => onCambiar({ ...filtros, hasta })}
          />
        </div>
      </fieldset>
    </section>
  );
}

interface PropsBotonFenomeno {
  activo: boolean;
  etiqueta: string;
  descripcion?: string;
  fenomeno?: Fenomeno;
  onClick: () => void;
}

function BotonFenomeno({ activo, etiqueta, descripcion, fenomeno, onClick }: PropsBotonFenomeno) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      title={descripcion}
      aria-label={descripcion ? `${etiqueta} · ${descripcion}` : undefined}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors",
        activo
          ? "border-acento bg-acento/10 text-texto"
          : "border-control/60 bg-elevado text-apagado hover:text-texto",
      )}
    >
      {fenomeno ? <SimboloFenomeno fenomeno={fenomeno} /> : null}
      <span className={fenomeno ? "font-mono" : undefined}>{etiqueta}</span>
    </button>
  );
}

interface PropsCampoAnio {
  id: string;
  etiqueta: string;
  valor: number;
  minimo?: number;
  maximo?: number;
  onCambiar: (valor: number) => void;
}

function CampoAnio({ id, etiqueta, valor, minimo, maximo, onCambiar }: PropsCampoAnio) {
  return (
    <span className="inline-flex flex-col">
      <label htmlFor={id} className="sr-only">
        {etiqueta}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={valor}
        min={minimo ?? ANIO_MINIMO}
        max={maximo ?? ANIO_MAXIMO}
        step={1}
        onChange={(evento) => {
          const numero = Number.parseInt(evento.target.value, 10);
          if (!Number.isNaN(numero)) {
            onCambiar(numero);
          }
        }}
        className="h-9 w-20 rounded-md border border-control bg-fondo px-2 font-mono text-xs text-texto disabled:opacity-50"
      />
    </span>
  );
}
