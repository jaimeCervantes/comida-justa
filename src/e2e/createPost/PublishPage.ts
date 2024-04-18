import { expect, Locator, type Page } from "@playwright/test";

type PublishValues = {
  title: string;
  price: string;
  image: string;
  description: string;
};

export default class PublishPage {
  readonly page: Page;
  readonly form: Locator;
  readonly submitButton: Locator;
  readonly title: Locator;
  readonly price: Locator;
  readonly description: Locator;
  readonly image: Locator;
  readonly score: Locator;
  private values: Partial<PublishValues> = {};

  constructor(page: Page) {
    this.page = page;
    this.form = this.page.getByRole("form", {
      name: "Publica tu nueva comida sana",
    });
    this.submitButton = this.page.getByRole("button", { name: /publicar/i });
    this.title = this.page.getByRole("textbox", {
      name: /titulo de la publicación/i,
    });
    this.price = this.page.getByRole("spinbutton", { name: /precio/i });
    this.description = this.page.getByRole("textbox", {
      name: /descripci[oó]n/i,
    });
    // input con label que contiene el texto "image"
    this.image = this.page.getByRole("textbox", { name: /image/i });
    this.score = this.page.getByRole("article").getByText(/saludable/i);
  }

  async goToPublish() {
    await this.page.goto("/publicar");
  }

  async fillFields(values: PublishValues) {
    this.values = values;
    await this.title.fill(values.title);
    await this.price.fill(values.price);
    await this.description.fill(values.description);
    await this.image.setInputFiles(values.image);
  }

  async verifyForm() {
    await expect(this.form).toBeVisible();
    await expect(this.title).toHaveValue(this.values.title as string);
    await expect(this.price).toHaveValue(this.values.price as string);
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
