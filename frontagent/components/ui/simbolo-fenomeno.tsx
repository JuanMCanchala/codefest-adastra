import type { Fenomeno } from "@/lib/fenomenos";
import { cn } from "@/lib/utils";

/** Marcador del fenómeno: color y forma (círculo, triángulo o rombo), igual que en el tablero. */
export function SimboloFenomeno({
  fenomeno,
  className,
}: {
  fenomeno: Pick<Fenomeno, "simbolo" | "texto">;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={cn("size-3 shrink-0 fill-current", fenomeno.texto, className)}
    >
      {fenomeno.simbolo === "circle" ? <circle cx="6" cy="6" r="5" /> : null}
      {fenomeno.simbolo === "triangle" ? <path d="M6 1 11 10.5H1Z" /> : null}
      {fenomeno.simbolo === "diamond" ? <path d="M6 .5 11.5 6 6 11.5.5 6Z" /> : null}
    </svg>
  );
}
