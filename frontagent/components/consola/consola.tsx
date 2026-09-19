"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  BurbujaError,
  BurbujaUsuario,
  EstadoPensando,
} from "@/components/chat/burbujas";
import { PanelSugerencias } from "@/components/chat/panel-sugerencias";
import { Redactor } from "@/components/chat/redactor";
import { RespuestaAgente as VistaRespuesta } from "@/components/chat/respuesta-agente";
import { BarraSuperior } from "@/components/layout/barra-superior";
import { PanelLateral, type Pestana } from "@/components/paneles/panel-lateral";
import { consultarAgente } from "@/lib/cliente";
import type { Mensaje, MensajeAgente, SeleccionEvidencia } from "@/lib/tipos";
import { cn } from "@/lib/utils";

/** En pantallas estrechas se alterna entre la conversación y el panel de inspección. */
type VistaMovil = "conversacion" | "inspeccion";

let contador = 0;
function nuevoId(prefijo: string): string {
  contador += 1;
  return `${prefijo}-${contador}`;
}

function mensajeAgentePorId(
  mensajes: Mensaje[],
  id: string | null,
): MensajeAgente | null {
  if (id === null) {
    return null;
  }
  const encontrado = mensajes.find(
    (mensaje): mensaje is MensajeAgente =>
      mensaje.rol === "agente" && mensaje.id === id,
  );
  return encontrado ?? null;
}

export function Consola({ urlTablero }: { urlTablero: string | null }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [seleccion, setSeleccion] = useState<SeleccionEvidencia | null>(null);
  const [idInspeccionado, setIdInspeccionado] = useState<string | null>(null);
  const [pestana, setPestana] = useState<Pestana>("evidencia");
  const [vistaMovil, setVistaMovil] = useState<VistaMovil>("conversacion");
  const finHilo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // En el estado inicial no hay hilo que seguir: se deja visible el encabezado de sugerencias.
    if (mensajes.length === 0 && !cargando) {
      return;
    }
    finHilo.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, cargando]);

  const enviar = useCallback(async (pregunta: string) => {
    const idUsuario = nuevoId("usuario");
    setMensajes((previos) => [
      ...previos,
      { id: idUsuario, rol: "usuario", texto: pregunta },
    ]);
    setCargando(true);

    const resultado = await consultarAgente(pregunta);

    if (resultado.ok) {
      const id = nuevoId("agente");
      setMensajes((previos) => [
        ...previos,
        { id, rol: "agente", datos: resultado.datos },
      ]);
      setIdInspeccionado(id);
      setSeleccion(null);
    } else {
      setMensajes((previos) => [
        ...previos,
        {
          id: nuevoId("error"),
          rol: "error",
          texto: resultado.error,
          ...(resultado.detalle === undefined
            ? {}
            : { detalle: resultado.detalle }),
        },
      ]);
    }
    setCargando(false);
  }, []);

  const seleccionarCita = useCallback((idMensaje: string, n: number) => {
    setIdInspeccionado(idMensaje);
    setSeleccion({ idMensaje, n });
    setPestana("evidencia");
    setVistaMovil("inspeccion");
  }, []);

  const previsualizarCita = useCallback(
    (idMensaje: string, n: number | null) => {
      if (n === null) {
        return;
      }
      setIdInspeccionado(idMensaje);
      setSeleccion({ idMensaje, n });
      setPestana("evidencia");
    },
    [],
  );

  const verTraza = useCallback((idMensaje: string) => {
    setIdInspeccionado(idMensaje);
    setPestana("traza");
    setVistaMovil("inspeccion");
  }, []);

  const inspeccionado = mensajeAgentePorId(mensajes, idInspeccionado);
  const nActivaDelPanel =
    seleccion !== null && seleccion.idMensaje === idInspeccionado
      ? seleccion.n
      : null;

  return (
    <div className="flex h-dvh flex-col">
      <BarraSuperior urlTablero={urlTablero} />

      <div
        role="group"
        aria-label="Vista"
        className="grid grid-cols-2 gap-1 border-b border-borde bg-panel p-1.5 lg:hidden"
      >
        {(
          [
            ["conversacion", "Conversación"],
            ["inspeccion", "Evidencia y traza"],
          ] as const
        ).map(([clave, etiqueta]) => (
          <button
            key={clave}
            type="button"
            aria-pressed={vistaMovil === clave}
            onClick={() => setVistaMovil(clave)}
            className={cn(
              "h-10 rounded-md text-sm font-medium transition-colors",
              vistaMovil === clave
                ? "bg-acento/15 text-texto ring-1 ring-acento/60"
                : "text-apagado hover:text-texto",
            )}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main
          className={cn(
            "min-h-0 flex-1 flex-col",
            vistaMovil === "conversacion" ? "flex" : "hidden lg:flex",
          )}
        >
          <div className="barra-fina min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6">
              {mensajes.length === 0 ? (
                <PanelSugerencias
                  deshabilitado={cargando}
                  onElegir={(pregunta) => void enviar(pregunta)}
                />
              ) : null}

              {mensajes.map((mensaje) => {
                if (mensaje.rol === "usuario") {
                  return (
                    <BurbujaUsuario key={mensaje.id} texto={mensaje.texto} />
                  );
                }
                if (mensaje.rol === "error") {
                  return (
                    <BurbujaError
                      key={mensaje.id}
                      texto={mensaje.texto}
                      {...(mensaje.detalle === undefined
                        ? {}
                        : { detalle: mensaje.detalle })}
                    />
                  );
                }
                return (
                  <VistaRespuesta
                    key={mensaje.id}
                    mensaje={mensaje}
                    urlTablero={urlTablero}
                    nActiva={
                      seleccion !== null && seleccion.idMensaje === mensaje.id
                        ? seleccion.n
                        : null
                    }
                    onPrevisualizar={previsualizarCita}
                    onSeleccionar={seleccionarCita}
                    onVerTraza={verTraza}
                  />
                );
              })}

              {cargando ? <EstadoPensando /> : null}
              <div ref={finHilo} />
            </div>
          </div>

          <Redactor
            deshabilitado={cargando}
            onEnviar={(pregunta) => void enviar(pregunta)}
          />
        </main>

        <PanelLateral
          visibleEnMovil={vistaMovil === "inspeccion"}
          datos={inspeccionado?.datos ?? null}
          nActiva={nActivaDelPanel}
          pestana={pestana}
          onCambiarPestana={setPestana}
          onSeleccionar={(n) => {
            if (idInspeccionado !== null) {
              setSeleccion({ idMensaje: idInspeccionado, n });
            }
          }}
        />
      </div>
    </div>
  );
}
