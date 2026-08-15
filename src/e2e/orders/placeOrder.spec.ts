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
 * Slice 2 de `docs/features/pedidos.md`.
 *
 * **La tienda es de la propia cuenta de la suite**, y no "hazlo-sano". El panel del vendedor solo se
 * ve si la sesión es dueña de la tienda, y `sellers.user_id` de Hazlo Sano apunta a una cuenta real
 * que la suite no puede usar: con la tienda real, `/pedidos` no pintaba la sección de vendedor y el
 * escenario fallaba por el fixture, no por el código.
 *
 * `seedStore` deja `user_id` en NULL a propósito (ver su docstring: una tienda colgada de la cuenta
 * de la suite rompe los seis escenarios que empiezan abriendo tienda desde `/cuenta`). Aquí se
 * engancha **a mano y con red**: el handle es fijo y se borra ANTES y DESPUÉS de cada prueba, así
 * que una corrida que muera a medias se limpia sola en la siguiente en vez de dejar la cuenta con
 * tienda.
 */
const TIENDA = {
  name: "E2E Tienda de Pedidos",
  handle: "e2e-tienda-de-pedidos",
  phone: "2789990077",
};

/** Con lada, como lo quiere `wa.me`. */
const TIENDA_WHATSAPP = "522789990077";

const producto = {
  title: `E2E Pedido ${Date.now()}`,
  slug: testSlug("producto-para-pedir"),
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

async function addToCart(page: Page, slug: string): Promise<void> {
  await page.goto(`/${slug}`);
  await page.getByTestId("post-detail").getByTestId("add-to-cart").click();
  await expect(page.getByTestId("cart-count")).toHaveText("1");
}

/** Confirma el carrito y espera a estar ya en la página del pedido. */
async function confirmOrder(page: Page): Promise<void> {
  await page.goto("/carrito");
  await page.getByTestId("cart-confirm").click();
  await expect(page.getByTestId("order-detail")).toBeVisible();
}

test.beforeEach(async ({ page, browserName }) => {
  // Antes de sembrar: si una corrida anterior murió, aquí es donde se limpia su resto.
  await deleteTestSellerByHandle(TIENDA.handle);
  await seedStore(TIENDA, null);
  await attachStoreToSuite();
  await seedPost(producto);
  dbSession = await simulateLogin(page, browserName);
});

test.afterEach(async () => {
  // Se lleva la tienda, sus publicaciones, sus sucursales y sus pedidos.
  await deleteTestSellerByHandle(TIENDA.handle);
  if (dbSession?.id) {
    await deleteSession(dbSession.id);
  }
});

test.describe("Cuando el comprador confirma su carrito", () => {
  test("Entonces el pedido queda registrado y su página deja avisar a la tienda", async ({
    page,
  }) => {
    await addToCart(page, producto.slug);
    await confirmOrder(page);

    await expect(page.getByTestId("order-status")).toHaveAttribute(
      "data-status",
      "PENDING",
    );
    await expect(page.getByTestId("order-lines")).toContainText(producto.title);
    await expect(page.getByTestId("order-total")).toContainText("50");

    /* La fecha se afirma **de verdad** y no solo que la página cargue: `db.execute` con SQL crudo
       entrega los `timestamptz` como texto, `Intl` lo convierte a `NaN` y `format.dateTime` lanza
       `Invalid time value`. next-intl lo captura y pinta un hueco, así que la página seguía
       cargando y ningún escenario se enteraba. Con esto, se entera. */
    await expect(page.getByTestId("order-placed-on")).toContainText(
      String(new Date().getFullYear()),
    );

    // El aviso es un enlace normal: se abre con un clic de verdad, no con `window.open`.
    const href = await page.getByTestId("order-notify").getAttribute("href");

    expect(href).toContain(`wa.me/${TIENDA_WHATSAPP}`);

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
    await confirmOrder(page);
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
    await confirmOrder(page);

    await page.goto("/pedidos");
    await expect(page.getByTestId("seller-orders")).toBeVisible();

    for (const status of ["CONFIRMED", "PREPARING"] as const) {
      await page.getByTestId(`order-action-${status}`).first().click();
      await expect(
        page.getByTestId("seller-order").first().getByTestId("order-status"),
      ).toHaveAttribute("data-status", status);
    }

    /* Al entregarlo sale del filtro por defecto —"abiertos"— y la lista se queda vacía: eso ES el
       comportamiento, no un fallo. Un vendedor entra a atender lo que espera, no a repasar lo
       terminado. */
    await page.getByTestId("order-action-DELIVERED").first().click();
    await expect(page.getByTestId("seller-orders-empty")).toBeVisible();

    // Y aparece donde le toca, entre lo terminado, ya sin acciones que ofrecer.
    await page.getByTestId("orders-scope-closed").click();
    await expect(
      page.getByTestId("seller-order").first().getByTestId("order-status"),
    ).toHaveAttribute("data-status", "DELIVERED");
    await expect(page.getByTestId("order-action-CANCELLED")).toHaveCount(0);
    await expect(page.getByTestId("order-action-PREPARING")).toHaveCount(0);
  });
});

test.describe("Cuando alguien quiere ver sus pedidos", () => {
  test("Entonces llega desde el menú de su avatar y ve sus dos papeles", async ({
    page,
  }) => {
    await addToCart(page, producto.slug);
    await confirmOrder(page);

    // Se llega por el menú, no escribiendo la dirección: es lo que faltaba.
    await page.goto("/");
    await page.getByTestId("user-menu-trigger").click();
    await page.getByTestId("menu-my-orders").click();

    /* La cuenta de la suite es dueña de la tienda sembrada, así que entra por lo que le han
       pedido: es lo que tiene prisa. La otra vista se ve por su pestaña, no apilada debajo. */
    await expect(page.getByTestId("orders-received")).toBeVisible();
    await expect(page.getByTestId("orders-placed")).toHaveCount(0);
    // Y la pestaña de la otra dice que hay uno esperando sin tener que entrar.
    await expect(page.getByTestId("orders-count-placed")).toHaveText("1");

    await page.getByTestId("orders-tab-placed").click();
    await expect(page.getByTestId("orders-placed")).toBeVisible();

    /* Desde el resumen se llega al detalle. Ya no pulsando la tarjeta entera: desde el slice 6 sus
       renglones enlazan a su producto, y un enlace no puede llevar enlaces dentro, así que el
       destino se nombra al pie. */
    await page.getByTestId("buyer-order-link").first().click();
    await expect(page.getByTestId("order-detail")).toBeVisible();
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
