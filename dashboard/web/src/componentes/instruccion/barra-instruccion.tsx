import { CornerDownLeft, Loader2, Terminal } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Ayuda } from "@/componentes/ui/ayuda";
import { Boton } from "@/componentes/ui/boton";

const SUGERENCIAS: readonly string[] = [
  "Muéstrame las alertas tempranas por departamento con minería ilegal desde 2020",
  "¿Cómo evolucionan los documentos de seguridad espacial por año?",
  "Cruza las entidades más mencionadas con las organizaciones que las publican",
  "¿Qué países concentran las menciones en el fenómeno de IA militar?",
  "Red de entidades alrededor del ELN",
  "Prioriza departamentos por conteo de alertas con corte en 2022",
];

interface Props {
  ocupado: boolean;
  onEnviar: (instruccion: string) => void;
}

/** Barra protagonista: una instrucción en lenguaje natural decide qué se visualiza. */
export function BarraInstruccion({ ocupado, onEnviar }: Props) {
  const [texto, setTexto] = useState("");

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const limpio = texto.trim();
    if (limpio.length === 0 || ocupado) {
      return;
    }
    onEnviar(limpio);
    setTexto("");
  };

  return (
    <section
      className="rounded-md border border-borde bg-panel px-4 py-4"
      aria-labelledby="titulo-instruccion"
    >
      <div className="flex items-center gap-2">
        <h2
          id="titulo-instruccion"
          className="inline-flex items-center gap-2 text-base font-semibold text-texto"
        >
          <Terminal aria-hidden="true" className="size-4 text-apagado" />
          ¿Qué quiere ver?
        </h2>
        <Ayuda titulo="Cómo funciona">
          Escríbalo en lenguaje natural. El agente de visualización elige un componente del
          catálogo, justifica la elección y el tablero lo renderiza con sus filtros.
        </Ayuda>
      </div>

      <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={enviar}>
        <label className="sr-only" htmlFor="campo-instruccion">
          Instrucción en lenguaje natural
        </label>
        <input
          id="campo-instruccion"
          type="text"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          disabled={ocupado}
          autoComplete="off"
          placeholder="Ej.: alertas tempranas por municipio con minería ilegal entre 2020 y 2026"
          className="h-11 min-w-0 flex-1 rounded-md border border-control bg-fondo px-3 text-base text-texto disabled:opacity-60"
        />
        <Boton
          type="submit"
          variante="primario"
          className="h-11 px-5"
          disabled={ocupado || texto.trim().length === 0}
        >
          {ocupado ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <CornerDownLeft aria-hidden="true" className="size-4" />
          )}
          {ocupado ? "Analizando…" : "Visualizar"}
        </Boton>
      </form>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.06em] text-apagado">
        Ejemplos
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {SUGERENCIAS.map((sugerencia) => (
          <li key={sugerencia}>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => onEnviar(sugerencia)}
              className="inline-flex min-h-8 items-center rounded-md border border-control/60 bg-elevado px-2.5 py-1 text-left text-[13px] text-texto transition-colors hover:border-acento/70 disabled:opacity-50"
            >
              {sugerencia}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
