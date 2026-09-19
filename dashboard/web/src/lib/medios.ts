import { useSyncExternalStore } from "react";

/**
 * Consulta de medios como fuente externa: `useSyncExternalStore` la lee sin escribir
 * estado dentro de un efecto, así que no hay un primer render con el valor equivocado.
 */
function almacenDe(consulta: string) {
  const lista = window.matchMedia(consulta);
  const suscribir = (alCambiar: () => void): (() => void) => {
    lista.addEventListener("change", alCambiar);
    return () => lista.removeEventListener("change", alCambiar);
  };
  const instantanea = (): boolean => lista.matches;
  return { suscribir, instantanea };
}

const cache = new Map<string, ReturnType<typeof almacenDe>>();

function almacen(consulta: string) {
  let existente = cache.get(consulta);
  if (!existente) {
    existente = almacenDe(consulta);
    cache.set(consulta, existente);
  }
  return existente;
}

export function useMedia(consulta: string): boolean {
  const { suscribir, instantanea } = almacen(consulta);
  return useSyncExternalStore(suscribir, instantanea, instantanea);
}

/** `lg` de Tailwind: a partir de aquí la burbuja del agente flota y se arrastra. */
export function useEscritorio(): boolean {
  return useMedia("(min-width: 1024px)");
}
