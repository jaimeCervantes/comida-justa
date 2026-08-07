import { expect, test } from "@playwright/test";
import { deleteSession, simulateLogin } from "../testUtils/simulateLogin";

test.describe
  .skip("Simulate login", () => {
    let dbSession: Awaited<ReturnType<typeof simulateLogin>> | undefined;

    test.beforeEach(async ({ page, browserName }) => {
      dbSession = await simulateLogin(page, browserName);
    });

    test.afterEach(async () => {
      // Mismo resguardo que el resto de la suite: si `simulateLogin` falló, no hay sesión que
      // borrar y `deleteSession` no acepta `undefined`.
      if (dbSession?.id) {
        await deleteSession(dbSession.id);
      }
    });

    test("Create a session for test user", async ({ page }) => {
      await page.goto("/publicar");
      const title = page.getByRole("heading", {
        name: /Título de la publicación/i,
      });
      expect(title).toBeAttached();
    });
  });
