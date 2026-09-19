import type { FeatureCollection, Geometry } from "geojson";
import maplibregl, { type ExpressionSpecification, type StyleSpecification } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

import { ControlesMapa } from "@/componentes/mapas/controles-mapa";
import { HudMapa, type Recuadro } from "@/componentes/mapas/hud-mapa";
import {
  BASES_REMOTAS,
  type ClaveBase,
  baseDe,
  guardarBase,
  idCapaBase,
  idFuenteBase,
  leerBaseGuardada,
} from "@/lib/mapa-base";
import { SIN_DATO, colorPorValor } from "@/lib/paleta";
import { formatearEntero } from "@/lib/utils";
import { TEMA } from "@/lib/tema";

/**
 * Estilo base: un lienzo sólido más las capas de imagen apagadas. Sin mapa base activo la
 * SPA no pide una sola tesela remota (PRODUCT.md §45); al encender una, MapLibre empieza a
 * descargarla y, si falla, `onFalloBase` devuelve la vista al fondo analítico.
 */
function construirEstilo(globo: boolean): StyleSpecification {
  const estilo: StyleSpecification = {
    version: 8,
    sources: {},
    layers: [{ id: "lienzo", type: "background", paint: { "background-color": TEMA.mapaFondo } }],
  };
  for (const base of BASES_REMOTAS) {
    estilo.sources[idFuenteBase(base.clave)] = {
      type: "raster",
      tiles: [...(base.teselas ?? [])],
      tileSize: 256,
      maxzoom: base.zoomMaximoTeselas,
      attribution: base.atribucion,
    };
    estilo.layers.push({
      id: idCapaBase(base.clave),
      type: "raster",
      source: idFuenteBase(base.clave),
      layout: { visibility: "none" },
      paint: { "raster-opacity": 1 },
    });
  }
  if (globo) {
    estilo.projection = { type: "globe" };
    estilo.sky = {
      "sky-color": TEMA.mapaFondo,
      "horizon-color": "#2a4270",
      "fog-color": TEMA.fondo,
      "sky-horizon-blend": 0.6,
      "horizon-fog-blend": 0.5,
      "atmosphere-blend": 0.75,
    };
  }
  return estilo;
}

const FUENTE = "regiones";
const CAPA_RELLENO = "regiones-relleno";
const CAPA_BORDE = "regiones-borde";
const CAPA_FOCO = "regiones-foco";

export interface Props {
  geojson: FeatureCollection;
  /** Propiedad del GeoJSON con la que se une el dato (p. ej. `divipola_dpto`). */
  claveGeo: string;
  /** Propiedad con el nombre legible de la región. */
  claveNombre: string;
  valores: ReadonlyMap<string, number>;
  maximo: number;
  unidad: string;
  centro: [number, number];
  zoom: number;
  zoomMinimo: number;
  zoomMaximo: number;
  seleccionada: string | null;
  onClicRegion: (clave: string) => void;
  onZoom?: (zoom: number) => void;
  /** Proyección esférica con atmósfera: solo tiene sentido en la vista mundial. */
  globo?: boolean;
}

function expresionColor(valores: ReadonlyMap<string, number>, maximo: number, claveGeo: string) {
  const pares: (string | number)[] = [];
  for (const [clave, valor] of valores) {
    if (valor > 0) {
      pares.push(clave, colorPorValor(valor, maximo));
    }
  }
  if (pares.length === 0) {
    return SIN_DATO;
  }
  return ["match", ["get", claveGeo], ...pares, SIN_DATO] as unknown as ExpressionSpecification;
}

function leerTexto(propiedades: unknown, clave: string): string {
  if (propiedades && typeof propiedades === "object") {
    const valor = (propiedades as Record<string, unknown>)[clave];
    if (typeof valor === "string") return valor;
    if (typeof valor === "number") return String(valor);
  }
  return "";
}

/** [oeste, sur, este, norte] de una geometría, recorriendo sus vértices. */
type Caja = [number, number, number, number];

function cajaDe(geometria: Geometry | null): Caja | null {
  if (!geometria || geometria.type === "GeometryCollection") {
    return null;
  }
  let oeste = Infinity;
  let sur = Infinity;
  let este = -Infinity;
  let norte = -Infinity;
  const visitar = (nodo: unknown): void => {
    if (!Array.isArray(nodo)) return;
    if (typeof nodo[0] === "number" && typeof nodo[1] === "number") {
      const [lng, lat] = nodo as [number, number];
      if (lng < oeste) oeste = lng;
      if (lng > este) este = lng;
      if (lat < sur) sur = lat;
      if (lat > norte) norte = lat;
      return;
    }
    for (const hijo of nodo) visitar(hijo);
  };
  visitar(geometria.coordinates);
  return Number.isFinite(oeste) ? [oeste, sur, este, norte] : null;
}

