import type { NombreComponente, Ref } from "@/api/tipos";

/**
 * Elemento que el usuario acaba de pulsar (región, punto, celda, arista…). Es el enlace entre
 * cualquier vista y el panel lateral de evidencia: siempre viaja con sus refs.
 */
export interface Seleccion {
  /** Nombre del elemento, tal como lo devolvió la API. */
  titulo: string;
  /** Qué mide el valor y en qué unidad. */
  detalle: string;
  origen: NombreComponente;
  refs: Ref[];
}

/** Contrato común de todas las vistas del catálogo. */
export interface PropsVista<T> {
  datos: T;
  titulo: string;
  fenomeno: number | null;
  seleccion: Seleccion | null;
  onSeleccionar: (seleccion: Seleccion) => void;
}
