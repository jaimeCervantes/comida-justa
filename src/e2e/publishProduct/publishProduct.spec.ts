import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testPost } from "../testUtils/testSlug";
import PublishProductPage from "./PublishProductPage";

// Slice 1 — admin publishes a Hazlo Sano product and the badge is shown.
// Requires the running stack (PostgreSQL) and that the first email in
// HAZLO_SANO_ADMIN_EMAILS belongs to an existing user, so the origin selector renders.
const adminEmail = (process.env.HAZLO_SANO_ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)[0];

const { title: productTitle, slug } = testPost("Crema de cacahuate artesanal");

test.describe("When an admin publishes a Hazlo Sano product", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(!adminEmail, "HAZLO_SANO_ADMIN_EMAILS is not configured");
    dbSession = await simulateLogin(page, browserName, { email: adminEmail });
  });

  test.afterEach(async () => {
    // Clean up here (not at the end of the test body) so an orphaned post can't
    // survive a mid-test failure and be shown on the next run under the same slug.
    await deleteOnePostBySlug(slug);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Then the product detail shows the Hazlo Sano badge", async ({
    page,
  }) => {
    const publishPage = new PublishProductPage(page);
    const title = productTitle;

    await publishPage.stubStorageUpload();
    await publishPage.goto();
    await publishPage.fill({
      title,
      description:
        "Cacahuate orgánico molido, sin azúcar añadida. Ideal para el desayuno.",
      price: "120",
      phone: "2781092116",
      file: "./src/e2e/dummies/post.jpg",
      kind: "producto",
      origin: "hazlo_sano_propio",
    });
    await publishPage.submit();

    await page.waitForURL(`/${slug}`);
    await expect(
      page.getByRole("heading", { name: /crema de cacahuate/i }),
    ).toBeAttached();
    await publishPage.expectHazloSanoBadge();
  });
});
