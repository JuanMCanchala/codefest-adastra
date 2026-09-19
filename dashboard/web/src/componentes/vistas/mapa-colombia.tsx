import type { FeatureCollection } from "geojson";
import { useMemo, useRef, useState } from "react";

import { obtenerGeoDepartamentos, obtenerGeoMunicipios } from "@/api/cliente";
import type { FilaMapaColombia } from "@/api/tipos";
import { LeyendaEscala } from "@/componentes/mapas/leyenda-escala";
import { MapaCoropleta } from "@/componentes/mapas/mapa-coropleta";
import { AvisoError, Cargando, Vacio } from "@/componentes/ui/estados";
import { TablaRanking, type FilaRanking } from "@/componentes/ui/tabla-ranking";
import type { PropsVista } from "@/lib/seleccion";
import { useRecurso } from "@/lib/usar-recurso";
import { cn, formatearEntero, maximoDe } from "@/lib/utils";

/** A partir de este zoom el mapa pide el detalle municipal. */
const ZOOM_MUNICIPIO = 6.4;

const CENTRO: [number, number] = [-73.5, 4.2];
/** Zoom inicial y al que vuelve el botón «Departamentos». */
const ZOOM_DEPARTAMENTO = 4.6;
/** Al pulsar «Municipios» la cámara pasa el umbral con margen, para no quedarse en el borde. */
const ZOOM_BOTON_MUNICIPIO = ZOOM_MUNICIPIO + 0.3;

const NIVELES: readonly { valor: NivelMapa; etiqueta: string; zoom: number }[] = [
  { valor: "departamento", etiqueta: "Departamentos", zoom: ZOOM_DEPARTAMENTO },
  { valor: "municipio", etiqueta: "Municipios", zoom: ZOOM_BOTON_MUNICIPIO },
];

export type NivelMapa = "departamento" | "municipio";

interface Props extends PropsVista<FilaMapaColombia[]> {
  nivel: NivelMapa;
  onCambiarNivel: (nivel: NivelMapa) => void;
  /** Identidad de la consulta: al cambiar, la cámara reencuadra sobre los datos. */
  enfoque: string;
}

