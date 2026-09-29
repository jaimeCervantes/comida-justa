import { type Browser, expect, type Page, test } from "@playwright/test";
import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { type FakeMapbox, startFakeMapbox } from "../testUtils/fakeMapbox";
import {
  advance,
  courierSharesFrom,
  placeOrderOf,
  trackingUrlFromLastAdvance,
} from "../testUtils/orderFlow";
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
 * Slice 3 de `docs/features/commerce/028-2026-09-18-pedido-enviado.md` (`@slice-14` en
 * `orders.feature`): distancia y tiempo aproximado, con el destino guardado en el propio pedido.
 *
 * Requiere las columnas de `0059_2026-09-26_add_delivery_location_to_customer_orders.py`.
 */
const TIENDA = {
  name: "E2E Tienda de la Entrega",
  handle: "e2e-tienda-de-la-entrega",
  phone: "2789990298",
};

const producto = {
  title: `E2E Entrega ${Date.now()}`,
  slug: testSlug("producto-para-entrega"),
  kind: "producto" as const,
  origin: null,
  price: 55,
  sellerHandle: TIENDA.handle,
};

/* Puntos reales de Monterrey: el repartidor en la Macroplaza; el destino primero a ~2 km, en la
   colonia Obispado, y después a ~4 km, en San Nicolás. Lo que importa es que las dos distancias
   no se parezcan. */
const COURIER = { latitude: 25.6699, longitude: -100.3097 };
const DESTINO = { latitude: 25.6766, longitude: -100.3303 };
const DESTINO_NUEVO = { latitude: 25.7018, longitude: -100.2988 };

let dbSession: DbSession | undefined;
/* Arranca "caído": los escenarios anteriores al slice 16 esperan la recta, que es lo que se ve sin
   camino. Solo el escenario del camino lo pone en `route`. */
let mapbox: FakeMapbox;

test.beforeAll(async () => {
  mapbox = await startFakeMapbox();
});

test.afterAll(async () => {
  await mapbox.close();
});

async function attachStoreToSuite(): Promise<void> {
  const userId = await findSuiteUserId();

  await db.execute(sql`
    UPDATE sellers SET user_id = ${userId} WHERE slug = ${TIENDA.handle}
  `);
}

/** Lo que quedó guardado como destino en la fila del pedido. */
async function storedDestination(
  orderUrl: string,
): Promise<{ lat: number | null; lng: number | null }> {
  const orderId = new URL(orderUrl).pathname.split("/").pop();
  const result = await db.execute(sql`
    SELECT delivery_lat AS lat, delivery_lng AS lng
    FROM customer_orders WHERE id = ${orderId}::uuid
  `);

  return result.rows[0] as { lat: number | null; lng: number | null };
}

/** El comprador le da permiso a su navegador y se para en ese punto. */
async function buyerAt(
  page: Page,
  position: { latitude: number; longitude: number },
): Promise<void> {
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation(position);
}

/** Pedido Enviado con el repartidor ya compartiendo su posición. */
async function shippedWithCourier(
  page: Page,
  browser: Browser,
): Promise<string> {
  const orderUrl = await placeOrderOf(page, producto.slug);
  await advance(page, ["CONFIRMED", "PREPARING", "SHIPPED"]);
  await courierSharesFrom(
    browser,
    await trackingUrlFromLastAdvance(page),
    COURIER,
  );

  return orderUrl;
}

test.beforeEach(async ({ page, browserName }) => {
  await deleteTestSellerByHandle(TIENDA.handle);
  await seedStore(TIENDA, null);
  await attachStoreToSuite();
  await seedPost(producto);
  dbSession = await simulateLogin(page, browserName);
});

test.afterEach(async () => {
  mapbox.setMode("down");
  await deleteTestSellerByHandle(TIENDA.handle);
  if (dbSession?.id) {
    await deleteSession(dbSession.id);
  }
});

test.describe("Al confirmar un pedido", () => {
  test("Entonces, si le doy permiso al navegador, mi ubicación queda como destino en el mismo clic", async ({
    page,
  }) => {
    await buyerAt(page, DESTINO);

    /* `placeOrderOf` es el mismo recorrido de siempre —carrito, un clic, ficha—: si hubiera un paso
       propio del sitio, no llegaría a la ficha. */
    const orderUrl = await placeOrderOf(page, producto.slug);

    const stored = await storedDestination(orderUrl);
    expect(stored.lat).toBeCloseTo(DESTINO.latitude, 4);
    expect(stored.lng).toBeCloseTo(DESTINO.longitude, 4);
  });

  test("Entonces, si el navegador no da la ubicación, el pedido se registra igual, sin destino", async ({
    page,
  }) => {
    /* Sin permiso concedido: el botón sí pregunta, y Playwright contesta que no — es el caso de
       quien niega el diálogo. El pedido no espera a nada más. */
    const orderUrl = await placeOrderOf(page, producto.slug);

    expect(await storedDestination(orderUrl)).toEqual({ lat: null, lng: null });
  });
});

