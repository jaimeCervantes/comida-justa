import { expect, type Locator, type Page, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { seedStock } from "../testUtils/seedStock";
import { testPost } from "../testUtils/testSlug";

/**
 * Slice 3 de `docs/features/catalog/005-2026-11-10-filtros-del-catalogo.md`: el home y `/productos`
 * no tienen barra propia; sus filtros viven en la barra de cercanía del chrome.
 *
 * Lo que se afirma es la **forma** del resultado —ninguna tarjeta lleva la insignia de agotado— y no
 * qué tarjetas salen: los dos listados enseñan lo que la comunidad haya publicado hoy.
 */
test.describe("Un solo conjunto de filtros: el home y productos", () => {
  const miel = testPost("Miel de abeja melipona");

  test.afterEach(async () => {
    await deleteOnePostBySlug(miel.slug);
  });

  // Escenario "El home filtra por existencia también al cargar más" (@slice-3)
  test("El home filtra por existencia también al cargar más", async ({
    page,
  }) => {
    await seedPost({
      ...miel,
      kind: "producto",
      origin: "productor",
      price: 120,
    });
    await seedStock(miel.slug, 0);

    // El home es cronológico: lo recién sembrado encabeza el feed.
    await page.goto("/");
    await expect(
      feedCard(page, miel.title).getByTestId("sold-out-badge"),
    ).toBeVisible();

    await onlyAvailable(page).click();

    await expect(page).toHaveURL(/disponibles=1/);
    await expect(onlyAvailable(page)).toHaveAttribute("aria-pressed", "true");
    await expect(feedCard(page, miel.title)).toHaveCount(0);
    await expect(feed(page).getByTestId("sold-out-badge")).toHaveCount(0);

    /* Llegar al final del feed es «pedir más»: el observador del botón dispara la carga en cuanto
       se ve, así que basta con desplazarse hasta él y no hay carrera con un clic. */
    const nextPage = page.waitForRequest(/\/api\/posts\/page\/2\//);
    await page
      .getByRole("button", { name: es.feed.loadMore })
      .scrollIntoViewIfNeeded();

    expect((await nextPage).url()).toContain("disponibles=1");
    await expect(feed(page).getByTestId("sold-out-badge")).toHaveCount(0);
  });

  // Escenario "En productos, el filtro deja fuera lo agotado" (@slice-3)
  test("En productos, el filtro deja fuera lo agotado", async ({ page }) => {
    await page.goto("/productos");

    await onlyAvailable(page).click();

    await expect(page).toHaveURL(/disponibles=1/);
    await expect(onlyAvailable(page)).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByTestId("products-grid").locator("article").first(),
    ).toBeVisible();
    await expect(
      page.getByTestId("products-grid").getByTestId("sold-out-badge"),
    ).toHaveCount(0);
  });

  // Escenario "En productos, elegir un pilar no suelta la promoción" (@slice-3)
  test("En productos, elegir un pilar no suelta la promoción", async ({
    page,
  }) => {
    await page.goto("/productos?promocion=1");

    await nearbyBar(page)
      .getByRole("link", { name: es.publicationPillars.nutrition })
      .click();

    await expect(page).toHaveURL(/pillar=nutrition/);
    await expect(page).toHaveURL(/promocion=1/);
  });
});

function nearbyBar(page: Page): Locator {
  return page.getByTestId("nearby-bar");
}

function onlyAvailable(page: Page): Locator {
  return nearbyBar(page).getByTestId("filter-only-available");
}

function feed(page: Page): Locator {
  return page.getByTestId("feed-masonry");
}

function feedCard(page: Page, title: string): Locator {
  return feed(page).locator("article").filter({ hasText: title });
}
