import { expect, test } from "@playwright/test";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 1 de `docs/features/commerce/002-2026-08-02-productores-locales.md`.
 *
 * Lo que se prueba aquí es la mitad del filtro que **no** vive en el post: la distancia. Que una
 * publicación con `origin = 'productor'` mete a su tienda al directorio ya lo cubre
 * `src/e2e/seo/directories.spec.ts` con la tienda real; lo que falta es lo que decidió el radio
 * sostenible —quién se queda fuera— y eso necesita tiendas sembradas a distancias concretas.
 */
const DENTRO = testStore("Panadería La Luz");
const LEJOS = testStore("Panadería de Otro Estado");
const SIN_UBICACION = testStore("Panadería Sin Domicilio");

test.describe("Cuando una tienda publica algo que ella misma elabora", () => {
  const slugs = {
    dentro: testSlug("pan-de-masa-madre-cerca"),
    lejos: testSlug("pan-de-masa-madre-lejos"),
    sinUbicacion: testSlug("pan-de-masa-madre-sin-ubicacion"),
  };

  test.beforeAll(async () => {
    // Las tres publican exactamente lo mismo: lo único que las distingue es dónde están.
    await seedStore(DENTRO, 2);
    await seedStore(LEJOS, 120);
    await seedStore(SIN_UBICACION, null);

    await seedPost({
      title: `E2E Pan de masa madre cerca ${Date.now()}`,
      slug: slugs.dentro,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: DENTRO.handle,
    });
    await seedPost({
      title: `E2E Pan de masa madre lejos ${Date.now()}`,
      slug: slugs.lejos,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: LEJOS.handle,
    });
    await seedPost({
      title: `E2E Pan de masa madre sin ubicación ${Date.now()}`,
      slug: slugs.sinUbicacion,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: SIN_UBICACION.handle,
    });
  });

  test.afterAll(async () => {
    // Borra la tienda con su catálogo y sus sucursales colgando, en el orden que exigen los FK.
    await deleteTestSellerByHandle(DENTRO.handle);
    await deleteTestSellerByHandle(LEJOS.handle);
    await deleteTestSellerByHandle(SIN_UBICACION.handle);
  });

  test("Entonces la que está dentro del radio entra a productores locales", async ({
    page,
  }) => {
    await page.goto("/productores-locales");

    await expect(
      page.getByTestId("store-summary").filter({ hasText: DENTRO.name }),
    ).toBeVisible();
  });

  test("Pero producir a 120 km no es producir local", async ({ page }) => {
    await page.goto("/productores-locales");
    await expect(
      page.getByTestId("store-summary").filter({ hasText: LEJOS.name }),
    ).toHaveCount(0);

    // Sigue siendo un negocio con dirección pública: el directorio general no la excluye.
    await page.goto("/negocios-locales");
    await expect(
      page.getByTestId("store-summary").filter({ hasText: LEJOS.name }),
    ).toBeVisible();
  });

  test("Y sin ubicación no hay distancia que verificar, así que tampoco entra", async ({
    page,
  }) => {
    await page.goto("/productores-locales");
    await expect(
      page.getByTestId("store-summary").filter({ hasText: SIN_UBICACION.name }),
    ).toHaveCount(0);

    await page.goto("/negocios-locales");
    await expect(
      page.getByTestId("store-summary").filter({ hasText: SIN_UBICACION.name }),
    ).toBeVisible();
  });
});
