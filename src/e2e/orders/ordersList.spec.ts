import { expect, type Page, test } from "@playwright/test";
import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import {
  claimUsernameFor,
  releaseUsername,
} from "../testUtils/claimTestUsername";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { seedStore } from "../testUtils/seedStore";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { findSuiteUserId } from "../testUtils/suiteAccount";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slice 6 de `docs/features/pedidos.md`: el pedido se reconoce sin abrirlo.
 *
 * **La tienda es de la cuenta de la suite**, como en `placeOrder.spec.ts` y por el mismo motivo: el
 * panel del vendedor solo se pinta si la sesión es dueña de la tienda. La consecuencia útil aquí es
 * que la misma cuenta compra y vende, así que un solo pedido sirve para mirar los dos papeles —que
 * es exactamente la situación real de hoy.
 */
const TIENDA = {
  name: "E2E Tienda de la Lista",
  handle: "e2e-tienda-de-la-lista",
  phone: "2789990088",
};

/** La dirección personal se reclama sobre la cuenta real; el prefijo `e2e-` la hace barrible. */
const USERNAME = "e2e-comprador-de-la-lista";

const suero = {
  title: `E2E Suero natural ${Date.now()}`,
  slug: testSlug("suero-de-la-lista"),
  kind: "producto" as const,
  origin: null,
  price: 35,
  sellerHandle: TIENDA.handle,
};

const pechuga = {
  title: `E2E Pechuga asada ${Date.now()}`,
  slug: testSlug("pechuga-de-la-lista"),
  kind: "producto" as const,
  origin: null,
  price: 105,
  sellerHandle: TIENDA.handle,
};

let dbSession: DbSession | undefined;
let suiteUserId: string;

async function attachStoreToSuite(): Promise<void> {
  await db.execute(sql`
    UPDATE sellers SET user_id = ${suiteUserId} WHERE slug = ${TIENDA.handle}
  `);
}

async function readSuiteName(): Promise<string> {
  const result = await db.execute(sql`
    SELECT name FROM users WHERE id = ${suiteUserId}
  `);

  return (result.rows as Array<{ name: string | null }>)[0]?.name ?? "";
}

/** Pone `cuantas` unidades del producto en el carrito y lo confirma como pedido. */
async function placeOrder(
  page: Page,
  slug: string,
  cuantas = 1,
): Promise<void> {
  await page.goto(`/${slug}`);
  await page.getByTestId("post-detail").getByTestId("add-to-cart").click();
  await expect(page.getByTestId("cart-count")).toHaveText("1");

  if (cuantas > 1) {
    await page.goto("/carrito");
    for (let i = 1; i < cuantas; i += 1) {
      await page.getByTestId("cart-increase").first().click();
      await expect(page.getByTestId("cart-count")).toHaveText(String(i + 1));
    }
  }

  await page.goto("/carrito");
  await page.getByTestId("cart-confirm").click();
  await expect(page.getByTestId("order-detail")).toBeVisible();
}

/** La lista, en la pestaña de lo que uno pidió. */
async function openPlaced(page: Page): Promise<void> {
  await page.goto("/pedidos");
  await page.getByTestId("orders-tab-placed").click();
  await expect(page.getByTestId("orders-placed")).toBeVisible();
}

test.beforeEach(async ({ page, browserName }) => {
  await deleteTestSellerByHandle(TIENDA.handle);
  suiteUserId = await findSuiteUserId();
  await seedStore(TIENDA, null);
  await attachStoreToSuite();
  await seedPost(suero);
  await seedPost(pechuga);
  await claimUsernameFor(suiteUserId, USERNAME);
  dbSession = await simulateLogin(page, browserName);
});

test.afterEach(async () => {
  await deleteTestSellerByHandle(TIENDA.handle);
  await releaseUsername(USERNAME);
  if (dbSession?.id) {
    await deleteSession(dbSession.id);
  }
});

