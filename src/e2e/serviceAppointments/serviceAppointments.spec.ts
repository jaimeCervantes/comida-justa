import { randomUUID } from "node:crypto";
import { expect, type Page, test } from "@playwright/test";
import { sql } from "drizzle-orm";
import es from "~/i18n/messages/es.json";
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

const STORE = {
  name: "E2E Agenda Sana",
  handle: "e2e-agenda-sana",
  phone: "2789990200",
};

const PROVIDER = {
  id: "e2e-service-appointments-provider",
  email: "pw.service.appointments.provider@example.com",
  name: "E2E Proveedora Agenda Sana",
};

const BUYER = {
  id: "e2e-service-appointments-buyer",
  email: "pw.service.appointments.buyer@example.com",
  name: "clienta de prueba",
};

const SERVICE = {
  title: "E2E Masaje de recuperacion",
  slug: testSlug("masaje-recuperacion-cita"),
  kind: "servicio" as const,
  origin: null,
  price: 700,
  durationMinutes: 60,
  sellerHandle: STORE.handle,
};

const NORMAL_ORDER_PRODUCT = {
  title: "E2E Pan de caja",
  slug: testSlug("pan-caja-no-cita"),
  kind: "producto" as const,
  origin: null,
  price: 80,
  sellerHandle: STORE.handle,
};

const APPOINTMENT_START = new Date("2032-05-20T16:00:00.000Z");
const APPOINTMENT_END = new Date("2032-05-20T17:00:00.000Z");

let dbSession: DbSession | undefined;

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const documentElement = document.documentElement;

    return documentElement.scrollWidth - documentElement.clientWidth;
  });

  expect(overflow).toBeLessThanOrEqual(1);
}

async function seedUser(user: typeof PROVIDER): Promise<void> {
  await db.execute(sql`
    INSERT INTO users (id, name, email, external_id)
    VALUES (${user.id}, ${user.name}, ${user.email}, ${user.id})
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        email = EXCLUDED.email,
        external_id = EXCLUDED.external_id
  `);
}

async function deleteSeedUsers(): Promise<void> {
  await db.execute(sql`
    DELETE FROM sessions
    WHERE user_id IN (${PROVIDER.id}, ${BUYER.id})
  `);
  await db.execute(sql`
    DELETE FROM users
    WHERE id IN (${PROVIDER.id}, ${BUYER.id})
       OR email IN (${PROVIDER.email}, ${BUYER.email})
  `);
}

async function seedAppointment(postId: string): Promise<string> {
  const orderId = randomUUID();
  const checkoutId = randomUUID();

  await db.execute(sql`
    INSERT INTO customer_orders (
      id,
      checkout_id,
      seller_id,
      user_id,
      status,
      during,
      created_at,
      updated_at
    )
    SELECT
      ${orderId}::uuid,
      ${checkoutId}::uuid,
      s.id,
      ${BUYER.id},
      'CONFIRMED'::orderstatus,
      tstzrange(
        ${APPOINTMENT_START.toISOString()}::timestamptz,
        ${APPOINTMENT_END.toISOString()}::timestamptz,
        '[)'
      ),
      now(),
      now()
    FROM sellers s
    WHERE s.slug = ${STORE.handle}
  `);

  await db.execute(sql`
    INSERT INTO customer_order_items (
      order_id,
      post_id,
      title,
      unit_price,
      quantity
    )
    VALUES (
      ${orderId}::uuid,
      ${postId}::uuid,
      ${SERVICE.title},
      ${String(SERVICE.price)}::numeric,
      1
    )
  `);

  return orderId;
}

async function seedNormalOrder(postId: string): Promise<string> {
  const orderId = randomUUID();
  const checkoutId = randomUUID();

  await db.execute(sql`
    INSERT INTO customer_orders (id, checkout_id, seller_id, user_id, status)
    SELECT
      ${orderId}::uuid,
      ${checkoutId}::uuid,
      s.id,
      ${BUYER.id},
      'PENDING'::orderstatus
    FROM sellers s
    WHERE s.slug = ${STORE.handle}
  `);

  await db.execute(sql`
    INSERT INTO customer_order_items (
      order_id,
      post_id,
      title,
      unit_price,
      quantity
    )
    VALUES (
      ${orderId}::uuid,
      ${postId}::uuid,
      ${NORMAL_ORDER_PRODUCT.title},
      ${String(NORMAL_ORDER_PRODUCT.price)}::numeric,
      1
    )
  `);

  return orderId;
}

