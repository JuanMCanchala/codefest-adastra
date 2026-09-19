import type { EChartsOption, ScatterSeriesOption } from "echarts";
import { useMemo } from "react";

import type { FilaCuadrante } from "@/api/tipos";
import { Grafico, TEMA_EJE, TEMA_TOOLTIP, type ClicGrafico } from "@/componentes/graficos/grafico";
import { Vacio } from "@/componentes/ui/estados";
import { colorFenomeno } from "@/lib/fenomenos";
import type { PropsVista } from "@/lib/seleccion";
import { formatearEntero, formatearSigno, mediana, recortar } from "@/lib/utils";
import { TEMA, TEXTO_MINIMO } from "@/lib/tema";

const CUADRANTES = [
  { titulo: "Alto y en aumento", posicion: "insideTopRight" as const },
  { titulo: "Bajo y en aumento", posicion: "insideTopLeft" as const },
  { titulo: "Alto y a la baja", posicion: "insideBottomRight" as const },
  { titulo: "Bajo y a la baja", posicion: "insideBottomLeft" as const },
];

type AreaCuadrante = NonNullable<
  NonNullable<ScatterSeriesOption["markArea"]>["data"]
>[number];

/** Dispersión conteo total frente a cambio del conteo, partida por las medianas. */
export function VistaCuadrantePriorizacion({
  datos,
  fenomeno,
  onSeleccionar,
}: PropsVista<FilaCuadrante[]>) {
  const medianas = useMemo(
    () => ({
      intensidad: mediana(datos.map((f) => f.intensidad)),
      tendencia: mediana(datos.map((f) => f.tendencia)),
    }),
    [datos],
  );

  const opcion = useMemo<EChartsOption>(() => {
    const color = colorFenomeno(fenomeno);
    const maxIntensidad = Math.max(1, ...datos.map((f) => f.intensidad));
    const areas = CUADRANTES.map((cuadrante, indice): AreaCuadrante => {
      const derecha = indice === 0 || indice === 2;
      const arriba = indice === 0 || indice === 1;
      return [
        {
          xAxis: derecha ? medianas.intensidad : "min",
          yAxis: arriba ? medianas.tendencia : "min",
          itemStyle: { color: "transparent" },
          label: {
            show: true,
            position: cuadrante.posicion,
            distance: 10,
            color: TEMA.tenue,
            fontSize: TEXTO_MINIMO,
            formatter: cuadrante.titulo,
          },
        },
        { xAxis: derecha ? "max" : medianas.intensidad, yAxis: arriba ? "max" : medianas.tendencia },
      ] as unknown as AreaCuadrante;
    });

    return {
      grid: { left: 8, right: 32, top: 28, bottom: 44, containLabel: true },
      tooltip: {
        ...TEMA_TOOLTIP,
        formatter: (params) => {
          const p = params as unknown as { dataIndex?: number };
          const fila = datos[p.dataIndex ?? -1];
          if (!fila) return "";
          return [
            `<strong>${fila.item}</strong>`,
            `Conteo total: ${formatearEntero(fila.intensidad)}`,
            `Cambio del conteo: ${formatearSigno(fila.tendencia)}`,
          ].join("<br/>");
        },
      },
      xAxis: {
        type: "value",
        name: "conteo total (menciones)",
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { color: TEMA.apagado },
        ...TEMA_EJE,
      },
      yAxis: {
        type: "value",
        // El nombre largo se comía la esquina superior: va arriba, en su propia línea.
        name: "cambio del conteo",
        nameLocation: "end",
        nameGap: 14,
        nameTextStyle: { color: TEMA.apagado, align: "left" },
        ...TEMA_EJE,
      },
      series: [
        {
          name: "Sujetos",
          type: "scatter",
          symbolSize: (valor: unknown) => {
            const par = Array.isArray(valor) ? valor : [];
            const intensidad = Number(par[0]);
            return 8 + Math.sqrt(Math.max(0, intensidad) / maxIntensidad) * 18;
          },
          itemStyle: { color, opacity: 0.85, borderColor: TEMA.fondo },
          emphasis: { itemStyle: { borderColor: TEMA.texto, borderWidth: 2 } },
          label: {
            show: true,
            position: "right",
            distance: 6,
            color: TEMA.apagado,
            fontSize: TEXTO_MINIMO,
            formatter: (params) => {
              const p = params as unknown as { dataIndex?: number };
              return recortar(datos[p.dataIndex ?? -1]?.item ?? "", 18);
            },
          },
          /*
           * En el rincón de los conteos bajos se apelotonan casi todos los sujetos y las
           * etiquetas se pisaban hasta ser ilegibles. ECharts esconde las que chocan y deja
           * las de los puntos mayores, que son los que se priorizan; el resto sigue en el
           * globo al pasar el ratón y en el panel de evidencia al pulsar.
           */
          labelLayout: { hideOverlap: true },
          data: datos.map((fila) => [fila.intensidad, fila.tendencia]),
          markLine: {
            silent: true,
            symbol: "none",
            label: {
              color: TEMA.tenue,
              fontSize: TEXTO_MINIMO,
              position: "insideEndTop",
              // Sin esto ECharts gira el rótulo con la línea y la mediana vertical se lee
              // de lado, encima de los puntos.
              rotate: 0,
              formatter: (params: unknown) => {
                const p = params as { name?: string };
                return p.name ?? "";
              },
            },
            lineStyle: { color: TEMA.borde, type: "dashed" },
            data: [
              { name: "mediana", xAxis: medianas.intensidad },
              { name: "mediana", yAxis: medianas.tendencia },
            ],
          },
          markArea: { silent: true, data: areas },
        },
      ],
    };
  }, [datos, fenomeno, medianas]);

  if (datos.length === 0) {
    return (
      <Vacio
        titulo="Sin sujetos para priorizar"
        detalle="Cambie el sujeto o el año de corte para obtener conteos comparables."
      />
    );
  }

  const alClic = (clic: ClicGrafico) => {
    const fila = datos[clic.indiceDato];
    if (!fila) {
      return;
    }
    onSeleccionar({
      titulo: fila.item,
      detalle: `Conteo total ${formatearEntero(fila.intensidad)} · cambio ${formatearSigno(
        fila.tendencia,
      )}`,
      origen: "cuadrante_priorizacion",
      refs: fila.refs ?? [],
    });
  };

  return (
    <Grafico
      opcion={opcion}
      altura="vista"
      descripcion={`Dispersión de ${String(datos.length)} sujetos; medianas en ${formatearEntero(
        medianas.intensidad,
      )} de conteo total y ${formatearSigno(medianas.tendencia)} de cambio.`}
      onClic={alClic}
    />
  );
}
