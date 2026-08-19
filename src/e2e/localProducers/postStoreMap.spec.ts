import { expect, test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/** La coordenada Y del elemento en la página: es el orden que ve quien lee. */
async function topOf(page: import("@playwright/test").Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox();
  return box?.y ?? Number.NaN;
}

/**
 * Slice 10 de `docs/features/commerce/002-2026-08-02-productores-locales.md`.
 *
 * El mapa del detalle contesta una pregunta que no necesita al visitante: dónde está la tienda de
 * lo que estoy viendo. Por eso aparece con ubicación compartida y sin ella.
 */
const CON_SUCURSAL = testStore("Panadería La Luz");
const SIN_SUCURSAL = testStore("Panadería Sin Domicilio");
const VISITOR = coordinatesAtKm(1.65);

test.describe("Cuando alguien abre el detalle de una publicación", () => {
  const slugs = {
    situada: testSlug("pan-de-tienda-situada"),
    sinSucursal: testSlug("pan-de-tienda-sin-sucursal"),
    sinTienda: testSlug("pan-sin-tienda-alguna"),
  };

  test.beforeAll(async () => {
    await seedStore(CON_SUCURSAL, 2);
    await seedStore(SIN_SUCURSAL, null);

    await seedPost({
      title: `E2E Pan de tienda situada ${Date.now()}`,
      slug: slugs.situada,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: CON_SUCURSAL.handle,
    });
    await seedPost({
      title: `E2E Pan de tienda sin sucursal ${Date.now()}`,
      slug: slugs.sinSucursal,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: SIN_SUCURSAL.handle,
    });
    await seedPost({
      title: `E2E Pan sin tienda alguna ${Date.now()}`,
      slug: slugs.sinTienda,
      kind: "producto",
      origin: "reventa_cercana",
      price: 96,
    });
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(slugs.sinTienda);
    await deleteTestSellerByHandle(CON_SUCURSAL.handle);
    await deleteTestSellerByHandle(SIN_SUCURSAL.handle);
  });

  test("Entonces ve dónde está la tienda, aunque no haya compartido la suya", async ({
    page,
  }) => {
    await page.goto(`/${slugs.situada}`);

    await expect(page.getByTestId("stores-map")).toBeVisible({
      timeout: 15_000,
    });
    // Sin su ubicación no hay distancia que decir, pero el mapa vale igual.
    await expect(page.getByTestId("store-distance")).toHaveCount(0);
  });

  test("Y con su ubicación, el mapa la incluye junto a la tienda", async ({
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

    await page.goto(`/${slugs.situada}`);

    const mapa = page.getByTestId("stores-map");
    await expect(mapa).toBeVisible({ timeout: 15_000 });

    // Dos pines: el de la tienda y el suyo.
    await expect(mapa.locator(".leaflet-marker-icon")).toHaveCount(2);
    await expect(page.getByTestId("store-distance")).toBeVisible();
  });

  /*
   * El orden se comprueba con la posición real en la página y no con las clases: `sm:order-*` es
   * un detalle de implementación, y lo que se afirma es lo que ve quien lee.
   */
  test("Y en móvil queda entre el producto y los comentarios", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${slugs.situada}`);

    await expect(page.getByTestId("stores-map")).toBeVisible({
      timeout: 15_000,
    });

    const mapa = await topOf(page, '[data-testid="stores-map"]');
    const precio = await topOf(page, '[data-testid="whatsapp-order"]');
    const comentarios = await topOf(page, '[data-testid="comments"]');

    expect(mapa).toBeGreaterThan(precio);
    expect(mapa).toBeLessThan(comentarios);
  });

  test("Pero sin tienda situada no se pinta ningún mapa", async ({ page }) => {
    await page.goto(`/${slugs.sinTienda}`);
    await expect(page.getByTestId("stores-map")).toHaveCount(0);

    await page.goto(`/${slugs.sinSucursal}`);
    await expect(page.getByTestId("stores-map")).toHaveCount(0);
  });
});
