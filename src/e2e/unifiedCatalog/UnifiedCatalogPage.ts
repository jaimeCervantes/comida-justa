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
 * La categoría se elige después de fijar el tipo de publicación porque la sub-categoría se
 * encadena a ella, no porque el tipo la haga aparecer: se pregunta en los dos kinds.
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
    await this.page
      .getByRole("spinbutton", { name: /precio/i })
      .fill(values.price);
    await this.page
      .getByRole("textbox", { name: /t[eé]lefono/i })
      .fill(values.phone);
    await this.page
      .getByRole("textbox", { name: /descripci[oó]n/i })
      .fill(values.description);
    await this.page
      .getByRole("combobox", { name: /tipo de publicación/i })
      .selectOption(values.kind);
    // Por `#origin` y no por su etiqueta: la etiqueta es una pregunta al vendedor y se redacta de
    // nuevo cada vez que se afina el tono. El id es el contrato del campo.
    await this.page.locator("#origin").selectOption(values.origin);

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
    await this.page
      .locator('form input[type="file"]')
      .setInputFiles(values.file);
  }

  async submit() {
    await expect(this.page.getByText(/subido/i)).toBeVisible({
      timeout: 45_000,
    });
    const submitButton = this.form.getByRole("button", {
      name: "Publicar",
      exact: true,
    });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
  }

  /**
   * La insignia de categoría **de la ficha**, no la de cualquier tarjeta.
   *
   * Antes buscaba en toda la página y funcionaba de casualidad: en inglés las publicaciones
   * relacionadas no se pintaban —su semilla se buscaba por slug y en inglés no existía—, así que
   * solo había una insignia. Al arreglar ese bug aparecieron cinco y el locator se volvió ambiguo.
   */
  categoryTag() {
    return this.page.getByTestId("post-detail").getByTestId("category-tag");
  }

  /**
   * La categoría se pregunta sea cual sea el tipo de publicación; la sub-categoría no aparece
   * hasta que hay una categoría elegida, porque la base rechaza la huérfana.
   */
  async expectCategoryOffered() {
    await expect(
      this.page.getByRole("combobox", { name: /^categoría/i }),
    ).toBeVisible();
    await expect(
      this.page.getByRole("combobox", { name: /sub-categoría/i }),
    ).toHaveCount(0);
  }

  /** La procedencia describe algo que se vende, así que solo la pide un producto. */
  origin() {
    return this.page.locator("#origin");
  }
}
