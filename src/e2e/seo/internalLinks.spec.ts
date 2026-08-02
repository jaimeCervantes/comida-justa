import { expect, test } from "@playwright/test";

// Slice 6 de docs/features/seo.md. "Jugo Verde" existe, es de la sub-categoría `jugos`, la vende
// la tienda `hazlo-sano` y su autor tiene perfil reclamado. No se siembra nada.
const JUGO_VERDE = "jugo-verde";

test.describe("Cuando alguien termina de leer una publicación", () => {
  test("Entonces encuentra otras que se le parecen", async ({ page }) => {
    await page.goto(`/${JUGO_VERDE}`);

    const relacionadas = page.getByRole("complementary", {
      name: /relacionad/i,
    });

    // El encabezado existía vacío desde el principio: ahora tiene tarjetas debajo.
    await expect(relacionadas).toBeVisible();

    const enlaces = relacionadas.getByRole("link");

    expect(await enlaces.count()).toBeGreaterThan(0);
    // Y ninguna se recomienda a sí misma.
    await expect(relacionadas.locator(`a[href$="/${JUGO_VERDE}"]`)).toHaveCount(
      0,
    );
  });
});

test.describe("Cuando alguien llega a una publicación desde un buscador", () => {
  test("Entonces puede subir a su categoría, su tienda y su autor", async ({
    page,
  }) => {
    await page.goto(`/${JUGO_VERDE}`);

    await expect(page.getByTestId("post-link-category")).toHaveAttribute(
      "href",
      /\/categoria\/jugos$/,
    );
    await expect(page.getByTestId("post-link-store")).toHaveAttribute(
      "href",
      /\/tienda\/hazlo-sano$/,
    );
    await expect(page.getByTestId("post-link-author")).toHaveAttribute(
      "href",
      /\/u\//,
    );
  });
});