/** Coropleta de Colombia: departamentos y, al acercar el zoom, municipios. */
export function VistaMapaColombia({
  datos,
  nivel,
  seleccion,
  onSeleccionar,
  onCambiarNivel,
  enfoque,
}: Props) {
  const geo = useRecurso(`geo-${nivel}`, (senal) =>
    nivel === "municipio" ? obtenerGeoMunicipios(senal) : obtenerGeoDepartamentos(senal),
  );
  // Los departamentos siempre a mano: en el nivel municipal se dibujan como fronteras
  // encima (Anexo B.4.2), y ya están descargados de la vista anterior.
  const departamentos = useRecurso("geo-departamento", (senal) => obtenerGeoDepartamentos(senal));

  /**
   * El nivel se puede pedir con un botón, no solo con la rueda (Anexo B.4.2). Botón y zoom
   * son la misma verdad: al pulsar, el nivel cambia ya y la cámara va al zoom que le
   * corresponde, para que el estado del control y el del mapa no se contradigan.
   */
  const [ordenZoom, setOrdenZoom] = useState<{ zoom: number; marca: number } | null>(null);
  /**
   * Mientras la cámara obedece al botón, la rueda no manda. MapLibre corta un `easeTo` en
   * curso si algo más toca la cámara y dispara `zoomend` a medio camino: sin esta ventana,
   * ese `zoomend` intermedio devolvía el nivel anterior un instante y pedía los datos dos
   * veces. Pasado el plazo, el zoom vuelve a decidir, como siempre.
   */
  const ordenVigente = useRef<{ nivel: NivelMapa; hasta: number } | null>(null);
  const pedirNivel = (deseado: NivelMapa) => {
    const destino = NIVELES.find((n) => n.valor === deseado);
    if (!destino) {
      return;
    }
    ordenVigente.current = { nivel: deseado, hasta: Date.now() + 1_500 };
    if (deseado !== nivel) {
      onCambiarNivel(deseado);
    }
    setOrdenZoom((previa) => ({ zoom: destino.zoom, marca: (previa?.marca ?? 0) + 1 }));
  };

  /**
   * Geometría dibujada. Al cruzar el umbral municipal hay que bajar el otro GeoJSON, y si
   * mientras tanto la vista cambiara al estado de carga, el mapa se desmontaría y volvería
   * al encuadre inicial: acercarse sería imposible. Se sigue dibujando la capa anterior
   * -con las claves que le corresponden- hasta que la nueva está lista.
   */
  const dibujada = useRef<{
    geojson: FeatureCollection;
    claveGeo: string;
    claveNombre: string;
  } | null>(null);
  const claveGeo = nivel === "municipio" ? "divipola_mpio" : "divipola_dpto";
  // En el primer render tras cambiar de nivel el recurso aún trae la geometría anterior
  // (el hook la reemplaza en un efecto), así que solo se adopta si es la del nivel pedido:
  // pintar la malla municipal con claves departamentales dibuja un mapa que miente.
  const geoDelNivel =
    geo.fase === "listo" &&
    (geo.dato.features[0]?.properties as Record<string, unknown> | undefined)?.[claveGeo] !==
      undefined;
  if (geo.fase === "listo" && geoDelNivel) {
    dibujada.current = {
      geojson: geo.dato,
      claveGeo,
      claveNombre: nivel === "municipio" ? "municipio" : "departamento",
    };
  }
  const capa = dibujada.current;

  const valores = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const fila of datos) {
      mapa.set(fila.divipola, (mapa.get(fila.divipola) ?? 0) + fila.alertas);
    }
    return mapa;
  }, [datos]);

  const maximo = useMemo(() => maximoDe([...valores.values()]), [valores]);

  const filasTabla = useMemo<FilaRanking[]>(
    () =>
      datos.map((fila) => ({
        clave: fila.divipola,
        nombre: fila.nombre,
        ...(nivel === "municipio" ? { detalle: fila.departamento } : {}),
        valor: fila.alertas,
      })),
    [datos, nivel],
  );

  const seleccionarDivipola = (divipola: string) => {
    const fila = datos.find((f) => f.divipola === divipola);
    if (!fila) {
      onSeleccionar({
        titulo: `Territorio ${divipola}`,
        detalle: "Sin alertas registradas para los filtros actuales",
        origen: "mapa_colombia",
        refs: [],
      });
      return;
    }
    onSeleccionar({
      titulo: fila.nombre,
      detalle: `${formatearEntero(fila.alertas)} alertas${
        nivel === "municipio" ? ` · ${fila.departamento}` : ""
      }`,
      origen: "mapa_colombia",
      refs: fila.refs ?? [],
    });
  };

  const seleccionada =
    seleccion?.origen === "mapa_colombia"
      ? (datos.find((f) => f.nombre === seleccion.titulo)?.divipola ?? null)
      : null;

  if (geo.fase === "error" && !capa) {
    return <AvisoError mensaje={geo.mensaje} onReintentar={geo.recargar} />;
  }
  if (!capa) {
    return <Cargando mensaje="Descargando geometrías del Marco Geoestadístico Nacional…" />;
  }
  if (datos.length === 0) {
    return (
      <Vacio
        titulo="Sin alertas para estos filtros"
        detalle="Amplíe el rango de años o quite el filtro de economía ilícita o de tipo de alerta."
      />
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative h-[var(--alto-vista,520px)] border-b border-borde lg:border-b-0 lg:border-r">
        <MapaCoropleta
          geojson={capa.geojson}
          claveGeo={capa.claveGeo}
          claveNombre={capa.claveNombre}
          valores={valores}
          maximo={maximo}
          unidad="alertas"
          centro={CENTRO}
          zoom={4.6}
          zoomMinimo={3}
          // Hasta donde llega la imagen: Esri sirve World Imagery hasta el nivel 19, que en
          // Colombia son unos 30 cm por píxel. Pasado ese nivel solo habría teselas ampliadas
          // —o el aviso de «sin cobertura» del propio Esri—, así que no se ofrece.
          zoomMaximo={19}
          seleccionada={seleccionada}
          onClicRegion={seleccionarDivipola}
          enfoque={enfoque}
          contorno={
            nivel === "municipio" && departamentos.fase === "listo" ? departamentos.dato : null
          }
          // El reencuadre no cruza solo el umbral municipal: ese salto lo decide el usuario.
          zoomMaximoEnfoque={ZOOM_MUNICIPIO - 0.2}
          ordenZoom={ordenZoom}
          onZoom={(zoom) => {
            const deseado: NivelMapa = zoom >= ZOOM_MUNICIPIO ? "municipio" : "departamento";
            const orden = ordenVigente.current;
            if (orden && Date.now() < orden.hasta && deseado !== orden.nivel) {
              return;
            }
            ordenVigente.current = null;
            if (deseado !== nivel) {
              onCambiarNivel(deseado);
            }
          }}
          superposicion={
            <>
              <div className="pointer-events-none absolute bottom-12 left-3">
                <LeyendaEscala maximo={maximo} unidad="alertas tempranas" />
              </div>
              {/* Conmutador del nivel: un control, no una instrucción. La rueda sigue
                  funcionando y el botón la refleja, porque ambos leen `nivel`. */}
              <div
                role="group"
                aria-label="Nivel del mapa"
                className="absolute left-3 top-3 inline-flex overflow-hidden rounded border border-borde bg-panel text-xs shadow-sm"
              >
                {NIVELES.map((opcion) => {
                  const activo = opcion.valor === nivel;
                  return (
                    <button
                      key={opcion.valor}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => pedirNivel(opcion.valor)}
                      title={
                        opcion.valor === "municipio"
                          ? "Ver el detalle por municipio (también acercando el zoom)"
                          : "Volver a la vista por departamentos"
                      }
                      className={cn(
                        "px-2.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-senal",
                        activo
                          ? "bg-senal/20 text-texto"
                          : "text-apagado hover:bg-elevado hover:text-texto",
                      )}
                    >
                      {opcion.etiqueta}
                    </button>
                  );
                })}
              </div>
            </>
          }
        />
      </div>
      <div className="barra-fina max-h-[var(--alto-vista,520px)] overflow-y-auto">
        <TablaRanking
          filas={filasTabla}
          unidad="alertas"
          seleccionada={seleccionada}
          onSeleccionar={seleccionarDivipola}
        />
      </div>
    </div>
  );
}
