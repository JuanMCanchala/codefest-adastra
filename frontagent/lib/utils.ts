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

/**
 * Nombre legible de un documento: su título o, si el corpus no lo trae, el nombre del
 * archivo de origen (sin carpeta ni extensión). No inventa nada: solo reformatea la ruta.
 */
export function etiquetaDocumento(
  titulo: string | null | undefined,
  fuente: string,
): string {
  const limpio = titulo?.trim();
  if (limpio) {
    return limpio;
  }
  const archivo = fuente.split(/[\\/]/).pop() ?? fuente;
  const sinExtension = archivo.replace(/\.[a-z0-9]{2,5}$/i, "");
  return sinExtension.replace(/[_]+/g, " ").trim() || "Documento sin título";
}
