import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Insignia({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border border-borde bg-elevado px-2 py-0.5 font-mono text-xs text-apagado",
        className,
      )}
      {...props}
    />
  );
}
