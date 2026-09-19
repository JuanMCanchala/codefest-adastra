import { useSyncExternalStore } from "react";

/**
 * Resumen en prosa disponible: lo decide el despliegue, no el navegador.
 *
 * El texto que acompaña al tríptico lo escribe un modelo de lenguaje a través del gateway
 * de ADL. Si el contenedor no trae `LLM_BASE_URL` y `LLM_API_KEY`, la API no puede
 * pedirlo y la vista no lo ofrece, en vez de enseñar un hueco que siempre falla.
 *
 * Lo que no depende de esto es el veredicto de minería ni las cifras: los mide el
 * segmentador y viajan con el componente, así que están en pantalla en cualquier caso.
 *
 * Es un almacén de módulo, como la vista técnica y el corpus: una sola respuesta para
 * toda la interfaz.
 */

const oyentes = new Set<() => void>();
let disponible = false;

function suscribir(alCambiar: () => void): () => void {
  oyentes.add(alCambiar);
  return () => {
    oyentes.delete(alCambiar);
  };
}

function instantanea(): boolean {
  return disponible;
}

/** Publica lo que respondió `GET /api/salud`. Se llama una vez, al arrancar. */
export function fijarLecturaDisponible(valor: boolean): void {
  if (disponible === valor) {
    return;
  }
  disponible = valor;
  for (const alCambiar of oyentes) {
    alCambiar();
  }
}

/** `true` cuando la API puede pedirle al modelo el resumen del tríptico. */
export function useLecturaDisponible(): boolean {
  return useSyncExternalStore(suscribir, instantanea, instantanea);
}
