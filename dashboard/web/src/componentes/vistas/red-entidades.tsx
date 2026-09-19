import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
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

  const simulacion = forceSimulation(nodos)
    .force(
      "enlace",
      forceLink<NodoSim, AristaSim>(aristas)
        .id((nodo) => nodo.id)
        .distance(90)
        .strength(0.35),
    )
    .force("carga", forceManyBody<NodoSim>().strength(-320))
    .force("centro", forceCenter(ANCHO / 2, ALTO / 2))
    .force("colision", forceCollide<NodoSim>().radius(24))
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
  return { nodos, aristas, vecinos, refsPorNodo };
}

/** Red de entidades con exploración de vecinos al clic y filtro por tipo de entidad. */
export function VistaRedEntidades({ datos, onSeleccionar }: PropsVista<DatosRedEntidades>) {
  const [ocultos, setOcultos] = useState<ReadonlySet<string>>(new Set<string>());
  const [centro, setCentro] = useState<string | null>(null);

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

  const esRelevante = (id: string) =>
    centro === null || centro === id || (disposicion.vecinos.get(centro)?.has(id) ?? false);

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

      {disposicion.nodos.length === 0 ? (
        <Vacio
          titulo="Sin entidades visibles"
          detalle="Todos los tipos están ocultos o la consulta no devolvió nodos."
        />
      ) : (
        <svg
          viewBox={`0 0 ${String(ANCHO)} ${String(ALTO)}`}
          className="h-[540px] w-full"
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
                  opacity={relevante ? 1 : 0.28}
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
                    fillOpacity={0.85}
                    stroke={centro === nodo.id ? TEMA.texto : TEMA.fondo}
                    strokeWidth={centro === nodo.id ? 2.5 : 1.5}
                  />
                  <text
                    x={nodo.x ?? 0}
                    y={(nodo.y ?? 0) + r + 14}
                    textAnchor="middle"
                    fontSize={TEXTO_MINIMO}
                    fill={TEMA.texto}
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
