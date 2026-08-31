import { expect, test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

type RgbColor = {
  blue: number;
  green: number;
  red: number;
};

function rgbFromCss(cssColor: string): RgbColor {
  const match = cssColor.match(/^rgb\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)\s*\)$/u);

  if (!match) {
    throw new Error(`No se pudo leer el color RGB: ${cssColor}`);
  }

  return {
    blue: Number(match[3]),
    green: Number(match[2]),
    red: Number(match[1]),
  };
}

/** Escenario en `src/e2e/localProducers/mapMarkers.feature`. */
const TIENDA = testStore("Tienda con pines modernos");
const VISITOR = coordinatesAtKm(1.65);
const slug = testSlug("pan-con-pines-modernos");

test.describe("Cuando alguien con ubicación abre el mapa de tiendas", () => {
  test.beforeAll(async () => {
    await seedStore(TIENDA, 2);
    await seedPost({
      title: `E2E Pan con pines modernos ${Date.now()}`,
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

  test("Entonces distingue tienda y ubicación con marcadores profesionales", async ({
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

    const storeMarker = map.locator(".map-marker--store").first();
    const visitorMarker = map.locator(".map-marker--visitor").first();

    await expect(storeMarker).toBeVisible();
    await expect(visitorMarker).toBeVisible();
    await expect(storeMarker.locator("svg")).toHaveCount(1);
    await expect(visitorMarker.locator("svg")).toHaveCount(1);
    await expect(storeMarker).not.toContainText("🏪");
    await expect(visitorMarker).not.toContainText("📍");

    const [storeColor, visitorColor] = await Promise.all([
      storeMarker.evaluate(
        (element) =>
          getComputedStyle(element.querySelector(".map-marker__pin") ?? element)
            .backgroundColor,
      ),
      visitorMarker.evaluate(
        (element) =>
          getComputedStyle(element.querySelector(".map-marker__pin") ?? element)
            .backgroundColor,
      ),
    ]);

    const storeRgb = rgbFromCss(storeColor);
    const visitorRgb = rgbFromCss(visitorColor);

    expect(storeColor).not.toBe(visitorColor);
    expect(storeRgb.green).toBeLessThan(storeRgb.red);
    expect(storeRgb.green).toBeLessThan(storeRgb.blue);
    expect(visitorRgb.green).toBeLessThan(visitorRgb.blue);
  });
});
