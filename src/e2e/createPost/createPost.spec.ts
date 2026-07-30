import { test, expect } from "@playwright/test";
import type { PlaywrightTestArgs } from "@playwright/test";
import { SIGNIN_PATH } from "~/infra/constants";
import PublishPage from "./PublishPage";
import {
  simulateLogin,
  deleteSession,
  type DbSession,
} from "../testUtils/simulateLogin";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { testPost } from "../testUtils/testSlug";

test.describe("When users visit the platform", () => {
  test("Then a list of healthy post is displayed", async ({
    page,
  }: PlaywrightTestArgs) => {
    await page.goto("/");

    const first = page.getByRole("article").nth(0);

    await expect(first).toBeVisible();
  });
});

test.describe("Given an unregistered User that opened the app", () => {
  test.beforeEach(async ({ page }: PlaywrightTestArgs) => {
    await page.goto("/");
  });

  test.describe("When this anonymous user wants to publish a healthy post", () => {
    test("Then a Google Sigin provider should be presented", async ({
      page,
    }: PlaywrightTestArgs) => {
      const btnPublish = page
        .locator("header")
        .getByRole("button", { name: /publicar/i })
        .last();
      await btnPublish.click();

      await page.waitForURL(new RegExp(`.*${SIGNIN_PATH}`));
      expect(page.url()).toContain(SIGNIN_PATH);

      const googleBtn = page.getByRole("button", { name: /google/i });

      await expect(googleBtn).toBeVisible();
    });
  });
});

test.describe("When a signed users publish a new healthy post", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
    await page.goto("/publicar");
  });

  test.afterEach(async () => {
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Then, the new healthy post should be reachable", async ({
    page,
  }: PlaywrightTestArgs) => {
    const publishPage = new PublishPage(page);
    const { title: postTitle, slug } = testPost("Ensalada griega");

    await publishPage.stubStorageUpload();
    await publishPage.fillFields({
      title: postTitle,
      description: `La ensalada griega es una opción saludable y deliciosa para el desayuno o como plato principal en un menú diario.`,
      price: "80",
      phone: "2781092116",
      file: "./src/e2e/dummies/post.jpg",
    });

    await publishPage.verifyForm();
    await publishPage.send();

    await page.waitForURL(`/${slug}`);

    const title = page.getByRole("heading", { name: /ensalada griega/i });
    await expect(title).toBeAttached();
    await deleteOnePostBySlug(slug);
  });
});
