import type { EChartsOption } from "echarts";
import { useMemo } from "react";

import type { DatosDeforestacion } from "@/api/tipos";
import { Grafico, TEMA_EJE, TEMA_TOOLTIP } from "@/componentes/graficos/grafico";
import { Vacio } from "@/componentes/ui/estados";
import type { PropsVista } from "@/lib/seleccion";
import { TEMA } from "@/lib/tema";
import { cn, formatearEntero } from "@/lib/utils";

/**
 * Pérdida de bosque del Chocó, apilada por la causa que declara la fuente.
 *
 * Las barras van apiladas por causa y no sumadas porque la pregunta útil no es cuánto
 * bosque se perdió, sino **quién se lo llevó**: hay municipios cuya deforestación es
 * incendio casi entera y otros donde es minería al 99 %. Esa diferencia es la que empalma
 * con las economías ilícitas del corpus, y se pierde en cuanto se suman las causas.
 *
 * Las causas de la leyenda son botones: al pulsarlas se vuelve a pedir el componente
 * filtrado, igual que la red se expande alrededor de un nodo.
 */

/**
 * Color por causa. No es la escala de semáforo del mapa —aquí no hay «poco» ni «mucho»,
 * hay categorías—, así que son matices distinguibles entre sí y estables entre corridas:
 * si «Minería» cambiara de color al filtrar, el gráfico dejaría de poder compararse.
 */
const COLOR_CAUSA: Record<string, string> = {
  Minería: "#e2521a",
  Incendio: "#c92a2a",
  Cultivo: "#94c11f",
  Ganadería: "#d4c000",
  "Frontera Agropecuaria": "#f0a202",
  "Obras Civiles": "#3291ff",
  "Crecimiento Urbano": "#7048e8",
  Deslizamiento: "#495057",
  Derrumbe: "#5c5f66",
  "Relleno Sanitario": "#868e96",
  Desconocida: "#4a4a4a",
  "Sin atribuir": "#343a40",
};

const colorDe = (causa: string): string => COLOR_CAUSA[causa] ?? TEMA.tenue;

const formatearHa = (ha: number): string =>
  ha >= 100 ? formatearEntero(Math.round(ha)) : ha.toFixed(1);

