import type { EChartsOption } from "echarts";
import { useMemo } from "react";

import type { FilaComposicion } from "@/api/tipos";
import { Grafico, TEMA_EJE, TEMA_TOOLTIP, type ClicGrafico } from "@/componentes/graficos/grafico";
import { Vacio } from "@/componentes/ui/estados";
import { FENOMENOS, fenomenoPorId } from "@/lib/fenomenos";
import type { PropsVista } from "@/lib/seleccion";
import { formatearEntero } from "@/lib/utils";
import { TEMA, TEXTO_MINIMO } from "@/lib/tema";

/** Barras apiladas: documentos por categoría, apilados por fenómeno. */
export function VistaComposicionCorpus({ datos, onSeleccionar }: PropsVista<FilaComposicion[]>) {
  const categorias = useMemo(() => {
    const totales = new Map<string, number>();
    for (const fila of datos) {
      totales.set(fila.categoria, (totales.get(fila.categoria) ?? 0) + fila.documentos);
    }
    return [...totales.entries()].sort((a, b) => a[1] - b[1]).map(([nombre]) => nombre);
  }, [datos]);

  const fragmentosPorClave = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const fila of datos) {
      mapa.set(`${String(fila.fenomeno)}|${fila.categoria}`, fila.fragmentos);
    }
    return mapa;
  }, [datos]);

  const opcion = useMemo<EChartsOption>(() => {
    const series = FENOMENOS.map((fenomeno) => ({
      name: `${fenomeno.clave} · ${fenomeno.nombre}`,
      type: "bar" as const,
      stack: "documentos",
      barMaxWidth: 22,
      itemStyle: { color: fenomeno.color, borderColor: TEMA.fondo, borderWidth: 1 },
      emphasis: { itemStyle: { borderColor: TEMA.texto, borderWidth: 1 } },
      data: categorias.map(
        (categoria) =>
          datos.find((f) => f.categoria === categoria && f.fenomeno === fenomeno.id)?.documentos ??
          0,
      ),
    }));

    return {
      grid: { left: 8, right: 24, top: 8, bottom: 32, containLabel: true },
      tooltip: {
        ...TEMA_TOOLTIP,
        trigger: "item",
        formatter: (params) => {
          const p = params as unknown as { name?: string; seriesName?: string; value?: number };
          const clave = (p.seriesName ?? "").slice(1, 2);
          const fragmentos = fragmentosPorClave.get(`${clave}|${p.name ?? ""}`) ?? 0;
          return [
            `<strong>${p.name ?? ""}</strong>`,
            `${p.seriesName ?? ""}`,
            `${formatearEntero(p.value ?? 0)} documentos`,
            `${formatearEntero(fragmentos)} fragmentos`,
          ].join("<br/>");
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: TEMA.apagado, fontSize: TEXTO_MINIMO },
        itemWidth: 10,
        itemHeight: 10,
      },
      xAxis: { type: "value", name: "documentos", nameTextStyle: { color: TEMA.apagado }, ...TEMA_EJE },
      yAxis: {
        type: "category",
        data: categorias,
        ...TEMA_EJE,
        axisLabel: { ...TEMA_EJE.axisLabel, width: 150, overflow: "truncate" },
        splitLine: { show: false },
      },
      series,
    };
  }, [categorias, datos, fragmentosPorClave]);

  if (datos.length === 0) {
    return (
      <Vacio
        titulo="Sin categorías para esta combinación"
        detalle="Cambie la dimensión o el fenómeno en los filtros."
      />
    );
  }

  const alClic = (clic: ClicGrafico) => {
    const fenomeno = fenomenoPorId(Number(clic.serie.slice(1, 2)));
    const fila = datos.find((f) => f.categoria === clic.nombre && f.fenomeno === fenomeno?.id);
    onSeleccionar({
      titulo: clic.nombre,
      detalle: `${formatearEntero(fila?.documentos ?? 0)} documentos y ${formatearEntero(
        fila?.fragmentos ?? 0,
      )} fragmentos${fenomeno ? ` en ${fenomeno.clave}` : ""}`,
      origen: "composicion_corpus",
      refs: [],
    });
  };

  return (
    <Grafico
      opcion={opcion}
      altura={Math.max(320, categorias.length * 28 + 90)}
      descripcion={`Barras apiladas con ${String(categorias.length)} categorías de documentos por fenómeno.`}
      onClic={alClic}
    />
  );
}
