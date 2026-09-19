import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { Filter } from "lucide-react";
import { useMemo, useState } from "react";

import type { DatosRedEntidades, Ref } from "@/api/tipos";
import { Vacio } from "@/componentes/ui/estados";
import { colorCategoria } from "@/lib/paleta";
import type { PropsVista } from "@/lib/seleccion";
import { cn, formatearEntero, maximoDe, recortar, refsUnicas } from "@/lib/utils";
import { TEMA, TEXTO_MINIMO } from "@/lib/tema";

const ANCHO = 960;
const ALTO = 540;
const ITERACIONES = 280;
/** Proporción del lienzo: el encuadre se ajusta a ella para no deformar la red. */
const PROPORCION = ANCHO / ALTO;
/** Aire alrededor de los nodos, en unidades del lienzo. */
const MARGEN = 56;
/** Ancho mínimo del encuadre: con dos nodos, acercarse del todo marea más que ayuda. */
const ENCUADRE_MINIMO = 420;

interface NodoSim extends SimulationNodeDatum {
  id: string;
  tipo: string;
  menciones: number;
}

interface AristaSim extends SimulationLinkDatum<NodoSim> {
  relacion: string;
  peso: number;
  refs: Ref[];
}

interface Disposicion {
  nodos: NodoSim[];
  aristas: AristaSim[];
  vecinos: Map<string, Set<string>>;
  refsPorNodo: Map<string, Ref[]>;
  /** Encuadre ajustado a los nodos: `x y ancho alto` para el `viewBox`. */
  encuadre: string;
}

/**
 * Encuadre que contiene todos los nodos con aire alrededor.
 *
 * Sin esto, una red de dos entidades se dibujaba minúscula en el centro de un lienzo
 * pensado para cuarenta: la simulación siempre las deja juntas, y el resto era vacío.
 */
function encuadrarNodos(nodos: readonly NodoSim[]): string {
  if (nodos.length === 0) {
    return `0 0 ${String(ANCHO)} ${String(ALTO)}`;
  }
  const xs = nodos.map((nodo) => nodo.x ?? 0);
  const ys = nodos.map((nodo) => nodo.y ?? 0);
  let x0 = Math.min(...xs) - MARGEN;
  let x1 = Math.max(...xs) + MARGEN;
  let y0 = Math.min(...ys) - MARGEN;
  // Abajo hace falta más hueco: la etiqueta del nodo cuelga bajo el círculo.
  let y1 = Math.max(...ys) + MARGEN + 18;

  let ancho = Math.max(x1 - x0, ENCUADRE_MINIMO);
  let alto = Math.max(y1 - y0, ENCUADRE_MINIMO / PROPORCION);
  // Se estira el lado corto hasta la proporción del lienzo, para no deformar la red.
  if (ancho / alto > PROPORCION) {
    alto = ancho / PROPORCION;
  } else {
    ancho = alto * PROPORCION;
  }
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  x0 = cx - ancho / 2;
  y0 = cy - alto / 2;
  x1 = x0 + ancho;
  y1 = y0 + alto;
  return `${String(x0)} ${String(y0)} ${String(ancho)} ${String(alto)}`;
}

function extremo(valor: AristaSim["source"]): string {
  return typeof valor === "object" ? valor.id : String(valor);
}

