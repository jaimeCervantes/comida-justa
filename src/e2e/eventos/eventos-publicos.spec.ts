import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { type SeedPostInput, seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";

const stamp = Date.now();

const product = {
  title: `Jugo Verde ${stamp}`,
  slug: testSlug("jugo-verde-eventos-publicos"),
  kind: "producto",
  origin: "hazlo_sano_propio",
} satisfies SeedPostInput;

const service = {
  title: `Masaje relajante 30 minutos ${stamp}`,
  slug: testSlug("masaje-relajante-eventos-publicos"),
  kind: "servicio",
  origin: null,
  durationMinutes: 30,
} satisfies SeedPostInput;

const soonerEvent = {
  title: `Meditacion guiada en el parque ${stamp}`,
  slug: testSlug("meditacion-guiada-eventos-publicos"),
  kind: "evento",
  origin: null,
  price: null,
  startsAt: new Date("2027-08-23T07:30:00Z"),
} satisfies SeedPostInput;

const laterEvent = {
  title: `Taller de higiene del sueno ${stamp}`,
  slug: testSlug("taller-higiene-sueno-eventos-publicos"),
  kind: "evento",
  origin: null,
  price: null,
  startsAt: new Date("2027-08-25T19:00:00Z"),
} satisfies SeedPostInput;

const seeded = [product, service, soonerEvent, laterEvent];

test.describe("When a visitor opens the public events page", () => {
  test.beforeEach(async () => {
    for (const post of seeded) {
      await seedPost(post);
    }
  });

  test.afterEach(async () => {
    for (const post of seeded) {
      await deleteOnePostBySlug(post.slug);
    }
  });

  test("Then it lists only events ordered by event date", async ({ page }) => {
    await page.goto("/eventos");

    const grid = page.getByTestId("events-grid");
    await expect(
      grid.getByRole("heading", { name: soonerEvent.title }),
    ).toBeVisible();
    await expect(
      grid.getByRole("heading", { name: laterEvent.title }),
    ).toBeVisible();
    await expect(
      grid.getByRole("heading", { name: product.title }),
    ).toHaveCount(0);
    await expect(
      grid.getByRole("heading", { name: service.title }),
    ).toHaveCount(0);
    await expect(grid.getByTestId("event-date")).toHaveCount(2);

    await expect
      .poll(async () => {
        const titles = await grid.getByRole("heading").allTextContents();

        return (
          titles.indexOf(soonerEvent.title) < titles.indexOf(laterEvent.title)
        );
      })
      .toBe(true);
  });

  test("Then the English route renders the same event listing", async ({
    page,
  }) => {
    await page.goto("/en/events");

    await expect(
      page.getByRole("heading", { name: "Events", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: soonerEvent.title }),
    ).toBeVisible();
  });
});
