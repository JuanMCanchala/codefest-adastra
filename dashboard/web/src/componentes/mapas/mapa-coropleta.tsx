import type { FeatureCollection, Geometry } from "geojson";
import maplibregl, { type ExpressionSpecification, type StyleSpecification } from "maplibre-gl";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { type Prevision, useCapaSatelites } from "@/componentes/mapas/capa-satelites";
import { ControlesMapa } from "@/componentes/mapas/controles-mapa";
import { HudMapa, type Recuadro } from "@/componentes/mapas/hud-mapa";
import { PanelMisiones } from "@/componentes/mapas/panel-misiones";
import {
  BASES_REMOTAS,
  type ClaveBase,
  type MapaBase,
  RELIEVE,
  baseDe,
  colorBorde,
  guardarBase,
  guardarHud,
  guardarMisiones,
  guardarOrbitas,
  guardarVolumen,
  idCapaBase,
  idFuenteBase,
  leerBaseGuardada,
  leerHudGuardado,
  leerMisionesGuardadas,
  leerOrbitasGuardadas,
  leerVolumenGuardado,
  teselasDe,
  zoomMaximoTeselasDe,
} from "@/lib/mapa-base";
import type { ClaveMision, EstadoSatelite } from "@/lib/satelites";
import { usarPasadas } from "@/lib/usar-pasadas";
import { colorPorValor, sinDato } from "@/lib/paleta";
import { cn, formatearEntero } from "@/lib/utils";
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
      tiles: [...teselasDe(base)],
      tileSize: 256,
      maxzoom: zoomMaximoTeselasDe(base),
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
  estilo.sources[RELIEVE.id] = {
    type: "raster-dem",
    tiles: [...RELIEVE.teselas],
    tileSize: 256,
    maxzoom: RELIEVE.zoomMaximo,
    encoding: RELIEVE.codificacion,
    attribution: RELIEVE.atribucion,
  };
  if (globo) {
    estilo.projection = { type: "globe" };
    estilo.sky = {
      "sky-color": TEMA.mapaEspacio,
      "horizon-color": TEMA.control,
      "fog-color": TEMA.mapaEspacio,
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
const CAPA_VOLUMEN = "regiones-volumen";
/** Fronteras del nivel administrativo superior, dibujadas encima de la coropleta. */
const FUENTE_CONTORNO = "contorno";
const CAPA_CONTORNO = "contorno-linea";

/** Inclinación de la cámara con el volumen encendido: sin ella las columnas no se leen. */
const PITCH_VOLUMEN = 52;

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
  /**
   * Identidad de la consulta vigente. Cuando cambia —otra instrucción del agente u otros
   * filtros— la cámara reencuadra sobre las regiones con dato y destella la mayor. No
   * incluye el nivel del mapa, para no arrancarle el zoom al usuario al pasar a municipios.
   */
  enfoque?: string;
  /** Tope de zoom del reencuadre: evita que la cámara cruce sola un umbral de la vista. */
  zoomMaximoEnfoque?: number;
  /**
   * Orden de cámara de la vista: llevar el zoom a un valor concreto. `marca` distingue dos
   * órdenes seguidas al mismo zoom, para que un botón pulsado dos veces obedezca las dos.
   */
  ordenZoom?: { zoom: number; marca: number } | null;
  /** Altura en metros de la columna del valor máximo con el volumen 3D encendido. */
  escalaAltura?: number;
  /**
   * Capa de fronteras administrativas del nivel superior (Anexo B.4.2): al ver municipios,
   * los límites departamentales encima, para no perder la referencia. Se puede apagar.
   */
  contorno?: FeatureCollection | null;
  /**
   * Adornos de la vista que van sobre el lienzo —leyenda, nota de nivel— dibujados dentro
   * del contenedor del mapa. Van aquí y no como hermanos del componente porque en pantalla
   * completa el mapa se despega del flujo y los dejaría atrás.
   */
  superposicion?: ReactNode;
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

/**
 * Altura de cada columna, proporcional al valor. La raíz cuadrada es la misma compresión
 * que usa el color, para que volumen y matiz cuenten lo mismo y un máximo aislado no
 * aplaste al resto.
 */
function expresionAltura(
  valores: ReadonlyMap<string, number>,
  maximo: number,
  claveGeo: string,
  escala: number,
): ExpressionSpecification | number {
  const pares: (string | number)[] = [];
  for (const [clave, valor] of valores) {
    if (valor > 0 && maximo > 0) {
      pares.push(clave, Math.round(Math.sqrt(valor / maximo) * escala));
    }
  }
  if (pares.length === 0) {
    return 0;
  }
  return ["match", ["get", claveGeo], ...pares, 0] as unknown as ExpressionSpecification;
}

/**
 * Opacidad del relleno. Sobre imagen se desvanece al acercarse: a zoom de calle el color
 * del dato taparía el terreno, que es justo lo que se fue a mirar. Sobre el fondo analítico
 * se queda fija, porque debajo no hay nada que revelar.
 */
function expresionOpacidad(base: MapaBase): ExpressionSpecification | number {
  if (base.teselas === null) {
    return base.opacidadRelleno;
  }
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    6,
    base.opacidadRelleno,
    10,
    base.opacidadRelleno * 0.7,
    13,
    0.2,
  ] as unknown as ExpressionSpecification;
}

/** El hilo entre regiones gana cuerpo al acercarse, cuando el relleno ya casi no se ve. */
const ANCHO_BORDE = [
  "interpolate",
  ["linear"],
  ["zoom"],
  6,
  0.7,
  13,
  1.6,
] as unknown as ExpressionSpecification;

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

/** Caja que contiene todas las regiones con dato: el encuadre de la respuesta. */
function cajaDeValores(
  geojson: FeatureCollection,
  claveGeo: string,
  valores: ReadonlyMap<string, number>,
): Caja | null {
  let union: Caja | null = null;
  for (const rasgo of geojson.features) {
    const clave = leerTexto(rasgo.properties, claveGeo);
    if (!clave || (valores.get(clave) ?? 0) <= 0) {
      continue;
    }
    const caja = cajaDe(rasgo.geometry);
    if (!caja) continue;
    union = union
      ? [
          Math.min(union[0], caja[0]),
          Math.min(union[1], caja[1]),
          Math.max(union[2], caja[2]),
          Math.max(union[3], caja[3]),
        ]
      : caja;
  }
  return union;
}

function prefiereMenosMovimiento(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
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
  enfoque,
  zoomMaximoEnfoque,
  ordenZoom = null,
  contorno = null,
  escalaAltura = 150_000,
  superposicion,
}: Props) {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const globoEmergente = useRef<maplibregl.Popup | null>(null);
  const alClic = useRef(onClicRegion);
  const alZoom = useRef(onZoom);

  const [base, setBase] = useState<ClaveBase>(() => leerBaseGuardada());
  const [hud, setHud] = useState(() => leerHudGuardado());
  // La extrusión sobre la esfera de MapLibre se parte en fragmentos, así que el volumen
  // solo existe en el mapa plano; la preferencia guardada se ignora en el globo.
  const [volumen, setVolumen] = useState(() => leerVolumenGuardado());
  const volumenActivo = volumen && !globo;
  const [orbitas, setOrbitas] = useState(() => leerOrbitasGuardadas());
  const [misiones, setMisiones] = useState<ClaveMision[]>(() => leerMisionesGuardadas());
  const [panelMisiones, setPanelMisiones] = useState(true);
  const [telemetriaSat, setTelemetriaSat] = useState<ReadonlyMap<ClaveMision, EstadoSatelite>>(
    new Map(),
  );
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [zoomActual, setZoomActual] = useState(zoom);
  const [avisoBase, setAvisoBase] = useState<string | null>(null);
  // La cámara y el destello necesitan las capas ya añadidas; el estilo carga después del
  // primer render y la vista se vuelve a montar al cambiar de modo, así que no basta un ref.
  const [capasListas, setCapasListas] = useState(false);
  const [fronteras, setFronteras] = useState(true);
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
  const escalaVigente = useRef(escalaAltura);
  const alFalloBase = useRef<(clave: ClaveBase) => void>(() => {});

  alClic.current = onClicRegion;
  alZoom.current = onZoom;
  valoresVigentes.current = valores;
  maximoVigente.current = maximo;
  baseVigente.current = base;
  escalaVigente.current = escalaAltura;
  alFalloBase.current = (clave) => {
    if (clave !== baseVigente.current) return;
    setBase("analitico");
    guardarBase("analitico");
    setAvisoBase(`No se pudo descargar «${baseDe(clave).etiqueta}»: se volvió al fondo analítico.`);
  };

  const cambiarVolumen = (activo: boolean) => {
    setVolumen(activo);
    guardarVolumen(activo);
  };

  const cambiarHud = (activo: boolean) => {
    setHud(activo);
    guardarHud(activo);
  };

  const cambiarBase = (clave: ClaveBase) => {
    setBase(clave);
    guardarBase(clave);
    setAvisoBase(null);
  };

  const cambiarOrbitas = (activo: boolean) => {
    setOrbitas(activo);
    guardarOrbitas(activo);
  };

  const alternarMision = (clave: ClaveMision) => {
    setMisiones((previas) => {
      const siguientes = previas.includes(clave)
        ? previas.filter((c) => c !== clave)
        : [...previas, clave];
      guardarMisiones(siguientes);
      return siguientes;
    });
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
      // Navegación libre, como en un visor geoespacial: arrastrar mueve, rueda acerca,
      // botón derecho o Ctrl+arrastrar gira e inclina. La brújula devuelve el norte.
      dragRotate: true,
      pitchWithRotate: true,
    });
    instancia.addControl(
      new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
      "top-right",
    );
    instancia.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "Geometrías: MGN 2018 (DANE) y Natural Earth",
      }),
      "bottom-right",
    );
    instancia.on("zoomend", () => {
      setZoomActual(instancia.getZoom());
      alZoom.current?.(instancia.getZoom());
    });
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
      setCapasListas(true);
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
          paint: { "fill-color": color, "fill-opacity": expresionOpacidad(estiloBase) },
        });
        instancia.addLayer({
          id: CAPA_BORDE,
          type: "line",
          source: FUENTE,
          paint: { "line-color": colorBorde(baseVigente.current), "line-width": ANCHO_BORDE },
        });
        instancia.addLayer({
          id: CAPA_FOCO,
          type: "line",
          source: FUENTE,
          paint: { "line-color": TEMA.acento, "line-width": 2.5 },
          filter: ["==", ["get", claveGeo], ""],
        });
        instancia.addLayer({
          id: CAPA_VOLUMEN,
          type: "fill-extrusion",
          source: FUENTE,
          layout: { visibility: "none" },
          paint: {
            "fill-extrusion-color": color,
            "fill-extrusion-height": expresionAltura(
              valoresVigentes.current,
              maximoVigente.current,
              claveGeo,
              escalaVigente.current,
            ),
            "fill-extrusion-opacity": 0.9,
          },
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
            .setHTML(`<strong>${nombre}</strong><br/>${formatearEntero(valor)} ${unidad}`)
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
    const color = expresionColor(valores, maximo, claveGeo);
    instancia.setPaintProperty(CAPA_RELLENO, "fill-color", color);
    if (instancia.getLayer(CAPA_VOLUMEN)) {
      instancia.setPaintProperty(CAPA_VOLUMEN, "fill-extrusion-color", color);
      instancia.setPaintProperty(
        CAPA_VOLUMEN,
        "fill-extrusion-height",
        expresionAltura(valores, maximo, claveGeo, escalaAltura),
      );
    }
  }, [claveGeo, escalaAltura, maximo, valores]);

  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia?.getLayer(CAPA_FOCO)) {
      return;
    }
    instancia.setFilter(CAPA_FOCO, ["==", ["get", claveGeo], seleccionada ?? ""]);
  }, [claveGeo, seleccionada]);

  // Fronteras superiores: fuente y capa propias, por encima del relleno y del borde fino.
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia || !capasListas) {
      return;
    }
    const visible = Boolean(contorno) && fronteras;
    if (contorno) {
      const fuente = instancia.getSource(FUENTE_CONTORNO);
      if (fuente) {
        (fuente as maplibregl.GeoJSONSource).setData(contorno);
      } else {
        instancia.addSource(FUENTE_CONTORNO, { type: "geojson", data: contorno });
      }
      if (!instancia.getLayer(CAPA_CONTORNO)) {
        instancia.addLayer({
          id: CAPA_CONTORNO,
          type: "line",
          source: FUENTE_CONTORNO,
          layout: { "line-join": "round" },
          paint: {
            "line-color": TEMA.texto,
            "line-width": 1.4,
            "line-opacity": 0.75,
            "line-dasharray": [3, 2],
          },
        });
      }
    }
    if (instancia.getLayer(CAPA_CONTORNO)) {
      instancia.setLayoutProperty(CAPA_CONTORNO, "visibility", visible ? "visible" : "none");
    }
  }, [capasListas, contorno, fronteras]);

  // Cámara dirigida por la consulta: cada respuesta encuadra el mapa sobre las regiones que
  // tienen dato. Solo se mueve al cambiar la consulta, nunca mientras el usuario navega a
  // mano, y si la respuesta no trae datos se queda donde está.
  const enfoqueAplicado = useRef<string | null>(null);

  /** Lleva la cámara a la caja de las regiones con dato. `false` si no hay nada que encuadrar. */
  const encuadrarDatos = useCallback((): boolean => {
    const instancia = mapa.current;
    if (!instancia) {
      return false;
    }
    const caja = cajaDeValores(geojson, claveGeo, valores);
    if (!caja) {
      return false;
    }
    instancia.fitBounds(caja, {
      padding: 48,
      duration: prefiereMenosMovimiento() ? 0 : 1_400,
      ...(zoomMaximoEnfoque === undefined ? {} : { maxZoom: zoomMaximoEnfoque }),
    });
    return true;
  }, [claveGeo, geojson, valores, zoomMaximoEnfoque]);

  useEffect(() => {
    if (!mapa.current || !enfoque || !capasListas || enfoqueAplicado.current === enfoque) {
      return;
    }
    if (encuadrarDatos()) {
      enfoqueAplicado.current = enfoque;
    }
  }, [capasListas, encuadrarDatos, enfoque]);

  // Volumen 3D: la coropleta se levanta en columnas proporcionales al dato y la cámara se
  // inclina, porque en planta una extrusión no se distingue de un relleno. El relieve del
  // terreno solo acompaña a la imagen: sobre el fondo analítico sería ruido sin referencia.
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia || !capasListas || !instancia.getLayer(CAPA_VOLUMEN)) {
      return;
    }
    instancia.setLayoutProperty(CAPA_VOLUMEN, "visibility", volumenActivo ? "visible" : "none");
    instancia.setLayoutProperty(CAPA_RELLENO, "visibility", volumenActivo ? "none" : "visible");

    const conRelieve = volumenActivo && base !== "analitico";
    instancia.setTerrain(
      conRelieve ? { source: RELIEVE.id, exaggeration: RELIEVE.exageracion } : null,
    );

    // Solo se toca la cámara si hay algo que cambiar: un easeTo en plano y sin inclinación
    // no haría nada salvo interrumpir el reencuadre de la consulta, que corre a la vez.
    if (volumenActivo || instancia.getPitch() !== 0) {
      instancia.easeTo({
        pitch: volumenActivo ? PITCH_VOLUMEN : 0,
        bearing: volumenActivo ? instancia.getBearing() : 0,
        duration: prefiereMenosMovimiento() ? 0 : 700,
      });
    }
  }, [base, capasListas, volumenActivo]);

  // Orden de zoom pedida con un botón (p. ej. «Municipios»): la cámara va al zoom pedido
  // sobre su centro actual, y es `zoomend` quien luego confirma el nivel a la vista.
  //
  // Solo obedece a la marca: si además dependiera de `capasListas`, al cambiar la geometría
  // se relanzaría el mismo easeTo, MapLibre cortaría el que estaba en curso y `zoomend`
  // saltaría a medio camino, por debajo del umbral, devolviendo el nivel anterior un instante.
  const zoomPedido = ordenZoom?.zoom;
  const marcaPedida = ordenZoom?.marca;
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia || zoomPedido === undefined || marcaPedida === undefined) {
      return;
    }
    instancia.easeTo({ zoom: zoomPedido, duration: prefiereMenosMovimiento() ? 0 : 600 });
    // `zoomPedido` cambia siempre con la marca; la marca es la única orden nueva.
  }, [marcaPedida]);

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
        instancia.setPaintProperty(CAPA_RELLENO, "fill-opacity", expresionOpacidad(estiloBase));
        instancia.setPaintProperty(CAPA_BORDE, "line-color", colorBorde(base));
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
    const rasgo = geojson.features.find((f) => leerTexto(f.properties, claveGeo) === seleccionada);
    return cajaDe(rasgo?.geometry ?? null);
  }, [claveGeo, geojson, seleccionada]);

  const nombreSeleccion = useMemo(() => {
    if (!seleccionada) return null;
    const rasgo = geojson.features.find((f) => leerTexto(f.properties, claveGeo) === seleccionada);
    return rasgo ? leerTexto(rasgo.properties, claveNombre) || seleccionada : null;
  }, [claveGeo, claveNombre, geojson, seleccionada]);

  /**
   * Punto sobre el que se calculan las pasadas: el centro de la región seleccionada. Sin
   * selección no hay objetivo —el centro de la cámara se movería con cada arrastre y el
   * barrido se relanzaría sin parar— y el panel lo pide en vez de inventarse uno.
   */
  const objetivo = useMemo<[number, number] | null>(
    () => (caja ? [(caja[0] + caja[2]) / 2, (caja[1] + caja[3]) / 2] : null),
    [caja],
  );

  const pasadas = usarPasadas(objetivo, misiones, orbitas);

  const previsiones = useMemo<Prevision[]>(() => {
    const salida: Prevision[] = [];
    for (const clave of misiones) {
      const proxima = pasadas.porMision.get(clave)?.proxima;
      if (proxima) {
        salida.push({ clave, inicio: proxima.inicio, fin: proxima.fin });
      }
    }
    return salida;
  }, [misiones, pasadas]);

  useCapaSatelites({
    mapa,
    listo: capasListas,
    activa: orbitas,
    seleccionadas: misiones,
    previsiones,
    onTelemetria: setTelemetriaSat,
  });

  /**
   * Pantalla completa. El mapa vive en una banda de 520 px dentro del tablero, que alcanza
   * para leer la coropleta pero no para navegar el terreno ni para tener los paneles
   * abiertos. Con esto el lienzo toma la ventana entera; `Esc` lo devuelve a su sitio.
   */
  useEffect(() => {
    if (!pantallaCompleta) {
      return;
    }
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setPantallaCompleta(false);
    };
    window.addEventListener("keydown", alTeclear);
    // Sin esto la rueda del ratón sobre el borde del mapa desplazaría la página de detrás.
    const desbordePrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = desbordePrevio;
    };
  }, [pantallaCompleta]);

  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia) {
      return;
    }
    // El contenedor cambia de tamaño en el mismo cuadro: MapLibre necesita que se lo digan.
    //
    // Y hay que ajustar el zoom a mano. `resize` conserva centro y zoom, así que al triplicar
    // el lienzo se ve más territorio y todo queda más pequeño: justo lo contrario de lo que
    // pide quien pulsa «Ampliar». Se sube el zoom en la proporción en que creció el lienzo,
    // con lo que el mismo trozo de terreno llena la ventana. Reencuadrar sobre los datos
    // sería más simple pero le arrancaría la posición a quien estuviera mirando una mina.
    const lienzo = instancia.getCanvas();
    const anchoPrevio = lienzo.clientWidth;
    const altoPrevio = lienzo.clientHeight;
    const pendiente = requestAnimationFrame(() => {
      instancia.resize();
      const crecimiento = Math.min(
        lienzo.clientWidth / Math.max(anchoPrevio, 1),
        lienzo.clientHeight / Math.max(altoPrevio, 1),
      );
      if (crecimiento > 0 && Number.isFinite(crecimiento) && Math.abs(crecimiento - 1) > 0.01) {
        instancia.easeTo({
          zoom: instancia.getZoom() + Math.log2(crecimiento),
          duration: prefiereMenosMovimiento() ? 0 : 400,
        });
      }
    });
    return () => cancelAnimationFrame(pendiente);
  }, [pantallaCompleta]);

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
    <div
      className={cn(
        "relative h-full w-full",
        pantallaCompleta && "fixed inset-0 z-40 h-screen w-screen bg-fondo",
      )}
    >
      <div ref={contenedor} className="h-full w-full" />
      {superposicion}
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
      <ControlesMapa
        base={base}
        onCambiarBase={cambiarBase}
        hud={hud}
        onCambiarHud={cambiarHud}
        volumen={volumenActivo}
        onCambiarVolumen={cambiarVolumen}
        mostrarVolumen={!globo}
        onEncuadrar={() => {
          encuadrarDatos();
        }}
        orbitas={orbitas}
        onCambiarOrbitas={cambiarOrbitas}
        mostrarFronteras={Boolean(contorno)}
        fronteras={fronteras}
        onCambiarFronteras={setFronteras}
        pantallaCompleta={pantallaCompleta}
        onCambiarPantallaCompleta={setPantallaCompleta}
      />
      {orbitas ? (
        <PanelMisiones
          abierto={panelMisiones}
          onAlternarAbierto={() => setPanelMisiones((previo) => !previo)}
          seleccionadas={misiones}
          onAlternarMision={alternarMision}
          estados={telemetriaSat}
          pasadas={pasadas}
          objetivoEtiqueta={nombreSeleccion}
        />
      ) : null}
      {/*
        A partir de aquí el fondo analítico es un color plano: se puede seguir acercando,
        pero no hay nada que ver. En vez de dejar al usuario creyendo que el mapa no da más,
        se le ofrece la imagen, que es lo que estaba buscando.
      */}
      {base === "analitico" && zoomActual >= 11 ? (
        <button
          type="button"
          onClick={() => cambiarBase("satelite")}
          className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 rounded border border-acento/60 bg-panel/95 px-2.5 py-1 text-xs text-texto hover:bg-elevado"
        >
          A este detalle el fondo analítico ya no muestra terreno · ver imagen satelital
        </button>
      ) : null}
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
