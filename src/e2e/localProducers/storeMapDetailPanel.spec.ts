import { expect, test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/** Escenario en `src/e2e/localProducers/storeMapDetailPanel.feature`. */
const TIENDA = testStore("Tienda con ficha de mapa");
const VISITOR = coordinatesAtKm(1.65);
const slug = testSlug("pan-para-ficha-de-mapa");

test.describe("Cuando alguien selecciona una tienda en el mapa", () => {
  test.beforeAll(async () => {
    await seedStore(TIENDA, 2);
    await seedPost({
      title: `E2E Pan para ficha de mapa ${Date.now()}`,
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

  test("Entonces abre una ficha del sitio sin salir del catálogo", async ({
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

    const map = page.getByTestId("stores-map");
    await expect(map).toBeVisible({ timeout: 15_000 });

    await map
      .locator(".leaflet-marker-icon:has(.map-marker--store)")
      .first()
      .click({ force: true });

    await expect(page).toHaveURL(/\/productos$/u);

    const panel = page.getByTestId("store-map-detail-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(TIENDA.name);
    await expect(panel.getByTestId("store-distance")).toBeVisible();
    await expect(
      panel.getByRole("link", { name: /ver la tienda/i }),
    ).toHaveAttribute("href", `/tienda/${TIENDA.handle}`);

    await expect(
      panel.evaluate((node) => node.closest(".leaflet-container") === null),
    ).resolves.toBe(true);

    await panel.getByRole("button", { name: /cerrar/i }).click();
    await expect(panel).toHaveCount(0);
  });
});
