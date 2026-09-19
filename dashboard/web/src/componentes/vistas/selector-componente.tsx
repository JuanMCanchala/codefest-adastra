import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { NombreComponente } from "@/api/tipos";
import { CATALOGO, ETIQUETAS_FAMILIA, definicionDe } from "@/lib/catalogo";
import { cn } from "@/lib/utils";

interface Props {
  componente: NombreComponente;
  /** Título que devolvió la API: más concreto que la etiqueta del catálogo. */
  titulo: string;
  onCambiar: (componente: NombreComponente) => void;
}

/**
 * El catálogo completo, a un clic del título.
 *
 * Preguntar al agente sigue siendo el camino principal, pero quien revisa el sistema
 * necesita poder recorrer las ocho vistas sin saber qué pedir. Vive dentro del título en
 * vez de en una cuadrícula fija: el mismo sitio donde se lee qué se está viendo es el
 * sitio donde se cambia, y no gasta una tira de pantalla en todo momento.
 */
export function SelectorComponente({ componente, titulo, onCambiar }: Props) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement | null>(null);
  const definicion = definicionDe(componente);
  const Icono = definicion.icono;

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

  return (
    <div ref={contenedor} className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-expanded={abierto}
        aria-haspopup="menu"
        onClick={() => setAbierto((previo) => !previo)}
        title="Cambiar de componente"
        className="group flex w-full min-w-0 items-center gap-2 rounded-md py-0.5 text-left transition-colors hover:bg-elevado"
      >
        <Icono aria-hidden="true" className="size-4 shrink-0 text-apagado" />
        <span className="min-w-0 truncate text-base font-semibold">
          {titulo || definicion.etiqueta}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-tenue transition-transform group-hover:text-apagado",
            abierto && "rotate-180",
          )}
        />
      </button>

      {abierto ? (
        <div
          role="menu"
          aria-label="Componentes del catálogo"
          className="absolute left-0 top-full z-40 mt-1.5 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-borde bg-panel p-1 shadow-[0_8px_24px_rgb(0_0_0/0.45)]"
        >
          {CATALOGO.map((opcion) => {
            const IconoOpcion = opcion.icono;
            const activo = opcion.componente === componente;
            return (
              <button
                key={opcion.componente}
                type="button"
                role="menuitemradio"
                aria-checked={activo}
                onClick={() => {
                  setAbierto(false);
                  if (!activo) {
                    onCambiar(opcion.componente);
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                  activo ? "bg-elevado" : "hover:bg-elevado/70",
                )}
              >
                <IconoOpcion
                  aria-hidden="true"
                  className={cn("size-4 shrink-0", activo ? "text-texto" : "text-apagado")}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-texto">{opcion.etiqueta}</span>
                  <span className="block truncate text-xs text-tenue">
                    {ETIQUETAS_FAMILIA[opcion.familia]}
                  </span>
                </span>
                {activo ? (
                  <Check aria-hidden="true" className="size-4 shrink-0 text-texto" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
