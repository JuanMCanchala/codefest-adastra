import type { Page, TestInfo } from "@playwright/test";

import {
  auditarAccesibilidad,
  esperarSinDesbordeHorizontal,
  expect,
  test,
} from "../soporte/fixtures";
import { TABLERO_URL } from "../soporte/urls";

/**
 * Orden de observación: de la mención al sobrevuelo. La ficha de un municipio que junta las
 * alertas del corpus (F3), las pasadas de los satélites propagadas en el navegador (F2) y la
 * minería que Amazon Mining Watch ya midió ahí (F1). `/api/componente` va en vivo.
 */

const lienzo = (page: Page) => page.locator("section[aria-labelledby='titulo-componente']");
const panel = (page: Page) => page.getByRole("complementary", { name: "Panel de evidencia" });

function esMovil(testInfo: TestInfo): boolean {
  return testInfo.project.name === "movil";
}

async function abrirOrden(page: Page, municipio?: string): Promise<void> {
  const consulta = new URLSearchParams({ componente: "orden_observacion" });
  if (municipio) consulta.set("municipio", municipio);
  const respuesta = page.waitForResponse((r) => r.url().includes("/api/componente"));
  await page.goto(`${TABLERO_URL}/?${consulta.toString()}`);
  expect((await respuesta).ok()).toBe(true);
  const abrir = page.getByRole("button", { name: /Abrir el agente/ });
  if ((await abrir.count()) > 0) {
    // La ficha ocupa el lienzo entero; la ventana del agente taparía la tercera columna.
    await page.keyboard.press("Escape");
  }
}

