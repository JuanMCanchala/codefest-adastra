import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...clases: ClassValue[]): string {
  return twMerge(clsx(clases));
}

export function formatearEntero(valor: number): string {
  return new Intl.NumberFormat("es-CO").format(valor);
}

export function formatearLatencia(ms: number): string {
  if (ms < 1000) {
    return `${formatearEntero(ms)} ms`;
  }
  return `${(ms / 1000).toFixed(1)} s`;
}

export function recortar(texto: string, maximo: number): string {
  return texto.length > maximo ? `${texto.slice(0, maximo)}…` : texto;
}
