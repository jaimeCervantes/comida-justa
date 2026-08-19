import { expect, test } from "@playwright/test";
import { COMMUNITY_ANCHOR } from "~/domain/entities/seller/proximity";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 3 de `docs/features/commerce/002-2026-08-02-productores-locales.md`.
 *
 * La ubicación del visitante se pone por cookie y no apretando el botón: el permiso del navegador
 * lo concede el sistema operativo, no la página, y lo que este escenario prueba es que **con** una
 * ubicación conocida la distancia sale bien. El redondeo se prueba aparte, en Vitest.
 */
const TIENDA = testStore("Panadería La Luz");

test.describe("Cuando alguien mira un producto de una tienda con ubicación", () => {
  const slug = testSlug("pan-de-masa-madre-a-dos-kilometros");

  test.beforeAll(async () => {
    await seedStore(TIENDA, 2);
    await seedPost({
      title: `E2E Pan de masa madre ${Date.now()}`,
      slug,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: TIENDA.handle,
    });
  });

  test.afterAll(async () => {
    await deleteTestSellerByHandle(TIENDA.handle);
  });

  test("Entonces sin ubicación no se le inventa una distancia", async ({
    page,
  }) => {
    await page.goto(`/${slug}`);

    await expect(page.getByTestId("store-distance")).toHaveCount(0);
    // Y se le ofrece darla, que es la única forma de que aparezca.
    await expect(page.getByTestId("share-location")).toBeVisible();
  });

  test("Y con su ubicación compartida ve a qué distancia está", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([
      {
        name: VISITOR_LOCATION_COOKIE,
        value: `${COMMUNITY_ANCHOR.latitude},${COMMUNITY_ANCHOR.longitude}`,
        url: baseURL ?? "http://localhost:3000",
      },
    ]);

    await page.goto(`/${slug}`);

    await expect(page.getByTestId("store-distance")).toHaveText(/a 2 km/);
    // Ya no hace falta pedirle nada.
    await expect(page.getByTestId("share-location")).toHaveCount(0);
  });
});
