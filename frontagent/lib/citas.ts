/** Segmentación del texto de la respuesta para volver clicables las citas `[n]`. */

export type Segmento =
  | { tipo: "texto"; texto: string }
  | { tipo: "cita"; n: number };

const PATRON_CITA = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

export function segmentarLinea(linea: string): Segmento[] {
  const segmentos: Segmento[] = [];
  let ultimo = 0;

  for (const coincidencia of linea.matchAll(PATRON_CITA)) {
    const indice = coincidencia.index;
    const grupo = coincidencia[1];
    if (indice === undefined || grupo === undefined) {
      continue;
    }
    if (indice > ultimo) {
      segmentos.push({ tipo: "texto", texto: linea.slice(ultimo, indice) });
    }
    for (const bruto of grupo.split(",")) {
      const n = Number.parseInt(bruto.trim(), 10);
      if (Number.isFinite(n)) {
        segmentos.push({ tipo: "cita", n });
      }
    }
    ultimo = indice + coincidencia[0].length;
  }

  if (ultimo < linea.length) {
    segmentos.push({ tipo: "texto", texto: linea.slice(ultimo) });
  }
  return segmentos;
}

/** Divide la respuesta en párrafos y cada párrafo en segmentos de texto y citas. */
export function segmentarRespuesta(texto: string): Segmento[][] {
  return texto
    .split(/\n{2,}/)
    .map((parrafo) => parrafo.trim())
    .filter((parrafo) => parrafo.length > 0)
    .map(segmentarLinea);
}
