import { FlaskConical, Layers3, SlidersHorizontal, TriangleAlert } from "lucide-react";

import type { ResultadoComponente } from "@/api/tipos";
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
import { definicionDe } from "@/lib/catalogo";
import { fenomenoPorId } from "@/lib/fenomenos";
import type { Seleccion } from "@/lib/seleccion";
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

/** Renderiza el componente elegido con su encabezado, su nota de método y su evidencia. */
export function LienzoComponente({
  resultado,
  seleccion,
  onSeleccionar,
  nivelColombia,
  onCambiarNivelColombia,
}: Props) {
  const definicion = definicionDe(resultado.componente);
  const fenomeno = fenomenoPorId(resultado.fenomeno);
  const Icono = definicion.icono;
  const comunes = {
    titulo: resultado.titulo,
    fenomeno: resultado.fenomeno,
    seleccion,
    onSeleccionar,
  };
  const filtros = Object.entries(resultado.filtros_aplicados);

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
    <Tarjeta className="overflow-hidden">
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
          <h2 className="text-base font-semibold">
            {resultado.titulo || definicion.etiqueta}
          </h2>
          <p className="mt-0.5 text-sm text-apagado">{definicion.descripcion}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Insignia>
            <Layers3 aria-hidden="true" className="size-3" />
            {resultado.componente}
          </Insignia>
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
          {filtros.map(([clave, valor]) => (
            <Insignia key={clave}>
              {clave}: {valorLegible(valor)}
            </Insignia>
          ))}
        </div>
      ) : null}

      {resultado.filtros_ignorados && resultado.filtros_ignorados.length > 0 ? (
        <p className="flex items-center gap-1.5 border-b border-borde bg-alerta/10 px-4 py-2 text-xs text-alerta">
          <TriangleAlert aria-hidden="true" className="size-3.5" />
          Filtros ignorados por la API: {resultado.filtros_ignorados.join(", ")}
        </p>
      ) : null}

      <div>{cuerpo()}</div>

      <footer className="flex flex-wrap items-start gap-3 border-t border-borde bg-elevado/40 px-4 py-2.5">
        <p className="inline-flex min-w-0 flex-1 basis-64 items-start gap-2 text-sm leading-relaxed text-apagado">
          <FlaskConical aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-senal" />
          <span>
            <span className="font-semibold text-texto">Método: </span>
            {resultado.nota_metodo || "La API no devolvió nota de método."}
          </span>
        </p>
        <Insignia>
          {formatearEntero(resultado.total_evidencia)} fragmentos de evidencia
        </Insignia>
      </footer>
    </Tarjeta>
  );
}
