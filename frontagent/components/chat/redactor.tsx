"use client";

import { SendHorizontal } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";

import { Boton } from "@/components/ui/boton";

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
      <div className="flex items-end gap-2 rounded-md border border-control bg-fondo p-2 focus-within:border-acento focus-within:ring-1 focus-within:ring-acento">
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
          className="barra-fina max-h-40 min-h-16 flex-1 resize-y bg-transparent px-2 py-1 text-base text-texto focus:outline-none disabled:opacity-60"
          onChange={(evento) => setTexto(evento.target.value)}
          onKeyDown={alPresionarTecla}
        />
        <Boton
          type="submit"
          variante="primario"
          tamano="icono"
          disabled={deshabilitado || texto.trim().length === 0}
          aria-label="Enviar consulta"
        >
          <SendHorizontal aria-hidden="true" className="size-4" />
        </Boton>
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
