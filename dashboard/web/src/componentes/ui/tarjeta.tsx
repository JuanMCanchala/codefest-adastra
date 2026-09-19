import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Tarjeta({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-borde bg-panel shadow-sm shadow-black/40",
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
  return <h3 className={cn("text-sm font-semibold tracking-tight", className)} {...props} />;
}

export function TarjetaCuerpo({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pb-4 pt-3 text-sm", className)} {...props} />;
}
