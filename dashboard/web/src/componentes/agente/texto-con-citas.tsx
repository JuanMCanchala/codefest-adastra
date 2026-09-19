import type { Cita } from "@/api/tipos";
import { cn } from "@/lib/utils";

interface Props {
  texto: string;
  citas: readonly Cita[];
  /** Qué hacer al pulsar una referencia; sin esto las marcas se muestran como texto. */
  onCita?: ((cita: Cita) => void) | undefined;
  /** La cita que está abierta, para marcarla. */
  activa?: Cita | null | undefined;
  className?: string;
}

/** Marcas `[1]`, `[2, 3]` o `[4,5]` tal y como las escribe el redactor del agente. */
const MARCA = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

/**
 * La respuesta del agente con sus referencias `[n]` convertidas en botones.
 *
 * Cada número lleva a un `doc_id`/`chunk_id` concreto: pulsarlo abre ese fragmento en el
 * panel de evidencia, que es la única forma honesta de decir «de dónde sale esto». Una marca
 * cuyo número no está entre las citas se deja como texto: no se inventa un enlace.
 */
export function TextoConCitas({ texto, citas, onCita, activa, className }: Props) {
  const porNumero = new Map(citas.map((cita) => [cita.n, cita]));
  const partes: React.ReactNode[] = [];
  let ultimo = 0;
  let clave = 0;
  for (const coincidencia of texto.matchAll(MARCA)) {
    const inicio = coincidencia.index ?? 0;
    if (inicio > ultimo) {
      partes.push(texto.slice(ultimo, inicio));
    }
    const numeros = (coincidencia[1] ?? "")
      .split(",")
      .map((n) => Number.parseInt(n.trim(), 10))
      .filter((n) => Number.isInteger(n));
    const enlazables = numeros.filter((n) => porNumero.has(n));
    if (enlazables.length === 0 || !onCita) {
      partes.push(coincidencia[0]);
    } else {
      partes.push(
        <span key={`cita-${String(clave)}`} className="whitespace-nowrap">
          [
          {numeros.map((n, i) => {
            const cita = porNumero.get(n);
            const separador = i < numeros.length - 1 ? ", " : "";
            if (!cita) {
              return (
                <span key={n}>
                  {n}
                  {separador}
                </span>
              );
            }
            const esActiva = activa?.n === n && activa.chunk_id === cita.chunk_id;
            return (
              <span key={n}>
                <button
                  type="button"
                  onClick={() => onCita(cita)}
                  title={`Ver el fragmento ${String(cita.chunk_id)} de ${cita.doc_id}`}
                  aria-label={`Referencia ${String(n)}: ${cita.doc_id}, fragmento ${String(cita.chunk_id)}`}
                  className={cn(
                    "rounded-sm px-0.5 font-mono text-[0.85em] text-senal underline decoration-dotted underline-offset-2 transition-colors hover:bg-elevado hover:text-texto",
                    esActiva && "bg-elevado text-texto",
                  )}
                >
                  {n}
                </button>
                {separador}
              </span>
            );
          })}
          ]
        </span>,
      );
      clave += 1;
    }
    ultimo = inicio + coincidencia[0].length;
  }
  if (ultimo < texto.length) {
    partes.push(texto.slice(ultimo));
  }
  return <p className={cn("whitespace-pre-wrap", className)}>{partes}</p>;
}
