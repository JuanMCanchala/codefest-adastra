import { Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface Props {
  /** Nombre accesible del icono, p. ej. «Cómo se calculó». */
  titulo: string;
  children: ReactNode;
  className?: string;
  /**
   * Borde por el que se cuelga el globo. El lienzo recorta lo que se sale (`overflow-hidden`,
   * que es lo que impide que una tabla ancha empuje la página), así que un globo centrado
   * sobre un icono pegado a la derecha aparecía cortado a media palabra.
   */
  alineacion?: "centro" | "derecha";
}

/**
 * Explicación al pasar el ratón o al enfocar con el teclado. Dos nodos y nada más: el icono
 * y el globo, que no ocupa sitio en el flujo ni pide un clic.
 */
export function Ayuda({ titulo, children, className, alineacion = "derecha" }: Props) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      <span
        tabIndex={0}
        role="note"
        aria-label={titulo}
        className="inline-flex size-5 items-center justify-center rounded text-tenue outline-none transition-colors hover:text-texto focus-visible:text-texto focus-visible:ring-1 focus-visible:ring-acento"
      >
        <Info aria-hidden="true" className="size-3.5" />
      </span>
      <span
        className={cn(
          "pointer-events-none invisible absolute top-7 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-borde bg-elevado px-3 py-2.5 text-left text-xs leading-relaxed text-texto opacity-0 shadow-[0_10px_28px_rgb(0_0_0/0.5)] transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100",
          alineacion === "derecha" ? "right-0" : "left-1/2 -translate-x-1/2",
        )}
      >
        {children}
      </span>
    </span>
  );
}
