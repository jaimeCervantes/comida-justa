import { expect, type Page, test } from "@playwright/test";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { readPostRowBySlug } from "../testUtils/readPostRow";
import { seedPost } from "../testUtils/seedPost";
import { seedStock } from "../testUtils/seedStock";
import { seedStore } from "../testUtils/seedStore";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { findSuiteUserId } from "../testUtils/suiteAccount";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 3: aceptar un pedido descuenta lo que lleva.
 *
 * **La tienda es de la cuenta de la suite**, como en los demás specs de pedidos: el panel del
 * vendedor sólo se pinta si la sesión es dueña de la tienda, y aquí conviene además que la misma
 * cuenta compre y venda —hace falta hacer el pedido y luego moverlo sin cambiar de sesión—.
 */
let store: ReturnType<typeof testStore>;
let session: DbSession | undefined;

/** Siembra un producto de la tienda con las existencias que pida el escenario. */
async function seedProduct(
  name: string,
  stock: number | null,
): Promise<string> {
  const slug = testSlug(name);

  await seedPost({
    title: `E2E ${name}`,
    slug,
    kind: "producto",
    origin: "hazlo_sano_propio",
    price: 40,
    sellerHandle: store.handle,
  });

  if (stock !== null) await seedStock(slug, stock);

  return slug;
}

/** Añade N unidades desde la ficha del producto. */
async function addToCart(page: Page, slug: string, units: number) {
  await page.goto(`/${slug}`);

  for (let i = 0; i < units; i += 1) {
    await page.getByTestId("post-detail").getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-count")).toHaveText(String(i + 1));
  }
}

/** Confirma el carrito y deja el pedido hecho, en `PENDING`. */
async function placeOrder(page: Page) {
  await page.goto("/carrito");
  await page.getByTestId("cart-confirm").click();
  await expect(page.getByTestId("order-detail")).toBeVisible();
}

function sellerOrder(page: Page) {
  return page.getByTestId("seller-order").first();
}

/** Pulsa un paso en el panel del vendedor, sin decidir todavía si funcionó. */
async function advance(page: Page, status: "CONFIRMED" | "CANCELLED") {
  await page.goto("/pedidos");
  await page.getByTestId(`order-action-${status}`).first().click();
}

async function stockOf(slug: string): Promise<number | null | undefined> {
  return (await readPostRowBySlug(slug))?.stock_quantity;
}

test.beforeEach(async ({ page, browserName }) => {
  store = testStore("Tienda que descuenta");
  await seedStore(store, null, await findSuiteUserId());
  session = await simulateLogin(page, browserName);
});

test.afterEach(async () => {
  // Se lleva la tienda, sus publicaciones, sus pedidos y —por cascada— su histórico.
  await deleteTestSellerByHandle(store.handle);
  if (session?.id) await deleteSession(session.id);
});

test.describe("El pedido descuenta al aceptarse", () => {
  test("Aceptar un pedido descuenta lo que lleva", async ({ page }) => {
    const slug = await seedProduct("dona-chocolate-keto", 12);

    await addToCart(page, slug, 2);
    await placeOrder(page);
    await advance(page, "CONFIRMED");

    await expect(sellerOrder(page).getByTestId("order-status")).toHaveAttribute(
      "data-status",
      "CONFIRMED",
    );
    expect(await stockOf(slug)).toBe(10);
  });

  test("No se acepta un pedido que no se puede servir", async ({ page }) => {
    const slug = await seedProduct("dona-chocolate-keto-escasa", 2);

    await addToCart(page, slug, 5);
    await placeOrder(page);
    await advance(page, "CONFIRMED");

    await expect(page.getByTestId("seller-order-error")).toContainText(
      /inventario/i,
    );
    await expect(sellerOrder(page).getByTestId("order-status")).toHaveAttribute(
      "data-status",
      "PENDING",
    );
    expect(await stockOf(slug)).toBe(2);
  });

  test("Aceptar lo último lo deja agotado para todos", async ({ page }) => {
    const slug = await seedProduct("dona-chocolate-keto-ultima", 3);

    await addToCart(page, slug, 3);
    await placeOrder(page);
    await advance(page, "CONFIRMED");

    await expect(sellerOrder(page).getByTestId("order-status")).toHaveAttribute(
      "data-status",
      "CONFIRMED",
    );
    expect(await stockOf(slug)).toBe(0);

    /* Por la regla derivada del slice 1: `is_available` sale del número, así que agotarse por un
       pedido y agotarse a mano se ven igual en la ficha, en el carrito y para el bot. */
    await page.goto(`/${slug}`);
    await expect(page.getByTestId("sold-out-badge")).toBeVisible();
    await expect(page.getByTestId("whatsapp-order")).toBeHidden();
  });

  test("Cancelar un pedido ya aceptado devuelve lo suyo", async ({ page }) => {
    const slug = await seedProduct("dona-chocolate-keto-devuelta", 12);

    await addToCart(page, slug, 2);
    await placeOrder(page);
    await advance(page, "CONFIRMED");
    await expect(sellerOrder(page).getByTestId("order-status")).toHaveAttribute(
      "data-status",
      "CONFIRMED",
    );

    await advance(page, "CANCELLED");
    await expect(page.getByTestId("seller-orders-empty")).toBeVisible();

    expect(await stockOf(slug)).toBe(12);
  });

  test("Cancelar un pedido que nunca se aceptó no devuelve nada", async ({
    page,
  }) => {
    const slug = await seedProduct("dona-chocolate-keto-intacta", 12);

    await addToCart(page, slug, 2);
    await placeOrder(page);
    await advance(page, "CANCELLED");
    await expect(page.getByTestId("seller-orders-empty")).toBeVisible();

    expect(await stockOf(slug)).toBe(12);
  });

  /* La garantía de que esto no toca a las 418 publicaciones que no llevan la cuenta. */
  test("Lo que no lleva inventario no estorba", async ({ page }) => {
    const sinInventario = await seedProduct("jugo-verde-sin-cuenta", null);
    const conInventario = await seedProduct("dona-chocolate-keto-contada", 5);

    await page.goto(`/${sinInventario}`);
    await page.getByTestId("post-detail").getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-count")).toHaveText("1");

    await page.goto(`/${conInventario}`);
    await page.getByTestId("post-detail").getByTestId("add-to-cart").click();
    await expect(page.getByTestId("cart-count")).toHaveText("2");

    await placeOrder(page);
    await advance(page, "CONFIRMED");

    await expect(sellerOrder(page).getByTestId("order-status")).toHaveAttribute(
      "data-status",
      "CONFIRMED",
    );
    expect(await stockOf(sinInventario)).toBeNull();
    expect(await stockOf(conInventario)).toBe(4);
  });
});
