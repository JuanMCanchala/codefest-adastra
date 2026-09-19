/**
 * Espejo en TypeScript de los tokens de DESIGN.md para los lienzos que no leen CSS
 * (ECharts, MapLibre y el SVG de la red). Si cambia un token, cambia aquí y en estilos.css.
 */
export const TEMA = {
  fondo: "#070d19",
  panel: "#0b1426",
  elevado: "#12203a",
  borde: "#1d2c47",
  control: "#5f7499",
  texto: "#e8edf5",
  apagado: "#a7b4ca",
  tenue: "#8494ae",
  acento: "#e8b64c",
  senal: "#8cb4ff",
  mapaFondo: "#0a1222",
  sinDato: "#16223a",
  /** Filas alternas de las matrices: dos pasos entre casco y cabina. */
  franjaA: "#0b1426",
  franjaB: "#0e192f",
} as const;

/** Tamaño mínimo de texto en los lienzos (regla del proyector: nunca menos de 12 px). */
export const TEXTO_MINIMO = 12;
