import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface PropsTarjeta extends HTMLAttributes<HTMLElement> {
  /** `section` cuando la tarjeta es una zona con título propio (landmark con nombre). */
  como?: "div" | "section";
}

export function Tarjeta({ className, como: Como = "div", ...props }: PropsTarjeta) {
  return (
    <Como
      className={cn(
        "rounded-md border border-borde bg-panel",
        className,
      )}
      {...props}
    />
  );
}

export function TarjetaEncabezado({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start gap-3 px-4 pt-4", className)} {...props} />;
}

export function TarjetaTitulo({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold", className)} {...props} />;
}

export function TarjetaCuerpo({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pb-4 pt-3 text-sm", className)} {...props} />;
}
