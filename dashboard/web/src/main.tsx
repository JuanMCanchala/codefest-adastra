import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "maplibre-gl/dist/maplibre-gl.css";
import "@/estilos.css";

import { App } from "@/App";

const raiz = document.getElementById("raiz");
if (!raiz) {
  throw new Error("No se encontró el nodo raíz de la aplicación.");
}

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
