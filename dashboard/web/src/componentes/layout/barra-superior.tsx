import { ArrowUpRight, Check, Link2, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { obtenerSalud } from "@/api/cliente";
import { alternarTema, useModoTema } from "@/lib/tema";
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
  const modo = useModoTema();
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) {
      return;
    }
    const temporizador = window.setTimeout(() => setCopiado(false), 1800);
    return () => window.clearTimeout(temporizador);
  }, [copiado]);

  /**
   * La barra de direcciones ya lleva el componente activo y sus filtros (`sincronizarUrl`);
   * esto solo la pone en el portapapeles, para que la vista que el experto está mirando
   * viaje tal cual a otra pestaña, a un compañero o al informe.
   */
  const copiarEnlace = () => {
    const url = window.location.href;
    void navigator.clipboard
      .writeText(url)
      .then(() => setCopiado(true))
      .catch(() => window.prompt("Copie el enlace a esta vista:", url));
  };
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

        <button
          type="button"
          onClick={copiarEnlace}
          aria-live="polite"
          title="Copiar el enlace a esta vista, con sus filtros"
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-sm text-apagado transition-colors hover:bg-elevado hover:text-texto"
        >
          {copiado ? (
            <Check aria-hidden="true" className="size-4 text-senal" />
          ) : (
            <Link2 aria-hidden="true" className="size-4" />
          )}
          <span className="hidden sm:inline">{copiado ? "Enlace copiado" : "Copiar enlace"}</span>
        </button>

        <button
          type="button"
          onClick={alternarTema}
          aria-label={modo === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          title={modo === "oscuro" ? "Modo claro" : "Modo oscuro"}
          className="inline-flex size-7 items-center justify-center rounded-md text-apagado transition-colors hover:bg-elevado hover:text-texto"
        >
          {modo === "oscuro" ? (
            <Sun aria-hidden="true" className="size-4" />
          ) : (
            <Moon aria-hidden="true" className="size-4" />
          )}
        </button>

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
