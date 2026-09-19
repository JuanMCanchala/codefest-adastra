import { Layers3, SlidersHorizontal, TriangleAlert } from "lucide-react";

import type { ResultadoComponente } from "@/api/tipos";
import { Ayuda } from "@/componentes/ui/ayuda";
import { Insignia } from "@/componentes/ui/insignia";
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
import { fenomenoPorId } from "@/lib/fenomenos";
import type { Seleccion } from "@/lib/seleccion";
import { useVistaTecnica } from "@/lib/vista-tecnica";
import { cn, formatearEntero } from "@/lib/utils";

interface Props {
  resultado: ResultadoComponente;
  seleccion: Seleccion | null;
  onSeleccionar: (seleccion: Seleccion) => void;
  nivelColombia: NivelMapa;
  onCambiarNivelColombia: (nivel: NivelMapa) => void;
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
function filtrosLegibles(resultado: ResultadoComponente): { clave: string; texto: string }[] {
  const entradas = Object.entries(resultado.filtros_aplicados);
  const desde = entradas.find(([clave]) => clave === "desde")?.[1];
  const hasta = entradas.find(([clave]) => clave === "hasta")?.[1];
  const salida: { clave: string; texto: string }[] = [];
  if (desde !== undefined || hasta !== undefined) {
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
}: Props) {
  const tecnica = useVistaTecnica();
  const definicion = definicionDe(resultado.componente);
  const fenomeno = fenomenoPorId(resultado.fenomeno);
  const Icono = definicion.icono;
  const comunes = {
    titulo: resultado.titulo,
    fenomeno: resultado.fenomeno,
    seleccion,
    onSeleccionar,
  };
  const filtros = filtrosLegibles(resultado);
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
    <Tarjeta como="section" aria-labelledby="titulo-componente" className="overflow-hidden">
      <header className="flex flex-wrap items-start gap-3 border-b border-borde px-4 py-3">
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border",
            "border-borde bg-elevado text-apagado",
          )}
        >
          <Icono aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="titulo-componente" className="text-base font-semibold">
            {resultado.titulo || definicion.etiqueta}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Ayuda titulo={definicion.etiqueta}>
            {definicion.descripcion}
            <span className="mt-2 block border-t border-borde pt-2">
              <span className="font-semibold text-texto">Cómo se calculó: </span>
              {nota}
            </span>
          </Ayuda>
          {tecnica ? (
            <Insignia>
              <Layers3 aria-hidden="true" className="size-3" />
              {resultado.componente}
            </Insignia>
          ) : null}
          {fenomeno ? (
            <Insignia className="text-texto">
              <SimboloFenomeno fenomeno={fenomeno} />
              {fenomeno.clave} · {fenomeno.nombre}
            </Insignia>
          ) : (
            <Insignia>Los tres fenómenos</Insignia>
          )}
        </div>
      </header>

      {filtros.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-borde bg-elevado/40 px-4 py-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-apagado">
            <SlidersHorizontal aria-hidden="true" className="size-3" />
            Filtros aplicados
          </span>
          {filtros.map((filtro) => (
            <Insignia key={filtro.clave}>{filtro.texto}</Insignia>
          ))}
        </div>
      ) : null}

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

      <div>{cuerpo()}</div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-borde bg-elevado/40 px-4 py-2">
        <Insignia>
          {formatearEntero(resultado.total_evidencia)} fragmentos de evidencia
        </Insignia>
      </footer>
    </Tarjeta>
  );
}
