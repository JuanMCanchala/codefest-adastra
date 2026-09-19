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
  | "orden_observacion"
  | "evidencia_satelital";

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

/** Un valor de una columna cerrada y cuántas veces aparece. */
export interface Conteo {
  valor: string;
  n: number;
}

export interface TerritorioOrden {
  divipola: string;
  municipio: string;
  departamento: string;
  divipola_dpto: string;
  /** Centro de la caja del polígono municipal del MGN, [lng, lat]; no es un dato medido. */
  centro: [number, number] | null;
  area_km2: number | null;
  fuente_geometria: string;
}

export interface AlertasOrden {
  total: number;
  ultima_fecha: string | null;
  por_anio: { anio: number; alertas: number; refs: Ref[] }[];
  tipos: Conteo[];
  economias: Conteo[];
  grupos_armados: Conteo[];
  poblaciones: Conteo[];
  codigos: string[];
  refs: Ref[];
}

export interface PresenciaArmada {
  total_grupos: number | null;
  grupos: string[];
  con_presencia: number | null;
  sin_informacion: number | null;
  poblacion: number | null;
  area_km2: number | null;
  refs: Ref[];
}

export interface PuntoMineria {
  etiqueta: string;
  nuevo_ha: number;
  acumulado_ha: number;
}

export interface MineriaDetectada {
  municipal: { area_ha: number; poligonos: number } | null;
  departamental: PuntoMineria[] | null;
  nacional_acumulado_ha: number | null;
  en_cobertura: boolean;
  cobertura: string | null;
  procedencia: Record<string, string | null> | null;
}

export interface DatosOrdenObservacion {
  territorio: TerritorioOrden;
  alertas: AlertasOrden;
  presencia_armada: PresenciaArmada | null;
  mineria_detectada: MineriaDetectada;
  menciones: { entidad: string; documentos: number; fragmentos: number; refs: Ref[] } | null;
  candidatos: { divipola: string; municipio: string; departamento: string; alertas: number }[];
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
      componente: "orden_observacion";
      datos: DatosOrdenObservacion | null;
    })
  | (SobreComponente & {
      componente: "evidencia_satelital";
      datos: DatosEvidenciaSatelital;
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
