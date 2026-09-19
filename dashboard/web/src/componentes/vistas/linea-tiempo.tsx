import type { EChartsOption } from "echarts";
import { useMemo } from "react";

import type { DatosLineaTiempo } from "@/api/tipos";
import { Grafico, TEMA_EJE, TEMA_TOOLTIP, type ClicGrafico } from "@/componentes/graficos/grafico";
import { Vacio } from "@/componentes/ui/estados";
import { FENOMENOS } from "@/lib/fenomenos";
import type { PropsVista } from "@/lib/seleccion";
import { formatearEntero } from "@/lib/utils";

const SERIE_REAPARICIONES = "Reapariciones de la entidad";

/** Línea de tiempo por fenómeno, con marcas de reaparición de la entidad rastreada. */
export function VistaLineaTiempo({ datos, onSeleccionar }: PropsVista<DatosLineaTiempo>) {
  const anios = useMemo(() => {
    const conjunto = new Set<number>();
    for (const punto of datos.series) conjunto.add(punto.anio);
    for (const marca of datos.reapariciones) conjunto.add(marca.anio);
    return [...conjunto].sort((a, b) => a - b);
  }, [datos]);

  const totalPorAnio = useMemo(() => {
    const mapa = new Map<number, number>();
    for (const punto of datos.series) {
      mapa.set(punto.anio, (mapa.get(punto.anio) ?? 0) + punto.documentos);
    }
    return mapa;
  }, [datos.series]);

  const marcas = useMemo(
    () => [...datos.reapariciones].sort((a, b) => a.anio - b.anio),
    [datos.reapariciones],
  );

  const opcion = useMemo<EChartsOption>(() => {
    const seriesFenomeno = FENOMENOS.filter((fenomeno) =>
      datos.series.some((p) => p.fenomeno === fenomeno.id),
    ).map((fenomeno) => ({
      name: `${fenomeno.clave} · ${fenomeno.nombre}`,
      type: "line" as const,
      smooth: false,
      symbol: fenomeno.simbolo,
      symbolSize: 7,
      lineStyle: { width: 2, color: fenomeno.color, type: fenomeno.trazo },
      itemStyle: { color: fenomeno.color },
      areaStyle: { color: fenomeno.color, opacity: 0.08 },
      connectNulls: false,
      data: anios.map(
        (anio) =>
          datos.series.find((p) => p.anio === anio && p.fenomeno === fenomeno.id)?.documentos ??
          null,
      ),
    }));

    const serieMarcas =
      marcas.length > 0
        ? [
            {
              name: SERIE_REAPARICIONES,
              type: "scatter" as const,
              symbol: "pin" as const,
              symbolSize: 26,
              itemStyle: { color: "#58a6ff", borderColor: "#080b10", borderWidth: 1 },
              z: 5,
              data: marcas.map((marca) => [
                String(marca.anio),
                totalPorAnio.get(marca.anio) ?? 0,
              ]),
            },
          ]
        : [];

    return {
      grid: { left: 8, right: 24, top: 16, bottom: 44, containLabel: true },
      tooltip: { ...TEMA_TOOLTIP, trigger: "axis" },
      legend: {
        bottom: 0,
        textStyle: { color: "#9dacbd", fontSize: 11 },
        itemWidth: 14,
        itemHeight: 10,
      },
      xAxis: {
        type: "category",
        data: anios.map((a) => String(a)),
        name: "año",
        nameLocation: "end",
        nameTextStyle: { color: "#9dacbd" },
        ...TEMA_EJE,
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        name: "documentos con fecha",
        nameTextStyle: { color: "#9dacbd", align: "left" },
        ...TEMA_EJE,
      },
      series: [...seriesFenomeno, ...serieMarcas],
    };
  }, [anios, datos.series, marcas, totalPorAnio]);

  if (anios.length === 0) {
    return (
      <Vacio
        titulo="Sin documentos fechados en el rango"
        detalle="Solo los documentos con año conocido entran en la serie. Amplíe el rango de años."
      />
    );
  }

  const alClic = (clic: ClicGrafico) => {
    if (clic.serie === SERIE_REAPARICIONES) {
      const marca = marcas[clic.indiceDato];
      if (marca) {
        onSeleccionar({
          titulo: `${marca.entidad} · ${String(marca.anio)}`,
          detalle: "Reaparición de la entidad en un documento de ese año",
          origen: "linea_tiempo",
          refs: [{ doc_id: marca.doc_id, chunk_id: marca.chunk_id }],
        });
      }
      return;
    }
    const anio = anios[clic.indiceDato];
    if (anio === undefined) {
      return;
    }
    onSeleccionar({
      titulo: String(anio),
      detalle: `${formatearEntero(totalPorAnio.get(anio) ?? 0)} documentos fechados ese año`,
      origen: "linea_tiempo",
      refs: [],
    });
  };

  return (
    <Grafico
      opcion={opcion}
      altura={380}
      descripcion={`Serie anual de documentos por fenómeno entre ${String(anios[0])} y ${String(
        anios[anios.length - 1],
      )}, con ${String(marcas.length)} marcas de reaparición.`}
      onClic={alClic}
    />
  );
}
