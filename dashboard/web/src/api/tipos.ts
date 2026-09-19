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
  | "panel_evidencia"
  | "distribucion"
  | "evidencia_satelital"
  | "deforestacion"
  | "poblacion_orbital";

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
  /** Cuántos documentos hay y cuántos no traen año: los segundos no entran en la serie. */
  cobertura?: { documentos: number; sin_anio: number };
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

/** Una barra del histograma: rango entero cerrado, o abierto (`hasta: null`) en la cola. */
export interface BarraDistribucion {
  desde: number;
  hasta: number | null;
  etiqueta: string;
  cuenta: number;
  /** Sujetos de mayor valor de la barra, para nombrarlos sin abrir la evidencia. */
  ejemplos: string[];
  refs?: Ref[];
}

export interface DatosDistribucion {
  variable: string;
  /** Qué se cuenta (documentos, municipios, entidades). */
  sujetos: string;
  /** Qué mide el valor (fragmentos, alertas, países distintos). */
  unidad: string;
  total: number;
  resumen: {
    minimo: number;
    mediana: number;
    media: number;
    maximo: number;
    p90: number;
  } | null;
  barras: BarraDistribucion[];
}

/** Una clase de cobertura presente en el recorte segmentado. */
export interface ClaseSatelital {
  clase: string;
  porcentaje: number;
  /** Si cuenta como huella minera directa (infraestructura o remoción de material). */
  minera: boolean;
  color: string;
}

/** Tríptico ya renderizado: ortomosaico, predicción del modelo y anotación humana. */
export interface TripticoSatelital {
  sitio: string;
  /** Ruta de la imagen dentro de la SPA (`/eldor/...png`). */
  imagen: string;
  encuadre: string;
  con_anotacion: boolean;
  /** Ventana del ortomosaico: `[x, y, ancho, alto]` en píxeles. */
  recorte_px: [number, number, number, number];
  fecha_captura: string;
  resolucion_m_px: number;
  crs: string;
  modelo: string;
  huella_minera_ha: number;
  bosque_ha: number;
  /** Vegetación rebrotando: solo crece sobre terreno intervenido antes. */
  regeneracion_ha: number;
  /** Lo que no es bosque primario. Resta sobre áreas medidas, no pérdida entre dos fechas. */
  intervenida_ha: number;
  area_total_ha: number;
  clases: ClaseSatelital[];
  /** Cadena de trazabilidad, el equivalente espacial de un `doc_id`/`chunk_id`. */
  procedencia: string;
}

export interface DatosEvidenciaSatelital {
  sitios: string[];
  /** Encuadres renderizados para el sitio en pantalla (`frontera`, `mineria`, `bosque`). */
  encuadres: string[];
  triptico: TripticoSatelital | null;
}

/** Un año de la serie de pérdida de bosque. */
export interface AnioDeforestacion {
  anio: string;
  ha: number;
  poligonos?: number;
}

/** Una causa declarada por la fuente (Minería, Incendio, Cultivo…). */
export interface CausaDeforestacion {
  causa: string;
  ha: number;
  /** Ausente cuando el desglose se recalcula sobre un rango de años recortado. */
  poligonos?: number;
}

export interface MunicipioDeforestacion {
  divipola: string;
  nombre: string;
  departamento: string;
  ha: number;
  poligonos: number;
  /** Reparto de esas hectáreas entre las causas declaradas. */
  por_causa: Record<string, number>;
}

/** De dónde sale la cifra: es lo que aquí hace de `doc_id`/`chunk_id`. */
export interface ProcedenciaDeforestacion {
  fuente: string;
  dataset: string;
  ficha: string;
  metodo: string;
  periodo: string;
  poligonos: number;
  descargado: string;
  cobertura: string;
}

export interface DatosDeforestacion {
  serie: AnioDeforestacion[];
  causas: CausaDeforestacion[];
  municipios: MunicipioDeforestacion[];
  /** Cuántos municipios tienen datos en el rango, antes de recortar a `top`. */
  municipios_totales: number;
  total_ha: number;
  /** Causa en curso, o `null` si se están viendo todas. */
  causa: string | null;
  procedencia: ProcedenciaDeforestacion | null;
}

/** De dónde sale el catálogo: es lo que aquí hace de `doc_id`/`chunk_id`. */
export interface ProcedenciaOrbital {
  fuente: string;
  url: string;
  licencia: string;
  cita: string;
  actualizado: string;
  descargado: string;
  filas: number;
}

