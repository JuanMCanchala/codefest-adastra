import type { FeatureCollection } from "geojson";
import maplibregl, { type ExpressionSpecification, type StyleSpecification } from "maplibre-gl";
import { useEffect, useRef } from "react";

import { SIN_DATO, colorPorValor } from "@/lib/paleta";
import { formatearEntero } from "@/lib/utils";
import { TEMA } from "@/lib/tema";

/** Fondo sin mapa base remoto: la SPA no depende de tokens ni de teselas externas. */
const ESTILO: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "lienzo", type: "background", paint: { "background-color": TEMA.mapaFondo } }],
};

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
}: Props) {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const globo = useRef<maplibregl.Popup | null>(null);
  const alClic = useRef(onClicRegion);
  const alZoom = useRef(onZoom);

  // Los manejadores de MapLibre se registran una sola vez: leen los valores vigentes por ref.
  const valoresVigentes = useRef(valores);
  const maximoVigente = useRef(maximo);

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
      style: ESTILO,
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

  return <div ref={contenedor} className="h-full w-full" />;
}
