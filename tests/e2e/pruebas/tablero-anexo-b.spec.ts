import type { Page, TestInfo } from "@playwright/test";

import {
  GRABACIONES,
  type Guardia,
  auditarAccesibilidad,
  esperarSinDesbordeHorizontal,
  expect,
  test,
} from "../soporte/fixtures";
import { TABLERO_URL } from "../soporte/urls";

/**
 * Lo que el tablero añadió del Anexo B en la recta final: expansión progresiva de la red
 * (B.3.3), tres disposiciones del grafo (B.3.2), el histograma de distribución (B.2.1), la
 * capa de fronteras (B.4.2), la URL como estado compartible y la justificación del agente a
 * la vista (§3.3.2), y el recorrido de vistas como narrativa guiada (B.6.1).
 *
 * `/api/visualizar` se simula siempre con la grabación real; `/api/componente` va en vivo.
 */

const V = GRABACIONES.visualizarRespuesta;
const INSTRUCCION = "Departamentos con más alertas por minería ilegal";

const agente = (page: Page) => page.getByRole("region", { name: "Agente" });
const lienzo = (page: Page) => page.locator("section[aria-labelledby='titulo-componente']");
const panel = (page: Page) => page.getByRole("complementary", { name: "Panel de evidencia" });
const campoInstruccion = (page: Page) =>
  page.getByRole("textbox", { name: "Instrucción en lenguaje natural" });
const botonVisualizar = (page: Page) => page.getByRole("button", { name: /Visualizar|Analizando/ });
const botonNivel = (page: Page, nombre: "Departamentos" | "Municipios") =>
  page.getByRole("group", { name: "Nivel del mapa" }).getByRole("button", { name: nombre });
const nodosRed = (page: Page) =>
  page.getByRole("group", { name: /Red de \d+ entidades/ }).getByRole("button");

function esMovil(testInfo: TestInfo): boolean {
  return testInfo.project.name === "movil";
}

async function abrirEn(page: Page, parametros: Record<string, string | number>): Promise<void> {
  const consulta = new URLSearchParams(
    Object.entries(parametros).map(([clave, valor]) => [clave, String(valor)]),
  );
  const componente = page.waitForResponse(
    (r) => r.url().includes("/api/componente") && r.request().method() === "POST",
  );
  await page.goto(`${TABLERO_URL}/?${consulta.toString()}`);
  await componente;
  await abrirAgente(page);
}

/** En móvil la ventana abierta tapa el panel de evidencia: se cierra cuando no hace falta. */
async function cerrarAgente(page: Page): Promise<void> {
  const boton = page.getByRole("button", { name: "Cerrar el agente" });
  if ((await boton.count()) > 0) {
    await boton.click();
  }
}

/** La burbuja del agente nace cerrada en móvil: se abre si hace falta. */
async function abrirAgente(page: Page): Promise<void> {
  const boton = page.getByRole("button", { name: "Abrir el agente" });
  if ((await boton.count()) > 0) {
    await boton.click();
  }
  await expect(campoInstruccion(page)).toBeVisible();
}

/** Envía una instrucción con el agente simulado y espera a que la vista cambie. */
async function preguntarAlAgente(page: Page, guardia: Guardia): Promise<void> {
  await guardia.simular(page, "**/api/visualizar", { json: V });
  await campoInstruccion(page).fill(INSTRUCCION);
  await botonVisualizar(page).click();
  await expect(page.getByRole("heading", { level: 2, name: V.resultado.titulo })).toBeVisible();
}

