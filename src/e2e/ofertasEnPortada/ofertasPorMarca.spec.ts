import { expect, type Page, test } from "@playwright/test";
import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { seedStore } from "../testUtils/seedStore";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slice 2 de `docs/features/commerce/032-2026-10-21-ofertas-en-portada.md`: un slide por marca.
 * Escenarios en `ofertasEnPortada.feature`.
 *
 * La marca lleva la hora en el nombre para no competir con ninguna real ni con la de otra corrida.
 * La tienda se siembra con handle fijo y se borra antes y después, como en `promociones.spec.ts`;
 * el producto lo publica la cuenta de la suite, así que la misma sesión lo puede editar.
 */
const TIENDA = {
  name: "E2E Tienda de Ofertas por Marca",
  handle: "e2e-tienda-ofertas-por-marca",
  phone: "2789990069",
};

let brand: string;
let miel: { title: string; slug: string };
let mielKilo: { title: string; slug: string };
let panela: { title: string; slug: string };
let dbSession: DbSession | undefined;

async function update(
  slug: string,
  values: { salePrice?: number | null; brand?: string | null },
): Promise<void> {
  const id = sql`(SELECT post_id FROM post_translations WHERE slug = ${slug})`;

  if (values.salePrice !== undefined) {
    await db.execute(
      /* Con piezas registradas: el carrusel solo anuncia eso (`canBeAdvertised`). */
      sql`UPDATE posts SET sale_price = ${values.salePrice}, stock_quantity = 10 WHERE id IN ${id}`,
    );
  }
  if (values.brand !== undefined) {
    await db.execute(
      sql`UPDATE posts SET brand = ${values.brand} WHERE id IN ${id}`,
    );
  }
}

async function readBrand(slug: string): Promise<string | null> {
  const result = await db.execute(sql`
    SELECT p.brand FROM posts p JOIN post_translations t ON t.post_id = p.id
    WHERE t.slug = ${slug}
  `);

  return (result.rows[0] as { brand: string | null }).brand;
}

/** La llave del slide de la marca: la misma que arma `groupBannerPromotions`. */
function brandSlide(page: Page) {
  return page.locator(
    `[data-testid="home-offers-banner"][data-slide="brand:${brand.toLocaleLowerCase("es")}"]`,
  );
}

test.beforeEach(async ({ page, browserName }) => {
  await deleteTestSellerByHandle(TIENDA.handle);
  await seedStore(TIENDA, null);
  const stamp = Date.now();
  brand = `E2E Apis ${stamp}`;
  miel = {
    title: `E2E Miel de abeja 500 g ${stamp}`,
    slug: testSlug("miel-500-g"),
  };
  mielKilo = {
    title: `E2E Miel de abeja 1 kg ${stamp}`,
    slug: testSlug("miel-1-kg"),
  };
  panela = { title: `E2E Panela 1 kg ${stamp}`, slug: testSlug("panela") };
  for (const [post, price] of [
    [miel, 180],
    [mielKilo, 320],
    [panela, 90],
  ] as const) {
    await seedPost({
      ...post,
      kind: "producto",
      origin: "productor",
      price,
      sellerHandle: TIENDA.handle,
    });
  }
  dbSession = await simulateLogin(page, browserName);
});

test.afterEach(async () => {
  // Se lleva la tienda y sus publicaciones.
  await deleteTestSellerByHandle(TIENDA.handle);
  if (dbSession?.id) await deleteSession(dbSession.id);
});

test.describe("Ofertas por marca", () => {
  test("Una marca con varias ofertas tiene su slide, que lleva a sus ofertas", async ({
    page,
  }) => {
    await update(miel.slug, { salePrice: 150, brand });
    await update(mielKilo.slug, { salePrice: 280, brand });

    await page.goto("/");

    const slide = brandSlide(page);

    await expect(slide).toHaveCount(1);
    const href = String(await slide.getAttribute("href"));
    const query = new URL(href, "http://localhost").searchParams;
    expect(query.get("promocion")).toBe("1");
    expect(query.get("marca")).toBe(brand);

    const image = slide.getByTestId("home-offers-banner-image");
    await expect(image).toHaveAttribute("alt", new RegExp(miel.title));
    await expect(image).toHaveAttribute("alt", new RegExp(mielKilo.title));
    const response = await page.request.get(
      String(await image.getAttribute("src")),
    );
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/webp");
  });

  test("Una marca con una sola oferta no tiene slide propio", async ({
    page,
  }) => {
    await update(miel.slug, { salePrice: 150, brand });
    await update(mielKilo.slug, { brand });

    await page.goto("/");

    await expect(page.getByTestId("home-offers")).toBeVisible();
    await expect(brandSlide(page)).toHaveCount(0);
  });

  test("El catálogo se filtra por marca", async ({ page }) => {
    await update(miel.slug, { salePrice: 150, brand });
    await update(panela.slug, { salePrice: 80 });

    await page.goto(
      `/productos?promocion=1&marca=${encodeURIComponent(brand)}`,
    );

    const grid = page.getByTestId("products-grid");

    await expect(page.getByTestId("products-group-filter")).toContainText(
      brand,
    );
    await expect(
      grid.locator("article").filter({ hasText: miel.title }),
    ).toBeVisible();
    await expect(
      grid.locator("article").filter({ hasText: panela.title }),
    ).toHaveCount(0);
  });

  test("El vendedor pone la marca al editar un producto", async ({ page }) => {
    await page.goto(`/editar/${miel.slug}`);
    await page.getByLabel(/^marca/i).fill(`  ${brand.replace(" ", "   ")} `);
    await page.getByRole("button", { name: /guardar cambios/i }).click();
    await page.waitForURL(`/${miel.slug}`);

    expect(await readBrand(miel.slug)).toBe(brand);
  });

  test("El carrusel de ofertas se mueve con sus controles", async ({
    page,
  }) => {
    await update(miel.slug, { salePrice: 150, brand });
    await update(mielKilo.slug, { salePrice: 280, brand });

    await page.goto("/");

    const carousel = page.getByTestId("home-offers-carousel");
    const slides = carousel.getByTestId("home-offers-carousel-slide");

    await expect(slides.first()).toBeVisible();
    await carousel.getByTestId("home-offers-carousel-next").click();

    await expect(slides.first()).toBeHidden();
    await expect(slides.nth(1)).toBeVisible();
  });
});