function calcular(datos: DatosRedEntidades, tipos: ReadonlySet<string>): Disposicion {
  const nodos: NodoSim[] = datos.nodos
    .filter((n) => tipos.size === 0 || tipos.has(n.tipo))
    .map((n) => ({ id: n.id, tipo: n.tipo, menciones: n.menciones }));
  const presentes = new Set(nodos.map((n) => n.id));
  const aristas: AristaSim[] = datos.aristas
    .filter((a) => presentes.has(a.origen) && presentes.has(a.destino))
    .map((a) => ({
      source: a.origen,
      target: a.destino,
      relacion: a.relacion,
      peso: a.peso,
      refs: a.refs ?? [],
    }));

  /*
   * La red casi nunca es conexa: son varios grupos sueltos. Sin una fuerza que tire de
   * ellos hacia el centro, la repulsión los manda a tomar por saco y el encuadre acaba
   * siendo tan grande que todo se dibuja diminuto. `forceX`/`forceY` los mantienen juntos
   * y la repulsión se ajusta al número de nodos para que un grupo pequeño no explote.
   */
  const repulsion = -240 - 900 / Math.max(4, nodos.length);
  const simulacion = forceSimulation(nodos)
    .force(
      "enlace",
      forceLink<NodoSim, AristaSim>(aristas)
        .id((nodo) => nodo.id)
        .distance(70)
        .strength(0.6),
    )
    .force("carga", forceManyBody<NodoSim>().strength(repulsion).distanceMax(320))
    .force("centro", forceCenter(ANCHO / 2, ALTO / 2))
    .force("agrupaX", forceX<NodoSim>(ANCHO / 2).strength(0.06))
    .force("agrupaY", forceY<NodoSim>(ALTO / 2).strength(0.1))
    .force("colision", forceCollide<NodoSim>().radius(26))
    .stop();
  simulacion.tick(ITERACIONES);

  const vecinos = new Map<string, Set<string>>();
  const refsPorNodo = new Map<string, Ref[]>();
  for (const arista of aristas) {
    const origen = extremo(arista.source);
    const destino = extremo(arista.target);
    for (const [a, b] of [
      [origen, destino],
      [destino, origen],
    ] as const) {
      const conjunto = vecinos.get(a) ?? new Set<string>();
      conjunto.add(b);
      vecinos.set(a, conjunto);
      refsPorNodo.set(a, [...(refsPorNodo.get(a) ?? []), ...arista.refs]);
    }
  }
  return { nodos, aristas, vecinos, refsPorNodo, encuadre: encuadrarNodos(nodos) };
}

