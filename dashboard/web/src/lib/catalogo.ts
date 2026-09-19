/**
 * Catálogo de componentes con los filtros que admite cada uno, copiado del contrato de
 * `dashboard/API.md` (mismo catálogo cerrado de `agent/app/catalogo.py`). Sirve para el modo
 * de exploración manual; los valores siempre los calcula la API.
 */

import {
  Activity,
  BarChart3,
  Crosshair,
  Globe2,
  Grid3x3,
  Layers,
  Map as MapaIcono,
  Quote,
  Satellite,
  TreePine,
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
  familia: "espacial" | "temporal" | "relacional" | "composicion" | "distribucion" | "evidencia";
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
      {
        clave: "economia",
        etiqueta: "Economía ilícita",
        tipo: "texto",
        ayuda: "p. ej. minería",
      },
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
      {
        clave: "entidad",
        etiqueta: "Entidad a rastrear",
        tipo: "texto",
        ayuda: "p. ej. ELN",
      },
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
    descripcion:
      "Entidades y sus relaciones. Clic: vecinos y evidencia; doble clic: expandir la red alrededor del nodo. Tres disposiciones: fuerzas, radial y niveles.",
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
      {
        clave: "min_peso",
        etiqueta: "Peso mínimo",
        tipo: "numero",
        minimo: 1,
        maximo: 50,
      },
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
    componente: "distribucion",
    etiqueta: "Distribución",
    descripcion:
      "Histograma de una variable contada: cuántos documentos son cortos o larguísimos, si las alertas se concentran en pocos municipios, cuán larga es la cola de entidades. Solo conteos.",
    familia: "distribucion",
    icono: BarChart3,
    usaAnios: false,
    filtros: [
      {
        clave: "variable",
        etiqueta: "Variable",
        tipo: "opciones",
        predeterminado: "fragmentos_por_documento",
        opciones: [
          {
            valor: "fragmentos_por_documento",
            etiqueta: "Fragmentos por documento",
          },
          {
            valor: "entidades_por_documento",
            etiqueta: "Entidades por documento",
          },
          { valor: "paises_por_documento", etiqueta: "Países por documento" },
          { valor: "alertas_por_municipio", etiqueta: "Alertas por municipio" },
          { valor: "menciones_por_entidad", etiqueta: "Menciones por entidad" },
        ],
      },
      {
        clave: "barras",
        etiqueta: "Barras",
        tipo: "numero",
        minimo: 4,
        maximo: 30,
        predeterminado: 12,
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
  {
    componente: "evidencia_satelital",
    etiqueta: "Evidencia satelital",
    descripcion:
      "El recorte del ortomosaico, la segmentación del modelo y la anotación humana, uno al lado del otro: la imagen de la que salen las hectáreas de minería y de bosque del agente satelital.",
    familia: "evidencia",
    icono: Satellite,
    usaAnios: false,
    filtros: [
      { clave: "sitio", etiqueta: "Sitio", tipo: "texto" },
      {
        clave: "encuadre",
        etiqueta: "Encuadre",
        tipo: "opciones",
        predeterminado: "frontera",
        opciones: [
          { valor: "frontera", etiqueta: "Frontera bosque/mina" },
          { valor: "mineria", etiqueta: "Mayor actividad minera" },
          { valor: "bosque", etiqueta: "Frente de deforestación" },
        ],
      },
    ],
  },
  {
    componente: "deforestacion",
    etiqueta: "Deforestación",
    descripcion:
      "Hectáreas de bosque perdidas en el Chocó, apiladas por la causa que declara la fuente: minería, incendio, cultivo, ganadería. Cubre el Pacífico, donde Amazon Mining Watch no llega.",
    familia: "espacial",
    icono: TreePine,
    usaAnios: false,
    filtros: [
      { clave: "causa", etiqueta: "Causa", tipo: "texto" },
      {
        clave: "desde",
        etiqueta: "Desde",
        tipo: "numero",
        minimo: 2014,
        maximo: 2021,
        predeterminado: 2014,
      },
      {
        clave: "hasta",
        etiqueta: "Hasta",
        tipo: "numero",
        minimo: 2014,
        maximo: 2021,
        predeterminado: 2021,
      },
      {
        clave: "top",
        etiqueta: "Municipios",
        tipo: "numero",
        minimo: 3,
        maximo: 30,
        predeterminado: 15,
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

/** Filtros que no son de un componente concreto, sino del rango global. */
const ETIQUETAS_GLOBALES: Record<string, string> = {
  desde: "Desde",
  hasta: "Hasta",
  fenomeno: "Fenómeno",
};

/** Nombre legible de un filtro: el del catálogo y, si no está, la clave tal cual. */
export function etiquetaFiltro(componente: NombreComponente, clave: string): string {
  const definicion = definicionDe(componente).filtros.find((f) => f.clave === clave);
  return definicion?.etiqueta ?? ETIQUETAS_GLOBALES[clave] ?? clave;
}

/** Valor legible de un filtro: la etiqueta de la opción elegida y, si no, el valor tal cual. */
export function valorFiltro(componente: NombreComponente, clave: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") {
    return "—";
  }
  const texto =
    typeof valor === "string" || typeof valor === "number" || typeof valor === "boolean"
      ? String(valor)
      : JSON.stringify(valor);
  const definicion = definicionDe(componente).filtros.find((f) => f.clave === clave);
  return definicion?.opciones?.find((o) => o.valor === texto)?.etiqueta ?? texto;
}

export const ETIQUETAS_FAMILIA: Record<DefinicionComponente["familia"], string> = {
  espacial: "Espacial",
  temporal: "Temporal",
  relacional: "Relacional",
  composicion: "Composición",
  distribucion: "Distribución",
  evidencia: "Evidencia",
};
