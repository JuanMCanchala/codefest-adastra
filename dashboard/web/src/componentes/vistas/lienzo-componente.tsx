import {
  ArrowLeft,
  Compass,
  Layers3,
  Maximize2,
  Minimize2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useEffect, type CSSProperties } from "react";

import type { NombreComponente, ResultadoComponente } from "@/api/tipos";
import { Ayuda } from "@/componentes/ui/ayuda";
import { Boton } from "@/componentes/ui/boton";
import { SimboloFenomeno } from "@/componentes/ui/simbolo-fenomeno";
import { CuerpoComponente } from "@/componentes/vistas/cuerpo-componente";
import { SelectorComponente } from "@/componentes/vistas/selector-componente";
import type { NivelMapa } from "@/componentes/vistas/mapa-colombia";
import { definicionDe, etiquetaFiltro, valorFiltro } from "@/lib/catalogo";
import { fenomenoPorId } from "@/lib/fenomenos";
import type { Accion, Seleccion } from "@/lib/seleccion";
import { useVistaTecnica } from "@/lib/vista-tecnica";
import { cn } from "@/lib/utils";

interface Props {
  resultado: ResultadoComponente;
  /** Por qué el agente eligió esta vista; `null` cuando la eligió una persona. */
  motivo: string | null;
  /** Vista con la que abre el tablero, antes de la primera consulta: no es un resultado. */
  partida: boolean;
  /** Adónde volver si esta vista es el desvío a un documento abierto desde la evidencia. */
  retorno: { titulo: string; onVolver: () => void } | null;
  seleccion: Seleccion | null;
  onSeleccionar: (seleccion: Seleccion) => void;
  onAccion: (accion: Accion) => void;
  nivelColombia: NivelMapa;
  onCambiarNivelColombia: (nivel: NivelMapa) => void;
  onCambiarComponente: (componente: NombreComponente) => void;
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

/**
 * El componente activo ocupando la superficie de trabajo.
 *
 * No lleva marco propio: el área de trabajo ya es su contenedor, así que una tarjeta
 * redondeada dentro de la página solo añadía una caja más. Los mandos de datos viven en la
 * ventana del agente; aquí queda lo que describe lo que se está viendo.
 */
export function LienzoComponente({
  resultado,
  motivo,
  partida,
  retorno,
  seleccion,
  onSeleccionar,
  onAccion,
  nivelColombia,
  onCambiarNivelColombia,
  onCambiarComponente,
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
  const filtros = filtrosLegibles(resultado);
  const nota = resultado.nota_metodo || "La API no devolvió nota de método.";

  return (
    <section
      aria-labelledby="titulo-componente"
      className={cn(
        // Recortar a lo ancho es lo que impide que una tabla ancha empuje la página en
        // móvil; `clip` en vez de `hidden` porque el eje vertical se queda visible y el
        // menú del selector puede caer fuera del lienzo sin que le corten la mitad.
        "flex min-h-0 flex-col overflow-x-clip bg-panel",
        pantallaCompleta && "fixed inset-0 z-40",
      )}
      // Las vistas con alto propio (mapas y red) crecen hasta llenar el espacio disponible.
      style={
        {
          "--alto-vista": pantallaCompleta
            ? "calc(100dvh - 3.25rem)"
            : "max(320px, calc(100dvh - 9rem))",
        } as CSSProperties
      }
    >
      <header className="border-b border-borde px-4 py-2">
        <div className="flex items-center gap-2">
          <h2 id="titulo-componente" className="sr-only">
            {resultado.titulo || definicion.etiqueta}
          </h2>
          <SelectorComponente
            componente={resultado.componente}
            titulo={resultado.titulo}
            onCambiar={onCambiarComponente}
          />
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
          {tecnica ? (
            <span className="inline-flex items-center gap-1 font-mono">
              <Layers3 aria-hidden="true" className="size-3" />
              {resultado.componente}
            </span>
          ) : null}
        </div>
      </header>

      {/* El desvío al documento tiene vuelta explícita: la petición anterior con sus filtros. */}
      {retorno ? (
        <div className="border-b border-borde px-4 py-1.5">
          <button
            type="button"
            onClick={retorno.onVolver}
            className="inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-1 text-sm text-senal hover:bg-elevado hover:text-texto"
          >
            <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">Volver a {retorno.titulo}</span>
          </button>
        </div>
      ) : null}

      {/* El arranque no es una búsqueda: se dice, y desaparece con la primera consulta o el
          primer cambio de componente a mano. El mapa se queda, para que la entrada no sea
          una pantalla en blanco. */}
      {partida ? (
        <p className="flex items-start gap-1.5 border-b border-borde px-4 py-2 text-sm text-apagado">
          <Compass aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-senal" />
          <span>
            <span className="font-semibold text-texto">Vista inicial</span> · aún no ha preguntado
            nada. Pregunte al agente o elija un componente en «Ajustar».
          </span>
        </p>
      ) : null}

      {/* La decisión del agente, a la vista (§3.3.2): qué componente eligió y por qué. Es lo
          que el bloque B del Reto 2 evalúa, y hasta ahora solo se leía dentro del hilo. */}
      {motivo ? (
        <p className="flex items-start gap-1.5 border-b border-borde px-4 py-2 text-sm text-apagado">
          <Sparkles aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-senal" />
          <span>
            <span className="font-semibold text-texto">Por qué esta vista: </span>
            {motivo}
          </span>
        </p>
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

      <div className="barra-fina min-h-0 flex-1 overflow-y-auto">
        <CuerpoComponente
          resultado={resultado}
          seleccion={seleccion}
          onSeleccionar={onSeleccionar}
          onAccion={onAccion}
          nivelColombia={nivelColombia}
          onCambiarNivelColombia={onCambiarNivelColombia}
        />
      </div>
    </section>
  );
}
