/**
 * Nombres legibles de los componentes del tablero, copiados del catálogo de
 * `dashboard/web/src/lib/catalogo.ts`. La consola solo los usa para nombrar la visualización
 * que propone el agente sin enseñar el identificador interno.
 */

const ETIQUETAS: Record<string, string> = {
  mapa_colombia: "Mapa de Colombia",
  mapa_mundo: "Mapa del mundo",
  linea_tiempo: "Línea de tiempo",
  matriz_calor: "Matriz de calor",
  red_entidades: "Red de entidades",
  cuadrante_priorizacion: "Cuadrantes de priorización",
  composicion_corpus: "Composición del corpus",
  panel_evidencia: "Panel de evidencia",
};

export function etiquetaComponente(componente: string): string {
  return ETIQUETAS[componente] ?? componente;
}