async function addAlwaysAvailableSchedule(): Promise<void> {
  await db.execute(sql`
    INSERT INTO provider_availability (seller_id, weekday, starts_at, ends_at)
    SELECT s.id, weekday, TIME '09:00', TIME '13:00'
    FROM sellers s
    CROSS JOIN generate_series(0, 6) AS weekday
    WHERE s.slug = ${STORE.handle}
  `);
}

test.beforeEach(async () => {
  await deleteTestSellerByHandle(STORE.handle);
  await deleteSeedUsers();

  await seedUser(PROVIDER);
  await seedUser(BUYER);
  await seedStore(STORE, null, PROVIDER.id);
  await addAlwaysAvailableSchedule();

  const serviceId = await seedPost(SERVICE);
  const productId = await seedPost(NORMAL_ORDER_PRODUCT);

  await seedAppointment(serviceId);
  await seedNormalOrder(productId);
});

test.afterEach(async () => {
  await deleteTestSellerByHandle(STORE.handle);
  await deleteSeedUsers();

  if (dbSession?.id) {
    await deleteSession(dbSession.id);
  }

  dbSession = undefined;
});

test.describe("Cliente y proveedora revisan citas de servicio", () => {
  test("al agendar, la confirmacion lleva a Mis citas", async ({
    page,
    browserName,
  }) => {
    dbSession = await simulateLogin(page, browserName, { email: BUYER.email });

    await page.goto(`/${SERVICE.slug}`);
    await page.getByTestId("slot-select").selectOption({ index: 1 });
    await page.getByTestId("book-submit").click();

    const confirmation = page.getByTestId("book-done");

    await expect(confirmation).toContainText(es.post.bookDone);
    await expect(confirmation).toContainText(es.post.bookAppointmentsLink);
    await expect(
      confirmation.getByTestId("book-appointments-link"),
    ).toHaveAttribute("href", "/citas");
  });

  test("la clienta ve sus citas separadas de pedidos genericos en movil", async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    dbSession = await simulateLogin(page, browserName, { email: BUYER.email });

    await page.goto("/citas");

    const upcoming = page.getByTestId("appointments-upcoming");
    const appointment = upcoming.getByTestId("buyer-order");

    await expect(appointment).toContainText(SERVICE.title);
    await expect(appointment).toContainText(STORE.name);
    await expect(appointment.getByTestId("order-appointment")).toBeVisible();
    await expect(
      appointment.getByRole("link", { name: es.orders.viewOrder }),
    ).toBeVisible();

    await appointment.getByRole("link", { name: es.orders.viewOrder }).click();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: es.orders.appointmentPlaced,
      }),
    ).toBeVisible();
    await expect(page.getByTestId("order-appointment-detail")).toContainText(
      "Cita",
    );

    const href = await page.getByTestId("order-notify").getAttribute("href");
    const message = decodeURIComponent(href?.split("text=")[1] ?? "");

    expect(message).toContain("cita de servicio");
    expect(message).toContain(SERVICE.title);
    expect(message).toContain("2032");
    expect(message).toContain("10:00");

    await page.goto("/citas");

    await expect(page.getByTestId("appointments-page")).not.toContainText(
      NORMAL_ORDER_PRODUCT.title,
    );
    await expectNoHorizontalOverflow(page);
  });

  test("la proveedora ve sus citas con clientes desde su agenda en desktop", async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    dbSession = await simulateLogin(page, browserName, {
      email: PROVIDER.email,
    });

    await page.goto("/cuenta/agenda?tab=citas");

    const upcoming = page.getByTestId("seller-appointments-upcoming");
    const appointment = upcoming.getByTestId("seller-order");

    await expect(appointment).toContainText(SERVICE.title);
    await expect(appointment).toContainText(BUYER.name);
    await expect(appointment.getByTestId("order-appointment")).toBeVisible();
    await expect(
      appointment.getByRole("link", { name: es.orders.viewOrder }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("un pedido sin horario queda fuera de citas pero sigue en pedidos", async ({
    page,
    browserName,
  }) => {
    dbSession = await simulateLogin(page, browserName, { email: BUYER.email });

    await page.goto("/citas");

    await expect(page.getByTestId("appointments-page")).not.toContainText(
      NORMAL_ORDER_PRODUCT.title,
    );

    await page.goto("/pedidos?vista=placed");

    await expect(page.getByTestId("buyer-orders")).toContainText(
      NORMAL_ORDER_PRODUCT.title,
    );
  });
});
