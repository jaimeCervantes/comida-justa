import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";

/**
 * Añadir al carrito desde un resultado de búsqueda.
 *
 * No hacía falta UI nueva: la búsqueda ya usa el mismo `CardForList` que `/productos`. Lo que
 * faltaba era que su proyección llevara `kind` e `is_available` hasta la tarjeta —los traía la
 * consulta y se perdían al construir el DTO—, sin los cuales `canBeOrdered` decide que nada se puede
 * pedir.
 *
 * El término es único para no competir con las 23 publicaciones reales, igual que en los escenarios
 * de `busquedaRelevante`.
 */
const TOKEN = `carrimbo${Date.now()}`;

const producto = {
  title: `E2E Producto ${TOKEN}`,
  slug: testSlug("producto-buscable"),
  kind: "producto" as const,
  origin: null,
  price: 60,
  sellerHandle: "hazlo-sano",
};

const anuncio = {
  title: `E2E Anuncio ${TOKEN}`,
  slug: testSlug("anuncio-buscable"),
  kind: "anuncio" as const,
  origin: null,
};

test.describe("Cuando alguien busca y quiere comprar sin abrir la publicación", () => {
  test.beforeEach(async () => {
    await seedPost(producto);
    await seedPost(anuncio);
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(producto.slug);
    await deleteOnePostBySlug(anuncio.slug);
  });

  test("Entonces el producto se añade desde su resultado y el anuncio no lo ofrece", async ({
    page,
  }) => {
    await page.goto(`/buscar/${TOKEN}/page/1`);

    const tarjetaProducto = page
      .locator("article")
      .filter({ hasText: producto.title });
    const tarjetaAnuncio = page
      .locator("article")
      .filter({ hasText: anuncio.title });

    await expect(tarjetaProducto).toBeVisible();
    await expect(tarjetaAnuncio).toBeVisible();

    // Un anuncio no se vende: no tiene precio y no hay nada que juntar.
    await expect(tarjetaAnuncio.getByTestId("add-to-cart")).toHaveCount(0);

    await tarjetaProducto.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-count")).toHaveText("1");

    await page.goto("/carrito");
    await expect(page.getByTestId("cart-line")).toContainText(producto.title);
  });
});