test.describe("Cuando miro lo que he pedido", () => {
  test("Entonces distingo un pedido de otro sin abrir ninguno", async ({
    page,
  }) => {
    await placeOrder(page, suero.slug, 6);

    await openPlaced(page);

    const card = page.getByTestId("buyer-order").first();

    /* Lo que la lista NO enseñaba: qué se pidió, cuánto de cada cosa y cuánto suma. Con cuatro
       pedidos a la misma tienda y todos Pendientes, era lo único capaz de distinguirlos. */
    await expect(card.getByTestId("order-lines")).toContainText(
      `6 × ${suero.title}`,
    );
    await expect(card.getByTestId("order-item-count")).toContainText(
      "6 artículos",
    );
    await expect(card.getByTestId("order-total")).toContainText("210");
    // La miniatura sale de la publicación de hoy, no del pedido: `seedPost` siembra un archivo.
    await expect(card.getByTestId("order-line-image").first()).toBeVisible();

    /* La tarjeta dejó de ser un enlace entero —los renglones llevan a su producto, y un enlace no
       puede llevar enlaces dentro—, así que el destino se nombra al pie. */
    await card.getByTestId("buyer-order-link").click();
    await expect(page.getByTestId("order-detail")).toBeVisible();
  });

  test("Entonces desde la lista salto al producto que pedí", async ({
    page,
  }) => {
    await placeOrder(page, suero.slug);

    await openPlaced(page);

    await page
      .getByTestId("buyer-order")
      .first()
      .getByTestId("order-line-link")
      .first()
      .click();

    await expect(page.getByTestId("post-detail")).toContainText(suero.title);
  });
});

test.describe("Cuando miro lo que me han pedido", () => {
  test("Entonces veo a quién le estoy preparando el pedido", async ({
    page,
  }) => {
    await placeOrder(page, suero.slug);
    const nombre = await readSuiteName();

    await page.goto("/pedidos");
    await expect(page.getByTestId("orders-received")).toBeVisible();

    const buyer = page
      .getByTestId("seller-order")
      .first()
      .getByTestId("order-buyer");

    await expect(buyer).toContainText(nombre);
    // Con `username` hay perfil al que ir; el enlace es la mitad útil de saber quién pidió.
    await expect(buyer).toHaveAttribute("href", `/u/${USERNAME}`);
  });

  test("Entonces también lo dice al abrir el pedido", async ({ page }) => {
    await placeOrder(page, suero.slug);
    const nombre = await readSuiteName();
    const orderUrl = page.url();

    await page.goto("/pedidos");
    await page
      .getByTestId("seller-order")
      .first()
      .getByTestId("order-buyer")
      .waitFor();

    await page.goto(orderUrl);

    /* La misma cuenta compra y vende, así que esta página la abre como comprador —`isBuyer` gana la
       condición— y ahí NO se dice quién pidió: decirle que lo pidió él no le informa de nada. */
    await expect(page.getByTestId("order-detail")).toBeVisible();
    await expect(page.getByTestId("order-buyer")).toHaveCount(0);
    await expect(page.getByTestId("order-notify")).toBeVisible();

    // Y el nombre sí está donde le toca: en la lista de lo que le han pedido.
    await page.goto("/pedidos");
    await expect(page.getByTestId("order-buyer").first()).toContainText(nombre);
  });
});

test.describe("Cuando busco en mis pedidos", () => {
  test("Entonces la lista se filtra mientras escribo, sin pulsar Enter", async ({
    page,
  }) => {
    await placeOrder(page, suero.slug);
    await placeOrder(page, pechuga.slug);

    await openPlaced(page);
    await expect(page.getByTestId("buyer-order")).toHaveCount(2);

    // Se escribe y no se manda: es justo lo que antes no hacía nada.
    await page.getByTestId("orders-search").fill("suero");

    await expect(page.getByTestId("buyer-order")).toHaveCount(1);
    await expect(page.getByTestId("buyer-order")).toContainText(suero.title);
    // La pestaña no se pierde por buscar, y la página vuelve a la primera.
    await expect(page).toHaveURL(/vista=placed/);
    await expect(page).toHaveURL(/q=suero/);
    await expect(page).not.toHaveURL(/pagina=/);
  });
});
