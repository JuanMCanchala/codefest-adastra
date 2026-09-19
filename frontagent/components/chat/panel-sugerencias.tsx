"use client";

import { Sparkles } from "lucide-react";

/**
 * Estado inicial de la conversación.
 *
 * Es el mismo de la ventana del agente en el tablero: un avatar, una pregunta y una
 * línea. Antes era una rejilla con los tres fenómenos y seis consultas preparadas, que
 * llenaba la pantalla de texto antes de que nadie hubiera preguntado nada.
 */
export function PanelSugerencias() {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full border border-borde bg-elevado text-apagado">
        <Sparkles aria-hidden="true" className="size-5" />
      </span>
      <h2 className="text-base font-semibold text-texto">¿Qué necesita verificar?</h2>
      <p className="max-w-[34ch] text-sm leading-relaxed text-apagado">
        Pregunte sobre IA estratégica, seguridad del entorno espacial o dinámicas
        territoriales. Cada afirmación vendrá con su cita al fragmento del corpus.
      </p>
    </div>
  );
}
