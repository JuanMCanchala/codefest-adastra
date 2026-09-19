import { Compass, RotateCcw } from "lucide-react";

import type { Filtros, NombreComponente } from "@/api/tipos";
import { Boton } from "@/componentes/ui/boton";
import { CATALOGO, ETIQUETAS_FAMILIA, definicionDe } from "@/lib/catalogo";
import { cn } from "@/lib/utils";

interface Props {
  componente: NombreComponente;
  filtros: Filtros;
  onCambiarComponente: (componente: NombreComponente) => void;
  onCambiarFiltros: (filtros: Filtros) => void;
  onRestablecer: () => void;
}

/** Modo de exploración manual: selector de componente y sus filtros propios. */
export function ExploracionManual({
  componente,
  filtros,
  onCambiarComponente,
  onCambiarFiltros,
  onRestablecer,
}: Props) {
  const definicion = definicionDe(componente);

  const actualizar = (clave: string, valor: string | number | null) => {
    onCambiarFiltros({ ...filtros, [clave]: valor });
  };

  return (
    <section
      className="rounded-lg border border-borde bg-panel"
      aria-labelledby="titulo-exploracion"
    >
      <h2
        id="titulo-exploracion"
        className="inline-flex items-center gap-2 border-b border-borde px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-apagado"
      >
        <Compass aria-hidden="true" className="size-3.5" />
        Exploración manual
      </h2>

      <div className="grid gap-1.5 px-4 py-3 sm:grid-cols-2">
        {CATALOGO.map((opcion) => {
          const Icono = opcion.icono;
          const activo = opcion.componente === componente;
          return (
            <button
              key={opcion.componente}
              type="button"
              aria-pressed={activo}
              onClick={() => onCambiarComponente(opcion.componente)}
              className={cn(
                "flex items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
                activo
                  ? "border-acento/60 bg-acento/10"
                  : "border-borde bg-elevado hover:border-acento/40",
              )}
            >
              <Icono
                aria-hidden="true"
                className={cn("mt-0.5 size-4 shrink-0", activo ? "text-acento" : "text-apagado")}
              />
              <span className="min-w-0">
                <span className="block text-xs font-medium text-texto">{opcion.etiqueta}</span>
                <span className="block text-[10px] uppercase tracking-wide text-apagado">
                  {ETIQUETAS_FAMILIA[opcion.familia]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {definicion.filtros.length > 0 ? (
        <div className="border-t border-borde px-4 py-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {definicion.filtros.map((filtro) => {
              const id = `filtro-${componente}-${filtro.clave}`;
              const valor = filtros[filtro.clave];
              return (
                <div key={filtro.clave} className="flex flex-col gap-1">
                  <label htmlFor={id} className="text-[10px] uppercase tracking-wide text-apagado">
                    {filtro.etiqueta}
                  </label>
                  {filtro.tipo === "opciones" ? (
                    <select
                      id={id}
                      value={typeof valor === "string" ? valor : ""}
                      onChange={(evento) =>
                        actualizar(filtro.clave, evento.target.value === "" ? null : evento.target.value)
                      }
                      className="h-8 rounded-md border border-borde bg-fondo px-2 text-xs text-texto"
                    >
                      <option value="">Sin filtrar</option>
                      {filtro.opciones?.map((opcion) => (
                        <option key={opcion.valor} value={opcion.valor}>
                          {opcion.etiqueta}
                        </option>
                      ))}
                    </select>
                  ) : filtro.tipo === "numero" ? (
                    <input
                      id={id}
                      type="number"
                      inputMode="numeric"
                      value={typeof valor === "number" ? valor : ""}
                      min={filtro.minimo}
                      max={filtro.maximo}
                      onChange={(evento) => {
                        const numero = Number.parseInt(evento.target.value, 10);
                        actualizar(filtro.clave, Number.isNaN(numero) ? null : numero);
                      }}
                      className="h-8 rounded-md border border-borde bg-fondo px-2 font-mono text-xs text-texto"
                    />
                  ) : (
                    <input
                      id={id}
                      type="text"
                      value={typeof valor === "string" ? valor : ""}
                      placeholder={filtro.ayuda ?? "Sin filtrar"}
                      autoComplete="off"
                      onChange={(evento) =>
                        actualizar(filtro.clave, evento.target.value === "" ? null : evento.target.value)
                      }
                      className="h-8 rounded-md border border-borde bg-fondo px-2 text-xs text-texto placeholder:text-apagado/70"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <Boton tamano="sm" className="mt-3" onClick={onRestablecer}>
            <RotateCcw aria-hidden="true" className="size-3.5" />
            Restablecer filtros
          </Boton>
        </div>
      ) : null}
    </section>
  );
}
