import { formatearEntero } from "@/lib/utils";

export interface Recuadro {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

interface Props {
  lng: number;
  lat: number;
  zoom: number;
  /** Región seleccionada, si la hay: rotula el encuadre. */
  etiqueta: string | null;
  valor: number | null;
  unidad: string;
  recuadro: Recuadro | null;
}

function grados(valor: number, positivo: string, negativo: string): string {
  const signo = valor >= 0 ? positivo : negativo;
  return `${Math.abs(valor).toFixed(3).padStart(7, "0")}° ${signo}`;
}

/** Longitud del brazo de cada corchete, acotada para recuadros pequeños. */
function brazo(recuadro: Recuadro): number {
  return Math.max(6, Math.min(18, Math.min(recuadro.ancho, recuadro.alto) / 3));
}

/**
 * Capa de lectura sobre el mapa: coordenadas del centro, retícula y encuadre de la
 * región seleccionada. Es solo presentación —no captura el puntero— y repite en cifras
 * lo que el mapa ya dice con color, para no depender del matiz (DESIGN.md, Anexo B).
 */
export function HudMapa({ lng, lat, zoom, etiqueta, valor, unidad, recuadro }: Props) {
  const b = recuadro ? brazo(recuadro) : 0;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <p className="absolute left-3 top-12 hidden gap-3 rounded border border-borde bg-panel/90 px-2 py-1 font-mono text-xs text-apagado sm:flex">
        <span>{grados(lat, "N", "S")}</span>
        <span>{grados(lng, "E", "O")}</span>
        <span className="text-tenue">Z {zoom.toFixed(2)}</span>
      </p>

      <span className="absolute left-1/2 top-1/2 block size-4 -translate-x-1/2 -translate-y-1/2 border-l border-t border-acento/50" />
      <span className="absolute left-1/2 top-1/2 block size-4 -translate-x-1/2 -translate-y-1/2 border-b border-r border-acento/50" />

      {recuadro ? (
        <svg className="absolute inset-0 size-full" role="presentation">
          <path
            d={[
              `M${recuadro.x} ${recuadro.y + b} V${recuadro.y} H${recuadro.x + b}`,
              `M${recuadro.x + recuadro.ancho - b} ${recuadro.y} H${recuadro.x + recuadro.ancho} V${recuadro.y + b}`,
              `M${recuadro.x + recuadro.ancho} ${recuadro.y + recuadro.alto - b} V${recuadro.y + recuadro.alto} H${recuadro.x + recuadro.ancho - b}`,
              `M${recuadro.x + b} ${recuadro.y + recuadro.alto} H${recuadro.x} V${recuadro.y + recuadro.alto - b}`,
            ].join(" ")}
            fill="none"
            stroke="var(--color-acento)"
            strokeWidth={1.5}
          />
        </svg>
      ) : null}

      {recuadro && etiqueta ? (
        <p
          className="absolute max-w-[14rem] truncate rounded border border-acento/60 bg-panel/90 px-1.5 py-0.5 font-mono text-xs text-texto"
          style={{
            left: Math.max(4, recuadro.x),
            top: Math.max(4, recuadro.y - 22),
          }}
        >
          {etiqueta}
          {valor === null ? "" : ` · ${formatearEntero(valor)} ${unidad}`}
        </p>
      ) : null}
    </div>
  );
}
