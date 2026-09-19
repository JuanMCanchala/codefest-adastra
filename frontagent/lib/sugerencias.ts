import type { IdFenomeno } from "@/lib/fenomenos";

export interface Sugerencia {
  fenomeno: IdFenomeno;
  pregunta: string;
}

/** Preguntas preparadas por fenómeno para arrancar la demostración. */
export const SUGERENCIAS: readonly Sugerencia[] = [
  {
    fenomeno: 1,
    pregunta:
      "¿Qué capacidades estratégicas habilita la inteligencia artificial en entornos militares y qué riesgos se documentan?",
  },
  {
    fenomeno: 1,
    pregunta:
      "¿Cómo avanza Colombia en la adopción de inteligencia artificial para la Defensa Nacional frente a la tendencia global?",
  },
  {
    fenomeno: 2,
    pregunta: "¿Qué tan congestionada está la órbita baja terrestre y qué implica para Colombia?",
  },
  {
    fenomeno: 2,
    pregunta:
      "¿Qué es el síndrome de Kessler y qué medidas de mitigación de basura espacial se están aplicando?",
  },
  {
    fenomeno: 3,
    pregunta:
      "¿Cuáles son las principales amenazas a la gobernanza territorial en América Latina según el corpus?",
  },
  {
    fenomeno: 3,
    pregunta:
      "¿Qué relación documentan las fuentes entre economías ilícitas, migración y violencia en Colombia?",
  },
] as const;
