import {
  type SatRec,
  SatRecError,
  degreesLat,
  degreesLong,
  eciToGeodetic,
  gstime,
  propagate,
  twoline2satrec,
} from "satellite.js";

import { TLE } from "@/lib/tle-generado";

/**
 * Misiones satelitales sobre el mapa.
 *
 * Esto no es adorno: son las plataformas que producen la evidencia satelital del proyecto.
 * Los modelos de Amazon Mining Watch corren sobre Sentinel-2, y los focos de calor de los
 * informes salen de MODIS y VIIRS. Dibujar dónde está cada una —y cuándo vuelve a mirar un
 * municipio— explica por qué una alerta tiene la fecha que tiene.
 *
 * Todo se calcula en el navegador con SGP4 a partir de TLE embebidos: no hay servicio
 * remoto, ni llave, ni una sola petición de red (PRODUCT.md §45).
 */

export type ClaveMision =
  | "sentinel-2a"
  | "sentinel-2b"
  | "sentinel-2c"
  | "sentinel-1a"
  | "landsat-8"
  | "landsat-9"
  | "terra"
  | "aqua"
  | "noaa-20"
  | "noaa-21";

export interface Mision {
  clave: ClaveMision;
  /** Llave en el catálogo TLE generado. */
  tle: keyof typeof TLE;
  nombre: string;
  /** Programa al que pertenece: agrupa el panel. */
  familia: string;
  /** Sensor y resolución, en los términos en que se cita en los informes. */
  sensor: string;
  /** Ancho en tierra de lo que el sensor cubre en una pasada, en kilómetros. */
  franjaKm: number;
  color: string;
  /** Qué aporta a este tablero. Ninguna capa entra al mapa sin decir para qué sirve. */
  aporte: string;
  /**
   * `true` para los sensores que solo sirven con luz del día: un óptico que cruza de noche
   * no fotografía nada, y anunciar esa pasada mentiría sobre cuándo habrá imagen.
   */
  requiereLuz: boolean;
  /** Días que hay que mirar para hallar una pasada: el ciclo de repetición de la órbita. */
  ventanaDias: number;
  /** Encendida al abrir: solo las que sostienen la evidencia que el tablero ya cita. */
  porDefecto: boolean;
}

