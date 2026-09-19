import { useMemo } from "react";

import { obtenerGeoPaises } from "@/api/cliente";
import type { FilaMapaMundo } from "@/api/tipos";
import { LeyendaEscala } from "@/componentes/mapas/leyenda-escala";
import { MapaCoropleta } from "@/componentes/mapas/mapa-coropleta";
import { AvisoError, Cargando, Vacio } from "@/componentes/ui/estados";
import { TablaRanking, type FilaRanking } from "@/componentes/ui/tabla-ranking";
import type { PropsVista } from "@/lib/seleccion";
import { useRecurso } from "@/lib/usar-recurso";
import { formatearEntero, maximoDe } from "@/lib/utils";

/**
 * El globo arranca mirando a América: es un corpus sobre América Latina, y con el centro
 * en el meridiano de Greenwich Colombia quedaba en el borde, deformada.
 */
const CENTRO: [number, number] = [-55, 10];

/** Coropleta mundial de menciones de países en el corpus. */
export function VistaMapaMundo({ datos, seleccion, onSeleccionar }: PropsVista<FilaMapaMundo[]>) {
  const geo = useRecurso("geo-paises", (senal) => obtenerGeoPaises(senal));

  const valores = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const fila of datos) {
      mapa.set(fila.iso3, (mapa.get(fila.iso3) ?? 0) + fila.menciones);
    }
    return mapa;
  }, [datos]);

  const maximo = useMemo(() => maximoDe([...valores.values()]), [valores]);

  const filasTabla = useMemo<FilaRanking[]>(
    () =>
      datos.map((fila) => ({
        clave: fila.iso3,
        nombre: fila.nombre,
        detalle: `${formatearEntero(fila.documentos)} doc.`,
        valor: fila.menciones,
      })),
    [datos],
  );

  const seleccionarPais = (iso3: string) => {
    const fila = datos.find((f) => f.iso3 === iso3);
    if (!fila) {
      onSeleccionar({
        titulo: iso3,
        detalle: "Sin menciones registradas para los filtros actuales",
        origen: "mapa_mundo",
        refs: [],
      });
      return;
    }
    onSeleccionar({
      titulo: fila.nombre,
      detalle: `${formatearEntero(fila.menciones)} menciones en ${formatearEntero(
        fila.documentos,
      )} documentos`,
      origen: "mapa_mundo",
      refs: fila.refs ?? [],
    });
  };

  const seleccionada =
    seleccion?.origen === "mapa_mundo"
      ? (datos.find((f) => f.nombre === seleccion.titulo)?.iso3 ?? null)
      : null;

  if (geo.fase === "cargando") {
    return <Cargando mensaje="Descargando geometrías de países…" />;
  }
  if (geo.fase === "error") {
    return <AvisoError mensaje={geo.mensaje} onReintentar={geo.recargar} />;
  }
  if (datos.length === 0) {
    return (
      <Vacio
        titulo="Sin menciones de países"
        detalle="Seleccione otro fenómeno o aumente el número máximo de países."
      />
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative h-[var(--alto-vista,520px)] border-b border-borde lg:border-b-0 lg:border-r">
        <MapaCoropleta
          geojson={geo.dato}
          claveGeo="iso3"
          claveNombre="nombre_es"
          valores={valores}
          maximo={maximo}
          unidad="menciones"
          centro={CENTRO}
          esferico
          zoom={1.6}
          zoomMinimo={0.8}
          zoomMaximo={6}
          seleccionada={seleccionada}
          onClicRegion={seleccionarPais}
        />
        <div className="pointer-events-none absolute bottom-9 left-3">
          <LeyendaEscala maximo={maximo} unidad="menciones en el corpus" />
        </div>
      </div>
      <div className="barra-fina max-h-[var(--alto-vista,520px)] overflow-y-auto">
        <TablaRanking
          filas={filasTabla}
          unidad="menciones"
          seleccionada={seleccionada}
          onSeleccionar={seleccionarPais}
        />
      </div>
    </div>
  );
}
