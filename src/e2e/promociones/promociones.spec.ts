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
 * Slices 1 a 4 de `docs/features/commerce/031-2026-10-20-promociones.md`. Escenarios en
 * `promociones.feature`.
 *
 * La tienda se siembra con handle fijo y se borra antes y después de cada prueba, igual que en
 * `orders/placeOrder.spec.ts`: el carrito solo acepta productos con tienda. El producto lo publica
 * la cuenta de la suite, así que la misma sesión lo puede editar.
 */
const TIENDA = {
  name: "E2E Tienda de Promociones",
  handle: "e2e-tienda-de-promociones",
  phone: "2789990066",
};

const DAY_MS = 24 * 60 * 60 * 1000;

let dbSession: DbSession | undefined;
let miel: { title: string; slug: string };
/* Una palabra que solo tiene esta publicación, para que la búsqueda no compita con el catálogo real
   (igual que `orders/cartFromSearch.spec.ts`). */
let token: string;

async function setPromotion(
  salePrice: number | null,
  saleEndsAt: Date | null = null,
): Promise<void> {
  await db.execute(sql`
    UPDATE posts SET sale_price = ${salePrice}, sale_ends_at = ${saleEndsAt}
    WHERE id IN (SELECT post_id FROM post_translations WHERE slug = ${miel.slug})
  `);
}

async function readPromotion(): Promise<{
  sale_price: string | null;
  sale_ends_at: Date | null;
}> {
  const result = await db.execute(sql`
    SELECT p.sale_price::text, p.sale_ends_at
    FROM posts p JOIN post_translations t ON t.post_id = p.id
    WHERE t.slug = ${miel.slug}
  `);

  return result.rows[0] as {
    sale_price: string | null;
    sale_ends_at: Date | null;
  };
}

async function editSalePrice(page: Page, salePrice: string, endsAt = "") {
  await page.goto(`/editar/${miel.slug}`);
  await page.getByLabel(/precio rebajado/i).fill(salePrice);
  await page.getByLabel(/la promoción termina/i).fill(endsAt);
  await page.getByRole("button", { name: /guardar cambios/i }).click();
}

