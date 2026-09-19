import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import { TEMA, TEXTO_MINIMO } from "@/lib/tema";

/**
 * Datos de un clic en un gráfico. Las vistas resuelven las refs con `indiceDato`
 * sobre su propio arreglo, de modo que nunca se inyecta nada no tipado en la opción.
 */
export interface ClicGrafico {
  nombre: string;
  serie: string;
  indiceDato: number;
  indiceSerie: number;
  valores: unknown[];
}

interface Props {
  /** Opción completa de ECharts; se aplica con `notMerge` en cada cambio. */
  opcion: echarts.EChartsOption;
  /** Alto en píxeles, o `true` para crecer con `--alto-vista` como hacen los mapas. */
  altura: number | "vista";
  /** Descripción textual del gráfico para lectores de pantalla. */
  descripcion: string;
  onClic?: (clic: ClicGrafico) => void;
}

export const TEMA_EJE = {
  axisLine: { lineStyle: { color: TEMA.borde } },
  axisTick: { show: false },
  axisLabel: { color: TEMA.apagado, fontSize: TEXTO_MINIMO },
  splitLine: { lineStyle: { color: TEMA.elevado } },
} as const;

export const TEMA_TOOLTIP = {
  backgroundColor: TEMA.elevado,
  borderColor: TEMA.borde,
  textStyle: { color: TEMA.texto, fontSize: 12 },
  extraCssText: "box-shadow: 0 8px 24px rgb(0 0 0 / 0.5); border-radius: 6px;",
} as const;

export function Grafico({ opcion, altura, descripcion, onClic }: Props) {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const grafico = useRef<echarts.ECharts | null>(null);
  const manejador = useRef<Props["onClic"]>(onClic);

  manejador.current = onClic;

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) {
      return;
    }
    const instancia = echarts.init(nodo, undefined, { renderer: "canvas" });
    grafico.current = instancia;
    instancia.on("click", (parametros) => {
      const fn = manejador.current;
      if (!fn) {
        return;
      }
      const bruto = parametros as unknown as {
        name?: string;
        seriesName?: string;
        dataIndex?: number;
        seriesIndex?: number;
        value?: unknown;
      };
      fn({
        nombre: bruto.name ?? "",
        serie: bruto.seriesName ?? "",
        indiceDato: bruto.dataIndex ?? -1,
        indiceSerie: bruto.seriesIndex ?? -1,
        valores: Array.isArray(bruto.value) ? bruto.value : [bruto.value],
      });
    });
    const observador = new ResizeObserver(() => instancia.resize());
    observador.observe(nodo);
    return () => {
      observador.disconnect();
      instancia.dispose();
      grafico.current = null;
    };
  }, []);

  useEffect(() => {
    grafico.current?.setOption(opcion, true);
  }, [opcion]);

  return (
    <div
      ref={contenedor}
      style={{ height: altura === "vista" ? "var(--alto-vista, 420px)" : `${String(altura)}px` }}
      className="w-full"
      role="img"
      aria-label={descripcion}
    />
  );
}
