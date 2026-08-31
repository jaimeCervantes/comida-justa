import { expect, type Locator, type Page, test } from "@playwright/test";
import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/** Escenario en `src/e2e/localProducers/storeMapDetailPanel.feature`. */
const TIENDA = testStore("Tienda con ficha de mapa");
const VISITOR = coordinatesAtKm(1.65);
const LOGO_URL = "/logo.webp";
const PUBLICACIONES = Array.from({ length: 5 }, (_, index) => ({
  title: `E2E Publicacion ${index + 1} para ficha de mapa`,
  slug: testSlug(`publicacion-${index + 1}-para-ficha-de-mapa`),
  createdAt: new Date(Date.UTC(2026, 7, 20 + index, 12, 0, 0)),
}));
const PUBLICACIONES_RECIENTES = [...PUBLICACIONES].reverse().slice(0, 4);
const PUBLICACION_ANTIGUA = PUBLICACIONES[0];

async function openProductsWithVisitor(
  page: Page,
  baseURL: string | undefined,
): Promise<void> {
  await page.context().addCookies([
    {
      name: VISITOR_LOCATION_COOKIE,
      value: `${VISITOR.latitude},${VISITOR.longitude}`,
      url: baseURL ?? "http://localhost:3000",
    },
  ]);

  await page.goto("/productos");
}

async function boxOf(locator: Locator): Promise<{
  height: number;
  width: number;
  x: number;
  y: number;
}> {
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error("No se pudo medir el elemento esperado.");
  }

  return box;
}

test.describe("Cuando alguien selecciona una tienda en el mapa", () => {
  test.beforeAll(async () => {
    await seedStore(TIENDA, 2);
    await db.execute(sql`
      UPDATE sellers
      SET logo_url = ${LOGO_URL}
      WHERE slug = ${TIENDA.handle}
    `);

    for (const post of PUBLICACIONES) {
      await seedPost({
        ...post,
        kind: "producto",
        origin: "productor",
        price: 96,
        sellerHandle: TIENDA.handle,
        media: [{ url: LOGO_URL, type: "image", alt: post.title }],
      });
    }
  });

  test.afterAll(async () => {
    await deleteTestSellerByHandle(TIENDA.handle);
  });

  test("Entonces abre una ficha del sitio sin salir del catálogo", async ({
    page,
    baseURL,
  }) => {
    await openProductsWithVisitor(page, baseURL);

    const map = page.getByTestId("stores-map");
    await expect(map).toBeVisible({ timeout: 15_000 });
    const leafletMap = map.locator(".leaflet-container");
    const mapWidthBefore = (await boxOf(leafletMap)).width;

    await map
      .locator(".leaflet-marker-icon:has(.map-marker--store)")
      .first()
      .click({ force: true });

    await expect(page).toHaveURL(/\/productos$/u);

    const panel = page.getByTestId("store-map-detail-panel");
    await expect(panel).toBeVisible();
    await expect
      .poll(async () =>
        Math.abs((await boxOf(leafletMap)).width - mapWidthBefore),
      )
      .toBeLessThanOrEqual(1);
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

  test("Entonces muestra el logo y las ultimas cuatro publicaciones", async ({
    page,
    baseURL,
  }) => {
    await openProductsWithVisitor(page, baseURL);

    const map = page.getByTestId("stores-map");
    await expect(map).toBeVisible({ timeout: 15_000 });

    await map
      .locator(".leaflet-marker-icon:has(.map-marker--store)")
      .first()
      .click({ force: true });

    const panel = page.getByTestId("store-map-detail-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByTestId("store-map-detail-logo")).toHaveAttribute(
      "src",
      /logo\.webp/u,
    );
    await expect(panel).not.toContainText(
      "Abre la tienda completa para ver todo lo que publica",
    );

    const recentPosts = panel.getByTestId("store-map-recent-posts");
    await expect(recentPosts.getByRole("link")).toHaveCount(4);

    for (const post of PUBLICACIONES_RECIENTES) {
      await expect(
        recentPosts.getByRole("link", { name: post.title }),
      ).toHaveAttribute("href", `/${post.slug}`);
    }

    await expect(panel).not.toContainText(PUBLICACION_ANTIGUA.title);
    await expect(
      panel.getByRole("link", { name: /ver la tienda/i }),
    ).toHaveAttribute("href", `/tienda/${TIENDA.handle}`);
  });

  test("Entonces en móvil la ficha se superpone sin empujar el catálogo", async ({
    page,
    baseURL,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openProductsWithVisitor(page, baseURL);

    const map = page.getByTestId("stores-map");
    const grid = page.getByTestId("products-grid");
    await expect(map).toBeVisible({ timeout: 15_000 });
    await expect(grid).toBeVisible();

    const gridTopBefore = (await boxOf(grid)).y;

    await map
      .locator(".leaflet-marker-icon:has(.map-marker--store)")
      .first()
      .click({ force: true });

    const panel = page.getByTestId("store-map-detail-panel");
    await expect(panel).toBeVisible();

    const panelBox = await boxOf(panel);
    const gridTopAfter = (await boxOf(grid)).y;

    expect(gridTopAfter).toBe(gridTopBefore);
    expect(panelBox.y).toBeGreaterThan(0);
    expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(844);
    expect(844 - (panelBox.y + panelBox.height)).toBeLessThanOrEqual(16);
    await expect(
      panel.evaluate((node) => node.closest(".leaflet-container") === null),
    ).resolves.toBe(true);

    await panel.getByRole("button", { name: /cerrar/i }).click();
    await expect(panel).toHaveCount(0);
  });
});
