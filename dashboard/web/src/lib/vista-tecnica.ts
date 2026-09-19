import { useSyncExternalStore } from "react";

/**
 * Vista técnica: apagada por defecto.
 *
 * El tablero lo revisa un oficial que juzga si el sistema responde con rigor, no el equipo que
 * lo construyó. Los identificadores internos (`mapa_colombia`, claves crudas de filtros), el
 * consumo de tokens y los parámetros de las herramientas no le sirven para eso y compiten
 * con la evidencia. Siguen a un clic de distancia, no en la vista principal.
 *
 * Es un almacén de módulo y no un contexto: la preferencia es única para toda la interfaz y
 * `useSyncExternalStore` la lee sin desajustar la hidratación ni escribir estado en un efecto.
 */

const CLAVE = "aerocode:vista-tecnica";

const oyentes = new Set<() => void>();
let activa = false;
let leida = false;

function suscribir(alCambiar: () => void): () => void {
  oyentes.add(alCambiar);
  return () => {
    oyentes.delete(alCambiar);
  };
}

/** El valor se cachea porque `useSyncExternalStore` exige una instantánea estable. */
function instantanea(): boolean {
  if (!leida) {
    try {
      activa = localStorage.getItem(CLAVE) === "1";
    } catch {
      activa = false; // Navegación privada o almacenamiento bloqueado.
    }
    leida = true;
  }
  return activa;
}

function instantaneaServidor(): boolean {
  return false;
}

export function alternarVistaTecnica(): void {
  activa = !instantanea();
  try {
    localStorage.setItem(CLAVE, activa ? "1" : "0");
  } catch {
    // Sin almacenamiento la preferencia solo dura la sesión.
  }
  for (const alCambiar of oyentes) {
    alCambiar();
  }
}

/** `true` cuando el usuario pidió ver los detalles internos del sistema. */
export function useVistaTecnica(): boolean {
  return useSyncExternalStore(suscribir, instantanea, instantaneaServidor);
}
