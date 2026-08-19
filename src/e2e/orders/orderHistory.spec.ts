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
 * Slice 8 de `docs/features/commerce/003-2026-08-09-pedidos.md`: el pedido recuerda su recorrido.
 *
 * **La tienda es de la cuenta de la suite**, como en los demás specs de pedidos: el panel del
 * vendedor solo se pinta si la sesión es dueña de la tienda. Aquí además viene bien que la misma
 * cuenta compre y venda, porque el escenario necesita mover el pedido (vendedor) y luego leer su
 * recorrido (comprador) sin cambiar de sesión.
 */
const TIENDA = {
  name: "E2E Tienda del Historial",
  handle: "e2e-tienda-del-historial",
  phone: "2789990099",
};

const producto = {
  title: `E2E Historial ${Date.now()}`,
  slug: testSlug("producto-con-historial"),
  kind: "producto" as const,
  origin: null,
  price: 50,
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

/** Lo lleva por el proceso desde el panel del vendedor, esperando a cada paso. */
async function advance(
  page: Page,
  statuses: readonly ("CONFIRMED" | "PREPARING" | "DELIVERED")[],
): Promise<void> {
  await page.goto("/pedidos");

  for (const status of statuses) {
    await page.getByTestId(`order-action-${status}`).first().click();
    /* Al entregarlo sale del filtro "abiertos" y la lista se vacía: eso ES el comportamiento, así
       que la espera del último paso mira la lista vacía y no la insignia. */
    if (status === "DELIVERED") {
      await expect(page.getByTestId("seller-orders-empty")).toBeVisible();
    } else {
      await expect(
        page.getByTestId("seller-order").first().getByTestId("order-status"),
      ).toHaveAttribute("data-status", status);
    }
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
  // Se lleva la tienda, sus publicaciones, sus pedidos y —por cascada— su histórico.
  await deleteTestSellerByHandle(TIENDA.handle);
  if (dbSession?.id) {
    await deleteSession(dbSession.id);
  }
});

test.describe("Cuando un pedido recorre su proceso", () => {
  test("Entonces queda cuándo se entregó y por dónde pasó", async ({
    page,
  }) => {
    const orderUrl = await placeOrder(page);

    // Antes de moverlo no hay ni fecha de entrega ni recorrido que enseñar.
    await expect(page.getByTestId("order-status-since")).toHaveCount(0);
    await expect(page.getByTestId("order-history-step")).toHaveCount(1);

    await advance(page, ["CONFIRMED", "PREPARING", "DELIVERED"]);

    await page.goto(orderUrl);

    // La fecha de entrega, que es lo que se pidió, con su hora.
    const since = page.getByTestId("order-status-since");

    await expect(since).toHaveAttribute("data-status", "DELIVERED");
    await expect(since).toContainText("Entregado el");
    await expect(since).toContainText(String(new Date().getFullYear()));

    /* Y el recorrido: Pendiente (de `created_at`) más los tres pasos registrados. Esto es lo que
       antes se perdía — cada transición pisaba el `updated_at` de la anterior. */
    await expect(page.getByTestId("order-history-step")).toHaveCount(4);
    await expect(page.getByTestId("order-history")).toContainText("Aceptado");
    await expect(page.getByTestId("order-history")).toContainText(
      "En preparación",
    );
    // Y como sí hay recorrido, no se da la explicación de por qué falta.
    await expect(page.getByTestId("order-history-empty")).toHaveCount(0);
  });

  /* El hueco que dejó la primera versión: sólo hablaba de los estados finales, así que un pedido
     "Aceptado" enseñaba junto a la insignia la fecha en que se HIZO, y se leía como la fecha en que
     se aceptó. */
  test("Entonces un estado intermedio también dice desde cuándo, sin pisar la fecha de creación", async ({
    page,
  }) => {
    const orderUrl = await placeOrder(page);

    await advance(page, ["CONFIRMED"]);
    await page.goto(orderUrl);

    const since = page.getByTestId("order-status-since");

    await expect(since).toHaveAttribute("data-status", "CONFIRMED");
    await expect(since).toContainText("Aceptado el");

    // Y la de creación sigue estando, aparte y como dato secundario.
    await expect(page.getByTestId("order-placed-on")).toContainText("Hecho el");
  });

  test("Entonces la lista también dice cuándo se entregó", async ({ page }) => {
    await placeOrder(page);
    await advance(page, ["CONFIRMED", "PREPARING", "DELIVERED"]);

    // Entregado ya no está entre los abiertos: se busca donde le toca.
    await page.getByTestId("orders-scope-closed").click();

    await expect(
      page
        .getByTestId("seller-order")
        .first()
        .getByTestId("order-status-since"),
    ).toContainText("Entregado el");
  });

  test("Entonces un pedido cancelado dice cuándo se canceló, no cuándo se entregó", async ({
    page,
  }) => {
    const orderUrl = await placeOrder(page);

    await page.goto("/pedidos");
    await page.getByTestId("order-action-CANCELLED").first().click();
    await expect(page.getByTestId("seller-orders-empty")).toBeVisible();

    await page.goto(orderUrl);

    const since = page.getByTestId("order-status-since");

    await expect(since).toHaveAttribute("data-status", "CANCELLED");
    await expect(since).toContainText("Cancelado el");
    await expect(since).not.toContainText("Entregado");
  });
});

test.describe("Cuando un pedido no se movió", () => {
  test("Entonces no finge una fecha ni un recorrido que no tiene", async ({
    page,
  }) => {
    await placeOrder(page);

    await expect(page.getByTestId("order-status-since")).toHaveCount(0);
    // Sólo el punto de partida, que sale de `created_at` y no del histórico.
    await expect(page.getByTestId("order-history-step")).toHaveCount(1);
    await expect(page.getByTestId("order-history-step")).toContainText(
      "Pendiente",
    );
    /* Y se explica por qué no hay más: es la misma pantalla que verá un pedido anterior a la
       migración, que tampoco tiene pasos registrados. */
    await expect(page.getByTestId("order-history-empty")).toBeVisible();
  });
});
