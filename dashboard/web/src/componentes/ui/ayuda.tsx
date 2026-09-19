import { Info, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface Props {
  /** Nombre del botón y título del recuadro, p. ej. «Cómo se calculó». */
  titulo: string;
  children: ReactNode;
  className?: string;
}

/**
 * Explicación a un clic: el texto largo no ocupa la vista principal pero sigue disponible.
 * Es un botón real (no un `title` al pasar el ratón) para que funcione con teclado y en táctil.
 */
export function Ayuda({ titulo, children, className }: Props) {
  const [abierta, setAbierta] = useState(false);
  const id = useId();
  const contenedor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!abierta) {
      return;
    }
    const alPulsarFuera = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) {
        setAbierta(false);
      }
    };
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setAbierta(false);
      }
    };
    document.addEventListener("mousedown", alPulsarFuera);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alPulsarFuera);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierta]);

  return (
    <span ref={contenedor} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-expanded={abierta}
        aria-controls={id}
        onClick={() => setAbierta((previa) => !previa)}
        className={cn(
          "inline-flex size-6 items-center justify-center rounded border transition-colors",
          abierta
            ? "border-acento/60 bg-acento/10 text-acento"
            : "border-borde bg-elevado text-apagado hover:text-texto",
        )}
      >
        <Info aria-hidden="true" className="size-3.5" />
        <span className="sr-only">{titulo}</span>
      </button>

      {abierta ? (
        <span
          id={id}
          role="note"
          className="absolute left-0 top-8 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-borde bg-elevado p-3 text-left shadow-[0_12px_32px_rgb(0_0_0/0.55)]"
        >
          <span className="flex items-start gap-2">
            <span className="flex-1 text-xs font-semibold uppercase tracking-[0.06em] text-apagado">
              {titulo}
            </span>
            <button
              type="button"
              onClick={() => setAbierta(false)}
              className="-mr-1 -mt-1 inline-flex size-6 items-center justify-center rounded text-apagado hover:text-texto"
            >
              <X aria-hidden="true" className="size-3.5" />
              <span className="sr-only">Cerrar</span>
            </button>
          </span>
          <span className="mt-1.5 block text-sm leading-relaxed text-texto">{children}</span>
        </span>
      ) : null}
    </span>
  );
}
