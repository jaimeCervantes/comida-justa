import { expect, type Locator, type Page } from "@playwright/test";
import { MediaTray } from "../testUtils/mediaTray";
import { stubStorageUpload } from "../testUtils/stubStorageUpload";

type PublishValues = {
  title: string;
  price: string;
  /** One path, or several: a publication now carries up to ten files. */
  file: string | string[];
  phone: string;
  description: string;
};

export default class PublishPage {
  readonly page: Page;
  readonly form: Locator;
  readonly submitButton: Locator;
  readonly title: Locator;
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
    this.price = this.page.getByRole("spinbutton", { name: /precio/i });
    this.description = this.page.getByRole("textbox", {
      name: /descripci[oó]n/i,
    });
    // input con label que contiene el texto "image"
    this.file = this.page.locator('form input[type="file"]');
    this.phone = this.page.getByRole("textbox", { name: /t[eé]lefono/i });
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
    await this.price.fill(values.price);
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
   * Through `MediaTray` and no longer through a local `archivo ${position}` regex: since editing
   * added a second button per file ("hacer portada"), that regex matches two buttons and Playwright
   * fails on the ambiguity. One place knows the tray's labels, so the next button added to it breaks
   * one file instead of every screen that drives it.
   */
  async removeFile(position: number) {
    await this.tray.remove(position).click();
  }

  async verifyForm() {
    await expect(this.form).toBeVisible();
    await expect(this.title).toHaveValue(this.values.title as string);
    await expect(this.price).toHaveValue(this.values.price as string);
    await expect(this.phone).toHaveValue(this.values.phone as string);
    await expect(this.description).toHaveValue(
      this.values.description as string,
    );
  }

  async send() {
    await expect(this.uploaded).toBeVisible({ timeout: 45_000 });
    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();
  }

  async verifyScore() {
    await expect(this.score).toBeVisible();
    await expect(this.score).toHaveText(/saludable/i);
  }
}
