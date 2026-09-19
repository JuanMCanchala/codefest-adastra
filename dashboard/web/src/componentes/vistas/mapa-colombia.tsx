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
  /** Con la reproducción en marcha la escala de color se congela (ver `maximoEscala`). */
  reproduciendo: boolean;
}

/** Coropleta de Colombia: departamentos y, al acercar el zoom, municipios. */
export function VistaMapaColombia({
  datos,
  nivel,
  seleccion,
  onSeleccionar,
  onCambiarNivel,
  enfoque,
  reproduciendo,
}: Props) {
  const geo = useRecurso(`geo-${nivel}`, (senal) =>
    nivel === "municipio" ? obtenerGeoMunicipios(senal) : obtenerGeoDepartamentos(senal),
  );

  const claveGeo = nivel === "municipio" ? "divipola_mpio" : "divipola_dpto";
  const claveNombre = nivel === "municipio" ? "municipio" : "departamento";

  const valores = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const fila of datos) {
      mapa.set(fila.divipola, (mapa.get(fila.divipola) ?? 0) + fila.alertas);
    }
    return mapa;
  }, [datos]);

  const maximo = useMemo(() => maximoDe([...valores.values()]), [valores]);

  /**
   * Escala de color de la reproducción. Si cada año se pintara con su propio máximo, un año
   * de cinco alertas se vería tan intenso como uno de doscientas: la animación mentiría. Se
   * congela el máximo del rango completo, que es el que había justo antes de arrancar.
   */
  const maximoCongelado = useRef(maximo);
  if (!reproduciendo) {
    maximoCongelado.current = maximo;
  }
  const maximoEscala = reproduciendo ? Math.max(maximoCongelado.current, maximo) : maximo;

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

  if (geo.fase === "cargando") {
    return <Cargando mensaje="Descargando geometrías del Marco Geoestadístico Nacional…" />;
  }
  if (geo.fase === "error") {
    return <AvisoError mensaje={geo.mensaje} onReintentar={geo.recargar} />;
  }
  // Durante la reproducción un año sin alertas no cambia la vista por el vacío: eso
  // desmontaría el mapa y el siguiente año volvería a montarlo, reencuadrando la cámara.
  // El año en blanco se pinta como lo que es, un mapa sin registro.
  if (datos.length === 0 && !reproduciendo) {
    return (
      <Vacio
        titulo="Sin alertas para estos filtros"
        detalle="Amplíe el rango de años o quite el filtro de economía ilícita o de tipo de alerta."
      />
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative h-[520px] border-b border-borde lg:border-b-0 lg:border-r">
        <MapaCoropleta
          geojson={geo.dato}
          claveGeo={claveGeo}
          claveNombre={claveNombre}
          valores={valores}
          maximo={maximoEscala}
          unidad="alertas"
          centro={CENTRO}
          zoom={4.6}
          zoomMinimo={4}
          zoomMaximo={9.5}
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
        />
        <div className="pointer-events-none absolute bottom-12 left-3">
          <LeyendaEscala maximo={maximoEscala} unidad="alertas tempranas" />
        </div>
        <p className="pointer-events-none absolute left-3 top-3 inline-flex max-w-[calc(100%-4.5rem)] items-center gap-1.5 rounded border border-borde bg-panel px-2 py-1 text-xs text-apagado">
          <Info aria-hidden="true" className="size-3" />
          {nivel === "municipio"
            ? "Detalle municipal · aleje el zoom para volver a departamentos"
            : "Departamentos · acerque el zoom para ver municipios"}
        </p>
      </div>
      <div className="barra-fina max-h-[520px] overflow-y-auto">
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
