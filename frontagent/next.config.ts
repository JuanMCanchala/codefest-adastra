import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // El indicador flotante de desarrollo tapa el pie del redactor en las capturas.
  devIndicators: false,
};

export default nextConfig;
