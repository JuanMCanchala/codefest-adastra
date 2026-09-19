/**
 * Catálogo de componentes con los filtros que admite cada uno, copiado del contrato de
 * `dashboard/API.md` (mismo catálogo cerrado de `agent/app/catalogo.py`). Sirve para el modo
 * de exploración manual; los valores siempre los calcula la API.
 */

import {
  Activity,
  Crosshair,
  Globe2,
  Grid3x3,
  Layers,
  Map as MapaIcono,
  Quote,
  Share2,
  type LucideIcon,
} from "lucide-react";

import type { Filtros, NombreComponente } from "@/api/tipos";

export type TipoFiltro = "opciones" | "texto" | "numero";

export interface Opcion {
  valor: string;
  etiqueta: string;
}

export interface DefinicionFiltro {
  clave: string;
  etiqueta: string;
  tipo: TipoFiltro;
  opciones?: readonly Opcion[];
  minimo?: number;
  maximo?: number;
  ayuda?: string;
  predeterminado?: string | number;
}

export interface DefinicionComponente {
  componente: NombreComponente;
  etiqueta: string;
  descripcion: string;
  familia: "espacial" | "temporal" | "relacional" | "composicion" | "evidencia";
  icono: LucideIcon;
  /** Acepta los filtros `desde`/`hasta` del rango de años global. */
  usaAnios: boolean;
  filtros: readonly DefinicionFiltro[];
}

