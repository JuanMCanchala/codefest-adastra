import type { Feature, FeatureCollection, LineString, Polygon } from "geojson";
import maplibregl from "maplibre-gl";
import { type RefObject, useEffect, useRef } from "react";

import {
  type ClaveMision,
  type EstadoSatelite,
  estadoEn,
  franjaDeTramo,
  misionDe,
  registroDe,
  trazaEntre,
} from "@/lib/satelites";

/**
 * Capa de misiones sobre el mapa: traza en tierra, franja del sensor y posición actual de
 * cada satélite, recalculadas con SGP4 una vez por segundo en el navegador.
 *
 * El nombre de cada satélite va en un marcador HTML y no en una capa `symbol` a propósito:
 * las capas de texto de MapLibre exigen un servidor de glifos remoto, y el tablero tiene que
 * abrir sin red (PRODUCT.md §45).
 */

export const FUENTE_TRAZA = "satelites-traza";
export const FUENTE_FRANJA = "satelites-franja";
export const FUENTE_PREVISION = "satelites-prevision";
export const CAPA_FRANJA = "satelites-franja-relleno";
export const CAPA_TRAZA_PASADA = "satelites-traza-pasada";
export const CAPA_TRAZA_FUTURA = "satelites-traza-futura";
export const CAPA_PREVISION_RELLENO = "satelites-prevision-relleno";
export const CAPA_PREVISION_BORDE = "satelites-prevision-borde";

/** Minutos de traza dibujados hacia atrás y hacia adelante: algo más de media órbita. */
const MINUTOS_TRAZA = 40;
/** Paso de muestreo de la traza, en segundos. */
const PASO_TRAZA_S = 20;
/** Minutos de franja dibujada hacia adelante: lo que el sensor está a punto de barrer. */
const MINUTOS_FRANJA = 12;
/** Cadencia de actualización. Un hercio se lee como telemetría y no castiga la CPU. */
const CADENCIA_MS = 1_000;
/**
 * Minutos de margen a cada lado de una pasada prevista. La pasada sobre un punto dura medio
 * minuto; con este margen la franja se dibuja como una banda que cruza el país entero, que
 * es lo que el satélite va a capturar de verdad.
 */
const MARGEN_PREVISION_MIN = 4;

const VACIO: FeatureCollection = { type: "FeatureCollection", features: [] };

function marcadorDe(color: string, nombre: string): HTMLElement {
  // Estilos en línea y no clases de Tailwind: el elemento vive fuera del árbol de React.
  const raiz = document.createElement("div");
  raiz.style.cssText = "display:flex;align-items:center;gap:6px;pointer-events:none;";

  const punto = document.createElement("span");
  punto.style.cssText = [
    "width:9px",
    "height:9px",
    "border-radius:9999px",
    `background:${color}`,
    `box-shadow:0 0 0 3px ${color}33, 0 0 10px ${color}`,
    "flex:none",
  ].join(";");

  const etiqueta = document.createElement("span");
  etiqueta.textContent = nombre;
  etiqueta.style.cssText = [
    "font-family:var(--font-mono, ui-monospace, monospace)",
    "font-size:11px",
    "line-height:1",
    "white-space:nowrap",
    `color:${color}`,
    "background:rgba(11,20,38,0.85)",
    "border:1px solid rgba(29,44,71,0.9)",
    "border-radius:3px",
    "padding:2px 4px",
  ].join(";");

  raiz.append(punto, etiqueta);
  return raiz;
}

/** Pasada prevista que se dibuja como banda sobre el territorio. */
export interface Prevision {
  clave: ClaveMision;
  inicio: Date;
  fin: Date;
}

interface Params {
  mapa: RefObject<maplibregl.Map | null>;
  /** Las capas de regiones ya existen: las órbitas se dibujan encima. */
  listo: boolean;
  activa: boolean;
  seleccionadas: readonly ClaveMision[];
  /**
   * Próxima pasada de cada misión sobre el territorio elegido. Es lo que hace útil la capa
   * sobre Colombia: el satélite casi nunca está encima ahora mismo, pero la banda que va a
   * capturar dentro de unas horas sí cruza el mapa.
   */
  previsiones: readonly Prevision[];
  /** Estados del último cuadro, para que el panel muestre altura y velocidad en vivo. */
  onTelemetria?: (estados: ReadonlyMap<ClaveMision, EstadoSatelite>) => void;
}

