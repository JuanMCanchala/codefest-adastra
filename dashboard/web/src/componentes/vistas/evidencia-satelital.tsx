import type { DatosEvidenciaSatelital } from "@/api/tipos";
import { Vacio } from "@/componentes/ui/estados";
import type { Accion, PropsVista } from "@/lib/seleccion";
import { cn } from "@/lib/utils";

/**
 * La imagen de la que salen las hectáreas.
 *
 * El resto del tablero cuenta lo que dicen los documentos; esto enseña lo que midió un
 * modelo de visión sobre un ortomosaico de dron. Van los tres paneles juntos a propósito:
 * sin la anotación humana al lado, la predicción no se puede juzgar, y la promesa del
 * agente satelital es justamente que la cifra es verificable.
 *
 * El tríptico es una imagen ya compuesta (`scripts/eldor_recorte.py`) porque el recorte
 * son millones de píxeles: componerlo en el navegador no aportaría nada y costaría la
 * descarga de tres capas. Aquí se le ponen alrededor las cifras, la leyenda y la
 * procedencia, que es lo que convierte una foto bonita en evidencia citable.
 */

/** Nombre legible de cada encuadre. La clave es el sufijo del archivo renderizado. */
const ENCUADRES: Record<string, string> = {
  frontera: "Frontera bosque/mina",
  mineria: "Mayor actividad minera",
  bosque: "Frente de deforestación",
};

export function VistaEvidenciaSatelital({
  datos,
  onAccion,
}: PropsVista<DatosEvidenciaSatelital>) {
  const t = datos.triptico;
  if (!t) {
    return (
      <Vacio
        titulo="Todavía no hay recortes renderizados"
        detalle="Se generan con `python scripts/eldor_recorte.py Anel --encuadre bosque`."
      />
    );
  }

  // El encuadre en curso se deduce del nombre del archivo (`{sitio}-{encuadre}.png`), que
  // es lo único estable: `t.encuadre` es una etiqueta en prosa pensada para leerse.
  const actual = t.imagen.replace(/^.*-([a-z]+)\.png$/, "$1");
  const esBosque = actual === "bosque";
  // Con el encuadre de bosque manda lo que se perdió; con los otros, lo que se extrajo.
  const cifras = esBosque
    ? [
        { etiqueta: "Bosque primario", valor: `${t.bosque_ha.toFixed(2)} ha` },
        { etiqueta: "Área intervenida", valor: `${t.intervenida_ha.toFixed(2)} ha` },
        { etiqueta: "Regeneración", valor: `${t.regeneracion_ha.toFixed(2)} ha` },
        { etiqueta: "Huella minera", valor: `${t.huella_minera_ha.toFixed(2)} ha` },
      ]
    : [
        { etiqueta: "Huella minera", valor: `${t.huella_minera_ha.toFixed(2)} ha` },
        { etiqueta: "Bosque primario", valor: `${t.bosque_ha.toFixed(2)} ha` },
        { etiqueta: "Resolución", valor: `${(t.resolucion_m_px * 100).toFixed(2)} cm/px` },
        { etiqueta: "Vuelo", valor: t.fecha_captura },
      ];

  const saltar = (filtros: Record<string, string>, etiqueta: string): void =>
    onAccion?.({ etiqueta, componente: "evidencia_satelital", filtros } satisfies Accion);

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {datos.sitios.length > 1 && onAccion ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-apagado">Sitio:</span>
            {datos.sitios.map((sitio) => (
              <button
                key={sitio}
                type="button"
                onClick={() => saltar({ sitio }, `Ver el sitio ${sitio}`)}
                aria-pressed={sitio === t.sitio}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs transition-colors",
                  sitio === t.sitio
                    ? "border-senal/60 bg-senal/10 text-texto"
                    : "border-borde text-apagado hover:text-texto",
                )}
              >
                {sitio}
              </button>
            ))}
          </div>
        ) : null}

        {datos.encuadres.length > 1 && onAccion ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-apagado">Encuadre:</span>
            {datos.encuadres.map((clave) => {
              const etiqueta = ENCUADRES[clave] ?? clave;
              const activo = clave === actual;
              return (
                <button
                  key={clave}
                  type="button"
                  onClick={() =>
                    saltar(
                      { sitio: t.sitio, encuadre: clave },
                      `Ver ${etiqueta} en ${t.sitio}`,
                    )
                  }
                  aria-pressed={activo}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-xs transition-colors",
                    activo
                      ? "border-senal/60 bg-senal/10 text-texto"
                      : "border-borde text-apagado hover:text-texto",
                  )}
                >
                  {etiqueta}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <img
        src={t.imagen}
        alt={
          `Tríptico del sitio ${t.sitio}: ortomosaico de dron, segmentación del modelo ` +
          `y anotación humana. Bosque primario ${t.bosque_ha} ha, área intervenida ` +
          `${t.intervenida_ha} ha, huella minera ${t.huella_minera_ha} ha.`
        }
        className="w-full rounded-lg border border-borde"
      />

      <dl className="flex flex-wrap gap-x-8 gap-y-2">
        {cifras.map((c) => (
          <div key={c.etiqueta}>
            <dt className="text-xs uppercase tracking-wide text-apagado">{c.etiqueta}</dt>
            <dd className="font-mono text-sm text-texto">{c.valor}</dd>
          </div>
        ))}
      </dl>

      <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
        {t.clases.map((c) => (
          <li key={c.clase} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-[3px]"
              style={{ backgroundColor: c.color }}
            />
            <span className={c.minera ? "text-texto" : "text-apagado"}>
              {c.clase} · {c.porcentaje.toFixed(1)} %{c.minera ? " (huella minera)" : ""}
            </span>
          </li>
        ))}
      </ul>

      <p className="font-mono text-[11px] leading-relaxed text-apagado">{t.procedencia}</p>
    </div>
  );
}
