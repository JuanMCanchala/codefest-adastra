import type { EChartsOption } from "echarts";
import { useMemo } from "react";

import type { DatosDistribucion } from "@/api/tipos";
import { Grafico, TEMA_EJE, TEMA_TOOLTIP, type ClicGrafico } from "@/componentes/graficos/grafico";
import { Vacio } from "@/componentes/ui/estados";
import { fenomenoPorId } from "@/lib/fenomenos";
import type { PropsVista } from "@/lib/seleccion";
import { formatearEntero } from "@/lib/utils";
import { TEMA } from "@/lib/tema";

/**
 * Histograma: la tarea «distribución» del Anexo B.2.1.
 *
 * Arriba, cinco cifras que describen la forma sin mirar el gráfico (mínimo, mediana, media,
 * percentil 90, máximo); abajo, las barras. La última barra recoge la cola larga y su
 * etiqueta lo dice («≥ X»), porque estas variables son muy asimétricas y un eje hasta el
 * máximo dejaría todo en la primera barra. Cada barra abre en el panel de evidencia los
 * sujetos de mayor valor que contiene: es la forma de comprobar quién está en la cola.
 */
export function VistaDistribucion({
  datos,
  fenomeno,
  onSeleccionar,
}: PropsVista<DatosDistribucion>) {
  const color = fenomenoPorId(fenomeno)?.color ?? TEMA.senal;

  const opcion = useMemo<EChartsOption>(
    () => ({
      grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
      tooltip: {
        ...TEMA_TOOLTIP,
        trigger: "item",
        formatter: (params) => {
          const p = params as unknown as { dataIndex?: number };
          const barra = datos.barras[p.dataIndex ?? -1];
          if (!barra) {
            return "";
          }
          const ejemplos =
            barra.ejemplos.length > 0 ? `<br/>p. ej. ${barra.ejemplos.join(", ")}` : "";
          return (
            [
              `<strong>${barra.etiqueta} ${datos.unidad}</strong>`,
              `${formatearEntero(barra.cuenta)} ${datos.sujetos}`,
            ].join("<br/>") + ejemplos
          );
        },
      },
      xAxis: {
        type: "category",
        data: datos.barras.map((b) => b.etiqueta),
        name: datos.unidad,
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: { color: TEMA.apagado },
        ...TEMA_EJE,
        axisLabel: {
          ...TEMA_EJE.axisLabel,
          interval: 0,
          rotate: datos.barras.length > 12 ? 40 : 0,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        name: datos.sujetos,
        nameTextStyle: { color: TEMA.apagado, align: "left" },
        ...TEMA_EJE,
      },
      series: [
        {
          type: "bar",
          barCategoryGap: "12%",
          itemStyle: { color, borderColor: TEMA.fondo, borderWidth: 1 },
          emphasis: { itemStyle: { borderColor: TEMA.texto, borderWidth: 1 } },
          label: {
            show: true,
            position: "top",
            color: TEMA.apagado,
            fontSize: 10,
            formatter: (p) => {
              const valor = (p as { value?: number }).value ?? 0;
              return valor > 0 ? formatearEntero(valor) : "";
            },
          },
          data: datos.barras.map((b) => b.cuenta),
        },
      ],
    }),
    [color, datos],
  );

  if (datos.barras.length === 0 || !datos.resumen) {
    return (
      <Vacio
        titulo="Sin sujetos para esta variable"
        detalle="Esta variable no tiene datos en el fenómeno elegido. Pruebe otra variable o quite el filtro de fenómeno."
      />
    );
  }

  const alClic = (clic: ClicGrafico) => {
    const barra = datos.barras[clic.indiceDato];
    if (!barra) {
      return;
    }
    onSeleccionar({
      titulo: `${barra.etiqueta} ${datos.unidad}`,
      detalle: `${formatearEntero(barra.cuenta)} ${datos.sujetos} en esta barra${
        barra.ejemplos.length > 0 ? ` · p. ej. ${barra.ejemplos.join(", ")}` : ""
      }`,
      origen: "distribucion",
      refs: barra.refs ?? [],
    });
  };

  const r = datos.resumen;
  const cifras: { etiqueta: string; valor: string; ayuda: string }[] = [
    {
      etiqueta: "Sujetos",
      valor: formatearEntero(datos.total),
      ayuda: datos.sujetos,
    },
    {
      etiqueta: "Mínimo",
      valor: formatearEntero(r.minimo),
      ayuda: datos.unidad,
    },
    {
      etiqueta: "Mediana",
      valor: formatearEntero(r.mediana),
      ayuda: "la mitad está por debajo",
    },
    {
      etiqueta: "Media",
      valor: String(r.media),
      ayuda: "arrastrada por la cola",
    },
    {
      etiqueta: "P90",
      valor: formatearEntero(r.p90),
      ayuda: "el 90 % está por debajo",
    },
    {
      etiqueta: "Máximo",
      valor: formatearEntero(r.maximo),
      ayuda: datos.unidad,
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <dl className="grid grid-cols-3 gap-px border-b border-borde bg-borde sm:grid-cols-6">
        {cifras.map((cifra) => (
          <div key={cifra.etiqueta} className="bg-panel px-4 py-2.5">
            <dt className="text-xs uppercase tracking-[0.06em] text-tenue">{cifra.etiqueta}</dt>
            <dd className="font-mono text-lg leading-tight text-texto">{cifra.valor}</dd>
            <dd className="truncate text-xs text-apagado" title={cifra.ayuda}>
              {cifra.ayuda}
            </dd>
          </div>
        ))}
      </dl>
      <Grafico
        opcion={opcion}
        altura={360}
        descripcion={`Histograma de ${datos.unidad} por ${datos.sujetos}: ${String(
          datos.barras.length,
        )} barras, ${formatearEntero(datos.total)} ${datos.sujetos}, mediana ${formatearEntero(
          r.mediana,
        )} y máximo ${formatearEntero(r.maximo)}.`}
        onClic={alClic}
      />
    </div>
  );
}
