import type { EChartsOption } from "echarts";
import { useMemo } from "react";

import type {
  DatosPoblacionOrbital,
  ObjetoColombiaOrbital,
  PuntoSerieOrbital,
  SateliteInspector,
} from "@/api/tipos";
import { Grafico, TEMA_EJE, TEMA_TOOLTIP, type ClicGrafico } from "@/componentes/graficos/grafico";
import { Vacio } from "@/componentes/ui/estados";
import { colorCategoria } from "@/lib/paleta";
import type { PropsVista } from "@/lib/seleccion";
import { TEMA } from "@/lib/tema";
import { formatearEntero } from "@/lib/utils";

/**
 * Población de objetos en órbita, ensayos antisatélite, satélites de Colombia y satélites
 * de inspección o proximidad (F2). Cuatro vistas sobre el mismo catálogo GCAT, elegidas por
 * el filtro `vista`; cada una responde a una tarea analítica distinta del Anexo B.2.1:
 * `crecimiento` es tendencia + composición, `asat` es comparación, `colombia` es
 * tendencia/evento y `inspectores` es relación/evento (una lista curada, declarada como tal:
 * la inclusión de un satélite no afirma una intención, resume lo que documentan las fuentes
 * citadas en `referencia`).
 *
 * Sin coordenadas orbitales ni «distancia al objetivo»: GCAT no las trae, y calcularlas con
 * TLE sería un dato nuevo sin trazabilidad (Anexo B.2.5). Lo que un satélite hizo cerca de
 * otro se cita como texto con su fuente, nunca como una posición dibujada.
 */

const TIPOS = ["P", "R", "C", "D"] as const;
const NOMBRE_TIPO: Record<(typeof TIPOS)[number], string> = {
  P: "Carga útil",
  R: "Etapa de cohete",
  C: "Componente",
  D: "Desecho",
};

const DIA_MS = 86_400_000;
const EPOCA = Date.UTC(2010, 0, 1);
const diasDesde = (fechaIso: string): number => Math.round((Date.parse(fechaIso) - EPOCA) / DIA_MS);
const anioDeDias = (dias: number): string => new Date(EPOCA + dias * DIA_MS).getUTCFullYear().toString();

