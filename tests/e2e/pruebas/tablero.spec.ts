import type { Page, TestInfo } from "@playwright/test";

import {
  GRABACIONES,
  auditarAccesibilidad,
  entero,
  esperarSinDesbordeHorizontal,
  expect,
  latencia,
  test,
} from "../soporte/fixtures";
import { TABLERO_URL } from "../soporte/urls";

/**
 * Tablero de analítica visual (dashboard). `/api/visualizar` SIEMPRE se simula con la
 * grabación real, porque llega al agente y a los modelos; el resto de la API
 * (`/api/salud`, `/api/componente`, `/api/evidencia`, `/geo/*.geojson`) se prueba en vivo
 * contra `dashboard.db`, que es justo lo que se despliega.
 */

const V = GRABACIONES.visualizarRespuesta;

/** Copia literal de `dashboard/web/src/lib/fenomenos.ts`. */
const FENOMENOS = [
  { clave: "F1", nombre: "IA y capacidades estratégicas" },
  { clave: "F2", nombre: "Seguridad del entorno espacial" },
  { clave: "F3", nombre: "Dinámicas territoriales" },
] as const;

/** Copia literal de `dashboard/web/src/componentes/instruccion/barra-instruccion.tsx`. */
const SUGERENCIAS: readonly string[] = [
  "Muéstrame las alertas tempranas por departamento con minería ilegal desde 2020",
  "¿Cómo evolucionan los documentos de seguridad espacial por año?",
  "Cruza las entidades más mencionadas con las organizaciones que las publican",
  "¿Qué países concentran las menciones en el fenómeno de IA militar?",
  "Red de entidades alrededor del ELN",
  "Prioriza departamentos por conteo de alertas con corte en 2022",
];

/** Filtros globales iniciales de `lib/filtros.ts`. */
const ANIO_DESDE = 2015;
const ANIO_HASTA = 2026;

/** Tope del lote de `/api/evidencia` que aplica el panel lateral. */
const MAX_PANEL = 50;

interface Ref {
  doc_id: string;
  chunk_id: number | string;
}

interface Resultado {
  componente: string;
  titulo: string;
  fenomeno: number | null;
  filtros_aplicados: Record<string, unknown>;
  datos: unknown;
  evidencia: Ref[];
  nota_metodo: string;
  total_evidencia: number;
  filtros_ignorados?: string[];
}

interface FilaMapa {
  divipola: string;
  nombre: string;
  departamento: string;
  alertas: number;
  refs?: Ref[];
}

interface FilaEvidencia {
  doc_id: string;
  chunk_id: number | string;
  titulo: string;
  fuente: string;
  fragmento: string;
}

interface CuerpoComponente {
  componente: string;
  fenomeno: number | null;
  filtros: Record<string, unknown>;
}

/* ---------------------------------------------------------------------------------------
 * Localizadores
 * ------------------------------------------------------------------------------------- */

const estadoApi = (page: Page) => page.getByRole("banner").getByRole("status");
const modo = (page: Page) => page.getByRole("navigation", { name: "Modo de trabajo" });
const lienzo = (page: Page) =>
  page.getByRole("region").filter({ has: page.getByText("Método:") });
const respuestaAgente = (page: Page) =>
  page.getByRole("region", { name: "Respuesta del agente" });
const panel = (page: Page) => page.getByRole("complementary", { name: "Panel de evidencia" });
const tablaRegiones = (page: Page) =>
  page.getByRole("table").filter({ hasText: "Región" });
const campoInstruccion = (page: Page) =>
  page.getByRole("textbox", { name: "Instrucción en lenguaje natural" });
const botonVisualizar = (page: Page) => page.getByRole("button", { name: /Visualizar|Analizando/ });
const historial = (page: Page) =>
  page.getByRole("region", { name: "Historial de instrucciones" });

function esMovil(testInfo: TestInfo): boolean {
  return testInfo.project.name === "movil";
}

/** Mismos chunk_ids que pide el panel: refs únicas por `doc_id#chunk_id`, en orden. */
function chunkIdsDe(refs: readonly Ref[]): string[] {
  const vistas = new Set<string>();
  const salida: string[] = [];
  for (const ref of refs) {
    const clave = `${ref.doc_id}#${String(ref.chunk_id)}`;
    if (!vistas.has(clave)) {
      vistas.add(clave);
      salida.push(String(ref.chunk_id));
    }
  }
  return salida.slice(0, MAX_PANEL);
}

