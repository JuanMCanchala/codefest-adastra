import { Box, Crosshair, Layers, Scan } from "lucide-react";

import { BASES, type ClaveBase } from "@/lib/mapa-base";
import { cn } from "@/lib/utils";

interface Props {
  base: ClaveBase;
  onCambiarBase: (clave: ClaveBase) => void;
  hud: boolean;
  onCambiarHud: (activo: boolean) => void;
  volumen: boolean;
  onCambiarVolumen: (activo: boolean) => void;
  /** El globo no dibuja bien la extrusión: allí el interruptor no se ofrece. */
  mostrarVolumen: boolean;
  /** Devuelve la cámara al encuadre de los datos tras navegar a mano. */
  onEncuadrar: () => void;
}

const BOTON =
  "h-7 px-2 text-xs font-medium transition-colors focus-visible:relative focus-visible:z-10";

const INTERRUPTOR =
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors";
const ENCENDIDO = "border-acento bg-acento/15 text-texto";
const APAGADO = "border-control bg-elevado text-apagado hover:text-texto";

/** Selector de mapa base y del HUD táctico, sobre la esquina superior derecha del lienzo. */
export function ControlesMapa({
  base,
  onCambiarBase,
  hud,
  onCambiarHud,
  volumen,
  onCambiarVolumen,
  mostrarVolumen,
  onEncuadrar,
}: Props) {
  // El grupo se sitúa debajo del control de MapLibre (10 px de margen y tres botones de
  // 36 px: acercar, alejar y brújula), que si no intercepta los clics de estos botones.
  return (
    <div className="pointer-events-auto absolute right-3 top-36 flex flex-col items-end gap-1.5">
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
      <div className="flex gap-1.5">
        {mostrarVolumen ? (
          <button
            type="button"
            title="Levanta cada región en una columna proporcional a su dato e inclina la cámara; con mapa base de imagen añade el relieve del terreno"
            aria-pressed={volumen}
            onClick={() => onCambiarVolumen(!volumen)}
            className={cn(INTERRUPTOR, volumen ? ENCENDIDO : APAGADO)}
          >
            <Box aria-hidden="true" className="size-3.5" />
            Volumen
          </button>
        ) : null}
        <button
          type="button"
          title="Vuelve al encuadre de las regiones con dato"
          onClick={onEncuadrar}
          className={cn(INTERRUPTOR, APAGADO)}
        >
          <Scan aria-hidden="true" className="size-3.5" />
          Encuadrar
        </button>
        <button
          type="button"
          title="Superpone lectura de coordenadas, retícula y encuadre de la región seleccionada"
          aria-pressed={hud}
          onClick={() => onCambiarHud(!hud)}
          className={cn(INTERRUPTOR, hud ? ENCENDIDO : APAGADO)}
        >
          <Crosshair aria-hidden="true" className="size-3.5" />
          HUD
        </button>
      </div>
    </div>
  );
}