function VistaCrecimiento({
  datos,
}: {
  datos: Extract<DatosPoblacionOrbital, { vista: "crecimiento" }>;
}) {
  const { serie, en_orbita_por_regimen: regimenes, procedencia } = datos;

  const opcionSerie = useMemo<EChartsOption>(() => {
    const anios = [...new Set(serie.map((s: PuntoSerieOrbital) => s.anio))].sort((a, b) => a - b);
    const porTipo = new Map<string, Map<number, number>>();
    for (const fila of serie) {
      const mapaAnio = porTipo.get(fila.tipo) ?? new Map<number, number>();
      mapaAnio.set(fila.anio, (mapaAnio.get(fila.anio) ?? 0) + fila.lanzados);
      porTipo.set(fila.tipo, mapaAnio);
    }
    return {
      grid: { left: 8, right: 16, top: 32, bottom: 8, containLabel: true },
      tooltip: { ...TEMA_TOOLTIP, trigger: "axis" },
      legend: { top: 0, textStyle: { color: TEMA.apagado, fontSize: 11 } },
      xAxis: { type: "category", data: anios.map(String), ...TEMA_EJE },
      yAxis: { type: "value", name: "objetos catalogados", nameTextStyle: { color: TEMA.apagado }, ...TEMA_EJE },
      series: TIPOS.map((tipo, i) => ({
        name: NOMBRE_TIPO[tipo],
        type: "bar" as const,
        stack: "objetos",
        barMaxWidth: 18,
        itemStyle: { color: colorCategoria(i) },
        data: anios.map((anio) => (porTipo.get(tipo)?.get(anio) ?? 0)),
      })),
    };
  }, [serie]);

  const opcionRegimen = useMemo<EChartsOption>(() => {
    const totalPorRegimen = new Map<string, number>();
    for (const r of regimenes) {
      totalPorRegimen.set(r.regimen, (totalPorRegimen.get(r.regimen) ?? 0) + r.n);
    }
    const orden = [...totalPorRegimen.entries()].sort((a, b) => b[1] - a[1]).map(([r]) => r);
    const porTipo = new Map<string, Map<string, number>>();
    for (const fila of regimenes) {
      const mapaRegimen = porTipo.get(fila.tipo) ?? new Map<string, number>();
      mapaRegimen.set(fila.regimen, (mapaRegimen.get(fila.regimen) ?? 0) + fila.n);
      porTipo.set(fila.tipo, mapaRegimen);
    }
    return {
      grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
      tooltip: { ...TEMA_TOOLTIP, trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { show: false },
      xAxis: { type: "category", data: orden, ...TEMA_EJE },
      yAxis: { type: "value", name: "en órbita hoy", nameTextStyle: { color: TEMA.apagado }, ...TEMA_EJE },
      series: TIPOS.map((tipo, i) => ({
        name: NOMBRE_TIPO[tipo],
        type: "bar" as const,
        stack: "regimen",
        barMaxWidth: 26,
        itemStyle: { color: colorCategoria(i) },
        data: orden.map((r) => (porTipo.get(tipo)?.get(r) ?? 0)),
      })),
    };
  }, [regimenes]);

  if (serie.length === 0) {
    return (
      <Vacio
        titulo="Sin datos de población orbital"
        detalle="Se descargan con `python scripts/gcat_orbita.py`."
      />
    );
  }

  const totalEnOrbita = regimenes.reduce((acc, r) => acc + r.n, 0);
  const totalCatalogado = serie.reduce((acc, s) => acc + s.lanzados, 0);
  const ultimoAnio = Math.max(...serie.map((s) => s.anio));

  const cifras = [
    { etiqueta: "En órbita hoy", valor: formatearEntero(totalEnOrbita) },
    { etiqueta: "Catalogados en el rango", valor: formatearEntero(totalCatalogado) },
    { etiqueta: "Último año con lanzamientos", valor: String(ultimoAnio) },
  ];

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto px-4 py-3">
      <dl className="flex flex-wrap gap-x-8 gap-y-2">
        {cifras.map((c) => (
          <div key={c.etiqueta}>
            <dt className="text-xs uppercase tracking-wide text-apagado">{c.etiqueta}</dt>
            <dd className="font-mono text-sm text-texto">{c.valor}</dd>
          </div>
        ))}
      </dl>
      <Grafico
        opcion={opcionSerie}
        altura={280}
        descripcion={`Objetos catalogados por año de lanzamiento, apilados por tipo, hasta ${String(ultimoAnio)}.`}
      />
      <div>
        <p className="text-xs uppercase tracking-wide text-apagado">En órbita hoy, por régimen</p>
        <Grafico
          opcion={opcionRegimen}
          altura={200}
          descripcion={`${formatearEntero(totalEnOrbita)} objetos en órbita hoy, repartidos por régimen orbital y tipo.`}
        />
      </div>
      {procedencia ? (
        <p className="font-mono text-[11px] leading-relaxed text-apagado">
          {procedencia.fuente} · {procedencia.licencia} · actualizado {procedencia.actualizado} ·
          descargado {procedencia.descargado}
        </p>
      ) : null}
    </div>
  );
}

