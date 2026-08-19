import { expect, test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/** Slice 5 de `docs/features/commerce/002-2026-08-02-productores-locales.md`. */
const TIENDA = testStore("Panadería La Luz");
const VISITOR = coordinatesAtKm(1.65);

test.describe("Cuando alguien con ubicación abre el catálogo", () => {
  const slug = testSlug("pan-para-el-mapa");

  test.beforeAll(async () => {
    await seedStore(TIENDA, 2);
    await seedPost({
      title: `E2E Pan para el mapa ${Date.now()}`,
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

  test("Entonces ve un mapa con las tiendas situadas", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([
      {
        name: VISITOR_LOCATION_COOKIE,
        value: `${VISITOR.latitude},${VISITOR.longitude}`,
        url: baseURL ?? "http://localhost:3000",
      },
    ]);

    await page.goto("/productos");

    // El mapa se trae con `next/dynamic` en el cliente, así que tarda un poco más que el HTML.
    await expect(page.getByTestId("stores-map")).toBeVisible({
      timeout: 15_000,
    });
    // Con sus pines dentro: el del visitante más el de cada tienda.
    await expect(
      page.getByTestId("stores-map").locator(".leaflet-marker-icon").first(),
    ).toBeVisible();
  });

  test("Pero sin ubicación no se le pinta ningún mapa", async ({ page }) => {
    await page.goto("/productos");

    await expect(page.getByTestId("stores-map")).toHaveCount(0);
  });
});
