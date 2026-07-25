import { expect, type Locator, type Page } from "@playwright/test";
import { stubStorageUpload } from "../testUtils/stubStorageUpload";

type PublishValues = {
  title: string;
  price: string;
  file: string;
  phone: string;
  description: string;
  kind: "anuncio" | "producto";
  origin: string;
  category?: string;
  subCategory?: string;
};

/**
 * Page object del slice 1 del catálogo unificado: publicar con categoría y leer su etiqueta.
 * Los selectores de categoría solo existen cuando `kind` es "producto", así que se eligen
 * después de fijar el tipo de publicación.
 */
export default class UnifiedCatalogPage {
  private readonly form: Locator;

  constructor(private readonly page: Page) {
    this.form = this.page.getByRole("form").first();
  }

  async stubStorageUpload() {
    await stubStorageUpload(this.page);
  }

  async goto() {
    await this.page.goto("/publicar");
  }

  async fill(values: PublishValues) {
    await this.page
      .getByRole("textbox", { name: /t[ií]tulo de la publicación/i })
      .fill(values.title);
    await this.page.getByRole("spinbutton", { name: /precio/i }).fill(values.price);
    await this.page.getByRole("textbox", { name: /t[eé]lefono/i }).fill(values.phone);
    await this.page
      .getByRole("textbox", { name: /descripci[oó]n/i })
      .fill(values.description);
    await this.page
      .getByRole("combobox", { name: /tipo de publicación/i })
      .selectOption(values.kind);
    await this.page
      .getByRole("combobox", { name: /procedencia/i })
      .selectOption(values.origin);

    if (values.category) {
      await this.page
        .getByRole("combobox", { name: /^categoría/i })
        .selectOption(values.category);
    }

    if (values.subCategory) {
      await this.page
        .getByRole("combobox", { name: /sub-categoría/i })
        .selectOption(values.subCategory);
    }

    // El archivo va al final: dispara un `change` nativo que solo inicia la subida una vez
    // que React hidrató y enganchó su onChange.
    await this.page.locator('form input[type="file"]').setInputFiles(values.file);
  }

  async submit() {
    await expect(this.page.getByText(/subido/i)).toBeVisible({ timeout: 45_000 });
    const submitButton = this.form.getByRole("button", {
      name: "Publicar",
      exact: true,
    });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
  }

  categoryTag() {
    return this.page.getByTestId("category-tag");
  }

  /** Los selectores de categoría solo deben existir para publicaciones de tipo producto. */
  async expectCategorySelectorsHidden() {
    await expect(
      this.page.getByRole("combobox", { name: /^categoría/i }),
    ).toHaveCount(0);
    await expect(
      this.page.getByRole("combobox", { name: /sub-categoría/i }),
    ).toHaveCount(0);
  }
}
