import type { Metadata } from "next";

import { GUION_TEMA } from "@/lib/tema";

import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consola de inteligencia · AeroCode",
  description:
    "Asistente conversacional multiagente sobre IA y capacidades estratégicas, seguridad del entorno espacial y dinámicas territoriales.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-tema="oscuro" suppressHydrationWarning>
      <head>
        {/* Antes de pintar: sin esto la página saltaría de oscuro a claro al cargar. */}
        <script dangerouslySetInnerHTML={{ __html: GUION_TEMA }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
