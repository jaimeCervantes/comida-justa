import { expect, type Locator, type Page, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { seedPromotion } from "../testUtils/seedPromotion";
import { seedStock } from "../testUtils/seedStock";
import { seedStore } from "../testUtils/seedStore";
import { findUserIdByEmail } from "../testUtils/suiteAccount";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 4 de `docs/features/catalog/005-2026-11-10-filtros-del-catalogo.md`: «En promoción» en la
 * barra de cada listado.
 *
 * Los títulos llevan una palabra que solo existe en esta corrida, para que la búsqueda no compita
 * con las ofertas reales de la base compartida (igual que `promociones.spec.ts`).
 */
const CATEGORY = "salsas_y_aderezos";
const STORE_OWNER_EMAIL = "danielsrodroguez@gmail.com";

let token: string;
let store: ReturnType<typeof testStore> | null = null;
const seeded: string[] = [];

/** Un producto con piezas y, si se pide, con una promoción vigente. */
async function seed(
  name: string,
  {
    salePrice,
    sellerHandle,
  }: { salePrice?: number; sellerHandle?: string } = {},
): Promise<string> {
  const title = `E2E ${name} ${token}`;
  const slug = testSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  seeded.push(slug);

  await seedPost({
    title,
    slug,
    kind: "producto",
    origin: "productor",
    price: 85,
    category: "alimentacion",
    subCategory: CATEGORY,
    ...(sellerHandle ? { sellerHandle } : {}),
  });
  await seedStock(slug, 8);
  if (salePrice !== undefined) await seedPromotion(slug, salePrice);

  return title;
}

test.beforeEach(() => {
  token = `promofiltro${Date.now()}`;
});

test.afterEach(async () => {
  for (const slug of seeded.splice(0)) await deleteOnePostBySlug(slug);
  if (store) {
    await deleteTestSellerByHandle(store.handle);
    store = null;
  }
});

test.describe("Un solo conjunto de filtros: «En promoción»", () => {
  // Escenario "En una categoría, «En promoción» deja solo lo que tiene oferta vigente" (@slice-4)
  test("En una categoría, deja solo lo que tiene oferta vigente", async ({
    page,
  }) => {
    const salsa = await seed("Salsa macha de cacahuate", { salePrice: 70 });
    const aderezo = await seed("Aderezo de chipotle");

    await page.goto(`/categoria/${CATEGORY}`);
    await expect(card(page, "category-grid", aderezo)).toBeVisible();

    await onSale(page, "listing-filters", "filter").click();

    await expect(page).toHaveURL(/promocion=1/);
    await expect(onSale(page, "listing-filters", "filter")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(card(page, "category-grid", salsa)).toBeVisible();
    await expect(card(page, "category-grid", aderezo)).toHaveCount(0);
  });

  // Escenario "En la búsqueda, «En promoción» es una faceta más y se quita desde el resumen" (@slice-4)
  test("En la búsqueda, es una faceta más y se quita desde el resumen", async ({
    page,
  }) => {
    const salsa = await seed("Salsa macha de cacahuate", { salePrice: 70 });
    const aderezo = await seed("Aderezo de chipotle");

    await page.goto(`/buscar?q=${token}`);
    await expect(card(page, "search-results", aderezo)).toBeVisible();

    await onSale(page, "search-facets", "facet").click();

    await expect(page).toHaveURL(/promocion=1/);
    await expect(card(page, "search-results", salsa)).toBeVisible();
    await expect(card(page, "search-results", aderezo)).toHaveCount(0);

    await page.getByTestId("chip-on-sale").click();

    await expect(page).not.toHaveURL(/promocion=/);
    await expect(card(page, "search-results", salsa)).toBeVisible();
    await expect(card(page, "search-results", aderezo)).toBeVisible();
  });

  // Escenario "En la tienda, «En promoción» se combina con «Solo con existencia»" (@slice-4)
  test("En la tienda, se combina con «Solo con existencia»", async ({
    page,
  }) => {
    store = testStore("Tienda de las ofertas");
    await seedStore(store, null, await findUserIdByEmail(STORE_OWNER_EMAIL));
    const fresa = await seed("Mermelada de fresa", {
      salePrice: 60,
      sellerHandle: store.handle,
    });
    const miel = await seed("Miel de abeja melipona", {
      sellerHandle: store.handle,
    });

    await page.goto(`/tienda/${store.handle}?disponibles=1`);
    await expect(card(page, "store-catalog", miel)).toBeVisible();

    await onSale(page, "listing-filters", "filter").click();

    await expect(page).toHaveURL(/promocion=1/);
    await expect(page).toHaveURL(/disponibles=1/);
    await expect(card(page, "store-catalog", fresa)).toBeVisible();
    await expect(card(page, "store-catalog", miel)).toHaveCount(0);
  });
});

function onSale(page: Page, bar: string, prefix: string): Locator {
  return page.getByTestId(bar).getByTestId(`${prefix}-on-sale`);
}

function card(page: Page, grid: string, title: string): Locator {
  return page.getByTestId(grid).locator("article").filter({ hasText: title });
}
