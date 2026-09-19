import { useSyncExternalStore } from "react";

/**
 * Vista técnica: la decide el despliegue, no el navegador.
 *
 * El tablero que revisa el jurado va limpio; el del equipo se enciende con `VISTA_TECNICA=1`
 * en el contenedor y llega a la interfaz en `GET /api/salud`. Los identificadores internos
 * (`mapa_colombia`, claves crudas de filtros), el consumo de tokens y las rutas del corpus no
 * le sirven a quien evalúa y compiten con la evidencia.
 *
 * Es un almacén de módulo: la preferencia es una sola para toda la interfaz y
 * `useSyncExternalStore` la lee sin escribir estado en un efecto.
 */

const oyentes = new Set<() => void>();
let activa = false;

function suscribir(alCambiar: () => void): () => void {
  oyentes.add(alCambiar);
  return () => {
    oyentes.delete(alCambiar);
  };
}

function instantanea(): boolean {
  return activa;
}

/** Publica lo que respondió la API. Se llama una vez, al arrancar. */
export function fijarVistaTecnica(valor: boolean): void {
  if (activa === valor) {
    return;
  }
  activa = valor;
  for (const alCambiar of oyentes) {
    alCambiar();
  }
}

/** `true` cuando el despliegue pidió ver los detalles internos del sistema. */
export function useVistaTecnica(): boolean {
  return useSyncExternalStore(suscribir, instantanea, instantanea);
}