test.describe("Con el pedido Enviado y el repartidor en camino", () => {
  test("Entonces, con destino guardado, veo a qué distancia va y un tiempo aproximado", async ({
    page,
    browser,
  }) => {
    await buyerAt(page, DESTINO);
    const orderUrl = await shippedWithCourier(page, browser);

    await page.goto(orderUrl);

    const progress = page.getByTestId("delivery-progress");
    await expect(progress.getByTestId("delivery-progress-distance")).toHaveText(
      /\d/,
    );
    await expect(progress.getByTestId("delivery-progress-eta")).toHaveText(
      /aprox/i,
    );
  });

  test("Entonces, sin destino guardado, el mapa se queda como antes y se me invita a compartirlo", async ({
    page,
    browser,
  }) => {
    const orderUrl = await shippedWithCourier(page, browser);

    await page.goto(orderUrl);

    await expect(page.getByTestId("courier-map-updated")).toBeVisible();
    await expect(page.getByTestId("delivery-progress")).toHaveCount(0);
    await expect(page.getByTestId("share-delivery-location")).toBeVisible();
  });

  test("Entonces puedo compartir mi ubicación después y la siguiente carga ya dice la distancia", async ({
    page,
    browser,
  }) => {
    const orderUrl = await shippedWithCourier(page, browser);
    await page.goto(orderUrl);

    await buyerAt(page, DESTINO);
    await page.getByTestId("share-delivery-location").click();
    await expect(page.getByTestId("delivery-location-shared")).toBeVisible();

    await page.goto(orderUrl);
    await expect(page.getByTestId("delivery-progress-distance")).toBeVisible();
  });

  test("Entonces actualizar mi ubicación cambia la distancia que se enseña", async ({
    page,
    browser,
  }) => {
    await buyerAt(page, DESTINO);
    const orderUrl = await shippedWithCourier(page, browser);
    await page.goto(orderUrl);

    const distance = page.getByTestId("delivery-progress-distance");
    const before = await distance.textContent();

    await page.context().setGeolocation(DESTINO_NUEVO);
    await page.getByTestId("share-delivery-location").click();

    await expect(distance).not.toHaveText(before ?? "");
  });
});

/** Envejece la última posición del repartidor, como si hubiera bloqueado el teléfono hace un rato. */
async function ageCourierLocation(
  orderUrl: string,
  minutes: number,
): Promise<void> {
  const orderId = new URL(orderUrl).pathname.split("/").pop();

  await db.execute(sql`
    UPDATE customer_orders
    SET courier_location_updated_at = now() - make_interval(mins => ${minutes})
    WHERE id = ${orderId}::uuid
  `);
}

/* Slice 4 de `028-...-pedido-enviado.md` (`@slice-15`): que la posición no mienta. */
test.describe("Cuando la posición del repartidor ya es vieja", () => {
  test("Entonces veo cuánto hace, la distancia en pasado y ningún tiempo estimado", async ({
    page,
    browser,
  }) => {
    await buyerAt(page, DESTINO);
    const orderUrl = await shippedWithCourier(page, browser);
    await ageCourierLocation(orderUrl, 7);

    await page.goto(orderUrl);

    await expect(page.getByTestId("courier-map-stale")).toContainText("7 min");
    const distance = page.getByTestId("delivery-progress-distance");
    await expect(distance).toHaveAttribute("data-stale", "true");
    await expect(distance).toContainText("7 min");
    await expect(page.getByTestId("delivery-progress-eta")).toHaveCount(0);
  });
});