/** Red de entidades con exploración de vecinos al clic y filtro por tipo de entidad. */
export function VistaRedEntidades({ datos, onSeleccionar }: PropsVista<DatosRedEntidades>) {
  const [ocultos, setOcultos] = useState<ReadonlySet<string>>(new Set<string>());
  const [centro, setCentro] = useState<string | null>(null);
  const [encima, setEncima] = useState<string | null>(null);

  const tiposDisponibles = useMemo(
    () => [...new Set(datos.nodos.map((n) => n.tipo))].sort((a, b) => a.localeCompare(b, "es")),
    [datos.nodos],
  );
  const colorPorTipo = useMemo(() => {
    const mapa = new Map<string, string>();
    tiposDisponibles.forEach((tipo, indice) => mapa.set(tipo, colorCategoria(indice)));
    return mapa;
  }, [tiposDisponibles]);

  const visibles = useMemo(
    () => new Set(tiposDisponibles.filter((t) => !ocultos.has(t))),
    [ocultos, tiposDisponibles],
  );
  const disposicion = useMemo(() => calcular(datos, visibles), [datos, visibles]);
  const maxMenciones = useMemo(
    () => maximoDe(disposicion.nodos.map((n) => n.menciones)),
    [disposicion.nodos],
  );

  const alternarTipo = (tipo: string) => {
    setOcultos((previos) => {
      const siguiente = new Set(previos);
      if (siguiente.has(tipo)) {
        siguiente.delete(tipo);
      } else {
        siguiente.add(tipo);
      }
      return siguiente;
    });
  };

  const seleccionarNodo = (nodo: NodoSim) => {
    setCentro(nodo.id);
    const vecinos = disposicion.vecinos.get(nodo.id);
    onSeleccionar({
      titulo: nodo.id,
      detalle: `${nodo.tipo} · ${formatearEntero(nodo.menciones)} menciones · ${String(
        vecinos?.size ?? 0,
      )} vecinos en la red`,
      origen: "red_entidades",
      refs: refsUnicas(disposicion.refsPorNodo.get(nodo.id) ?? []),
    });
  };

  const radio = (menciones: number) =>
    7 + Math.sqrt(Math.max(0, menciones) / Math.max(1, maxMenciones)) * 14;

  /**
   * Un nodo se atenúa si hay un foco (por clic) o un nodo bajo el ratón y no pertenece a
   * su vecindario. El paso del ratón manda sobre el foco: es lo que se está mirando.
   */
  const referencia = encima ?? centro;
  const esRelevante = (id: string) =>
    referencia === null ||
    referencia === id ||
    (disposicion.vecinos.get(referencia)?.has(id) ?? false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-apagado">
          <Filter aria-hidden="true" className="size-3.5" />
          Tipos de entidad
        </span>
        {tiposDisponibles.map((tipo) => {
          const activo = !ocultos.has(tipo);
          return (
            <button
              key={tipo}
              type="button"
              aria-pressed={activo}
              onClick={() => alternarTipo(tipo)}
              className={cn(
                "inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                activo
                  ? "border-control bg-elevado text-texto"
                  : "border-borde/60 bg-transparent text-apagado line-through",
              )}
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: colorPorTipo.get(tipo) }}
              />
              {tipo}
            </button>
          );
        })}
        {centro ? (
          <button
            type="button"
            onClick={() => setCentro(null)}
            className="ml-auto rounded border border-borde bg-elevado px-2.5 py-1 text-xs text-apagado hover:text-texto"
          >
            Quitar foco en {recortar(centro, 22)}
          </button>
        ) : null}
      </div>

      {disposicion.nodos.length > 0 && disposicion.nodos.length < 5 ? (
        <p className="px-4 text-xs text-apagado" role="status">
          Solo {formatearEntero(disposicion.nodos.length)} entidades superan el peso mínimo
          de esta consulta. Baje el peso o suba el número de nodos para ver más red.
        </p>
      ) : null}

      {disposicion.nodos.length === 0 ? (
        <Vacio
          titulo="Sin entidades visibles"
          detalle="Todos los tipos están ocultos o la consulta no devolvió nodos."
        />
      ) : (
        <svg
          viewBox={disposicion.encuadre}
          className="h-[var(--alto-vista,540px)] w-full"
          onMouseLeave={() => setEncima(null)}
          role="group"
          aria-label={`Red de ${String(disposicion.nodos.length)} entidades y ${String(
            disposicion.aristas.length,
          )} relaciones.`}
        >
          <g>
            {disposicion.aristas.map((arista, indice) => {
              const origen = arista.source;
              const destino = arista.target;
              if (typeof origen !== "object" || typeof destino !== "object") {
                return null;
              }
              const relevante = esRelevante(origen.id) && esRelevante(destino.id);
              return (
                <line
                  key={`${origen.id}-${destino.id}-${String(indice)}`}
                  x1={origen.x ?? 0}
                  y1={origen.y ?? 0}
                  x2={destino.x ?? 0}
                  y2={destino.y ?? 0}
                  stroke={relevante ? TEMA.control : TEMA.borde}
                  strokeWidth={Math.min(4, 1 + Math.log2(arista.peso + 1))}
                  strokeOpacity={relevante ? 0.9 : 0.25}
                  className="cursor-pointer"
                  onClick={() =>
                    onSeleccionar({
                      titulo: `${origen.id} → ${destino.id}`,
                      detalle: `Relación «${arista.relacion}» con peso ${formatearEntero(
                        arista.peso,
                      )}`,
                      origen: "red_entidades",
                      refs: refsUnicas(arista.refs),
                    })
                  }
                >
                  <title>{`${origen.id} → ${destino.id} · ${arista.relacion} · peso ${formatearEntero(arista.peso)}`}</title>
                </line>
              );
            })}
          </g>
          <g>
            {disposicion.nodos.map((nodo) => {
              const relevante = esRelevante(nodo.id);
              const r = radio(nodo.menciones);
              return (
                <g
                  key={nodo.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`${nodo.id}, ${nodo.tipo}, ${formatearEntero(nodo.menciones)} menciones`}
                  className="nodo-red cursor-pointer outline-none"
                  opacity={relevante ? 1 : 0.2}
                  onMouseEnter={() => setEncima(nodo.id)}
                  onFocus={() => setEncima(nodo.id)}
                  onBlur={() => setEncima(null)}
                  onClick={() => seleccionarNodo(nodo)}
                  onKeyDown={(evento) => {
                    if (evento.key === "Enter" || evento.key === " ") {
                      evento.preventDefault();
                      seleccionarNodo(nodo);
                    }
                  }}
                >
                  <circle
                    cx={nodo.x ?? 0}
                    cy={nodo.y ?? 0}
                    r={r}
                    fill={colorPorTipo.get(nodo.tipo) ?? TEMA.senal}
                    fillOpacity={0.9}
                    stroke={referencia === nodo.id ? TEMA.texto : TEMA.panel}
                    strokeWidth={referencia === nodo.id ? 3 : 1.5}
                  />
                  {/* El halo del color del panel despega la etiqueta de las aristas. */}
                  <text
                    x={nodo.x ?? 0}
                    y={(nodo.y ?? 0) + r + 15}
                    textAnchor="middle"
                    fontSize={TEXTO_MINIMO}
                    fill={TEMA.texto}
                    stroke={TEMA.panel}
                    strokeWidth={3}
                    paintOrder="stroke"
                    pointerEvents="none"
                  >
                    {recortar(nodo.id, 18)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      )}
    </div>
  );
}
