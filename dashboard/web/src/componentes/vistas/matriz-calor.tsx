import type { EChartsOption } from "echarts";
import { useMemo } from "react";

import type { DatosMatrizCalor } from "@/api/tipos";
import { Grafico, TEMA_EJE, TEMA_TOOLTIP, type ClicGrafico } from "@/componentes/graficos/grafico";
import { Vacio } from "@/componentes/ui/estados";
import { VIRIDIS_VISIBLE } from "@/lib/paleta";
import type { PropsVista } from "@/lib/seleccion";
import { formatearEntero, maximoDe, recortar } from "@/lib/utils";
import { TEMA, TEXTO_MINIMO } from "@/lib/tema";

/** Matriz de calor: cruce de dos categóricas con el conteo de coincidencias. */
export function VistaMatrizCalor({ datos, onSeleccionar }: PropsVista<DatosMatrizCalor>) {
  const maximo = useMemo(() => maximoDe(datos.celdas.map((c) => c.valor)), [datos.celdas]);

  const opcion = useMemo<EChartsOption>(() => {
    const datosCeldas = datos.celdas.map((celda) => [
      datos.columnas.indexOf(celda.columna),
      datos.filas.indexOf(celda.fila),
      celda.valor,
    ]);

    return {
      grid: { left: 8, right: 16, top: 8, bottom: 72, containLabel: true },
      tooltip: {
        ...TEMA_TOOLTIP,
        formatter: (params) => {
          const p = params as unknown as { value?: unknown };
          const valor = Array.isArray(p.value) ? p.value : [];
          const columna = datos.columnas[Number(valor[0])] ?? "";
          const fila = datos.filas[Number(valor[1])] ?? "";
          return [
            `<strong>${fila}</strong>`,
            `${columna}`,
            `${formatearEntero(Number(valor[2]))} coincidencias`,
          ].join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        data: datos.columnas,
        ...TEMA_EJE,
        splitArea: { show: true, areaStyle: { color: [TEMA.franjaA, TEMA.franjaB] } },
        axisLabel: {
          ...TEMA_EJE.axisLabel,
          rotate: 35,
          formatter: (valor: string) => recortar(valor, 22),
        },
      },
      yAxis: {
        type: "category",
        data: datos.filas,
        ...TEMA_EJE,
        splitArea: { show: true, areaStyle: { color: [TEMA.franjaA, TEMA.franjaB] } },
        axisLabel: { ...TEMA_EJE.axisLabel, formatter: (valor: string) => recortar(valor, 24) },
      },
      visualMap: {
        min: 0,
        max: Math.max(1, maximo),
        calculable: false,
        orient: "horizontal",
        left: "center",
        bottom: 8,
        text: [`${formatearEntero(maximo)} coincidencias`, "0"],
        textStyle: { color: TEMA.apagado, fontSize: TEXTO_MINIMO },
        inRange: { color: [...VIRIDIS_VISIBLE] },
      },
      series: [
        {
          name: "Coincidencias",
          type: "heatmap",
          data: datosCeldas,
          label: {
            show: datos.celdas.length <= 180,
            // Texto claro con contorno oscuro: legible sobre toda la rampa viridis.
            color: TEMA.texto,
            textBorderColor: TEMA.fondo,
            textBorderWidth: 2,
            fontSize: TEXTO_MINIMO,
            formatter: (params) => {
              const p = params as unknown as { value?: unknown };
              const valor = Array.isArray(p.value) ? Number(p.value[2]) : 0;
              return valor > 0 ? formatearEntero(valor) : "";
            },
          },
          itemStyle: { borderColor: TEMA.fondo, borderWidth: 1 },
          emphasis: { itemStyle: { borderColor: TEMA.texto, borderWidth: 2 } },
        },
      ],
    };
  }, [datos, maximo]);

  if (datos.celdas.length === 0) {
    return (
      <Vacio
        titulo="Sin cruces con datos"
        detalle="Pruebe otra combinación de filas y columnas, u otro tipo de entidad."
      />
    );
  }

  const alClic = (clic: ClicGrafico) => {
    const celda = datos.celdas[clic.indiceDato];
    if (!celda) {
      return;
    }
    onSeleccionar({
      titulo: `${celda.fila} × ${celda.columna}`,
      detalle: `${formatearEntero(celda.valor)} coincidencias en el corpus`,
      origen: "matriz_calor",
      refs: celda.refs ?? [],
    });
  };

  return (
    <Grafico
      opcion={opcion}
      altura={Math.max(340, datos.filas.length * 24 + 140)}
      descripcion={`Matriz de ${String(datos.filas.length)} filas por ${String(
        datos.columnas.length,
      )} columnas; el valor más alto es ${formatearEntero(maximo)} coincidencias.`}
      onClic={alClic}
    />
  );
}
