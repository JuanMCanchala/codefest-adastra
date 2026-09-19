import type { ResultadoComponente } from "@/api/tipos";
import { VistaComposicionCorpus } from "@/componentes/vistas/composicion-corpus";
import { VistaCuadrantePriorizacion } from "@/componentes/vistas/cuadrante-priorizacion";
import { VistaDistribucion } from "@/componentes/vistas/distribucion";
import { VistaLineaTiempo } from "@/componentes/vistas/linea-tiempo";
import { VistaMapaColombia, type NivelMapa } from "@/componentes/vistas/mapa-colombia";
import { VistaMapaMundo } from "@/componentes/vistas/mapa-mundo";
import { VistaMatrizCalor } from "@/componentes/vistas/matriz-calor";
import { VistaOrdenObservacion } from "@/componentes/vistas/orden-observacion";
import { VistaPanelEvidencia } from "@/componentes/vistas/panel-evidencia";
import { VistaRedEntidades } from "@/componentes/vistas/red-entidades";
import type { Accion, Seleccion } from "@/lib/seleccion";

interface Props {
  resultado: ResultadoComponente;
  seleccion: Seleccion | null;
  onSeleccionar: (seleccion: Seleccion) => void;
  onAccion?: ((accion: Accion) => void) | undefined;
  nivelColombia: NivelMapa;
  onCambiarNivelColombia: (nivel: NivelMapa) => void;
}

/**
 * El gráfico en sí, sin cabecera ni marco.
 *
 * Vive aparte del lienzo porque lo dibujan dos sitios: el tablero de fondo y el agente
 * cuando se amplía, que enseña el dato dentro de la propia conversación.
 */
export function CuerpoComponente({
  resultado,
  seleccion,
  onSeleccionar,
  onAccion,
  nivelColombia,
  onCambiarNivelColombia,
}: Props) {
  /*
   * Identidad de la consulta para la cámara de los mapas: al cambiar, el mapa reencuadra
   * sobre las regiones con dato. Se deriva del propio resultado —qué se pidió y qué filtros
   * se aplicaron—, así que otra instrucción del agente mueve la cámara y un simple cambio
   * de nivel del mapa, que no toca ninguno de los dos, la deja quieta.
   */
  const enfoque = JSON.stringify([
    resultado.componente,
    resultado.fenomeno,
    resultado.filtros_aplicados ?? null,
  ]);

  const comunes = {
    titulo: resultado.titulo,
    fenomeno: resultado.fenomeno,
    seleccion,
    onSeleccionar,
    onAccion,
  };

  switch (resultado.componente) {
    case "mapa_colombia":
      return (
        <VistaMapaColombia
          {...comunes}
          datos={resultado.datos}
          nivel={nivelColombia}
          onCambiarNivel={onCambiarNivelColombia}
          enfoque={enfoque}
        />
      );
    case "mapa_mundo":
      return <VistaMapaMundo {...comunes} datos={resultado.datos} enfoque={enfoque} />;
    case "linea_tiempo":
      return <VistaLineaTiempo {...comunes} datos={resultado.datos} />;
    case "matriz_calor":
      return <VistaMatrizCalor {...comunes} datos={resultado.datos} />;
    case "red_entidades":
      return <VistaRedEntidades {...comunes} datos={resultado.datos} />;
    case "cuadrante_priorizacion":
      return <VistaCuadrantePriorizacion {...comunes} datos={resultado.datos} />;
    case "composicion_corpus":
      return <VistaComposicionCorpus {...comunes} datos={resultado.datos} />;
    case "panel_evidencia":
      return <VistaPanelEvidencia {...comunes} datos={resultado.datos} />;
    case "distribucion":
      return <VistaDistribucion {...comunes} datos={resultado.datos} />;
    case "orden_observacion":
      return <VistaOrdenObservacion {...comunes} datos={resultado.datos} />;
  }
}
