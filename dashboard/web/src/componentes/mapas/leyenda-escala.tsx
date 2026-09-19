import { sinDato, tramosLineales } from "@/lib/paleta";
import { formatearEntero } from "@/lib/utils";

interface Props {
  maximo: number;
  unidad: string;
}

/** Leyenda con rangos numéricos explícitos: la lectura no depende solo del color. */
export function LeyendaEscala({ maximo, unidad }: Props) {
  const tramos = tramosLineales(maximo);
  return (
    <div className="rounded-md border border-borde bg-panel p-2.5 shadow-[0_8px_24px_rgb(0_0_0/0.45)]">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-apagado">{unidad}</p>
      <ul className="flex flex-col gap-1">
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3 rounded-sm border border-borde"
            style={{ backgroundColor: sinDato() }}
          />
          <span className="font-mono text-xs text-apagado">0 · sin registro</span>
        </li>
        {tramos.map((tramo) => (
          <li key={tramo.desde} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-3 rounded-sm border border-black/40"
              style={{ backgroundColor: tramo.color }}
            />
            <span className="font-mono text-xs text-apagado">
              {tramo.desde === tramo.hasta
                ? formatearEntero(tramo.desde)
                : `${formatearEntero(tramo.desde)} – ${formatearEntero(tramo.hasta)}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
