import { test, expect } from "@playwright/test";
import ProductsReportPage from "./ProductsReportPage";
import {
  simulateLogin,
  deleteSession,
  type DbSession,
} from "../testUtils/simulateLogin";
import { seedPost } from "../testUtils/seedPost";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { testSlug } from "../testUtils/testSlug";

// Slice 3 — the admin report groups product counts by origin.
// Counts are asserted as deltas (before → after seeding) instead of absolute numbers,
// because the database this suite runs against already holds real publications.
const adminEmail = (process.env.HAZLO_SANO_ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)[0];

const REPORTED_ORIGIN = "hazlo_sano_propio";

test.describe("When an admin opens the products report", () => {
  const slug = testSlug("producto-de-reporte");
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(!adminEmail, "HAZLO_SANO_ADMIN_EMAILS is not configured");
    dbSession = await simulateLogin(page, browserName, { email: adminEmail });
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(slug);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Then each origin is counted, and a new product raises its own row", async ({
    page,
  }) => {
    const reportPage = new ProductsReportPage(page);

    await reportPage.goto();
    await reportPage.expectVisible();
    // El acceso al reporte se muestra en la navegación solo a los admins.
    await expect(page.getByRole("link", { name: "Reporte" }).first()).toBeVisible();

    const before = await reportPage.countFor(REPORTED_ORIGIN);
    const otherBefore = await reportPage.countFor("reventa_foranea");
    const totalBefore = await reportPage.countFor(null);

    await seedPost({
      title: `Producto de reporte ${slug}`,
      slug,
      kind: "producto",
      origin: REPORTED_ORIGIN,
    });

    await page.reload();

    expect(await reportPage.countFor(REPORTED_ORIGIN)).toBe(before + 1);
    // Las demás filas no se mueven, y las que no tienen productos siguen listadas.
    expect(await reportPage.countFor("reventa_foranea")).toBe(otherBefore);
    expect(await reportPage.countFor(null)).toBe(totalBefore);
  });
});

test.describe("When a non-admin user opens the products report", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    // Sin email: simulateLogin toma el primer usuario, cuyo correo es null → no es admin.
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Then the report is not shown, nor its navigation entry", async ({ page }) => {
    const reportPage = new ProductsReportPage(page);

    await reportPage.goto();

    await reportPage.expectNotVisible();
    await expect(page.getByRole("link", { name: "Reporte" })).toHaveCount(0);
  });
});
