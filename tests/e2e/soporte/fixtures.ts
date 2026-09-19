import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import {
  test as base,
  expect,
  type Page,
  type Request,
  type TestInfo,
} from "@playwright/test";

/* -------------------------------------------------------------------------------------------
 * Grabaciones reales de las respuestas de los modelos (tests/e2e/fixtures/).
 * ----------------------------------------------------------------------------------------- */

function leerGrabacion<T>(nombre: string): T {
  const ruta = new URL(`../fixtures/${nombre}`, import.meta.url);
  return JSON.parse(readFileSync(ruta, "utf-8")) as T;
}

export interface CitaChat {
  n: number;
  doc_id: string;
  chunk_id: string;
  fuente: string;
  titulo: string | null;
}

export interface GrabacionChat {
  respuesta: string;
  evaluacion: {
    input: string;
    retrieval_context: string[];
    tools_called: {
      name: string;
      input_parameters: Record<string, unknown>;
      output: string;
    }[];
  };
  metadata: {
    num_interacciones: number;
    agentes_invocados: string[];
    tokens: { input: number; output: number; total: number };
    tokens_por_agente: {
      agente: string;
      modelo: string;
      input: number;
      output: number;
      total: number;
    }[];
    latencia_ms: number;
    estado: string;
  };
  extras: { ruta: string | null; citas: CitaChat[]; visualizacion: unknown };
}

export interface GrabacionVisualizar {
  respuesta_agente: string;
  especificacion: {
    componente: string;
    fenomeno: number;
    filtros: Record<string, unknown>;
    titulo: string;
    justificacion: string;
  };
  resultado: {
    componente: string;
    titulo: string;
    filtros_aplicados: Record<string, unknown>;
    datos: {
      divipola: string;
      nombre: string;
      alertas: number;
      refs: { doc_id: string; chunk_id: number }[];
    }[];
    evidencia: { doc_id: string; chunk_id: number }[];
    nota_metodo: string;
    total_evidencia: number;
  };
  traza: {
    agentes_invocados: string[];
    tokens: Record<string, number>;
    latencia_ms: number;
  };
  citas: unknown[];
}

export const GRABACIONES = {
  chatRespuesta: leerGrabacion<GrabacionChat>("chat_respuesta.json"),
  chatRechazo: leerGrabacion<GrabacionChat>("chat_rechazo.json"),
  visualizarRespuesta: leerGrabacion<GrabacionVisualizar>(
    "visualizar_respuesta.json",
  ),
};

/* -------------------------------------------------------------------------------------------
 * Guardia de presupuesto: ninguna petición a /api/chat ni /api/visualizar puede salir sin
 * interceptar. La guardia se registra en el contexto (cubre también pestañas nuevas) y las
 * simulaciones de cada prueba en la página (tienen prioridad sobre las del contexto).
 * ----------------------------------------------------------------------------------------- */

export const RUTAS_MODELO = ["/api/chat", "/api/visualizar"] as const;

export function esRutaModelo(url: string): boolean {
  try {
    const ruta = new URL(url).pathname.replace(/\/+$/, "");
    return (RUTAS_MODELO as readonly string[]).includes(ruta);
  } catch {
    return false;
  }
}

export interface Simulacion {
  status?: number;
  json?: unknown;
  body?: string;
  contentType?: string;
  /** Retiene la respuesta hasta que se llame a `liberar()`, para observar el estado de espera. */
  retener?: boolean;
}

export interface Controlador {
  readonly peticiones: Request[];
  /** Cuerpos JSON de las peticiones recibidas. */
  cuerpos(): unknown[];
  liberar(): void;
}

export interface Guardia {
  /** Intercepta un patrón en la página con una respuesta simulada (o una lista, en orden). */
  simular(
    page: Page,
    patron: string,
    respuesta: Simulacion | Simulacion[],
  ): Promise<Controlador>;
  /** Peticiones a rutas de modelo observadas en la prueba. */
  readonly observadas: Request[];
}

export interface Consola {
  /** Tolera errores de consola esperados (p. ej. el 502 simulado que registra el navegador). */
  permitir(patron: RegExp): void;
  readonly errores: string[];
}

interface Fixtures {
  guardia: Guardia;
  consola: Consola;
}