export function VistaDeforestacion({ datos, onAccion }: PropsVista<DatosDeforestacion>) {
  const { municipios, causas, serie, procedencia } = datos;
  const recortado = datos.municipios_totales > municipios.length;

  // Solo las causas que de verdad aparecen en los municipios en pantalla, de mayor a menor:
  // apilar doce categorías, nueve de ellas invisibles, solo ensucia la leyenda.
  const causasVisibles = useMemo(() => {
    const totales = new Map<string, number>();
    for (const m of municipios) {
      for (const [causa, ha] of Object.entries(m.por_causa)) {
        totales.set(causa, (totales.get(causa) ?? 0) + ha);
      }
    }
    return [...totales.entries()].sort((a, b) => b[1] - a[1]).map(([causa]) => causa);
  }, [municipios]);

  const opcionMunicipios = useMemo<EChartsOption>(() => {
    // De menor a mayor: ECharts dibuja el eje de categorías de abajo arriba, así que el
    // municipio con más pérdida queda arriba, que es donde se mira primero.
    const orden = [...municipios].sort((a, b) => a.ha - b.ha);
    const nombres = orden.map((m) => m.nombre);
    const series = (datos.causa ? [datos.causa] : causasVisibles).map((causa) => ({
      name: causa,
      type: "bar" as const,
      stack: "ha",
      barMaxWidth: 20,
      itemStyle: { color: colorDe(causa), borderColor: TEMA.fondo, borderWidth: 1 },
      data: orden.map((m) => (datos.causa ? m.ha : (m.por_causa[causa] ?? 0))),
    }));

    return {
      grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        ...TEMA_TOOLTIP,
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (valor) => `${formatearHa(Number(valor))} ha`,
      },
      legend: { show: false },
      xAxis: {
        type: "value",
        name: "hectáreas perdidas",
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { color: TEMA.apagado },
        ...TEMA_EJE,
      },
      yAxis: { type: "category", data: nombres, ...TEMA_EJE, splitLine: { show: false } },
      series,
    };
  }, [municipios, causasVisibles, datos.causa]);

  const opcionSerie = useMemo<EChartsOption>(
    () => ({
      grid: { left: 8, right: 16, top: 16, bottom: 4, containLabel: true },
      tooltip: {
        ...TEMA_TOOLTIP,
        trigger: "axis",
        valueFormatter: (valor) => `${formatearHa(Number(valor))} ha`,
      },
      xAxis: { type: "category", data: serie.map((s) => s.anio), ...TEMA_EJE },
      yAxis: { type: "value", ...TEMA_EJE },
      series: [
        {
          type: "bar",
          barMaxWidth: 28,
          itemStyle: { color: datos.causa ? colorDe(datos.causa) : TEMA.senal },
          data: serie.map((s) => s.ha),
        },
      ],
    }),
    [serie, datos.causa],
  );

  if (!procedencia || municipios.length === 0) {
    return (
      <Vacio
        titulo="Sin datos de deforestación"
        detalle="Se descargan con `python scripts/deforestacion_choco.py`."
      />
    );
  }

  const dominante = causas[0];
  const cifras = [
    { etiqueta: "Bosque perdido", valor: `${formatearHa(datos.total_ha)} ha` },
    { etiqueta: "Polígonos", valor: formatearEntero(procedencia.poligonos) },
    { etiqueta: "Periodo", valor: procedencia.periodo },
    {
      etiqueta: "Causa mayor",
      valor: dominante ? `${dominante.causa} · ${formatearHa(dominante.ha)} ha` : "—",
    },
  ];

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto px-4 py-3">
      {onAccion ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-apagado">Causa:</span>
          <button
            type="button"
            onClick={() =>
              onAccion({
                etiqueta: "Ver todas las causas",
                componente: "deforestacion",
                filtros: {},
              })
            }
            aria-pressed={datos.causa === null}
            className={cn(
              "rounded-md border px-2 py-0.5 text-xs transition-colors",
              datos.causa === null
                ? "border-senal/60 bg-senal/10 text-texto"
                : "border-borde text-apagado hover:text-texto",
            )}
          >
            Todas
          </button>
          {causas.slice(0, 6).map((c) => (
            <button
              key={c.causa}
              type="button"
              onClick={() =>
                onAccion({
                  etiqueta: `Ver la deforestación por ${c.causa}`,
                  componente: "deforestacion",
                  filtros: { causa: c.causa },
                })
              }
              aria-pressed={datos.causa === c.causa}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs transition-colors",
                datos.causa === c.causa
                  ? "border-senal/60 bg-senal/10 text-texto"
                  : "border-borde text-apagado hover:text-texto",
              )}
            >
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: colorDe(c.causa) }}
              />
              {c.causa}
            </button>
          ))}
        </div>
      ) : null}

      <dl className="flex flex-wrap gap-x-8 gap-y-2">
        {cifras.map((c) => (
          <div key={c.etiqueta}>
            <dt className="text-xs uppercase tracking-wide text-apagado">{c.etiqueta}</dt>
            <dd className="font-mono text-sm text-texto">{c.valor}</dd>
          </div>
        ))}
      </dl>

      <Grafico
        opcion={opcionMunicipios}
        altura={Math.max(240, municipios.length * 26 + 60)}
        descripcion={
          `Hectáreas de bosque perdidas en ${municipios.length} municipios del Chocó, ` +
          `apiladas por causa. Encabeza ${municipios[0]?.nombre ?? "—"} con ` +
          `${formatearHa(municipios[0]?.ha ?? 0)} hectáreas.`
        }
      />

      {recortado ? (
        <p className="text-xs text-apagado">
          El gráfico enseña los {municipios.length} municipios con más pérdida de{" "}
          {datos.municipios_totales} con datos, así que sus barras suman menos que el total.
        </p>
      ) : null}

      <div>
        <p className="text-xs uppercase tracking-wide text-apagado">Por año</p>
        <Grafico
          opcion={opcionSerie}
          altura={160}
          descripcion={
            `Pérdida anual de bosque entre ${serie[0]?.anio ?? "?"} y ` +
            `${serie[serie.length - 1]?.anio ?? "?"}.`
          }
        />
      </div>

      <p className="font-mono text-[11px] leading-relaxed text-apagado">
        {procedencia.fuente} · conjunto {procedencia.dataset} · {procedencia.metodo} ·{" "}
        {procedencia.periodo} · descargado {procedencia.descargado}
      </p>
    </div>
  );
}
