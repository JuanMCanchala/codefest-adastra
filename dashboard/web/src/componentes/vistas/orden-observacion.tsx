import type { EChartsOption } from "echarts";
import {
  Check,
  ClipboardList,
  FileText,
  Map as MapaIcono,
  Moon,
  Pickaxe,
  Satellite,
  ShieldAlert,
  Siren,
  Sun,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { Conteo, DatosOrdenObservacion, Ref } from "@/api/tipos";
import { Grafico, TEMA_EJE, TEMA_TOOLTIP, type ClicGrafico } from "@/componentes/graficos/grafico";
import { Boton } from "@/componentes/ui/boton";
import { Vacio } from "@/componentes/ui/estados";
import { FENOMENOS, fenomenoPorId } from "@/lib/fenomenos";
import {
  type ClaveMision,
  ELEVACION_SOLAR_MINIMA,
  MISIONES,
  type Mision,
  type Pasada,
  diasDesde,
  epocaMasAntigua,
} from "@/lib/satelites";
import type { PropsVista } from "@/lib/seleccion";
import { TEMA } from "@/lib/tema";
import { type PasadasMision, usarPasadas } from "@/lib/usar-pasadas";
import { cn, formatearEntero } from "@/lib/utils";

/**
 * Orden de observación: de la mención al sobrevuelo.
 *
 * Tres columnas que son los tres fenómenos del corpus convertidos en las tres etapas de un
 * mismo trabajo. **Territorio (F3)**: qué dicen del municipio las alertas de la Defensoría y
 * la ficha de presencia armada. **Observación (F2)**: cuándo lo miró y cuándo lo volverá a
 * mirar cada satélite, propagado aquí mismo desde los TLE. **Lo que ya se midió (F1)**: las
 * hectáreas de minería que el modelo de Amazon Mining Watch detectó sobre Sentinel-2.
 *
 * Todo lo que es dato lleva su `doc_id`/`chunk_id`; lo que es predicción orbital se rotula
 * como tal y con la edad de sus elementos. Nada se recomienda que no salga de una fuente.
 */

const RELOJ = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const FECHA = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "long", year: "numeric" });

const HECTAREAS = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

/** «en 3 h 12 min» o «hace 2 d 5 h»: el orden de magnitud importa más que el minuto. */
function relativo(fecha: Date, ahora: Date): string {
  const ms = fecha.getTime() - ahora.getTime();
  const futuro = ms >= 0;
  const minutos = Math.round(Math.abs(ms) / 60_000);
  const dias = Math.floor(minutos / 1_440);
  const horas = Math.floor((minutos % 1_440) / 60);
  const resto = minutos % 60;
  const texto =
    dias > 0
      ? `${String(dias)} d ${String(horas)} h`
      : horas > 0
        ? `${String(horas)} h ${String(resto)} min`
        : `${String(resto)} min`;
  return futuro ? `en ${texto}` : `hace ${texto}`;
}

function fechaLegible(iso: string | null): string {
  if (!iso) return "sin fecha";
  const fecha = new Date(`${iso}T12:00:00`);
  return Number.isNaN(fecha.getTime()) ? iso : FECHA.format(fecha);
}

/** Todas las misiones del catálogo: la orden dice quién mira, no solo las que están encendidas. */
const CLAVES: readonly ClaveMision[] = MISIONES.map((m) => m.clave);

interface Candidata {
  mision: Mision;
  pasada: Pasada;
}

/** La pasada más cercana entre las que sirven: ópticas con luz, o radar a cualquier hora. */
function primeraUtil(
  porMision: ReadonlyMap<ClaveMision, PasadasMision>,
  filtro: (mision: Mision) => boolean,
): Candidata | null {
  let mejor: Candidata | null = null;
  for (const mision of MISIONES) {
    if (!filtro(mision)) continue;
    const proxima = porMision.get(mision.clave)?.proxima;
    if (proxima && (!mejor || proxima.cenit < mejor.pasada.cenit)) {
      mejor = { mision, pasada: proxima };
    }
  }
  return mejor;
}

