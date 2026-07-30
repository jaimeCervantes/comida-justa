import { test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";
import ProductsPage from "./ProductsPage";

// Slice 2 — the products page lists ONLY Hazlo Sano products.
// Seeds go straight through the write repository (no UI, no admin gate) because this
// scenario is about the read model; the publish flow is already covered by publishProduct.
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

  test("Then only Hazlo Sano products are listed, each with its badge", async ({
    page,
  }) => {
    const productsPage = new ProductsPage(page);

    await productsPage.goto();

    await productsPage.expectListed(hazloSanoProduct.title);
    await productsPage.expectNotListed(communityProduct.title);
    await productsPage.expectNotListed(hazloSanoAnuncio.title);
    await productsPage.expectHazloSanoBadge();
  });
});
