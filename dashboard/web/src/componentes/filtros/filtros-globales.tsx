import { ANIO_MAXIMO, ANIO_MINIMO, type FiltrosGlobales } from "@/lib/filtros";

interface Props {
  filtros: FiltrosGlobales;
  /** Indica si el componente activo usa el rango de años. */
  usaAnios: boolean;
  onCambiar: (filtros: FiltrosGlobales) => void;
}

/**
 * Rango de años, en una sola línea dentro de la cabecera del componente.
 *
 * El selector de fenómeno vivía aquí y se quitó: el fenómeno lo decide el agente a partir de
 * la instrucción y viaja en la especificación, así que un control más en pantalla no le
 * aportaba nada a quien revisa el tablero.
 */
export function ControlesFiltrosGlobales({ filtros, usaAnios, onCambiar }: Props) {
  if (!usaAnios) {
    return null;
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs uppercase tracking-[0.06em] text-apagado">Años</span>
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
    </span>
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
    <>
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
        className="h-7 w-16 rounded border border-control bg-fondo px-1.5 font-mono text-xs text-texto"
      />
    </>
  );
}
