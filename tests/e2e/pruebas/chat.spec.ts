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
/** La consola desplegada para el jurado no enseña los detalles internos del sistema. */
async function sinVistaTecnica(page: Page): Promise<void> {
  await expect(page.getByRole("button", { name: "Vista técnica" })).toHaveCount(0);
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

    // Estado inicial: una pregunta y una línea que nombra los tres fenómenos. La rejilla de
    // consultas preparadas se retiró a propósito (components/chat/panel-sugerencias.tsx):
    // llenaba la pantalla de texto antes de que nadie hubiera preguntado nada.
    await expect(
      page.getByRole("heading", { name: "¿Qué necesita verificar?" }),
    ).toBeVisible();
    for (const fenomeno of FENOMENOS) {
      await expect(
        page.getByRole("heading", { level: 3, name: new RegExp(fenomeno.clave) }),
      ).toHaveCount(0);
    }
    await expect(page.getByRole("main")).toContainText("IA estratégica");
    await expect(page.getByRole("main")).toContainText("entorno espacial");
    await expect(page.getByRole("main")).toContainText("dinámicas territoriales");

    // Redactor: campo, contador y botón deshabilitado mientras está vacío.
    await expect(campo(page)).toBeVisible();
    await expect(campo(page)).toBeEditable();
    await expect(campo(page)).toHaveAttribute("maxlength", "4000");
    await expect(page.getByText("0 / 4000", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Enter envía · Shift + Enter salto de línea"),
    ).toBeVisible();
    await expect(botonEnviar(page)).toBeDisabled();

    // Enlace al tablero (DASHBOARD_URL del contenedor). Va en la misma pestaña: es la
    // otra mitad del sistema, no un destino externo, y desde el tablero se vuelve igual.
    const enlace = page.getByRole("banner").getByRole("link", {
      name: /Tablero de analítica/,
    });
    await expect(enlace).toBeVisible();
    await expect(enlace).toHaveAttribute("href", TABLERO_URL);
    await expect(enlace).not.toHaveAttribute("target", "_blank");
  });

  test("se va y se vuelve entre la consola y el tablero sin abrir pestañas", async ({
    page,
  }) => {
    await page.goto(CHAT_URL);

    await page
      .getByRole("banner")
      .getByRole("link", { name: /Tablero de analítica/ })
      .click();
    await expect(page).toHaveURL(new RegExp(`^${TABLERO_URL}/?`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /AeroCode.*Analítica visual/,
    );

    // El tablero sabe volver: lo fija CONSOLA_URL en su contenedor.
    await page
      .getByRole("banner")
      .getByRole("link", { name: "Consola de chat" })
      .click();
    await expect(page).toHaveURL(new RegExp(`^${CHAT_URL}/?`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /AeroCode.*Consola de inteligencia/,
    );
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
    // La burbuja del usuario antepone «Consulta:» solo para lectores de pantalla.
    await expect(page.getByText(`Consulta: ${PREGUNTA}`, { exact: true })).toBeVisible();
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
    // Consumo de tokens y ruta interna: solo con VISTA_TECNICA en el contenedor.
    await sinVistaTecnica(page);
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
    await expect(activa).toContainText(
      `fragmento ${String(cita1.chunk_id)} de ${cita1.doc_id}`,
    );
    const enlace = activa.getByRole("link", { name: /ver el documento/ });
    await expect(enlace).toHaveAttribute(
      "href",
      `${TABLERO_URL}/?componente=panel_evidencia&doc_id=${cita1.doc_id}`,
    );
    await expect(enlace).toHaveAttribute("target", "_blank");
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
    await expect(activa).toContainText(
      `fragmento ${String(cita3.chunk_id)} de ${cita3.doc_id}`,
    );
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
    await expect(traza.getByRole("table")).toHaveCount(0);
    const agentes = traza.getByRole("list").first().getByRole("listitem");
    await expect(agentes).toHaveText(
      R.metadata.agentes_invocados.map(
        (a, i) => new RegExp(`${i + 1}\\s*${a}`),
      ),
    );
    for (const herramienta of R.evaluacion.tools_called) {
      await expect(traza).toContainText(herramienta.name);
    }
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

  test("el encabezado inicial se retira con la primera consulta", async ({
    page,
    guardia,
  }) => {
    const chat = await guardia.simular(page, "**/api/chat", { json: R });
    await abrirConsola(page);

    await expect(
      page.getByRole("heading", { name: "¿Qué necesita verificar?" }),
    ).toBeVisible();
    await campo(page).fill(PREGUNTA);
    await botonEnviar(page).click();
    await expect(respuestas(page)).toHaveCount(1);
    expect(chat.cuerpos()).toEqual([{ pregunta: PREGUNTA }]);
    await expect(page.getByText(`Consulta: ${PREGUNTA}`, { exact: true })).toBeVisible();
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
