import { defineConfig } from "@playwright/test";

/**
 * Suite E2E de las dos superficies de AeroCode.
 *
 * - Chat (frontagent):   CHAT_URL,    por defecto http://localhost:3000
 * - Tablero (dashboard): TABLERO_URL, por defecto http://localhost:8080
 *
 * Ninguna prueba llega a los modelos: `/api/chat` y `/api/visualizar` se interceptan siempre
 * (ver `soporte/fixtures.ts`). El resto de rutas del tablero se prueban en vivo.
 */

const argumentosChromium = [
  // WebGL por software para que MapLibre dibuje el mapa en modo headless.
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
];

export default defineConfig({
  testDir: "./pruebas",
  globalSetup: "./soporte/preparacion-global.ts",
  outputDir: "./test-results",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  // WebGL por software es costoso en CPU: pocos procesos en paralelo.
  workers: process.env["E2E_WORKERS"] ? Number(process.env["E2E_WORKERS"]) : 2,
  reporter: [
    ["list"],
    ["html", { outputFolder: "./playwright-report", open: "never" }],
  ],
  use: {
    locale: "es-CO",
    timezoneId: "America/Bogota",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    launchOptions: { args: argumentosChromium },
  },
  projects: [
    {
      name: "escritorio",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "movil",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
