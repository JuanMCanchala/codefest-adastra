import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { IdChunk, Ref } from "@/api/tipos";

export function cn(...clases: ClassValue[]): string {
  return twMerge(clsx(clases));
}

export function formatearEntero(valor: number): string {
  return new Intl.NumberFormat("es-CO").format(valor);
}

export function formatearSigno(valor: number): string {
  const texto = formatearEntero(Math.abs(valor));
  if (valor > 0) return `+${texto}`;
  if (valor < 0) return `−${texto}`;
  return "0";
}

export function formatearLatencia(ms: number): string {
  if (ms < 1000) {
    return `${formatearEntero(Math.round(ms))} ms`;
  }
  return `${(ms / 1000).toFixed(1)} s`;
}

export function recortar(texto: string, maximo: number): string {
  return texto.length > maximo ? `${texto.slice(0, maximo)}…` : texto;
}

/** Quita referencias repetidas conservando el orden de la API. */
export function refsUnicas(refs: readonly Ref[]): Ref[] {
  const vistas = new Set<string>();
  const salida: Ref[] = [];
  for (const ref of refs) {
    const clave = `${ref.doc_id}#${String(ref.chunk_id)}`;
    if (!vistas.has(clave)) {
      vistas.add(clave);
      salida.push(ref);
    }
  }
  return salida;
}

export function chunkIdsDe(refs: readonly Ref[]): IdChunk[] {
  return refsUnicas(refs).map((r) => r.chunk_id);
}

export function mediana(valores: readonly number[]): number {
  if (valores.length === 0) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(ordenados.length / 2);
  if (ordenados.length % 2 === 1) {
    return ordenados[medio] ?? 0;
  }
  return ((ordenados[medio - 1] ?? 0) + (ordenados[medio] ?? 0)) / 2;
}

export function maximoDe(valores: readonly number[]): number {
  return valores.reduce((acumulado, valor) => (valor > acumulado ? valor : acumulado), 0);
}

export function mensajeDeExcepcion(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Ocurrió un error inesperado.";
}

export function esAbortada(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
