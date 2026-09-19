import { ArrowUpRight } from "lucide-react";

import { obtenerSalud } from "@/api/cliente";
import { useRecurso } from "@/lib/usar-recurso";

/**
 * Encabezado: marca y salida hacia la consola de chat.
 *
 * No lleva selector de modo (preguntar y ajustar viven en la ventana del agente) ni
 * anuncio del corpus: mientras la API responde, el dato ya está en la vista. El estado
 * solo aparece cuando falla, que es cuando dice algo.
 */
export function BarraSuperior() {
  const salud = useRecurso("salud", (senal) => obtenerSalud(senal));
  const urlConsola = salud.fase === "listo" ? (salud.dato.consola_url ?? null) : null;

  return (
    <header className="flex shrink-0 items-center gap-4 border-b border-borde bg-panel px-4 py-2.5">
      <h1 className="min-w-0 truncate text-sm font-semibold tracking-[-0.01em]">
        AeroCode
        <span aria-hidden="true" className="mx-2 text-tenue">
          /
        </span>
        <span className="font-normal text-apagado">Analítica visual</span>
      </h1>

      <div className="ml-auto flex items-center gap-3">
        {salud.fase === "error" ? (
          <p className="inline-flex items-center gap-2 text-sm text-alerta" role="status">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-alerta" />
            Corpus no disponible
          </p>
        ) : null}

        {urlConsola ? (
          <a
            href={urlConsola}
            className="inline-flex items-center gap-1.5 text-sm text-apagado transition-colors hover:text-texto"
          >
            Consola de chat
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
        ) : null}
      </div>
    </header>
  );
}
