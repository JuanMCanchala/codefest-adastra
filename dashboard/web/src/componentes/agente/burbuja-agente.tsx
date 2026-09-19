import {
  ArrowUp,
  History,
  Loader2,
  Maximize2,
  Minimize2,
  Presentation,
  Sparkles,
  Trash2,
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
  type ReactNode,
} from "react";

import type { ResultadoComponente } from "@/api/tipos";
import { PanelConversacion } from "@/componentes/agente/panel-conversacion";
import { CuerpoComponente } from "@/componentes/vistas/cuerpo-componente";
import type { NivelMapa } from "@/componentes/vistas/mapa-colombia";
import type { EntradaHistorial } from "@/lib/historial";
import { useEscritorio } from "@/lib/medios";
import { metricasDe } from "@/lib/metricas";
import type { Accion, Seleccion } from "@/lib/seleccion";
import { cn } from "@/lib/utils";

const ANCHO = 400;
/** Alto fijo: la ventana no crece con la conversación; el hilo se desplaza por dentro. */
const ALTO = 560;
const MARGEN = 16;

interface Props {
  ocupado: boolean;
  onEnviar: (instruccion: string) => void;
  historial: readonly EntradaHistorial[];
  idActivo: string | null;
  onRecuperar: (id: string) => void;
  onLimpiar: () => void;
  /** Recorre las vistas de la conversación como presentación (Anexo B.6.1). */
  onPresentar: () => void;
  resultado: ResultadoComponente | null;
  seleccion: Seleccion | null;
  onSeleccionar: (seleccion: Seleccion) => void;
  onAccion: (accion: Accion) => void;
  nivelColombia: NivelMapa;
  onCambiarNivelColombia: (nivel: NivelMapa) => void;
}

/** Solo el eje horizontal: la ventana vive pegada al margen inferior de la pantalla. */
function acotar(x: number): number {
  return Math.min(Math.max(MARGEN, x), window.innerWidth - ANCHO - MARGEN);
}

/**
 * El agente, como ventana flotante sobre el tablero.
 *
 * Antes la instrucción, la respuesta y el historial eran tres cajas apiladas encima del
 * componente, que empezaba a media página. Aquí el lienzo ocupa toda la pantalla y el
 * agente se superpone: lo que se pregunta cambia el mapa que hay debajo, a la vista.
 *
 * Cerrada es una burbuja en la esquina. Abierta tiene dos tamaños: **compacta**, de medida
 * fija y anclada al margen inferior —solo se corre a izquierda y derecha, por la cabecera o
 * con las flechas—, y **ampliada**, que ocupa la pantalla y dibuja el gráfico dentro de la
 * propia conversación, para leer la respuesta y comprobarla sin cambiar de sitio. La medida
 * no depende de lo que se haya hablado: el hilo se desplaza dentro de la ventana, así que
 * el redactor siempre queda en el mismo sitio y nunca se sale por abajo.
 *
 * No hay mandos manuales: el componente, los filtros y el rango de años se piden hablando,
 * que es lo que el agente ya sabe traducir a una especificación.
 */