test.describe("El mapa del pedido Enviado", () => {
  test("Entonces, con destino guardado, enseña al repartidor y al destino unidos por una recta", async ({
    page,
    browser,
  }) => {
    await buyerAt(page, DESTINO);
    const orderUrl = await shippedWithCourier(page, browser);

    await page.goto(orderUrl);

    const map = page.getByTestId("courier-map");
    await expect(map.getByTestId("map-marker-courier")).toHaveCount(1);
    await expect(map.getByTestId("map-marker-destination")).toHaveCount(1);
    await expect(map.locator(".courier-straight-line")).toHaveCount(1);
  });

  test("Entonces, sin destino guardado, enseña solo al repartidor", async ({
    page,
    browser,
  }) => {
    const orderUrl = await shippedWithCourier(page, browser);

    await page.goto(orderUrl);

    const map = page.getByTestId("courier-map");
    await expect(map.getByTestId("map-marker-courier")).toHaveCount(1);
    await expect(map.getByTestId("map-marker-destination")).toHaveCount(0);
    await expect(map.locator(".courier-straight-line")).toHaveCount(0);
  });
});

/* Slice 5 de `028-...-pedido-enviado.md` (`@slice-16`): camino por calles con Mapbox, contra el
   Mapbox falso local — nunca el real en la suite. */
test.describe("El camino por calles", () => {
  test("Entonces, con destino y repartidor en camino, veo el camino por calles, su distancia y tiempo, y la atribución de Mapbox", async ({
    page,
    browser,
  }) => {
    await buyerAt(page, DESTINO);
    const orderUrl = await shippedWithCourier(page, browser);
    mapbox.setMode("route");

    await page.goto(orderUrl);

    const distance = page.getByTestId("delivery-progress-distance");
    await expect(distance).toHaveAttribute("data-source", "route");
    await expect(distance).toContainText("2.6 km");
    await expect(distance).toContainText("por calles");
    await expect(page.getByTestId("delivery-progress-eta")).toContainText(
      "9 min",
    );

    const map = page.getByTestId("courier-map");
    await expect(map.locator(".courier-route-line")).toHaveCount(1);
    await expect(map.locator(".courier-straight-line")).toHaveCount(0);
    await expect(page.getByTestId("mapbox-attribution")).toContainText(
      "Improve this map",
    );
  });

  test("Entonces, si Mapbox no contesta, el mapa se queda con la recta y sin ningún error", async ({
    page,
    browser,
  }) => {
    await buyerAt(page, DESTINO);
    const orderUrl = await shippedWithCourier(page, browser);

    await page.goto(orderUrl);
    await expect.poll(() => mapbox.requests()).toBeGreaterThan(0);

    await expect(
      page.getByTestId("delivery-progress-distance"),
    ).toHaveAttribute("data-source", "straight");
    await expect(
      page.getByTestId("courier-map").locator(".courier-straight-line"),
    ).toHaveCount(1);
    await expect(page.getByTestId("mapbox-attribution")).toHaveCount(0);
  });
});

/** Mueve al repartidor ~400 m al norte, como una posición nueva recién llegada. */
async function moveCourier(orderUrl: string): Promise<void> {
  const orderId = new URL(orderUrl).pathname.split("/").pop();

  await db.execute(sql`
    UPDATE customer_orders
    SET courier_lat = courier_lat + 0.004, courier_location_updated_at = now()
    WHERE id = ${orderId}::uuid
  `);
}

test.describe("El zoom del mapa", () => {
  test("Entonces, si ajusto el zoom, una posición nueva recentra el mapa pero no me lo quita", async ({
    page,
    browser,
  }) => {
    await buyerAt(page, DESTINO);
    const orderUrl = await shippedWithCourier(page, browser);
    await page.goto(orderUrl);

    const map = page.getByTestId("courier-map");
    const canvas = map.locator(".leaflet-container");
    await expect(canvas).toHaveAttribute("data-zoom", /\d+/);
    const fitted = Number(await canvas.getAttribute("data-zoom"));

    await map.locator(".leaflet-control-zoom-in").click();
    await map.locator(".leaflet-control-zoom-in").click();
    await expect(canvas).toHaveAttribute("data-zoom", String(fitted + 2));

    const courierMarker = map.getByTestId("map-marker-courier");
    const before = await courierMarker.evaluate((marker) =>
      marker.closest(".leaflet-marker-icon")?.getAttribute("style"),
    );
    await moveCourier(orderUrl);

    /* El mapa se refresca cada 15 s: se espera a que la posición nueva mueva el marcador. */
    await expect
      .poll(
        () =>
          courierMarker.evaluate((marker) =>
            marker.closest(".leaflet-marker-icon")?.getAttribute("style"),
          ),
        { timeout: 45_000 },
      )
      .not.toBe(before);

    await expect(canvas).toHaveAttribute("data-zoom", String(fitted + 2));
  });
});
