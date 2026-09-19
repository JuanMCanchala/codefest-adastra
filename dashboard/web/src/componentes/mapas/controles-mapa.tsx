import {
  Box,
  Check,
  ChevronDown,
  Crosshair,
  Frame,
  Layers,
  Maximize2,
  Minimize2,
  Orbit,
  Scan,
} from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";

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
  orbitas: boolean;
  onCambiarOrbitas: (activo: boolean) => void;
  /** Solo cuando el mapa tiene una capa de fronteras superiores que ofrecer. */
  mostrarFronteras: boolean;
  fronteras: boolean;
  onCambiarFronteras: (activo: boolean) => void;
  pantallaCompleta: boolean;
  onCambiarPantallaCompleta: (activo: boolean) => void;
}

const BOTON =
  "inline-flex h-7 items-center gap-1.5 rounded-md border border-borde bg-panel/95 px-2 text-xs font-medium text-apagado backdrop-blur-sm transition-colors hover:border-control hover:text-texto";

/**
 * Los mandos del mapa, recogidos en un menú.
 *
 * Eran ocho cajas en dos filas sobre la esquina del lienzo: tapaban el territorio justo
 * donde suele haber dato. Ahora solo quedan fuera los dos que se usan mirando el mapa
 * —el menú y la pantalla completa— y el resto vive dentro, donde además se lee de un
 * vistazo qué capa está encendida.
 */
