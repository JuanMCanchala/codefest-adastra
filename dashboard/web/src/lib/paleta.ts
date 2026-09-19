import { TEMA } from "@/lib/tema";

/**
 * Escala de semáforo: verde (poco) → ámbar → rojo (mucho).
 *
 * Es la lectura que espera cualquiera ante un mapa de alertas, así que se prefiere a una
 * rampa de un solo matiz. Para no depender solo del matiz —verde y rojo son justo el par
 * que peor distingue la protanopia—, la claridad sube y baja de forma monótona a lo largo
 * de la rampa y la leyenda sigue dando el rango en números (Anexo B).
 */

export const ESCALA_SECUENCIAL: readonly string[] = [
  "#2f9e44",
  "#5cb338",
  "#94c11f",
  "#d4c000",
  "#f0a202",
  "#ee7b06",
  "#e2521a",
  "#c92a2a",
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

/** La rampa de semáforo se usa entera: el verde del extremo bajo es parte de la lectura. */
export const INICIO_ESCALA = 0;

/** Rampa visible sobre el fondo oscuro, para gráficos que interpolan por su cuenta. */
export const ESCALA_VISIBLE: readonly string[] = ESCALA_SECUENCIAL;

/** Interpola la rampa en [0, 1]. */
export function colorEnEscala(posicion: number): string {
  const acotada = Math.min(1, Math.max(0, posicion));
  const t = INICIO_ESCALA + (1 - INICIO_ESCALA) * acotada;
  const indice = Math.round(t * (ESCALA_SECUENCIAL.length - 1));
  return ESCALA_SECUENCIAL[indice] ?? TEMA.senal;
}

/** Color de un valor dentro de [0, maximo]; el 0 usa el color de "sin dato". */
export function colorPorValor(valor: number, maximo: number): string {
  if (valor <= 0 || maximo <= 0) {
    return sinDato();
  }
  return colorEnEscala(Math.sqrt(valor / maximo));
}

/**
 * Relleno de las regiones sin dato. Es una función y no una constante porque el modo
 * (claro u oscuro) se decide en tiempo de ejecución: capturarlo al cargar el módulo lo
 * dejaba clavado en el color del primer modo.
 */
export function sinDato(): string {
  return TEMA.sinDato;
}

/**
 * Paleta categórica apta para daltonismo (Okabe–Ito, orden estable), rebajada en
 * saturación para convivir con una interfaz gris sin perder la separación entre matices.
 */
export const CATEGORICA: readonly string[] = [
  "#6aa9f0",
  "#d9a45c",
  "#4fa98c",
  "#d7cf7a",
  "#5b8bc4",
  "#cf7a55",
  "#c08cb0",
  "#9a9a9a",
] as const;

export function colorCategoria(indice: number): string {
  return CATEGORICA[indice % CATEGORICA.length] ?? TEMA.senal;
}