export function useCapaSatelites({
  mapa,
  listo,
  activa,
  seleccionadas,
  previsiones,
  onTelemetria,
}: Params): void {
  const marcadores = useRef(new Map<ClaveMision, maplibregl.Marker>());
  const alTelemetria = useRef(onTelemetria);
  alTelemetria.current = onTelemetria;

  // Alta de fuentes y capas, una sola vez por instancia de mapa.
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia || !listo || instancia.getSource(FUENTE_TRAZA)) {
      return;
    }
    instancia.addSource(FUENTE_PREVISION, { type: "geojson", data: VACIO });
    instancia.addSource(FUENTE_FRANJA, { type: "geojson", data: VACIO });
    instancia.addSource(FUENTE_TRAZA, { type: "geojson", data: VACIO });
    instancia.addLayer({
      id: CAPA_PREVISION_RELLENO,
      type: "fill",
      source: FUENTE_PREVISION,
      layout: { visibility: "none" },
      paint: { "fill-color": ["get", "color"], "fill-opacity": 0.1 },
    });
    instancia.addLayer({
      id: CAPA_PREVISION_BORDE,
      type: "line",
      source: FUENTE_PREVISION,
      layout: { visibility: "none" },
      paint: {
        "line-color": ["get", "color"],
        "line-width": 1,
        "line-opacity": 0.6,
        "line-dasharray": [4, 3],
      },
    });
    instancia.addLayer({
      id: CAPA_FRANJA,
      type: "fill",
      source: FUENTE_FRANJA,
      layout: { visibility: "none" },
      paint: { "fill-color": ["get", "color"], "fill-opacity": 0.14 },
    });
    instancia.addLayer({
      id: CAPA_TRAZA_PASADA,
      type: "line",
      source: FUENTE_TRAZA,
      filter: ["==", ["get", "futuro"], false],
      layout: { visibility: "none", "line-cap": "round" },
      paint: {
        "line-color": ["get", "color"],
        "line-width": 1.2,
        "line-opacity": 0.4,
        "line-dasharray": [2, 2],
      },
    });
    instancia.addLayer({
      id: CAPA_TRAZA_FUTURA,
      type: "line",
      source: FUENTE_TRAZA,
      filter: ["==", ["get", "futuro"], true],
      layout: { visibility: "none", "line-cap": "round" },
      paint: { "line-color": ["get", "color"], "line-width": 1.8, "line-opacity": 0.9 },
    });
  }, [listo, mapa]);

  // Dibujo por cuadro. Se detiene entero con la capa apagada: sin órbitas no hay cálculo.
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia || !listo || !instancia.getLayer(CAPA_TRAZA_FUTURA)) {
      return;
    }
    const visibilidad = activa ? "visible" : "none";
    for (const capa of [
      CAPA_PREVISION_RELLENO,
      CAPA_PREVISION_BORDE,
      CAPA_FRANJA,
      CAPA_TRAZA_PASADA,
      CAPA_TRAZA_FUTURA,
    ]) {
      instancia.setLayoutProperty(capa, "visibility", visibilidad);
    }

    const vigentes = marcadores.current;
    if (!activa) {
      for (const marcador of vigentes.values()) marcador.remove();
      vigentes.clear();
      return;
    }

    // Marcadores de las misiones que ya no están encendidas.
    for (const [clave, marcador] of vigentes) {
      if (!seleccionadas.includes(clave)) {
        marcador.remove();
        vigentes.delete(clave);
      }
    }

    const dibujar = () => {
      const ahora = new Date();
      const trazas: Feature<LineString>[] = [];
      const franjas: Feature<Polygon>[] = [];
      const estados = new Map<ClaveMision, EstadoSatelite>();

      for (const clave of seleccionadas) {
        const registro = registroDe(clave);
        if (!registro) continue;
        const mision = misionDe(clave);

        const estado = estadoEn(registro, ahora);
        if (estado) {
          estados.set(clave, estado);
          let marcador = vigentes.get(clave);
          if (!marcador) {
            marcador = new maplibregl.Marker({
              element: marcadorDe(mision.color, mision.nombre),
              anchor: "left",
              offset: [-4, 0],
            });
            // El orden importa: `addTo` dibuja de inmediato y sin posición revienta.
            marcador.setLngLat([estado.lng, estado.lat]).addTo(instancia);
            vigentes.set(clave, marcador);
          } else {
            marcador.setLngLat([estado.lng, estado.lat]);
          }
        }

        const desde = new Date(ahora.getTime() - MINUTOS_TRAZA * 60_000);
        const hasta = new Date(ahora.getTime() + MINUTOS_TRAZA * 60_000);
        for (const tramo of trazaEntre(registro, desde, ahora, PASO_TRAZA_S)) {
          trazas.push({
            type: "Feature",
            properties: { color: mision.color, futuro: false, mision: clave },
            geometry: { type: "LineString", coordinates: tramo },
          });
        }
        for (const tramo of trazaEntre(registro, ahora, hasta, PASO_TRAZA_S)) {
          trazas.push({
            type: "Feature",
            properties: { color: mision.color, futuro: true, mision: clave },
            geometry: { type: "LineString", coordinates: tramo },
          });
        }

        const finFranja = new Date(ahora.getTime() + MINUTOS_FRANJA * 60_000);
        for (const tramo of trazaEntre(registro, ahora, finFranja, PASO_TRAZA_S)) {
          const anillo = franjaDeTramo(tramo, mision.franjaKm);
          if (anillo) {
            franjas.push({
              type: "Feature",
              properties: { color: mision.color, mision: clave },
              geometry: { type: "Polygon", coordinates: [anillo] },
            });
          }
        }
      }

      const fuenteTraza = instancia.getSource<maplibregl.GeoJSONSource>(FUENTE_TRAZA);
      const fuenteFranja = instancia.getSource<maplibregl.GeoJSONSource>(FUENTE_FRANJA);
      fuenteTraza?.setData({ type: "FeatureCollection", features: trazas });
      fuenteFranja?.setData({ type: "FeatureCollection", features: franjas });
      alTelemetria.current?.(estados);
    };

    dibujar();
    const reloj = window.setInterval(dibujar, CADENCIA_MS);
    return () => {
      window.clearInterval(reloj);
    };
  }, [activa, listo, mapa, seleccionadas]);

  // Bandas previstas. No dependen del reloj —la pasada es a una hora fija— así que se
  // recalculan solo cuando cambia el territorio elegido o la lista de misiones.
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia || !listo || !instancia.getSource(FUENTE_PREVISION)) {
      return;
    }
    const bandas: Feature<Polygon>[] = [];
    if (activa) {
      const margen = MARGEN_PREVISION_MIN * 60_000;
      for (const prevision of previsiones) {
        const registro = registroDe(prevision.clave);
        if (!registro) continue;
        const mision = misionDe(prevision.clave);
        const desde = new Date(prevision.inicio.getTime() - margen);
        const hasta = new Date(prevision.fin.getTime() + margen);
        for (const tramo of trazaEntre(registro, desde, hasta, PASO_TRAZA_S)) {
          const anillo = franjaDeTramo(tramo, mision.franjaKm);
          if (anillo) {
            bandas.push({
              type: "Feature",
              properties: { color: mision.color, mision: prevision.clave },
              geometry: { type: "Polygon", coordinates: [anillo] },
            });
          }
        }
      }
    }
    instancia
      .getSource<maplibregl.GeoJSONSource>(FUENTE_PREVISION)
      ?.setData({ type: "FeatureCollection", features: bandas });
  }, [activa, listo, mapa, previsiones]);

  // El mapa se destruye al cambiar de vista: los marcadores se van con él.
  useEffect(() => {
    const vigentes = marcadores.current;
    return () => {
      for (const marcador of vigentes.values()) marcador.remove();
      vigentes.clear();
    };
  }, []);
}
