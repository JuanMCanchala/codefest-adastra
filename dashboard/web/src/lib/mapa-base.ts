import { TEMA } from "@/lib/tema";

/**
 * Mapas base del tablero.
 *
 * PRODUCT.md §45 exige que la SPA funcione sin recursos remotos: por eso el fondo
 * analítico —sin teselas— es el predeterminado y el único que se usa si la sala no tiene
 * red. Las capas de imagen son opcionales, no piden llave ni cuenta, y solo descargan
 * teselas cuando se encienden (MapLibre no pide teselas de una fuente cuya única capa
 * está en `visibility: none`).
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
    teselas: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
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

export function baseDe(clave: ClaveBase): MapaBase {
  return BASES.find((base) => base.clave === clave) ?? BASES[0]!;
}

/** Bases que descargan teselas: las que se añaden al estilo como capa raster apagada. */
export const BASES_REMOTAS = BASES.filter((base) => base.teselas !== null);

export function idFuenteBase(clave: ClaveBase): string {
  return `base-fuente-${clave}`;
}

export function idCapaBase(clave: ClaveBase): string {
  return `base-capa-${clave}`;
}

/** Color del hilo entre regiones, legible contra cada fondo. */
export function colorBorde(clave: ClaveBase): string {
  return clave === "analitico" ? TEMA.fondo : TEMA.texto;
}

const LLAVE = "aerocode:mapa-base";

/** La elección sobrevive al cambio de vista (Colombia ↔ mundo) dentro de la sesión. */
export function leerBaseGuardada(): ClaveBase {
  try {
    const guardada = localStorage.getItem(LLAVE);
    if (guardada !== null && BASES.some((base) => base.clave === guardada)) {
      return guardada as ClaveBase;
    }
  } catch {
    // Modo privado o almacenamiento bloqueado: se usa el predeterminado.
  }
  return BASE_POR_DEFECTO;
}

export function guardarBase(clave: ClaveBase): void {
  try {
    localStorage.setItem(LLAVE, clave);
  } catch {
    // Sin persistencia: la elección vale solo para esta vista.
  }
}
