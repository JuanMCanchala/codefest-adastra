import { PanelLeftOpen } from "lucide-react";
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
import { BurbujaAgente } from "@/componentes/agente/burbuja-agente";
import { BarraSuperior } from "@/componentes/layout/barra-superior";
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

  return (
    // El armazón ocupa la ventana: el lienzo llena lo que queda y hace su propio scroll,
    // en vez de empujar la página hacia abajo. Por debajo de `lg` vuelve al flujo normal,
    // donde el panel de evidencia se apila detrás del componente.
    <div className="flex min-h-dvh flex-col bg-fondo lg:h-dvh lg:overflow-hidden">
      <BarraSuperior />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
              className={cn(
                "flex min-h-0 flex-1 flex-col transition-opacity",
                enviando && "opacity-60",
              )}
              aria-busy={enviando}
            >
              <LienzoComponente
                resultado={vista.resultado}
                seleccion={seleccion}
                onSeleccionar={setSeleccion}
                nivelColombia={nivelColombia}
                onCambiarNivelColombia={cambiarNivelColombia}
                pantallaCompleta={pantallaCompleta}
                onAlternarPantallaCompleta={() => setPantallaCompleta((previa) => !previa)}
              />
            </div>
          ) : (
            <Vacio
              titulo="Sin componente activo"
              detalle="Pida lo que quiere ver al agente o elija un componente en «Ajustar»."
            />
          )}
        </main>

        {evidenciaVisible && !pantallaCompleta ? (
          // En móvil la evidencia se apila detrás del componente con su propio alto y su
          // propio scroll: sin tope, la página crecía hasta decenas de miles de píxeles.
          <div className="h-[70dvh] min-h-0 overflow-hidden border-borde lg:h-auto lg:w-[380px] lg:shrink-0 lg:border-l">
            <PanelLateralEvidencia
              seleccion={seleccion}
              evidenciaGlobal={evidenciaGlobal}
              onCerrar={() => setSeleccion(null)}
              onOcultar={() => setEvidenciaVisible(false)}
              onVerDocumento={verDocumento}
            />
          </div>
        ) : !pantallaCompleta ? (
          // Pestaña en el borde: lo único que queda cuando la evidencia está oculta. Solo
          // icono, porque el texto en vertical se leía peor que el propio símbolo; el
          // nombre viaja en `aria-label` y en el título, que es lo que lee todo el mundo.
          <button
            type="button"
            onClick={() => setEvidenciaVisible(true)}
            aria-label="Evidencia"
            title="Mostrar la evidencia"
            className="fixed right-0 top-1/2 z-30 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 border-borde bg-panel text-apagado shadow-[0_8px_24px_rgb(0_0_0/0.45)] transition-colors hover:bg-elevado hover:text-texto"
          >
            <PanelLeftOpen aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>

      <BurbujaAgente
        ocupado={enviando}
        onEnviar={enviarInstruccion}
        respuesta={entradaActiva?.respuesta ?? null}
        error={entradaActiva?.error ?? null}
        historial={historial}
        idActivo={idActivo}
        onRecuperar={recuperarDelHistorial}
        resultado={vista.fase === "listo" ? vista.resultado : null}
        seleccion={seleccion}
        onSeleccionar={setSeleccion}
        nivelColombia={nivelColombia}
        onCambiarNivelColombia={cambiarNivelColombia}
      />
    </div>
  );
}
