import { colorPorValor } from "@/lib/paleta";
import { cn, formatearEntero, maximoDe } from "@/lib/utils";

export interface FilaRanking {
  clave: string;
  nombre: string;
  detalle?: string;
  valor: number;
}

interface Props {
  filas: readonly FilaRanking[];
  unidad: string;
  seleccionada: string | null;
  onSeleccionar: (clave: string) => void;
}

/**
 * Segunda vista de los mapas: ordena las regiones por conteo. Da la cifra exacta (no solo
 * color) y queda enlazada con el mapa y con el panel de evidencia.
 */
export function TablaRanking({ filas, unidad, seleccionada, onSeleccionar }: Props) {
  const maximo = maximoDe(filas.map((f) => f.valor));
  const ordenadas = [...filas].sort((a, b) => b.valor - a.valor);

  return (
    <table className="w-full border-collapse text-xs">
      <caption className="sr-only">{`Regiones ordenadas por ${unidad}`}</caption>
      <thead className="sticky top-0 bg-panel">
        <tr className="border-b border-borde text-left text-xs font-semibold uppercase tracking-[0.06em] text-apagado">
          <th scope="col" className="px-3 py-2 font-medium">
            Región
          </th>
          <th scope="col" className="px-3 py-2 text-right font-medium">
            {unidad}
          </th>
        </tr>
      </thead>
      <tbody>
        {ordenadas.map((fila) => {
          const activa = fila.clave === seleccionada;
          return (
            <tr
              key={fila.clave}
              className={cn("border-b border-borde/60", activa ? "bg-acento/10" : undefined)}
            >
              <th scope="row" className="max-w-0 px-3 py-1.5 text-left font-normal">
                <button
                  type="button"
                  aria-pressed={activa}
                  onClick={() => onSeleccionar(fila.clave)}
                  className="flex w-full items-center gap-2 text-left hover:text-texto hover:underline hover:decoration-acento hover:underline-offset-4"
                >
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: colorPorValor(fila.valor, maximo) }}
                  />
                  <span className="truncate">
                    {fila.nombre}
                    {fila.detalle ? (
                      <span className="text-apagado"> · {fila.detalle}</span>
                    ) : null}
                  </span>
                </button>
              </th>
              <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                {formatearEntero(fila.valor)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
