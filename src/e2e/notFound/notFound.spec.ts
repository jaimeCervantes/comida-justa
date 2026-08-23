import { expect, test } from "@playwright/test";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";

// El 404 tiene que ser un 404 de verdad, no un 200 que "parece" 404: si la decisión ocurre
// dentro de un `<Suspense>` (o detrás de un `loading.tsx`), la respuesta ya salió con 200.
test.describe("When a visitor opens something that does not exist", () => {
  test("Then an unknown publication responds with 404", async ({ page }) => {
    const response = await page.goto("/esta-publicacion-no-existe-xyz");

    expect(response?.status()).toBe(404);
    /* Se afirma que hay un `h1` y no qué dice: el texto es copy y se reescribe, y una prueba que
       lo copia se cae en cada afinado de tono. Lo que sí promete la página —que explica la causa y
       ofrece salidas— tiene su propio escenario más abajo. */
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("Then a page number beyond the last one responds with 404", async ({
    page,
  }) => {
    const response = await page.goto("/page/99999");

    expect(response?.status()).toBe(404);
  });
});

test.describe("When a non-admin opens the internal report", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Then it responds with 404 and no report", async ({ page }) => {
    const response = await page.goto("/admin/productos");

    expect(response?.status()).toBe(404);
    await expect(page.getByTestId("origin-report")).toHaveCount(0);
  });
});

/**
 * El 5.16 del canvas: «el 404 explica la causa más probable». En un sitio donde la gente publica,
 * las páginas mueren de verdad —una publicación se vence, su dueño la borra— y quien llega necesita
 * saber que no se equivocó él.
 */
test.describe("Cuando alguien cae en una dirección que ya no existe", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/esta-publicacion-no-existe-xyz");
  });

  test("Entonces le dicen qué pasó, y no solo que no está", async ({
    page,
  }) => {
    const causa = page.getByRole("heading", { level: 1 });

    await expect(causa).toBeVisible();
    /* Hay un párrafo de explicación además del encabezado: sin él, la página vuelve a ser un
       cartel de «no encontrado» con otra tipografía. */
    await expect(page.locator("main p, section p").first()).not.toHaveText("");
  });

  test("Entonces tiene dos salidas: mirar y buscar", async ({ page }) => {
    await expect(page.getByTestId("not-found-home")).toBeVisible();
    await expect(page.getByTestId("not-found-search")).toBeVisible();
  });

  /**
   * Lo único que puede empeorar un 404 es mandar a otro 404. Se comprueba **navegando**, porque las
   * seis secciones de comunidad responden 404 a propósito y un enlace a una de ellas se vería
   * perfectamente bien en el DOM.
   */
  for (const salida of [
    "not-found-producers",
    "not-found-events",
    "not-found-pillars",
  ]) {
    test(`Entonces «${salida}» lleva a una página que existe`, async ({
      page,
    }) => {
      const destino = await page.getByTestId(salida).getAttribute("href");

      expect(destino).not.toBeNull();

      const respuesta = await page.goto(destino ?? "/");

      expect(respuesta?.status()).toBe(200);
    });
  }
});
