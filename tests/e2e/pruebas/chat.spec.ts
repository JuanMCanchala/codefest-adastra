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
import { CHAT_URL, TABLERO_URL } from "../soporte/urls";

/**
 * Consola de chat (frontagent). `/api/chat` SIEMPRE se simula con las grabaciones reales;
 * `/api/health` va en vivo (no usa modelos).
 */

const R = GRABACIONES.chatRespuesta;
const RECHAZO = GRABACIONES.chatRechazo;
const PREGUNTA =
  "¿Qué capacidades antisatélite se han demostrado y qué riesgos generan para la órbita baja?";

/** Copia literal de `frontagent/lib/sugerencias.ts`. */
const SUGERENCIAS: Record<"F1" | "F2" | "F3", [string, string]> = {
  F1: [
    "¿Qué capacidades estratégicas habilita la inteligencia artificial en entornos militares y qué riesgos se documentan?",
    "¿Cómo avanza Colombia en la adopción de inteligencia artificial para la Defensa Nacional frente a la tendencia global?",
  ],
  F2: [
    "¿Qué tan congestionada está la órbita baja terrestre y qué implica para Colombia?",
    "¿Qué es el síndrome de Kessler y qué medidas de mitigación de basura espacial se están aplicando?",
  ],
  F3: [
    "¿Cuáles son las principales amenazas a la gobernanza territorial en América Latina según el corpus?",
    "¿Qué relación documentan las fuentes entre economías ilícitas, migración y violencia en Colombia?",
  ],
};

const FENOMENOS = [
  { clave: "F1", nombre: "IA y capacidades estratégicas" },
  { clave: "F2", nombre: "Seguridad del entorno espacial" },
  { clave: "F3", nombre: "Dinámicas territoriales" },
] as const;

/** Número de marcadores `[n]` (incluidos `[1, 2]`) que el texto convierte en botones. */
function contarCitasEnTexto(texto: string, disponibles: number[]): number {
  let total = 0;
  for (const m of texto.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)) {
    for (const n of (m[1] ?? "").split(",")) {
      if (disponibles.includes(Number.parseInt(n.trim(), 10))) total += 1;
    }
  }
  return total;
}

function esMovil(testInfo: TestInfo): boolean {
  return testInfo.project.name === "movil";
}

const campo = (page: Page) =>
  page.getByRole("textbox", { name: "Escriba su consulta" });
const botonEnviar = (page: Page) =>
  page.getByRole("button", { name: "Enviar consulta" });
const panelInspeccion = (page: Page) =>
  page.getByRole("complementary", { name: "Panel de inspección" });
const panelEvidencia = (page: Page) =>
  page.getByRole("tabpanel", { name: "Evidencia" });
const panelTraza = (page: Page) =>
  page.getByRole("tabpanel", { name: "Traza" });
const alerta = (page: Page) => page.getByRole("main").getByRole("alert");
const interruptorTecnico = (page: Page) =>
  page.getByRole("button", { name: "Vista técnica" });

/** Enciende la vista técnica, apagada por defecto. */
async function activarVistaTecnica(page: Page): Promise<void> {
  await interruptorTecnico(page).click();
  await expect(interruptorTecnico(page)).toHaveAttribute("aria-pressed", "true");
}
const respuestas = (page: Page) =>
  page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "Respuesta del sistema" }),
    });

/** En móvil, alterna el selector segmentado; en escritorio ambas vistas están siempre visibles. */
async function verConversacion(page: Page, testInfo: TestInfo): Promise<void> {
  if (esMovil(testInfo)) {
    await page
      .getByRole("group", { name: "Vista" })
      .getByRole("button", { name: "Conversación" })
      .click();
  }
  await expect(page.getByRole("main")).toBeVisible();
}

async function verInspeccion(page: Page, testInfo: TestInfo): Promise<void> {
  if (esMovil(testInfo)) {
    await page
      .getByRole("group", { name: "Vista" })
      .getByRole("button", { name: "Evidencia y traza" })
      .click();
  }
  await expect(panelInspeccion(page)).toBeVisible();
}

async function abrirConsola(page: Page): Promise<void> {
  const salud = page.waitForResponse((r) => r.url().endsWith("/api/health"));
  await page.goto(CHAT_URL);
  await salud;
}

