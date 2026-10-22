import { expect, type Page, test } from "@playwright/test";
import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { seedStore } from "../testUtils/seedStore";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slice 1 de `docs/features/commerce/032-2026-10-21-ofertas-en-portada.md`. Escenarios en
 * `ofertasEnPortada.feature`.
 *
 * La tienda se siembra con handle fijo y se borra antes y después de cada prueba, como en
 * `promociones.spec.ts`. En la base compartida hay promociones reales, así que ningún escenario
 * afirma que la tarjeta no exista: solo lo que se puede decir de la promoción sembrada.
 */
const TIENDA = {
  name: "E2E Tienda de Ofertas en Portada",
  handle: "e2e-tienda-ofertas-portada",
  phone: "2789990068",
};

const DAY_MS = 24 * 60 * 60 * 1000;

const PANTALLAS = [
  { pantalla: "escritorio (1366 px)", width: 1366, formato: "ancho" },
  { pantalla: "teléfono (390 px)", width: 390, formato: "compacto" },
] as const;

let miel: { title: string; slug: string };

async function setPromotion(
  salePrice: number | null,
  saleEndsAt: Date | null = null,
): Promise<void> {
  await db.execute(sql`
    UPDATE posts SET sale_price = ${salePrice}, sale_ends_at = ${saleEndsAt}
    WHERE id IN (SELECT post_id FROM post_translations WHERE slug = ${miel.slug})
  `);
}

/**
 * La imagen del banner **general**. Desde el slice 2 el carrusel puede traer más slides —uno por
 * marca o por tienda—: con la miel sembrada en otra tienda, las ofertas reales de Hazlo Sano ya
 * forman su propio grupo. Lo que estos escenarios miran es el general.
 */
function bannerImage(page: Page) {
  return page
    .getByTestId("home-offers")
    .locator('[data-testid="home-offers-banner"][data-slide="general"]')
    .getByTestId("home-offers-banner-image");
}

/** La imagen que de verdad bajó el navegador, que con `<picture>` depende del ancho. */
function loadedSource(page: Page): Promise<string> {
  return bannerImage(page).evaluate((img: HTMLImageElement) => img.currentSrc);
}

test.beforeEach(async () => {
  await deleteTestSellerByHandle(TIENDA.handle);
  await seedStore(TIENDA, null);
  miel = {
    title: `E2E Miel de abeja 500 g ${Date.now()}`,
    slug: testSlug("miel-de-abeja-500-g"),
  };
  await seedPost({
    ...miel,
    kind: "producto",
    origin: "productor",
    price: 180,
    sellerHandle: TIENDA.handle,
  });
});

test.afterEach(async () => {
  // Se lleva la tienda y sus publicaciones.
  await deleteTestSellerByHandle(TIENDA.handle);
});

test.describe("Ofertas en la portada", () => {
  for (const { pantalla, width, formato } of PANTALLAS) {
    test(`Con ofertas, el carrusel ocupa el lugar del hero — ${pantalla}`, async ({
      page,
    }) => {
      await setPromotion(150);
      await page.setViewportSize({ width, height: 900 });

      await page.goto("/");

      const offers = page.getByTestId("home-offers");
      const grid = page.getByTestId("feed-masonry");

      await expect(offers).toBeVisible();
      await expect(page.getByTestId("home-cover")).toHaveCount(0);
      /* Sin el hero, la página conserva su titular: un solo h1, aunque no se vea. */
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      const [offersBox, gridBox] = await Promise.all([
        offers.boundingBox(),
        grid.boundingBox(),
      ]);
      /* Arriba de todo, y a todo el ancho del contenido: el mismo que la rejilla del feed. */
      expect(offersBox?.y ?? 0).toBeLessThan(gridBox?.y ?? 0);
      expect(
        Math.abs((offersBox?.width ?? 0) - (gridBox?.width ?? 0)),
      ).toBeLessThanOrEqual(2);

      await expect(bannerImage(page)).toHaveAttribute(
        "alt",
        new RegExp(`${miel.title} -17%`),
      );
      await expect
        .poll(() => loadedSource(page))
        .toContain(`formato=${formato}`);
      await expect(
        offers.locator(
          '[data-testid="home-offers-banner"][data-slide="general"]',
        ),
      ).toHaveAttribute("href", "/productos?promocion=1");
    });
  }

  test("Las imágenes del banner son imágenes de verdad", async ({ page }) => {
    await setPromotion(150);

    for (const formato of ["ancho", "compacto"]) {
      const response = await page.request.get(
        `/api/ofertas/banner?locale=es&formato=${formato}`,
      );

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toBe("image/png");
      /* La firma de un PNG: los ocho bytes con los que empieza cualquier archivo PNG. */
      expect([...(await response.body()).subarray(0, 8)]).toEqual([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
    }
  });

  test("El banner cambia de dirección cuando cambia la promoción", async ({
    page,
  }) => {
    await setPromotion(150);
    await page.goto("/");
    const before = await bannerImage(page).getAttribute("src");

    await setPromotion(140);
    await page.reload();

    await expect(bannerImage(page)).not.toHaveAttribute("src", String(before));
  });

  test("Una promoción vencida no entra al banner", async ({ page }) => {
    await setPromotion(150, new Date(Date.now() - DAY_MS));

    await page.goto("/");

    /* Solo el banner: la tarjeta del feed también lleva el título como `alt`, y esa sí debe seguir
       nombrando el producto. */
    await expect(page.getByRole("heading", { level: 1 })).toBeAttached();
    await expect(
      page.locator(
        `[data-testid="home-offers-banner-image"][alt*="${miel.title}"]`,
      ),
    ).toHaveCount(0);
  });
});
