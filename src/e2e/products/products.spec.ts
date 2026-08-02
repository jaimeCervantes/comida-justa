import { test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";
import ProductsPage from "./ProductsPage";

/*
 * `/productos` lista lo que vende **toda la comunidad**, no solo la marca.
 *
 * Antes filtraba por `origin` `hazlo_sano_*`, así que lo que publicaba un vendedor local no salía
 * en la única pantalla llamada «Productos». Ahora la línea la marca `kind`: entra todo el que
 * vende y quedan fuera los anuncios.
 *
 * Seeds go straight through the write repository (no UI, no admin gate) because this
 * scenario is about the read model; the publish flow is already covered by publishProduct.
 */
const stamp = Date.now();

const hazloSanoProduct = {
  title: `Miel de abeja de Hazlo Sano ${stamp}`,
  slug: testSlug("miel-de-abeja-de-hazlo-sano"),
  kind: "producto" as const,
  origin: "hazlo_sano_propio",
};

const communityProduct = {
  title: `Miel de abeja del vecino ${stamp}`,
  slug: testSlug("miel-de-abeja-del-vecino"),
  kind: "producto" as const,
  origin: "productor_local",
};

const hazloSanoAnuncio = {
  title: `Aviso de Hazlo Sano ${stamp}`,
  slug: testSlug("aviso-de-hazlo-sano"),
  kind: "anuncio" as const,
  origin: "hazlo_sano_propio",
};

const seeded = [hazloSanoProduct, communityProduct, hazloSanoAnuncio];

test.describe("When a visitor opens the products page", () => {
  test.beforeEach(async () => {
    for (const post of seeded) {
      await seedPost(post);
    }
  });

  test.afterEach(async () => {
    // Clean up here (not at the end of the test body) so a mid-test failure
    // can't leave seeded posts listed on the real products page.
    for (const post of seeded) {
      await deleteOnePostBySlug(post.slug);
    }
  });

  test("Then every product is listed, whoever sells it", async ({ page }) => {
    const productsPage = new ProductsPage(page);

    await productsPage.goto();

    await productsPage.expectListed(hazloSanoProduct.title);
    // Lo que cambió: antes esta línea era `expectNotListed`.
    await productsPage.expectListed(communityProduct.title);
    await productsPage.expectProvenanceIsShown();
  });

  test("Then an announcement stays out, because it is not for sale", async ({
    page,
  }) => {
    const productsPage = new ProductsPage(page);

    await productsPage.goto();

    /* La distinción que la página sí hace: `kind`. El anuncio es de la marca y aun así no
       aparece, que es la prueba de que el filtro ya no mira la procedencia. */
    await productsPage.expectNotListed(hazloSanoAnuncio.title);
  });
});
