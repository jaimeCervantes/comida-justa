import { expect, test } from "@playwright/test";

/**
 * Enter en el buscador del header, en un navegador de verdad.
 *
 * Antes el campo no vivía dentro de un `<form>`: Enter no hacía nada, y en un teléfono el botón
 * «Ir»/«Buscar» del teclado tampoco —ese botón depende de que exista un `submit` que escuchar—.
 * Lo que solo se ve aquí y no en `SearchBar.test.tsx` es que el navegador real de verdad disparó
 * la navegación completa a `/buscar`, no solo el evento sintético de jsdom.
 */
test.describe("Enter en el buscador", () => {
  test("navega a los resultados completos con lo escrito", async ({ page }) => {
    await page.goto("/");

    const input = page.locator('input[name="search"]').first();
    await input.fill("miel");
    await input.press("Enter");

    await expect(page).toHaveURL(/\/buscar\?q=miel/);
  });

  test("con el campo vacío, no navega a ninguna parte", async ({ page }) => {
    await page.goto("/nosotros");

    const input = page.locator('input[name="search"]').first();
    await input.press("Enter");

    await expect(page).toHaveURL(/\/nosotros$/);
  });
});
