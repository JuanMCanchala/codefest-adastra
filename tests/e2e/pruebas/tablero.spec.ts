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
/** Ventana flotante del agente: preguntar, ajustar y lo que contestó. */
const agente = (page: Page) => page.getByRole("region", { name: "Agente" });
/** Componente activo: `section` con el título de la API como nombre accesible. */
const lienzo = (page: Page) => page.locator("section[aria-labelledby='titulo-componente']");
const panel = (page: Page) => page.getByRole("complementary", { name: "Panel de evidencia" });
const tablaRegiones = (page: Page) => page.getByRole("table").filter({ hasText: "Región" });
const campoInstruccion = (page: Page) =>
  page.getByRole("textbox", { name: "Instrucción en lenguaje natural" });
const botonVisualizar = (page: Page) => page.getByRole("button", { name: /Visualizar|Analizando/ });
const botonPantallaCompleta = (page: Page) =>
  lienzo(page).getByRole("button", { name: /pantalla completa/i });
const botonMostrarEvidencia = (page: Page) =>
  page.getByRole("button", { name: "Evidencia", exact: true });

/**
 * Enciende la vista técnica como lo hace el despliegue: `VISTA_TECNICA=1` en el contenedor
 * llega a la interfaz en `GET /api/salud`, así que basta con simular esa respuesta.
 */
async function conVistaTecnica(page: Page): Promise<void> {
  await page.route("**/api/salud", async (ruta) => {
    const respuesta = await ruta.fetch();
    const cuerpo = (await respuesta.json()) as Record<string, unknown>;
    await ruta.fulfill({ json: { ...cuerpo, vista_tecnica: true } });
  });
}

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

/**
 * La ventana del agente nace cerrada —el tablero es lo primero que hay que ver— y se abre
 * sobre la burbuja, tapando el panel de evidencia: solo la abren las pruebas que le hablan.
 */
async function abrirAgente(page: Page): Promise<void> {
  const boton = page.getByRole("button", { name: "Abrir el agente" });
  if ((await boton.count()) > 0) {
    await boton.click();
  }
  await expect(campoInstruccion(page)).toBeVisible();
}

