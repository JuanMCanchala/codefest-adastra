/**
 * Escala secuencial viridis: perceptualmente uniforme y legible con cualquier tipo de
 * daltonismo (Anexo B: la lectura no puede depender solo del matiz).
 */

export const VIRIDIS: readonly string[] = [
  "#440154",
  "#46327e",
  "#365c8d",
  "#277f8e",
  "#1fa187",
  "#4ac16d",
  "#a0da39",
  "#fde725",
] as const;

export interface Tramo {
  desde: number;
  hasta: number;
  color: string;
}

/** Devuelve tramos de igual amplitud sobre [0, maximo], con al menos un tramo. */
export function tramosLineales(maximo: number, cantidad = 6): Tramo[] {
  const tope = Math.max(1, Math.ceil(maximo));
  const n = Math.max(1, Math.min(cantidad, tope));
  const paso = tope / n;
  const tramos: Tramo[] = [];
  for (let i = 0; i < n; i += 1) {
    tramos.push({
      desde: i === 0 ? 1 : Math.round(i * paso) + 1,
      hasta: Math.round((i + 1) * paso),
      color: colorEnEscala((i + 0.5) / n),
    });
  }
  return tramos;
}

/** Interpola la rampa en [0, 1]. */
export function colorEnEscala(posicion: number): string {
  const acotada = Math.min(1, Math.max(0, posicion));
  const indice = Math.round(acotada * (VIRIDIS.length - 1));
  return VIRIDIS[indice] ?? "#58a6ff";
}

/** Color de un valor dentro de [0, maximo]; el 0 usa el color de "sin dato". */
export function colorPorValor(valor: number, maximo: number): string {
  if (valor <= 0 || maximo <= 0) {
    return SIN_DATO;
  }
  return colorEnEscala(Math.sqrt(valor / maximo));
}

export const SIN_DATO = "#1b2531";

/** Paleta categórica apta para daltonismo (Okabe–Ito, orden estable). */
export const CATEGORICA: readonly string[] = [
  "#56b4e9",
  "#e69f00",
  "#009e73",
  "#f0e442",
  "#0072b2",
  "#d55e00",
  "#cc79a7",
  "#bbbbbb",
] as const;

export function colorCategoria(indice: number): string {
  return CATEGORICA[indice % CATEGORICA.length] ?? "#58a6ff";
}
