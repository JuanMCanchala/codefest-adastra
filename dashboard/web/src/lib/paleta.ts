import { TEMA } from "@/lib/tema";

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

/**
 * Tramos de la leyenda derivados de la misma función que colorea el mapa (`colorPorValor`),
 * de modo que cada color de la leyenda cubre exactamente los conteos que pinta.
 */
export function tramosLineales(maximo: number): Tramo[] {
  const tope = Math.max(1, Math.ceil(maximo));
  const tramos: Tramo[] = [];
  const agregar = (valor: number) => {
    const color = colorPorValor(valor, tope);
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && ultimo.color === color) {
      ultimo.hasta = valor;
    } else {
      tramos.push({ desde: valor, hasta: valor, color });
    }
  };
  if (tope <= 20000) {
    for (let valor = 1; valor <= tope; valor += 1) agregar(valor);
  } else {
    // Muestreo fino para topes muy altos; los extremos se ajustan al entero más cercano.
    const pasos = 20000;
    for (let i = 1; i <= pasos; i += 1) agregar(Math.max(1, Math.round((i / pasos) * tope)));
  }
  return tramos;
}

/** Fracción de la rampa viridis que se omite en el extremo oscuro. */
export const INICIO_ESCALA = 0.3;

/** Rampa visible sobre el fondo oscuro, para gráficos que interpolan por su cuenta. */
export const VIRIDIS_VISIBLE: readonly string[] = VIRIDIS.slice(2);

/** Interpola la rampa en [0, 1]. */
export function colorEnEscala(posicion: number): string {
  const acotada = Math.min(1, Math.max(0, posicion));
  // Sobre fondo azul noche el primer tercio de viridis se confunde con "sin dato":
  // la escala empieza en el azul medio para que el tramo más bajo siga siendo visible.
  const t = INICIO_ESCALA + (1 - INICIO_ESCALA) * acotada;
  const indice = Math.round(t * (VIRIDIS.length - 1));
  return VIRIDIS[indice] ?? TEMA.senal;
}

/** Color de un valor dentro de [0, maximo]; el 0 usa el color de "sin dato". */
export function colorPorValor(valor: number, maximo: number): string {
  if (valor <= 0 || maximo <= 0) {
    return SIN_DATO;
  }
  return colorEnEscala(Math.sqrt(valor / maximo));
}

export const SIN_DATO = TEMA.sinDato;

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
  return CATEGORICA[indice % CATEGORICA.length] ?? TEMA.senal;
}
