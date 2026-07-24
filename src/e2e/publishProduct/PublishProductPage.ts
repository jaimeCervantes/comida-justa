import { expect, type Locator, type Page } from "@playwright/test";
import { stubStorageUpload } from "../testUtils/stubStorageUpload";

type PublishProductValues = {
  title: string;
  price: string;
  file: string;
  phone: string;
  description: string;
  kind: "anuncio" | "producto";
  origin: string;
};

/**
 * Page object for publishing a Hazlo Sano product from /publicar.
 * The `origin` selector is admin-only, so this flow assumes the logged-in user's
 * email is listed in HAZLO_SANO_ADMIN_EMAILS.
 */
export default class PublishProductPage {
  private readonly form: Locator;

  constructor(private readonly page: Page) {
    this.form = this.page.getByRole("form").first();
  }

  /** @see stubStorageUpload — keeps the publish flow off Google Cloud Storage. */
  async stubStorageUpload() {
    await stubStorageUpload(this.page);
  }

  async goto() {
    await this.page.goto("/publicar");
  }

  async fill(values: PublishProductValues) {
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
    // Set the file last: it fires a native `change` event that only starts the
    // upload once React has hydrated and attached its onChange handler. Doing it
    // after the controlled fields above guarantees hydration has happened, so the
    // event isn't dropped and the "Subido" state actually appears.
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

  async expectHazloSanoBadge() {
    await expect(this.page.getByTestId("provenance-badge")).toHaveText(
      /Hazlo Sano/,
    );
  }
}