export const MISIONES: readonly Mision[] = [
  {
    clave: "sentinel-2a",
    tle: "SENTINEL-2A",
    nombre: "Sentinel-2A",
    familia: "Copernicus · ESA",
    sensor: "Óptico multiespectral, 10 m",
    franjaKm: 290,
    color: "#8cb4ff",
    aporte: "Fuente de los modelos de Amazon Mining Watch que detectan minería aluvial.",
    requiereLuz: true,
    ventanaDias: 11,
    porDefecto: true,
  },
  {
    clave: "sentinel-2b",
    tle: "SENTINEL-2B",
    nombre: "Sentinel-2B",
    familia: "Copernicus · ESA",
    sensor: "Óptico multiespectral, 10 m",
    franjaKm: 290,
    color: "#8cb4ff",
    aporte: "Gemelo de 2A: entre los dos bajan la revisita a unos cinco días.",
    requiereLuz: true,
    ventanaDias: 11,
    porDefecto: true,
  },
  {
    clave: "sentinel-2c",
    tle: "SENTINEL-2C",
    nombre: "Sentinel-2C",
    familia: "Copernicus · ESA",
    sensor: "Óptico multiespectral, 10 m",
    franjaKm: 290,
    color: "#8cb4ff",
    aporte: "Relevo de 2A en órbita desde 2024; misma franja y misma resolución.",
    requiereLuz: true,
    ventanaDias: 11,
    porDefecto: true,
  },
  {
    clave: "sentinel-1a",
    tle: "SENTINEL-1A",
    nombre: "Sentinel-1A",
    familia: "Copernicus · ESA",
    sensor: "Radar SAR banda C, 5 × 20 m",
    franjaKm: 250,
    color: "#7ce0c8",
    aporte: "El radar atraviesa la nube: en Amazonía y Pacífico ve lo que el óptico no.",
    requiereLuz: false,
    ventanaDias: 12,
    porDefecto: true,
  },
  {
    clave: "landsat-8",
    tle: "LANDSAT 8",
    nombre: "Landsat 8",
    familia: "Landsat · NASA-USGS",
    sensor: "Óptico y térmico, 30 m",
    franjaKm: 185,
    color: "#e8b64c",
    aporte: "Serie histórica larga: sirve para fechar el antes y el después de una mina.",
    requiereLuz: true,
    ventanaDias: 16,
    porDefecto: false,
  },
  {
    clave: "landsat-9",
    tle: "LANDSAT 9",
    nombre: "Landsat 9",
    familia: "Landsat · NASA-USGS",
    sensor: "Óptico y térmico, 30 m",
    franjaKm: 185,
    color: "#e8b64c",
    aporte: "Intercalado con Landsat 8 a ocho días de diferencia sobre el mismo punto.",
    requiereLuz: true,
    ventanaDias: 16,
    porDefecto: false,
  },
  {
    clave: "terra",
    tle: "TERRA",
    nombre: "Terra (MODIS)",
    familia: "EOS · NASA",
    sensor: "MODIS, 250 m a 1 km",
    franjaKm: 2330,
    color: "#f08a7a",
    aporte: "Focos de calor diurnos: el insumo clásico de las alertas de quema.",
    requiereLuz: false,
    ventanaDias: 3,
    porDefecto: false,
  },
  {
    clave: "aqua",
    tle: "AQUA",
    nombre: "Aqua (MODIS)",
    familia: "EOS · NASA",
    sensor: "MODIS, 250 m a 1 km",
    franjaKm: 2330,
    color: "#f08a7a",
    aporte: "Pareja vespertina de Terra; entre ambos cubren el país varias veces al día.",
    requiereLuz: false,
    ventanaDias: 3,
    porDefecto: false,
  },
  {
    clave: "noaa-20",
    tle: "NOAA 20 (JPSS-1)",
    nombre: "NOAA-20 (VIIRS)",
    familia: "JPSS · NOAA-NASA",
    sensor: "VIIRS, 375 m",
    franjaKm: 3040,
    color: "#c79ce8",
    aporte: "Detecta focos de calor más pequeños que MODIS, también de noche.",
    requiereLuz: false,
    ventanaDias: 3,
    porDefecto: false,
  },
  {
    clave: "noaa-21",
    tle: "NOAA 21 (JPSS-2)",
    nombre: "NOAA-21 (VIIRS)",
    familia: "JPSS · NOAA-NASA",
    sensor: "VIIRS, 375 m",
    franjaKm: 3040,
    color: "#c79ce8",
    aporte: "Segundo VIIRS operativo: acorta la espera entre revisiones nocturnas.",
    requiereLuz: false,
    ventanaDias: 3,
    porDefecto: false,
  },
] as const;

export function misionDe(clave: ClaveMision): Mision {
  return MISIONES.find((m) => m.clave === clave) ?? MISIONES[0]!;
}

/** Claves encendidas al abrir el tablero. */
export const MISIONES_POR_DEFECTO: readonly ClaveMision[] = MISIONES.filter(
  (m) => m.porDefecto,
).map((m) => m.clave);

// --- Propagación ---------------------------------------------------------------------

const RADIO_TIERRA_KM = 6371;

const registros = new Map<ClaveMision, SatRec | null>();

/** `SatRec` de la misión, construido una sola vez. `null` si el TLE no se pudo leer. */
export function registroDe(clave: ClaveMision): SatRec | null {
  if (registros.has(clave)) {
    return registros.get(clave) ?? null;
  }
  const mision = misionDe(clave);
  const par = TLE[mision.tle];
  let registro: SatRec | null = null;
  if (par) {
    try {
      const candidato = twoline2satrec(par[0], par[1]);
      registro = candidato.error === SatRecError.None ? candidato : null;
    } catch {
      registro = null;
    }
  }
  registros.set(clave, registro);
  return registro;
}

