import type { FeatureCollection } from "geojson";
import maplibregl, { type ExpressionSpecification, type StyleSpecification } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import {
  BASES,
  BASES_REMOTAS,
  baseDe,
  colorBorde,
  guardarBase,
  idCapaBase,
  idFuenteBase,
  leerBaseGuardada,
  type ClaveBase,
} from "@/lib/mapa-base";
import { colorPorValor, sinDato } from "@/lib/paleta";
import { cn, formatearEntero } from "@/lib/utils";
import { TEMA } from "@/lib/tema";

/**
 * Fondo sin mapa base remoto: la SPA no depende de tokens ni de teselas externas.
 *
 * Es una función y no una constante porque el color depende del modo claro u oscuro, que
 * se decide en tiempo de ejecución.
 *
 * Con `globo` la proyección pasa a esfera y se dibuja la atmósfera. Es solo geometría:
 * no descarga nada, así que el mapa mundial se ve en 3D también sin conexión.
 */
function estiloBase(esferico: boolean): StyleSpecification {
  const estilo: StyleSpecification = {
    version: 8,
    sources: {},
    layers: [{ id: "lienzo", type: "background", paint: { "background-color": TEMA.mapaFondo } }],
  };
  // Las capas de imagen nacen ocultas: MapLibre no pide teselas de una fuente cuya única
  // capa está en `visibility: none`, así que el tablero sigue arrancando sin red.
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
    });
  }
  if (esferico) {
    estilo.projection = { type: "globe" };
    estilo.sky = {
      "sky-color": TEMA.mapaFondo,
      "horizon-color": TEMA.control,
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
  esferico?: boolean;
}

function expresionColor(valores: ReadonlyMap<string, number>, maximo: number, claveGeo: string) {
  const pares: (string | number)[] = [];
  for (const [clave, valor] of valores) {
    if (valor > 0) {
      pares.push(clave, colorPorValor(valor, maximo));
    }
  }
  if (pares.length === 0) {
    return sinDato();
  }
  return ["match", ["get", claveGeo], ...pares, sinDato()] as unknown as ExpressionSpecification;
}

function leerTexto(propiedades: unknown, clave: string): string {
  if (propiedades && typeof propiedades === "object") {
    const valor = (propiedades as Record<string, unknown>)[clave];
    if (typeof valor === "string") return valor;
    if (typeof valor === "number") return String(valor);
  }
  return "";
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
  esferico,
}: Props) {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const globo = useRef<maplibregl.Popup | null>(null);
  const alClic = useRef(onClicRegion);
  const alZoom = useRef(onZoom);

  // Los manejadores de MapLibre se registran una sola vez: leen los valores vigentes por ref.
  const valoresVigentes = useRef(valores);
  const maximoVigente = useRef(maximo);

  const [base, setBase] = useState<ClaveBase>(() => leerBaseGuardada());

  alClic.current = onClicRegion;
  alZoom.current = onZoom;
  valoresVigentes.current = valores;
  maximoVigente.current = maximo;

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) {
      return;
    }
    const instancia = new maplibregl.Map({
      container: nodo,
      style: estiloBase(esferico === true),
      center: centro,
      zoom,
      minZoom: zoomMinimo,
      maxZoom: zoomMaximo,
      attributionControl: false,
      // Sobre la esfera, girar e inclinar es la forma natural de mirar; en el plano no.
      dragRotate: esferico === true,
      pitchWithRotate: esferico === true,
    });
    instancia.addControl(
      new maplibregl.NavigationControl({ showCompass: esferico === true, visualizePitch: esferico === true }),
      "top-right",
    );
    instancia.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "Geometrías: MGN 2018 (DANE) y Natural Earth",
      }),
      "bottom-right",
    );
    instancia.on("zoomend", () => alZoom.current?.(instancia.getZoom()));
    mapa.current = instancia;
    globo.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8 });
    return () => {
      globo.current?.remove();
      globo.current = null;
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
      if (fuente) {
        (fuente as maplibregl.GeoJSONSource).setData(geojson);
        instancia.setPaintProperty(CAPA_RELLENO, "fill-color", color);
      } else {
        instancia.addSource(FUENTE, { type: "geojson", data: geojson });
        instancia.addLayer({
          id: CAPA_RELLENO,
          type: "fill",
          source: FUENTE,
          paint: { "fill-color": color, "fill-opacity": 0.95 },
        });
        instancia.addLayer({
          id: CAPA_BORDE,
          type: "line",
          source: FUENTE,
          paint: { "line-color": TEMA.fondo, "line-width": 0.7 },
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
          if (!rasgo || !globo.current) return;
          instancia.getCanvas().style.cursor = "pointer";
          const clave = leerTexto(rasgo.properties, claveGeo);
          const nombre = leerTexto(rasgo.properties, claveNombre) || clave;
          const valor = valoresVigentes.current.get(clave) ?? 0;
          globo.current
            .setLngLat(evento.lngLat)
            .setHTML(
              `<strong>${nombre}</strong><br/>${formatearEntero(valor)} ${unidad}`,
            )
            .addTo(instancia);
        });
        instancia.on("mouseleave", CAPA_RELLENO, () => {
          instancia.getCanvas().style.cursor = "";
          globo.current?.remove();
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

  /*
   * Fondo elegido. Encender una capa de imagen es lo único que dispara la descarga de
   * teselas; además la coropleta se vuelve translúcida y el hilo entre regiones cambia
   * de color, porque sobre una foto un borde oscuro desaparece.
   */
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia) {
      return;
    }
    const aplicar = () => {
      for (const remota of BASES_REMOTAS) {
        const capa = idCapaBase(remota.clave);
        if (instancia.getLayer(capa)) {
          instancia.setLayoutProperty(
            capa,
            "visibility",
            remota.clave === base ? "visible" : "none",
          );
        }
      }
      if (instancia.getLayer(CAPA_RELLENO)) {
        instancia.setPaintProperty(CAPA_RELLENO, "fill-opacity", baseDe(base).opacidadRelleno);
      }
      if (instancia.getLayer(CAPA_BORDE)) {
        instancia.setPaintProperty(CAPA_BORDE, "line-color", colorBorde(base));
      }
    };
    if (instancia.isStyleLoaded()) {
      aplicar();
    } else {
      void instancia.once("load", aplicar);
    }
  }, [base, geojson]);

  return (
    <div className="relative h-full w-full">
      <div ref={contenedor} className="h-full w-full" />

      <div
        role="group"
        aria-label="Fondo del mapa"
        className="absolute left-3 top-3 flex overflow-hidden rounded-md border border-borde bg-panel/90 backdrop-blur-sm"
      >
        {BASES.map((opcion) => (
          <button
            key={opcion.clave}
            type="button"
            aria-pressed={opcion.clave === base}
            title={opcion.descripcion}
            onClick={() => {
              setBase(opcion.clave);
              guardarBase(opcion.clave);
            }}
            className={cn(
              "px-2.5 py-1 text-xs transition-colors",
              opcion.clave === base
                ? "bg-elevado text-texto"
                : "text-apagado hover:bg-elevado/60 hover:text-texto",
            )}
          >
            {opcion.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}