/** Objetos catalogados de un año de lanzamiento, tipo y país. */
export interface PuntoSerieOrbital {
  anio: number;
  /** `P` carga útil, `R` etapa de cohete, `C` componente, `D` desecho. */
  tipo: "P" | "R" | "C" | "D";
  pais: string;
  lanzados: number;
}

/** Objetos en órbita hoy de un régimen orbital y un tipo. */
export interface ConteoRegimenOrbital {
  regimen: string;
  tipo: "P" | "R" | "C" | "D";
  n: number;
}

/** Un ensayo antisatélite: el satélite destruido y sus desechos catalogados. */
export interface EnsayoAsat {
  jcat: string;
  satcat: string;
  cospar: string;
  nombre: string;
  pais: string;
  fecha_ensayo: string | null;
  catalogados: number;
  en_orbita: number;
  refs: Ref[];
}

export interface ObjetoColombiaOrbital {
  jcat: string;
  satcat: string;
  cospar: string;
  nombre: string;
  lanzamiento: string;
  estado: string;
  fin: string | null;
}

/** Fragmento, proyectil u otro objeto catalogado con el mismo `Parent` que el inspector. */
export interface HijoInspector {
  jcat: string;
  nombre: string;
  tipo: "fragmento" | "objeto";
  en_orbita: boolean;
}

/** Satélite de inspección o proximidad: lista curada, declarada como tal. */
export interface SateliteInspector {
  jcat: string;
  satcat: string;
  cospar: string;
  nombre: string;
  pais: string;
  lanzamiento: string;
  orbita: string;
  estado: string;
  fin: string | null;
  alias_corpus: string[];
  referencia: string;
  hijos: HijoInspector[];
  refs: Ref[];
}

/**
 * Cada vista trae su propia forma de `datos`; `vista` es el discriminador. Cuando no hay
 * datos en disco, las cuatro llegan con `vista: "crecimiento"` y sus listas vacías (la API
 * no llega a mirar el filtro `vista` pedido si el JSON precalculado falta).
 */
export type DatosPoblacionOrbital =
  | {
      vista: "crecimiento";
      procedencia: ProcedenciaOrbital | null;
      serie: PuntoSerieOrbital[];
      en_orbita_por_regimen: ConteoRegimenOrbital[];
      total_lanzados: number;
      /** Objetos con estado activo en el catálogo entero: no lo recorta ningún filtro. */
      total_en_orbita: number;
      /** Si el país pedido sí recortó la serie; solo entonces las dos cifras miden cosas distintas. */
      pais_aplicado: boolean;
    }
  | {
      vista: "asat";
      procedencia: ProcedenciaOrbital | null;
      asat: EnsayoAsat[];
      /** Ensayos con datos antes de recortar a `top`. */
      asat_totales: number;
    }
  | { vista: "colombia"; procedencia: ProcedenciaOrbital | null; colombia: ObjetoColombiaOrbital[] }
  | {
      vista: "inspectores";
      procedencia: ProcedenciaOrbital | null;
      inspectores: SateliteInspector[];
    };

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
  | (SobreComponente & {
      componente: "composicion_corpus";
      datos: FilaComposicion[];
    })
  | (SobreComponente & { componente: "linea_tiempo"; datos: DatosLineaTiempo })
  | (SobreComponente & { componente: "matriz_calor"; datos: DatosMatrizCalor })
  | (SobreComponente & {
      componente: "red_entidades";
      datos: DatosRedEntidades;
    })
  | (SobreComponente & {
      componente: "mapa_colombia";
      datos: FilaMapaColombia[];
    })
  | (SobreComponente & { componente: "mapa_mundo"; datos: FilaMapaMundo[] })
  | (SobreComponente & {
      componente: "cuadrante_priorizacion";
      datos: FilaCuadrante[];
    })
  | (SobreComponente & {
      componente: "panel_evidencia";
      datos: FilaEvidencia[];
    })
  | (SobreComponente & {
      componente: "distribucion";
      datos: DatosDistribucion;
    })
  | (SobreComponente & {
      componente: "evidencia_satelital";
      datos: DatosEvidenciaSatelital;
    })
  | (SobreComponente & {
      componente: "deforestacion";
      datos: DatosDeforestacion;
    })
  | (SobreComponente & {
      componente: "poblacion_orbital";
      datos: DatosPoblacionOrbital;
    });

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
  /** Lo fija `VISTA_TECNICA` en el contenedor: detalles internos en la interfaz. */
  vista_tecnica?: boolean;
  /** Lo fija `CONSOLA_URL` en el contenedor: a dónde va el enlace a la consola de chat. */
  consola_url?: string | null;
  /** `true` si el despliegue montó el corpus original y la API puede servir los archivos. */
  corpus_disponible?: boolean;
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
