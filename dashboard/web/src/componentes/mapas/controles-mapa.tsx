import { Crosshair, Layers } from "lucide-react";

import { BASES, type ClaveBase } from "@/lib/mapa-base";
import { cn } from "@/lib/utils";

interface Props {
  base: ClaveBase;
  onCambiarBase: (clave: ClaveBase) => void;
  hud: boolean;
  onCambiarHud: (activo: boolean) => void;
}

const BOTON =
  "h-7 px-2 text-xs font-medium transition-colors focus-visible:relative focus-visible:z-10";

/** Selector de mapa base y del HUD táctico, sobre la esquina superior derecha del lienzo. */
export function ControlesMapa({ base, onCambiarBase, hud, onCambiarHud }: Props) {
  // El grupo se sitúa debajo del control de zoom de MapLibre (10 px de margen y dos
  // botones de 36 px), que si no intercepta los clics de estos botones.
  return (
    <div className="pointer-events-auto absolute right-3 top-24 flex flex-col items-end gap-1.5">
      <div
        role="group"
        aria-label="Mapa base"
        className="flex overflow-hidden rounded-md border border-control bg-elevado divide-x divide-borde"
      >
        <span className="flex items-center px-2 text-apagado" aria-hidden="true">
          <Layers className="size-3.5" />
        </span>
        {BASES.map((opcion) => {
          const activa = opcion.clave === base;
          return (
            <button
              key={opcion.clave}
              type="button"
              title={opcion.descripcion}
              aria-pressed={activa}
              onClick={() => onCambiarBase(opcion.clave)}
              className={cn(
                BOTON,
                activa ? "bg-acento/15 text-texto" : "text-apagado hover:bg-panel hover:text-texto",
              )}
            >
              {opcion.etiqueta}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        title="Superpone lectura de coordenadas, retícula y encuadre de la región seleccionada"
        aria-pressed={hud}
        onClick={() => onCambiarHud(!hud)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
          hud
            ? "border-acento bg-acento/15 text-texto"
            : "border-control bg-elevado text-apagado hover:text-texto",
        )}
      >
        <Crosshair aria-hidden="true" className="size-3.5" />
        HUD
      </button>
    </div>
  );
}
