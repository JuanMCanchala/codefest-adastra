"use client";

import { ArrowUp } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";


const MAX_CARACTERES = 4000;

interface Props {
  deshabilitado: boolean;
  onEnviar: (pregunta: string) => void;
}

export function Redactor({ deshabilitado, onEnviar }: Props) {
  const [texto, setTexto] = useState("");

  const enviar = () => {
    const limpio = texto.trim();
    if (limpio.length === 0 || deshabilitado) {
      return;
    }
    onEnviar(limpio);
    setTexto("");
  };

  const alEnviarFormulario = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    enviar();
  };

  const alPresionarTecla = (evento: KeyboardEvent<HTMLTextAreaElement>) => {
    if (evento.key === "Enter" && !evento.shiftKey) {
      evento.preventDefault();
      enviar();
    }
  };

  return (
    <form
      className="border-t border-borde bg-panel px-4 py-3"
      onSubmit={alEnviarFormulario}
    >
      <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-end gap-2 rounded-xl border border-borde bg-fondo py-2 pl-3 pr-2 focus-within:border-control">
        <label className="sr-only" htmlFor="pregunta">
          Escriba su consulta
        </label>
        <textarea
          id="pregunta"
          name="pregunta"
          rows={2}
          maxLength={MAX_CARACTERES}
          value={texto}
          disabled={deshabilitado}
          placeholder="Pregunte sobre IA estratégica, entorno espacial o dinámicas territoriales…"
          className="barra-fina max-h-40 min-h-12 flex-1 resize-y bg-transparent py-1 text-sm text-texto focus:outline-none disabled:opacity-60"
          onChange={(evento) => setTexto(evento.target.value)}
          onKeyDown={alPresionarTecla}
        />
        <button
          type="submit"
          disabled={deshabilitado || texto.trim().length === 0}
          aria-label="Enviar consulta"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-acento text-fondo transition-colors hover:bg-acento-claro disabled:pointer-events-none disabled:opacity-30"
        >
          <ArrowUp aria-hidden="true" className="size-4" />
        </button>
      </div>
      <p className="mt-2 flex justify-between gap-4 text-xs text-tenue">
        <span>Enter envía · Shift + Enter salto de línea</span>
        <span>
          {texto.length} / {MAX_CARACTERES}
        </span>
      </p>
      </div>
    </form>
  );
}
