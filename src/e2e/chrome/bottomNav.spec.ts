import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";

/**
 * Slice del 5.1 para el teléfono: las cinco cosas que se hacen aquí, al alcance del pulgar.
 *
 * Qué ruta marca qué pestaña lo prueba Vitest sobre `activeBottomNavTab` — es aritmética sobre la
 * plantilla interna. Aquí se prueba lo que solo se ve en el navegador: que la barra existe donde
 * debe, que **no** existe donde no debe, y que no duplica la acción primaria del header.
 */
test.describe("La barra inferior del teléfono", () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test("Está siempre abajo, con sus cinco destinos", async ({ page }) => {
    await page.goto("/");

    const nav = page.getByTestId("bottom-nav");

    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveCount(5);
  });

  test("Y marca en qué pestaña estás, una sola vez", async ({ page }) => {
    await page.goto("/buscar");

    const actual = page
      .getByTestId("bottom-nav")
      .locator('a[aria-current="page"]');

    await expect(actual).toHaveCount(1);
    await expect(actual).toContainText(es.nav.bottomSearch);
  });

  /*
   * Una ficha se abre desde cualquier parte: decir «estás en Inicio» mientras alguien mira un
   * producto sería mentir sobre dónde está.
   */
  test("Pero en una publicación no marca ninguna", async ({ page }) => {
    await page.goto("/suero-natural");

    await expect(
      page.getByTestId("bottom-nav").locator('a[aria-current="page"]'),
    ).toHaveCount(0);
  });

  test("Y lleva de verdad a donde dice", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("bottom-nav-search").click();
    await page.waitForURL("**/buscar");

    await expect(
      page.getByRole("heading", { name: es.search.resultsHeading }),
    ).toBeVisible();
  });

  /*
   * Lo que trajo el catálogo a la barra: medido en un teléfono, `/productos` tenía **un solo**
   * enlace visible en el home —en el pie, a 6.670 px de scroll—, porque el CTA «Ver lo que hay hoy»
   * que lleva ahí vive en la portada, que es `hidden lg:block`. Se llegaba por hamburguesa o
   * bajando hasta el final.
   */
  test("Y el catálogo se alcanza con el pulgar, sin abrir menús ni bajar al pie", async ({
    page,
  }) => {
    await page.goto("/");

    const catalogo = page.getByTestId("bottom-nav-products");
    await expect(catalogo).toBeVisible();

    await catalogo.click();
    await page.waitForURL("**/productos");

    await expect(
      page.getByRole("heading", { name: es.products.title, level: 1 }),
    ).toBeVisible();
  });

  /*
   * «Publicar» es la acción primaria del sitio y ahora vive en el círculo levantado de la barra.
   * Tenerla también en el header la duplicaba y le quitaba sitio al buscador.
   */
  test("Y «Publicar» está una sola vez: en la barra, no en el header", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("bottom-nav-publish")).toBeVisible();
    await expect(
      page.getByRole("banner").getByRole("button", { name: es.nav.publish }),
    ).toHaveCount(0);
  });
});

test.describe("En escritorio", () => {
  test("La barra inferior no existe: ahí está la de navegación", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("bottom-nav")).toBeHidden();
    await expect(page.getByTestId("desktop-menu")).toBeVisible();
  });
});
