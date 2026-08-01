import { expect, type Locator, type Page } from "@playwright/test";

/** Page object del perfil público `/u/<username>` y de su alta en `/cuenta`. */
export default class ProfilePage {
  private readonly form: Locator;

  constructor(private readonly page: Page) {
    this.form = this.page.getByRole("form", {
      name: /elige tu dirección personal/i,
    });
  }

  async gotoAccount(): Promise<void> {
    await this.page.goto("/cuenta");
  }

  async goto(username: string): Promise<number | undefined> {
    const response = await this.page.goto(`/u/${username}`);

    return response?.status();
  }

  async claim(username: string): Promise<void> {
    await this.page
      .getByRole("textbox", { name: /nombre de usuario/i })
      .fill(username);
    await this.form
      .getByRole("button", { name: /reservar mi dirección/i })
      .click();
  }

  async expectClaimed(username: string): Promise<void> {
    await expect(
      this.page.getByTestId("username-card").getByRole("link"),
    ).toContainText(`/u/${username}`);
  }

  async expectError(message: RegExp): Promise<void> {
    await expect(this.page.getByTestId("username-error")).toContainText(
      message,
    );
  }

  async expectPublicationListed(title: string): Promise<void> {
    await expect(
      this.page
        .getByTestId("profile-publications")
        .getByText(title, { exact: false }),
    ).toBeVisible();
  }

  async expectStoreLink(): Promise<void> {
    await expect(this.page.getByTestId("profile-store-link")).toBeVisible();
  }
}
