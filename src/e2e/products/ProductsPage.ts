import { expect, type Locator, type Page } from "@playwright/test";

/** Page object for the Hazlo Sano products listing (`/productos`). */
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

  async expectHazloSanoBadge() {
    await expect(this.page.getByTestId("provenance-badge").first()).toHaveText(
      /Hazlo Sano/,
    );
  }
}
