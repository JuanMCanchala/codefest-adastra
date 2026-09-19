import { TEMA } from "@/lib/tema";

/**
 * Escala secuencial de un solo matiz (azul), construida como rampa de luminosidad.
 *
 * Sustituye a viridis, que sobre una interfaz gris metía tres matices (morado, verde,
 * amarillo) y se llevaba la atención. Un solo matiz cumple mejor el Anexo B: la lectura
 * va por claridad, así que funciona con cualquier tipo de daltonismo y en blanco y negro.
 */

export const ESCALA_SECUENCIAL: readonly string[] = [
  "#0e2438",
  "#123453",
  "#154670",
  "#1a598e",
  "#216fae",
  "#3a8bcd",
  "#66aae3",
  "#9cc9f5",
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
export const ESCALA_VISIBLE: readonly string[] = ESCALA_SECUENCIAL.slice(2);

/** Interpola la rampa en [0, 1]. */
export function colorEnEscala(posicion: number): string {
  const acotada = Math.min(1, Math.max(0, posicion));
  // El extremo oscuro de la rampa se confunde con "sin dato" sobre el fondo de la
  // página: la escala arranca más arriba para que el tramo más bajo siga siendo visible.
  const t = INICIO_ESCALA + (1 - INICIO_ESCALA) * acotada;
  const indice = Math.round(t * (ESCALA_SECUENCIAL.length - 1));
  return ESCALA_SECUENCIAL[indice] ?? TEMA.senal;
}

/** Color de un valor dentro de [0, maximo]; el 0 usa el color de "sin dato". */
export function colorPorValor(valor: number, maximo: number): string {
  if (valor <= 0 || maximo <= 0) {
    return SIN_DATO;
  }
  return colorEnEscala(Math.sqrt(valor / maximo));
}

export const SIN_DATO = TEMA.sinDato;

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