test.describe("Tablero · Anexo B en la recta final", () => {
  test("la URL refleja la vista que eligió el agente y se puede copiar", async ({
    page,
    guardia,
  }) => {
    await abrirEn(page, { componente: "linea_tiempo" });
    await expect(page).toHaveURL(/componente=linea_tiempo/);

    await preguntarAlAgente(page, guardia);

    // La vista llegó ya calculada por el agente, sin pasar por /api/componente: la barra de
    // direcciones tiene que cambiar igual, o el enlace mentiría.
    await expect(page).toHaveURL(new RegExp(`componente=${V.especificacion.componente}`));
    await expect(page).toHaveURL(/fenomeno=3/);
    await expect(page).toHaveURL(/economia=/);

    // El portapapeles del navegador sin cabeza no siempre concede permiso: se captura lo
    // que la interfaz intenta escribir, que es lo que se quiere comprobar.
    await page.evaluate(() => {
      (window as unknown as { __copiado?: string }).__copiado = undefined;
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: (texto: string) => {
            (window as unknown as { __copiado?: string }).__copiado = texto;
            return Promise.resolve();
          },
        },
      });
    });
    const copiar = page
      .getByRole("banner")
      .getByTitle("Copiar el enlace a esta vista, con sus filtros");
    await expect(copiar).toBeAttached();
    await copiar.click();
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { __copiado?: string }).__copiado ?? ""),
      )
      .toContain(`componente=${V.especificacion.componente}`);
    const portapapeles = await page.evaluate(
      () => (window as unknown as { __copiado?: string }).__copiado ?? "",
    );
    expect(portapapeles).toContain("economia=");

    // Recargar el enlace devuelve la misma vista, no el mapa por defecto.
    await page.goto(portapapeles);
    await expect(lienzo(page)).toContainText("Economía ilícita:");
    await expect(page).toHaveURL(new RegExp(`componente=${V.especificacion.componente}`));
  });

  test("la justificación del agente se lee en el lienzo y desaparece al cambiar a mano", async ({
    page,
    guardia,
  }) => {
    await abrirEn(page, { componente: "linea_tiempo" });
    await expect(lienzo(page)).not.toContainText("Por qué esta vista");

    await preguntarAlAgente(page, guardia);
    await expect(lienzo(page)).toContainText("Por qué esta vista");
    await expect(lienzo(page)).toContainText(V.especificacion.justificacion);

    // Cambiar de componente a mano ya no es decisión del agente: la nota se retira.
    await lienzo(page).getByTitle("Cambiar de componente").click();
    await page
      .getByRole("menu", { name: "Componentes del catálogo" })
      .getByRole("menuitemradio", { name: /Composición del corpus/ })
      .click();
    await expect(lienzo(page)).not.toContainText("Por qué esta vista");
  });

  test("la red se expande alrededor de un nodo (B.3.3) y cambia de disposición (B.3.2)", async ({
    page,
  }) => {
    await abrirEn(page, { componente: "red_entidades" });
    await cerrarAgente(page);
    const nodos = nodosRed(page);
    await expect(nodos.first()).toBeVisible();
    const etiqueta = (await nodos.first().getAttribute("aria-label")) ?? "";
    const nombre = etiqueta.split(",")[0]!.trim();

    // Un clic: evidencia del nodo y el salto ofrecido en el panel.
    await nodos.first().click();
    const expandir = panel(page).getByRole("button", { name: /Expandir la red alrededor de/ });
    await expect(expandir).toBeVisible();
    await expect(expandir).toContainText(nombre.slice(0, 20));

    const peticion = page.waitForResponse(
      (r) => r.url().includes("/api/componente") && r.request().method() === "POST",
    );
    await expandir.click();
    const cuerpo = (await peticion).request().postDataJSON() as {
      componente: string;
      filtros: Record<string, unknown>;
    };
    expect(cuerpo.componente).toBe("red_entidades");
    expect(String(cuerpo.filtros["entidad"]).toLowerCase()).toBe(nombre.toLowerCase());
    // La expansión es una petición nueva y queda en la URL: se puede volver o compartir.
    await expect(page).toHaveURL(/entidad=/);
    await expect(lienzo(page)).toContainText(`Entidad central: ${nombre}`);
    await expect(nodos.first()).toBeVisible();

    // Las tres disposiciones del Anexo B.3.2, con la radial declarando su referencia.
    const disposicion = page.getByRole("group", { name: "Disposición de la red" });
    await disposicion.getByRole("button", { name: "Radial" }).click();
    await expect(disposicion.getByRole("button", { name: "Radial" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      page.getByRole("status").filter({ hasText: "Anillos alrededor de" }),
    ).toBeVisible();
    await disposicion.getByRole("button", { name: "Niveles" }).click();
    await expect(disposicion.getByRole("button", { name: "Niveles" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(nodos.first()).toBeVisible();
    await esperarSinDesbordeHorizontal(page);
  });

  test("el histograma de distribución (B.2.1) suma sus barras y abre evidencia", async ({
    page,
  }) => {
    const componente = page.waitForResponse(
      (r) => r.url().includes("/api/componente") && r.request().method() === "POST",
    );
    await page.goto(`${TABLERO_URL}/?componente=distribucion&variable=alertas_por_municipio`);
    const resultado = (await (await componente).json()) as {
      titulo: string;
      datos: {
        total: number;
        barras: { cuenta: number; refs?: unknown[] }[];
        resumen: { mediana: number };
      };
    };
    expect(resultado.titulo).toBe("Distribución de alertas por municipio");
    expect(resultado.datos.total).toBe(
      resultado.datos.barras.reduce((suma, barra) => suma + barra.cuenta, 0),
    );

    await expect(page.getByRole("heading", { level: 2, name: resultado.titulo })).toBeVisible();
    // Las seis cifras de resumen se leen sin interpretar el gráfico.
    for (const etiqueta of ["Sujetos", "Mínimo", "Mediana", "Media", "P90", "Máximo"]) {
      await expect(lienzo(page).getByText(etiqueta, { exact: true })).toBeVisible();
    }
    await expect(lienzo(page)).toContainText(String(resultado.datos.resumen.mediana));
    await expect(lienzo(page)).toContainText("Variable: Alertas por municipio");

    // Y está en el selector, para quien no sabe qué pedirle al agente.
    await lienzo(page).getByTitle("Cambiar de componente").click();
    await expect(
      page.getByRole("menu", { name: "Componentes del catálogo" }).getByRole("menuitemradio", {
        name: /Distribución/,
      }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await esperarSinDesbordeHorizontal(page);
  });

  test("al bajar a municipios el mapa ofrece la capa de fronteras departamentales (B.4.2)", async ({
    page,
  }, testInfo) => {
    // El nivel lo decide el zoom de la cámara: en una pantalla estrecha el encuadre de
    // Colombia queda por debajo del umbral municipal y el mapa vuelve a departamentos.
    test.skip(esMovil(testInfo), "El nivel municipal exige el zoom de una pantalla de escritorio.");
    // El nivel lo manda la cámara, no la URL: se llega a municipios acercando el zoom, que
    // es lo que hace una persona (Anexo B.4.2, «agregación según el nivel de acercamiento»).
    await abrirEn(page, { componente: "mapa_colombia" });
    await cerrarAgente(page);
    await expect(botonNivel(page, "Departamentos")).toHaveAttribute("aria-pressed", "true");
    // Rueda del ratón sobre el lienzo, como una persona: los mandos del mapa se vuelven a
    // montar al cambiar de nivel y un clic sobre ellos se queda sin elemento.
    const mapa = page.locator("canvas.maplibregl-canvas").first();
    const caja = (await mapa.boundingBox())!;
    await expect(async () => {
      await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
      await page.mouse.wheel(0, -400);
      // El botón refleja lo que hizo la rueda: botón y zoom son la misma verdad.
      await expect(botonNivel(page, "Municipios")).toHaveAttribute("aria-pressed", "true", {
        timeout: 2_000,
      });
    }).toPass({ timeout: 30_000 });
    // Al cruzar el umbral el mapa baja la geometría municipal y vuelve a montar sus mandos:
    // se espera a que la red se calme antes de abrir el menú, o el menú se cierra solo.
    await page.waitForLoadState("networkidle");
    const fronteras = page.getByRole("menuitemcheckbox", { name: /Fronteras departamentales/ });
    await expect(async () => {
      if ((await fronteras.count()) === 0) {
        await page.getByTitle("Fondo del mapa y capas").click();
      }
      await expect(fronteras).toBeVisible({ timeout: 2_000 });
      await expect(fronteras).toHaveAttribute("aria-checked", "true", { timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    await fronteras.click();
    await expect(fronteras).toHaveAttribute("aria-checked", "false");
    await page.keyboard.press("Escape");

    // En el nivel departamental no hay nivel superior que dibujar: el interruptor no se ofrece.
    await abrirEn(page, { componente: "mapa_colombia" });
    await cerrarAgente(page);
    await expect(botonNivel(page, "Departamentos")).toHaveAttribute("aria-pressed", "true");
    await page.getByTitle("Fondo del mapa y capas").click();
    await expect(
      page.getByRole("menuitemcheckbox", { name: /Fronteras departamentales/ }),
    ).toHaveCount(0);
  });

  test("el botón «Municipios» baja al detalle municipal sin tocar la rueda (B.4.2)", async ({
    page,
  }, testInfo) => {
    test.skip(esMovil(testInfo), "El nivel municipal exige el zoom de una pantalla de escritorio.");
    await abrirEn(page, { componente: "mapa_colombia" });
    await cerrarAgente(page);
    const municipios = botonNivel(page, "Municipios");
    await expect(municipios).toHaveAttribute("aria-pressed", "false");
    // La respuesta municipal se pide a la API al pulsar: el control cambia el nivel de verdad.
    const respuesta = page.waitForResponse((r) => {
      if (!r.url().includes("/api/componente")) return false;
      const cuerpo = r.request().postDataJSON() as { filtros?: { nivel?: string } } | null;
      return cuerpo?.filtros?.nivel === "municipio";
    });
    await municipios.click();
    expect((await respuesta).ok()).toBe(true);
    await expect(municipios).toHaveAttribute("aria-pressed", "true");
    await expect(lienzo(page)).toContainText(/municipios?/i);
    // Con el botón el cambio de nivel ocurre de golpe: los mandos del mapa se remontan y el
    // menú «Capas» tiene que sobrevivir igual que cuando se llega con la rueda.
    await page.waitForLoadState("networkidle");
    const fronteras = page.getByRole("menuitemcheckbox", { name: /Fronteras departamentales/ });
    await expect(async () => {
      if ((await fronteras.count()) === 0) {
        await page.getByTitle("Fondo del mapa y capas").click();
      }
      await expect(fronteras).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    await page.keyboard.press("Escape");
    // El dibujo es municipal de verdad: 1.122 polígonos del MGN, no solo el rótulo.
    const dibujo = page.locator("[data-clave-geo]");
    await expect(dibujo).toHaveAttribute("data-clave-geo", "divipola_mpio");
    await expect(dibujo).toHaveAttribute("data-rasgos", "1122");
    // Y de vuelta: «Departamentos» aleja la cámara, el nivel lo sigue y el dibujo también.
    // Un conmutador se prueba en los dos sentidos: aquí el rótulo volvía y el mapa seguía
    // trazando la malla municipal con colores departamentales.
    await botonNivel(page, "Departamentos").click();
    await expect(botonNivel(page, "Departamentos")).toHaveAttribute("aria-pressed", "true");
    await expect(municipios).toHaveAttribute("aria-pressed", "false");
    await expect(dibujo).toHaveAttribute("data-clave-geo", "divipola_dpto");
    await expect(dibujo).toHaveAttribute("data-rasgos", "33");
    await expect(lienzo(page)).toContainText("Alertas tempranas por departamento");
  });

  test("abrir un documento desde la evidencia ofrece volver a la consulta con sus filtros", async ({
    page,
  }) => {
    // Una consulta con filtros propios: nivel municipal y una economía ilícita.
    await abrirEn(page, { componente: "mapa_colombia", nivel: "municipio", economia: "minería" });
    await cerrarAgente(page);
    const titulo = page.getByRole("heading", { level: 2, name: /Alertas tempranas por municipio/ });
    await expect(titulo).toBeVisible();
    // El título de un fragmento del panel lleva al documento entero…
    const documento = panel(page).getByRole("listitem").first().getByRole("button").first();
    await expect(documento).toHaveAttribute("title", /^Ver todos los fragmentos de /);
    const recalculo = page.waitForResponse((r) => {
      if (!r.url().includes("/api/componente")) return false;
      const cuerpo = r.request().postDataJSON() as { componente?: string } | null;
      return cuerpo?.componente === "panel_evidencia";
    });
    await documento.click();
    expect((await recalculo).ok()).toBe(true);
    await expect(titulo).toHaveCount(0);
    // …y el desvío tiene vuelta explícita, con el nombre de la vista que se dejó.
    const volver = lienzo(page).getByRole("button", {
      name: /^Volver a Alertas tempranas por municipio/,
    });
    await expect(volver).toBeVisible();
    const vuelta = page.waitForResponse((r) => {
      if (!r.url().includes("/api/componente")) return false;
      const cuerpo = r.request().postDataJSON() as {
        componente?: string;
        filtros?: { nivel?: string; economia?: string };
      } | null;
      return cuerpo?.componente === "mapa_colombia" && cuerpo.filtros?.nivel === "municipio";
    });
    await volver.click();
    const cuerpo = (await vuelta).request().postDataJSON() as { filtros: { economia?: string } };
    expect(cuerpo.filtros.economia).toBe("minería");
    await expect(titulo).toBeVisible();
    await expect(volver).toHaveCount(0);
    await expect.poll(() => new URL(page.url()).searchParams.get("nivel")).toBe("municipio");
  });

  test("la vista inicial se rotula como punto de partida y deja de serlo al elegir a mano", async ({
    page,
  }) => {
    await page.goto(TABLERO_URL);
    await expect(lienzo(page)).toContainText("Vista inicial");
    await expect(panel(page)).toContainText("Elija una región del mapa para ver sus fuentes");
    await cerrarAgente(page);
    // Cambiar de componente a mano es una decisión: el rótulo de partida se retira.
    await page.getByTitle("Cambiar de componente").click();
    await page.getByRole("menuitemradio", { name: /Distribución/ }).click();
    await expect(page.getByRole("heading", { level: 2, name: /Distribución de/ })).toBeVisible();
    await expect(lienzo(page)).not.toContainText("Vista inicial");
  });

  test("recargar devuelve el tablero a la vista de partida aunque la URL lleve una consulta", async ({
    page,
  }) => {
    // La dirección se reescribe con cada vista, así que al recargar seguía ahí la última
    // consulta y el tablero abría con ella. Abrir un enlace es elegir una vista; recargarlo
    // es empezar de cero, que es lo que espera quien recarga en mitad de una demostración.
    await abrirEn(page, { componente: "linea_tiempo", fenomeno: 1 });
    await expect(lienzo(page)).not.toContainText("Vista inicial");
    await page.reload();
    await cerrarAgente(page);
    await expect(lienzo(page)).toContainText("Vista inicial");
    await expect(panel(page)).toContainText("Elija una región del mapa para ver sus fuentes");
    await expect
      .poll(() => new URL(page.url()).searchParams.get("componente"))
      .toBe("mapa_colombia");
  });

  test("«Reiniciar» devuelve al punto de partida sin recargar y vacía el hilo", async ({
    page,
    guardia,
  }) => {
    // Recargar también sirve, pero en mitad de una demostración cuesta un parpadeo: el
    // botón tiene que dejar el tablero igual de limpio y además borrar lo preguntado.
    await abrirEn(page, { componente: "mapa_colombia", nivel: "municipio" });
    await guardia.simular(page, "**/api/visualizar", { json: V });
    await campoInstruccion(page).fill(INSTRUCCION);
    await botonVisualizar(page).click();
    await expect(page.getByRole("heading", { level: 2, name: V.resultado.titulo })).toBeVisible();

    await page.getByRole("button", { name: "Reiniciar" }).click();
    await cerrarAgente(page);
    await expect(lienzo(page)).toContainText("Vista inicial");
    await expect(panel(page)).toContainText("Elija una región del mapa para ver sus fuentes");
    // La dirección también vuelve: el nivel municipal con el que se abrió deja de estar.
    await expect.poll(() => new URL(page.url()).searchParams.get("nivel")).toBe("departamento");
    await abrirAgente(page);
    await expect(agente(page)).not.toContainText(INSTRUCCION);
  });

  test("las referencias [n] de la respuesta abren su fragmento, también en la presentación", async ({
    page,
    guardia,
  }) => {
    // La grabación real no trae citas; se le añade una que apunta a un fragmento real del
    // propio resultado, para que el panel tenga algo verdadero que enseñar.
    const ref = V.resultado.evidencia[0]!;
    const conCita = {
      ...V,
      respuesta_agente: `Las alertas por minería ilegal se concentran en Antioquia y Chocó [1].`,
      citas: [{ n: 1, doc_id: ref.doc_id, chunk_id: ref.chunk_id }],
    };
    await abrirEn(page, { componente: "linea_tiempo" });
    await guardia.simular(page, "**/api/visualizar", { json: conCita });
    await campoInstruccion(page).fill(INSTRUCCION);
    await botonVisualizar(page).click();
    await expect(page.getByRole("heading", { level: 2, name: V.resultado.titulo })).toBeVisible();

    // En la conversación, [1] es un botón que abre ese fragmento en el panel de evidencia.
    const referencia = agente(page).getByRole("button", { name: /^Referencia 1:/ });
    await expect(referencia).toBeVisible();
    const evidencia = page.waitForResponse(
      (r) =>
        r.url().includes("/api/evidencia") &&
        new URL(r.url()).searchParams.get("chunk_ids") === String(ref.chunk_id),
    );
    await referencia.click();
    await evidencia;
    await expect(panel(page)).toContainText(`Referencia [1] · ${ref.doc_id}`);
    await expect(panel(page)).toContainText(`fragmento ${String(ref.chunk_id)} de ${ref.doc_id}`);

    // En la presentación, la misma referencia se lee sin salir del recorrido.
    await agente(page)
      .getByRole("button", { name: /Presentar el recorrido/ })
      .click();
    const recorrido = page.getByRole("dialog", { name: "Presentación del recorrido analítico" });
    await recorrido.getByRole("button", { name: /^Referencia 1:/ }).click();
    await expect(recorrido).toContainText("Referencia [1]");
    await expect(recorrido).toContainText(`fragmento ${String(ref.chunk_id)} de ${ref.doc_id}`);
    // El texto original del fragmento, leído de metadata.jsonl: más que el título.
    const cuadro = recorrido.locator("[aria-live='polite']").filter({ hasText: "Referencia [1]" });
    await expect(cuadro).not.toContainText("Leyendo el fragmento");
    expect(((await cuadro.textContent()) ?? "").length).toBeGreaterThan(200);
    await page.keyboard.press("Escape");
  });

  test("el recorrido de vistas se presenta con las flechas (B.6.1)", async ({
    page,
    guardia,
  }, testInfo) => {
    await abrirEn(page, { componente: "linea_tiempo" });
    // Sin vistas en el hilo no hay nada que presentar: el botón no se ofrece.
    await expect(agente(page).getByRole("button", { name: /Presentar el recorrido/ })).toHaveCount(
      0,
    );

    await preguntarAlAgente(page, guardia);
    await agente(page)
      .getByRole("button", { name: /Presentar el recorrido/ })
      .click();

    const recorrido = page.getByRole("dialog", { name: "Presentación del recorrido analítico" });
    await expect(recorrido).toBeVisible();
    await expect(recorrido).toContainText("1 / 1");
    await expect(recorrido).toContainText(INSTRUCCION);
    await expect(recorrido).toContainText(V.respuesta_agente);
    await expect(recorrido).toContainText(V.especificacion.justificacion);
    await expect(
      recorrido.getByRole("heading", { level: 2, name: V.resultado.titulo }),
    ).toBeVisible();
    await auditarAccesibilidad(page, testInfo, "tablero-recorrido");

    await page.keyboard.press("Escape");
    await expect(recorrido).toBeHidden();
    await expect(lienzo(page)).toBeVisible();
  });
});
