import type { ResultadoComponente } from "@/api/tipos";
import { VistaComposicionCorpus } from "@/componentes/vistas/composicion-corpus";
import { VistaCuadrantePriorizacion } from "@/componentes/vistas/cuadrante-priorizacion";
import { VistaLineaTiempo } from "@/componentes/vistas/linea-tiempo";
import { VistaMapaColombia, type NivelMapa } from "@/componentes/vistas/mapa-colombia";
import { VistaMapaMundo } from "@/componentes/vistas/mapa-mundo";
import { VistaMatrizCalor } from "@/componentes/vistas/matriz-calor";
import { VistaPanelEvidencia } from "@/componentes/vistas/panel-evidencia";
import { VistaRedEntidades } from "@/componentes/vistas/red-entidades";
import type { Seleccion } from "@/lib/seleccion";

interface Props {
  resultado: ResultadoComponente;
  seleccion: Seleccion | null;
  onSeleccionar: (seleccion: Seleccion) => void;
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
  nivelColombia,
  onCambiarNivelColombia,
}: Props) {
  const comunes = {
    titulo: resultado.titulo,
    fenomeno: resultado.fenomeno,
    seleccion,
    onSeleccionar,
  };

  switch (resultado.componente) {
    case "mapa_colombia":
      return (
        <VistaMapaColombia
          {...comunes}
          datos={resultado.datos}
          nivel={nivelColombia}
          onCambiarNivel={onCambiarNivelColombia}
        />
      );
    case "mapa_mundo":
      return <VistaMapaMundo {...comunes} datos={resultado.datos} />;
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
  }
}
