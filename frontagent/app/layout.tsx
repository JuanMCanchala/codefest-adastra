import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Consola de Inteligencia · CODEFEST AD ASTRA 2026",
  description:
    "Asistente conversacional multiagente sobre IA y capacidades estratégicas, seguridad del entorno espacial y dinámicas territoriales.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
