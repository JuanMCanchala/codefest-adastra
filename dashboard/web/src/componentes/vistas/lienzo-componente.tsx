import { Layers3, Maximize2, Minimize2, TriangleAlert } from "lucide-react";
import { useEffect, type CSSProperties } from "react";

import type { ResultadoComponente } from "@/api/tipos";
import { ControlesFiltrosGlobales } from "@/componentes/filtros/filtros-globales";
import { Ayuda } from "@/componentes/ui/ayuda";
import { Boton } from "@/componentes/ui/boton";
import { SimboloFenomeno } from "@/componentes/ui/simbolo-fenomeno";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { VistaComposicionCorpus } from "@/componentes/vistas/composicion-corpus";
import { VistaCuadrantePriorizacion } from "@/componentes/vistas/cuadrante-priorizacion";
import { VistaLineaTiempo } from "@/componentes/vistas/linea-tiempo";
import { VistaMapaColombia, type NivelMapa } from "@/componentes/vistas/mapa-colombia";
import { VistaMapaMundo } from "@/componentes/vistas/mapa-mundo";
import { VistaMatrizCalor } from "@/componentes/vistas/matriz-calor";
import { VistaPanelEvidencia } from "@/componentes/vistas/panel-evidencia";
import { VistaRedEntidades } from "@/componentes/vistas/red-entidades";
import { definicionDe, etiquetaFiltro, valorFiltro } from "@/lib/catalogo";
import type { FiltrosGlobales } from "@/lib/filtros";
import { fenomenoPorId } from "@/lib/fenomenos";
import type { Seleccion } from "@/lib/seleccion";
import { useVistaTecnica } from "@/lib/vista-tecnica";
import { cn } from "@/lib/utils";

interface Props {
  resultado: ResultadoComponente;
  seleccion: Seleccion | null;
  onSeleccionar: (seleccion: Seleccion) => void;
  nivelColombia: NivelMapa;
  onCambiarNivelColombia: (nivel: NivelMapa) => void;
  anios: FiltrosGlobales;
  usaAnios: boolean;
  onCambiarAnios: (filtros: FiltrosGlobales) => void;
  pantallaCompleta: boolean;
  onAlternarPantallaCompleta: () => void;
}

function valorLegible(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "string" || typeof valor === "number" || typeof valor === "boolean") {
    return String(valor);
  }
  return JSON.stringify(valor);
}

/**
 * Filtros como los leería quien revisa el tablero: el rango de años se junta en una sola
 * etiqueta y las claves internas se cambian por los nombres del catálogo.
 */
function filtrosLegibles(
  resultado: ResultadoComponente,
  conCamposDeAnios: boolean,
): { clave: string; texto: string }[] {
  const entradas = Object.entries(resultado.filtros_aplicados);
  const desde = entradas.find(([clave]) => clave === "desde")?.[1];
  const hasta = entradas.find(([clave]) => clave === "hasta")?.[1];
  const salida: { clave: string; texto: string }[] = [];
  // Solo se escribe el rango cuando el componente no trae sus campos de años al lado.
  if (!conCamposDeAnios && (desde !== undefined || hasta !== undefined)) {
    salida.push({
      clave: "anios",
      texto: `${valorLegible(desde)}–${valorLegible(hasta)}`,
    });
  }
  for (const [clave, valor] of entradas) {
    if (clave === "desde" || clave === "hasta") {
      continue;
    }
    salida.push({
      clave,
      texto: `${etiquetaFiltro(resultado.componente, clave)}: ${valorFiltro(
        resultado.componente,
        clave,
        valor,
      )}`,
    });
  }
  return salida;
}