export interface EstadoSatelite {
  lng: number;
  lat: number;
  alturaKm: number;
  velocidadKms: number;
}

/** Punto sobre el terreno bajo el satélite en ese instante, o `null` si SGP4 falla. */
export function estadoEn(registro: SatRec, fecha: Date): EstadoSatelite | null {
  let resultado;
  try {
    resultado = propagate(registro, fecha);
  } catch {
    return null;
  }
  if (!resultado) {
    return null;
  }
  const geodesica = eciToGeodetic(resultado.position, gstime(fecha));
  const lng = degreesLong(geodesica.longitude);
  const lat = degreesLat(geodesica.latitude);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }
  const { x, y, z } = resultado.velocity;
  return {
    lng,
    lat,
    alturaKm: geodesica.height,
    velocidadKms: Math.sqrt(x * x + y * y + z * z),
  };
}

/** Solo la posición en tierra: evita construir el objeto completo en los barridos. */
function subpunto(registro: SatRec, fecha: Date): [number, number] | null {
  const estado = estadoEn(registro, fecha);
  return estado ? [estado.lng, estado.lat] : null;
}

const RAD = Math.PI / 180;

/** Distancia sobre la superficie entre dos puntos geográficos, en kilómetros. */
export function distanciaKm(a: [number, number], b: [number, number]): number {
  const dLat = (b[1] - a[1]) * RAD;
  const dLng = (b[0] - a[0]) * RAD;
  const lat1 = a[1] * RAD;
  const lat2 = b[1] * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Traza sobre el terreno entre dos instantes, partida en tramos allí donde cruza el
 * antimeridiano: una línea que va de +179° a −179° en un paso se dibujaría atravesando
 * todo el mapa.
 */
export function trazaEntre(
  registro: SatRec,
  desde: Date,
  hasta: Date,
  pasoSegundos: number,
): [number, number][][] {
  const tramos: [number, number][][] = [];
  let actual: [number, number][] = [];
  let anterior: [number, number] | null = null;
  for (let t = desde.getTime(); t <= hasta.getTime(); t += pasoSegundos * 1_000) {
    const punto = subpunto(registro, new Date(t));
    if (!punto) {
      continue;
    }
    if (anterior && Math.abs(punto[0] - anterior[0]) > 180) {
      if (actual.length > 1) tramos.push(actual);
      actual = [];
    }
    actual.push(punto);
    anterior = punto;
  }
  if (actual.length > 1) {
    tramos.push(actual);
  }
  return tramos;
}

/** Rumbo inicial de a hacia b, en grados. */
function rumbo(a: [number, number], b: [number, number]): number {
  const lat1 = a[1] * RAD;
  const lat2 = b[1] * RAD;
  const dLng = (b[0] - a[0]) * RAD;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return Math.atan2(y, x) / RAD;
}

/** Punto a `km` de distancia desde `origen` siguiendo `rumboGrados`. */
function desplazar(
  origen: [number, number],
  rumboGrados: number,
  km: number,
): [number, number] {
  const d = km / RADIO_TIERRA_KM;
  const b = rumboGrados * RAD;
  const lat1 = origen[1] * RAD;
  const lng1 = origen[0] * RAD;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
  return [lng2 / RAD, lat2 / RAD];
}

/**
 * Polígono de la franja que el sensor barre a lo largo de un tramo de traza: el tramo
 * desplazado media franja a cada lado. Es la respuesta visual a «¿qué va a fotografiar?».
 */
export function franjaDeTramo(
  tramo: readonly [number, number][],
  anchoKm: number,
): [number, number][] | null {
  if (tramo.length < 2) {
    return null;
  }
  const mitad = anchoKm / 2;
  const izquierda: [number, number][] = [];
  const derecha: [number, number][] = [];
  for (let i = 0; i < tramo.length; i += 1) {
    const actual = tramo[i]!;
    const siguiente = tramo[Math.min(i + 1, tramo.length - 1)]!;
    const previo = tramo[Math.max(i - 1, 0)]!;
    const direccion = rumbo(previo, siguiente);
    izquierda.push(desplazar(actual, direccion - 90, mitad));
    derecha.push(desplazar(actual, direccion + 90, mitad));
  }
  derecha.reverse();
  const anillo = [...izquierda, ...derecha];
  anillo.push(anillo[0]!);
  return anillo;
}

// --- Luz solar -----------------------------------------------------------------------

/**
 * Altura del Sol sobre el horizonte en un punto, en grados. Algoritmo solar de baja
 * precisión (NOAA): basta de sobra para decidir si el terreno está iluminado, que es lo
 * único que se le pregunta.
 */
export function elevacionSolar(objetivo: [number, number], fecha: Date): number {
  // Días julianos desde J2000.0.
  const d = fecha.getTime() / 86_400_000 + 2_440_587.5 - 2_451_545.0;
  const L = (280.46 + 0.9856474 * d) % 360;
  const g = ((357.528 + 0.9856003 * d) % 360) * RAD;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * d) * RAD;
  const declinacion = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const ascension = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) / RAD;
  const gmstHoras = (18.697374558 + 24.06570982441908 * d) % 24;
  const horario = ((gmstHoras * 15 + objetivo[0] - ascension + 540) % 360) - 180;
  const lat = objetivo[1] * RAD;
  const altura = Math.asin(
    Math.sin(lat) * Math.sin(declinacion) +
      Math.cos(lat) * Math.cos(declinacion) * Math.cos(horario * RAD),
  );
  return altura / RAD;
}