test.describe("Chat · carga inicial", () => {
  test("muestra marca, sugerencias por fenómeno, estado del agente, redactor y enlace al tablero", async ({
    page,
  }) => {
    const saludPromesa = page.waitForResponse((r) =>
      r.url().endsWith("/api/health"),
    );
    await page.goto(CHAT_URL);

    await expect(page).toHaveTitle("Consola de inteligencia · AeroCode");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /AeroCode.*Consola de inteligencia/,
    );

    // Estado del agente leído en vivo de /api/health.
    const salud = await saludPromesa;
    const cuerpoSalud = (await salud.json()) as {
      agente?: { alcanzable?: boolean };
    };
    expect(cuerpoSalud.agente?.alcanzable).toBe(true);
    await expect(
      page.getByRole("status").filter({ hasText: /Agente/ }),
    ).toHaveText("Agente en línea");

    // Sugerencias agrupadas por fenómeno.
    await expect(
      page.getByRole("heading", { name: "¿Qué necesita verificar?" }),
    ).toBeVisible();
    for (const fenomeno of FENOMENOS) {
      const encabezado = page.getByRole("heading", {
        level: 3,
        name: new RegExp(`${fenomeno.clave}\\s*${fenomeno.nombre}`),
      });
      await expect(encabezado).toBeVisible();
      const grupo = page.getByRole("listitem").filter({ has: encabezado });
      const preguntas = grupo.getByRole("list").getByRole("button");
      await expect(preguntas).toHaveCount(2);
      for (const pregunta of SUGERENCIAS[fenomeno.clave]) {
        await expect(
          grupo.getByRole("button", { name: pregunta }),
        ).toBeEnabled();
      }
    }

    // Redactor: campo, contador y botón deshabilitado mientras está vacío.
    await expect(campo(page)).toBeVisible();
    await expect(campo(page)).toBeEditable();
    await expect(campo(page)).toHaveAttribute("maxlength", "4000");
    await expect(page.getByText("0 / 4000", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Enter envía · Shift + Enter salto de línea"),
    ).toBeVisible();
    await expect(botonEnviar(page)).toBeDisabled();

    // Enlace al tablero (DASHBOARD_URL del contenedor) en pestaña nueva.
    const enlace = page.getByRole("link", { name: /Tablero de analítica/ });
    await expect(enlace).toBeVisible();
    await expect(enlace).toHaveAttribute("href", TABLERO_URL);
    await expect(enlace).toHaveAttribute("target", "_blank");
  });

  test("el indicador informa si el agente no es alcanzable", async ({
    page,
  }) => {
    await page.route("**/api/health", (ruta) =>
      ruta.fulfill({
        json: {
          estado: "ok",
          servicio: "frontagent",
          agente: { alcanzable: false },
        },
      }),
    );
    await page.goto(CHAT_URL);
    await expect(
      page.getByRole("status").filter({ hasText: /Agente/ }),
    ).toHaveText("Agente sin conexión");
  });
});

