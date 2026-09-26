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
 * Slice 2 de `docs/features/commerce/028-2026-09-18-pedido-enviado.md`: última posición del
 * repartidor, sin que el repartidor tenga cuenta.
 *
 * **Requiere que las cuatro columnas de `0058_2026-09-25_...` existan en la base compartida** —
 * la migración está escrita en `bot-whatsapp` pero, a la fecha de este slice, no se ha aplicado.
 */
const TIENDA = {
  name: "E2E Tienda del Repartidor",
  handle: "e2e-tienda-del-repartidor",
  phone: "2789990299",
};

const producto = {
  title: `E2E Repartidor ${Date.now()}`,
  slug: testSlug("producto-para-repartidor"),
  kind: "producto" as const,
  origin: null,
  price: 55,
  sellerHandle: TIENDA.handle,
};

/** Un punto real de Monterrey: no importa cuál, sólo que sea una coordenada válida. */
const COURIER_POSITION = { latitude: 25.6866, longitude: -100.3161 };

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
  statuses: readonly ("CONFIRMED" | "PREPARING" | "SHIPPED" | "DELIVERED")[],
): Promise<void> {
  await page.goto("/pedidos");

  for (const status of statuses) {
    await page.getByTestId(`order-action-${status}`).first().click();
    /* Al entregarlo sale del filtro "abiertos" y la lista se vacía: eso ES el comportamiento, así
       que la espera de este paso mira la lista vacía y no la insignia. */
    if (status === "DELIVERED") {
      await expect(page.getByTestId("seller-orders-empty")).toBeVisible();
    } else {
      await expect(
        page.getByTestId("seller-order").first().getByTestId("order-status"),
      ).toHaveAttribute("data-status", status);
    }
  }
}

/** El enlace que el vendedor acaba de recibir al despachar, tras el último clic de `advance`. */
async function trackingUrlFromLastAdvance(page: Page): Promise<string> {
  const href = await page
    .getByTestId("seller-order")
    .first()
    .getByTestId("courier-link-url")
    .getAttribute("href");

  if (!href) throw new Error("El aviso no trajo el enlace del repartidor.");

  return href;
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

test.describe("Cuando el vendedor despacha con repartidor", () => {
  test("Entonces obtiene un enlace para compartir, listo para mandar por WhatsApp", async ({
    page,
  }) => {
    await placeOrder(page);
    await advance(page, ["CONFIRMED", "PREPARING", "SHIPPED"]);

    const notice = page
      .getByTestId("seller-order")
      .first()
      .getByTestId("courier-link-notice");

    await expect(notice).toBeVisible();

    const url = await trackingUrlFromLastAdvance(page);

    expect(url).toContain("/repartidor/");

    await expect(notice.getByTestId("courier-link-whatsapp")).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/\?text=/,
    );
  });

  test("Entonces mi pedido sin posición todavía no pinta un mapa vacío", async ({
    page,
  }) => {
    const orderUrl = await placeOrder(page);
    await advance(page, ["CONFIRMED", "PREPARING", "SHIPPED"]);

    await page.goto(orderUrl);

    await expect(page.getByTestId("courier-map-empty")).toBeVisible();
    await expect(page.getByTestId("courier-map-updated")).toHaveCount(0);
  });
});

test.describe("Cuando el repartidor abre su enlace", () => {
  test("Entonces puede compartir su ubicación sin iniciar sesión, y el comprador la ve", async ({
    page,
    browser,
  }) => {
    const orderUrl = await placeOrder(page);
    await advance(page, ["CONFIRMED", "PREPARING", "SHIPPED"]);
    const trackingUrl = await trackingUrlFromLastAdvance(page);

    /* Un contexto nuevo, sin ninguna cookie: el repartidor no tiene cuenta ni sesión. */
    const courierContext = await browser.newContext({
      geolocation: {
        latitude: COURIER_POSITION.latitude,
        longitude: COURIER_POSITION.longitude,
      },
      permissions: ["geolocation"],
    });
    const courierPage = await courierContext.newPage();

    await courierPage.goto(trackingUrl);
    await expect(courierPage.getByTestId("courier-share-button")).toBeVisible();
    await courierPage.getByTestId("courier-share-button").click();
    await expect(courierPage.getByTestId("courier-share-active")).toBeVisible();

    await courierContext.close();

    await page.goto(orderUrl);
    await expect(page.getByTestId("courier-map")).toBeVisible();
    await expect(page.getByTestId("courier-map-updated")).toBeVisible();
    await expect(page.getByTestId("courier-map-empty")).toHaveCount(0);
  });
});

test.describe("Cuando el pedido deja de estar Enviado", () => {
  test("Entonces el enlace del repartidor deja de aceptar posiciones y el mapa desaparece", async ({
    page,
    browser,
  }) => {
    const orderUrl = await placeOrder(page);
    await advance(page, ["CONFIRMED", "PREPARING", "SHIPPED"]);
    const trackingUrl = await trackingUrlFromLastAdvance(page);

    await advance(page, ["DELIVERED"]);

    const courierContext = await browser.newContext();
    const courierPage = await courierContext.newPage();

    await courierPage.goto(trackingUrl);
    await expect(
      courierPage.getByTestId("courier-tracking-stopped"),
    ).toBeVisible();
    await expect(courierPage.getByTestId("courier-share-button")).toHaveCount(
      0,
    );

    await courierContext.close();

    await page.goto(orderUrl);
    await expect(page.getByTestId("courier-map")).toHaveCount(0);
  });
});