/** Umbral de iluminación para un sensor óptico: por debajo la escena no sirve. */
export const ELEVACION_SOLAR_MINIMA = 5;

// --- Pasadas -------------------------------------------------------------------------

export interface Pasada {
  inicio: Date;
  /** Instante de máxima cercanía: el que se muestra, porque es cuando mira el punto. */
  cenit: Date;
  fin: Date;
  /** Distancia del punto al nadir en el instante de máxima cercanía. */
  distanciaKm: number;
  /** Altura del Sol sobre el punto en ese instante: distingue la pasada diurna de la nocturna. */
  elevacionSolarGrados: number;
}

/** Paso del barrido grueso. Menos de un minuto no hace falta para hallar los mínimos. */
const PASO_GRUESO_S = 60;
/** Paso del afinado alrededor de cada mínimo, en segundos. */
const PASO_FINO_S = 1;
/**
 * Primera pasada útil del satélite sobre el punto, buscando hacia adelante (`sentido` 1)
 * o hacia atrás (−1) desde `origen`.
 *
 * Se barre en pasos de un minuto buscando mínimos locales de la distancia al nadir y se
 * afina cada candidato segundo a segundo: a siete kilómetros por segundo, un paso grueso
 * se saltaría la pasada entera. Cuenta como pasada si el punto cae dentro de la franja
 * del sensor —la definición operativa de «lo fotografió»— y, en los sensores ópticos, si
 * además hay luz: Sentinel-2 cruza Colombia dos veces al día, pero solo una lleva imagen.
 */
