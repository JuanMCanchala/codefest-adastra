"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Estado = "consultando" | "en-linea" | "sin-conexion";

interface SaludApi {
  agente?: { alcanzable?: boolean };
}

const ETIQUETAS: Record<Estado, string> = {
  consultando: "Verificando agente",
  "en-linea": "Agente en línea",
  "sin-conexion": "Agente sin conexión",
};

const COLORES: Record<Estado, string> = {
  consultando: "bg-apagado",
  "en-linea": "bg-ok",
  "sin-conexion": "bg-alerta",
};

export function IndicadorAgente() {
  const [estado, setEstado] = useState<Estado>("consultando");

  useEffect(() => {
    let vigente = true;

    const consultar = async () => {
      try {
        const respuesta = await fetch("/api/health", { cache: "no-store" });
        const datos = (await respuesta.json()) as SaludApi;
        if (vigente) {
          setEstado(datos.agente?.alcanzable === true ? "en-linea" : "sin-conexion");
        }
      } catch {
        if (vigente) {
          setEstado("sin-conexion");
        }
      }
    };

    void consultar();
    const intervalo = setInterval(() => {
      void consultar();
    }, 30_000);

    return () => {
      vigente = false;
      clearInterval(intervalo);
    };
  }, []);

  return (
    <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-apagado">
      <span aria-hidden="true" className={cn("size-2 rounded-full", COLORES[estado])} />
      {ETIQUETAS[estado]}
    </p>
  );
}
