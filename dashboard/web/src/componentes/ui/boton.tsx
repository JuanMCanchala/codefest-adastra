import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

const VARIANTES = {
  primario: "bg-acento font-semibold text-fondo hover:bg-acento-claro",
  contorno: "border border-control bg-elevado text-texto hover:border-acento/70",
  fantasma: "text-apagado hover:bg-elevado hover:text-texto",
  activo: "border border-acento bg-acento/10 text-texto",
} as const;

const TAMANOS = {
  sm: "h-8 px-3",
  md: "h-10 px-4",
  icono: "size-10",
} as const;

export interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: keyof typeof VARIANTES;
  tamano?: keyof typeof TAMANOS;
}

export function Boton({
  className,
  variante = "contorno",
  tamano = "md",
  type = "button",
  ...props
}: PropsBoton) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTES[variante], TAMANOS[tamano], className)}
      {...props}
    />
  );
}
