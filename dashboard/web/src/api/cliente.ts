/** Cliente HTTP de la API del tablero. Mismo origen que la SPA, siempre rutas relativas. */

import type {
  ColeccionGeo,
  CuerpoComponente,
  Fragmento,
  IdChunk,
  PropiedadesDepartamento,
  PropiedadesMunicipio,
  PropiedadesPais,
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

export function visualizar(
  instruccion: string,
  senal?: AbortSignal,
): Promise<RespuestaVisualizar> {
  return pedir<RespuestaVisualizar>("/api/visualizar", {
    method: "POST",
    headers: JSON_POST,
    body: JSON.stringify({ instruccion }),
    ...(senal ? { signal: senal } : {}),
  });
}

/** Lote de hasta 50 fragmentos; se recortan aquí para no violar el contrato. */
export async function obtenerEvidencia(
  chunkIds: readonly IdChunk[],
  senal?: AbortSignal,
): Promise<Fragmento[]> {
  const claves = chunkIds.slice(0, 50).map((c) => String(c));
  const consulta = new URLSearchParams({ chunk_ids: claves.join(",") });
  const cuerpo = await pedir<unknown>(
    `/api/evidencia?${consulta.toString()}`,
    senal ? { signal: senal } : undefined,
  );
  if (Array.isArray(cuerpo)) {
    return cuerpo as Fragmento[];
  }
  if (cuerpo && typeof cuerpo === "object") {
    const lista = (cuerpo as Record<string, unknown>)["fragmentos"];
    if (Array.isArray(lista)) {
      return lista as Fragmento[];
    }
  }
  throw new ErrorApi("La API devolvió la evidencia en un formato inesperado.", 500);
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