export function ControlesMapa({
  base,
  onCambiarBase,
  hud,
  onCambiarHud,
  volumen,
  onCambiarVolumen,
  mostrarVolumen,
  onEncuadrar,
  orbitas,
  onCambiarOrbitas,
  mostrarFronteras,
  fronteras,
  onCambiarFronteras,
  pantallaCompleta,
  onCambiarPantallaCompleta,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement | null>(null);

  // Se cierra al pulsar fuera o con Escape, como cualquier menú.
  useEffect(() => {
    if (!abierto) {
      return;
    }
    const alPulsar = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) {
        setAbierto(false);
      }
    };
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        // La pantalla completa también escucha Escape: si el menú está abierto, se cierra
        // el menú y el mapa se queda como estaba.
        evento.stopPropagation();
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", alPulsar);
    document.addEventListener("keydown", alTeclear, true);
    return () => {
      document.removeEventListener("mousedown", alPulsar);
      document.removeEventListener("keydown", alTeclear, true);
    };
  }, [abierto]);

  const encendidas = [
    volumen && mostrarVolumen,
    orbitas,
    hud,
    fronteras && mostrarFronteras,
  ].filter(Boolean).length;

  // El grupo se sitúa debajo del control de MapLibre (10 px de margen y tres botones de
  // 36 px: acercar, alejar y brújula), que si no intercepta los clics de estos botones.
  return (
    <div
      ref={contenedor}
      className="pointer-events-auto absolute right-3 top-36 z-30 flex flex-col items-end gap-1.5"
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-expanded={abierto}
          aria-haspopup="menu"
          title="Fondo del mapa y capas"
          onClick={() => setAbierto((previo) => !previo)}
          className={cn(BOTON, abierto && "border-control text-texto")}
        >
          <Layers aria-hidden="true" className="size-3.5" />
          Capas
          {encendidas > 0 ? (
            <span className="rounded-full bg-acento px-1 font-mono text-[0.625rem] leading-4 text-fondo">
              {encendidas}
            </span>
          ) : null}
          <ChevronDown
            aria-hidden="true"
            className={cn("size-3.5 transition-transform", abierto && "rotate-180")}
          />
        </button>

        <button
          type="button"
          aria-pressed={pantallaCompleta}
          title={
            pantallaCompleta
              ? "Devuelve el mapa a su sitio en el tablero (Esc)"
              : "Agranda el mapa a toda la ventana para navegar con espacio"
          }
          aria-label={pantallaCompleta ? "Reducir el mapa" : "Ampliar el mapa"}
          onClick={() => onCambiarPantallaCompleta(!pantallaCompleta)}
          className={cn(BOTON, "w-7 justify-center px-0", pantallaCompleta && "text-texto")}
        >
          {pantallaCompleta ? (
            <Minimize2 aria-hidden="true" className="size-3.5" />
          ) : (
            <Maximize2 aria-hidden="true" className="size-3.5" />
          )}
        </button>
      </div>

      {abierto ? (
        <div
          role="menu"
          aria-label="Capas del mapa"
          className="w-60 overflow-hidden rounded-lg border border-borde bg-panel p-1 shadow-[0_8px_24px_rgb(0_0_0/0.45)]"
        >
          <p className="px-2 pb-1 pt-1.5 text-xs uppercase tracking-[0.06em] text-tenue">
            Fondo del mapa
          </p>
          {BASES.map((opcion) => (
            <button
              key={opcion.clave}
              type="button"
              role="menuitemradio"
              aria-checked={opcion.clave === base}
              title={opcion.descripcion}
              onClick={() => onCambiarBase(opcion.clave)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                opcion.clave === base
                  ? "bg-elevado text-texto"
                  : "text-apagado hover:bg-elevado/70",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{opcion.etiqueta}</span>
              {opcion.clave === base ? (
                <Check aria-hidden="true" className="size-3.5 shrink-0" />
              ) : null}
            </button>
          ))}

          <hr className="my-1 border-borde" />

          {mostrarVolumen ? (
            <Interruptor
              icono={Box}
              etiqueta="Volumen"
              descripcion="Levanta cada región en una columna proporcional a su dato e inclina la cámara; con mapa base de imagen añade el relieve del terreno"
              activo={volumen}
              onCambiar={onCambiarVolumen}
            />
          ) : null}
          {mostrarFronteras ? (
            <Interruptor
              icono={Frame}
              etiqueta="Fronteras departamentales"
              descripcion="Dibuja los límites de los departamentos sobre la coropleta municipal, para no perder la referencia al acercar"
              activo={fronteras}
              onCambiar={onCambiarFronteras}
            />
          ) : null}
          <Interruptor
            icono={Orbit}
            etiqueta="Órbitas"
            descripcion="Dibuja la traza y la franja de las misiones satelitales que producen la evidencia, y cuándo pasan sobre el territorio elegido"
            activo={orbitas}
            onCambiar={onCambiarOrbitas}
          />
          <Interruptor
            icono={Crosshair}
            etiqueta="HUD"
            descripcion="Superpone lectura de coordenadas, retícula y encuadre de la región seleccionada"
            activo={hud}
            onCambiar={onCambiarHud}
          />

          <hr className="my-1 border-borde" />

          <button
            type="button"
            role="menuitem"
            title="Vuelve al encuadre de las regiones con dato"
            onClick={() => {
              setAbierto(false);
              onEncuadrar();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-apagado transition-colors hover:bg-elevado/70 hover:text-texto"
          >
            <Scan aria-hidden="true" className="size-3.5 shrink-0" />
            Encuadrar los datos
          </button>
        </div>
      ) : null}
    </div>
  );
}

interface PropsInterruptor {
  icono: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  etiqueta: string;
  descripcion: string;
  activo: boolean;
  onCambiar: (activo: boolean) => void;
}

function Interruptor({ icono: Icono, etiqueta, descripcion, activo, onCambiar }: PropsInterruptor) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={activo}
      title={descripcion}
      onClick={() => onCambiar(!activo)}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        activo ? "text-texto" : "text-apagado hover:bg-elevado/70",
      )}
    >
      <Icono aria-hidden={true} className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{etiqueta}</span>
      {/* El estado se ve sin depender del color: la pastilla cambia de lado. */}
      <span
        aria-hidden="true"
        className={cn(
          "flex h-4 w-7 shrink-0 items-center rounded-full border px-0.5 transition-colors",
          activo ? "justify-end border-acento bg-acento/20" : "justify-start border-control",
        )}
      >
        <span className={cn("block size-2.5 rounded-full", activo ? "bg-acento" : "bg-control")} />
      </span>
    </button>
  );
}
