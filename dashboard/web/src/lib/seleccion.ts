import type { Filtros, NombreComponente, Ref } from "@/api/tipos";

/**
 * Lo que una selección propone hacer a continuación: volver a pedir un componente con
 * otros filtros. Es cómo la red se expande alrededor de un nodo (Anexo B.3.3) sin que la
 * vista tenga que saber pedir datos: la vista describe el salto y el tablero lo ejecuta.
 */
export interface Accion {
  etiqueta: string;
  componente: NombreComponente;
  filtros: Filtros;
}

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
  /** Salto opcional que ofrece la selección; lo dibuja el panel de evidencia. */
  accion?: Accion;
}

/** Contrato común de todas las vistas del catálogo. */
export interface PropsVista<T> {
  datos: T;
  titulo: string;
  fenomeno: number | null;
  seleccion: Seleccion | null;
  onSeleccionar: (seleccion: Seleccion) => void;
  /** Ejecuta un salto directamente desde la vista (p. ej. doble clic en un nodo). */
  onAccion?: ((accion: Accion) => void) | undefined;
}
