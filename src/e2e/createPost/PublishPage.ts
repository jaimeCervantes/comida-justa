import { expect, Locator, type Page } from "@playwright/test";

type PublishValues = {
  title: string;
  price: string;
  file: string;
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

  constructor(page: Page) {
    this.page = page;
    this.form = this.page.getByRole("form").first();
    this.submitButton = this.page.getByRole("button", { name: 'Publicar', exact: true });
    this.title = this.page.getByRole("textbox", {
      name: /t[ií]tulo de la publicación/i,
    });
    this.price = this.page.getByRole("spinbutton", { name: /precio/i });
    this.description = this.page.getByRole("textbox", {
      name: /descripci[oó]n/i,
    });
    // input con label que contiene el texto "image"
    this.file = this.page.getByRole("textbox", { name: /image/i });
    this.phone = this.page.getByRole("textbox", { name: /t[eé]lefono/i });
    this.score = this.page.getByRole("article").getByText(/saludable/i);
  }

  async goToPublish() {
    await this.page.goto("/publicar");
  }

  async fillFields(values: PublishValues) {
    this.values = values;
    await this.title.fill(values.title);
    await this.price.fill(values.price);
    await this.file.setInputFiles(values.file);
    await this.phone.fill(values.phone);
    await this.description.fill(values.description);
  }

  async verifyForm() {
    await expect(this.form).toBeVisible();
    await expect(this.title).toHaveValue(this.values.title as string);
    await expect(this.price).toHaveValue(this.values.price as string);
    await expect(this.phone).toHaveValue(this.values.phone as string);
    await expect(this.description).toHaveValue(
      this.values.description as string
    );
  }

  async send() {
    await this.submitButton.click();
  }

  async verifyScore() {
    await expect(this.score).toBeVisible();
    await expect(this.score).toHaveText(/saludable/i);
  }
}
