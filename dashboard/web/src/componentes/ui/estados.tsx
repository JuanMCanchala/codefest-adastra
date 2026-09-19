import { AlertTriangle, Inbox, Loader2, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { Boton } from "@/componentes/ui/boton";

interface PropsCargando {
  mensaje?: string;
}

export function Cargando({ mensaje = "Consultando la API del tablero…" }: PropsCargando) {
  return (
    <div
      className="flex h-full min-h-48 flex-col items-center justify-center gap-3 px-6 py-10 text-center"
      role="status"
      aria-live="polite"
    >
      <Loader2 aria-hidden="true" className="size-6 animate-spin text-acento" />
      <p className="text-xs text-apagado">{mensaje}</p>
    </div>
  );
}

interface PropsVacio {
  titulo: string;
  detalle?: string;
  accion?: ReactNode;
}

export function Vacio({ titulo, detalle, accion }: PropsVacio) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <Inbox aria-hidden="true" className="size-6 text-apagado" />
      <p className="text-sm font-medium text-texto">{titulo}</p>
      {detalle ? <p className="max-w-md text-xs leading-relaxed text-apagado">{detalle}</p> : null}
      {accion}
    </div>
  );
}

interface PropsError {
  mensaje: string;
  onReintentar?: () => void;
}

export function AvisoError({ mensaje, onReintentar }: PropsError) {
  return (
    <div
      className="flex h-full min-h-48 flex-col items-center justify-center gap-3 px-6 py-10 text-center"
      role="alert"
    >
      <AlertTriangle aria-hidden="true" className="size-6 text-alerta" />
      <p className="text-sm font-medium text-texto">No se pudo obtener el dato</p>
      <p className="max-w-md text-xs leading-relaxed text-apagado">{mensaje}</p>
      {onReintentar ? (
        <Boton tamano="sm" onClick={onReintentar}>
          <RotateCcw aria-hidden="true" className="size-3.5" />
          Reintentar
        </Boton>
      ) : null}
    </div>
  );
}
