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
import { findSuiteUserId } from "../testUtils/suiteAccount";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slice 11 de `docs/features/commerce/028-2026-09-18-pedido-enviado.md`: el estado opcional
 * "Enviado" entre "En preparación" y "Entregado".
 *
 * **Requiere que `SHIPPED` ya exista en el enum `orderstatus` de la base compartida** — la
 * migración `0057_2026-09-18_add_shipped_value_to_orderstatus_enum.py` de `bot-whatsapp` está
 * escrita pero, a la fecha de este slice, no se ha aplicado. Hasta que se aplique, este spec
 * falla al escribir el estado, no por un defecto del sitio.
 */
const TIENDA = {
  name: "E2E Tienda del Envío",
  handle: "e2e-tienda-del-envio",
  phone: "2789990199",
};

const producto = {
  title: `E2E Envío ${Date.now()}`,
  slug: testSlug("producto-para-enviar"),
  kind: "producto" as const,
  origin: null,
  price: 45,
  sellerHandle: TIENDA.handle,
};

let dbSession: DbSession | undefined;

async function attachStoreToSuite(): Promise<void> {
  const userId = await findSuiteUserId();

  await db.execute(sql`
    UPDATE sellers SET user_id = ${userId} WHERE slug = ${TIENDA.handle}
  `);
}

/** Deja un pedido recién hecho y devuelve la dirección de su ficha. */
async function placeOrder(page: Page): Promise<string> {
  await page.goto(`/${producto.slug}`);
  await page.getByTestId("post-detail").getByTestId("add-to-cart").click();
  await expect(page.getByTestId("cart-count")).toHaveText("1");
  await page.goto("/carrito");
  await page.getByTestId("cart-confirm").click();
  await expect(page.getByTestId("order-detail")).toBeVisible();

  return page.url();
}

/**
 * Lo lleva por el proceso desde el panel del vendedor, esperando a cada paso.
 *
 * **Esperar es obligatorio, no cortesía.** Cada clic manda una Server Action; navegar antes de que
 * termine (`page.goto` justo después del clic) cancela esa petición a medio camino, y el pedido se
 * queda en el paso anterior sin que ningún error lo avise.
 */
async function advance(
  page: Page,
  statuses: readonly ("CONFIRMED" | "PREPARING" | "SHIPPED")[],
): Promise<void> {
  await page.goto("/pedidos");

  for (const status of statuses) {
    await page.getByTestId(`order-action-${status}`).first().click();
    await expect(
      page.getByTestId("seller-order").first().getByTestId("order-status"),
    ).toHaveAttribute("data-status", status);
  }
}

test.beforeEach(async ({ page, browserName }) => {
  await deleteTestSellerByHandle(TIENDA.handle);
  await seedStore(TIENDA, null);
  await attachStoreToSuite();
  await seedPost(producto);
  dbSession = await simulateLogin(page, browserName);
});

test.afterEach(async () => {
  await deleteTestSellerByHandle(TIENDA.handle);
  if (dbSession?.id) {
    await deleteSession(dbSession.id);
  }
});

test.describe("Cuando el vendedor despacha un pedido con repartidor", () => {
  test("Entonces queda Enviado y sigue ofreciendo entregarlo o cancelarlo", async ({
    page,
  }) => {
    await placeOrder(page);
    await advance(page, ["CONFIRMED", "PREPARING", "SHIPPED"]);

    const status = page
      .getByTestId("seller-order")
      .first()
      .getByTestId("order-status");

    await expect(status).toHaveText("Enviado");

    // No es un final: sigue habiendo qué hacer con él.
    await expect(
      page
        .getByTestId("seller-order")
        .first()
        .getByTestId("order-action-DELIVERED"),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("seller-order")
        .first()
        .getByTestId("order-action-CANCELLED"),
    ).toBeVisible();
  });

  test("Entonces el comprador ve que va en camino, con la fecha del envío", async ({
    page,
  }) => {
    const orderUrl = await placeOrder(page);
    await advance(page, ["CONFIRMED", "PREPARING", "SHIPPED"]);

    await page.goto(orderUrl);

    await expect(page.getByTestId("order-status")).toHaveAttribute(
      "data-status",
      "SHIPPED",
    );

    const since = page.getByTestId("order-status-since");

    await expect(since).toHaveAttribute("data-status", "SHIPPED");
    await expect(since).toContainText("Enviado el");
  });
});
