import { expect, test } from "@playwright/test";

/**
 * La otra mitad de la anotación del 5.1 —«la búsqueda dice qué buscar»—: el campo ya nombra
 * ejemplos del catálogo, y el atajo lo pone a un gesto de distancia desde cualquier página.
 *
 * Qué tecla se anuncia según el teclado lo prueba Vitest (`useSearchShortcut.test.tsx`). Aquí se
 * prueba lo único que solo ocurre en un navegador de verdad: que la combinación **gana** y enfoca.
 */
test.describe("El atajo del buscador", () => {
  test("Ctrl+K enfoca la búsqueda desde cualquier página", async ({ page }) => {
    await page.goto("/nosotros");

    await page.keyboard.press("Control+k");

    await expect(page.locator('input[name="search"]:focus')).toBeVisible();
  });

  test("Y la tecla se anuncia dentro del campo", async ({ page }) => {
    await page.goto("/");

    const hint = page.getByTestId("search-shortcut").first();

    await expect(hint).toBeVisible();
    await expect(hint).toHaveText(/⌘K|Ctrl K/);
    /* Es una pista para quien tiene teclado; el atajo funciona igual sin oírla, y anunciarla
       alargaría el nombre accesible del campo sin decir nada nuevo. */
    await expect(hint).toHaveAttribute("aria-hidden", "true");
  });

  /*
   * Al enfocar con el atajo se selecciona lo que hubiera: quien lo pulsa viene a buscar otra cosa,
   * no a añadirle letras a la búsqueda anterior.
   */
  test("Y al volver a pulsarlo, lo escrito queda listo para sustituirse", async ({
    page,
  }) => {
    await page.goto("/");

    const input = page.locator('input[name="search"]').first();
    await input.fill("miel");
    await page.keyboard.press("Control+k");
    await page.keyboard.type("pan");

    await expect(input).toHaveValue("pan");
  });
});
