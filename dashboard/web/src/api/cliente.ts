/** Cliente HTTP de la API del tablero. Mismo origen que la SPA, siempre rutas relativas. */

import type {
  ColeccionGeo,
  CuerpoComponente,
  Fragmento,
  IdChunk,
  PropiedadesDepartamento,
  PropiedadesMunicipio,
  PropiedadesPais,
  RespuestaLectura,
  ResultadoComponente,
  RespuestaVisualizar,
  Salud,
} from "./tipos";

export class ErrorApi extends Error {
  readonly estado: number;

  constructor(mensaje: string, estado: number) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estado = estado;
  }
}

function mensajeDeError(cuerpo: unknown, estado: number): string {
  if (cuerpo && typeof cuerpo === "object") {
    const registro = cuerpo as Record<string, unknown>;
    const detalle = registro["detail"] ?? registro["mensaje"] ?? registro["error"];
    if (typeof detalle === "string" && detalle.length > 0) {
      return detalle;
    }
  }
  return `La API respondió con estado ${String(estado)}.`;
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(ruta, init);
  } catch {
    throw new ErrorApi("No se pudo contactar la API del tablero.", 0);
  }
  const texto = await respuesta.text();
  let cuerpo: unknown = null;
  if (texto.length > 0) {
    try {
      cuerpo = JSON.parse(texto);
    } catch {
      cuerpo = null;
    }
  }
  if (!respuesta.ok) {
    throw new ErrorApi(mensajeDeError(cuerpo, respuesta.status), respuesta.status);
  }
  return cuerpo as T;
}

const JSON_POST = { "Content-Type": "application/json" } as const;

export function obtenerSalud(senal?: AbortSignal): Promise<Salud> {
  return pedir<Salud>("/api/salud", senal ? { signal: senal } : undefined);
}

export function calcularComponente(
  cuerpo: CuerpoComponente,
  senal?: AbortSignal,
): Promise<ResultadoComponente> {
  return pedir<ResultadoComponente>("/api/componente", {
    method: "POST",
    headers: JSON_POST,
    body: JSON.stringify(cuerpo),
    ...(senal ? { signal: senal } : {}),
  });
}

export function visualizar(instruccion: string, senal?: AbortSignal): Promise<RespuestaVisualizar> {
  return pedir<RespuestaVisualizar>("/api/visualizar", {
    method: "POST",
    headers: JSON_POST,
    body: JSON.stringify({ instruccion }),
    ...(senal ? { signal: senal } : {}),
  });
}

/**
 * Resumen en prosa del tríptico satelital. El veredicto de minería no se pide aquí: ya
 * viene medido con el componente, y esta llamada solo añade las palabras.
 */
export function interpretar(
  sitio: string,
  encuadre: string,
  senal?: AbortSignal,
): Promise<RespuestaLectura> {
  return pedir<RespuestaLectura>("/api/interpretar", {
    method: "POST",
    headers: JSON_POST,
    body: JSON.stringify({ sitio, encuadre }),
    ...(senal ? { signal: senal } : {}),
  });
}

/** Resultado del lote: los fragmentos abiertos y los `chunk_id` que la API no encontró. */
export interface LoteEvidencia {
  fragmentos: Fragmento[];
  faltantes: IdChunk[];
}

/**
 * Lote de hasta 50 fragmentos; se recortan aquí para no violar el contrato.
 *
 * Una cita rota no tumba el lote: la API devuelve los que existen y nombra los que no en
 * `faltantes`, y aquí se conservan para poder decir «no se pudo abrir la referencia».
 */
export async function obtenerLoteEvidencia(
  chunkIds: readonly IdChunk[],
  senal?: AbortSignal,
): Promise<LoteEvidencia> {
  const claves = chunkIds.slice(0, 50).map((c) => String(c));
  const consulta = new URLSearchParams({ chunk_ids: claves.join(",") });
  const cuerpo = await pedir<unknown>(
    `/api/evidencia?${consulta.toString()}`,
    senal ? { signal: senal } : undefined,
  );
  if (Array.isArray(cuerpo)) {
    return { fragmentos: cuerpo as Fragmento[], faltantes: [] };
  }
  if (cuerpo && typeof cuerpo === "object") {
    const lista = (cuerpo as Record<string, unknown>)["fragmentos"];
    const faltantes = (cuerpo as Record<string, unknown>)["faltantes"];
    if (Array.isArray(lista)) {
      return {
        fragmentos: lista as Fragmento[],
        faltantes: Array.isArray(faltantes) ? (faltantes as IdChunk[]) : [],
      };
    }
  }
  throw new ErrorApi("La API devolvió la evidencia en un formato inesperado.", 500);
}

/** Solo los fragmentos abiertos, para quien no necesita saber cuáles faltaron. */
export async function obtenerEvidencia(
  chunkIds: readonly IdChunk[],
  senal?: AbortSignal,
): Promise<Fragmento[]> {
  return (await obtenerLoteEvidencia(chunkIds, senal)).fragmentos;
}

export function obtenerGeoDepartamentos(
  senal?: AbortSignal,
): Promise<ColeccionGeo<PropiedadesDepartamento>> {
  return pedir("/geo/departamentos.geojson", senal ? { signal: senal } : undefined);
}

export function obtenerGeoMunicipios(
  senal?: AbortSignal,
): Promise<ColeccionGeo<PropiedadesMunicipio>> {
  return pedir("/geo/municipios.geojson", senal ? { signal: senal } : undefined);
}

export function obtenerGeoPaises(senal?: AbortSignal): Promise<ColeccionGeo<PropiedadesPais>> {
  return pedir("/geo/paises.geojson", senal ? { signal: senal } : undefined);
}
