import { expect, type Locator, type Page, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { seedStock } from "../testUtils/seedStock";
import { testPost } from "../testUtils/testSlug";

/**
 * Slice 1 de `docs/features/catalog/005-2026-11-10-filtros-del-catalogo.md`: la barra única, con
 * «Solo con existencia», en una categoría.
 *
 * `salsas_y_aderezos` se eligió porque en la base compartida no tiene ninguna publicación: el
 * listado pagina de cuatro en cuatro y ordena por cercanía, así que en una categoría poblada lo
 * sembrado podría caer en la página 2 y el escenario dependería de lo que publique la comunidad.
 */
const CATEGORY = "salsas_y_aderezos";
const CATEGORY_LABEL = "Salsas y Aderezos";
const CATEGORY_PATH = `/categoria/${CATEGORY}`;

test.describe("Un solo conjunto de filtros: «Solo con existencia» en una categoría", () => {
  const salsa = testPost("Salsa macha de cacahuate");
  const aderezo = testPost("Aderezo de chipotle");

  test.beforeEach(async () => {
    for (const [post, piezas] of [
      [salsa, 8],
      [aderezo, 0],
    ] as const) {
      await seedPost({
        ...post,
        kind: "producto",
        origin: "productor",
        price: 85,
        category: "alimentacion",
        subCategory: CATEGORY,
      });
      await seedStock(post.slug, piezas);
    }
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(salsa.slug);
    await deleteOnePostBySlug(aderezo.slug);
  });

  // Escenario "En una categoría, el filtro deja fuera lo agotado" (@slice-1)
  test("Encender el filtro deja fuera lo agotado", async ({ page }) => {
    await page.goto(CATEGORY_PATH);
    await expect(card(page, aderezo.title)).toBeVisible();

    await onlyAvailable(page).click();

    await expect(page).toHaveURL(/disponibles=1/);
    await expect(onlyAvailable(page)).toHaveAttribute("aria-pressed", "true");
    await expect(card(page, salsa.title)).toBeVisible();
    await expect(card(page, aderezo.title)).toHaveCount(0);
  });

  // Escenario "Apagar el filtro vuelve a enseñar todo" (@slice-1)
  test("Apagarlo vuelve a enseñar todo", async ({ page }) => {
    await page.goto(`${CATEGORY_PATH}?disponibles=1`);
    await expect(card(page, aderezo.title)).toHaveCount(0);

    await onlyAvailable(page).click();

    await expect(page).not.toHaveURL(/disponibles=/);
    await expect(onlyAvailable(page)).toHaveAttribute("aria-pressed", "false");
    await expect(card(page, salsa.title)).toBeVisible();
    await expect(card(page, aderezo.title)).toBeVisible();
  });

  // Escenario "Cambiar de pilar no suelta el filtro" (@slice-1)
  test("Cambiar de pilar no suelta el filtro", async ({ page }) => {
    await page.goto(`${CATEGORY_PATH}?disponibles=1`);

    await filters(page)
      .getByRole("link", { name: es.publicationPillars.nutrition })
      .click();

    await expect(page).toHaveURL(/pillar=nutrition/);
    await expect(page).toHaveURL(/disponibles=1/);
    await expect(onlyAvailable(page)).toHaveAttribute("aria-pressed", "true");
    await expect(card(page, salsa.title)).toBeVisible();
    await expect(card(page, aderezo.title)).toHaveCount(0);
  });

  // Escenario "Con todo agotado, el vacío ofrece quitar el filtro" (@slice-1)
  test("Con todo agotado, el vacío ofrece quitar el filtro", async ({
    page,
  }) => {
    await seedStock(salsa.slug, 0);

    await page.goto(`${CATEGORY_PATH}?disponibles=1`);

    const empty = page.getByTestId("category-empty-only-available");
    await expect(empty).toContainText(
      es.category.emptyOnlyAvailable.replace("{category}", CATEGORY_LABEL),
    );

    await empty.getByRole("link", { name: es.category.seeAllCategory }).click();

    await expect(page).not.toHaveURL(/disponibles=/);
    await expect(card(page, salsa.title)).toBeVisible();
    await expect(card(page, aderezo.title)).toBeVisible();
  });
});

function filters(page: Page): Locator {
  return page.getByTestId("listing-filters");
}

function onlyAvailable(page: Page): Locator {
  return filters(page).getByTestId("filter-only-available");
}

function card(page: Page, title: string): Locator {
  return page
    .getByTestId("category-grid")
    .locator("article")
    .filter({ hasText: title });
}