function Encabezado({
  numero,
  titulo,
  fenomeno,
}: {
  numero: string;
  titulo: string;
  fenomeno: 1 | 2 | 3;
}) {
  const f = fenomenoPorId(fenomeno);
  return (
    <h3 className="flex items-center gap-2 border-b border-borde px-4 py-2 text-xs font-medium uppercase tracking-[0.06em] text-apagado">
      <span
        aria-hidden="true"
        className="inline-flex size-5 items-center justify-center rounded-full font-mono text-[11px] text-fondo"
        style={{ backgroundColor: f?.color ?? TEMA.senal }}
      >
        {numero}
      </span>
      {titulo}
      {f ? <span className="ml-auto font-mono text-tenue">{f.clave}</span> : null}
    </h3>
  );
}

function Cifra({ etiqueta, valor, ayuda }: { etiqueta: string; valor: string; ayuda?: string }) {
  return (
    <div className="bg-panel px-4 py-2.5">
      <dt className="text-xs uppercase tracking-[0.06em] text-tenue">{etiqueta}</dt>
      <dd className="font-mono text-lg leading-tight text-texto">{valor}</dd>
      {ayuda ? (
        <dd className="truncate text-xs text-apagado" title={ayuda}>
          {ayuda}
        </dd>
      ) : null}
    </div>
  );
}

