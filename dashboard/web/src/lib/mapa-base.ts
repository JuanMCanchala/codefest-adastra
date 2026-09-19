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
export type ClaveBase = "analitico" | "oscuro" | "satelite";

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
  /** Color del hilo entre regiones, legible contra este fondo. */
  colorBorde: string;
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
    colorBorde: TEMA.fondo,
  },
  {
    clave: "oscuro",
    etiqueta: "Callejero",
    descripcion: "Mapa base oscuro con vías y topónimos (CARTO, requiere conexión)",
    teselas: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
    atribucion: "© OpenStreetMap, © CARTO",
    zoomMaximoTeselas: 20,
    opacidadRelleno: 0.6,
    colorBorde: TEMA.texto,
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
    colorBorde: TEMA.texto,
  },
] as const;

export const BASE_POR_DEFECTO: ClaveBase = "analitico";

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
