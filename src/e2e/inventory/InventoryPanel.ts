import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { InventoryScope } from "~/domain/entities/post/inventoryScope";

/**
 * El panel de inventario de una tienda, `/cuenta/inventario`.
 *
 * Los escenarios hablan de renglones y de productos; dónde está cada `data-testid` se decide aquí.
 * Es lo que permite que el slice 3 mueva la tabla sin reescribir siete escenarios.
 */
export class InventoryPanel {
  constructor(private readonly page: Page) {}

  async open(scope?: InventoryScope): Promise<void> {
    await this.page.goto(
      scope && scope !== "all"
        ? `/cuenta/inventario?filtro=${scope}`
        : "/cuenta/inventario",
    );
  }

  get rows(): Locator {
    return this.page.getByTestId("inventory-row");
  }

  get empty(): Locator {
    return this.page.getByTestId("inventory-empty");
  }

  get needsStore(): Locator {
    return this.page.getByTestId("inventory-needs-store");
  }

  get nextPage(): Locator {
    return this.page.getByTestId("inventory-pagination-next");
  }

  /** Los títulos que se ven ahora mismo, en el orden en que se pintan. */
  titles(): Promise<string[]> {
    return this.rows.locator("a").allInnerTexts();
  }

  row(title: string): Locator {
    return this.rows.filter({ hasText: title });
  }

  /**
   * Escribe un número en el renglón de un producto y guarda.
   *
   * Espera a que el botón vuelva a estar habilitado, igual que la ficha: guardar invalida el layout
   * entero y en desarrollo esa recompilación se pasa del plazo por omisión.
   */
  async save(title: string, quantity: string): Promise<void> {
    const row = this.row(title);
    const submit = row.getByRole("button");

    await row.getByTestId("stock-input").fill(quantity);
    await submit.click();
    await expect(submit).toBeEnabled({ timeout: 30_000 });
  }

  stockOf(title: string): Locator {
    return this.row(title).getByTestId("stock-input");
  }
}
