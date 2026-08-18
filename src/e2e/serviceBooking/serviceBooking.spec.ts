import { expect, test } from "@playwright/test";
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

const TIENDA = {
  name: "E2E Agenda Sana",
  handle: "e2e-agenda-sana",
  phone: "2789990123",
};

const servicio = {
  title: `E2E Masaje de recuperacion ${Date.now()}`,
  slug: testSlug("masaje-de-recuperacion"),
  kind: "servicio" as const,
  origin: null,
  price: 300,
  durationMinutes: 30,
  sellerHandle: TIENDA.handle,
};

let dbSession: DbSession | undefined;

async function addAlwaysAvailableSchedule(): Promise<void> {
  await db.execute(sql`
    INSERT INTO provider_availability (seller_id, weekday, starts_at, ends_at)
    SELECT s.id, weekday, TIME '09:00', TIME '13:00'
    FROM sellers s
    CROSS JOIN generate_series(0, 6) AS weekday
    WHERE s.slug = ${TIENDA.handle}
  `);
}

test.beforeEach(async ({ page, browserName }) => {
  await deleteTestSellerByHandle(TIENDA.handle);
  await seedStore(TIENDA, null);
  await seedPost(servicio);
  await addAlwaysAvailableSchedule();
  dbSession = await simulateLogin(page, browserName);
});

test.afterEach(async () => {
  await deleteTestSellerByHandle(TIENDA.handle);
  if (dbSession?.id) await deleteSession(dbSession.id);
});

test.describe("Cuando una persona agenda un servicio", () => {
  test("Entonces la confirmacion explica que la cita esta en pedidos", async ({
    page,
  }) => {
    await page.goto(`/${servicio.slug}`);

    await page.getByTestId("slot-select").selectOption({ index: 1 });
    await page.getByTestId("book-submit").click();

    const confirmation = page.getByTestId("book-done");

    await expect(confirmation).toContainText("Tu cita quedó agendada");
    await expect(confirmation).toContainText("Mis pedidos");
    await expect(confirmation.getByTestId("book-orders-link")).toHaveAttribute(
      "href",
      "/pedidos?vista=placed",
    );
    await expect(page.getByTestId("cart-count")).toHaveCount(0);
  });
});

test.describe("Cuando un servicio aparece en un listado", () => {
  test("Entonces su card lleva a agendar y no al carrito", async ({ page }) => {
    await page.goto("/");

    const card = page.locator("article").filter({ hasText: servicio.title });

    await expect(card.getByTestId("card-book-service")).toBeVisible();
    await expect(card.getByTestId("card-book-service")).toHaveAttribute(
      "href",
      `/${servicio.slug}`,
    );
    await expect(card.getByTestId("add-to-cart")).toHaveCount(0);
  });
});