function VistaAsat({
  datos,
  onSeleccionar,
}: {
  datos: Extract<DatosPoblacionOrbital, { vista: "asat" }>;
  onSeleccionar: PropsVista<unknown>["onSeleccionar"];
}) {
  const { asat: ensayos, procedencia } = datos;

  const opcion = useMemo<EChartsOption>(() => {
    const orden = [...ensayos].reverse();
    const nombres = orden.map((e) => `${e.nombre} (${e.pais})`);
    return {
      grid: { left: 8, right: 24, top: 24, bottom: 8, containLabel: true },
      tooltip: { ...TEMA_TOOLTIP, trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { top: 0, textStyle: { color: TEMA.apagado, fontSize: 11 } },
      xAxis: { type: "value", name: "objetos", nameTextStyle: { color: TEMA.apagado }, ...TEMA_EJE },
      yAxis: { type: "category", data: nombres, ...TEMA_EJE, splitLine: { show: false } },
      series: [
        {
          name: "Catalogados",
          type: "bar" as const,
          barMaxWidth: 12,
          itemStyle: { color: colorCategoria(0) },
          data: orden.map((e) => e.catalogados),
        },
        {
          name: "En órbita hoy",
          type: "bar" as const,
          barMaxWidth: 12,
          itemStyle: { color: colorCategoria(3) },
          data: orden.map((e) => e.en_orbita),
        },
      ],
    };
  }, [ensayos]);

  if (ensayos.length === 0) {
    return (
      <Vacio
        titulo="Sin datos de población orbital"
        detalle="Se descargan con `python scripts/gcat_orbita.py`."
      />
    );
  }

  const orden = [...ensayos].reverse();
  const alClic = (clic: ClicGrafico) => {
    const ensayo = orden[clic.indiceDato];
    if (!ensayo) {
      return;
    }
    onSeleccionar({
      titulo: ensayo.nombre,
      detalle: `${formatearEntero(ensayo.catalogados)} desechos catalogados, ${formatearEntero(
        ensayo.en_orbita,
      )} en órbita hoy${ensayo.fecha_ensayo ? ` · ensayo ${ensayo.fecha_ensayo}` : ""}`,
      origen: "poblacion_orbital",
      refs: ensayo.refs,
    });
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto px-4 py-3">
      <Grafico
        opcion={opcion}
        altura={Math.max(240, ensayos.length * 30 + 60)}
        descripcion={`${formatearEntero(
          ensayos.length,
        )} ensayos antisatélite, catalogados frente a en órbita hoy. Encabeza ${
          ensayos[0]?.nombre ?? "—"
        } con ${formatearEntero(ensayos[0]?.catalogados ?? 0)} desechos catalogados.`}
        onClic={alClic}
      />
      <ul className="flex flex-col gap-1 text-xs text-apagado">
        {ensayos
          .filter((e) => e.refs.length === 0)
          .map((e) => (
            <li key={e.jcat}>{e.nombre}: sin fragmentos en el corpus.</li>
          ))}
      </ul>
      {procedencia ? (
        <p className="font-mono text-[11px] leading-relaxed text-apagado">
          {procedencia.fuente} · {procedencia.licencia} · actualizado {procedencia.actualizado}
        </p>
      ) : null}
    </div>
  );
}

function VistaColombia({
  datos,
}: {
  datos: Extract<DatosPoblacionOrbital, { vista: "colombia" }>;
}) {
  const { colombia: objetos, procedencia } = datos;

  if (objetos.length === 0) {
    return (
      <Vacio
        titulo="Sin datos de población orbital"
        detalle="Se descargan con `python scripts/gcat_orbita.py`."
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto px-4 py-3">
      <ol className="flex flex-col gap-2">
        {objetos.map((o: ObjetoColombiaOrbital) => (
          <li key={o.jcat} className="rounded-md border border-borde bg-panel px-3 py-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-texto">{o.nombre}</p>
              <span
                className="inline-flex items-center gap-1.5 rounded-md border border-borde px-1.5 py-0.5 text-xs text-apagado"
                title={o.estado}
              >
                <span
                  aria-hidden="true"
                  className={
                    o.estado === "En órbita"
                      ? "size-1.5 rounded-full bg-senal"
                      : "size-1.5 rounded-full bg-tenue"
                  }
                />
                {o.estado}
              </span>
            </div>
            <p className="font-mono text-xs text-apagado">
              Lanzamiento {o.lanzamiento} · COSPAR {o.cospar}
              {o.fin ? ` · reentrada ${o.fin}` : ""}
            </p>
          </li>
        ))}
      </ol>
      {procedencia ? (
        <p className="font-mono text-[11px] leading-relaxed text-apagado">
          {procedencia.fuente} · {procedencia.licencia} · actualizado {procedencia.actualizado}
        </p>
      ) : null}
    </div>
  );
}

function VistaInspectores({
  datos,
  onSeleccionar,
}: {
  datos: Extract<DatosPoblacionOrbital, { vista: "inspectores" }>;
  onSeleccionar: PropsVista<unknown>["onSeleccionar"];
}) {
  const { inspectores: satelites, procedencia } = datos;

  const paises = useMemo(() => [...new Set(satelites.map((s) => s.pais))], [satelites]);

  const opcion = useMemo<EChartsOption>(() => {
    const orden = [...satelites].reverse();
    const nombres = orden.map((s) => s.nombre);
    const hoy = diasDesde(new Date().toISOString());
    return {
      grid: { left: 8, right: 16, top: 8, bottom: 24, containLabel: true },
      tooltip: {
        ...TEMA_TOOLTIP,
        formatter: (params) => {
          const p = Array.isArray(params) ? params[1] : params;
          const s = orden[(p as { dataIndex?: number }).dataIndex ?? -1];
          if (!s) return "";
          return `<strong>${s.nombre}</strong><br/>${s.pais} · ${s.orbita}<br/>${s.lanzamiento} → ${
            s.fin ?? "hoy"
          } (${s.estado})`;
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        ...TEMA_EJE,
        axisLabel: { ...TEMA_EJE.axisLabel, formatter: (v: number) => anioDeDias(v) },
      },
      yAxis: { type: "category", data: nombres, ...TEMA_EJE, splitLine: { show: false } },
      series: [
        {
          name: "inicio",
          type: "bar" as const,
          stack: "gantt",
          silent: true,
          itemStyle: { color: "transparent" },
          data: orden.map((s) => diasDesde(s.lanzamiento)),
        },
        {
          name: "duración",
          type: "bar" as const,
          stack: "gantt",
          barMaxWidth: 16,
          itemStyle: {
            color: (p: { dataIndex: number }) =>
              colorCategoria(paises.indexOf(orden[p.dataIndex]?.pais ?? "")),
          },
          data: orden.map((s) => {
            const inicio = diasDesde(s.lanzamiento);
            const fin = s.fin ? diasDesde(s.fin) : hoy;
            return Math.max(1, fin - inicio);
          }),
        },
      ],
    };
  }, [satelites, paises]);

  if (satelites.length === 0) {
    return (
      <Vacio
        titulo="Sin datos de población orbital"
        detalle="Se descargan con `python scripts/gcat_orbita.py`."
      />
    );
  }

  const orden = [...satelites].reverse();
  const alClic = (clic: ClicGrafico) => {
    const s = orden[clic.indiceDato];
    if (!s) {
      return;
    }
    onSeleccionar({
      titulo: s.nombre,
      detalle: `${s.pais} · ${s.orbita} · ${s.lanzamiento} → ${s.fin ?? "hoy"} (${s.estado})`,
      origen: "poblacion_orbital",
      refs: s.refs,
    });
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto px-4 py-3">
      <Grafico
        opcion={opcion}
        altura={Math.max(200, satelites.length * 32 + 60)}
        descripcion={`Línea de tiempo de ${formatearEntero(
          satelites.length,
        )} satélites de inspección o proximidad, de su lanzamiento a su estado actual.`}
        onClic={alClic}
      />
      <ul className="flex flex-col gap-2">
        {satelites.map((s: SateliteInspector) => (
          <li key={s.jcat} className="text-xs text-apagado">
            <span className="font-medium text-texto">{s.nombre}</span>
            {s.hijos.length > 0
              ? ` · ${formatearEntero(s.hijos.length)} objeto${s.hijos.length === 1 ? "" : "s"} catalogado${
                  s.hijos.length === 1 ? "" : "s"
                } (${s.hijos.filter((h) => h.en_orbita).length} en órbita)`
              : null}
            {s.refs.length === 0 ? " · sin fragmentos en el corpus" : null}
            {" · "}
            <a
              href={s.referencia}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-borde underline-offset-2 hover:text-texto"
            >
              referencia
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs text-apagado">
        Lista curada por el equipo, con su referencia pública. Que un satélite esté en la lista no
        afirma una intención: resume lo que documentan las fuentes citadas.
      </p>
      {procedencia ? (
        <p className="font-mono text-[11px] leading-relaxed text-apagado">
          {procedencia.fuente} · {procedencia.licencia} · actualizado {procedencia.actualizado}
        </p>
      ) : null}
    </div>
  );
}

export function VistaPoblacionOrbital({
  datos,
  onSeleccionar,
}: PropsVista<DatosPoblacionOrbital>) {
  switch (datos.vista) {
    case "crecimiento":
      return <VistaCrecimiento datos={datos} />;
    case "asat":
      return <VistaAsat datos={datos} onSeleccionar={onSeleccionar} />;
    case "colombia":
      return <VistaColombia datos={datos} />;
    case "inspectores":
      return <VistaInspectores datos={datos} onSeleccionar={onSeleccionar} />;
  }
}
