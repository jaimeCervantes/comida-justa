import { expect, test } from "@playwright/test";
import { PAGINATION_PAGE_SIZE } from "~/infra/constants";

// Regresión: el handler vivía en `route.tsx`, extensión que Next.js no resuelve para route
// handlers, así que /api/posts/... devolvía el 404 en HTML y el feed dejaba de crecer en
// silencio (el cliente traga el error en un try/catch).
// Escenarios en src/e2e/loadMorePosts/loadMorePosts.feature.

test.describe("When the feed loads more posts", () => {
  test("Then the pagination endpoint answers JSON, not the not-found page", async ({
    request,
  }) => {
    const response = await request.get(
      `/api/posts/page/2/pageSize/${PAGINATION_PAGE_SIZE}`,
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");

    const body = await response.json();
    expect(Array.isArray(body.posts)).toBe(true);
  });

  test("Then pressing 'Cargar más' appends the next page without repeating cards", async ({
    page,
  }) => {
    await page.goto("/");

    const cards = page.getByRole("article");
    const initialCount = await cards.count();

    const loadMore = page.getByRole("button", { name: /cargar más/i });

    // Con pocas publicaciones el botón no aparece: no hay nada que paginar.
    test.skip(
      (await loadMore.count()) === 0,
      "there is only one page of posts to show",
    );

    await loadMore.click();
    await expect
      .poll(async () => cards.count(), { timeout: 15_000 })
      .toBeGreaterThan(initialCount);

    const titles = await cards.locator("h2, h3").allInnerTexts();
    expect(new Set(titles).size).toBe(titles.length);
  });
});
