import { useSyncExternalStore } from "react";

/**
 * Espejo en TypeScript de los tokens de DESIGN.md para los lienzos que no leen CSS
 * (ECharts, MapLibre y el SVG de la red).
 *
 * Como hay dos modos, los valores no pueden estar escritos aquí: se leen del documento,
 * que es la única fuente. `sincronizar()` los relee cuando cambia el modo y la aplicación
 * se vuelve a montar, así que los lienzos se redibujan con los colores nuevos.
 */

export type Modo = "oscuro" | "claro";

const CLAVE = "aerocode:tema";

/** Valores del modo oscuro: los mismos de `estilos.css`, por si se lee antes de montar. */
export const TEMA = {
  fondo: "#0a0a0a",
  panel: "#111111",
  elevado: "#1a1a1a",
  borde: "#262626",
  control: "#404040",
  texto: "#ededed",
  apagado: "#a1a1a1",
  tenue: "#8f8f8f",
  acento: "#fafafa",
  senal: "#3291ff",
  mapaFondo: "#0a0a0a",
  sinDato: "#1c1c1c",
  /** Filas alternas de las matrices: un solo paso entre superficie y elevada. */
  franjaA: "#111111",
  franjaB: "#161616",
};

const DERIVADOS: Record<Modo, Pick<typeof TEMA, "mapaFondo" | "sinDato" | "franjaA" | "franjaB">> =
  {
    oscuro: {
      mapaFondo: "#0a0a0a",
      sinDato: "#1c1c1c",
      franjaA: "#111111",
      franjaB: "#161616",
    },
    claro: {
      mapaFondo: "#ffffff",
      sinDato: "#e8e8e8",
      franjaA: "#fafafa",
      franjaB: "#f3f3f3",
    },
  };

const VARIABLES: Record<string, keyof typeof TEMA> = {
  "--color-fondo": "fondo",
  "--color-panel": "panel",
  "--color-elevado": "elevado",
  "--color-borde": "borde",
  "--color-control": "control",
  "--color-texto": "texto",
  "--color-apagado": "apagado",
  "--color-tenue": "tenue",
  "--color-acento": "acento",
  "--color-senal": "senal",
};

/** Relee los tokens del documento. Se llama al arrancar y al cambiar de modo. */
export function sincronizarTema(modo: Modo): void {
  const estilo = getComputedStyle(document.documentElement);
  for (const [variable, clave] of Object.entries(VARIABLES)) {
    const valor = estilo.getPropertyValue(variable).trim();
    if (valor) {
      TEMA[clave] = valor;
    }
  }
  Object.assign(TEMA, DERIVADOS[modo]);
}

export function modoGuardado(): Modo {
  try {
    return localStorage.getItem(CLAVE) === "claro" ? "claro" : "oscuro";
  } catch {
    return "oscuro";
  }
}

const oyentes = new Set<() => void>();
let modo: Modo = modoGuardado();

/** Aplica el modo al documento antes del primer render, para que no haya destello. */
export function aplicarTema(siguiente: Modo): void {
  document.documentElement.dataset["tema"] = siguiente;
  sincronizarTema(siguiente);
}

export function alternarTema(): void {
  modo = modo === "oscuro" ? "claro" : "oscuro";
  try {
    localStorage.setItem(CLAVE, modo);
  } catch {
    // Una ventana privada no guarda la preferencia; el modo sigue funcionando.
  }
  aplicarTema(modo);
  for (const alCambiar of oyentes) {
    alCambiar();
  }
}

export function useModoTema(): Modo {
  return useSyncExternalStore(
    (alCambiar) => {
      oyentes.add(alCambiar);
      return () => oyentes.delete(alCambiar);
    },
    () => modo,
    () => modo,
  );
}

/** Tamaño mínimo de texto en los lienzos (regla del proyector: nunca menos de 12 px). */
export const TEXTO_MINIMO = 12;
