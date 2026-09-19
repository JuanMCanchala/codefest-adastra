import type { FeatureCollection } from "geojson";
import { Info } from "lucide-react";
import { useMemo, useRef } from "react";

import { obtenerGeoDepartamentos, obtenerGeoMunicipios } from "@/api/cliente";
import type { FilaMapaColombia } from "@/api/tipos";
import { LeyendaEscala } from "@/componentes/mapas/leyenda-escala";
import { MapaCoropleta } from "@/componentes/mapas/mapa-coropleta";
import { AvisoError, Cargando, Vacio } from "@/componentes/ui/estados";
import { TablaRanking, type FilaRanking } from "@/componentes/ui/tabla-ranking";
import type { PropsVista } from "@/lib/seleccion";
import { useRecurso } from "@/lib/usar-recurso";
import { formatearEntero, maximoDe } from "@/lib/utils";

/** A partir de este zoom el mapa pide el detalle municipal. */
const ZOOM_MUNICIPIO = 6.4;

const CENTRO: [number, number] = [-73.5, 4.2];

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
  if (geo.fase === "listo") {
    dibujada.current = {
      geojson: geo.dato,
      claveGeo: nivel === "municipio" ? "divipola_mpio" : "divipola_dpto",
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
          // El reencuadre no cruza solo el umbral municipal: ese salto lo decide el usuario.
          zoomMaximoEnfoque={ZOOM_MUNICIPIO - 0.2}
          onZoom={(zoom) => {
            const deseado: NivelMapa = zoom >= ZOOM_MUNICIPIO ? "municipio" : "departamento";
            if (deseado !== nivel) {
              onCambiarNivel(deseado);
            }
          }}
          superposicion={
            <>
              <div className="pointer-events-none absolute bottom-12 left-3">
                <LeyendaEscala maximo={maximo} unidad="alertas tempranas" />
              </div>
              <p className="pointer-events-none absolute left-3 top-3 inline-flex max-w-[calc(100%-4.5rem)] items-center gap-1.5 rounded border border-borde bg-panel px-2 py-1 text-xs text-apagado">
                <Info aria-hidden="true" className="size-3" />
                {nivel === "municipio"
                  ? "Detalle municipal · aleje el zoom para volver a departamentos"
                  : "Departamentos · acerque el zoom para ver municipios"}
              </p>
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
