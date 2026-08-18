import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { type SeedPostInput, seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";

const stamp = Date.now();

const movementPost = {
  title: `Caminata consciente ${stamp}`,
  slug: testSlug("caminata-consciente"),
  kind: "producto",
  origin: "productor",
  category: "movimiento_y_ejercicio",
  content: "Ritual breve para moverse con calma.",
} satisfies SeedPostInput;

const nutritionPost = {
  title: `Jugo verde ${stamp}`,
  slug: testSlug("jugo-verde"),
  kind: "producto",
  origin: "productor",
  category: "alimentacion",
  content: "Ritual fresco de alimentacion.",
} satisfies SeedPostInput;

const sleepPost = {
  title: `Ritual de sueño ${stamp}`,
  slug: testSlug("ritual-de-sueno"),
  kind: "anuncio",
  origin: "productor",
  category: "sueno_y_descanso",
  content: "Ritual para preparar la noche.",
} satisfies SeedPostInput;

const seeded = [movementPost, nutritionPost, sleepPost];

test.describe("Los listados públicos se filtran por pilar", () => {
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

  test("el home muestra los cuatro pilares y filtra Movimiento", async ({
    page,
  }) => {
    await page.goto("/");

    const filter = page.getByTestId("publication-pillar-filter");
    await expect(filter.getByRole("link", { name: "Todo" })).toBeVisible();
    await expect(filter.getByRole("link", { name: "Sueño" })).toBeVisible();
    await expect(
      filter.getByRole("link", { name: "Alimentación" }),
    ).toBeVisible();
    await expect(
      filter.getByRole("link", { name: "Movimiento" }),
    ).toBeVisible();
    await expect(
      filter.getByRole("link", { name: "Mente/Espíritu" }),
    ).toBeVisible();

    await filter.getByRole("link", { name: "Movimiento" }).click();

    await expect(page).toHaveURL(/pillar=movement/);
    await expect(
      page.getByRole("heading", { name: movementPost.title }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: nutritionPost.title }),
    ).toHaveCount(0);
  });

  test("productos conserva el pilar al paginar", async ({ page }) => {
    await page.goto("/productos?pillar=movement");

    await expect(
      page.getByRole("heading", { name: movementPost.title }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: nutritionPost.title }),
    ).toHaveCount(0);

    const next = page.getByRole("link", { name: "Siguiente" });
    if (await next.isVisible()) {
      await expect(next).toHaveAttribute("href", /pillar=movement/);
    }
  });

  test("la busqueda del Header respeta el pilar activo", async ({ page }) => {
    await page.goto("/?pillar=sleep");

    await page.getByRole("searchbox").first().fill("ritual");

    const dropdown = page.getByTestId("search-dropdown");
    await expect(dropdown.getByText(sleepPost.title)).toBeVisible();
    await expect(dropdown.getByText(movementPost.title)).toHaveCount(0);

    await page
      .getByRole("button", { name: "Ver todos los resultados" })
      .click();
    await expect(page).toHaveURL(/pillar=sleep/);
  });
});
