import { expect, test } from "@playwright/test";
import {
  claimUsernameFor,
  releaseUsername,
} from "../testUtils/claimTestUsername";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { findSuiteUserId } from "../testUtils/suiteAccount";
import { testSlug } from "../testUtils/testSlug";
import { withoutNativeShare } from "./SharePanel";

// Slice 4 de docs/features/compartir-y-cuenta.md.
// Aquí comparte **el comprador**, no la vendedora, así que ningún escenario inicia sesión: si algo
// de esto exigiera cuenta, la mitad de las veces que alguien quiere repartir un enlace no podría.

/** La tienda real de la base. Solo se lee: ningún escenario de este archivo la escribe. */
const TIENDA_REAL = "hazlo-sano";

test.describe("Cuando un visitante encuentra una tienda que le gusta", () => {
  test.beforeEach(async ({ page }) => {
    await withoutNativeShare(page);
    await page.goto(`/tienda/${TIENDA_REAL}`);
  });

  test("Entonces puede compartirla sin haber iniciado sesión", async ({
    page,
  }) => {
    await expect(page.getByTestId("share-store-page-trigger")).toBeVisible();
  });

  test("Entonces WhatsApp lleva la dirección de la tienda", async ({
    page,
  }) => {
    await page.getByTestId("share-store-page-trigger").click();

    const href = await page.getByTestId("share-whatsapp").getAttribute("href");

    expect(href).toContain(encodeURIComponent(`/tienda/${TIENDA_REAL}`));
  });

  /* El catálogo de la tienda son tarjetas: es el mismo componente del home y de las búsquedas, así
     que probarlo aquí cubre los tres sitios. */
  test("Entonces también puede compartir un producto sin abrirlo", async ({
    page,
  }) => {
    const shareButtons = page.getByTestId("card-share-trigger");

    expect(await shareButtons.count()).toBeGreaterThan(0);

    await shareButtons.first().click();

    await expect(page.getByTestId("share-whatsapp")).toBeVisible();
  });
});

test.describe("Cuando un visitante abre una publicación", () => {
  const post = {
    title: `E2E Miel para compartir ${Date.now()}`,
    slug: testSlug("miel-para-compartir"),
    kind: "producto" as const,
    origin: null,
    price: 120,
  };

  test.beforeEach(async ({ page }) => {
    await seedPost(post);
    await withoutNativeShare(page);
    await page.goto(`/${post.slug}`);
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(post.slug);
  });

  test("Entonces puede compartirla con su dirección absoluta y su título", async ({
    page,
  }) => {
    await page.getByTestId("share-post-trigger").click();

    const href = await page.getByTestId("share-whatsapp").getAttribute("href");

    // Absoluta: un camino relativo no resuelve en la aplicación donde acabe pegado.
    expect(href).toContain(encodeURIComponent("http"));
    expect(href).toContain(encodeURIComponent(`/${post.slug}`));
    expect(href).toContain(encodeURIComponent(post.title));
  });
});

test.describe("Cuando un visitante abre el perfil de alguien", () => {
  const username = testSlug("perfil-compartible");

  test.beforeEach(async ({ page }) => {
    await claimUsernameFor(await findSuiteUserId(), username);
    await withoutNativeShare(page);
    await page.goto(`/u/${username}`);
  });

  test.afterEach(async () => {
    await releaseUsername(username);
  });

  test("Entonces puede compartirlo igual que una tienda", async ({ page }) => {
    await page.getByTestId("share-profile-page-trigger").click();

    const href = await page.getByTestId("share-whatsapp").getAttribute("href");

    expect(href).toContain(encodeURIComponent(`/u/${username}`));
  });
});
