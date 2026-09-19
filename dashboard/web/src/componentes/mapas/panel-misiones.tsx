import { ChevronDown, ChevronUp, Moon, Sun } from "lucide-react";

import {
  type ClaveMision,
  type EstadoSatelite,
  ELEVACION_SOLAR_MINIMA,
  MISIONES,
  type Pasada,
  diasDesde,
  epocaMasAntigua,
} from "@/lib/satelites";
import type { EstadoPasadas } from "@/lib/usar-pasadas";
import { cn } from "@/lib/utils";

interface Props {
  abierto: boolean;
  onAlternarAbierto: () => void;
  seleccionadas: readonly ClaveMision[];
  onAlternarMision: (clave: ClaveMision) => void;
  /** Telemetría en vivo del último cuadro dibujado. */
  estados: ReadonlyMap<ClaveMision, EstadoSatelite>;
  pasadas: EstadoPasadas;
  /** Nombre del territorio sobre el que se calculan las pasadas, si hay uno elegido. */
  objetivoEtiqueta: string | null;
}

const RELOJ = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** «en 3 h 12 min» o «hace 2 d 5 h»: la cifra exacta importa menos que el orden de magnitud. */
function relativo(fecha: Date, ahora: Date): string {
  const ms = fecha.getTime() - ahora.getTime();
  const futuro = ms >= 0;
  const minutos = Math.round(Math.abs(ms) / 60_000);
  const dias = Math.floor(minutos / 1_440);
  const horas = Math.floor((minutos % 1_440) / 60);
  const resto = minutos % 60;
  let texto: string;
  if (dias > 0) {
    texto = `${dias} d ${horas} h`;
  } else if (horas > 0) {
    texto = `${horas} h ${resto} min`;
  } else {
    texto = `${resto} min`;
  }
  return futuro ? `en ${texto}` : `hace ${texto}`;
}

function antiguedadEnPalabras(dias: number): string {
  if (dias < 1) return "menos de un día";
  const redondeado = Math.round(dias);
  return redondeado === 1 ? "un día" : `${redondeado} días`;
}

function LineaPasada({
  titulo,
  pasada,
  ahora,
}: {
  titulo: string;
  pasada: Pasada | null;
  ahora: Date;
}) {
  if (!pasada) {
    return (
      <p className="flex justify-between gap-2 text-tenue">
        <span>{titulo}</span>
        <span>fuera de la ventana</span>
      </p>
    );
  }
  const dia = pasada.elevacionSolarGrados >= ELEVACION_SOLAR_MINIMA;
  const Icono = dia ? Sun : Moon;
  return (
    <p className="flex items-center justify-between gap-2">
      <span className="text-tenue">{titulo}</span>
      <span className="flex items-center gap-1.5 font-mono text-texto">
        <Icono
          aria-hidden="true"
          className={cn("size-3", dia ? "text-acento" : "text-control")}
        />
        <span title={`${pasada.cenit.toISOString()} · nadir a ${Math.round(pasada.distanciaKm)} km`}>
          {RELOJ.format(pasada.cenit)}
        </span>
        <span className="text-tenue">· {relativo(pasada.cenit, ahora)}</span>
      </span>
    </p>
  );
}

/**
 * Panel de misiones satelitales: qué plataformas se dibujan, dónde están ahora y cuándo
 * miraron —o volverán a mirar— el territorio elegido.
 *
 * La fecha de la última pasada es la que explica por qué una alerta satelital tiene la fecha
 * que tiene: sin pasada no hay imagen, y sin imagen no hay detección. Por eso el panel dice
 * también la época de los elementos orbitales: una predicción sobre datos viejos se desvía,
 * y el tablero no presenta una extrapolación como si fuera una medición.
 */
export function PanelMisiones({
  abierto,
  onAlternarAbierto,
  seleccionadas,
  onAlternarMision,
  estados,
  pasadas,
  objetivoEtiqueta,
}: Props) {
  const ahora = new Date();
  const epoca = epocaMasAntigua();
  const antiguedad = epoca ? diasDesde(epoca, ahora) : null;

  return (
    <section
      aria-label="Misiones satelitales"
      className="pointer-events-auto absolute bottom-8 right-3 hidden w-[19rem] flex-col overflow-hidden rounded-md border border-borde bg-panel/95 sm:flex"
      style={{ maxHeight: "calc(100% - 16.5rem)" }}
    >
      <button
        type="button"
        onClick={onAlternarAbierto}
        aria-expanded={abierto}
        className="flex items-center justify-between gap-2 border-b border-borde px-2.5 py-1.5 text-left text-xs font-medium text-texto hover:bg-elevado"
      >
        <span>
          Misiones satelitales
          <span className="ml-1.5 font-mono text-tenue">{seleccionadas.length}</span>
        </span>
        {abierto ? (
          <ChevronDown aria-hidden="true" className="size-3.5 text-apagado" />
        ) : (
          <ChevronUp aria-hidden="true" className="size-3.5 text-apagado" />
        )}
      </button>

      {abierto ? (
        <div className="barra-fina overflow-y-auto">
          <p className="border-b border-borde px-2.5 py-1.5 text-xs text-apagado">
            {objetivoEtiqueta ? (
              <>
                Pasadas sobre <span className="text-texto">{objetivoEtiqueta}</span>
                {pasadas.calculando ? <span className="text-tenue"> · calculando…</span> : null}
              </>
            ) : (
              "Elija un territorio en el mapa para ver cuándo lo mira cada satélite."
            )}
          </p>

          <ul>
            {MISIONES.map((mision) => {
              const activa = seleccionadas.includes(mision.clave);
              const estado = estados.get(mision.clave);
              const pasada = pasadas.porMision.get(mision.clave);
              return (
                <li key={mision.clave} className="border-b border-borde/60 last:border-b-0">
                  <button
                    type="button"
                    aria-pressed={activa}
                    onClick={() => onAlternarMision(mision.clave)}
                    title={mision.aporte}
                    className={cn(
                      "flex w-full items-start gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-elevado",
                      activa ? "bg-elevado/60" : "",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1 size-2.5 flex-none rounded-full border"
                      style={{
                        background: activa ? mision.color : "transparent",
                        borderColor: mision.color,
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-xs font-medium text-texto">
                          {mision.nombre}
                        </span>
                        <span className="flex-none font-mono text-xs text-tenue">
                          {activa && estado
                            ? `${Math.round(estado.alturaKm)} km · ${estado.velocidadKms.toFixed(1)} km/s`
                            : mision.familia.split(" · ")[1]}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-apagado">
                        {mision.sensor} · franja {mision.franjaKm} km
                      </span>
                    </span>
                  </button>

                  {activa && objetivoEtiqueta ? (
                    <div className="space-y-0.5 px-2.5 pb-1.5 pl-[1.4rem] text-xs">
                      {pasada ? (
                        <>
                          <LineaPasada titulo="Última" pasada={pasada.anterior} ahora={ahora} />
                          <LineaPasada titulo="Próxima" pasada={pasada.proxima} ahora={ahora} />
                        </>
                      ) : (
                        <p className="text-tenue">calculando…</p>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <p className="border-t border-borde px-2.5 py-1.5 text-xs text-tenue">
            Órbitas propagadas con SGP4 en el navegador, sin conexión. Elementos de Celestrak
            {antiguedad === null ? "." : ` con ${antiguedadEnPalabras(antiguedad)} de antigüedad.`}
            {antiguedad !== null && antiguedad > 14
              ? " A esta edad la traza ya se desvía: conviene regenerarlos."
              : ""}
          </p>
        </div>
      ) : null}
    </section>
  );
}
