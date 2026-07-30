import { expect, type Locator, type Page } from "@playwright/test";

/** Page object de `/admin/catalogo`, la pantalla que administra la taxonomía. */
export default class AdminCatalogPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/admin/catalogo");
  }

  heading(): Locator {
    return this.page.getByRole("heading", { level: 1, name: "Catálogo de categorías" });
  }

  async expectOnPage() {
    await expect(this.heading()).toBeVisible();
  }

  row(key: string): Locator {
    return this.page.getByTestId(`category-${key}`);
  }

  state(key: string): Locator {
    return this.page.getByTestId(`state-${key}`);
  }

  toggle(key: string): Locator {
    return this.page.getByTestId(`toggle-${key}`);
  }

  /** Da de alta una sub-categoría por el formulario, como lo haría quien administra. */
  async addSubCategory(input: {
    parentKey: string;
    key: string;
    labelEs: string;
    labelEn?: string;
  }) {
    await this.page.selectOption("#parentKey", input.parentKey);
    await this.page.getByLabel("Clave (así se guarda):").fill(input.key);
    await this.page.getByLabel("Etiqueta en español:").fill(input.labelEs);

    if (input.labelEn) {
      await this.page.getByLabel("Etiqueta en inglés (opcional):").fill(input.labelEn);
    }

    await this.page.getByRole("button", { name: "Agregar" }).click();
  }

  created(): Locator {
    return this.page.getByTestId("catalogo-creada");
  }

  /** El mensaje de un campo inválido; el formulario los muestra junto a su campo. */
  fieldError(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }
}
