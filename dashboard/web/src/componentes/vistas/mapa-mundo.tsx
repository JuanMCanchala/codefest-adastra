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

const CENTRO: [number, number] = [0, 15];

/** Tope del reencuadre: con pocos países el globo no debe caer sobre una ciudad. */
const ZOOM_MAXIMO_ENFOQUE = 3.4;

interface Props extends PropsVista<FilaMapaMundo[]> {
  /** Identidad de la consulta: al cambiar, la cámara reencuadra sobre los datos. */
  enfoque: string;
}

/** Coropleta mundial de menciones de países en el corpus. */
export function VistaMapaMundo({ datos, seleccion, onSeleccionar, enfoque }: Props) {
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
      <div className="relative h-[520px] border-b border-borde lg:border-b-0 lg:border-r">
        <MapaCoropleta
          geojson={geo.dato}
          claveGeo="iso3"
          claveNombre="nombre_es"
          valores={valores}
          maximo={maximo}
          unidad="menciones"
          centro={CENTRO}
          zoom={1.2}
          zoomMinimo={0.8}
          zoomMaximo={6}
          seleccionada={seleccionada}
          onClicRegion={seleccionarPais}
          enfoque={enfoque}
          zoomMaximoEnfoque={ZOOM_MAXIMO_ENFOQUE}
          escalaAltura={800_000}
          globo
        />
        <div className="pointer-events-none absolute bottom-9 left-3">
          <LeyendaEscala maximo={maximo} unidad="menciones en el corpus" />
        </div>
      </div>
      <div className="barra-fina max-h-[520px] overflow-y-auto">
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
