import { expect, type Locator, type Page } from "@playwright/test";

/** Page object for the community products listing (`/productos`). */
export default class ProductsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/productos");
  }

  /** Each listed card renders its title inside a heading. */
  cardTitle(title: string): Locator {
    return this.page.getByRole("heading", { name: title, exact: true });
  }

  async expectListed(title: string) {
    await expect(this.cardTitle(title)).toBeVisible();
  }

  async expectNotListed(title: string) {
    await expect(this.cardTitle(title)).toHaveCount(0);
  }

  card(title: string): Locator {
    return this.cardTitle(title).locator("xpath=ancestor::article[1]");
  }

  async expectCanBeAddedToCart(title: string) {
    await expect(this.card(title).getByTestId("add-to-cart")).toBeVisible();
  }

  async expectLinksToBooking(title: string) {
    await expect(
      this.card(title).getByTestId("card-book-service"),
    ).toBeVisible();
  }

  /**
   * La procedencia sigue a la vista. Desde que la página lista a toda la comunidad es lo único
   * que distingue lo de la marca de lo de un vecino, así que dejar de pintarla sería perder la
   * información que hacía falta para leer la lista.
   */
  async expectProvenanceIsShown() {
    await expect(
      this.page.getByTestId("provenance-badge").first(),
    ).toBeVisible();
  }
}
