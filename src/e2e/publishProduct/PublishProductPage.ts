import { expect, type Locator, type Page } from "@playwright/test";
import { openPublishStep } from "../testUtils/openPublishStep";
import { stubStorageUpload } from "../testUtils/stubStorageUpload";

type PublishProductValues = {
  title: string;
  price: string;
  file: string;
  phone: string;
  description: string;
  kind: "anuncio" | "producto";
  /**
   * Obligatoria en un producto, para cualquiera que publique. Solo un admin ve las `hazlo_sano_*`;
   * un vendedor ve las tres de la comunidad. Un anuncio no la pregunta, así que se omite.
   */
  origin?: string;
};

/**
 * Page object for publishing a product from /publicar.
 *
 * The `hazlo_sano_*` origins are admin-only, so a flow that selects one assumes the logged-in
 * user's email is listed in HAZLO_SANO_ADMIN_EMAILS.
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
    /* El tipo va primero: es lo que decide qué campos existen. El formulario abre en `anuncio`,
       y un anuncio no pinta ni precio ni procedencia —son campos de lo que se vende—, así que
       llenarlos antes de elegirlo es esperar a un campo que todavía no está en la página. */
    await this.page
      .getByRole("combobox", { name: /tipo de publicación/i })
      .selectOption(values.kind);
    await openPublishStep(this.page, "price");
    await this.page
      .getByRole("spinbutton", { name: /precio/i })
      .fill(values.price);
    if (values.origin) {
      await this.page
        // Por `#origin` y no por su etiqueta: la etiqueta es una pregunta al vendedor y se
        // redacta de nuevo cada vez que se afina el tono. El id es el contrato del campo.
        .locator("#origin")
        .selectOption(values.origin);
    }

    await openPublishStep(this.page, "phone");
    await this.page
      .getByRole("textbox", { name: /tel[eé]fono/i })
      .fill(values.phone);
    await this.page
      .getByRole("textbox", { name: /descripci[oó]n/i })
      .fill(values.description);
    // Set the file last: it fires a native `change` event that only starts the
    // upload once React has hydrated and attached its onChange handler. Doing it
    // after the controlled fields above guarantees hydration has happened, so the
    // event isn't dropped and the "Subido" state actually appears.
    await this.page
      .locator('form input[type="file"]')
      .setInputFiles(values.file);
  }

  async submit() {
    // Publicar vive en el último paso del asistente.
    await openPublishStep(this.page, "phone");
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

  async expectHazloSanoBadge() {
    await expect(this.page.getByTestId("provenance-badge")).toHaveText(
      /Hazlo Sano/,
    );
  }
}
