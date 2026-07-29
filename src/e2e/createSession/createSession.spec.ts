import { expect, test } from "@playwright/test";
import { deleteSession, simulateLogin } from "../testUtils/simulateLogin";

test.describe
  .skip("Simulate login", () => {
    let dbSession: Awaited<ReturnType<typeof simulateLogin>> | undefined;

    test.beforeEach(async ({ page, browserName }) => {
      dbSession = await simulateLogin(page, browserName);
    });

    test.afterEach(async () => {
      await deleteSession(dbSession?.id);
    });

    test("Create a session for test user", async ({ page }) => {
      await page.goto("http://localhost:3000/publicar");
      const title = page.getByRole("heading", {
        name: /Título de la publicación/i,
      });
      expect(title).toBeAttached();
    });
  });