/** `YYYY-MM-DDTHH:mm` de mañana, como lo pide un `datetime-local`. */
function tomorrowLocal(): string {
  const tomorrow = new Date(Date.now() + DAY_MS);
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T12:00`;
}

test.beforeEach(async ({ page, browserName }) => {
  await deleteTestSellerByHandle(TIENDA.handle);
  await seedStore(TIENDA, null);
  token = `mielpromo${Date.now()}`;
  miel = {
    title: `E2E Miel de abeja 500 g ${token}`,
    slug: testSlug("miel-de-abeja-500-g"),
  };
  await seedPost({
    ...miel,
    kind: "producto",
    origin: "productor",
    price: 180,
    sellerHandle: TIENDA.handle,
  });
  dbSession = await simulateLogin(page, browserName);
});

test.afterEach(async () => {
  // Se lleva la tienda, sus publicaciones y sus pedidos.
  await deleteTestSellerByHandle(TIENDA.handle);
  if (dbSession?.id) await deleteSession(dbSession.id);
});

test.describe("Promociones con precio rebajado", () => {
  test("El vendedor pone una promoción y el comprador la ve en la ficha", async ({
    page,
  }) => {
    await editSalePrice(page, "150");
    await page.waitForURL(`/${miel.slug}`);

    const detail = page.getByTestId("post-detail");

    await expect(detail.getByTestId("promotion-regular-price")).toContainText(
      "180",
    );
    await expect(detail.getByTestId("promotion-sale-price")).toContainText(
      "150",
    );
    await expect(detail.getByTestId("promotion-discount")).toHaveText("-17%");
  });

  test("Con fecha de fin, la ficha dice hasta cuándo dura", async ({
    page,
  }) => {
    await editSalePrice(page, "150", tomorrowLocal());
    await page.waitForURL(`/${miel.slug}`);

    const detail = page.getByTestId("post-detail");

    await expect(detail.getByTestId("promotion-sale-price")).toContainText(
      "150",
    );
    await expect(detail.getByTestId("promotion-ends")).toContainText(
      /hasta el/i,
    );
    expect((await readPromotion()).sale_ends_at).not.toBeNull();
  });

  test("El pedido cobra el precio de promoción", async ({ page }) => {
    await setPromotion(150);

    await page.goto(`/${miel.slug}`);
    await page.getByTestId("post-detail").getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-count")).toHaveText("1");

    await page.goto("/carrito");
    await page.getByTestId("cart-increase").click();
    await expect(page.getByTestId("cart-quantity")).toHaveValue("2");
    await expect(page.getByTestId("cart-group-subtotal")).toContainText("300");

    await page.getByTestId("cart-confirm").click();
    await expect(page.getByTestId("order-detail")).toBeVisible();
    await expect(page.getByTestId("order-total")).toContainText("300");

    const result = await db.execute(sql`
      SELECT i.unit_price::text AS unit_price
      FROM customer_order_items i
      JOIN post_translations t ON t.post_id = i.post_id
      WHERE t.slug = ${miel.slug}
    `);

    expect(result.rows).toEqual([{ unit_price: "150" }]);
  });

  test("Una promoción vencida ya no se muestra ni se cobra", async ({
    page,
  }) => {
    await setPromotion(150, new Date(Date.now() - DAY_MS));

    await page.goto(`/${miel.slug}`);

    const detail = page.getByTestId("post-detail");

    await expect(detail).toContainText("180");
    await expect(detail.getByTestId("promotion-price")).toHaveCount(0);

    await detail.getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-count")).toHaveText("1");
    await page.goto("/carrito");
    await expect(page.getByTestId("cart-group-subtotal")).toContainText("180");
  });

  test("La promoción no puede costar lo mismo o más que el precio normal", async ({
    page,
  }) => {
    await editSalePrice(page, "180");

    await expect(page.getByText(/menor al precio normal/i)).toBeVisible();
    expect((await readPromotion()).sale_price).toBeNull();
  });

  test("Quitar el precio de promoción quita la promoción", async ({ page }) => {
    await setPromotion(150);

    await editSalePrice(page, "");
    await page.waitForURL(`/${miel.slug}`);

    await expect(
      page.getByTestId("post-detail").getByTestId("promotion-price"),
    ).toHaveCount(0);
    expect((await readPromotion()).sale_price).toBeNull();
  });
});

test.describe("Promociones en tarjetas y en el carrito", () => {
  function cardOf(page: Page) {
    return page.locator("article").filter({ hasText: miel.title });
  }

  async function expectSaleBadge(page: Page) {
    const card = cardOf(page);

    await expect(card.getByTestId("promotion-regular-price")).toContainText(
      "180",
    );
    await expect(card.getByTestId("promotion-sale-price")).toContainText("150");
    await expect(card.getByTestId("promotion-discount")).toHaveText("-17%");
    await expect(card.getByTestId("promotion-ribbon")).toHaveText(
      "Promoción · -17%",
    );
  }

  test("La tarjeta del catálogo de la tienda muestra la insignia de descuento", async ({
    page,
  }) => {
    await setPromotion(150, new Date(Date.now() + DAY_MS));

    await page.goto(`/tienda/${TIENDA.handle}`);

    await expectSaleBadge(page);
    /* La fecha de fin se queda en la ficha: en la tarjeta no cabe. */
    await expect(cardOf(page).getByTestId("promotion-ends")).toHaveCount(0);
  });

  test("La tarjeta de un resultado de búsqueda muestra la insignia de descuento", async ({
    page,
  }) => {
    await setPromotion(150);

    await page.goto(`/buscar?q=${token}&page=1`);

    await expectSaleBadge(page);
  });

  test("Una tarjeta no anuncia una promoción vencida", async ({ page }) => {
    await setPromotion(150, new Date(Date.now() - DAY_MS));

    await page.goto(`/tienda/${TIENDA.handle}`);

    const card = cardOf(page);

    await expect(card).toContainText("180");
    await expect(card.getByTestId("promotion-price")).toHaveCount(0);
    await expect(card.getByTestId("promotion-ribbon")).toHaveCount(0);
  });

  test("El carrito tacha lo que habría costado sin la promoción", async ({
    page,
  }) => {
    await setPromotion(150);

    await page.goto(`/${miel.slug}`);
    await page.getByTestId("post-detail").getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-count")).toHaveText("1");

    await page.goto("/carrito");
    await page.getByTestId("cart-increase").click();
    await expect(page.getByTestId("cart-quantity")).toHaveValue("2");

    const line = page.getByTestId("cart-line");

    await expect(line.getByTestId("cart-line-regular-amount")).toContainText(
      "360",
    );
    await expect(page.getByTestId("cart-group-subtotal")).toContainText("300");
  });
});

test.describe("El filtro «En promoción» de los productos", () => {
  test("El filtro «En promoción» muestra solo lo rebajado", async ({
    page,
  }) => {
    const panela = {
      title: `E2E Panela 1 kg ${token}`,
      slug: testSlug("panela-1-kg"),
    };

    await seedPost({
      ...panela,
      kind: "producto",
      origin: "productor",
      price: 90,
      sellerHandle: TIENDA.handle,
    });
    await setPromotion(150);

    await page.goto("/productos");
    await page.getByTestId("products-on-sale-filter").click();
    await page.waitForURL(/[?&]promocion=1/);

    const grid = page.getByTestId("products-grid");

    await expect(page.getByTestId("products-on-sale-filter")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      grid.locator("article").filter({ hasText: miel.title }),
    ).toBeVisible();
    await expect(
      grid.locator("article").filter({ hasText: panela.title }),
    ).toHaveCount(0);
  });

  test("Una promoción vencida no entra al filtro", async ({ page }) => {
    await setPromotion(150, new Date(Date.now() - DAY_MS));

    await page.goto("/productos?promocion=1");

    await expect(page.getByTestId("products-on-sale-filter")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      page.locator("article").filter({ hasText: miel.title }),
    ).toHaveCount(0);
  });
});

test.describe("El precio de oferta para los buscadores", () => {
  test("Los buscadores reciben el precio de oferta", async ({ page }) => {
    /* 23:00 en México (UTC-6, sin horario de verano desde 2022): el día que se declara es el de la
       comunidad, aunque en UTC ya sea el 1 de diciembre. */
    await setPromotion(150, new Date("2030-11-30T23:00:00-06:00"));

    await page.goto(`/${miel.slug}`);

    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const nodes = blocks.flatMap((block) => {
      const parsed = JSON.parse(block);

      return Array.isArray(parsed) ? parsed : [parsed];
    });
    const product = nodes.find((node) => node["@type"] === "Product");

    expect(product).toMatchObject({
      offers: {
        "@type": "Offer",
        price: "150",
        priceValidUntil: "2030-11-30",
      },
    });
  });
});
