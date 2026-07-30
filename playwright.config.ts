import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production" });
} else {
  dotenv.config({ path: ".env.development" });
}
/**
 * Puerto de la suite. Se puede mover con `E2E_PORT` cuando 3000 está ocupado por otro proyecto:
 * `E2E_PORT=3100 pnpm run test:e2e:run`.
 */
const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE_URL = `http://localhost:${PORT}`;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: 90000,
  testDir: "./src/e2e",

  /**
   * Solo `*.spec.ts`. Por defecto Playwright también toma `*.test.ts`, y bajo `src/e2e/` conviven
   * pruebas unitarias de Vitest —las de los ayudantes, que deben poder correr sin navegador ni
   * base—. Sin esto, Playwright intenta ejecutarlas y falla al importar Vitest.
   */
  testMatch: /.*\.spec\.ts$/,

  /**
   * La base la comparten tres repositorios, así que la limpieza no puede depender de que el final
   * de un test se ejecute: `globalSetup` barre lo que dejó una corrida caída, y `globalTeardown`
   * barre y **falla si algo quedó**. Ver `docs/features/datos-de-prueba-e2e.md`.
   */
  globalSetup: "./src/e2e/globalSetup.ts",
  globalTeardown: "./src/e2e/globalTeardown.ts",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: BASE_URL,

    /**
     * El sitio decide el idioma por `Accept-Language` y Chromium pide `en-US`, así que sin esto la
     * suite entera corría en inglés: el proxy de next-intl redirigía `/` a `/en` y `/nosotros` a
     * `/en/nosotros`, mientras los escenarios afirman textos en español ("Nosotros", "Publicar",
     * "Título de la publicación"). Se fija el idioma por defecto del sitio para que la suite pruebe
     * lo que dice probar; los escenarios que comparan idiomas piden su locale en la ruta.
     */
    locale: "es-MX",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },

    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /**
   * Run your local dev server before starting the tests.
   *
   * `reuseExistingServer` está en `false` a propósito: con `true`, si otro proyecto ya servía en
   * este puerto, Playwright lo adoptaba y corría la suite entera contra la aplicación equivocada
   * — 15 escenarios en rojo sin ninguna pista, porque el fallo se ve como "no encuentro el
   * elemento" y no como "esta no es tu app". Arrancar siempre el servidor propio cuesta unos
   * segundos y hace la suite hermética.
   *
   * `NEXT_PUBLIC_BASE_URL` sigue al puerto: las páginas de búsqueda lo usan para llamar a
   * `/api/search` desde el servidor, y si apunta a otro puerto la petición se va al vacío.
   */
  webServer: {
    command: `pnpm exec next dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    env: { NEXT_PUBLIC_BASE_URL: BASE_URL },
    timeout: 180_000,
  },
});
