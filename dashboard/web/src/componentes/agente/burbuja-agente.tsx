import {
  CornerDownLeft,
  GripHorizontal,
  Loader2,
  Maximize2,
  Minimize2,
  Sparkles,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent as KeyboardEventReact,
  type PointerEvent as PointerEventReact,
} from "react";

import type { RespuestaVisualizar, ResultadoComponente } from "@/api/tipos";
import { PanelConversacion } from "@/componentes/agente/panel-conversacion";
import { CuerpoComponente } from "@/componentes/vistas/cuerpo-componente";
import type { NivelMapa } from "@/componentes/vistas/mapa-colombia";
import type { EntradaHistorial } from "@/lib/historial";
import { useEscritorio } from "@/lib/medios";
import { metricasDe } from "@/lib/metricas";
import type { Seleccion } from "@/lib/seleccion";
import { cn } from "@/lib/utils";

const ANCHO = 360;
const MARGEN = 16;

interface Props {
  ocupado: boolean;
  onEnviar: (instruccion: string) => void;
  respuesta: RespuestaVisualizar | null;
  error: string | null;
  historial: readonly EntradaHistorial[];
  idActivo: string | null;
  onRecuperar: (id: string) => void;
  resultado: ResultadoComponente | null;
  seleccion: Seleccion | null;
  onSeleccionar: (seleccion: Seleccion) => void;
  nivelColombia: NivelMapa;
  onCambiarNivelColombia: (nivel: NivelMapa) => void;
}

interface Posicion {
  x: number;
  y: number;
}

function acotar(posicion: Posicion): Posicion {
  return {
    x: Math.min(Math.max(MARGEN, posicion.x), window.innerWidth - ANCHO - MARGEN),
    y: Math.min(Math.max(MARGEN, posicion.y), window.innerHeight - 120),
  };
}

/**
 * El agente, como ventana flotante sobre el tablero.
 *
 * Antes la instrucción, la respuesta y el historial eran tres cajas apiladas encima del
 * componente, que empezaba a media página. Aquí el lienzo ocupa toda la pantalla y el
 * agente se superpone: lo que se pregunta cambia el mapa que hay debajo, a la vista.
 *
 * Cerrada es una burbuja en la esquina. Abierta tiene dos tamaños: **compacta**, que flota
 * y se arrastra por la cabecera (también con las flechas del teclado), y **ampliada**, que
 * ocupa la pantalla y dibuja el gráfico dentro de la propia conversación, para leer la
 * respuesta y comprobarla sin cambiar de sitio. Por debajo de `lg` no hay sitio para
 * moverla, así que la compacta se ancla abajo como hoja.
 *
 * No hay mandos manuales: el componente, los filtros y el rango de años se piden hablando,
 * que es lo que el agente ya sabe traducir a una especificación.
 */
