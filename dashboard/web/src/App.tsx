import { PanelRightOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { calcularComponente, obtenerSalud, visualizar } from "@/api/cliente";
import type {
  CuerpoComponente,
  EspecificacionVisual,
  Filtros,
  IdFenomeno,
  NombreComponente,
  Ref,
  ResultadoComponente,
} from "@/api/tipos";
import { ExploracionManual } from "@/componentes/filtros/exploracion-manual";
import { BarraInstruccion } from "@/componentes/instruccion/barra-instruccion";
import { HistorialInstrucciones } from "@/componentes/instruccion/historial-instrucciones";
import { RespuestaAgente } from "@/componentes/instruccion/respuesta-agente";
import { BarraSuperior, type Modo } from "@/componentes/layout/barra-superior";
import { PanelLateralEvidencia } from "@/componentes/paneles/panel-lateral-evidencia";
import { AvisoError, Cargando, Vacio } from "@/componentes/ui/estados";
import { LienzoComponente } from "@/componentes/vistas/lienzo-componente";
import type { NivelMapa } from "@/componentes/vistas/mapa-colombia";
import { CATALOGO, definicionDe, filtrosPredeterminados } from "@/lib/catalogo";
import { FILTROS_INICIALES, type FiltrosGlobales } from "@/lib/filtros";
import {
  horaActual,
  nuevoId,
  type EntradaHistorial,
} from "@/lib/historial";
import type { Seleccion } from "@/lib/seleccion";
import { fijarVistaTecnica } from "@/lib/vista-tecnica";
import { cn, esAbortada, mensajeDeExcepcion } from "@/lib/utils";

interface Peticion {
  componente: NombreComponente;
  filtros: Filtros;
}

type EstadoVista =
  | { fase: "inactivo" }
  | { fase: "cargando" }
  | { fase: "listo"; resultado: ResultadoComponente }
  | { fase: "error"; mensaje: string };

const PETICION_INICIAL: Peticion = {
  componente: "mapa_colombia",
  filtros: filtrosPredeterminados("mapa_colombia"),
};

/** Claves que no son filtros de un componente, sino del estado global. */
const CLAVES_GLOBALES = new Set(["componente", "fenomeno", "desde", "hasta"]);

function esComponente(valor: string | null): valor is NombreComponente {
  return valor !== null && CATALOGO.some((definicion) => definicion.componente === valor);
}

/**
 * Estado inicial leído de la URL. La consola de chat enlaza aquí con
 * `?componente=…&fenomeno=…` y los filtros de la especificación que propuso el agente; sin
 * esto el enlace abría siempre el mapa por defecto.
 */
function estadoDeLaUrl(): { peticion: Peticion; globales: FiltrosGlobales } | null {
  const parametros = new URLSearchParams(window.location.search);
  const componente = parametros.get("componente");
  if (!esComponente(componente)) {
    return null;
  }
  const filtros: Filtros = filtrosPredeterminados(componente);
  for (const [clave, valor] of parametros.entries()) {
    if (CLAVES_GLOBALES.has(clave) || valor === "") {
      continue;
    }
    const numero = Number(valor);
    filtros[clave] = Number.isFinite(numero) ? numero : valor;
  }
  const fenomeno = Number.parseInt(parametros.get("fenomeno") ?? "", 10);
  return {
    peticion: { componente, filtros },
    globales: {
      fenomeno: fenomeno >= 1 && fenomeno <= 3 ? (fenomeno as IdFenomeno) : null,
      desde: anioValido(parametros.get("desde")) ?? FILTROS_INICIALES.desde,
      hasta: anioValido(parametros.get("hasta")) ?? FILTROS_INICIALES.hasta,
    },
  };
}

/** Normaliza los filtros que propone el agente: solo cadenas y números llegan a la API. */
function sanear(filtros: Record<string, unknown>): Filtros {
  const salida: Filtros = {};
  for (const [clave, valor] of Object.entries(filtros)) {
    if (typeof valor === "string" || typeof valor === "number") {
      salida[clave] = valor;
    }
  }
  return salida;
}

function construirCuerpo(peticion: Peticion, globales: FiltrosGlobales): CuerpoComponente {
  const definicion = definicionDe(peticion.componente);
  const filtros: Filtros = {};
  for (const [clave, valor] of Object.entries(peticion.filtros)) {
    if (valor !== null && valor !== "") {
      filtros[clave] = valor;
    }
  }
  if (definicion.usaAnios) {
    filtros["desde"] = globales.desde;
    filtros["hasta"] = globales.hasta;
  }
  return { componente: peticion.componente, fenomeno: globales.fenomeno, filtros };
}

function claveDe(peticion: Peticion, globales: FiltrosGlobales): string {
  return JSON.stringify(construirCuerpo(peticion, globales));
}

/**
 * Filtros que se reflejan en los controles: los que el agente pidió, corregidos con los que
 * la API dice haber aplicado. Si no coincidieran, los controles mentirían sobre el gráfico.
 */
function filtrosEfectivos(
  especificacion: EspecificacionVisual,
  resultado: ResultadoComponente | null,
): Record<string, unknown> {
  return { ...especificacion.filtros, ...(resultado?.filtros_aplicados ?? {}) };
}

function anioValido(valor: unknown): number | null {
  const numero = typeof valor === "number" ? valor : Number.parseInt(String(valor), 10);
  return Number.isInteger(numero) && numero > 1800 && numero < 2100 ? numero : null;
}

export function App() {
  const inicial = useRef(estadoDeLaUrl());
  const [modo, setModo] = useState<Modo>("instruccion");
  const [globales, setGlobales] = useState<FiltrosGlobales>(
    inicial.current?.globales ?? FILTROS_INICIALES,
  );
  const [peticion, setPeticion] = useState<Peticion>(
    inicial.current?.peticion ?? PETICION_INICIAL,
  );
  const [vista, setVista] = useState<EstadoVista>({ fase: "inactivo" });
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const [idActivo, setIdActivo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [evidenciaVisible, setEvidenciaVisible] = useState(true);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  const claveEjecutada = useRef<string | null>(null);
  const control = useRef<AbortController | null>(null);

  const ejecutar = useCallback((objetivo: Peticion, filtrosGlobales: FiltrosGlobales) => {
    control.current?.abort();
    const controlador = new AbortController();
    control.current = controlador;
    setVista({ fase: "cargando" });
    calcularComponente(construirCuerpo(objetivo, filtrosGlobales), controlador.signal)
      .then((resultado) => {
        if (!controlador.signal.aborted) {
          setVista({ fase: "listo", resultado });
        }
      })
      .catch((error: unknown) => {
        if (!esAbortada(error) && !controlador.signal.aborted) {
          setVista({ fase: "error", mensaje: mensajeDeExcepcion(error) });
        }
      });
  }, []);

  // La vista técnica la decide el contenedor (VISTA_TECNICA) y llega en /api/salud.
  useEffect(() => {
    const control = new AbortController();
    obtenerSalud(control.signal)
      .then((salud) => fijarVistaTecnica(salud.vista_tecnica === true))
      .catch(() => undefined);
    return () => control.abort();
  }, []);

  useEffect(() => {
    const clave = claveDe(peticion, globales);
    if (claveEjecutada.current === clave) {
      return;
    }
    claveEjecutada.current = clave;
    ejecutar(peticion, globales);
  }, [ejecutar, globales, peticion]);

  const entradaActiva = useMemo(
    () => historial.find((entrada) => entrada.id === idActivo) ?? null,
    [historial, idActivo],
  );

  const aplicarEspecificacion = useCallback(
    (
      componente: NombreComponente,
      filtrosCrudos: Record<string, unknown>,
      fenomeno: IdFenomeno | null,
      resultado: ResultadoComponente | null,
    ) => {
      const filtros = sanear(filtrosCrudos);
      const desde = anioValido(filtros["desde"]);
      const hasta = anioValido(filtros["hasta"]);
      const nuevosGlobales: FiltrosGlobales = {
        fenomeno: fenomeno ?? null,
        desde: desde ?? globales.desde,
        hasta: hasta ?? globales.hasta,
      };
      const nuevaPeticion: Peticion = { componente, filtros };
      setSeleccion(null);
      if (resultado) {
        // El agente ya calculó el componente: se muestra sin repetir la petición.
        claveEjecutada.current = claveDe(nuevaPeticion, nuevosGlobales);
        control.current?.abort();
        setVista({ fase: "listo", resultado });
      }
      setGlobales(nuevosGlobales);
      setPeticion(nuevaPeticion);
    },
    [globales.desde, globales.hasta],
  );

  const enviarInstruccion = useCallback(
    (instruccion: string) => {
      const id = nuevoId();
      setEnviando(true);
      setIdActivo(id);
      visualizar(instruccion)
        .then((respuesta) => {
          setHistorial((previo) => [
            { id, instruccion, hora: horaActual(), respuesta, error: null },
            ...previo,
          ]);
          const especificacion = respuesta.especificacion;
          if (especificacion) {
            aplicarEspecificacion(
              especificacion.componente,
              filtrosEfectivos(especificacion, respuesta.resultado),
              especificacion.fenomeno,
              respuesta.resultado,
            );
          }
        })
        .catch((error: unknown) => {
          setHistorial((previo) => [
            {
              id,
              instruccion,
              hora: horaActual(),
              respuesta: null,
              error: mensajeDeExcepcion(error),
            },
            ...previo,
          ]);
        })
        .finally(() => setEnviando(false));
    },
    [aplicarEspecificacion],
  );

  const recuperarDelHistorial = useCallback(
    (id: string) => {
      const entrada = historial.find((e) => e.id === id);
      setIdActivo(id);
      const especificacion = entrada?.respuesta?.especificacion;
      if (entrada && especificacion) {
        aplicarEspecificacion(
          especificacion.componente,
          filtrosEfectivos(especificacion, entrada.respuesta?.resultado ?? null),
          especificacion.fenomeno,
          entrada.respuesta?.resultado ?? null,
        );
      }
    },
    [aplicarEspecificacion, historial],
  );

  /** Enlace de una cita a su referencia: todos los fragmentos de ese documento. */
  const verDocumento = useCallback((docId: string) => {
    setSeleccion(null);
    setPantallaCompleta(false);
    setPeticion({
      componente: "panel_evidencia",
      filtros: { ...filtrosPredeterminados("panel_evidencia"), doc_id: docId },
    });
  }, []);

  const cambiarComponente = useCallback((componente: NombreComponente) => {
    setSeleccion(null);
    setPeticion({ componente, filtros: filtrosPredeterminados(componente) });
  }, []);

  const cambiarNivelColombia = useCallback((nivel: NivelMapa) => {
    setSeleccion(null);
    setPeticion((previa) =>
      previa.componente === "mapa_colombia"
        ? { ...previa, filtros: { ...previa.filtros, nivel } }
        : previa,
    );
  }, []);

  const nivelColombia: NivelMapa =
    peticion.filtros["nivel"] === "municipio" ? "municipio" : "departamento";

  const evidenciaGlobal: readonly Ref[] = vista.fase === "listo" ? vista.resultado.evidencia : [];
  const usaAnios = definicionDe(peticion.componente).usaAnios;

  return (
    <div className="min-h-dvh bg-fondo">
      <BarraSuperior modo={modo} onCambiarModo={setModo} />

      <div
        className={cn(
          "mx-auto grid max-w-[1800px] grid-cols-[minmax(0,1fr)]",
          evidenciaVisible && !pantallaCompleta && "lg:grid-cols-[minmax(0,1fr)_380px]",
        )}
      >
        <main className="flex min-w-0 flex-col gap-4 px-4 py-4">
          {/* En pantalla completa el componente es lo único que se ve. */}
          {pantallaCompleta ? null : modo === "instruccion" ? (
            <BarraInstruccion ocupado={enviando} onEnviar={enviarInstruccion} />
          ) : (
            <ExploracionManual
              componente={peticion.componente}
              filtros={peticion.filtros}
              onCambiarComponente={cambiarComponente}
              onCambiarFiltros={(filtros) => {
                setSeleccion(null);
                setPeticion((previa) => ({ ...previa, filtros }));
              }}
              onRestablecer={() => cambiarComponente(peticion.componente)}
            />
          )}

          {!pantallaCompleta && modo === "instruccion" && enviando ? (
            <Cargando
              mensaje="El orquestador está consultando al agente de visualización…"
              cronometro
            />
          ) : null}

          {!pantallaCompleta && modo === "instruccion" && entradaActiva?.error ? (
            <AvisoError mensaje={entradaActiva.error} />
          ) : null}

          {!pantallaCompleta && modo === "instruccion" && entradaActiva?.respuesta ? (
            <RespuestaAgente respuesta={entradaActiva.respuesta} />
          ) : null}

          {vista.fase === "cargando" ? (
            <Cargando />
          ) : vista.fase === "error" ? (
            <AvisoError
              mensaje={vista.mensaje}
              onReintentar={() => {
                claveEjecutada.current = null;
                ejecutar(peticion, globales);
              }}
            />
          ) : vista.fase === "listo" ? (
            <div
              className={cn("transition-opacity", enviando && "opacity-50")}
              aria-busy={enviando}
            >
              <LienzoComponente
                resultado={vista.resultado}
                seleccion={seleccion}
                onSeleccionar={setSeleccion}
                nivelColombia={nivelColombia}
                onCambiarNivelColombia={cambiarNivelColombia}
                anios={globales}
                usaAnios={usaAnios}
                onCambiarAnios={setGlobales}
                pantallaCompleta={pantallaCompleta}
                onAlternarPantallaCompleta={() => setPantallaCompleta((previa) => !previa)}
              />
            </div>
          ) : (
            <Vacio
              titulo="Sin componente activo"
              detalle="Escriba una instrucción o elija un componente en el modo de exploración."
            />
          )}

          {!pantallaCompleta && modo === "instruccion" ? (
            <HistorialInstrucciones
              entradas={historial}
              idActivo={idActivo}
              onSeleccionar={recuperarDelHistorial}
            />
          ) : null}
        </main>

        {evidenciaVisible && !pantallaCompleta ? (
          <div className="h-[70dvh] border-borde lg:sticky lg:top-[52px] lg:h-[calc(100dvh-52px)] lg:border-l">
            <PanelLateralEvidencia
              seleccion={seleccion}
              evidenciaGlobal={evidenciaGlobal}
              onCerrar={() => setSeleccion(null)}
              onOcultar={() => setEvidenciaVisible(false)}
              onVerDocumento={verDocumento}
            />
          </div>
        ) : !pantallaCompleta ? (
          // Pestaña en el borde: lo único que queda cuando la evidencia está oculta.
          <button
            type="button"
            onClick={() => setEvidenciaVisible(true)}
            className="fixed right-0 top-1/2 z-30 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-l-md border border-r-0 border-borde bg-panel px-2 py-3 text-xs text-apagado [writing-mode:vertical-rl] hover:text-texto"
          >
            <PanelRightOpen aria-hidden="true" className="size-4 rotate-90" />
            Evidencia
          </button>
        ) : null}
      </div>
    </div>
  );
}