/** Abre el tablero y devuelve el resultado del primer `POST /api/componente`. */
async function abrirTablero(page: Page): Promise<Resultado> {
  const salud = page.waitForResponse((r) => r.url().includes("/api/salud"));
  const componente = page.waitForResponse(
    (r) => r.url().includes("/api/componente") && r.request().method() === "POST",
  );
  await page.goto(TABLERO_URL);
  await salud;
  return (await (await componente).json()) as Resultado;
}

/** Espera el siguiente `POST /api/componente` provocado por `accion`. */
async function conRecalculo(
  page: Page,
  accion: () => Promise<void>,
): Promise<{ cuerpo: CuerpoComponente; resultado: Resultado }> {
  const espera = page.waitForResponse(
    (r) => r.url().includes("/api/componente") && r.request().method() === "POST",
  );
  await accion();
  const respuesta = await espera;
  return {
    cuerpo: respuesta.request().postDataJSON() as CuerpoComponente,
    resultado: (await respuesta.json()) as Resultado,
  };
}

async function irAExploracion(page: Page): Promise<void> {
  await modo(page).getByRole("button", { name: "Exploración" }).click();
  await expect(page.getByRole("heading", { name: "Exploración manual" })).toBeVisible();
}

/* ---------------------------------------------------------------------------------------
 * Carga inicial
 * ------------------------------------------------------------------------------------- */