export function BurbujaAgente({
  ocupado,
  onEnviar,
  respuesta,
  error,
  historial,
  idActivo,
  onRecuperar,
  resultado,
  seleccion,
  onSeleccionar,
  nivelColombia,
  onCambiarNivelColombia,
}: Props) {
  const escritorio = useEscritorio();
  const [abierta, setAbierta] = useState(true);
  const [ampliada, setAmpliada] = useState(false);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const arrastre = useRef<{ dx: number; dy: number } | null>(null);
  const ventana = useRef<HTMLElement | null>(null);
  const [texto, setTexto] = useState("");

  // Si la ventana se encoge, la burbuja vuelve a entrar en pantalla.
  useEffect(() => {
    if (!escritorio) {
      return;
    }
    const alRedimensionar = () => setPosicion((previa) => (previa ? acotar(previa) : previa));
    window.addEventListener("resize", alRedimensionar);
    return () => window.removeEventListener("resize", alRedimensionar);
  }, [escritorio]);

  // Escape devuelve la ventana a su tamaño compacto, como en cualquier vista ampliada.
  useEffect(() => {
    if (!ampliada) {
      return;
    }
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setAmpliada(false);
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [ampliada]);

  const alMover = useCallback((evento: PointerEvent) => {
    const origen = arrastre.current;
    if (!origen) {
      return;
    }
    setPosicion(acotar({ x: evento.clientX - origen.dx, y: evento.clientY - origen.dy }));
  }, []);

  const alSoltar = useCallback(() => {
    arrastre.current = null;
    window.removeEventListener("pointermove", alMover);
  }, [alMover]);

  useEffect(() => () => window.removeEventListener("pointermove", alMover), [alMover]);

  function rectangulo(): Posicion | null {
    const caja = ventana.current?.getBoundingClientRect();
    return caja ? { x: caja.left, y: caja.top } : null;
  }

  /**
   * Hasta que se arrastra, la ventana va anclada abajo a la derecha con CSS, así que su
   * alto real no importa. Al empezar a moverla se lee dónde está y a partir de ahí manda
   * la posición absoluta.
   */
  const empezarArrastre = (evento: PointerEventReact<HTMLElement>) => {
    if (!escritorio || ampliada) {
      return;
    }
    const actual = posicion ?? rectangulo();
    if (!actual) {
      return;
    }
    setPosicion(actual);
    arrastre.current = { dx: evento.clientX - actual.x, dy: evento.clientY - actual.y };
    window.addEventListener("pointermove", alMover);
    window.addEventListener("pointerup", alSoltar, { once: true });
  };

  const moverConTeclado = (evento: KeyboardEventReact) => {
    if (!escritorio || ampliada) {
      return;
    }
    const actual = posicion ?? rectangulo();
    if (!actual) {
      return;
    }
    const paso = evento.shiftKey ? 48 : 16;
    const desplazamiento: Record<string, Posicion> = {
      ArrowLeft: { x: -paso, y: 0 },
      ArrowRight: { x: paso, y: 0 },
      ArrowUp: { x: 0, y: -paso },
      ArrowDown: { x: 0, y: paso },
    };
    const delta = desplazamiento[evento.key];
    if (!delta) {
      return;
    }
    evento.preventDefault();
    setPosicion(acotar({ x: actual.x + delta.x, y: actual.y + delta.y }));
  };

  const preguntar = (instruccion: string) => {
    if (instruccion.length === 0 || ocupado) {
      return;
    }
    onEnviar(instruccion);
    setTexto("");
  };

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    preguntar(texto.trim());
  };

  if (!abierta) {
    return (
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-label="Abrir el agente"
        className="fixed bottom-4 right-4 z-50 inline-flex size-12 items-center justify-center rounded-full border border-borde bg-panel text-texto shadow-[0_8px_24px_rgb(0_0_0/0.45)] transition-colors hover:border-control"
      >
        <Sparkles aria-hidden="true" className="size-5" />
      </button>
    );
  }

  const flotante = escritorio && !ampliada;
  const conversacion = (
    <PanelConversacion
      ocupado={ocupado}
      respuesta={respuesta}
      error={error}
      resultado={resultado}
      conMetricas={!ampliada}
      historial={historial}
      idActivo={idActivo}
      onRecuperar={onRecuperar}
      onPreguntar={preguntar}
    />
  );

  const redactor = (
    <form className="flex items-center gap-2 border-t border-borde p-2" onSubmit={enviar}>
      <label className="sr-only" htmlFor="campo-instruccion">
        Instrucción en lenguaje natural
      </label>
      <input
        id="campo-instruccion"
        type="text"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        disabled={ocupado}
        autoComplete="off"
        placeholder="¿Qué quiere ver?"
        className="h-9 min-w-0 flex-1 rounded-md border border-control bg-fondo px-3 text-sm text-texto disabled:opacity-60"
      />
      <button
        type="submit"
        aria-label="Visualizar"
        disabled={ocupado || texto.trim().length === 0}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-acento font-semibold text-fondo transition-colors hover:bg-acento-claro disabled:pointer-events-none disabled:opacity-40"
      >
        {ocupado ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <CornerDownLeft aria-hidden="true" className="size-4" />
        )}
      </button>
    </form>
  );

  return (
    <section
      ref={ventana}
      aria-label="Agente"
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden border border-borde bg-panel shadow-[0_8px_24px_rgb(0_0_0/0.45)]",
        ampliada
          ? "inset-0 rounded-none border-0"
          : cn(
              "max-h-[min(60dvh,480px)] rounded-lg",
              // Anclada abajo mientras nadie la mueve; al arrastrarla manda `posicion`.
              flotante && posicion === null && "bottom-4 right-[396px]",
              !flotante && "inset-x-3 bottom-3 max-h-[70dvh]",
            ),
      )}
      style={
        flotante
          ? posicion
            ? { left: posicion.x, top: posicion.y, width: ANCHO }
            : { width: ANCHO }
          : undefined
      }
    >
      <header className="flex items-center gap-1.5 border-b border-borde px-2 py-1.5">
        {escritorio && !ampliada ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Mover el panel del agente con las flechas"
            onPointerDown={empezarArrastre}
            onKeyDown={moverConTeclado}
            className="inline-flex size-6 cursor-grab items-center justify-center rounded text-tenue hover:text-apagado active:cursor-grabbing"
          >
            <GripHorizontal aria-hidden="true" className="size-4" />
          </span>
        ) : null}

        <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles aria-hidden="true" className="size-4 text-apagado" />
          Agente
        </h2>

        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            aria-pressed={ampliada}
            onClick={() => setAmpliada((previa) => !previa)}
            aria-label={ampliada ? "Reducir el panel del agente" : "Ampliar el panel del agente"}
            title={ampliada ? "Reducir (Esc)" : "Ampliar a pantalla completa"}
            className="inline-flex size-7 items-center justify-center rounded text-apagado hover:bg-elevado hover:text-texto"
          >
            {ampliada ? (
              <Minimize2 aria-hidden="true" className="size-4" />
            ) : (
              <Maximize2 aria-hidden="true" className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setAmpliada(false);
              setAbierta(false);
            }}
            aria-label="Cerrar el agente"
            className="inline-flex size-7 items-center justify-center rounded text-apagado hover:bg-elevado hover:text-texto"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      </header>

      {ampliada ? (
        // Ampliada: la conversación a un lado y el gráfico con sus cifras al otro, para
        // leer la respuesta y comprobarla sin salir del agente.
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex min-h-0 flex-col border-borde lg:w-[420px] lg:shrink-0 lg:border-r">
            <div className="barra-fina min-h-0 flex-1 overflow-y-auto">{conversacion}</div>
            {redactor}
          </div>

          <div
            className="barra-fina min-h-0 flex-1 overflow-y-auto"
            style={{ "--alto-vista": "calc(100dvh - 12rem)" } as CSSProperties}
          >
            {resultado ? (
              <>
                <MetricasEnLinea resultado={resultado} />
                <CuerpoComponente
                  resultado={resultado}
                  seleccion={seleccion}
                  onSeleccionar={onSeleccionar}
                  nivelColombia={nivelColombia}
                  onCambiarNivelColombia={onCambiarNivelColombia}
                />
              </>
            ) : (
              <p className="px-4 py-6 text-sm text-apagado">
                Todavía no hay ningún componente calculado.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="barra-fina min-h-0 flex-1 overflow-y-auto">{conversacion}</div>
          {redactor}
        </>
      )}
    </section>
  );
}

function MetricasEnLinea({ resultado }: { resultado: ResultadoComponente }) {
  return (
    <div className="border-b border-borde px-4 py-3">
      <h3 className="truncate text-sm font-semibold text-texto">{resultado.titulo}</h3>
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
        {metricasDe(resultado).map((metrica) => (
          <div key={metrica.etiqueta}>
            <dt className="text-xs uppercase tracking-[0.06em] text-apagado">
              {metrica.etiqueta}
            </dt>
            <dd className="font-mono text-sm text-texto">{metrica.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
