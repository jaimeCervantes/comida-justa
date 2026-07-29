import { expect, test } from "@playwright/test";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";

// El 404 tiene que ser un 404 de verdad, no un 200 que "parece" 404: si la decisión ocurre
// dentro de un `<Suspense>` (o detrás de un `loading.tsx`), la respuesta ya salió con 200.
test.describe("When a visitor opens something that does not exist", () => {
  test("Then an unknown publication responds with 404", async ({ page }) => {
    const response = await page.goto("/esta-publicacion-no-existe-xyz");

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: /recurso no encontrado/i }),
    ).toBeVisible();
  });

  test("Then a page number beyond the last one responds with 404", async ({
    page,
  }) => {
    const response = await page.goto("/page/99999");

    expect(response?.status()).toBe(404);
  });
});

test.describe("When a non-admin opens the internal report", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Then it responds with 404 and no report", async ({ page }) => {
    const response = await page.goto("/admin/productos");

    expect(response?.status()).toBe(404);
    await expect(page.getByTestId("origin-report")).toHaveCount(0);
  });
});