/** En móvil la ventana abierta tapa el panel de evidencia: se cierra cuando no hace falta. */
async function cerrarAgente(page: Page): Promise<void> {
  const boton = page.getByRole("button", { name: "Cerrar el agente" });
  if ((await boton.count()) > 0) {
    await boton.click();
    await expect(page.getByRole("button", { name: "Abrir el agente" })).toBeVisible();
  }
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

/**
 * Abre el mapa como vista elegida por URL. Sin componente en la URL el tablero arranca en
 * la «vista inicial»: el panel de evidencia espera vacío hasta que se seleccione o se
 * pregunte, así que las pruebas que leen la evidencia global del mapa entran por aquí.
 */
async function abrirTableroConsultado(page: Page): Promise<Resultado> {
  const componente = page.waitForResponse(
    (r) => r.url().includes("/api/componente") && r.request().method() === "POST",
  );
  await page.goto(`${TABLERO_URL}/?componente=mapa_colombia`);
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

/**
 * Abre la ayuda del componente. En escritorio basta pasar el ratón; en una pantalla táctil
 * no hay hover, así que el icono se enfoca al tocarlo y el globo se abre por `focus-within`.
 */
async function abrirAyuda(page: Page, nombre: string, testInfo: TestInfo): Promise<void> {
  const icono = lienzo(page).getByRole("note", { name: nombre });
  if (esMovil(testInfo)) {
    await icono.tap();
  } else {
    await icono.hover();
  }
}

/**
 * Abre el tablero en un componente concreto con sus filtros.
 *
 * No hay mandos manuales: el componente, los filtros y los años se piden hablando, y eso
 * llega al agente, que en las pruebas siempre va simulado. La URL es la otra entrada real
 * al mismo estado (es la que usa el enlace desde la consola de chat), así que es la que
 * ejercita cada componente sin gastar una llamada a modelos.
 */
async function abrirTableroEn(
  page: Page,
  parametros: Record<string, string | number>,
): Promise<{ cuerpo: CuerpoComponente; resultado: Resultado }> {
  const consulta = new URLSearchParams(
    Object.entries(parametros).map(([clave, valor]) => [clave, String(valor)]),
  );
  const componente = page.waitForResponse(
    (r) => r.url().includes("/api/componente") && r.request().method() === "POST",
  );
  await page.goto(`${TABLERO_URL}/?${consulta.toString()}`);
  const respuesta = await componente;
  return {
    cuerpo: respuesta.request().postDataJSON() as CuerpoComponente,
    resultado: (await respuesta.json()) as Resultado,
  };
}

/* ---------------------------------------------------------------------------------------
 * Carga inicial
 * ------------------------------------------------------------------------------------- */

test.describe("Tablero · carga inicial", () => {
  test("muestra marca, enlace a la consola, el agente y el mapa de Colombia por defecto", async ({
    page,
  }, testInfo) => {
    const salud = page.waitForResponse((r) => r.url().includes("/api/salud"));
    const componente = page.waitForResponse(
      (r) => r.url().includes("/api/componente") && r.request().method() === "POST",
    );
    await page.goto(TABLERO_URL);

    await expect(page).toHaveTitle("Analítica visual · AeroCode");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/AeroCode.*Analítica visual/);

    // Con la API sana el encabezado no anuncia nada: el recuento de fragmentos no le
    // sirve a quien revisa y competía con la vista.
    const cuerpoSalud = (await (await salud).json()) as {
      estado: string;
      tablas: Record<string, number>;
      consola_url?: string | null;
    };
    expect(cuerpoSalud.estado).toBe("ok");
    await expect(estadoApi(page)).toHaveCount(0);
    await expect(page.getByRole("banner")).not.toContainText("fragmentos");

    // El enlace a la consola de chat solo existe si el despliegue la publicó (CONSOLA_URL).
    const enlaceConsola = page.getByRole("banner").getByRole("link", { name: "Consola de chat" });
    if (cuerpoSalud.consola_url) {
      await expect(enlaceConsola).toHaveAttribute("href", cuerpoSalud.consola_url);
    } else {
      await expect(enlaceConsola).toHaveCount(0);
    }

    // El agente nace como burbuja en la esquina: se abre y queda listo para preguntar, sin
    // modos en la barra superior.
    await abrirAgente(page);
    await expect(page.getByRole("navigation", { name: "Modo de trabajo" })).toHaveCount(0);
    await expect(agente(page).getByRole("tab")).toHaveCount(0);
    await expect(campoInstruccion(page)).toBeEditable();
    await expect(botonVisualizar(page)).toBeDisabled();

    // No hay mandos manuales en ninguna parte: ni selector de componente, ni campos de
    // años, ni filtros. Todo se pide hablando.
    await expect(page.getByLabel("Componente", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Desde")).toHaveCount(0);
    await expect(page.getByLabel("Hasta")).toHaveCount(0);
    // El fenómeno lo decide el agente: ya no hay selector en pantalla.
    await expect(page.getByRole("button", { name: "Los tres" })).toHaveCount(0);
    for (const fenomeno of FENOMENOS) {
      await expect(
        page.getByRole("button", { name: `${fenomeno.clave} · ${fenomeno.nombre}` }),
      ).toHaveCount(0);
    }

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
    // Los filtros se leen con los nombres del catálogo, no con las claves de la API, y el
    // rango de años se declara en texto porque sus campos están en el agente.
    await expect(lienzo(page)).toContainText("Nivel territorial: Departamento");
    await expect(lienzo(page)).toContainText(`${String(ANIO_DESDE)}–${String(ANIO_HASTA)}`);

    // Nada de identificadores internos ni de nota de método en la vista principal.
    await expect(page.getByRole("button", { name: "Vista técnica" })).toHaveCount(0);
    await expect(lienzo(page)).not.toContainText("mapa_colombia");
    await expect(lienzo(page)).not.toContainText("nivel:");
    const nota = lienzo(page).getByText(resultado.nota_metodo);
    await expect(nota).toBeHidden();

    // La nota de método se lee al pasar el ratón por el icono de ayuda.
    await abrirAyuda(page, "Mapa de Colombia", testInfo);
    await expect(nota).toBeVisible();
    await expect(
      lienzo(page).getByText("Alertas tempranas por territorio", { exact: false }),
    ).toBeVisible();

    // Tabla de ranking: una fila por territorio, con su cifra exacta.
    const cuerpoTabla = tablaRegiones(page).locator("tbody tr");
    await expect(cuerpoTabla).toHaveCount(filas.length);
    const mayor = [...filas].sort((a, b) => b.alertas - a.alertas)[0]!;
    await expect(cuerpoTabla.first()).toContainText(mayor.nombre);
    await expect(cuerpoTabla.first()).toContainText(entero(mayor.alertas));

    // El arranque no es una búsqueda: se rotula como vista inicial y el panel de evidencia
    // espera vacío con su invitación, en vez de precargarse con las alertas del mapa.
    await expect(lienzo(page)).toContainText("Vista inicial");
    await expect(lienzo(page)).toContainText("aún no ha preguntado nada");
    await expect(panel(page).getByRole("heading", { name: "Evidencia" })).toBeVisible();
    await expect(panel(page).getByRole("listitem")).toHaveCount(0);
    await expect(panel(page)).toContainText("Elija una región del mapa para ver sus fuentes");

    // El agente arranca sin conversación: una pregunta, una línea y nada más.
    await expect(agente(page)).toContainText("¿Qué quiere ver?");
    await expect(agente(page).getByRole("listitem")).toHaveCount(0);

    // Abierto como vista elegida (recarga: va al final para no cerrar la ventana del agente
    // que las comprobaciones anteriores necesitan) (URL con componente) el panel sí trae la evidencia global.
    const consultado = await abrirTableroConsultado(page);
    await expect(lienzo(page)).not.toContainText("Vista inicial");
    const enPanel = Math.min(consultado.evidencia.length, MAX_PANEL);
    await expect(panel(page).getByRole("listitem")).toHaveCount(enPanel);
    await expect(panel(page)).not.toContainText("fragmentos en total");
  });

  test("la burbuja se cierra y se vuelve a abrir desde la esquina", async ({ page }) => {
    await abrirTablero(page);
    await abrirAgente(page);
    await expect(campoInstruccion(page)).toBeVisible();

    await agente(page).getByRole("button", { name: "Cerrar el agente" }).click();
    await expect(agente(page)).toHaveCount(0);
    await esperarSinDesbordeHorizontal(page);

    await page.getByRole("button", { name: "Abrir el agente" }).click();
    await expect(campoInstruccion(page)).toBeVisible();
  });

  test("el indicador informa cuando la API de salud no responde", async ({ page, consola }) => {
    consola.permitir(/status of 500/);
    await page.route("**/api/salud", (ruta) =>
      ruta.fulfill({ status: 500, json: { detail: "base no disponible" } }),
    );
    await page.goto(TABLERO_URL);
    await expect(estadoApi(page)).toHaveText("Corpus no disponible");
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

test.describe("Tablero · vista técnica", () => {
  test("revela los detalles internos, los recuerda y se puede volver a apagar", async ({
    page,
  }) => {
    await conVistaTecnica(page);
    const resultado = await abrirTablero(page);

    // Identificador interno del componente, que la vista del oficial no necesita.
    await expect(lienzo(page)).toContainText(resultado.componente);
  });

  test("con la vista técnica encendida la respuesta del agente muestra tokens", async ({
    page,
    guardia,
  }) => {
    await guardia.simular(page, "**/api/visualizar", { json: V });
    await conVistaTecnica(page);
    await abrirTablero(page);
    await abrirAgente(page);

    await campoInstruccion(page).fill("Departamentos con más alertas por minería ilegal");
    await campoInstruccion(page).press("Enter");

    const respuesta = agente(page);
    await expect(respuesta).toContainText(V.especificacion.componente);
    // La traza trae {input, output, total}: el total no se cuenta dos veces.
    await expect(respuesta).toContainText(`${entero(V.traza.tokens["total"] ?? 0)} tokens`);
  });
});

/* ---------------------------------------------------------------------------------------
 * Trazabilidad: todo dato abre su fragmento
 * ------------------------------------------------------------------------------------- */

test.describe("Tablero · trazabilidad", () => {
  test("al pulsar un territorio el panel abre los fragmentos originales con doc y chunk", async ({
    page,
  }) => {
    const resultado = await abrirTableroConsultado(page);
    await cerrarAgente(page);
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
    const boton = tablaRegiones(page)
      .getByRole("button", { name: new RegExp(fila.nombre) })
      .first();
    await boton.click();
    await expect(boton).toHaveAttribute("aria-pressed", "true");
    const respuesta = await evidencia;

    await expect(panel(page)).toContainText(fila.nombre);
    await expect(panel(page).getByRole("listitem")).toHaveCount(chunkIdsDe(fila.refs ?? []).length);

    // Los fragmentos son los de la API, con su texto real.
    const fragmentos = (await respuesta.json()) as
      FilaEvidencia[] | { fragmentos: FilaEvidencia[] };
    const lista = Array.isArray(fragmentos) ? fragmentos : fragmentos.fragmentos;
    expect(lista.length).toBeGreaterThan(0);
    const primero = lista[0]!;
    const item = panel(page).getByRole("listitem").first();
    await expect(item).toContainText(`fragmento ${String(primero.chunk_id)} de ${primero.doc_id}`);
    const texto = ((primero as unknown as { texto?: string }).texto ?? "").slice(0, 60).trim();
    if (texto) {
      await expect(item).toContainText(texto);
    }

    // Quitar la selección devuelve el panel a la evidencia del componente.
    await panel(page).getByRole("button", { name: "Quitar la selección" }).click();
    await expect(panel(page).getByRole("heading", { level: 2 })).not.toContainText(fila.nombre);
    await expect(boton).toHaveAttribute("aria-pressed", "false");
  });

  test("el mapa dibuja las regiones con datos y el clic sobre una abre su evidencia", async ({
    page,
  }, testInfo) => {
    test.skip(esMovil(testInfo), "El mapa solo ocupa la mitad del lienzo en escritorio.");
    await abrirTablero(page);

    const mapa = page.locator("canvas.maplibregl-canvas");
    await expect(mapa).toBeVisible();
    // El nivel es un control con estado, no un cartel (Anexo B.4.2).
    const nivel = page.getByRole("group", { name: "Nivel del mapa" });
    await expect(nivel.getByRole("button", { name: "Departamentos" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(nivel.getByRole("button", { name: "Municipios" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

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
    await expect(panel(page).getByRole("heading", { level: 2 })).toHaveText(/^Evidencia · .+/);
  });

  test("el mapa se dibuja sin pedir una sola tesela a un tercero", async ({ page }, testInfo) => {
    test.skip(esMovil(testInfo), "El mapa solo ocupa la mitad del lienzo en escritorio.");

    // PRODUCT.md: sin mapas base ni recursos remotos que dependan de tokens.
    const remotas: string[] = [];
    page.on("request", (peticion) => {
      const url = peticion.url();
      if (!url.startsWith(TABLERO_URL) && !url.startsWith("data:")) {
        remotas.push(url);
      }
    });

    await abrirTablero(page);
    await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
    expect(remotas, "la SPA no debe salir a la red fuera de su propio origen").toEqual([]);
  });
});

test.describe("Tablero · mandos de la vista", () => {
  test("pantalla completa deja solo el componente y se sale con Escape", async ({ page }) => {
    await abrirTablero(page);
    await abrirAgente(page);
    await expect(panel(page)).toBeVisible();

    await botonPantallaCompleta(page).click();
    await expect(botonPantallaCompleta(page)).toHaveAttribute("aria-pressed", "true");
    // Sin panel de evidencia: el gráfico ocupa la pantalla. El agente se queda encima, que
    // es justo lo que permite seguir cambiando la vista mientras se proyecta.
    await expect(panel(page)).toHaveCount(0);
    await expect(agente(page)).toBeVisible();
    await expect(tablaRegiones(page)).toBeVisible();
    await esperarSinDesbordeHorizontal(page);

    await page.keyboard.press("Escape");
    await expect(botonPantallaCompleta(page)).toHaveAttribute("aria-pressed", "false");
    await expect(panel(page)).toBeVisible();
  });

  test("la evidencia se oculta y se vuelve a mostrar desde el componente", async ({ page }) => {
    await abrirTablero(page);
    await cerrarAgente(page);
    await expect(panel(page)).toBeVisible();

    await panel(page).getByRole("button", { name: "Ocultar la evidencia" }).click();
    await expect(panel(page)).toHaveCount(0);
    await esperarSinDesbordeHorizontal(page);

    // Queda la pestaña del borde para volver a abrirla.
    await botonMostrarEvidencia(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(botonMostrarEvidencia(page)).toHaveCount(0);
  });
});

/* ---------------------------------------------------------------------------------------
 * Filtros globales
 * ------------------------------------------------------------------------------------- */

test.describe("Tablero · enlace de la cita a su referencia", () => {
  test("pulsar el documento de un fragmento abre todos los fragmentos de ese documento", async ({
    page,
  }) => {
    const resultado = await abrirTableroConsultado(page);
    const fila = (resultado.datos as FilaMapa[]).find((f) => (f.refs ?? []).length > 0)!;
    const docId = fila.refs![0]!.doc_id;

    await expect(panel(page).getByRole("listitem").first()).toBeVisible();
    const documento = panel(page).getByRole("listitem").first().getByRole("button").first();
    const etiqueta = (await documento.getAttribute("title")) ?? "";
    expect(etiqueta).toMatch(/^Ver todos los fragmentos de /);
    const docPulsado = etiqueta.replace("Ver todos los fragmentos de ", "");

    const { cuerpo, resultado: nuevo } = await conRecalculo(page, async () => {
      await documento.click();
    });
    expect(cuerpo.componente).toBe("panel_evidencia");
    expect(cuerpo.filtros["doc_id"]).toBe(docPulsado);
    expect(nuevo.titulo).toContain("documento");
    const fragmentos = nuevo.datos as FilaEvidencia[];
    expect(fragmentos.length).toBeGreaterThan(0);
    expect(new Set(fragmentos.map((f) => f.doc_id))).toEqual(new Set([docPulsado]));
    expect(docId.length).toBeGreaterThan(0);
  });
});

test.describe("Tablero · filtros globales", () => {
  test("el fenómeno llega en la URL y el encabezado lo declara", async ({ page }) => {
    const f2 = FENOMENOS[1];
    const componente = page.waitForResponse(
      (r) => r.url().includes("/api/componente") && r.request().method() === "POST",
    );
    await page.goto(`${TABLERO_URL}/?componente=linea_tiempo&fenomeno=2`);
    const respuesta = await componente;

    expect(respuesta.request().postDataJSON()).toMatchObject({
      componente: "linea_tiempo",
      fenomeno: 2,
    });
    await expect(lienzo(page)).toContainText(f2.clave);
  });

  test("el rango de años viaja a la API y queda escrito en la nota de método", async ({
    page,
  }, testInfo) => {
    const { cuerpo, resultado } = await abrirTableroEn(page, {
      componente: "mapa_colombia",
      desde: 2020,
    });
    expect(cuerpo.filtros).toMatchObject({ desde: 2020, hasta: ANIO_HASTA });
    expect(resultado.nota_metodo).toContain(`entre 2020 y ${String(ANIO_HASTA)}`);

    // El rango se declara en la cabecera, que es donde se comprueba lo que se está viendo.
    await expect(lienzo(page)).toContainText(`2020–${String(ANIO_HASTA)}`);
    await abrirAyuda(page, "Mapa de Colombia", testInfo);
    await expect(lienzo(page).getByText(resultado.nota_metodo)).toBeVisible();
  });
});

/* ---------------------------------------------------------------------------------------
 * Exploración manual
 * ------------------------------------------------------------------------------------- */

test.describe("Tablero · componentes y filtros", () => {
  test("cada componente se abre con sus filtros propios y su evidencia", async ({ page }) => {
    // Regresión: el grafo guarda «eln» y quien revisa escribe «ELN».
    const { cuerpo, resultado } = await abrirTableroEn(page, {
      componente: "panel_evidencia",
      entidad: "ELN",
    });
    expect(cuerpo.componente).toBe("panel_evidencia");
    expect(cuerpo.filtros).toMatchObject({ entidad: "ELN", limite: 12 });
    await expect(lienzo(page).getByRole("note", { name: "Panel de evidencia" })).toBeVisible();

    const filas = resultado.datos as FilaEvidencia[];
    expect(filas.length, "la entidad en mayúsculas debe devolver fragmentos").toBeGreaterThan(0);
    await expect(
      page.getByRole("heading", { level: 2, name: /Fragmentos de la entidad/ }),
    ).toBeVisible();
    await expect(lienzo(page)).toContainText(`doc ${filas[0]!.doc_id}`);

    // Cada fragmento del componente abre su propia evidencia en el panel.
    await lienzo(page)
      .getByRole("button")
      .filter({ hasText: `doc ${filas[0]!.doc_id}` })
      .first()
      .click();
    await expect(panel(page)).toContainText(`de ${filas[0]!.doc_id}`);
  });

  test("un componente sin años no recibe el rango global", async ({ page }) => {
    const { cuerpo } = await abrirTableroEn(page, { componente: "matriz_calor" });
    expect(cuerpo.filtros["desde"]).toBeUndefined();
    expect(cuerpo.filtros["hasta"]).toBeUndefined();
    // Y el gráfico se describe para lectores de pantalla.
    await expect(
      page.getByRole("img", { name: /^Matriz de \d+ filas por \d+ columnas/ }),
    ).toBeVisible();
  });

  test("un filtro sin resultados se descarta, se avisa y se muestra el corpus", async ({
    page,
  }) => {
    // Antes esto devolvía un panel en blanco. Un componente vacío es indistinguible de un
    // fallo para quien evalúa, así que la API descarta el filtro que no casa con nada, lo
    // declara en `filtros_ignorados` y responde con el corpus completo (ARQUITECTURA §8.2).
    const { resultado } = await abrirTableroEn(page, {
      componente: "panel_evidencia",
      doc_id: "DOC-QUE-NO-EXISTE",
    });
    expect((resultado.datos as unknown[]).length).toBeGreaterThan(0);
    expect(resultado.filtros_ignorados).toContain("doc_id");
    await expect(lienzo(page).getByRole("status")).toContainText("Sin filtrar por documento");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(lienzo(page)).toContainText("Fragmentos del corpus completo");
  });

  test("un filtro que la API descarta se avisa sin encender la vista técnica", async ({ page }) => {
    // El vocabulario de `economia` es cerrado: un valor inventado se descarta y el
    // componente responde con el conjunto completo, que hay que declarar.
    const { resultado } = await abrirTableroEn(page, {
      componente: "mapa_colombia",
      economia: "economía que no existe en el corpus",
    });
    expect(resultado.filtros_ignorados).toContain("economia");

    await expect(lienzo(page)).toBeVisible();
    const aviso = lienzo(page).getByRole("status");
    await expect(aviso).toContainText("Sin filtrar por economía ilícita");
    await expect(aviso).toContainText("se muestra el conjunto completo");
    await expect(aviso).not.toContainText("Claves descartadas");
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
    await abrirAgente(page);

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
      .filter({ hasText: "Consultando al agente de visualización…" });
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
    const respuesta = agente(page);
    await expect(respuesta).toContainText(V.respuesta_agente);
    await expect(respuesta).toContainText("Mapa de Colombia");
    await expect(respuesta).not.toContainText(V.especificacion.componente);
    await expect(respuesta).toContainText(V.especificacion.justificacion);
    for (const agente of V.traza.agentes_invocados) {
      await expect(respuesta).toContainText(agente);
    }
    await expect(respuesta).toContainText(latencia(V.traza.latencia_ms));
    await expect(respuesta).not.toContainText("tokens");

    // El resultado que ya calculó el agente se muestra sin repetir /api/componente.
    await expect(page.getByRole("heading", { level: 2, name: V.resultado.titulo })).toBeVisible();
    await expect(lienzo(page)).toContainText(
      `Economía ilícita: ${String(V.resultado.filtros_aplicados["economia"])}`,
    );
    expect(recalculos, "la especificación ya traía su resultado calculado").toBe(0);

    // Las cifras del resultado se leen junto a la respuesta, sin interpretar el gráfico.
    await expect(respuesta).toContainText("Evidencia");
    await expect(respuesta).toContainText(`${entero(V.resultado.total_evidencia)} fragmentos`);

    // Los filtros globales quedan sincronizados con lo que decidió el agente.
    await expect(lienzo(page)).toContainText(FENOMENOS[2].clave);
    await expect(campoInstruccion(page)).toBeEnabled();
    await expect(campoInstruccion(page)).toHaveValue("");

    // Y la instrucción queda en el historial —detrás del reloj de la cabecera—, marcada
    // como activa.
    await agente(page).getByRole("button", { name: "Consultas anteriores" }).click();
    const entrada = agente(page).getByRole("listitem").first();
    await expect(entrada).toContainText(INSTRUCCION);
    await expect(entrada.getByRole("button")).toHaveAttribute("aria-current", "true");
    await agente(page).getByRole("button", { name: "Consultas anteriores" }).click();

    // El rango que decidió el agente queda declarado en la cabecera del componente.
    await expect(lienzo(page)).toContainText(
      `${String(V.resultado.filtros_aplicados["desde"])}–${String(
        V.resultado.filtros_aplicados["hasta"],
      )}`,
    );
  });

  test("una instrucción de ejemplo se envía al hacer clic y el historial la recupera", async ({
    page,
    guardia,
  }) => {
    const visualizar = await guardia.simular(page, "**/api/visualizar", { json: V });
    await abrirTablero(page);
    await abrirAgente(page);

    const instruccion = "Alertas tempranas por departamento con minería ilegal";
    await campoInstruccion(page).fill(instruccion);
    await campoInstruccion(page).press("Enter");
    await expect(page.getByRole("heading", { level: 2, name: V.resultado.titulo })).toBeVisible();
    expect(visualizar.cuerpos()).toEqual([{ instruccion }]);

    // Abrir un documento desde la evidencia deja el análisis atrás…
    await expect(panel(page).getByRole("listitem").first()).toBeVisible();
    await conRecalculo(page, async () => {
      await panel(page).getByRole("listitem").first().getByRole("button").first().click();
    });
    await expect(lienzo(page).getByRole("note", { name: "Panel de evidencia" })).toBeVisible();

    // …y el historial lo devuelve tal como lo entregó el agente, sin volver a preguntar.
    await agente(page).getByRole("button", { name: "Consultas anteriores" }).click();
    await agente(page).getByRole("listitem").first().getByRole("button").click();
    await expect(page.getByRole("heading", { level: 2, name: V.resultado.titulo })).toBeVisible();
    await expect(agente(page)).toContainText(V.respuesta_agente);
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
    await abrirAgente(page);

    await campoInstruccion(page).fill(INSTRUCCION);
    await campoInstruccion(page).press("Enter");

    const alerta = page.getByRole("alert");
    await expect(alerta).toContainText("no se pudo contactar al agente");
    // El componente que ya estaba no se pierde.
    await expect(page.getByRole("heading", { level: 2, name: inicial.titulo })).toBeVisible();
    await agente(page).getByRole("button", { name: "Consultas anteriores" }).click();
    await expect(agente(page).getByRole("listitem").first()).toContainText("error");
    await agente(page).getByRole("button", { name: "Consultas anteriores" }).click();

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
    await abrirAgente(page);

    await campoInstruccion(page).fill("¿Qué dice el corpus sobre la minería ilegal?");
    await campoInstruccion(page).press("Enter");

    await expect(agente(page)).toContainText(
      "La pregunta no pide un gráfico: el corpus responde con texto.",
    );
    await expect(agente(page)).toContainText("No propuso ninguna visualización");
    await expect(page.getByRole("heading", { level: 2, name: inicial.titulo })).toBeVisible();
    await agente(page).getByRole("button", { name: "Consultas anteriores" }).click();
    await expect(agente(page).getByRole("listitem").first()).toContainText(
      "¿Qué dice el corpus sobre la minería ilegal?",
    );
  });

  test("una instrucción vacía o solo con espacios no llega al agente", async ({
    page,
    guardia,
  }) => {
    const visualizar = await guardia.simular(page, "**/api/visualizar", { json: V });
    await abrirTablero(page);
    await abrirAgente(page);

    await expect(botonVisualizar(page)).toBeDisabled();
    await campoInstruccion(page).fill("   ");
    await expect(botonVisualizar(page)).toBeDisabled();
    await campoInstruccion(page).press("Enter");
    await campoInstruccion(page).evaluate((el) => (el as HTMLInputElement).form?.requestSubmit());

    await page.waitForTimeout(500);
    expect(visualizar.peticiones).toHaveLength(0);
    await expect(page.getByRole("status").filter({ hasText: "Consultando al agente" })).toHaveCount(
      0,
    );
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
    await tablaRegiones(page)
      .getByRole("button", { name: new RegExp(fila.nombre) })
      .first()
      .click();
    await expect(panel(page)).toContainText(fila.nombre);
    await esperarSinDesbordeHorizontal(page);

    await abrirTableroEn(page, { componente: "red_entidades" });
    await expect(page.getByRole("group", { name: /Red de \d+ entidades/ })).toBeVisible();
    await esperarSinDesbordeHorizontal(page);
  });

  test("sin violaciones de accesibilidad serias o críticas en las vistas clave", async ({
    page,
  }, testInfo) => {
    const resultado = await abrirTablero(page);
    await abrirAgente(page);
    await auditarAccesibilidad(page, testInfo, "tablero-inicial");

    const filas = resultado.datos as FilaMapa[];
    const fila = [...filas].sort((a, b) => b.alertas - a.alertas)[0]!;
    await tablaRegiones(page)
      .getByRole("button", { name: new RegExp(fila.nombre) })
      .first()
      .click();
    await expect(panel(page)).toContainText(fila.nombre);
    await auditarAccesibilidad(page, testInfo, "tablero-evidencia");

    // La ventana ampliada es otra superficie entera: conversación y gráfico a la vez.
    await agente(page).getByRole("button", { name: "Ampliar el panel del agente" }).click();
    await expect(
      agente(page).getByRole("button", { name: "Reducir el panel del agente" }),
    ).toBeVisible();
    await auditarAccesibilidad(page, testInfo, "tablero-agente-ampliado");
  });

  test("la red de entidades se explora con el teclado", async ({ page }) => {
    await abrirTableroEn(page, { componente: "red_entidades" });

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
