/**
 * Espejo en TypeScript del contrato del agente (`agent/app/contract.py`, §2.4)
 * más la extensión propia `extras` que pide el frontend con `incluir_extras`.
 */

export interface LlamadaHerramienta {
  name: string;
  input_parameters: Record<string, unknown>;
  output: string;
}

export interface Evaluacion {
  input: string;
  actual_output: string;
  retrieval_context: string[];
  tools_called: LlamadaHerramienta[];
}

export interface Tokens {
  input: number;
  output: number;
  total: number;
}

export interface TokensAgente {
  agente: string;
  modelo: string;
  input: number;
  output: number;
  total: number;
}

export interface Metadata {
  num_interacciones: number;
  agentes_invocados: string[];
  tokens: Tokens;
  tokens_por_agente: TokensAgente[];
  latencia_ms: number;
  estado: string;
}

export interface Cita {
  n: number;
  doc_id: string;
  chunk_id: string;
  fuente: string;
  titulo: string;
}

export interface SpecVisualizacion {
  componente: string;
  fenomeno: number | null;
  filtros: Record<string, unknown>;
  titulo: string;
  justificacion: string;
}

export interface Extras {
  ruta: string | null;
  citas: Cita[];
  visualizacion: SpecVisualizacion | null;
}

export interface RespuestaAgente {
  respuesta: string;
  evaluacion: Evaluacion;
  metadata: Metadata;
  extras?: Extras | null;
}

export interface ErrorProxy {
  error: string;
  detalle?: string;
}

export interface MensajeUsuario {
  id: string;
  rol: "usuario";
  texto: string;
}

export interface MensajeAgente {
  id: string;
  rol: "agente";
  datos: RespuestaAgente;
}

export interface MensajeError {
  id: string;
  rol: "error";
  texto: string;
  detalle?: string;
}

export type Mensaje = MensajeUsuario | MensajeAgente | MensajeError;

/** Referencia activa de evidencia: identifica el mensaje y el número de cita. */
export interface SeleccionEvidencia {
  idMensaje: string;
  n: number;
}