test.describe("Tablero · orden de observación", () => {
  test("la ficha de La Montañita cierra el ciclo: alertas, pasadas y minería medida", async ({
    page,
  }) => {
    await abrirOrden(page, "La Montañita");
    await expect(
      page.getByRole("heading", { level: 2, name: /Orden de observación · La Montañita/ }),
    ).toBeVisible();

    // 1. Territorio: las alertas de la Defensoría y la presencia armada, con su fuente.
    const territorio = lienzo(page).getByRole("region", { name: /Territorio/ });
    await expect(territorio).toContainText("Defensoría del Pueblo");
    await expect(territorio).toContainText("Amazon Underworld");
    await expect(territorio).toContainText("Frente Rodrigo Cadete");

    // 2. Observación: las pasadas se calculan aquí, y se dice de dónde sale el punto.
    const observacion = lienzo(page).getByRole("region", { name: /Observación/ });
    await expect(observacion).toContainText("Próxima imagen óptica con luz");
    await expect(observacion).toContainText("MGN 2018 (DANE)");
    await expect(observacion).toContainText("Elementos orbitales de hace");
    // La primera misión resuelve su pasada en segundos: ni «calculando» eterno ni fecha inventada.
    const sentinel = observacion.getByRole("listitem").filter({ hasText: "Sentinel-2A" });
    // Los tramos van pegados en el texto («Próxima:sáb, 26 de sept, 10:33»): un día de la
    // semana, una fecha y una hora, o la constancia de que no hay pasada en la ventana.
    await expect(sentinel).toContainText(
      /Próxima:\s*(fuera de la ventana|\S+, \d{2} de \S+, \d{2}:\d{2})/,
      { timeout: 30_000 },
    );

    // 3. Lo que ya se midió: hectáreas con procedencia (fuente, sensor, modelo, commit).
    const medido = lienzo(page).getByRole("region", { name: /Lo que ya se midió/ });
    await expect(medido).toContainText(/Minería en el municipio/);
    await expect(medido).toContainText(/\d+ ha/);
    await expect(medido).toContainText("Sentinel-2");
    await expect(medido).toContainText(/commit\s+[0-9a-f]{12}/);

    // Ver las alertas abre en el panel de evidencia fragmentos reales de la Defensoría.
    const evidencia = page.waitForResponse((r) => r.url().includes("/api/evidencia"));
    await territorio.getByRole("button", { name: "Ver las alertas" }).click();
    expect((await evidencia).ok()).toBe(true);
    await expect(panel(page)).toContainText("La Montañita · alertas tempranas");
    await expect(panel(page)).toContainText(/F3-ALERTAS-\d+/);
  });

  test("fuera de la cuenca amazónica no se inventa minería ni presencia armada", async ({
    page,
  }) => {
    await abrirOrden(page, "Apartadó");
    await expect(
      page.getByRole("heading", { level: 2, name: /Orden de observación · Apartadó/ }),
    ).toBeVisible();
    const medido = lienzo(page).getByRole("region", { name: /Lo que ya se midió/ });
    await expect(medido).toContainText("Sin medición satelital");
    await expect(medido).toContainText("Fuera de la cobertura de Amazon Mining Watch");
    await expect(medido).not.toContainText(/Minería en el municipio/);
    const territorio = lienzo(page).getByRole("region", { name: /Territorio/ });
    await expect(territorio).toContainText("Fuera de la cuenca amazónica");
  });

  test("un municipio inexistente se declara y se abre el de más alertas; saltar a otro reescribe la URL", async ({
    page,
  }) => {
    await abrirOrden(page, "Narnia");
    // El filtro descartado se ve en la cabecera del lienzo, no se calla.
    await expect(lienzo(page)).toContainText(/Sin filtrar por/);
    await expect(
      page.getByRole("heading", { level: 2, name: /Orden de observación · Apartadó/ }),
    ).toBeVisible();

    // Los otros municipios con alertas son saltos: una petición nueva y la URL la refleja.
    const siguiente = page.waitForResponse((r) => {
      if (!r.url().includes("/api/componente")) return false;
      const cuerpo = r.request().postDataJSON() as { filtros?: { municipio?: string } } | null;
      return cuerpo?.filtros?.municipio === "La Pedrera";
    });
    await lienzo(page)
      .getByRole("button", { name: /^La Pedrera/ })
      .click();
    expect((await siguiente).ok()).toBe(true);
    await expect(
      page.getByRole("heading", { level: 2, name: /Orden de observación · La Pedrera/ }),
    ).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.get("municipio")).toBe("La Pedrera");
  });

  test("la orden se copia como texto con las tres etapas", async ({ page }) => {
    await page.addInitScript(() => {
      const memoria: { texto: string } = { texto: "" };
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: (t: string) => {
            memoria.texto = t;
            return Promise.resolve();
          },
          readText: () => Promise.resolve(memoria.texto),
        },
      });
    });
    await abrirOrden(page, "La Montañita");
    await page.getByRole("button", { name: "Copiar la orden" }).click();
    await expect(page.getByRole("button", { name: "Orden copiada" })).toBeVisible();
    const texto = await page.evaluate(() => navigator.clipboard.readText());
    expect(texto).toContain("ORDEN DE OBSERVACIÓN · La Montañita (Caquetá) · DIVIPOLA 18410");
    expect(texto).toContain("1. TERRITORIO (F3)");
    expect(texto).toContain("2. OBSERVACIÓN (F2)");
    expect(texto).toContain("3. LO QUE YA SE MIDIÓ (F1)");
    expect(texto).toMatch(/Minería detectada en el municipio: \d+ ha/);
  });

  test("sin violaciones de accesibilidad serias o críticas y sin desborde", async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    await abrirOrden(page, "La Montañita");
    await expect(lienzo(page).getByRole("region", { name: /Observación/ })).toContainText(
      /Próxima:\s*(fuera de la ventana|\S+, \d{2} de \S+, \d{2}:\d{2})/,
      { timeout: 30_000 },
    );
    await auditarAccesibilidad(page, testInfo, "orden-observacion");
    if (!esMovil(testInfo)) {
      await esperarSinDesbordeHorizontal(page);
    }
  });
});