function Fichas({
  titulo,
  conteos,
  onElegir,
}: {
  titulo: string;
  conteos: Conteo[];
  onElegir?: (c: Conteo) => void;
}) {
  if (conteos.length === 0) return null;
  return (
    <div className="px-4 py-2">
      <p className="text-xs uppercase tracking-[0.06em] text-tenue">{titulo}</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {conteos.map((c) => (
          <li key={c.valor}>
            {onElegir ? (
              <button
                type="button"
                onClick={() => onElegir(c)}
                title={`${c.valor}: ${formatearEntero(c.n)} alertas`}
                className="max-w-[18rem] truncate rounded border border-borde bg-elevado px-2 py-0.5 text-left text-xs text-texto hover:border-acento/70"
              >
                {c.valor} <span className="font-mono text-tenue">{c.n}</span>
              </button>
            ) : (
              <span
                title={c.valor}
                className="inline-block max-w-[18rem] truncate rounded border border-borde bg-elevado px-2 py-0.5 text-xs text-texto"
              >
                {c.valor} <span className="font-mono text-tenue">{c.n}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LineaPasada({
  titulo,
  pasada,
  ahora,
}: {
  titulo: string;
  pasada: Pasada | null | undefined;
  ahora: Date;
}) {
  if (pasada === undefined) {
    return (
      <span className="text-tenue">
        {titulo}: <span className="animate-pulse">calculando…</span>
      </span>
    );
  }
  if (pasada === null) {
    return <span className="text-tenue">{titulo}: fuera de la ventana</span>;
  }
  const dia = pasada.elevacionSolarGrados >= ELEVACION_SOLAR_MINIMA;
  const Icono = dia ? Sun : Moon;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-tenue">{titulo}:</span>
      <Icono aria-hidden="true" className={cn("size-3", dia ? "text-acento" : "text-control")} />
      <span
        className="font-mono text-texto"
        title={`${pasada.cenit.toISOString()} · nadir a ${String(Math.round(pasada.distanciaKm))} km · Sol a ${pasada.elevacionSolarGrados.toFixed(0)}°`}
      >
        {RELOJ.format(pasada.cenit)}
      </span>
      <span className="text-tenue">· {relativo(pasada.cenit, ahora)}</span>
    </span>
  );
}

export function VistaOrdenObservacion({
  datos,
  fenomeno,
  onSeleccionar,
  onAccion,
}: PropsVista<DatosOrdenObservacion | null>) {
  const ahora = useMemo(() => new Date(), []);
  const centro = datos?.territorio.centro ?? null;
  const pasadas = usarPasadas(centro, CLAVES, centro !== null);
  const [copiado, setCopiado] = useState(false);
  const colorF3 = fenomenoPorId(3)?.color ?? TEMA.senal;
  const colorF1 = fenomenoPorId(1)?.color ?? TEMA.senal;

  const opcionAlertas = useMemo<EChartsOption>(() => {
    const serie = datos?.alertas.por_anio ?? [];
    return {
      grid: { left: 8, right: 12, top: 12, bottom: 4, containLabel: true },
      tooltip: {
        ...TEMA_TOOLTIP,
        trigger: "item",
        formatter: (p) => {
          const punto = serie[(p as { dataIndex?: number }).dataIndex ?? -1];
          return punto
            ? `<strong>${String(punto.anio)}</strong><br/>${formatearEntero(punto.alertas)} alertas`
            : "";
        },
      },
      xAxis: {
        type: "category",
        data: serie.map((p) => String(p.anio)),
        ...TEMA_EJE,
        splitLine: { show: false },
      },
      yAxis: { type: "value", minInterval: 1, ...TEMA_EJE },
      series: [
        {
          type: "bar",
          barCategoryGap: "25%",
          itemStyle: { color: colorF3, borderColor: TEMA.fondo, borderWidth: 1 },
          data: serie.map((p) => p.alertas),
        },
      ],
    };
  }, [colorF3, datos]);

  const opcionMineria = useMemo<EChartsOption>(() => {
    const serie = datos?.mineria_detectada.departamental ?? [];
    return {
      grid: { left: 8, right: 12, top: 12, bottom: 4, containLabel: true },
      tooltip: {
        ...TEMA_TOOLTIP,
        trigger: "axis",
        formatter: (p) => {
          const lista = Array.isArray(p) ? p : [p];
          const punto = serie[(lista[0] as { dataIndex?: number } | undefined)?.dataIndex ?? -1];
          return punto
            ? `<strong>${punto.etiqueta}</strong><br/>acumulado ${HECTAREAS.format(punto.acumulado_ha)} ha<br/>nuevo ${HECTAREAS.format(punto.nuevo_ha)} ha`
            : "";
        },
      },
      xAxis: {
        type: "category",
        data: serie.map((p) => p.etiqueta),
        ...TEMA_EJE,
        splitLine: { show: false },
        axisLabel: { ...TEMA_EJE.axisLabel, interval: "auto" },
      },
      yAxis: { type: "value", name: "ha", nameTextStyle: { color: TEMA.apagado }, ...TEMA_EJE },
      series: [
        {
          type: "line",
          smooth: false,
          showSymbol: serie.length < 16,
          lineStyle: { color: colorF1, width: 2 },
          itemStyle: { color: colorF1 },
          areaStyle: { color: colorF1, opacity: 0.12 },
          data: serie.map((p) => p.acumulado_ha),
        },
      ],
    };
  }, [colorF1, datos]);

  if (!datos) {
    return (
      <Vacio
        titulo="Sin municipios con alertas para estos filtros"
        detalle="Amplíe el rango de años o quite el filtro de economía ilícita."
      />
    );
  }

  const {
    territorio,
    alertas,
    presencia_armada: presencia,
    mineria_detectada: mineria,
    menciones,
    candidatos,
  } = datos;
  const optica = primeraUtil(pasadas.porMision, (m) => m.requiereLuz);
  const radar = primeraUtil(
    pasadas.porMision,
    (m) => !m.requiereLuz && m.sensor.startsWith("Radar"),
  );
  const epoca = epocaMasAntigua();
  const edadTle = epoca ? diasDesde(epoca, ahora) : null;

  const seleccionar = (titulo: string, detalle: string, refs: Ref[]) =>
    onSeleccionar({ titulo, detalle, origen: "orden_observacion", refs });

  const alClicAnio = (clic: ClicGrafico) => {
    const punto = alertas.por_anio[clic.indiceDato];
    if (punto) {
      seleccionar(
        `${territorio.municipio} · ${String(punto.anio)}`,
        `${formatearEntero(punto.alertas)} alertas tempranas ese año`,
        punto.refs,
      );
    }
  };

  const copiarOrden = async () => {
    const lineas: string[] = [
      `ORDEN DE OBSERVACIÓN · ${territorio.municipio} (${territorio.departamento}) · DIVIPOLA ${territorio.divipola}`,
      `Generada ${ahora.toISOString()} desde el tablero AeroCode. Datos trazables al corpus; pasadas propagadas desde TLE.`,
      "",
      `1. TERRITORIO (F3): ${formatearEntero(alertas.total)} alertas tempranas de la Defensoría, última ${fechaLegible(alertas.ultima_fecha)}.`,
      ...(alertas.tipos.length
        ? [`   Tipos: ${alertas.tipos.map((c) => `${c.valor} (${String(c.n)})`).join(", ")}.`]
        : []),
      ...(alertas.economias.length
        ? [
            `   Economías ilícitas: ${alertas.economias.map((c) => `${c.valor} (${String(c.n)})`).join(", ")}.`,
          ]
        : []),
      ...(presencia
        ? [
            `   Presencia armada (Amazon Underworld): ${presencia.grupos.length ? presencia.grupos.join("; ") : "sin grupos registrados"}.`,
          ]
        : []),
      ...(alertas.codigos.length ? [`   Alertas: ${alertas.codigos.join(", ")}.`] : []),
      "",
      "2. OBSERVACIÓN (F2):",
      optica
        ? `   Próxima imagen óptica con luz: ${optica.mision.nombre} (${optica.mision.sensor}), ${RELOJ.format(optica.pasada.cenit)} (${relativo(optica.pasada.cenit, ahora)}).`
        : "   Próxima imagen óptica con luz: sin pasada en la ventana o aún calculando.",
      radar
        ? `   Próxima pasada radar: ${radar.mision.nombre} (${radar.mision.sensor}), ${RELOJ.format(radar.pasada.cenit)} (${relativo(radar.pasada.cenit, ahora)}).`
        : "   Próxima pasada radar: sin pasada en la ventana o aún calculando.",
      `   Punto de referencia: ${centro ? `${centro[1].toFixed(3)}, ${centro[0].toFixed(3)}` : "sin geometría"} (${territorio.fuente_geometria}).`,
      ...(edadTle !== null
        ? [
            `   Elementos orbitales de hace ${String(Math.round(edadTle))} ${Math.round(edadTle) === 1 ? "día" : "días"}.`,
          ]
        : []),
      "",
      "3. LO QUE YA SE MIDIÓ (F1):",
      mineria.municipal
        ? `   Minería detectada en el municipio: ${HECTAREAS.format(mineria.municipal.area_ha)} ha en ${String(mineria.municipal.poligonos)} polígonos (Amazon Mining Watch, Sentinel-2).`
        : mineria.departamental?.length
          ? `   Sin detección municipal; el departamento acumula ${HECTAREAS.format(mineria.departamental[mineria.departamental.length - 1]?.acumulado_ha ?? 0)} ha (Amazon Mining Watch).`
          : `   Fuera de la cobertura de Amazon Mining Watch (${mineria.cobertura ?? "cuenca amazónica"}).`,
      ...(menciones
        ? [
            "",
            `Fuentes: el municipio aparece en ${formatearEntero(menciones.documentos)} documentos y ${formatearEntero(menciones.fragmentos)} fragmentos del corpus.`,
          ]
        : []),
    ];
    try {
      await navigator.clipboard.writeText(lineas.join("\n"));
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1_800);
    } catch {
      window.prompt("Copie la orden:", lineas.join("\n"));
    }
  };

  return (
    <div className="flex flex-col">
      {/* Cabecera: el territorio, a dónde saltar y la orden en texto. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-borde px-4 py-2">
        <p className="text-sm text-texto">
          <span className="font-medium">{territorio.municipio}</span>
          <span className="text-apagado"> · {territorio.departamento} · DIVIPOLA </span>
          <span className="font-mono text-apagado">{territorio.divipola}</span>
          {territorio.area_km2 ? (
            <span className="text-apagado">
              {" "}
              · {formatearEntero(Math.round(territorio.area_km2))} km²
            </span>
          ) : null}
        </p>
        <div className="ml-auto flex items-center gap-1.5">
          {onAccion ? (
            <Boton
              tamano="sm"
              variante="fantasma"
              onClick={() =>
                onAccion({
                  etiqueta: "Ver en el mapa",
                  componente: "mapa_colombia",
                  filtros: { nivel: "municipio" },
                })
              }
              title="Abrir el mapa de Colombia a nivel municipal"
            >
              <MapaIcono aria-hidden="true" className="size-4" />
              Ver en el mapa
            </Boton>
          ) : null}
          <Boton
            tamano="sm"
            onClick={() => void copiarOrden()}
            title="Copiar la orden como texto, lista para un informe"
          >
            {copiado ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <ClipboardList aria-hidden="true" className="size-4" />
            )}
            {copiado ? "Orden copiada" : "Copiar la orden"}
          </Boton>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-borde lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {/* 1. Territorio */}
        <section aria-labelledby="orden-territorio" className="flex min-w-0 flex-col">
          <div id="orden-territorio">
            <Encabezado numero="1" titulo="Territorio" fenomeno={3} />
          </div>
          <dl className="grid grid-cols-3 gap-px border-b border-borde bg-borde">
            <Cifra
              etiqueta="Alertas"
              valor={formatearEntero(alertas.total)}
              ayuda="Defensoría del Pueblo"
            />
            <Cifra
              etiqueta="Última"
              valor={alertas.ultima_fecha ? alertas.ultima_fecha.slice(0, 7) : "—"}
              ayuda={fechaLegible(alertas.ultima_fecha)}
            />
            <Cifra
              etiqueta="En el corpus"
              valor={menciones ? formatearEntero(menciones.documentos) : "0"}
              ayuda={menciones ? "documentos que lo nombran" : "no aparece como entidad"}
            />
          </dl>
          {alertas.por_anio.length > 0 ? (
            <div className="px-2 pt-1">
              <Grafico
                opcion={opcionAlertas}
                altura={140}
                descripcion={`Alertas tempranas por año en ${territorio.municipio}: ${alertas.por_anio.map((p) => `${String(p.anio)} ${String(p.alertas)}`).join(", ")}.`}
                onClic={alClicAnio}
              />
            </div>
          ) : null}
          <Fichas
            titulo="Tipo de alerta"
            conteos={alertas.tipos}
            onElegir={(c) =>
              seleccionar(
                `${territorio.municipio} · ${c.valor}`,
                `${formatearEntero(c.n)} alertas de este tipo`,
                alertas.refs,
              )
            }
          />
          <Fichas
            titulo="Economías ilícitas"
            conteos={alertas.economias}
            onElegir={(c) =>
              seleccionar(
                `${territorio.municipio} · ${c.valor}`,
                `${formatearEntero(c.n)} alertas la mencionan`,
                alertas.refs,
              )
            }
          />
          <Fichas titulo="Grupos armados citados en las alertas" conteos={alertas.grupos_armados} />
          <div className="mx-4 my-2 rounded-md border border-borde bg-elevado/60 px-3 py-2 text-sm">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.06em] text-tenue">
              <ShieldAlert aria-hidden="true" className="size-3.5" />
              Presencia armada · Amazon Underworld
            </p>
            {presencia ? (
              <>
                <p className="mt-1 text-texto">
                  {presencia.total_grupos !== null && presencia.total_grupos > 0
                    ? `${formatearEntero(presencia.total_grupos)} ${presencia.total_grupos === 1 ? "grupo" : "grupos"} con presencia registrada`
                    : presencia.sin_informacion
                      ? "Sin información en la fuente"
                      : "Sin grupos registrados"}
                </p>
                {presencia.grupos.length > 0 ? (
                  <ul className="mt-1 list-inside list-disc text-xs text-apagado">
                    {presencia.grupos.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                ) : null}
                <button
                  type="button"
                  className="mt-1.5 text-xs text-senal underline decoration-dotted underline-offset-2 hover:text-texto"
                  onClick={() =>
                    seleccionar(
                      `${territorio.municipio} · presencia armada`,
                      "Fila de Amazon Underworld para este municipio",
                      presencia.refs,
                    )
                  }
                >
                  Ver la fuente
                </button>
              </>
            ) : (
              <p className="mt-1 text-apagado">
                Fuera de la cuenca amazónica que cubre Amazon Underworld: no hay ficha de presencia
                armada para este municipio.
              </p>
            )}
          </div>
          <div className="mt-auto flex items-center gap-2 border-t border-borde px-4 py-2">
            <Boton
              tamano="sm"
              onClick={() =>
                seleccionar(
                  `${territorio.municipio} · alertas tempranas`,
                  `${formatearEntero(alertas.total)} alertas entre las fechas filtradas`,
                  alertas.refs,
                )
              }
            >
              <Siren aria-hidden="true" className="size-4" />
              Ver las alertas
            </Boton>
            {menciones && onAccion ? (
              <Boton
                tamano="sm"
                variante="fantasma"
                onClick={() =>
                  onAccion({
                    etiqueta: "Fragmentos que lo nombran",
                    componente: "panel_evidencia",
                    filtros: { entidad: menciones.entidad },
                  })
                }
              >
                <FileText aria-hidden="true" className="size-4" />
                Fragmentos que lo nombran
              </Boton>
            ) : null}
          </div>
        </section>

        {/* 2. Observación */}
        <section aria-labelledby="orden-observacion" className="flex min-w-0 flex-col">
          <div id="orden-observacion">
            <Encabezado numero="2" titulo="Observación" fenomeno={2} />
          </div>
          {centro ? (
            <>
              <dl className="grid grid-cols-2 gap-px border-b border-borde bg-borde">
                <div className="bg-panel px-4 py-2.5">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-[0.06em] text-tenue">
                    <Sun aria-hidden="true" className="size-3" />
                    Próxima imagen óptica con luz
                  </dt>
                  <dd className="mt-0.5 text-sm text-texto">
                    {optica ? (
                      <>
                        <span className="font-medium">{optica.mision.nombre}</span>
                        <span className="block font-mono text-xs text-apagado">
                          {RELOJ.format(optica.pasada.cenit)} ·{" "}
                          {relativo(optica.pasada.cenit, ahora)}
                        </span>
                      </>
                    ) : pasadas.calculando ? (
                      <span className="animate-pulse text-apagado">calculando…</span>
                    ) : (
                      <span className="text-apagado">sin pasada en la ventana</span>
                    )}
                  </dd>
                </div>
                <div className="bg-panel px-4 py-2.5">
                  <dt className="flex items-center gap-1.5 text-xs uppercase tracking-[0.06em] text-tenue">
                    <Satellite aria-hidden="true" className="size-3" />
                    Próxima pasada radar
                  </dt>
                  <dd className="mt-0.5 text-sm text-texto">
                    {radar ? (
                      <>
                        <span className="font-medium">{radar.mision.nombre}</span>
                        <span className="block font-mono text-xs text-apagado">
                          {RELOJ.format(radar.pasada.cenit)} · {relativo(radar.pasada.cenit, ahora)}
                        </span>
                      </>
                    ) : pasadas.calculando ? (
                      <span className="animate-pulse text-apagado">calculando…</span>
                    ) : (
                      <span className="text-apagado">sin pasada en la ventana</span>
                    )}
                  </dd>
                </div>
              </dl>
              <ul className="divide-y divide-borde text-xs" aria-label="Pasadas por misión">
                {MISIONES.map((mision) => {
                  const p = pasadas.porMision.get(mision.clave);
                  return (
                    <li key={mision.clave} className="px-4 py-2">
                      <p className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="size-2 rounded-full"
                          style={{ backgroundColor: mision.color }}
                        />
                        <span className="font-medium text-texto">{mision.nombre}</span>
                        <span className="truncate text-tenue" title={mision.aporte}>
                          {mision.sensor}
                        </span>
                      </p>
                      <p className="mt-0.5 flex flex-wrap gap-x-3 pl-4">
                        <LineaPasada
                          titulo="Anterior"
                          pasada={p ? p.anterior : undefined}
                          ahora={ahora}
                        />
                        <LineaPasada
                          titulo="Próxima"
                          pasada={p ? p.proxima : undefined}
                          ahora={ahora}
                        />
                      </p>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-auto border-t border-borde px-4 py-2 text-xs text-apagado">
                Punto de referencia{" "}
                <span className="font-mono text-texto">
                  {centro[1].toFixed(3)}, {centro[0].toFixed(3)}
                </span>{" "}
                ({territorio.fuente_geometria}). No es una coordenada medida: la franja del sensor
                más estrecho (185 km) cubre el municipio entero.
                {edadTle !== null ? (
                  <>
                    {" "}
                    Elementos orbitales de hace{" "}
                    <span className={cn("font-mono", edadTle > 14 ? "text-alerta" : "text-texto")}>
                      {String(Math.round(edadTle))} {Math.round(edadTle) === 1 ? "día" : "días"}
                    </span>
                    : una predicción, no una medición.
                  </>
                ) : null}
              </p>
            </>
          ) : (
            <p className="px-4 py-3 text-sm text-apagado">
              El Marco Geoestadístico no trae el polígono de este municipio: sin punto de referencia
              no se calculan pasadas.
            </p>
          )}
        </section>

        {/* 3. Lo que ya se midió */}
        <section aria-labelledby="orden-medido" className="flex min-w-0 flex-col">
          <div id="orden-medido">
            <Encabezado numero="3" titulo="Lo que ya se midió" fenomeno={1} />
          </div>
          {mineria.en_cobertura ? (
            <>
              <dl className="grid grid-cols-2 gap-px border-b border-borde bg-borde">
                <Cifra
                  etiqueta="Minería en el municipio"
                  valor={
                    mineria.municipal ? `${HECTAREAS.format(mineria.municipal.area_ha)} ha` : "0 ha"
                  }
                  ayuda={
                    mineria.municipal
                      ? `${String(mineria.municipal.poligonos)} polígonos detectados`
                      : "sin polígonos detectados en 2023"
                  }
                />
                <Cifra
                  etiqueta={`Acumulado · ${territorio.departamento}`}
                  valor={
                    mineria.departamental?.length
                      ? `${HECTAREAS.format(mineria.departamental[mineria.departamental.length - 1]?.acumulado_ha ?? 0)} ha`
                      : "—"
                  }
                  ayuda={
                    mineria.departamental?.length
                      ? `hasta ${mineria.departamental[mineria.departamental.length - 1]?.etiqueta ?? ""}`
                      : "sin serie departamental"
                  }
                />
              </dl>
              {mineria.departamental?.length ? (
                <div className="px-2 pt-1">
                  <Grafico
                    opcion={opcionMineria}
                    altura={160}
                    descripcion={`Hectáreas acumuladas de minería detectada en ${territorio.departamento}, de ${mineria.departamental[0]?.etiqueta ?? ""} a ${mineria.departamental[mineria.departamental.length - 1]?.etiqueta ?? ""}.`}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="mx-4 my-3 rounded-md border border-borde bg-elevado/60 px-3 py-2 text-sm text-apagado">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.06em] text-tenue">
                <Pickaxe aria-hidden="true" className="size-3.5" />
                Sin medición satelital
              </p>
              <p className="mt-1">
                Fuera de la cobertura de Amazon Mining Watch (
                {mineria.cobertura ?? "cuenca amazónica"}). No hay hectáreas que citar: el modelo no
                ha mirado aquí.
              </p>
              {mineria.nacional_acumulado_ha !== null ? (
                <p className="mt-1 text-xs">
                  Referencia nacional: {HECTAREAS.format(mineria.nacional_acumulado_ha)} ha
                  acumuladas en la cuenca amazónica colombiana.
                </p>
              ) : null}
            </div>
          )}
          {mineria.procedencia ? (
            <p className="mt-auto border-t border-borde px-4 py-2 text-xs text-apagado">
              {mineria.procedencia["fuente"] ?? "Amazon Mining Watch"} ·{" "}
              {mineria.procedencia["sensor"] ?? "Sentinel-2"} · modelo{" "}
              <span className="font-mono">{mineria.procedencia["modelo"] ?? "?"}</span> · commit{" "}
              <span className="font-mono">
                {(mineria.procedencia["commit"] ?? "?").slice(0, 12)}
              </span>{" "}
              · publicado {mineria.procedencia["fecha_publicacion"] ?? "?"} · licencia{" "}
              {mineria.procedencia["licencia"] ?? "?"}
            </p>
          ) : null}
        </section>
      </div>

      {/* A dónde saltar: los municipios con más alertas con los mismos filtros. */}
      {candidatos.length > 1 && onAccion ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-borde px-4 py-2 text-xs">
          <span className="text-tenue">Otros municipios con alertas:</span>
          {candidatos
            .filter((c) => c.divipola !== territorio.divipola)
            .map((c) => (
              <button
                key={c.divipola}
                type="button"
                onClick={() =>
                  onAccion({
                    etiqueta: `Orden de observación de ${c.municipio}`,
                    componente: "orden_observacion",
                    filtros: { municipio: c.municipio },
                  })
                }
                title={`${c.municipio} (${c.departamento}): ${formatearEntero(c.alertas)} alertas`}
                className="rounded border border-borde bg-elevado px-2 py-0.5 text-texto hover:border-acento/70"
              >
                {c.municipio} <span className="font-mono text-tenue">{c.alertas}</span>
              </button>
            ))}
        </div>
      ) : null}
      {fenomeno !== null && fenomeno !== undefined ? (
        <p className="sr-only">
          Ficha construida con los tres fenómenos del corpus:{" "}
          {FENOMENOS.map((f) => f.nombre).join(", ")}.
        </p>
      ) : null}
    </div>
  );
}
