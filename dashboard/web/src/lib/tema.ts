/**
 * Espejo en TypeScript de los tokens de DESIGN.md para los lienzos que no leen CSS
 * (ECharts, MapLibre y el SVG de la red). Si cambia un token, cambia aquí y en estilos.css.
 */
export const TEMA = {
  fondo: "#0a0a0a",
  panel: "#111111",
  elevado: "#1a1a1a",
  borde: "#262626",
  control: "#404040",
  texto: "#ededed",
  apagado: "#a1a1a1",
  tenue: "#737373",
  acento: "#fafafa",
  senal: "#3291ff",
  mapaFondo: "#0a0a0a",
  sinDato: "#1c1c1c",
  /** Filas alternas de las matrices: un solo paso entre superficie y elevada. */
  franjaA: "#111111",
  franjaB: "#161616",
} as const;

/** Tamaño mínimo de texto en los lienzos (regla del proyector: nunca menos de 12 px). */
export const TEXTO_MINIMO = 12;