export const test = base.extend<Fixtures>({
  guardia: [
    async ({ context }, usar) => {
      const manejadas = new Set<Request>();
      const observadas: Request[] = [];
      const noInterceptadas: string[] = [];

      context.on("request", (peticion) => {
        if (esRutaModelo(peticion.url())) {
          observadas.push(peticion);
        }
      });

      // Red de seguridad: si una petición a una ruta de modelo no la atrapa una simulación de
      // la página, se aborta aquí (nunca se deja continuar) y la prueba falla al cerrar.
      await context.route(
        (url) => esRutaModelo(url.toString()),
        async (ruta) => {
          noInterceptadas.push(
            `${ruta.request().method()} ${ruta.request().url()}`,
          );
          await ruta.abort("blockedbyclient");
        },
      );

      const guardia: Guardia = {
        observadas,
        async simular(page, patron, respuesta) {
          const cola = Array.isArray(respuesta) ? [...respuesta] : [respuesta];
          const peticiones: Request[] = [];
          let liberar: () => void = () => undefined;
          const compuerta = new Promise<void>((r) => {
            liberar = r;
          });
          let ultima: Simulacion = cola[cola.length - 1] ?? {};

          await page.route(patron, async (ruta) => {
            const peticion = ruta.request();
            manejadas.add(peticion);
            peticiones.push(peticion);
            const actual =
              cola.length > 0 ? (cola.shift() as Simulacion) : ultima;
            ultima = actual;
            if (actual.retener) {
              await compuerta;
            }
            const cuerpo =
              actual.body ??
              (actual.json === undefined ? "" : JSON.stringify(actual.json));
            await ruta
              .fulfill({
                status: actual.status ?? 200,
                contentType:
                  actual.contentType ?? "application/json; charset=utf-8",
                body: cuerpo,
              })
              .catch(() => undefined); // la página pudo cerrarse mientras se retenía
          });

          return {
            peticiones,
            cuerpos: () => peticiones.map((p) => p.postDataJSON() as unknown),
            liberar: () => liberar(),
          };
        },
      };

      await usar(guardia);

      expect(
        noInterceptadas,
        "Salieron peticiones a rutas de modelo sin interceptar (presupuesto de la clave)",
      ).toEqual([]);
      const sinSimular = observadas
        .filter((p) => !manejadas.has(p))
        .map((p) => p.url());
      expect(
        sinSimular,
        "Toda petición a /api/chat o /api/visualizar debe estar simulada",
      ).toEqual([]);
    },
    { auto: true },
  ],

  consola: [
    async ({ page }, usar) => {
      const errores: string[] = [];
      const permitidos: RegExp[] = [];
      page.on("console", (mensaje) => {
        if (mensaje.type() === "error") {
          errores.push(`[console.error] ${mensaje.text()}`);
        }
      });
      page.on("pageerror", (error) => {
        errores.push(`[pageerror] ${error.message}`);
      });
      const consola: Consola = {
        errores,
        permitir: (patron) => {
          permitidos.push(patron);
        },
      };
      await usar(consola);
      const inesperados = errores.filter(
        (e) => !permitidos.some((p) => p.test(e)),
      );
      expect(
        inesperados,
        "Errores inesperados en la consola del navegador",
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/* -------------------------------------------------------------------------------------------
 * Utilidades comunes.
 * ----------------------------------------------------------------------------------------- */

/** Formato de enteros de la interfaz (es-CO), p. ej. 2837 → "2.837". */
export function entero(valor: number): string {
  return new Intl.NumberFormat("es-CO").format(valor);
}

/** Formato de latencias de la interfaz: ms si < 1 s, si no segundos con un decimal. */
export function latencia(ms: number): string {
  return ms < 1000 ? `${entero(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

/** Comprueba que la página no tenga desborde horizontal. */
export async function esperarSinDesbordeHorizontal(page: Page): Promise<void> {
  const medidas = await page.evaluate(() => {
    const raiz = document.documentElement;
    const cuerpo = document.body;
    const ancho = raiz.clientWidth;
    const culpables: string[] = [];
    if (raiz.scrollWidth > ancho) {
      for (const el of Array.from(
        document.querySelectorAll<HTMLElement>("body *"),
      )) {
        const caja = el.getBoundingClientRect();
        if (caja.right > ancho + 1 && caja.width > 0) {
          culpables.push(
            `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""} (right=${Math.round(caja.right)})`,
          );
          if (culpables.length >= 8) break;
        }
      }
    }
    return {
      scrollWidth: raiz.scrollWidth,
      clientWidth: ancho,
      bodyScrollWidth: cuerpo.scrollWidth,
      culpables,
    };
  });
  expect(
    medidas.scrollWidth,
    `Desborde horizontal: scrollWidth ${medidas.scrollWidth} > clientWidth ${medidas.clientWidth}. Elementos: ${medidas.culpables.join(", ")}`,
  ).toBeLessThanOrEqual(medidas.clientWidth);
}

export interface ResultadoAxe {
  graves: { id: string; impacto: string; ayuda: string; nodos: string[] }[];
  menores: { id: string; impacto: string; ayuda: string; nodos: string[] }[];
}

/**
 * Auditoría axe (WCAG 2.x A/AA). Falla con violaciones "serious" o "critical" y registra las
 * menores en un adjunto y en `test-results/axe/` para el informe.
 */
export async function auditarAccesibilidad(
  page: Page,
  testInfo: TestInfo,
  nombre: string,
): Promise<ResultadoAxe> {
  const analisis = await new AxeBuilder({ page })
    .withTags([
      "wcag2a",
      "wcag2aa",
      "wcag21a",
      "wcag21aa",
      "wcag22aa",
      "best-practice",
    ])
    .analyze();

  const resumir = (v: (typeof analisis.violations)[number]) => ({
    id: v.id,
    impacto: v.impact ?? "desconocido",
    ayuda: v.help,
    nodos: v.nodes.slice(0, 6).map((n) => n.target.join(" ")),
  });
  const graves = analisis.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map(resumir);
  const menores = analisis.violations
    .filter((v) => v.impact !== "serious" && v.impact !== "critical")
    .map(resumir);

  const informe = {
    vista: nombre,
    proyecto: testInfo.project.name,
    graves,
    menores,
  };
  await testInfo.attach(`axe-${nombre}`, {
    body: JSON.stringify(informe, null, 2),
    contentType: "application/json",
  });
  const carpeta = path.join(testInfo.project.outputDir, "axe");
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(
    path.join(carpeta, `${testInfo.project.name}-${nombre}.json`),
    JSON.stringify(informe, null, 2),
  );

  expect(
    graves,
    `Violaciones de accesibilidad serias o críticas en "${nombre}":\n${JSON.stringify(graves, null, 2)}`,
  ).toEqual([]);
  return { graves, menores };
}
