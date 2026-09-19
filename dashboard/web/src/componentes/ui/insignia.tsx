import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Insignia({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-borde bg-elevado px-1.5 py-0.5 font-mono text-[10px] text-apagado",
        className,
      )}
      {...props}
    />
  );
}
