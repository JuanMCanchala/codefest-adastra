import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

const variantes = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variante: {
        primario: "bg-acento font-semibold text-fondo hover:bg-acento-claro",
        contorno:
          "border border-control bg-elevado text-texto hover:border-acento/70",
        fantasma: "text-apagado hover:bg-elevado hover:text-texto",
      },
      tamano: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        icono: "size-10",
      },
    },
    defaultVariants: {
      variante: "contorno",
      tamano: "md",
    },
  },
);

export interface PropsBoton
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantes> {
  children?: ReactNode;
}

export function Boton({ className, variante, tamano, ...props }: PropsBoton) {
  return (
    <button
      className={cn(variantes({ variante, tamano }), className)}
      {...props}
    />
  );
}