export function BurbujaAgente({
  ocupado,
  onEnviar,
  historial,
  idActivo,
  onRecuperar,
  onLimpiar,
  onPresentar,
  resultado,
  seleccion,
  onSeleccionar,
  onAccion,
  nivelColombia,
  onCambiarNivelColombia,
}: Props) {
  const escritorio = useEscritorio();
  // En escritorio nace abierta: es la única puerta de entrada al agente, que es lo que se
  // evalúa, y cerrada era un icono de 48 px sin texto en la esquina. En móvil nace cerrada,
  // porque abierta taparía el componente entero. Se lee del medio una sola vez, al montar.
  const [abierta, setAbierta] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );
  const [ampliada, setAmpliada] = useState(false);
  const [verHistorial, setVerHistorial] = useState(false);
  // La animación de aparición responde a un clic en la burbuja; en la carga inicial, con la
  // ventana ya abierta, sería una ventana haciendo «pop» sin que nadie la haya llamado.
  const abiertaPorClic = useRef(false);
  const [izquierda, setIzquierda] = useState<number | null>(null);
  const arrastre = useRef<number | null>(null);
  const ventana = useRef<HTMLElement | null>(null);
  const [texto, setTexto] = useState("");

  // Si la ventana se encoge, la burbuja vuelve a entrar en pantalla.
  useEffect(() => {
    if (!escritorio) {
      return;
    }
    const alRedimensionar = () =>
      setIzquierda((previa) => (previa === null ? previa : acotar(previa)));
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
    if (origen === null) {
      return;
    }
    setIzquierda(acotar(evento.clientX - origen));
  }, []);

  const alSoltar = useCallback(() => {
    arrastre.current = null;
    window.removeEventListener("pointermove", alMover);
  }, [alMover]);

  useEffect(() => () => window.removeEventListener("pointermove", alMover), [alMover]);

  function bordeIzquierdo(): number | null {
    const caja = ventana.current?.getBoundingClientRect();
    return caja ? caja.left : null;
  }

  /**
   * Hasta que se arrastra, la ventana va anclada abajo a la derecha con CSS. Al empezar a
   * moverla se lee dónde está y a partir de ahí manda el desplazamiento horizontal; el
   * borde inferior no se negocia.
   */
  const empezarArrastre = (evento: PointerEventReact<HTMLElement>) => {
    // Solo la zona vacía de la cabecera: sobre un botón manda el botón.
    if (!escritorio || ampliada || evento.target !== evento.currentTarget) {
      return;
    }
    const actual = izquierda ?? bordeIzquierdo();
    if (actual === null) {
      return;
    }
    setIzquierda(actual);
    arrastre.current = evento.clientX - actual;
    window.addEventListener("pointermove", alMover);
    window.addEventListener("pointerup", alSoltar, { once: true });
  };

  const moverConTeclado = (evento: KeyboardEventReact) => {
    if (!escritorio || ampliada) {
      return;
    }
    const actual = izquierda ?? bordeIzquierdo();
    if (actual === null) {
      return;
    }
    const paso = evento.shiftKey ? 48 : 16;
    const delta = { ArrowLeft: -paso, ArrowRight: paso }[evento.key];
    if (delta === undefined) {
      return;
    }
    evento.preventDefault();
    setIzquierda(acotar(actual + delta));
  };

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const limpio = texto.trim();
    if (limpio.length === 0 || ocupado) {
      return;
    }
    onEnviar(limpio);
    setTexto("");
  };

  const conversacion = (
    <PanelConversacion
      ocupado={ocupado}
      resultado={resultado}
      conMetricas={!ampliada}
      verHistorial={verHistorial}
      historial={historial}
      idActivo={idActivo}
      onRecuperar={(id) => {
        setVerHistorial(false);
        onRecuperar(id);
      }}
    />
  );

  if (!abierta) {
    return (
      <button
        type="button"
        onClick={() => {
          abiertaPorClic.current = true;
          setAbierta(true);
        }}
        aria-label="Abrir el agente"
        className="group fixed bottom-4 right-4 z-50 inline-flex size-12 items-center justify-center rounded-full border border-borde bg-panel text-texto shadow-[0_8px_24px_rgb(0_0_0/0.45)] transition-colors hover:border-control"
      >
        <Sparkles aria-hidden="true" className="size-5" />
        <span className="pointer-events-none invisible absolute right-full mr-2 whitespace-nowrap rounded-md border border-borde bg-panel px-2 py-1 text-xs text-apagado opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100">
          Agente
        </span>
      </button>
    );
  }

  const flotante = escritorio && !ampliada;

  const redactor = (
    <form className="p-3" onSubmit={enviar}>
      <label className="sr-only" htmlFor="campo-instruccion">
        Instrucción en lenguaje natural
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-borde bg-fondo py-1.5 pl-3 pr-1.5 focus-within:border-control">
        <input
          id="campo-instruccion"
          type="text"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          disabled={ocupado}
          autoComplete="off"
          placeholder="Escriba una instrucción…"
          className="h-8 min-w-0 flex-1 bg-transparent text-sm text-texto outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          aria-label="Visualizar"
          disabled={ocupado || texto.trim().length === 0}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-acento text-fondo transition-colors hover:bg-acento-claro disabled:pointer-events-none disabled:opacity-30"
        >
          {ocupado ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <ArrowUp aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
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
              // Medida fija y borde inferior fijo: el hilo crece hacia dentro, no la ventana.
              "bottom-4 rounded-xl",
              flotante && "max-h-[calc(100dvh-5rem)]",
              // A la izquierda del panel de evidencia (380 px + margen), para no taparlo:
              // preguntar y comprobar la fuente van juntos. Al arrastrarla manda `izquierda`.
              flotante && izquierda === null && "right-[396px]",
              // Crece desde su esquina inferior derecha, la más cercana a la burbuja que la abrió.
              flotante && abiertaPorClic.current && "brota-de-la-burbuja",
              !flotante && "inset-x-3 h-[70dvh] max-h-[calc(100dvh-5rem)]",
            ),
      )}
      style={
        flotante
          ? izquierda === null
            ? { width: ANCHO, height: ALTO }
            : { left: izquierda, width: ANCHO, height: ALTO }
          : undefined
      }
    >
      {/* La cabecera entera arrastra la ventana; sobre los botones manda el botón. */}
      <header
        onPointerDown={empezarArrastre}
        onKeyDown={moverConTeclado}
        tabIndex={escritorio && !ampliada ? 0 : undefined}
        aria-label={
          escritorio && !ampliada
            ? "Mover el panel del agente con las flechas izquierda y derecha"
            : undefined
        }
        className={cn(
          "flex items-center gap-2 border-b border-borde px-3 py-2",
          escritorio && !ampliada && "cursor-grab active:cursor-grabbing",
        )}
      >
        <span className="pointer-events-none flex size-8 shrink-0 items-center justify-center rounded-full border border-borde bg-elevado text-apagado">
          <Sparkles aria-hidden="true" className="size-4" />
        </span>
        <h2 className="pointer-events-none min-w-0 flex-1 truncate text-sm font-semibold">
          Agente
        </h2>

        {historial.some((entrada) => entrada.respuesta?.resultado) ? (
          <BotonCabecera
            onClick={() => {
              setAmpliada(false);
              onPresentar();
            }}
            etiqueta="Presentar el recorrido de vistas"
          >
            <Presentation aria-hidden="true" className="size-4" />
          </BotonCabecera>
        ) : null}
        <BotonCabecera
          activo={verHistorial}
          onClick={() => setVerHistorial((previa) => !previa)}
          etiqueta="Consultas anteriores"
        >
          <History aria-hidden="true" className="size-4" />
        </BotonCabecera>
        <BotonCabecera
          onClick={() => {
            setVerHistorial(false);
            onLimpiar();
          }}
          etiqueta="Limpiar la conversación"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </BotonCabecera>
        <BotonCabecera
          activo={ampliada}
          onClick={() => setAmpliada((previa) => !previa)}
          etiqueta={ampliada ? "Reducir el panel del agente" : "Ampliar el panel del agente"}
        >
          {ampliada ? (
            <Minimize2 aria-hidden="true" className="size-4" />
          ) : (
            <Maximize2 aria-hidden="true" className="size-4" />
          )}
        </BotonCabecera>
        <BotonCabecera
          onClick={() => {
            setAmpliada(false);
            setAbierta(false);
          }}
          etiqueta="Cerrar el agente"
        >
          <X aria-hidden="true" className="size-4" />
        </BotonCabecera>
      </header>

      {ampliada ? (
        // Ampliada: la conversación a un lado y el gráfico con sus cifras al otro, para
        // leer la respuesta y comprobarla sin salir del agente.
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="flex min-h-0 flex-col border-borde lg:w-[420px] lg:shrink-0 lg:border-r">
            <div
              className="barra-fina min-h-0 flex-1 overflow-y-auto"
              tabIndex={0}
              role="region"
              aria-label="Hilo de la conversación"
            >
              {conversacion}
            </div>
            {redactor}
          </div>

          <div
            className="barra-fina min-h-0 flex-1 overflow-y-auto"
            style={{ "--alto-vista": "calc(100dvh - 12rem)" } as CSSProperties}
            tabIndex={0}
            role="region"
            aria-label="Gráfico del turno activo"
          >
            {resultado ? (
              <>
                <MetricasEnLinea resultado={resultado} />
                <CuerpoComponente
                  resultado={resultado}
                  seleccion={seleccion}
                  onSeleccionar={onSeleccionar}
                  onAccion={onAccion}
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
          <div
            className="barra-fina min-h-0 flex-1 overflow-y-auto"
            tabIndex={0}
            role="region"
            aria-label="Hilo de la conversación"
          >
            {conversacion}
          </div>
          {redactor}
        </>
      )}
    </section>
  );
}

interface PropsBotonCabecera {
  activo?: boolean;
  onClick: () => void;
  etiqueta: string;
  children: ReactNode;
}

function BotonCabecera({ activo, onClick, etiqueta, children }: PropsBotonCabecera) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      aria-pressed={activo}
      title={etiqueta}
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
        activo ? "bg-elevado text-texto" : "text-apagado hover:bg-elevado hover:text-texto",
      )}
    >
      {children}
    </button>
  );
}

function MetricasEnLinea({ resultado }: { resultado: ResultadoComponente }) {
  return (
    <div className="border-b border-borde px-4 py-3">
      <h3 className="truncate text-sm font-semibold text-texto">{resultado.titulo}</h3>
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
        {metricasDe(resultado).map((metrica) => (
          <div key={metrica.etiqueta}>
            <dt className="text-xs uppercase tracking-[0.06em] text-apagado">{metrica.etiqueta}</dt>
            <dd className="font-mono text-sm text-texto">{metrica.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
