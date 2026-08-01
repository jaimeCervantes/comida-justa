import { expect, test } from "@playwright/test";
import LocalePage from "./LocalePage";

/**
 * Slice 0 — la fundación. Ver `src/e2e/i18n/i18n.feature`.
 *
 * No siembra nada: son rutas y negociación de idioma, no hay escritura en la base.
 */
test.describe("When a visitor browses the site in English", () => {
  test("Then following the menu keeps them in English", async ({ page }) => {
    const localePage = new LocalePage(page);

    await localePage.openInEnglish();
    // Que el enlace se llame "Products" y no "Productos" es el slice 1 ya visible en el header.
    await localePage.openFromMainMenu("Products");

    /* El bug que este slice arregla: con `next/link` el href salía sin prefijo (`/productos`),
       así que un clic en inglés devolvía al visitante al español sin avisar. */
    await localePage.expectPathname("/en/productos");
  });

  test("Then an unknown language is a clean 404, not a server error", async ({
    page,
  }) => {
    const response = await page.goto("/fr/productos");

    expect(response?.status()).toBe(404);
  });
});
