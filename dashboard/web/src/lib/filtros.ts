import type { IdFenomeno } from "@/api/tipos";

export const ANIO_MINIMO = 1990;
export const ANIO_MAXIMO = 2026;

/** Filtros que se propagan a cualquier componente activo. */
export interface FiltrosGlobales {
  fenomeno: IdFenomeno | null;
  desde: number;
  hasta: number;
}

export const FILTROS_INICIALES: FiltrosGlobales = {
  fenomeno: null,
  desde: 2015,
  hasta: ANIO_MAXIMO,
};
