/**
 * Tipos del contrato de `dashboard/API.md`. La SPA programa contra estas formas:
 * no se transforma ni se inventa ningún campo que la API no devuelva.
 */

import type { Geometry } from "geojson";

export type IdFenomeno = 1 | 2 | 3;

/** La API devuelve los identificadores de fragmento como cadena o número según la tabla. */
export type IdChunk = string | number;

/** Referencia mínima de trazabilidad que acompaña a todo valor mostrado. */
export interface Ref {
  doc_id: string;
  chunk_id: IdChunk;
}

export type NombreComponente =
  | "composicion_corpus"
  | "linea_tiempo"
  | "matriz_calor"
  | "red_entidades"
  | "mapa_colombia"
  | "mapa_mundo"
  | "cuadrante_priorizacion"
  | "panel_evidencia";

export type Filtros = Record<string, string | number | null>;

// --- Formas de `datos` por componente -------------------------------------------------

export interface FilaComposicion {
  fenomeno: IdFenomeno;
  categoria: string;
  documentos: number;
  fragmentos: number;
}

export interface PuntoSerie {
  fenomeno: IdFenomeno;
  anio: number;
  documentos: number;
}

export interface Reaparicion {
  entidad: string;
  anio: number;
  doc_id: string;
  chunk_id: IdChunk;
}

export interface DatosLineaTiempo {
  series: PuntoSerie[];
  reapariciones: Reaparicion[];
}

export interface CeldaMatriz {
  fila: string;
  columna: string;
  valor: number;
  refs?: Ref[];
}

export interface DatosMatrizCalor {
  filas: string[];
  columnas: string[];
  celdas: CeldaMatriz[];
}

export interface NodoRed {
  id: string;
  tipo: string;
  menciones: number;
}

export interface AristaRed {
  origen: string;
  destino: string;
  relacion: string;
  peso: number;
  refs?: Ref[];
}

export interface DatosRedEntidades {
  nodos: NodoRed[];
  aristas: AristaRed[];
}

export interface FilaMapaColombia {
  divipola: string;
  nombre: string;
  departamento: string;
  alertas: number;
  refs?: Ref[];
}

export interface FilaMapaMundo {
  iso3: string;
  nombre: string;
  menciones: number;
  documentos: number;
  refs?: Ref[];
}

export interface FilaCuadrante {
  item: string;
  intensidad: number;
  tendencia: number;
  refs?: Ref[];
}

export interface FilaEvidencia {
  doc_id: string;
  chunk_id: IdChunk;
  titulo: string;
  fuente: string;
  fragmento: string;
}

// --- Sobre común de `POST /api/componente` --------------------------------------------

interface SobreComponente {
  titulo: string;
  fenomeno: IdFenomeno | null;
  filtros_aplicados: Record<string, unknown>;
  evidencia: Ref[];
  nota_metodo: string;
  total_evidencia: number;
  filtros_ignorados?: string[];
}

export type ResultadoComponente =
  | (SobreComponente & { componente: "composicion_corpus"; datos: FilaComposicion[] })
  | (SobreComponente & { componente: "linea_tiempo"; datos: DatosLineaTiempo })
  | (SobreComponente & { componente: "matriz_calor"; datos: DatosMatrizCalor })
  | (SobreComponente & { componente: "red_entidades"; datos: DatosRedEntidades })
  | (SobreComponente & { componente: "mapa_colombia"; datos: FilaMapaColombia[] })
  | (SobreComponente & { componente: "mapa_mundo"; datos: FilaMapaMundo[] })
  | (SobreComponente & { componente: "cuadrante_priorizacion"; datos: FilaCuadrante[] })
  | (SobreComponente & { componente: "panel_evidencia"; datos: FilaEvidencia[] });

export interface CuerpoComponente {
  componente: NombreComponente;
  fenomeno?: IdFenomeno | null;
  filtros?: Filtros;
}

// --- `POST /api/visualizar` -----------------------------------------------------------

export interface EspecificacionVisual {
  componente: NombreComponente;
  fenomeno: IdFenomeno | null;
  filtros: Record<string, unknown>;
  titulo: string;
  justificacion: string;
}

export interface TrazaAgente {
  agentes_invocados: string[];
  tokens: Record<string, number>;
  latencia_ms: number;
}

export interface Cita {
  n: number;
  doc_id: string;
  chunk_id: IdChunk;
}

export interface RespuestaVisualizar {
  respuesta_agente: string;
  especificacion: EspecificacionVisual | null;
  resultado: ResultadoComponente | null;
  traza: TrazaAgente | null;
  citas: Cita[];
}

// --- Evidencia y salud ----------------------------------------------------------------

export interface Fragmento {
  chunk_id: IdChunk;
  doc_id: string;
  fuente: string;
  titulo: string;
  organizacion: string;
  fenomeno: IdFenomeno | null;
  fecha: string | null;
  texto: string;
}

export interface Salud {
  estado: string;
  tablas: Record<string, number>;
}

// --- GeoJSON de `/geo/*.geojson` ------------------------------------------------------

export interface PropiedadesDepartamento {
  divipola_dpto: string;
  departamento: string;
}

export interface PropiedadesMunicipio {
  divipola_mpio: string;
  divipola_dpto: string;
  municipio: string;
  departamento: string;
}

export interface PropiedadesPais {
  iso3: string;
  nombre_es: string | null;
  nombre_en: string | null;
}

export interface ColeccionGeo<P> {
  type: "FeatureCollection";
  features: { type: "Feature"; properties: P; geometry: Geometry }[];
}
