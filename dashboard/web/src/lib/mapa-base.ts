import { type ClaveMision, MISIONES, MISIONES_POR_DEFECTO } from "@/lib/satelites";
import { TEMA } from "@/lib/tema";

/**
 * Mapas base del tablero.
 *
 * PRODUCT.md §45 exige que la SPA funcione sin recursos remotos: por eso el fondo
 * analítico —sin teselas— es el predeterminado y el único que se usa si la sala no
 * tiene red. Las capas de imagen son opcionales, no piden llave ni cuenta, y solo
 * descargan teselas cuando el usuario las enciende (MapLibre no pide teselas de una
 * fuente cuya única capa está en `visibility: none`).
 */
export type ClaveBase = "analitico" | "callejero" | "satelite";

export interface MapaBase {
  clave: ClaveBase;
  etiqueta: string;
  /** Texto del `title` y del lector de pantalla. */
  descripcion: string;
  /** `null` en el fondo analítico: no hay descarga. */
  teselas: readonly string[] | null;
  atribucion: string;
  zoomMaximoTeselas: number;
  /** Opacidad de la coropleta encima: sobre imagen hay que dejar ver el terreno. */
  opacidadRelleno: number;
}

export const BASES: readonly MapaBase[] = [
  {
    clave: "analitico",
    etiqueta: "Analítico",
    descripcion: "Fondo sólido, sin descargas: funciona sin conexión",
    teselas: null,
    atribucion: "",
    zoomMaximoTeselas: 0,
    opacidadRelleno: 0.95,
  },
  {
    clave: "callejero",
    etiqueta: "Callejero",
    descripcion: "Mapa base con vías y topónimos (CARTO, requiere conexión)",
    // El juego de teselas sigue al modo: un callejero oscuro bajo el tablero claro
    // (o al revés) se lee como un error, no como un mapa.
    teselas: ["https://basemaps.cartocdn.com/{estilo}/{z}/{x}/{y}.png"],
    atribucion: "© OpenStreetMap, © CARTO",
    zoomMaximoTeselas: 20,
    opacidadRelleno: 0.6,
  },
  {
    clave: "satelite",
    etiqueta: "Satélite",
    descripcion: "Imagen satelital real del territorio (Esri World Imagery, requiere conexión)",
    teselas: [
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    atribucion: "Esri, Maxar, Earthstar Geographics",
    zoomMaximoTeselas: 19,
    opacidadRelleno: 0.55,
  },
] as const;

export const BASE_POR_DEFECTO: ClaveBase = "analitico";

/**
 * Modelo de elevación para el relieve del volumen 3D: teselas terrarium del conjunto
 * abierto de AWS (Registry of Open Data). Sin llave, y solo se descarga con el volumen
 * encendido sobre un mapa base de imagen; sobre el fondo analítico el relieve sería ruido.
 */
export const RELIEVE = {
  id: "relieve-dem",
  teselas: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
  codificacion: "terrarium",
  zoomMaximo: 12,
  atribucion: "Elevación: AWS Terrain Tiles",
  exageracion: 1.3,
} as const;

/**
 * Color del hilo entre regiones, legible contra cada fondo. Es una función y no un campo
 * de `BASES` porque el tema se lee en tiempo de ejecución: congelarlo en el módulo dejaba
 * el borde oscuro después de pasar a modo claro.
 */
export function colorBorde(clave: ClaveBase): string {
  return clave === "analitico" ? TEMA.fondo : TEMA.texto;
}

/** Teselas de la base, ya resueltas para el modo vigente. */
export function teselasDe(base: MapaBase): readonly string[] {
  if (base.teselas === null) {
    return [];
  }
  const estilo = TEMA.modo === "claro" ? "light_all" : "dark_all";
  return base.teselas.map((plantilla) => plantilla.replace("{estilo}", estilo));
}

export function baseDe(clave: ClaveBase): MapaBase {
  return BASES.find((b) => b.clave === clave) ?? BASES[0]!;
}

/** Bases que descargan teselas: las que se añaden al estilo como capa raster apagada. */
export const BASES_REMOTAS = BASES.filter((b) => b.teselas !== null);

export function idFuenteBase(clave: ClaveBase): string {
  return `base-fuente-${clave}`;
}

export function idCapaBase(clave: ClaveBase): string {
  return `base-capa-${clave}`;
}

const LLAVE_MEMORIA = "aerocode:mapa-base";
const LLAVE_HUD = "aerocode:mapa-hud";
const LLAVE_VOLUMEN = "aerocode:mapa-volumen";

/** La elección sobrevive al cambio de vista (Colombia ↔ mundo) dentro de la sesión. */
export function leerBaseGuardada(): ClaveBase {
  try {
    const guardada = window.localStorage.getItem(LLAVE_MEMORIA);
    if (guardada && BASES.some((b) => b.clave === guardada)) {
      return guardada as ClaveBase;
    }
  } catch {
    // Modo privado o almacenamiento bloqueado: se usa el predeterminado.
  }
  return BASE_POR_DEFECTO;
}

export function guardarBase(clave: ClaveBase): void {
  try {
    window.localStorage.setItem(LLAVE_MEMORIA, clave);
  } catch {
    // Sin persistencia: la elección vale solo para esta vista.
  }
}

/** El HUD también sobrevive: cambiar de modo vuelve a montar el mapa y lo apagaría. */
export function leerHudGuardado(): boolean {
  try {
    return window.localStorage.getItem(LLAVE_HUD) === "1";
  } catch {
    return false;
  }
}

export function guardarHud(activo: boolean): void {
  try {
    window.localStorage.setItem(LLAVE_HUD, activo ? "1" : "0");
  } catch {
    // Sin persistencia: el HUD vale solo para esta vista.
  }
}

export function leerVolumenGuardado(): boolean {
  try {
    return window.localStorage.getItem(LLAVE_VOLUMEN) === "1";
  } catch {
    return false;
  }
}

export function guardarVolumen(activo: boolean): void {
  try {
    window.localStorage.setItem(LLAVE_VOLUMEN, activo ? "1" : "0");
  } catch {
    // Sin persistencia: el volumen vale solo para esta vista.
  }
}

const LLAVE_ORBITAS = "aerocode:mapa-orbitas";
const LLAVE_MISIONES = "aerocode:mapa-misiones";

/** Las órbitas nacen apagadas: son una capa de contexto, no el dato del componente. */
export function leerOrbitasGuardadas(): boolean {
  try {
    return window.localStorage.getItem(LLAVE_ORBITAS) === "1";
  } catch {
    return false;
  }
}

export function guardarOrbitas(activo: boolean): void {
  try {
    window.localStorage.setItem(LLAVE_ORBITAS, activo ? "1" : "0");
  } catch {
    // Sin persistencia: las órbitas valen solo para esta vista.
  }
}

export function leerMisionesGuardadas(): ClaveMision[] {
  try {
    const crudo = window.localStorage.getItem(LLAVE_MISIONES);
    if (crudo !== null) {
      const claves = crudo.split(",").filter((c) => MISIONES.some((m) => m.clave === c));
      return claves as ClaveMision[];
    }
  } catch {
    // Modo privado o almacenamiento bloqueado: se usan las de por defecto.
  }
  return [...MISIONES_POR_DEFECTO];
}

export function guardarMisiones(claves: readonly ClaveMision[]): void {
  try {
    window.localStorage.setItem(LLAVE_MISIONES, claves.join(","));
  } catch {
    // Sin persistencia: la selección vale solo para esta vista.
  }
}
