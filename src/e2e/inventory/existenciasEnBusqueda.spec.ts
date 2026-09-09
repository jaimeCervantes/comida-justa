import { expect, type Locator, type Page, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { seedStock } from "../testUtils/seedStock";
import { testPost } from "../testUtils/testSlug";

/**
 * Slice 1 de `docs/features/search/005-2026-09-08-existencias-en-busqueda.md`.
 *
 * El dato que se prueba no nace en el cliente: se siembra en la base, se busca por `/buscar`, y la
 * recarga tiene que volver a pintarlo desde la consulta inicial. Así el escenario distingue un
 * guardado que quedó vivo en React de un resultado que de verdad trae `posts.stock_quantity`.
 */
test.describe("Las existencias en los resultados de búsqueda", () => {
  const producto = testPost("Dona Chocolate Keto con existencias en busqueda");

  test.beforeAll(async () => {
    await seedPost({
      title: producto.title,
      slug: producto.slug,
      kind: "producto",
      origin: "productor",
      price: 40,
      content: "Dona Chocolate Keto de prueba para resultados con inventario.",
    });
    await seedStock(producto.slug, 8);
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(producto.slug);
  });

  test("La búsqueda muestra existencias desde el primer render", async ({
    page,
  }) => {
    await searchFor(page, producto.title);

    await expect(resultCard(page, producto.title)).toContainText(
      "Quedan 8 unidades",
    );

    await page.reload();

    await expect(resultCard(page, producto.title)).toContainText(
      "Quedan 8 unidades",
    );
  });
});

async function searchFor(page: Page, query: string): Promise<void> {
  await page.goto(`/buscar?q=${encodeURIComponent(query)}&page=1`);
}

function resultCard(page: Page, title: string): Locator {
  return page.locator("article").filter({ hasText: title }).first();
}
