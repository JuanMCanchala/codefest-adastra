"use client";

import { useSyncExternalStore } from "react";

/**
 * Modo claro u oscuro, igual que en el tablero.
 *
 * El modo se aplica al `<html>` antes de pintar (con el guion de `layout.tsx`), así que
 * aquí solo se lee y se alterna. No hay estado en el servidor: el valor vive en el
 * documento y en `localStorage`, que es de cada navegador.
 */

export type Modo = "oscuro" | "claro";

export const CLAVE = "aerocode:tema";

/**
 * Guion que corre antes del primer pintado. Sin él, la página aparecería en oscuro y
 * saltaría a claro, que es justo el destello que molesta.
 */
export const GUION_TEMA = `(function(){try{var m=localStorage.getItem(${JSON.stringify(
  CLAVE,
)})==="claro"?"claro":"oscuro";document.documentElement.dataset.tema=m;}catch(e){document.documentElement.dataset.tema="oscuro";}})();`;

function leer(): Modo {
  if (typeof document === "undefined") {
    return "oscuro";
  }
  return document.documentElement.dataset["tema"] === "claro" ? "claro" : "oscuro";
}

const oyentes = new Set<() => void>();

export function alternarTema(): void {
  const siguiente: Modo = leer() === "oscuro" ? "claro" : "oscuro";
  document.documentElement.dataset["tema"] = siguiente;
  try {
    localStorage.setItem(CLAVE, siguiente);
  } catch {
    // Una ventana privada no guarda la preferencia; el modo sigue funcionando.
  }
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
    leer,
    // En el servidor no hay documento: se pinta el oscuro y el guion corrige antes de ver.
    () => "oscuro" as Modo,
  );
}