/** Renderiza el componente elegido con su encabezado, su nota de método y su evidencia. */
export function LienzoComponente({
  resultado,
  seleccion,
  onSeleccionar,
  nivelColombia,
  onCambiarNivelColombia,
  anios,
  usaAnios,
  onCambiarAnios,
  pantallaCompleta,
  onAlternarPantallaCompleta,
}: Props) {
  const tecnica = useVistaTecnica();

  // Escape sale de la pantalla completa: es lo que espera cualquiera al proyectar.
  useEffect(() => {
    if (!pantallaCompleta) {
      return;
    }
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        onAlternarPantallaCompleta();
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [onAlternarPantallaCompleta, pantallaCompleta]);
  const definicion = definicionDe(resultado.componente);
  const fenomeno = fenomenoPorId(resultado.fenomeno);
  const Icono = definicion.icono;
  const comunes = {
    titulo: resultado.titulo,
    fenomeno: resultado.fenomeno,
    seleccion,
    onSeleccionar,
  };
  const filtros = filtrosLegibles(resultado, usaAnios);
  const nota = resultado.nota_metodo || "La API no devolvió nota de método.";

  const cuerpo = () => {
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
  };

  return (
    <Tarjeta
      como="section"
      aria-labelledby="titulo-componente"
      className={cn(
        "overflow-hidden",
        pantallaCompleta && "fixed inset-0 z-40 flex flex-col rounded-none border-0",
      )}
      // Las vistas con alto propio (mapas y red) crecen hasta llenar la pantalla.
      style={
        pantallaCompleta
          ? ({ "--alto-vista": "calc(100dvh - 3.25rem)" } as CSSProperties)
          : undefined
      }
    >
      {/* El título manda en su propia línea; el contexto y los mandos, debajo. Una sola
          cabecera: antes eran tres tiras apiladas con su propio borde. */}
      <header className="border-b border-borde px-4 py-2">
        <div className="flex items-center gap-2">
          <Icono aria-hidden="true" className="size-4 shrink-0 text-apagado" />
          <h2
            id="titulo-componente"
            title={resultado.titulo || definicion.etiqueta}
            className="min-w-0 flex-1 truncate text-base font-semibold"
          >
            {resultado.titulo || definicion.etiqueta}
          </h2>
          <Ayuda titulo={definicion.etiqueta}>
            {definicion.descripcion}
            <span className="mt-1.5 block border-t border-borde pt-1.5">
              <span className="font-semibold text-texto">Cómo se calculó: </span>
              {nota}
            </span>
          </Ayuda>
          <Boton
            tamano="icono"
            variante="fantasma"
            aria-pressed={pantallaCompleta}
            onClick={onAlternarPantallaCompleta}
            aria-label={pantallaCompleta ? "Salir de pantalla completa" : "Pantalla completa"}
            title={pantallaCompleta ? "Salir de pantalla completa (Esc)" : "Pantalla completa"}
          >
            {pantallaCompleta ? (
              <Minimize2 aria-hidden="true" className="size-4" />
            ) : (
              <Maximize2 aria-hidden="true" className="size-4" />
            )}
          </Boton>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-apagado">
          {fenomeno ? (
            <span className="inline-flex items-center gap-1.5 text-texto">
              <SimboloFenomeno fenomeno={fenomeno} />
              {fenomeno.clave}
            </span>
          ) : null}
          {filtros.map((filtro) => (
            <span key={filtro.clave} className="font-mono">
              {filtro.texto}
            </span>
          ))}
          <ControlesFiltrosGlobales
            filtros={anios}
            usaAnios={usaAnios}
            onCambiar={onCambiarAnios}
          />
          {tecnica ? (
            <span className="inline-flex items-center gap-1 font-mono">
              <Layers3 aria-hidden="true" className="size-3" />
              {resultado.componente}
            </span>
          ) : null}
        </div>
      </header>

      {/* Un filtro descartado cambia lo que el gráfico responde: se avisa siempre, porque
          ver el conjunto completo creyendo que está filtrado es peor que no filtrar. */}
      {resultado.filtros_ignorados && resultado.filtros_ignorados.length > 0 ? (
        <p
          role="status"
          className="flex items-start gap-1.5 border-b border-borde bg-alerta/10 px-4 py-2 text-sm text-alerta"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Sin filtrar por{" "}
            {resultado.filtros_ignorados
              .map((clave) => etiquetaFiltro(resultado.componente, clave).toLowerCase())
              .join(", ")}
            : el valor pedido no existe en los datos, así que se muestra el conjunto completo.
            {tecnica ? ` Claves descartadas: ${resultado.filtros_ignorados.join(", ")}.` : ""}
          </span>
        </p>
      ) : null}

      <div className={cn(pantallaCompleta && "min-h-0 flex-1 overflow-y-auto")}>{cuerpo()}</div>
    </Tarjeta>
  );
}
