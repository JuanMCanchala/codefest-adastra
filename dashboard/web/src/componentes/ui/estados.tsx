import { AlertTriangle, Inbox, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Boton } from "@/componentes/ui/boton";

interface PropsCargando {
  mensaje?: string;
  /** Muestra el tiempo real transcurrido: espera honesta cuando responde el agente. */
  cronometro?: boolean;
}

function Cronometro() {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    const inicio = Date.now();
    const intervalo = setInterval(() => {
      setSegundos(Math.floor((Date.now() - inicio) / 1000));
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);
  return (
    <p className="font-mono text-xs text-tenue" aria-hidden="true">
      {segundos} s · suele tardar entre 2 y 7 s
    </p>
  );
}

export function Cargando({
  mensaje = "Consultando la API del tablero…",
  cronometro = false,
}: PropsCargando) {
  return (
    <div
      className="flex h-full min-h-48 flex-col items-center justify-center gap-3 px-6 py-10 text-center"
      role="status"
      aria-live="polite"
    >
      <Loader2 aria-hidden="true" className="size-6 animate-spin text-acento" />
      <p className="text-sm text-apagado">{mensaje}</p>
      {cronometro ? <Cronometro /> : null}
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
      {detalle ? <p className="max-w-md text-sm leading-relaxed text-apagado">{detalle}</p> : null}
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
      <p className="max-w-md text-sm leading-relaxed text-apagado">{mensaje}</p>
      {onReintentar ? (
        <Boton tamano="sm" onClick={onReintentar}>
          <RotateCcw aria-hidden="true" className="size-3.5" />
          Reintentar
        </Boton>
      ) : null}
    </div>
  );
}