test.describe("Tablero · carga inicial", () => {
  test("muestra marca, estado de la API, modo instrucción y el mapa de Colombia por defecto", async ({
    page,
  }) => {
    const salud = page.waitForResponse((r) => r.url().includes("/api/salud"));
    const componente = page.waitForResponse(
      (r) => r.url().includes("/api/componente") && r.request().method() === "POST",
    );
    await page.goto(TABLERO_URL);

    await expect(page).toHaveTitle("Analítica visual · AeroCode");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /AeroCode.*Analítica visual/,
    );

    // Estado de la API leído en vivo de /api/salud.
    const cuerpoSalud = (await (await salud).json()) as {
      estado: string;
      tablas: Record<string, number>;
    };
    expect(cuerpoSalud.estado).toBe("ok");
    await expect(estadoApi(page)).toHaveText(
      `API en línea · ${entero(cuerpoSalud.tablas["fragmentos"] ?? 0)} fragmentos indexados`,
    );

    // El modo de instrucción es el predeterminado.
    await expect(modo(page).getByRole("button", { name: "Instrucción" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(modo(page).getByRole("button", { name: "Exploración" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(page.getByRole("heading", { name: "¿Qué quiere ver?" })).toBeVisible();
    await expect(campoInstruccion(page)).toBeEditable();
    await expect(botonVisualizar(page)).toBeDisabled();
    for (const sugerencia of SUGERENCIAS) {
      await expect(page.getByRole("button", { name: sugerencia })).toBeEnabled();
    }

    // Filtros globales: los tres fenómenos y el rango inicial.
    await expect(page.getByRole("button", { name: "Los tres" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    for (const fenomeno of FENOMENOS) {
      const boton = page.getByRole("button", {
        name: `${fenomeno.clave} · ${fenomeno.nombre}`,
      });
      await expect(boton).toHaveAttribute("aria-pressed", "false");
    }
    await expect(page.getByLabel("Desde")).toHaveValue(String(ANIO_DESDE));
    await expect(page.getByLabel("Hasta")).toHaveValue(String(ANIO_HASTA));

    // La primera petición pide el mapa de departamentos con el rango global.
    const respuesta = await componente;
    expect(respuesta.request().postDataJSON()).toEqual({
      componente: "mapa_colombia",
      fenomeno: null,
      filtros: { nivel: "departamento", desde: ANIO_DESDE, hasta: ANIO_HASTA },
    });
    const resultado = (await respuesta.json()) as Resultado;
    const filas = resultado.datos as FilaMapa[];
    expect(filas.length).toBeGreaterThan(0);

    // Encabezado del lienzo: título de la API, nombre del componente y fenómenos.
    await expect(page.getByRole("heading", { level: 2, name: resultado.titulo })).toBeVisible();
    await expect(lienzo(page)).toContainText("mapa_colombia");
    await expect(lienzo(page)).toContainText("Los tres fenómenos");
    for (const [clave, valor] of Object.entries(resultado.filtros_aplicados)) {
      await expect(lienzo(page)).toContainText(`${clave}: ${String(valor)}`);
    }

    // Pie: nota de método y total de evidencia, tal como los devolvió la API.
    await expect(lienzo(page)).toContainText(resultado.nota_metodo);
    await expect(lienzo(page)).toContainText(
      `${entero(resultado.total_evidencia)} fragmentos de evidencia`,
    );

    // Tabla de ranking: una fila por territorio, con su cifra exacta.
    const cuerpoTabla = tablaRegiones(page).locator("tbody tr");
    await expect(cuerpoTabla).toHaveCount(filas.length);
    const mayor = [...filas].sort((a, b) => b.alertas - a.alertas)[0]!;
    await expect(cuerpoTabla.first()).toContainText(mayor.nombre);
    await expect(cuerpoTabla.first()).toContainText(entero(mayor.alertas));

    // Panel lateral: evidencia del componente completo mientras no hay selección.
    await expect(panel(page)).toContainText("Componente completo");
    await expect(panel(page)).toContainText(resultado.nota_metodo);
    await expect(panel(page)).toContainText(
      `${entero(resultado.total_evidencia)} fragmentos en total`,
    );
    const enPanel = Math.min(resultado.evidencia.length, MAX_PANEL);
    await expect(panel(page)).toContainText(`${entero(enPanel)} en este panel`);
    await expect(panel(page)).toContainText("evidencia del componente");
    await expect(panel(page).getByRole("listitem")).toHaveCount(enPanel);

    // El historial arranca vacío.
    await expect(historial(page)).toContainText("Todavía no hay instrucciones en esta sesión.");
  });

  test("el indicador informa cuando la API de salud no responde", async ({ page, consola }) => {
    consola.permitir(/status of 500/);
    await page.route("**/api/salud", (ruta) =>
      ruta.fulfill({ status: 500, json: { detail: "base no disponible" } }),
    );
    await page.goto(TABLERO_URL);
    await expect(estadoApi(page)).toHaveText("API no disponible");
    // El componente se sigue pidiendo: la salud es informativa, no un portero.
    await expect(page.getByRole("heading", { level: 2, name: /Alertas tempranas/ })).toBeVisible();
  });

  test("un error de /api/componente muestra el aviso y Reintentar vuelve a pedirlo", async ({
    page,
    consola,
  }) => {
    consola.permitir(/status of 503/);
    let intentos = 0;
    await page.route("**/api/componente", async (ruta) => {
      intentos += 1;
      if (intentos === 1) {
        await ruta.fulfill({ status: 503, json: { detail: "la base está ocupada" } });
        return;
      }
      await ruta.fallback();
    });
    await page.goto(TABLERO_URL);

    const alerta = page.getByRole("alert");
    await expect(alerta).toContainText("No se pudo obtener el dato");
    await expect(alerta).toContainText("la base está ocupada");

    await alerta.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByRole("heading", { level: 2, name: /Alertas tempranas/ })).toBeVisible();
    expect(intentos).toBe(2);
  });
});

/* ---------------------------------------------------------------------------------------
 * Trazabilidad: todo dato abre su fragmento
 * ------------------------------------------------------------------------------------- */

test.describe("Tablero · trazabilidad", () => {
  test("al pulsar un territorio el panel abre los fragmentos originales con doc y chunk", async ({
    page,
  }) => {
    const resultado = await abrirTablero(page);
    const filas = resultado.datos as FilaMapa[];
    const fila = [...filas]
      .sort((a, b) => b.alertas - a.alertas)
      .find((f) => (f.refs ?? []).length > 0)!;
    expect(fila, "alguna región debe traer refs propias").toBeDefined();

    // El panel ya cargó la evidencia del componente completo; ahora se espera la del clic.
    await expect(panel(page).getByRole("listitem").first()).toBeVisible();
    const esperados = chunkIdsDe(fila.refs ?? []).join(",");
    const evidencia = page.waitForResponse(
      (r) =>
        r.url().includes("/api/evidencia") &&
        r.status() === 200 &&
        new URL(r.url()).searchParams.get("chunk_ids") === esperados,
    );
    const boton = tablaRegiones(page).getByRole("button", { name: new RegExp(fila.nombre) }).first();
    await boton.click();
    await expect(boton).toHaveAttribute("aria-pressed", "true");
    const respuesta = await evidencia;

    await expect(panel(page)).toContainText(fila.nombre);
    await expect(panel(page)).toContainText(`${entero(fila.alertas)} alertas`);
    await expect(panel(page)).toContainText(
      `${entero(chunkIdsDe(fila.refs ?? []).length)} en este panel`,
    );
    await expect(panel(page)).not.toContainText("evidencia del componente");

    // Los fragmentos son los de la API, con su texto real.
    const fragmentos = (await respuesta.json()) as FilaEvidencia[] | { fragmentos: FilaEvidencia[] };
    const lista = Array.isArray(fragmentos) ? fragmentos : fragmentos.fragmentos;
    expect(lista.length).toBeGreaterThan(0);
    const primero = lista[0]!;
    const item = panel(page).getByRole("listitem").first();
    await expect(item).toContainText(`doc ${primero.doc_id}`);
    await expect(item).toContainText(`chunk ${String(primero.chunk_id)}`);
    const texto = ((primero as unknown as { texto?: string }).texto ?? "").slice(0, 60).trim();
    if (texto) {
      await expect(item.locator("blockquote")).toContainText(texto);
    } else {
      await expect(item.locator("blockquote")).not.toBeEmpty();
    }

    // Quitar la selección devuelve el panel a la evidencia del componente.
    await panel(page).getByRole("button", { name: "Quitar la selección" }).click();
    await expect(panel(page)).toContainText("Componente completo");
    await expect(boton).toHaveAttribute("aria-pressed", "false");
  });

  test("el mapa dibuja las regiones con datos y el clic sobre una abre su evidencia", async ({
    page,
  }, testInfo) => {
    test.skip(esMovil(testInfo), "El mapa solo ocupa la mitad del lienzo en escritorio.");
    await abrirTablero(page);

    const mapa = page.locator("canvas.maplibregl-canvas");
    await expect(mapa).toBeVisible();
    await expect(page.getByText("acerque el zoom para ver municipios")).toBeVisible();

    // La leyenda da los rangos en números, no solo en color.
    await expect(page.getByText("0 · sin registro")).toBeVisible();

    // El globo solo aparece si la capa de relleno se añadió con sus datos: es la
    // regresión del mapa que quedaba en blanco.
    const caja = (await mapa.boundingBox())!;
    const cx = caja.x + caja.width / 2;
    const cy = caja.y + caja.height / 2;
    const globo = page.locator(".maplibregl-popup-content");
    // El globo solo responde a un movimiento real del ratón: si la capa todavía no estaba
    // lista, hay que volver a moverlo (WebGL por software tarda más con varios procesos).
    await expect(async () => {
      await page.mouse.move(cx - 6, cy - 6);
      await page.mouse.move(cx, cy);
      await expect(globo).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 30_000 });
    await expect(globo).toContainText(/\d+ alertas$/);
    const nombre = (await globo.locator("strong").innerText()).trim();
    expect(nombre.length).toBeGreaterThan(0);

    await page.mouse.click(caja.x + caja.width / 2, caja.y + caja.height / 2);
    await expect(panel(page)).not.toContainText("Componente completo");
    await expect(panel(page)).toContainText(/alertas|Sin alertas registradas/);
  });

  test("abre con el fondo analítico, sin teselas remotas, y el HUD se enciende a petición", async ({
    page,
  }, testInfo) => {
    test.skip(esMovil(testInfo), "El mapa solo ocupa la mitad del lienzo en escritorio.");

    // PRODUCT.md: al abrir, la SPA no debe pedir una sola tesela a un tercero.
    let teselas = 0;
    page.on("request", (peticion) => {
      if (/arcgisonline\.com|cartocdn\.com/.test(peticion.url())) {
        teselas += 1;
      }
    });

    await abrirTablero(page);
    await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();

    const bases = page.getByRole("group", { name: "Mapa base" });
    await expect(bases.getByRole("button", { name: "Analítico" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(teselas).toBe(0);

    const hud = page.getByRole("button", { name: "HUD" });
    await expect(hud).toHaveAttribute("aria-pressed", "false");
    await hud.click();
    await expect(hud).toHaveAttribute("aria-pressed", "true");
    // La lectura de coordenadas repite en cifras lo que el mapa dice con color.
    await expect(page.getByText(/^Z \d+\.\d{2}$/)).toBeVisible();
  });

  test("el volumen 3D se enciende sobre el mapa plano y sin relieve no descarga elevación", async ({
    page,
  }, testInfo) => {
    test.skip(esMovil(testInfo), "El mapa solo ocupa la mitad del lienzo en escritorio.");

    // El relieve acompaña a la imagen: sobre el fondo analítico no debe pedir el modelo
    // de elevación, que es otro recurso remoto.
    let elevacion = 0;
    page.on("request", (peticion) => {
      if (peticion.url().includes("elevation-tiles-prod")) {
        elevacion += 1;
      }
    });

    await abrirTablero(page);
    const volumen = page.getByRole("button", { name: "Volumen" });
    await expect(volumen).toHaveAttribute("aria-pressed", "false");
    await volumen.click();
    await expect(volumen).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
    expect(elevacion).toBe(0);

    // En el globo la extrusión se parte, así que allí el interruptor no se ofrece.
    await irAExploracion(page);
    await page.getByRole("button", { name: "Mapa del mundo" }).click();
    await expect(lienzo(page)).toContainText("mapa_mundo");
    await expect(page.getByRole("button", { name: "Volumen" })).toHaveCount(0);
  });

  test("una consulta nueva reencuadra la cámara sobre las regiones con dato", async ({
    page,
  }, testInfo) => {
    test.skip(esMovil(testInfo), "El mapa solo ocupa la mitad del lienzo en escritorio.");
    await abrirTablero(page);

    // El HUD es la única lectura de la cámara que se puede comprobar desde el DOM; queda
    // encendido al cambiar de modo porque su estado se recuerda.
    await page.getByRole("button", { name: "HUD" }).click();
    const zoom = page.getByText(/^Z \d+\.\d{2}$/);
    await expect(zoom).toBeVisible();
    const antes = await zoom.innerText();

    // Con solo minería ilegal desaparecen alertas de los extremos del país (San Andrés,
    // entre otros), así que la extensión de los datos —y con ella el encuadre— cambia.
    await page.getByRole("button", { name: /Exploración/ }).click();
    const economia = page.getByLabel("Economía ilícita");
    await economia.fill("Minería ilegal");
    await economia.press("Enter");

    await expect(page.getByText("economia: Minería ilegal")).toBeVisible();
    await expect(async () => {
      expect(await zoom.innerText()).not.toBe(antes);
    }).toPass({ timeout: 15_000 });
  });
});

/* ---------------------------------------------------------------------------------------
 * Filtros globales
 * ------------------------------------------------------------------------------------- */

test.describe("Tablero · filtros globales", () => {
  test("la reproducción recorre los años y al pausar devuelve el rango del usuario", async ({
    page,
  }) => {
    await abrirTablero(page);

    await page.getByRole("button", { name: "Reproducir" }).click();
    const enCurso = page.getByRole("button", { name: /^\d{4}$/ });
    await expect(enCurso).toBeVisible();
    const primerAnio = await enCurso.innerText();
    expect(primerAnio).toBe(String(ANIO_DESDE));
    // El año viaja a la API como rango de un solo año.
    await expect(lienzo(page)).toContainText(`hasta: ${primerAnio}`);

    await expect(async () => {
      expect(await enCurso.innerText()).not.toBe(primerAnio);
    }).toPass({ timeout: 15_000 });
    // Un año sin alertas no debe tumbar el mapa: el lienzo sigue dibujado.
    await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();

    await enCurso.click();
    await expect(page.getByLabel("Desde")).toHaveValue(String(ANIO_DESDE));
    await expect(page.getByLabel("Hasta")).toHaveValue(String(ANIO_HASTA));
    await expect(page.getByRole("button", { name: "Reproducir" })).toBeVisible();
  });

  test("elegir un fenómeno vuelve a pedir el componente y el encabezado lo declara", async ({
    page,
  }) => {
    await abrirTablero(page);

    const f2 = FENOMENOS[1];
    const { cuerpo, resultado } = await conRecalculo(page, async () => {
      await page.getByRole("button", { name: `${f2.clave} · ${f2.nombre}` }).click();
    });
    expect(cuerpo.fenomeno).toBe(2);
    expect(resultado.fenomeno).toBe(2);
    await expect(
      page.getByRole("button", { name: `${f2.clave} · ${f2.nombre}` }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Los tres" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(lienzo(page)).toContainText(`${f2.clave} · ${f2.nombre}`);

    // Volver a "Los tres" quita el filtro.
    const vuelta = await conRecalculo(page, async () => {
      await page.getByRole("button", { name: "Los tres" }).click();
    });
    expect(vuelta.cuerpo.fenomeno).toBeNull();
    await expect(lienzo(page)).toContainText("Los tres fenómenos");
  });

  test("el rango de años viaja a la API y queda escrito en la nota de método", async ({
    page,
  }) => {
    await abrirTablero(page);

    const { cuerpo, resultado } = await conRecalculo(page, async () => {
      await page.getByLabel("Desde").fill("2020");
      await page.getByLabel("Desde").blur();
    });
    expect(cuerpo.filtros).toMatchObject({ desde: 2020, hasta: ANIO_HASTA });
    expect(resultado.nota_metodo).toContain(`entre 2020 y ${String(ANIO_HASTA)}`);
    await expect(lienzo(page)).toContainText(`desde: 2020`);
    await expect(lienzo(page)).toContainText(resultado.nota_metodo);
  });
});

/* ---------------------------------------------------------------------------------------
 * Exploración manual
 * ------------------------------------------------------------------------------------- */

test.describe("Tablero · exploración manual", () => {
  test("cambia de componente y aplica los filtros propios de cada uno", async ({ page }) => {
    await abrirTablero(page);
    await irAExploracion(page);

    // Los ocho componentes del catálogo están ofrecidos.
    const catalogo = page
      .getByRole("region", { name: "Exploración manual" })
      .getByRole("button", { name: /Mapa|Línea|Matriz|Red|Cuadrantes|Composición|Panel/ });
    await expect(catalogo).toHaveCount(8);

    const cambio = await conRecalculo(page, async () => {
      await page.getByRole("button", { name: /Panel de evidencia/ }).first().click();
    });
    expect(cambio.cuerpo.componente).toBe("panel_evidencia");
    expect(cambio.cuerpo.filtros).toEqual({ limite: 12 });
    await expect(lienzo(page)).toContainText("panel_evidencia");

    // Regresión: el grafo guarda «eln» y el jurado escribe «ELN».
    const filtrado = await conRecalculo(page, async () => {
      await page.getByLabel("Entidad", { exact: true }).fill("ELN");
      await page.getByLabel("Entidad", { exact: true }).blur();
    });
    expect(filtrado.cuerpo.filtros).toMatchObject({ entidad: "ELN" });
    const filas = filtrado.resultado.datos as FilaEvidencia[];
    expect(filas.length, "la entidad en mayúsculas debe devolver fragmentos").toBeGreaterThan(0);
    await expect(page.getByRole("heading", { level: 2, name: /Fragmentos de la entidad/ })).toBeVisible();
    await expect(lienzo(page)).toContainText(`doc ${filas[0]!.doc_id}`);

    // Cada fragmento del componente abre su propia evidencia en el panel.
    await lienzo(page).getByRole("button").filter({ hasText: `doc ${filas[0]!.doc_id}` }).first().click();
    await expect(panel(page)).toContainText(`doc ${filas[0]!.doc_id}`);
    await expect(panel(page)).toContainText("1 en este panel");

    // Restablecer devuelve los filtros predeterminados del componente.
    const restablecido = await conRecalculo(page, async () => {
      await page.getByRole("button", { name: "Restablecer filtros" }).click();
    });
    expect(restablecido.cuerpo.filtros).toEqual({ limite: 12 });
    await expect(page.getByLabel("Entidad", { exact: true })).toHaveValue("");
  });

  test("el rango de años se deshabilita en los componentes que no lo usan", async ({ page }) => {
    await abrirTablero(page);
    await expect(page.getByLabel("Desde")).toBeEnabled();
    await irAExploracion(page);

    await conRecalculo(page, async () => {
      await page.getByRole("button", { name: /Matriz de calor/ }).first().click();
    });
    await expect(page.getByText("no aplica a este componente")).toBeVisible();
    await expect(page.getByLabel("Desde")).toBeDisabled();
    await expect(page.getByLabel("Hasta")).toBeDisabled();

    // Y el gráfico se describe para lectores de pantalla.
    await expect(page.getByRole("img", { name: /^Matriz de \d+ filas por \d+ columnas/ })).toBeVisible();
  });

  test("un filtro sin resultados muestra el vacío honesto, no un error", async ({ page }) => {
    await abrirTablero(page);
    await irAExploracion(page);

    const { resultado } = await conRecalculo(page, async () => {
      await page.getByLabel("Economía ilícita").fill("economía que no existe en el corpus");
      await page.getByLabel("Economía ilícita").blur();
    });
    expect(resultado.datos).toEqual([]);
    await expect(page.getByText("Sin alertas para estos filtros")).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(panel(page)).toContainText("Sin fragmentos que mostrar");
  });
});

/* ---------------------------------------------------------------------------------------
 * Instrucción en lenguaje natural (siempre simulada)
 * ------------------------------------------------------------------------------------- */

test.describe("Tablero · instrucción en lenguaje natural", () => {
  const INSTRUCCION = "Departamentos con más alertas por minería ilegal";

  test("muestra la espera, la respuesta del agente y aplica la especificación", async ({
    page,
    guardia,
  }) => {
    const visualizar = await guardia.simular(page, "**/api/visualizar", {
      json: V,
      retener: true,
    });
    const inicial = await abrirTablero(page);

    let recalculos = 0;
    await page.route("**/api/componente", async (ruta) => {
      recalculos += 1;
      await ruta.fallback();
    });

    await campoInstruccion(page).fill(INSTRUCCION);
    await expect(botonVisualizar(page)).toBeEnabled();
    await botonVisualizar(page).click();

    // Espera honesta mientras el orquestador consulta al agente.
    const espera = page
      .getByRole("status")
      .filter({ hasText: "El orquestador está consultando al agente de visualización…" });
    await expect(espera).toBeVisible();
    await expect(campoInstruccion(page)).toBeDisabled();
    await expect(botonVisualizar(page)).toBeDisabled();
    await expect.poll(() => visualizar.peticiones.length).toBe(1);
    expect(visualizar.cuerpos()).toEqual([{ instruccion: INSTRUCCION }]);
    // El componente anterior sigue a la vista, atenuado.
    await expect(page.getByRole("heading", { level: 2, name: inicial.titulo })).toBeVisible();

    visualizar.liberar();
    await expect(espera).toBeHidden();

    // Respuesta textual del agente, componente elegido y justificación.
    const respuesta = respuestaAgente(page);
    await expect(respuesta).toContainText(V.respuesta_agente);
    await expect(respuesta).toContainText("Componente elegido");
    await expect(respuesta).toContainText(
      `Mapa de Colombia · ${V.especificacion.componente}`,
    );
    await expect(respuesta).toContainText(V.especificacion.justificacion);
    for (const agente of V.traza.agentes_invocados) {
      await expect(respuesta).toContainText(agente);
    }
    // La traza trae {input, output, total}: el total no se cuenta dos veces.
    await expect(respuesta).toContainText(`${entero(V.traza.tokens["total"] ?? 0)} tokens`);
    await expect(respuesta).toContainText(latencia(V.traza.latencia_ms));

    // El resultado que ya calculó el agente se muestra sin repetir /api/componente.
    await expect(
      page.getByRole("heading", { level: 2, name: V.resultado.titulo }),
    ).toBeVisible();
    for (const [clave, valor] of Object.entries(V.resultado.filtros_aplicados)) {
      await expect(lienzo(page)).toContainText(`${clave}: ${String(valor)}`);
    }
    await expect(lienzo(page)).toContainText(V.resultado.nota_metodo);
    expect(recalculos, "la especificación ya traía su resultado calculado").toBe(0);

    // Los filtros globales quedan sincronizados con lo que decidió el agente.
    const f3 = FENOMENOS[2];
    await expect(
      page.getByRole("button", { name: `${f3.clave} · ${f3.nombre}` }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Desde")).toHaveValue(
      String(V.resultado.filtros_aplicados["desde"]),
    );

    // Y la instrucción queda en el historial, marcada como activa.
    const entrada = historial(page).getByRole("listitem").first();
    await expect(entrada).toContainText(INSTRUCCION);
    await expect(entrada).toContainText(V.especificacion.componente);
    await expect(entrada.getByRole("button")).toHaveAttribute("aria-current", "true");
    await expect(campoInstruccion(page)).toBeEnabled();
    await expect(campoInstruccion(page)).toHaveValue("");
  });

  test("una instrucción de ejemplo se envía al hacer clic y el historial la recupera", async ({
    page,
    guardia,
  }) => {
    const visualizar = await guardia.simular(page, "**/api/visualizar", { json: V });
    await abrirTablero(page);

    const sugerida = SUGERENCIAS[0]!;
    await page.getByRole("button", { name: sugerida }).click();
    await expect(page.getByRole("heading", { level: 2, name: V.resultado.titulo })).toBeVisible();
    expect(visualizar.cuerpos()).toEqual([{ instruccion: sugerida }]);

    // Un cambio de componente en exploración deja el análisis atrás…
    await irAExploracion(page);
    await conRecalculo(page, async () => {
      await page.getByRole("button", { name: /Composición del corpus/ }).first().click();
    });
    await expect(lienzo(page)).toContainText("composicion_corpus");

    // …y el historial lo devuelve tal como lo entregó el agente, sin volver a preguntar.
    await modo(page).getByRole("button", { name: "Instrucción" }).click();
    await historial(page).getByRole("button").first().click();
    await expect(page.getByRole("heading", { level: 2, name: V.resultado.titulo })).toBeVisible();
    await expect(respuestaAgente(page)).toContainText(V.respuesta_agente);
    expect(visualizar.peticiones).toHaveLength(1);
  });

  test("un error del agente se informa y el tablero sigue operativo", async ({
    page,
    guardia,
    consola,
  }) => {
    consola.permitir(/status of 502/);
    const visualizar = await guardia.simular(page, "**/api/visualizar", [
      { status: 502, json: { detail: "no se pudo contactar al agente en http://agente:8000" } },
      { json: V },
    ]);
    const inicial = await abrirTablero(page);

    await campoInstruccion(page).fill(INSTRUCCION);
    await campoInstruccion(page).press("Enter");

    const alerta = page.getByRole("alert");
    await expect(alerta).toContainText("no se pudo contactar al agente");
    // El componente que ya estaba no se pierde.
    await expect(page.getByRole("heading", { level: 2, name: inicial.titulo })).toBeVisible();
    await expect(historial(page).getByRole("listitem").first()).toContainText("error");

    // Se puede volver a intentar.
    await campoInstruccion(page).fill(INSTRUCCION);
    await botonVisualizar(page).click();
    await expect(page.getByRole("heading", { level: 2, name: V.resultado.titulo })).toBeVisible();
    expect(visualizar.peticiones).toHaveLength(2);
  });

  test("si el agente no propone visualización lo dice sin romper el tablero", async ({
    page,
    guardia,
  }) => {
    await guardia.simular(page, "**/api/visualizar", {
      json: {
        respuesta_agente: "La pregunta no pide un gráfico: el corpus responde con texto.",
        especificacion: null,
        resultado: null,
        traza: V.traza,
        citas: [],
      },
    });
    const inicial = await abrirTablero(page);

    await campoInstruccion(page).fill("¿Qué dice el corpus sobre la minería ilegal?");
    await campoInstruccion(page).press("Enter");

    await expect(respuestaAgente(page)).toContainText(
      "La pregunta no pide un gráfico: el corpus responde con texto.",
    );
    await expect(respuestaAgente(page)).toContainText(
      "El agente no propuso ninguna visualización",
    );
    await expect(page.getByRole("heading", { level: 2, name: inicial.titulo })).toBeVisible();
    await expect(historial(page).getByRole("listitem").first()).toContainText("solo texto");
  });

  test("una instrucción vacía o solo con espacios no llega al agente", async ({
    page,
    guardia,
  }) => {
    const visualizar = await guardia.simular(page, "**/api/visualizar", { json: V });
    await abrirTablero(page);

    await expect(botonVisualizar(page)).toBeDisabled();
    await campoInstruccion(page).fill("   ");
    await expect(botonVisualizar(page)).toBeDisabled();
    await campoInstruccion(page).press("Enter");
    await campoInstruccion(page).evaluate((el) =>
      (el as HTMLInputElement).form?.requestSubmit(),
    );

    await page.waitForTimeout(500);
    expect(visualizar.peticiones).toHaveLength(0);
    await expect(page.getByRole("status").filter({ hasText: "orquestador" })).toHaveCount(0);
  });
});

/* ---------------------------------------------------------------------------------------
 * Presentación: sin desborde y accesible
 * ------------------------------------------------------------------------------------- */

test.describe("Tablero · presentación", () => {
  test("sin desborde horizontal en la vista inicial, con selección y en exploración", async ({
    page,
  }) => {
    const resultado = await abrirTablero(page);
    await esperarSinDesbordeHorizontal(page);

    const filas = resultado.datos as FilaMapa[];
    const fila = [...filas].sort((a, b) => b.alertas - a.alertas)[0]!;
    await tablaRegiones(page).getByRole("button", { name: new RegExp(fila.nombre) }).first().click();
    await expect(panel(page)).toContainText(fila.nombre);
    await esperarSinDesbordeHorizontal(page);

    await irAExploracion(page);
    await esperarSinDesbordeHorizontal(page);
    await conRecalculo(page, async () => {
      await page.getByRole("button", { name: /Red de entidades/ }).first().click();
    });
    await expect(page.getByRole("group", { name: /Red de \d+ entidades/ })).toBeVisible();
    await esperarSinDesbordeHorizontal(page);
  });

  test("sin violaciones de accesibilidad serias o críticas en las vistas clave", async ({
    page,
  }, testInfo) => {
    const resultado = await abrirTablero(page);
    await auditarAccesibilidad(page, testInfo, "tablero-inicial");

    const filas = resultado.datos as FilaMapa[];
    const fila = [...filas].sort((a, b) => b.alertas - a.alertas)[0]!;
    await tablaRegiones(page).getByRole("button", { name: new RegExp(fila.nombre) }).first().click();
    await expect(panel(page)).toContainText(fila.nombre);
    await auditarAccesibilidad(page, testInfo, "tablero-evidencia");

    await irAExploracion(page);
    await auditarAccesibilidad(page, testInfo, "tablero-exploracion");
  });

  test("la red de entidades se explora con el teclado", async ({ page }) => {
    await abrirTablero(page);
    await irAExploracion(page);
    await conRecalculo(page, async () => {
      await page.getByRole("button", { name: /Red de entidades/ }).first().click();
    });

    const nodos = page.getByRole("group", { name: /Red de \d+ entidades/ }).getByRole("button");
    await expect(nodos.first()).toBeVisible();
    const nodo = nodos.first();
    const etiqueta = (await nodo.getAttribute("aria-label")) ?? "";
    const nombre = etiqueta.split(",")[0]!.trim();

    await nodo.focus();
    await expect(nodo).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(panel(page)).toContainText(nombre);
    await expect(page.getByRole("button", { name: /Quitar foco en/ })).toBeVisible();
  });
});
