import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";

/**
 * The gallery, seen from the detail page.
 *
 * These publications are seeded straight through the write repository instead of going through
 * `/publicar`: what is under test is what the reader sees, and driving the whole publish flow again
 * would make a display bug look like an upload bug.
 */
test.describe("Given a publication with several files", () => {
  const seeded: string[] = [];

  test.afterEach(async () => {
    for (const slug of seeded.splice(0)) {
      await deleteOnePostBySlug(slug);
    }
  });

  test("Then its detail page walks through them", async ({ page }) => {
    const slug = testSlug("crema-de-cacahuate");
    await seedPost({
      title: "E2E Crema de cacahuate artesanal",
      slug,
      kind: "producto",
      origin: "productor",
      price: 120,
      mediaCount: 3,
    });
    seeded.push(slug);

    await page.goto(`/${slug}`);

    const gallery = page.getByTestId("media-gallery");
    await expect(gallery).toBeVisible();
    await expect(page.getByTestId("media-gallery-thumbnail")).toHaveCount(3);
    await expect(page.getByTestId("media-gallery-counter")).toHaveText("1 / 3");

    await page.getByRole("button", { name: /siguiente archivo/i }).click();
    await expect(page.getByTestId("media-gallery-counter")).toHaveText("2 / 3");

    await page.getByRole("button", { name: /archivo 3 de 3/i }).click();
    await expect(page.getByTestId("media-gallery-counter")).toHaveText("3 / 3");
  });

  test("Then the listing card says how many there are", async ({ page }) => {
    const slug = testSlug("tonico-de-jengibre");
    await seedPost({
      title: "E2E Tonico de jengibre y curcuma",
      slug,
      kind: "producto",
      origin: "productor",
      price: 45,
      mediaCount: 4,
    });
    seeded.push(slug);

    await page.goto("/");

    const card = page
      .getByRole("article")
      .filter({ hasText: "Tonico de jengibre y curcuma" })
      .first();

    await expect(card.getByTestId("post-media-count")).toContainText("4");
  });
});

/**
 * The 23 publications in the database have exactly one file each. None of them may change how it
 * looks because of a feature it does not use — that is half of what `MediaGallery` is for, and the
 * half that breaks most easily when the component grows.
 */
test.describe("Given a publication with a single file", () => {
  const seeded: string[] = [];

  test.afterEach(async () => {
    for (const slug of seeded.splice(0)) {
      await deleteOnePostBySlug(slug);
    }
  });

  test("Then its detail page looks exactly as it did before", async ({
    page,
  }) => {
    const slug = testSlug("guia-etiquetas");
    await seedPost({
      title: "E2E Guia como leer etiquetas",
      slug,
      kind: "anuncio",
      origin: null,
    });
    seeded.push(slug);

    await page.goto(`/${slug}`);

    await expect(page.getByTestId("post-detail")).toBeVisible();
    await expect(page.getByTestId("media-gallery")).toHaveCount(0);
    await expect(page.getByTestId("media-gallery-counter")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /siguiente archivo/i }),
    ).toHaveCount(0);
  });

  test("Then its listing card carries no counter", async ({ page }) => {
    const slug = testSlug("ensalada-griega");
    await seedPost({
      title: "E2E Ensalada griega con queso feta",
      slug,
      kind: "producto",
      origin: "productor",
      price: 80,
    });
    seeded.push(slug);

    await page.goto("/");

    const card = page
      .getByRole("article")
      .filter({ hasText: "Ensalada griega con queso feta" })
      .first();

    await expect(card).toBeVisible();
    await expect(card.getByTestId("post-media-count")).toHaveCount(0);
  });
});
