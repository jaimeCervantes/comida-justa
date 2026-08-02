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

    /* El bug que el slice 0 arregló: con `next/link` el href salía sin prefijo (`/productos`),
       así que un clic en inglés devolvía al visitante al español sin avisar.

       Desde el slice 4 la dirección además se traduce, así que ya no es `/en/productos` sino
       `/en/products`. Que `/en/productos` siga respondiendo —con un 307 hacia esta— lo cubre el
       escenario de abajo. */
    await localePage.expectPathname("/en/products");
  });

  test("Then the Spanish address in English redirects instead of duplicating", async ({
    page,
  }) => {
    /* Sin la redirección habría dos direcciones sirviendo la misma página en inglés
       (`/en/productos` y `/en/products`), que es contenido duplicado a ojos de un buscador. */
    const response = await page.goto("/en/productos");

    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/en/products");
  });

  test("Then an unknown language is a clean 404, not a server error", async ({
    page,
  }) => {
    const response = await page.goto("/fr/productos");

    expect(response?.status()).toBe(404);
  });
});
