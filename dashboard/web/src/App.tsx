import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { calcularComponente, visualizar } from "@/api/cliente";
import type {
  CuerpoComponente,
  Filtros,
  IdFenomeno,
  NombreComponente,
  Ref,
  ResultadoComponente,
} from "@/api/tipos";
import {
  ControlesFiltrosGlobales,
} from "@/componentes/filtros/filtros-globales";
import { ExploracionManual } from "@/componentes/filtros/exploracion-manual";
import { BarraInstruccion } from "@/componentes/instruccion/barra-instruccion";
import { HistorialInstrucciones } from "@/componentes/instruccion/historial-instrucciones";
import { RespuestaAgente } from "@/componentes/instruccion/respuesta-agente";
import { BarraSuperior, type Modo } from "@/componentes/layout/barra-superior";
import { PanelLateralEvidencia } from "@/componentes/paneles/panel-lateral-evidencia";
import { AvisoError, Cargando, Vacio } from "@/componentes/ui/estados";
import { LienzoComponente } from "@/componentes/vistas/lienzo-componente";
import type { NivelMapa } from "@/componentes/vistas/mapa-colombia";
import { definicionDe, filtrosPredeterminados } from "@/lib/catalogo";
import { FILTROS_INICIALES, type FiltrosGlobales } from "@/lib/filtros";
import {
  horaActual,
  nuevoId,
  type EntradaHistorial,
} from "@/lib/historial";
import type { Seleccion } from "@/lib/seleccion";
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

function anioValido(valor: unknown): number | null {
  const numero = typeof valor === "number" ? valor : Number.parseInt(String(valor), 10);
  return Number.isInteger(numero) && numero > 1800 && numero < 2100 ? numero : null;
}

export function App() {
  const [modo, setModo] = useState<Modo>("instruccion");
  const [globales, setGlobales] = useState<FiltrosGlobales>(FILTROS_INICIALES);
  const [peticion, setPeticion] = useState<Peticion>(PETICION_INICIAL);
  const [vista, setVista] = useState<EstadoVista>({ fase: "inactivo" });
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const [idActivo, setIdActivo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

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
              especificacion.filtros,
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
          especificacion.filtros,
          especificacion.fenomeno,
          entrada.respuesta?.resultado ?? null,
        );
      }
    },
    [aplicarEspecificacion, historial],
  );

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
  const notaMetodo = vista.fase === "listo" ? vista.resultado.nota_metodo : "";
  const totalEvidencia = vista.fase === "listo" ? vista.resultado.total_evidencia : 0;
  const usaAnios = definicionDe(peticion.componente).usaAnios;

  return (
    <div className="min-h-dvh bg-fondo">
      <BarraSuperior modo={modo} onCambiarModo={setModo} />

      <div className="mx-auto grid max-w-[1800px] grid-cols-[minmax(0,1fr)] gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="flex min-w-0 flex-col gap-4">
          {modo === "instruccion" ? (
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

          <ControlesFiltrosGlobales
            filtros={globales}
            usaAnios={usaAnios}
            onCambiar={setGlobales}
          />

          {modo === "instruccion" && enviando ? (
            <Cargando
              mensaje="El orquestador está consultando al agente de visualización…"
              cronometro
            />
          ) : null}

          {modo === "instruccion" && entradaActiva?.error ? (
            <AvisoError mensaje={entradaActiva.error} />
          ) : null}

          {modo === "instruccion" && entradaActiva?.respuesta ? (
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
            />
            </div>
          ) : (
            <Vacio
              titulo="Sin componente activo"
              detalle="Escriba una instrucción o elija un componente en el modo de exploración."
            />
          )}

          {modo === "instruccion" ? (
            <HistorialInstrucciones
              entradas={historial}
              idActivo={idActivo}
              onSeleccionar={recuperarDelHistorial}
            />
          ) : null}
        </main>

        <div className="h-[70dvh] lg:sticky lg:top-[84px] lg:h-[calc(100dvh-100px)]">
          <PanelLateralEvidencia
            seleccion={seleccion}
            evidenciaGlobal={evidenciaGlobal}
            notaMetodo={notaMetodo}
            totalEvidencia={totalEvidencia}
            onCerrar={() => setSeleccion(null)}
          />
        </div>
      </div>
    </div>
  );
}