test.describe("Chat · consulta con respuesta citada", () => {
  test("Enter envía, muestra la espera y la respuesta con citas, evidencia y traza", async ({
    page,
    guardia,
  }, testInfo) => {
    const chat = await guardia.simular(page, "**/api/chat", {
      json: R,
      retener: true,
    });
    await abrirConsola(page);

    await campo(page).fill(PREGUNTA);
    await expect(
      page.getByText(`${PREGUNTA.length} / 4000`, { exact: true }),
    ).toBeVisible();
    await campo(page).press("Enter");

    // Estado de espera honesto mientras el agente "piensa".
    const espera = page
      .getByRole("status")
      .filter({ hasText: "Consultando al sistema multiagente…" });
    await expect(espera).toBeVisible();
    await expect(campo(page)).toBeDisabled();
    await expect(botonEnviar(page)).toBeDisabled();
    await expect(page.getByText(PREGUNTA, { exact: true })).toBeVisible(); // burbuja del usuario
    await expect.poll(() => chat.peticiones.length).toBe(1);
    expect(chat.cuerpos()).toEqual([{ pregunta: PREGUNTA }]);

    chat.liberar();

    const respuesta = respuestas(page);
    await expect(respuesta).toHaveCount(1);
    await expect(espera).toBeHidden();
    await expect(respuesta).toContainText(R.respuesta.slice(0, 90));
    await expect(respuesta).toContainText(latencia(R.metadata.latencia_ms));
    await expect(respuesta).toContainText(
      R.metadata.agentes_invocados.join(" → "),
    );
    // Consumo de tokens y ruta interna: solo con la vista técnica encendida.
    await expect(interruptorTecnico(page)).toHaveAttribute("aria-pressed", "false");
    const cabecera = respuesta.locator("header");
    await expect(cabecera).not.toContainText("tokens");
    await expect(cabecera).not.toContainText(R.extras.ruta ?? "sin ruta");
    await expect(
      respuesta.getByRole("heading", {
        name: `Fuentes (${R.extras.citas.length})`,
      }),
    ).toBeVisible();

    const disponibles = R.extras.citas.map((c) => c.n);
    const citas = respuesta.getByRole("button", {
      name: /^Ver evidencia de la cita \d+$/,
    });
    await expect(citas).toHaveCount(
      contarCitasEnTexto(R.respuesta, disponibles),
    );

    // El redactor queda listo para la siguiente pregunta.
    await expect(campo(page)).toBeEnabled();
    await expect(campo(page)).toHaveValue("");
    await expect(page.getByText("0 / 4000", { exact: true })).toBeVisible();

    // Clic en la cita [1]: abre Evidencia con doc_id, chunk_id y el texto del fragmento.
    await respuesta
      .getByRole("button", { name: "Ver evidencia de la cita 1" })
      .first()
      .click();
    await expect(panelInspeccion(page)).toBeVisible(); // en móvil cambia sola de vista
    await expect(page.getByRole("tab", { name: "Evidencia" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const cita1 = R.extras.citas[0]!;
    const activa = panelEvidencia(page)
      .getByRole("listitem")
      .filter({ has: page.getByRole("button", { expanded: true }) });
    await expect(activa).toHaveCount(1);
    await expect(activa).toContainText(`doc ${cita1.doc_id}`);
    await expect(activa).toContainText(`chunk ${cita1.chunk_id}`);
    await expect(activa.locator("blockquote")).toContainText(
      R.evaluacion.retrieval_context[0]!.slice(0, 120).trim(),
    );
    await expect(panelEvidencia(page).getByRole("listitem")).toHaveCount(
      R.extras.citas.length,
    );

    // Teclado: foco en la cita [3] y Enter.
    await verConversacion(page, testInfo);
    const boton3 = respuesta
      .getByRole("button", { name: "Ver evidencia de la cita 3" })
      .first();
    await boton3.focus();
    await expect(boton3).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(panelInspeccion(page)).toBeVisible();
    const cita3 = R.extras.citas[2]!;
    await expect(activa).toContainText(`doc ${cita3.doc_id}`);
    await expect(activa).toContainText(`chunk ${cita3.chunk_id}`);
    await expect(activa.locator("blockquote")).toContainText(
      R.evaluacion.retrieval_context[2]!.slice(0, 120).trim(),
    );

    // Pestaña Traza: agentes, herramientas, tokens y latencia de la grabación.
    await page.getByRole("tab", { name: "Traza" }).click();
    await expect(page.getByRole("tab", { name: "Traza" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const traza = panelTraza(page);
    await expect(traza).toBeVisible();
    await expect(traza).toContainText(R.metadata.estado);
    await expect(traza).toContainText(latencia(R.metadata.latencia_ms));
    await expect(traza).not.toContainText("interacciones");
    await expect(traza.getByRole("table")).toBeHidden();
    const agentes = traza.getByRole("list").first().getByRole("listitem");
    await expect(agentes).toHaveText(
      R.metadata.agentes_invocados.map(
        (a, i) => new RegExp(`${i + 1}\\s*${a}`),
      ),
    );
    for (const herramienta of R.evaluacion.tools_called) {
      await expect(traza).toContainText(herramienta.name);
    }

    // Vista técnica: aparecen los parámetros de cada herramienta y el consumo por agente.
    await activarVistaTecnica(page);
    await expect(traza).toContainText(
      `${R.metadata.num_interacciones} interacciones`,
    );
    for (const herramienta of R.evaluacion.tools_called) {
      for (const [clave, valor] of Object.entries(
        herramienta.input_parameters,
      )) {
        await expect(traza).toContainText(`${clave}:`);
        await expect(traza).toContainText(String(valor));
      }
    }
    const tabla = traza.getByRole("table");
    for (const fila of R.metadata.tokens_por_agente) {
      const tr = tabla.getByRole("row").filter({ hasText: fila.modelo });
      await expect(tr).toContainText(fila.agente);
      await expect(tr.getByRole("cell")).toHaveText([
        new RegExp(fila.agente),
        entero(fila.input),
        entero(fila.output),
        entero(fila.total),
      ]);
    }
    await expect(
      tabla.getByRole("row").filter({ hasText: "Total" }).getByRole("cell"),
    ).toHaveText([
      /Total/,
      entero(R.metadata.tokens.input),
      entero(R.metadata.tokens.output),
      entero(R.metadata.tokens.total),
    ]);
  });

  test("el botón Enviar consulta también envía y «Ver traza del sistema» abre la traza", async ({
    page,
    guardia,
  }, testInfo) => {
    const chat = await guardia.simular(page, "**/api/chat", { json: R });
    await abrirConsola(page);

    await campo(page).fill(PREGUNTA);
    await expect(botonEnviar(page)).toBeEnabled();
    await botonEnviar(page).click();
    await expect(respuestas(page)).toHaveCount(1);
    expect(chat.cuerpos()).toEqual([{ pregunta: PREGUNTA }]);

    await respuestas(page)
      .getByRole("button", { name: "Ver traza del sistema" })
      .click();
    await expect(panelInspeccion(page)).toBeVisible();
    await expect(page.getByRole("tab", { name: "Traza" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(panelTraza(page)).toContainText(
      R.evaluacion.tools_called[0]!.name,
    );

    // Shift+Enter inserta salto de línea y no envía.
    await verConversacion(page, testInfo);
    await campo(page).fill("línea 1");
    await campo(page).press("Shift+Enter");
    await expect(campo(page)).toHaveValue("línea 1\n");
    expect(chat.peticiones).toHaveLength(1);
  });

  test("una pregunta sugerida se envía al hacer clic", async ({
    page,
    guardia,
  }) => {
    const chat = await guardia.simular(page, "**/api/chat", { json: R });
    await abrirConsola(page);

    const sugerida = SUGERENCIAS.F2[0];
    await page.getByRole("button", { name: sugerida }).click();
    await expect(respuestas(page)).toHaveCount(1);
    expect(chat.cuerpos()).toEqual([{ pregunta: sugerida }]);
    await expect(page.getByText(sugerida, { exact: true })).toBeVisible(); // burbuja del usuario
    await expect(
      page.getByRole("heading", { name: "¿Qué necesita verificar?" }),
    ).toHaveCount(0);
  });
});

test.describe("Chat · rechazo y errores", () => {
  test("rechazo de inyección: mensaje cortés, sin citas ni fuentes", async ({
    page,
    guardia,
  }, testInfo) => {
    const chat = await guardia.simular(page, "**/api/chat", { json: RECHAZO });
    await abrirConsola(page);

    await campo(page).fill(RECHAZO.evaluacion.input);
    await campo(page).press("Enter");

    const respuesta = respuestas(page);
    await expect(respuesta).toContainText(RECHAZO.respuesta);
    expect(chat.cuerpos()).toEqual([{ pregunta: RECHAZO.evaluacion.input }]);
    await expect(
      respuesta.getByRole("button", { name: /Ver evidencia de la cita/ }),
    ).toHaveCount(0);
    await expect(
      respuesta.getByRole("heading", { name: /Fuentes/ }),
    ).toHaveCount(0);
    await expect(respuesta.locator("header")).not.toContainText("tokens");
    await expect(alerta(page)).toHaveCount(0);

    await verInspeccion(page, testInfo);
    await page.getByRole("tab", { name: "Evidencia" }).click();
    await expect(panelEvidencia(page)).toContainText(
      "Esta respuesta no se apoyó en fragmentos del corpus",
    );
    await page.getByRole("tab", { name: "Traza" }).click();
    await expect(panelTraza(page)).toContainText("filtro_seguridad");
    await expect(panelTraza(page)).toContainText("patrón de inyección");
    // El parámetro con el que se rechazó es un detalle del sistema.
    await expect(panelTraza(page)).not.toContainText("accion:");
    await activarVistaTecnica(page);
    await expect(panelTraza(page)).toContainText("accion:");
    await expect(panelTraza(page)).toContainText("rechazo");
  });

  for (const caso of [
    {
      nombre: "502 del proxy",
      status: 502,
      json: {
        error: "El agente respondió con estado 500.",
        detalle: "Internal Server Error",
      },
      mensaje: "El agente respondió con estado 500.",
      detalle: "Internal Server Error",
    },
    {
      nombre: "504 por tiempo límite",
      status: 504,
      json: { error: "El agente no respondió en 90 segundos." },
      mensaje: "El agente no respondió en 90 segundos.",
      detalle: null,
    },
    {
      nombre: "502 con cuerpo HTML de un proxy intermedio",
      status: 502,
      body: "<html><body><h1>502 Bad Gateway</h1></body></html>",
      contentType: "text/html",
      mensaje: "La respuesta del servidor no es JSON válido.",
      detalle: null,
    },
  ]) {
    test(`error del agente (${caso.nombre}): mensaje claro y la interfaz sigue operativa`, async ({
      page,
      guardia,
      consola,
    }) => {
      consola.permitir(/status of 50[24]/);
      const chat = await guardia.simular(page, "**/api/chat", [
        {
          status: caso.status,
          ...(caso.json ? { json: caso.json } : {}),
          ...(caso.body
            ? { body: caso.body, contentType: caso.contentType }
            : {}),
        },
        { json: R },
      ]);
      await abrirConsola(page);

      await campo(page).fill(PREGUNTA);
      await campo(page).press("Enter");

      await expect(alerta(page)).toBeVisible();
      await expect(alerta(page)).toContainText(caso.mensaje);
      await expect(alerta(page)).toContainText(
        "Puede reformular la consulta o enviarla de nuevo",
      );
      if (caso.detalle) {
        await expect(alerta(page)).toContainText(caso.detalle);
      }
      await expect(
        page.getByRole("status").filter({ hasText: "Consultando" }),
      ).toHaveCount(0);

      // La interfaz no se rompe: se puede volver a preguntar y la conversación se conserva.
      await expect(campo(page)).toBeEnabled();
      await campo(page).fill(PREGUNTA);
      await botonEnviar(page).click();
      await expect(respuestas(page)).toHaveCount(1);
      await expect(alerta(page)).toBeVisible();
      expect(chat.peticiones).toHaveLength(2);
    });
  }
});

test.describe("Chat · validación del redactor", () => {
  test("una consulta vacía o solo con espacios no se envía", async ({
    page,
    guardia,
  }) => {
    const chat = await guardia.simular(page, "**/api/chat", { json: R });
    await abrirConsola(page);

    await expect(botonEnviar(page)).toBeDisabled();
    await campo(page).press("Enter");
    await campo(page).fill("    \n  ");
    await expect(botonEnviar(page)).toBeDisabled();
    await campo(page).press("Enter");
    // Se intenta enviar el formulario de todos modos (p. ej. con requestSubmit).
    await campo(page).evaluate((el) =>
      (el as HTMLTextAreaElement).form?.requestSubmit(),
    );

    await page.waitForTimeout(500);
    expect(chat.peticiones).toHaveLength(0);
    await expect(respuestas(page)).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "¿Qué necesita verificar?" }),
    ).toBeVisible();
  });

  test("límite de 4000 caracteres: el campo trunca y el contador lo refleja", async ({
    page,
    guardia,
  }) => {
    const chat = await guardia.simular(page, "**/api/chat", { json: R });
    await abrirConsola(page);

    const largo = "a".repeat(3990) + "0123456789ABCDEF"; // 4006 caracteres
    await campo(page).fill(largo);
    const valor = await campo(page).inputValue();
    expect(valor.length).toBe(4000);
    await expect(page.getByText("4000 / 4000", { exact: true })).toBeVisible();

    await campo(page).press("Enter");
    await expect(respuestas(page)).toHaveCount(1);
    const [cuerpo] = chat.cuerpos() as { pregunta: string }[];
    expect(cuerpo?.pregunta.length).toBe(4000);
  });
});

test.describe("Chat · móvil", () => {
  test("el selector Conversación / Evidencia y traza alterna las vistas", async ({
    page,
    guardia,
  }, testInfo) => {
    test.skip(!esMovil(testInfo), "Solo aplica al proyecto móvil (< 1024 px).");
    await guardia.simular(page, "**/api/chat", { json: R });
    await abrirConsola(page);

    const vista = page.getByRole("group", { name: "Vista" });
    const conversacion = vista.getByRole("button", { name: "Conversación" });
    const inspeccion = vista.getByRole("button", { name: "Evidencia y traza" });
    await expect(conversacion).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(campo(page)).toBeInViewport();
    await expect(panelInspeccion(page)).toBeHidden();

    await inspeccion.click();
    await expect(inspeccion).toHaveAttribute("aria-pressed", "true");
    await expect(panelInspeccion(page)).toBeVisible();
    await expect(page.getByRole("main")).toBeHidden();
    await expect(panelEvidencia(page)).toContainText("Envíe una consulta");

    await conversacion.click();
    await expect(page.getByRole("main")).toBeVisible();
    await campo(page).fill(PREGUNTA);
    await campo(page).press("Enter");
    await expect(respuestas(page)).toBeVisible();
    await expect(respuestas(page)).toBeInViewport({ ratio: 0.1 });

    // Pulsar una cita lleva a Evidencia.
    await respuestas(page)
      .getByRole("button", { name: "Ver evidencia de la cita 1" })
      .first()
      .click();
    await expect(inspeccion).toHaveAttribute("aria-pressed", "true");
    await expect(panelEvidencia(page).locator("blockquote")).toBeVisible();
    await expect(panelEvidencia(page).locator("blockquote")).toBeInViewport({
      ratio: 0.1,
    });

    await conversacion.click();
    await expect(respuestas(page)).toBeVisible();
  });

  test("sin desborde horizontal en la vista inicial, con respuesta y en la evidencia", async ({
    page,
    guardia,
  }, testInfo) => {
    await guardia.simular(page, "**/api/chat", { json: R });
    await abrirConsola(page);
    await esperarSinDesbordeHorizontal(page);

    await campo(page).fill(PREGUNTA);
    await campo(page).press("Enter");
    await expect(respuestas(page)).toBeVisible();
    await esperarSinDesbordeHorizontal(page);

    await respuestas(page)
      .getByRole("button", { name: "Ver evidencia de la cita 1" })
      .first()
      .click();
    await expect(panelEvidencia(page).locator("blockquote")).toBeVisible();
    await esperarSinDesbordeHorizontal(page);
    await page.getByRole("tab", { name: "Traza" }).click();
    await expect(panelTraza(page)).toBeVisible();
    await esperarSinDesbordeHorizontal(page);
    if (esMovil(testInfo)) {
      await verConversacion(page, testInfo);
      await esperarSinDesbordeHorizontal(page);
    }
  });
});

test.describe("Chat · accesibilidad", () => {
  test("sin violaciones serias o críticas en la vista inicial", async ({
    page,
  }, testInfo) => {
    await abrirConsola(page);
    await expect(
      page.getByRole("status").filter({ hasText: /Agente/ }),
    ).toHaveText("Agente en línea");
    await auditarAccesibilidad(page, testInfo, "chat-inicial");
  });

  test("sin violaciones serias o críticas con respuesta, evidencia y traza", async ({
    page,
    guardia,
  }, testInfo) => {
    await guardia.simular(page, "**/api/chat", { json: R });
    await abrirConsola(page);
    await campo(page).fill(PREGUNTA);
    await campo(page).press("Enter");
    await expect(respuestas(page)).toBeVisible();
    await respuestas(page)
      .getByRole("button", { name: "Ver evidencia de la cita 1" })
      .first()
      .click();
    await expect(panelEvidencia(page).locator("blockquote")).toBeVisible();
    if (esMovil(testInfo)) {
      await auditarAccesibilidad(page, testInfo, "chat-evidencia");
      await verConversacion(page, testInfo);
    }
    await auditarAccesibilidad(page, testInfo, "chat-respuesta");
    await verInspeccion(page, testInfo);
    await page.getByRole("tab", { name: "Traza" }).click();
    await auditarAccesibilidad(page, testInfo, "chat-traza");
  });
});
