"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Vista técnica: la decide el despliegue, no el navegador.
 *
 * La consola que revisa el jurado va limpia; la del equipo se enciende con `VISTA_TECNICA=1`
 * en el contenedor y la página la lee en cada petición. El consumo de tokens, los modelos, la
 * ruta interna del orquestador y los parámetros de las herramientas no le sirven a quien
 * evalúa y compiten con la evidencia.
 *
 * Es un contexto sin estado ni efectos: el valor llega del servidor, así que el HTML y la
 * hidratación coinciden siempre.
 */

const Contexto = createContext(false);

export function ProveedorVistaTecnica({
  valor,
  children,
}: {
  valor: boolean;
  children: ReactNode;
}) {
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** `true` cuando el despliegue pidió ver los detalles internos del sistema. */
export function useVistaTecnica(): boolean {
  return useContext(Contexto);
}
