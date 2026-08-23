import { expect, type Locator, type Page } from "@playwright/test";
import { choosePublishKind } from "../testUtils/choosePublishKind";
import { MediaTray } from "../testUtils/mediaTray";
import { openPublishStep } from "../testUtils/openPublishStep";
import { stubStorageUpload } from "../testUtils/stubStorageUpload";

type PublishValues = {
  title: string;
  /**
   * Cuánto cuesta. Opcional porque no todos los tipos lo piden: un `anuncio` no se vende y su campo
   * de precio ni siquiera está en la página.
   */
  price?: string;
  /** One path, or several: a publication now carries up to ten files. */
  file: string | string[];
  phone: string;
  description: string;
  /**
   * Qué se publica. `producto` por omisión porque es lo que implica pasar `price`.
   *
   * El formulario abre en `anuncio`, y un anuncio **no pinta precio ni procedencia**: son campos
   * de lo que se vende (`507241d`). Sin elegir el tipo, `fillFields` se quedaba esperando un
   * `spinbutton` que nunca existió y el escenario moría por tiempo agotado.
   */
  kind?: string;
  /** De dónde viene. Obligatoria en un producto, así que sin ella no se puede enviar. */
  origin?: string;
};

/** Los tipos que pintan precio, y los que además pintan procedencia. Es la regla de `PublishForm`. */
const KINDS_WITH_PRICE = ["producto", "evento", "servicio"];
const KINDS_WITH_ORIGIN = ["producto"];

export default class PublishPage {
  readonly page: Page;
  readonly form: Locator;
  readonly submitButton: Locator;
  readonly title: Locator;
  readonly origin: Locator;
  readonly price: Locator;
  readonly description: Locator;
  readonly file: Locator;
  readonly phone: Locator;
  readonly score: Locator;
  private values: Partial<PublishValues> = {};
  private uploaded: Locator;
  private tray: MediaTray;

  constructor(page: Page) {
    this.page = page;
    this.tray = new MediaTray(page);
    this.form = this.page.getByRole("form").first();
    this.submitButton = this.form.getByRole("button", {
      name: "Publicar",
      exact: true,
    });
    this.title = this.page.getByRole("textbox", {
      name: /t[ií]tulo de la publicación/i,
    });
    /* El tipo ya no es un `combobox`: desde el 5.3 son píldoras. Quien lo elige es
       `choosePublishKind`, que sabe el `data-testid` y no depende del idioma del rótulo. */
    this.origin = this.page.getByRole("combobox", { name: /de dónde viene/i });
    this.price = this.page.getByRole("spinbutton", { name: /precio/i });
    this.description = this.page.getByRole("textbox", {
      name: /descripci[oó]n/i,
    });
    // input con label que contiene el texto "image"
    this.file = this.page.locator('form input[type="file"]');
    this.phone = this.page.getByRole("textbox", { name: /tel[eé]fono/i });
    this.score = this.page.getByRole("article").getByText(/saludable/i);
    this.uploaded = this.page.getByText(/subido/i);
  }

  /** @see stubStorageUpload — keeps the publish flow off Google Cloud Storage. */
  async stubStorageUpload() {
    await stubStorageUpload(this.page);
  }

  async goToPublish() {
    await this.page.goto("/publicar");
  }

  async fillFields(values: PublishValues) {
    this.values = values;
    await this.title.fill(values.title);
    /* El tipo va antes que nada: es lo que decide qué campos existen. Precio y procedencia sólo
       se pintan en lo que se vende, así que llenarlos antes de elegirlo es esperar a un campo
       que aún no está en la página. */
    const kind = values.kind ?? "producto";
    await choosePublishKind(this.page, kind);

    /* Se decide por el tipo y no preguntando si el control está visible: si un día `producto` deja
       de pintar el precio, esto tiene que fallar y no seguir de largo — que es exactamente lo que
       hizo pasar desapercibida la rotura de `507241d`. */
    await openPublishStep(this.page, "origin");

    if (KINDS_WITH_ORIGIN.includes(kind))
      await this.origin.selectOption(values.origin ?? "reventa_cercana");

    if (KINDS_WITH_PRICE.includes(kind) && values.price !== undefined)
      await this.price.fill(values.price);

    await openPublishStep(this.page, "phone");
    await this.phone.fill(values.phone);
    await this.description.fill(values.description);
    // Set the file last: it fires a native `change` event that only starts the upload
    // once React has hydrated and attached its onChange handler. Filling the controlled
    // fields above guarantees hydration happened, so the event isn't dropped and the
    // "Subido" state actually appears.
    await this.file.setInputFiles(values.file);
  }

  /** Adds files to whatever is already in the tray, the way a second trip to the picker does. */
  async addFiles(files: string | string[]) {
    await this.file.setInputFiles(files);
    await expect(this.uploaded).toBeVisible({ timeout: 45_000 });
  }

  /** How many files the tray is holding right now. */
  trayItems(): Locator {
    return this.tray.items();
  }

  trayCounter(): Locator {
    return this.tray.counter();
  }

  /**
   * Removes the file at `position` (1-based, the number shown on the thumbnail).
   *
   * Through `MediaTray` and no longer through a local `archivo ${position}` regex: between the two
   * move arrows and the thumbnail that opens the file at full size, that regex now matches four
   * buttons per file and Playwright fails on the ambiguity. One place knows the tray's labels, so
   * the next button added to it breaks one file instead of every screen that drives it.
   */
  async removeFile(position: number) {
    await this.tray.remove(position).click();
  }

  /* Cada campo se comprueba en su paso: el asistente esconde los otros dos. */
  async verifyForm() {
    await expect(this.form).toBeVisible();

    await openPublishStep(this.page, "title");
    await expect(this.title).toHaveValue(this.values.title as string);

    if (this.values.price !== undefined) {
      await openPublishStep(this.page, "price");
      await expect(this.price).toHaveValue(this.values.price);
    }

    await openPublishStep(this.page, "phone");
    await expect(this.phone).toHaveValue(this.values.phone as string);
    await expect(this.description).toHaveValue(
      this.values.description as string,
    );
  }

  async send() {
    // Publicar vive en el último paso del asistente.
    await openPublishStep(this.page, "phone");
    await expect(this.uploaded).toBeVisible({ timeout: 45_000 });
    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();
  }

  async verifyScore() {
    await expect(this.score).toBeVisible();
    await expect(this.score).toHaveText(/saludable/i);
  }
}
