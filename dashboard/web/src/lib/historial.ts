import type { RespuestaVisualizar } from "@/api/tipos";

/** Una instrucción enviada a `POST /api/visualizar` y su resultado, para poder volver a ella. */
export interface EntradaHistorial {
  id: string;
  instruccion: string;
  hora: string;
  respuesta: RespuestaVisualizar | null;
  error: string | null;
}

export function horaActual(): string {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

export function nuevoId(): string {
  return `${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
}
