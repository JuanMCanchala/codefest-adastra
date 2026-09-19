import { useEffect, useState } from "react";

import { esAbortada, mensajeDeExcepcion } from "@/lib/utils";

export type Estado<T> =
  | { fase: "cargando" }
  | { fase: "listo"; dato: T }
  | { fase: "error"; mensaje: string };

/**
 * Carga un recurso de la API cancelando la petición anterior. `clave` identifica la petición:
 * cuando cambia, se vuelve a pedir. Nunca devuelve datos simulados: si falla, expone el error.
 */
export function useRecurso<T>(
  clave: string,
  cargar: (senal: AbortSignal) => Promise<T>,
): Estado<T> & { recargar: () => void } {
  const [estado, setEstado] = useState<Estado<T>>({ fase: "cargando" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const control = new AbortController();
    setEstado({ fase: "cargando" });
    cargar(control.signal)
      .then((dato) => {
        if (!control.signal.aborted) {
          setEstado({ fase: "listo", dato });
        }
      })
      .catch((error: unknown) => {
        if (!esAbortada(error) && !control.signal.aborted) {
          setEstado({ fase: "error", mensaje: mensajeDeExcepcion(error) });
        }
      });
    return () => control.abort();
    // `clave` resume los argumentos de la petición; `cargar` se recrea en cada render.
  }, [clave, intento]);

  return { ...estado, recargar: () => setIntento((n) => n + 1) };
}
