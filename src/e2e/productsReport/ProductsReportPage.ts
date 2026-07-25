import { expect, type Locator, type Page } from "@playwright/test";

/** Page object for the admin-only products-by-origin report (`/admin/productos`). */
export default class ProductsReportPage {
  private readonly table: Locator;

  constructor(private readonly page: Page) {
    this.table = this.page.getByTestId("origin-report");
  }

  async goto() {
    await this.page.goto("/admin/productos");
  }

  async expectVisible() {
    await expect(this.table).toBeVisible();
  }

  async expectNotVisible() {
    await expect(this.table).toHaveCount(0);
  }

  /** Conteo actual de una procedencia; `null` para la fila de "sin especificar". */
  async countFor(origin: string | null): Promise<number> {
    const cell = this.page.getByTestId(
      `origin-count-${origin ?? "sin_especificar"}`,
    );
    await expect(cell).toBeVisible();

    return Number((await cell.innerText()).trim());
  }
}
