/** Identidad visual de los tres fenómenos, igual que en el frontend de chat. */

import type { IdFenomeno } from "@/api/tipos";

export interface Fenomeno {
  id: IdFenomeno;
  clave: string;
  nombre: string;
  descripcion: string;
  /** Hex para gráficos y mapas (canvas/WebGL no leen clases de Tailwind). */
  color: string;
  texto: string;
  borde: string;
  fondo: string;
  punto: string;
  /** Forma del marcador: la serie no depende solo del color (WCAG 1.4.1). */
  simbolo: "circle" | "triangle" | "diamond";
  trazo: "solid" | "dashed" | "dotted";
}

export const FENOMENOS: readonly Fenomeno[] = [
  {
    id: 1,
    clave: "F1",
    nombre: "IA y capacidades estratégicas",
    descripcion: "Uso, desarrollo e impacto de la inteligencia artificial en la Defensa Nacional.",
    color: "#f0b429",
    texto: "text-f1",
    borde: "border-f1/40",
    fondo: "bg-f1/10",
    punto: "bg-f1",
    simbolo: "circle",
    trazo: "solid",
  },
  {
    id: 2,
    clave: "F2",
    nombre: "Seguridad del entorno espacial",
    descripcion: "Congestión orbital, basura espacial y riesgos en órbita baja terrestre (LEO).",
    color: "#38bdf8",
    texto: "text-f2",
    borde: "border-f2/40",
    fondo: "bg-f2/10",
    punto: "bg-f2",
    simbolo: "triangle",
    trazo: "dashed",
  },
  {
    id: 3,
    clave: "F3",
    nombre: "Dinámicas territoriales",
    descripcion:
      "Conflicto, gobernanza, desigualdad, migración y violencia en América Latina y Colombia.",
    color: "#34d399",
    texto: "text-f3",
    borde: "border-f3/40",
    fondo: "bg-f3/10",
    punto: "bg-f3",
    simbolo: "diamond",
    trazo: "dotted",
  },
] as const;

export function fenomenoPorId(id: number | null | undefined): Fenomeno | null {
  if (id === null || id === undefined) {
    return null;
  }
  return FENOMENOS.find((f) => f.id === id) ?? null;
}

export function colorFenomeno(id: number | null | undefined): string {
  return fenomenoPorId(id)?.color ?? "#58a6ff";
}

export function etiquetaFenomeno(id: number | null | undefined): string {
  const fenomeno = fenomenoPorId(id);
  return fenomeno ? `${fenomeno.clave} · ${fenomeno.nombre}` : "Los tres fenómenos";
}