export function buscarPasada(
  registro: SatRec,
  mision: Mision,
  objetivo: [number, number],
  origen: Date,
  sentido: 1 | -1,
): Pasada | null {
  const radio = mision.franjaKm / 2;
  const limite = mision.ventanaDias * 24 * 3_600 * 1_000;
  const paso = PASO_GRUESO_S * 1_000 * sentido;
  const inicio = origen.getTime();

  const distanciaEn = (t: number): number => {
    const punto = subpunto(registro, new Date(t));
    return punto ? distanciaKm(objetivo, punto) : Number.POSITIVE_INFINITY;
  };

  let anterior = distanciaEn(inicio);
  let medio = distanciaEn(inicio + paso);
  for (let k = 2; Math.abs(k * paso) <= limite; k += 1) {
    const t = inicio + k * paso;
    const siguiente = distanciaEn(t);
    // Mínimo local del barrido grueso: el acercamiento real está en la ventana de al lado.
    if (medio <= anterior && medio <= siguiente && medio < radio + 1_500) {
      const afinada = afinar(registro, objetivo, t - paso, Math.abs(paso), radio);
      if (
        afinada &&
        (!mision.requiereLuz || afinada.elevacionSolarGrados >= ELEVACION_SOLAR_MINIMA)
      ) {
        return afinada;
      }
    }
    anterior = medio;
    medio = siguiente;
  }
  return null;
}

/** Recorre segundo a segundo la ventana alrededor de un mínimo grueso. */
function afinar(
  registro: SatRec,
  objetivo: [number, number],
  centro: number,
  radioVentanaMs: number,
  radioKm: number,
): Pasada | null {
  let mejor = Number.POSITIVE_INFINITY;
  let cenit = centro;
  for (let t = centro - radioVentanaMs; t <= centro + radioVentanaMs; t += PASO_FINO_S * 1_000) {
    const punto = subpunto(registro, new Date(t));
    if (!punto) continue;
    const d = distanciaKm(objetivo, punto);
    if (d < mejor) {
      mejor = d;
      cenit = t;
    }
  }
  if (mejor > radioKm) {
    return null;
  }
  const dentro = (t: number): boolean => {
    const punto = subpunto(registro, new Date(t));
    return punto ? distanciaKm(objetivo, punto) <= radioKm : false;
  };
  let inicio = cenit;
  while (dentro(inicio - PASO_FINO_S * 1_000)) {
    inicio -= PASO_FINO_S * 1_000;
  }
  let fin = cenit;
  while (dentro(fin + PASO_FINO_S * 1_000)) {
    fin += PASO_FINO_S * 1_000;
  }
  return {
    inicio: new Date(inicio),
    cenit: new Date(cenit),
    fin: new Date(fin),
    distanciaKm: mejor,
    elevacionSolarGrados: elevacionSolar(objetivo, new Date(cenit)),
  };
}

// --- Época del TLE -------------------------------------------------------------------

/**
 * Instante al que se refieren los elementos orbitales. Un TLE envejece y la predicción se
 * desvía: el panel lo muestra para que nadie lea una extrapolación de tres meses como si
 * fuera una medición.
 */
export function epocaDe(clave: ClaveMision): Date | null {
  const par = TLE[misionDe(clave).tle];
  if (!par) {
    return null;
  }
  const campo = par[0].slice(18, 32).trim();
  const anioCorto = Number.parseInt(campo.slice(0, 2), 10);
  const dia = Number.parseFloat(campo.slice(2));
  if (!Number.isFinite(anioCorto) || !Number.isFinite(dia)) {
    return null;
  }
  // Convención TLE: 57–99 son 1957–1999; 00–56 son 2000–2056.
  const anio = anioCorto < 57 ? 2000 + anioCorto : 1900 + anioCorto;
  return new Date(Date.UTC(anio, 0, 1) + (dia - 1) * 86_400_000);
}

/** Época más antigua del catálogo: la que marca la confianza del conjunto. */
export function epocaMasAntigua(): Date | null {
  let masAntigua: Date | null = null;
  for (const mision of MISIONES) {
    const epoca = epocaDe(mision.clave);
    if (epoca && (!masAntigua || epoca < masAntigua)) {
      masAntigua = epoca;
    }
  }
  return masAntigua;
}

export function diasDesde(fecha: Date, ahora: Date = new Date()): number {
  return (ahora.getTime() - fecha.getTime()) / 86_400_000;
}
