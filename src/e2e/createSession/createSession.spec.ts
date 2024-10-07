import { test, expect } from "@playwright/test";
import { deleteSession, simulateLogin } from "../simulateLogin";

test.describe.skip("Simulate login", () => {
  let dbSession;

  test.beforeEach(async ({ page, browserName}) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    await deleteSession(dbSession?.id);
  });

  test("Create a session for test user", async ({ page, browserName }) => {
    await page.goto("http://localhost:3000/publicar");
    const title = page.getByRole("heading", { name: /comida sana/i });
    expect(title).toBeAttached();
  });
});
