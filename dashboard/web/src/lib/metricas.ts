import type { ResultadoComponente } from "@/api/tipos";
import { formatearEntero } from "@/lib/utils";

export interface Metrica {
  etiqueta: string;
  valor: string;
}

function suma(valores: readonly number[]): number {
  return valores.reduce((total, valor) => total + valor, 0);
}

function mayor<T>(filas: readonly T[], peso: (fila: T) => number): T | null {
  let mejor: T | null = null;
  for (const fila of filas) {
    if (mejor === null || peso(fila) > peso(mejor)) {
      mejor = fila;
    }
  }
  return mejor;
}

/**
 * Cifras de cabecera del resultado, para leerlas junto a la respuesta del agente sin
 * tener que interpretar el gráfico.
 *
 * Todas salen de `datos`, que es exactamente lo que se dibuja: no se estima, no se
 * extrapola y no se inventa ninguna que la API no permita calcular.
 */
export function metricasDe(resultado: ResultadoComponente): Metrica[] {
  const metricas: Metrica[] = [];

  switch (resultado.componente) {
    case "composicion_corpus": {
      metricas.push(
        { etiqueta: "Categorías", valor: formatearEntero(resultado.datos.length) },
        {
          etiqueta: "Documentos",
          valor: formatearEntero(suma(resultado.datos.map((f) => f.documentos))),
        },
        {
          etiqueta: "Fragmentos",
          valor: formatearEntero(suma(resultado.datos.map((f) => f.fragmentos))),
        },
      );
      break;
    }
    case "linea_tiempo": {
      const anios = resultado.datos.series.map((p) => p.anio);
      metricas.push(
        {
          etiqueta: "Periodo",
          valor:
            anios.length > 0
              ? `${String(Math.min(...anios))}–${String(Math.max(...anios))}`
              : "—",
        },
        {
          etiqueta: "Documentos",
          valor: formatearEntero(suma(resultado.datos.series.map((p) => p.documentos))),
        },
        {
          etiqueta: "Reapariciones",
          valor: formatearEntero(resultado.datos.reapariciones.length),
        },
      );
      break;
    }
    case "matriz_calor": {
      const pico = mayor(resultado.datos.celdas, (c) => c.valor);
      metricas.push(
        { etiqueta: "Filas", valor: formatearEntero(resultado.datos.filas.length) },
        { etiqueta: "Columnas", valor: formatearEntero(resultado.datos.columnas.length) },
        {
          etiqueta: "Celda mayor",
          valor: pico ? `${pico.fila} · ${formatearEntero(pico.valor)}` : "—",
        },
      );
      break;
    }
    case "red_entidades": {
      const central = mayor(resultado.datos.nodos, (n) => n.menciones);
      metricas.push(
        { etiqueta: "Entidades", valor: formatearEntero(resultado.datos.nodos.length) },
        { etiqueta: "Relaciones", valor: formatearEntero(resultado.datos.aristas.length) },
        {
          etiqueta: "Más mencionada",
          valor: central ? `${central.id} · ${formatearEntero(central.menciones)}` : "—",
        },
      );
      break;
    }
    case "mapa_colombia": {
      const conAlertas = resultado.datos.filter((f) => f.alertas > 0);
      const pico = mayor(resultado.datos, (f) => f.alertas);
      metricas.push(
        { etiqueta: "Territorios", valor: formatearEntero(conAlertas.length) },
        {
          etiqueta: "Alertas",
          valor: formatearEntero(suma(resultado.datos.map((f) => f.alertas))),
        },
        {
          etiqueta: "Mayor",
          valor: pico ? `${pico.nombre} · ${formatearEntero(pico.alertas)}` : "—",
        },
      );
      break;
    }
    case "mapa_mundo": {
      const pico = mayor(resultado.datos, (f) => f.menciones);
      metricas.push(
        { etiqueta: "Países", valor: formatearEntero(resultado.datos.length) },
        {
          etiqueta: "Menciones",
          valor: formatearEntero(suma(resultado.datos.map((f) => f.menciones))),
        },
        {
          etiqueta: "Mayor",
          valor: pico ? `${pico.nombre} · ${formatearEntero(pico.menciones)}` : "—",
        },
      );
      break;
    }
    case "cuadrante_priorizacion": {
      const pico = mayor(resultado.datos, (f) => f.intensidad);
      metricas.push(
        { etiqueta: "Ítems", valor: formatearEntero(resultado.datos.length) },
        {
          etiqueta: "Mayor intensidad",
          valor: pico ? `${pico.item} · ${formatearEntero(pico.intensidad)}` : "—",
        },
      );
      break;
    }
    case "panel_evidencia": {
      const documentos = new Set(resultado.datos.map((f) => f.doc_id));
      metricas.push(
        { etiqueta: "Fragmentos", valor: formatearEntero(resultado.datos.length) },
        { etiqueta: "Documentos", valor: formatearEntero(documentos.size) },
      );
      break;
    }
  }

  metricas.push({
    etiqueta: "Evidencia",
    valor: `${formatearEntero(resultado.total_evidencia)} fragmentos`,
  });
  return metricas;
}
