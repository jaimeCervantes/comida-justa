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
  /* `productor` y no `hazlo_sano_*`: con la tienda al lado, las de Hazlo Sano se callan a
     propósito (ver `provenanceVisibility.ts`), así que para comprobar que `origin` llega hay que
     usar una procedencia que sí se pinta. */
  origin: "productor" as const,
  price: 60,
  category: "jugos",
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
    await page.goto(`/buscar?q=${TOKEN}&page=1`);

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

  /**
   * La misma publicación tiene que verse igual en los dos listados.
   *
   * Los cuatro campos que faltaban —`origin`, `category`, `subCategory` y `seller`— los traía la
   * consulta y se perdían al construir el DTO, así que un resultado de búsqueda salía sin logo de
   * tienda, sin categoría y sin procedencia mientras la misma tarjeta en `/productos` las mostraba.
   */
  test("Entonces su tarjeta enseña las mismas insignias que en el catálogo", async ({
    page,
  }) => {
    await page.goto(`/buscar?q=${TOKEN}&page=1`);

    const enBusqueda = page
      .locator("article")
      .filter({ hasText: producto.title });

    await expect(enBusqueda.getByTestId("card-store")).toBeVisible();
    await expect(enBusqueda).toContainText("Jugos");
    await expect(enBusqueda.getByTestId("provenance-badge")).toBeVisible();

    // Y no es que la búsqueda enseñe de más: es lo mismo que el catálogo.
    await page.goto("/productos");

    const enCatalogo = page
      .locator("article")
      .filter({ hasText: producto.title });

    await expect(enCatalogo.getByTestId("card-store")).toBeVisible();
    await expect(enCatalogo).toContainText("Jugos");
    await expect(enCatalogo.getByTestId("provenance-badge")).toBeVisible();
  });
});