function recuadroEnPantalla(instancia: maplibregl.Map, caja: Caja): Recuadro | null {
  const [oeste, sur, este, norte] = caja;
  const puntos = [
    instancia.project([oeste, norte]),
    instancia.project([este, norte]),
    instancia.project([este, sur]),
    instancia.project([oeste, sur]),
  ];
  const xs = puntos.map((p) => p.x);
  const ys = puntos.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const ancho = Math.max(...xs) - x;
  const alto = Math.max(...ys) - y;
  if (!Number.isFinite(x) || !Number.isFinite(y) || ancho <= 0 || alto <= 0) {
    return null;
  }
  const lienzo = instancia.getCanvas();
  // Región fuera de cuadro (o al otro lado del globo): no se dibuja el encuadre.
  if (x > lienzo.clientWidth || y > lienzo.clientHeight || x + ancho < 0 || y + alto < 0) {
    return null;
  }
  return { x, y, ancho, alto };
}

interface Telemetria {
  lng: number;
  lat: number;
  zoom: number;
  recuadro: Recuadro | null;
}

export function MapaCoropleta({
  geojson,
  claveGeo,
  claveNombre,
  valores,
  maximo,
  unidad,
  centro,
  zoom,
  zoomMinimo,
  zoomMaximo,
  seleccionada,
  onClicRegion,
  onZoom,
  globo = false,
}: Props) {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const globoEmergente = useRef<maplibregl.Popup | null>(null);
  const alClic = useRef(onClicRegion);
  const alZoom = useRef(onZoom);

  const [base, setBase] = useState<ClaveBase>(() => leerBaseGuardada());
  const [hud, setHud] = useState(false);
  const [avisoBase, setAvisoBase] = useState<string | null>(null);
  const [telemetria, setTelemetria] = useState<Telemetria>({
    lng: centro[0],
    lat: centro[1],
    zoom,
    recuadro: null,
  });

  // Los manejadores de MapLibre se registran una sola vez: leen los valores vigentes por ref.
  const valoresVigentes = useRef(valores);
  const maximoVigente = useRef(maximo);
  const baseVigente = useRef(base);
  const alFalloBase = useRef<(clave: ClaveBase) => void>(() => {});

  alClic.current = onClicRegion;
  alZoom.current = onZoom;
  valoresVigentes.current = valores;
  maximoVigente.current = maximo;
  baseVigente.current = base;
  alFalloBase.current = (clave) => {
    if (clave !== baseVigente.current) return;
    setBase("analitico");
    guardarBase("analitico");
    setAvisoBase(
      `No se pudo descargar «${baseDe(clave).etiqueta}»: se volvió al fondo analítico.`,
    );
  };

  const cambiarBase = (clave: ClaveBase) => {
    setBase(clave);
    guardarBase(clave);
    setAvisoBase(null);
  };

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) {
      return;
    }
    const instancia = new maplibregl.Map({
      container: nodo,
      style: construirEstilo(globo),
      center: centro,
      zoom,
      minZoom: zoomMinimo,
      maxZoom: zoomMaximo,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });
    instancia.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    instancia.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "Geometrías: MGN 2018 (DANE) y Natural Earth",
      }),
      "bottom-right",
    );
    instancia.on("zoomend", () => alZoom.current?.(instancia.getZoom()));
    instancia.on("error", (evento) => {
      const fuente = (evento as { sourceId?: string }).sourceId;
      for (const remota of BASES_REMOTAS) {
        if (fuente === idFuenteBase(remota.clave)) {
          alFalloBase.current(remota.clave);
        }
      }
    });
    mapa.current = instancia;
    globoEmergente.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 8,
    });
    return () => {
      globoEmergente.current?.remove();
      globoEmergente.current = null;
      instancia.remove();
      mapa.current = null;
    };
    // El mapa se crea una sola vez: la vista inicial no se reaplica en cada render.
  }, []);

  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia) {
      return;
    }
    const preparar = () => {
      const fuente = instancia.getSource(FUENTE);
      // El color se calcula aquí también: si los datos llegaron antes de que el estilo
      // cargara, el efecto de color ya corrió sin capa y el mapa quedaba sin colorear.
      const color = expresionColor(valoresVigentes.current, maximoVigente.current, claveGeo);
      const estiloBase = baseDe(baseVigente.current);
      if (fuente) {
        (fuente as maplibregl.GeoJSONSource).setData(geojson);
        instancia.setPaintProperty(CAPA_RELLENO, "fill-color", color);
      } else {
        instancia.addSource(FUENTE, { type: "geojson", data: geojson });
        instancia.addLayer({
          id: CAPA_RELLENO,
          type: "fill",
          source: FUENTE,
          paint: { "fill-color": color, "fill-opacity": estiloBase.opacidadRelleno },
        });
        instancia.addLayer({
          id: CAPA_BORDE,
          type: "line",
          source: FUENTE,
          paint: { "line-color": estiloBase.colorBorde, "line-width": 0.7 },
        });
        instancia.addLayer({
          id: CAPA_FOCO,
          type: "line",
          source: FUENTE,
          paint: { "line-color": TEMA.acento, "line-width": 2.5 },
          filter: ["==", ["get", claveGeo], ""],
        });

        instancia.on("click", CAPA_RELLENO, (evento) => {
          const rasgo = evento.features?.[0];
          if (!rasgo) return;
          const clave = leerTexto(rasgo.properties, claveGeo);
          if (clave) alClic.current(clave);
        });
        instancia.on("mousemove", CAPA_RELLENO, (evento) => {
          const rasgo = evento.features?.[0];
          if (!rasgo || !globoEmergente.current) return;
          instancia.getCanvas().style.cursor = "pointer";
          const clave = leerTexto(rasgo.properties, claveGeo);
          const nombre = leerTexto(rasgo.properties, claveNombre) || clave;
          const valor = valoresVigentes.current.get(clave) ?? 0;
          globoEmergente.current
            .setLngLat(evento.lngLat)
            .setHTML(
              `<strong>${nombre}</strong><br/>${formatearEntero(valor)} ${unidad}`,
            )
            .addTo(instancia);
        });
        instancia.on("mouseleave", CAPA_RELLENO, () => {
          instancia.getCanvas().style.cursor = "";
          globoEmergente.current?.remove();
        });
      }
    };
    if (instancia.isStyleLoaded()) {
      preparar();
    } else {
      void instancia.once("load", preparar);
    }
  }, [claveGeo, claveNombre, geojson, unidad]);

  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia?.getLayer(CAPA_RELLENO)) {
      return;
    }
    instancia.setPaintProperty(CAPA_RELLENO, "fill-color", expresionColor(valores, maximo, claveGeo));
  }, [claveGeo, maximo, valores]);

  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia?.getLayer(CAPA_FOCO)) {
      return;
    }
    instancia.setFilter(CAPA_FOCO, ["==", ["get", claveGeo], seleccionada ?? ""]);
  }, [claveGeo, seleccionada]);

  // Encendido del mapa base: la coropleta se aclara para dejar ver la imagen de abajo.
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia) {
      return;
    }
    const aplicar = () => {
      for (const remota of BASES_REMOTAS) {
        if (instancia.getLayer(idCapaBase(remota.clave))) {
          instancia.setLayoutProperty(
            idCapaBase(remota.clave),
            "visibility",
            remota.clave === base ? "visible" : "none",
          );
        }
      }
      if (instancia.getLayer(CAPA_RELLENO)) {
        const estiloBase = baseDe(base);
        instancia.setPaintProperty(CAPA_RELLENO, "fill-opacity", estiloBase.opacidadRelleno);
        instancia.setPaintProperty(CAPA_BORDE, "line-color", estiloBase.colorBorde);
      }
    };
    if (instancia.isStyleLoaded()) {
      aplicar();
    } else {
      void instancia.once("load", aplicar);
    }
  }, [base]);

  const caja = useMemo(() => {
    if (!seleccionada) return null;
    const rasgo = geojson.features.find(
      (f) => leerTexto(f.properties, claveGeo) === seleccionada,
    );
    return cajaDe(rasgo?.geometry ?? null);
  }, [claveGeo, geojson, seleccionada]);

  const nombreSeleccion = useMemo(() => {
    if (!seleccionada) return null;
    const rasgo = geojson.features.find(
      (f) => leerTexto(f.properties, claveGeo) === seleccionada,
    );
    return rasgo ? leerTexto(rasgo.properties, claveNombre) || seleccionada : null;
  }, [claveGeo, claveNombre, geojson, seleccionada]);

  // La telemetría solo se calcula con el HUD encendido: sin él no hay trabajo por cuadro.
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia || !hud) {
      return;
    }
    let pendiente = 0;
    const actualizar = () => {
      pendiente = 0;
      const centroActual = instancia.getCenter();
      setTelemetria({
        lng: centroActual.lng,
        lat: centroActual.lat,
        zoom: instancia.getZoom(),
        recuadro: caja ? recuadroEnPantalla(instancia, caja) : null,
      });
    };
    const programar = () => {
      if (!pendiente) pendiente = requestAnimationFrame(actualizar);
    };
    actualizar();
    instancia.on("move", programar);
    instancia.on("resize", programar);
    return () => {
      instancia.off("move", programar);
      instancia.off("resize", programar);
      if (pendiente) cancelAnimationFrame(pendiente);
    };
  }, [caja, hud]);

  return (
    <div className="relative h-full w-full">
      <div ref={contenedor} className="h-full w-full" />
      {hud ? (
        <HudMapa
          lng={telemetria.lng}
          lat={telemetria.lat}
          zoom={telemetria.zoom}
          etiqueta={nombreSeleccion}
          valor={seleccionada ? (valores.get(seleccionada) ?? 0) : null}
          unidad={unidad}
          recuadro={telemetria.recuadro}
        />
      ) : null}
      <ControlesMapa base={base} onCambiarBase={cambiarBase} hud={hud} onCambiarHud={setHud} />
      {avisoBase ? (
        <p
          role="status"
          className="absolute bottom-3 left-1/2 max-w-[80%] -translate-x-1/2 rounded border border-borde bg-panel/95 px-2 py-1 text-center text-xs text-apagado"
        >
          {avisoBase}
        </p>
      ) : null}
    </div>
  );
}
