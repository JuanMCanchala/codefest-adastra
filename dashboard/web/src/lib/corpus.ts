import { useSyncExternalStore } from "react";

import type { IdChunk } from "@/api/tipos";

/**
 * Corpus original disponible: lo decide el despliegue, no el navegador.
 *
 * Los archivos de la Etapa 0 (PDF, JSON, CSV) pesan gigas, así que no viajan en la imagen.
 * Si el contenedor los monta en `CORPUS_DIR`, la API los sirve y la evidencia enlaza al
 * documento del que salió cada fragmento; si no, el enlace no se ofrece en vez de llevar
 * a un 404.
 *
 * Es un almacén de módulo, como la vista técnica: una sola respuesta para toda la interfaz.
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
export function fijarCorpusDisponible(valor: boolean): void {
  if (disponible === valor) {
    return;
  }
  disponible = valor;
  for (const alCambiar of oyentes) {
    alCambiar();
  }
}

/** `true` cuando la API puede servir el archivo original de un fragmento. */
export function useCorpusDisponible(): boolean {
  return useSyncExternalStore(suscribir, instantanea, instantanea);
}

/** Dirección del archivo del que salió el fragmento. */
export function enlaceDocumento(chunkId: IdChunk): string {
  return `/api/documento/${encodeURIComponent(String(chunkId))}`;
}
