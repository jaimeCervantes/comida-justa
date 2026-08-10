import { expect, type Page, test } from "@playwright/test";
import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slice 2 de `docs/features/pedidos.md`.
 *
 * **Se salta entero mientras la migración `0032` no esté aplicada.** El esquema lo administra
 * Alembic en el backend del bot, así que este repositorio no puede crearlo ni darlo por hecho: sin
 * `customer_orders` estos escenarios fallarían por una tabla que falta, no por un defecto. En cuanto
 * la migración corra, dejan de saltarse solos.
 */
const HAZLO_SANO = "hazlo-sano";

const producto = {
  title: `E2E Pedido ${Date.now()}`,
  slug: testSlug("producto-para-pedir"),
  kind: "producto" as const,
  origin: null,
  price: 50,
  sellerHandle: HAZLO_SANO,
};

let schemaReady = false;
let dbSession: DbSession | undefined;

async function customerOrdersExists(): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT to_regclass('public.customer_orders') IS NOT NULL AS ready
  `);

  return Boolean((result.rows as Array<{ ready: boolean }>)[0]?.ready);
}

/** Borra los pedidos que deja la suite, por el producto que sembró. */
async function deleteOrdersOf(slug: string): Promise<void> {
  if (!schemaReady) return;

  await db.execute(sql`
    DELETE FROM customer_orders
    WHERE id IN (
      SELECT i.order_id
      FROM customer_order_items i
      JOIN post_translations t ON t.post_id = i.post_id
      WHERE t.slug = ${slug}
    )
  `);
}

async function addToCart(page: Page, slug: string): Promise<void> {
  await page.goto(`/${slug}`);
  await page.getByTestId("post-detail").getByTestId("add-to-cart").click();
  await expect(page.getByTestId("cart-count")).toHaveText("1");
}

test.beforeAll(async () => {
  schemaReady = await customerOrdersExists();
});

test.beforeEach(async ({ page, browserName }) => {
  test.skip(
    !schemaReady,
    "Falta aplicar la migración Alembic 0032 (customer_orders).",
  );
  dbSession = await simulateLogin(page, browserName);
  await seedPost(producto);
});

test.afterEach(async () => {
  await deleteOrdersOf(producto.slug);
  await deleteOnePostBySlug(producto.slug);
  if (dbSession?.id) {
    await deleteSession(dbSession.id);
  }
});

test.describe("Cuando el comprador confirma su carrito", () => {
  test("Entonces el pedido queda registrado y su página deja avisar a la tienda", async ({
    page,
  }) => {
    await addToCart(page, producto.slug);

    await page.goto("/carrito");
    await page.getByTestId("cart-confirm").click();

    // Se sale del carrito a la página del pedido.
    await expect(page.getByTestId("order-detail")).toBeVisible();
    await expect(page.getByTestId("order-status")).toHaveAttribute(
      "data-status",
      "PENDING",
    );
    await expect(page.getByTestId("order-lines")).toContainText(producto.title);
    await expect(page.getByTestId("order-total")).toContainText("50");

    // El aviso es un enlace normal: se abre con un clic de verdad, no con `window.open`.
    const href = await page.getByTestId("order-notify").getAttribute("href");

    expect(href).toContain("wa.me/522781126948");

    const message = decodeURIComponent(
      new URL(href ?? "").searchParams.get("text") ?? "",
    );

    expect(message).toContain(`1 × ${producto.title} — $50`);
    expect(message).toContain("Total: $50");
    // Un solo enlace, el del pedido: el vendedor abre eso y ve todo.
    expect(message).toContain("/pedido/");

    // Y el carrito se quedó sin ese renglón, porque ya está pedido.
    await page.goto("/carrito");
    await expect(page.getByTestId("cart-empty")).toBeVisible();
  });

  test("Entonces el precio del pedido no se mueve aunque el catálogo suba", async ({
    page,
  }) => {
    await addToCart(page, producto.slug);

    await page.goto("/carrito");
    await page.getByTestId("cart-confirm").click();
    await expect(page.getByTestId("order-total")).toContainText("50");

    const orderUrl = page.url();

    await db.execute(sql`
      UPDATE posts SET price = 80
      WHERE id IN (
        SELECT post_id FROM post_translations WHERE slug = ${producto.slug}
      )
    `);

    await page.goto(orderUrl);

    // El renglón guarda una copia, no una referencia.
    await expect(page.getByTestId("order-total")).toContainText("50");

    await page.goto(`/${producto.slug}`);
    await expect(page.getByTestId("post-detail")).toContainText("80");
  });
});

test.describe("Cuando el vendedor administra lo que le pidieron", () => {
  test("Entonces lo lleva de pendiente a entregado y ahí se acaba", async ({
    page,
  }) => {
    await addToCart(page, producto.slug);

    await page.goto("/carrito");
    await page.getByTestId("cart-confirm").click();
    await expect(page.getByTestId("order-detail")).toBeVisible();

    /* La cuenta de la suite es la dueña de la tienda sembrada, así que compra y vende: en una base
       con un solo vendedor es la única forma de recorrer el proceso sin inventar una segunda
       cuenta. Lo que se comprueba —las transiciones y que el botón desaparezca— no depende de que
       sean personas distintas. */
    await page.goto("/cuenta");
    await expect(page.getByTestId("seller-orders")).toBeVisible();

    for (const status of ["CONFIRMED", "PREPARING", "DELIVERED"] as const) {
      await page.getByTestId(`order-action-${status}`).first().click();
      await expect(page.getByTestId("order-status").first()).toHaveAttribute(
        "data-status",
        status,
      );
    }

    // Entregado es final: no queda ninguna acción que ofrecer.
    await expect(page.getByTestId("order-action-CANCELLED")).toHaveCount(0);
    await expect(page.getByTestId("order-action-PREPARING")).toHaveCount(0);
  });
});

test.describe("Cuando quien confirma no ha iniciado sesión", () => {
  test("Entonces se le pide identificarse y el carrito se queda intacto", async ({
    page,
    context,
  }) => {
    await addToCart(page, producto.slug);
    /* Se cierra la sesión DESPUÉS de llenar el carrito: la cookie del carrito no depende de estar
       identificado, y es justo lo que este escenario comprueba que sobrevive. */
    await context.clearCookies({ name: "authjs.session-token" });

    await page.goto("/carrito");
    await page.getByTestId("cart-confirm").click();

    await expect(page).toHaveURL(/signin/);

    await page.goto("/carrito");
    await expect(page.getByTestId("cart-line")).toHaveCount(1);
  });
});
