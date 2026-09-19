/** Fenómenos de interés y su identidad visual. El color es consistente en toda la consola. */

export type IdFenomeno = 1 | 2 | 3;

export interface Fenomeno {
  id: IdFenomeno;
  clave: string;
  nombre: string;
  descripcion: string;
  /** Clases de Tailwind resueltas en tiempo de compilación (no se generan dinámicamente). */
  texto: string;
  borde: string;
  fondo: string;
  punto: string;
  /** Forma del marcador: el fenómeno no depende solo del color (WCAG 1.4.1). */
  simbolo: "circle" | "triangle" | "diamond";
}

export const FENOMENOS: readonly Fenomeno[] = [
  {
    id: 1,
    clave: "F1",
    nombre: "IA y capacidades estratégicas",
    descripcion: "Uso, desarrollo e impacto de la inteligencia artificial en la Defensa Nacional.",
    texto: "text-f1",
    borde: "border-f1/40",
    fondo: "bg-f1/10",
    punto: "bg-f1",
    simbolo: "circle",
  },
  {
    id: 2,
    clave: "F2",
    nombre: "Seguridad del entorno espacial",
    descripcion: "Congestión orbital, basura espacial y riesgos en órbita baja terrestre (LEO).",
    texto: "text-f2",
    borde: "border-f2/40",
    fondo: "bg-f2/10",
    punto: "bg-f2",
    simbolo: "triangle",
  },
  {
    id: 3,
    clave: "F3",
    nombre: "Dinámicas territoriales",
    descripcion:
      "Conflicto, gobernanza, desigualdad, migración y violencia en América Latina y Colombia.",
    texto: "text-f3",
    borde: "border-f3/40",
    fondo: "bg-f3/10",
    punto: "bg-f3",
    simbolo: "diamond",
  },
] as const;

export function fenomenoPorId(id: number | null | undefined): Fenomeno | null {
  if (id === null || id === undefined) {
    return null;
  }
  return FENOMENOS.find((f) => f.id === id) ?? null;
}
