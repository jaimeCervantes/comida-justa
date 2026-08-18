import { test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { type SeedPostInput, seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";
import ProductsPage from "./ProductsPage";

/*
 * `/productos` lista lo que vende **toda la comunidad**, no solo la marca ni solo mercancia.
 *
 * Antes filtraba por `origin` `hazlo_sano_*`, así que lo que publicaba un vendedor local no salía
 * en la única pantalla llamada «Productos». Ahora la línea la marca `kind`: entra todo el que
 * vende o agenda y quedan fuera los anuncios y eventos.
 *
 * Seeds go straight through the write repository (no UI, no admin gate) because this
 * scenario is about the read model; the publish flow is already covered by publishProduct.
 */
const stamp = Date.now();

const hazloSanoProduct = {
  title: `Miel de abeja de Hazlo Sano ${stamp}`,
  slug: testSlug("miel-de-abeja-de-hazlo-sano"),
  kind: "producto",
  origin: "hazlo_sano_propio",
} satisfies SeedPostInput;

const communityProduct = {
  title: `Miel de abeja del vecino ${stamp}`,
  slug: testSlug("miel-de-abeja-del-vecino"),
  kind: "producto",
  origin: "productor",
} satisfies SeedPostInput;

const communityService = {
  title: `Masaje relajante del vecino ${stamp}`,
  slug: testSlug("masaje-relajante-del-vecino"),
  kind: "servicio",
  origin: null,
  durationMinutes: 30,
} satisfies SeedPostInput;

const communityEvent = {
  title: `Meditacion guiada del vecino ${stamp}`,
  slug: testSlug("meditacion-guiada-del-vecino"),
  kind: "evento",
  origin: null,
  price: null,
  startsAt: new Date("2027-08-23T07:30:00Z"),
} satisfies SeedPostInput;

const hazloSanoAnuncio = {
  title: `Aviso de Hazlo Sano ${stamp}`,
  slug: testSlug("aviso-de-hazlo-sano"),
  kind: "anuncio",
  origin: "hazlo_sano_propio",
} satisfies SeedPostInput;

const seeded = [
  hazloSanoProduct,
  communityProduct,
  communityService,
  communityEvent,
  hazloSanoAnuncio,
];

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

  test("Then every product and service is listed, whoever sells it", async ({
    page,
  }) => {
    const productsPage = new ProductsPage(page);

    await productsPage.goto();

    await productsPage.expectListed(hazloSanoProduct.title);
    // Lo que cambió: antes esta línea era `expectNotListed`.
    await productsPage.expectListed(communityProduct.title);
    await productsPage.expectListed(communityService.title);
    await productsPage.expectCanBeAddedToCart(hazloSanoProduct.title);
    await productsPage.expectLinksToBooking(communityService.title);
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
    await productsPage.expectNotListed(communityEvent.title);
  });
});
