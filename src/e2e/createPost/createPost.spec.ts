import { test, expect } from "@playwright/test";
import type { PlaywrightTestArgs } from "@playwright/test";

test.describe("When users visit the platform", () => {
  test("Then a list of healthy food is displayed", async ({
    page,
  }: PlaywrightTestArgs) => {
    await page.goto("/");

    const first = page.getByRole("article").nth(0);
    const second = page.getByRole("article").nth(1);

    await expect(first).toBeVisible();
    await expect(second).toBeVisible();
  });
});

test.describe("Given an unregistered User that opened the app", () => {
  test.beforeEach(async ({ page }: PlaywrightTestArgs) => {
    await page.goto("/");
  });

  test.describe("When this anonymous user wants to publish a healthy food", () => {
    test("Then a Google Sigin provider should be presented", async ({
      page,
    }: PlaywrightTestArgs) => {
      const btnPublish = page.getByRole("link", { name: /publicar/i });
      await btnPublish.click({ button: "left" });

      await expect(page).toHaveURL("/auth/signin");

      const googleBtn = page.getByRole("button", { name: /google/i });

      await expect(googleBtn).toBeVisible();
    });
  });
});