export const CATALOGO: readonly DefinicionComponente[] = [
  {
    componente: "mapa_colombia",
    etiqueta: "Mapa de Colombia",
    descripcion:
      "Alertas tempranas por territorio. Al acercar el zoom pasa de departamento a municipio.",
    familia: "espacial",
    icono: MapaIcono,
    usaAnios: true,
    filtros: [
      {
        clave: "nivel",
        etiqueta: "Nivel territorial",
        tipo: "opciones",
        predeterminado: "departamento",
        opciones: [
          { valor: "departamento", etiqueta: "Departamento" },
          { valor: "municipio", etiqueta: "Municipio" },
        ],
      },
      { clave: "economia", etiqueta: "Economía ilícita", tipo: "texto", ayuda: "p. ej. minería" },
      { clave: "tipo_alerta", etiqueta: "Tipo de alerta", tipo: "texto" },
    ],
  },
  {
    componente: "mapa_mundo",
    etiqueta: "Mapa del mundo",
    descripcion: "Menciones de países en el corpus, agregadas por documento y fragmento.",
    familia: "espacial",
    icono: Globe2,
    usaAnios: false,
    filtros: [
      {
        clave: "top",
        etiqueta: "Países (máximo)",
        tipo: "numero",
        minimo: 10,
        maximo: 200,
        predeterminado: 60,
      },
    ],
  },
  {
    componente: "linea_tiempo",
    etiqueta: "Línea de tiempo",
    descripcion: "Documentos por año y reapariciones de una entidad a lo largo del corpus.",
    familia: "temporal",
    icono: Activity,
    usaAnios: true,
    filtros: [
      { clave: "entidad", etiqueta: "Entidad a rastrear", tipo: "texto", ayuda: "p. ej. ELN" },
    ],
  },
  {
    componente: "matriz_calor",
    etiqueta: "Matriz de calor",
    descripcion: "Cruce de dos variables categóricas con el conteo de coincidencias.",
    familia: "relacional",
    icono: Grid3x3,
    usaAnios: false,
    filtros: [
      {
        clave: "filas",
        etiqueta: "Filas",
        tipo: "opciones",
        predeterminado: "entidad",
        opciones: [
          { valor: "entidad", etiqueta: "Entidad" },
          { valor: "pais", etiqueta: "País" },
        ],
      },
      {
        clave: "columnas",
        etiqueta: "Columnas",
        tipo: "opciones",
        predeterminado: "organizacion",
        opciones: [
          { valor: "organizacion", etiqueta: "Organización" },
          { valor: "fenomeno", etiqueta: "Fenómeno" },
          { valor: "documento", etiqueta: "Documento" },
        ],
      },
      { clave: "tipo_entidad", etiqueta: "Tipo de entidad", tipo: "texto" },
      {
        clave: "top",
        etiqueta: "Filas (máximo)",
        tipo: "numero",
        minimo: 10,
        maximo: 30,
        predeterminado: 20,
      },
    ],
  },
  {
    componente: "red_entidades",
    etiqueta: "Red de entidades",
    descripcion: "Entidades y sus relaciones; al hacer clic se exploran los vecinos.",
    familia: "relacional",
    icono: Share2,
    usaAnios: false,
    filtros: [
      { clave: "entidad", etiqueta: "Entidad central", tipo: "texto" },
      { clave: "tipo_entidad", etiqueta: "Tipo de entidad", tipo: "texto" },
      {
        clave: "top",
        etiqueta: "Nodos (máximo)",
        tipo: "numero",
        minimo: 10,
        maximo: 60,
        predeterminado: 40,
      },
      { clave: "min_peso", etiqueta: "Peso mínimo", tipo: "numero", minimo: 1, maximo: 50 },
    ],
  },
  {
    componente: "cuadrante_priorizacion",
    etiqueta: "Cuadrantes de priorización",
    descripcion:
      "Conteo total frente al cambio del conteo respecto al año de corte. Solo conteos, sin índices.",
    familia: "relacional",
    icono: Crosshair,
    usaAnios: false,
    filtros: [
      {
        clave: "sujeto",
        etiqueta: "Sujeto",
        tipo: "opciones",
        predeterminado: "departamento",
        opciones: [
          { valor: "departamento", etiqueta: "Departamento" },
          { valor: "entidad", etiqueta: "Entidad" },
        ],
      },
      {
        clave: "anio_corte",
        etiqueta: "Año de corte",
        tipo: "numero",
        minimo: 1990,
        maximo: 2026,
        predeterminado: 2022,
      },
    ],
  },
  {
    componente: "composicion_corpus",
    etiqueta: "Composición del corpus",
    descripcion: "Documentos y fragmentos por organización, formato o idioma.",
    familia: "composicion",
    icono: Layers,
    usaAnios: false,
    filtros: [
      {
        clave: "dimension",
        etiqueta: "Dimensión",
        tipo: "opciones",
        predeterminado: "organizacion",
        opciones: [
          { valor: "organizacion", etiqueta: "Organización" },
          { valor: "formato", etiqueta: "Formato" },
          { valor: "idioma", etiqueta: "Idioma" },
        ],
      },
    ],
  },
  {
    componente: "panel_evidencia",
    etiqueta: "Panel de evidencia",
    descripcion: "Fragmentos originales del corpus que sustentan un hallazgo.",
    familia: "evidencia",
    icono: Quote,
    usaAnios: false,
    filtros: [
      { clave: "consulta", etiqueta: "Texto a buscar", tipo: "texto" },
      { clave: "entidad", etiqueta: "Entidad", tipo: "texto" },
      { clave: "doc_id", etiqueta: "Documento", tipo: "texto" },
      {
        clave: "limite",
        etiqueta: "Fragmentos (máximo)",
        tipo: "numero",
        minimo: 1,
        maximo: 20,
        predeterminado: 12,
      },
    ],
  },
] as const;

export function definicionDe(componente: NombreComponente): DefinicionComponente {
  const encontrada = CATALOGO.find((d) => d.componente === componente);
  if (!encontrada) {
    throw new Error(`Componente fuera del catálogo: ${componente}`);
  }
  return encontrada;
}

export function filtrosPredeterminados(componente: NombreComponente): Filtros {
  const filtros: Filtros = {};
  for (const definicion of definicionDe(componente).filtros) {
    if (definicion.predeterminado !== undefined) {
      filtros[definicion.clave] = definicion.predeterminado;
    }
  }
  return filtros;
}

export const ETIQUETAS_FAMILIA: Record<DefinicionComponente["familia"], string> = {
  espacial: "Espacial",
  temporal: "Temporal",
  relacional: "Relacional",
  composicion: "Composición",
  evidencia: "Evidencia",
};
