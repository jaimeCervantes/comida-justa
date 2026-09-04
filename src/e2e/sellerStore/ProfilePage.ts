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

  /**
   * Tras reservarla, la dirección personal se lee y se puede repartir.
   *
   * **Cambió de ancla en el slice 1 de `005-2026-09-04-cuenta-configurable`, no de promesa.** Se
   * buscaba en `username-card`, la tarjeta que pintaba `UsernameSection` al volver el estado; esa
   * tarjeta nunca llegaba a verse —la Server Action revalida `/cuenta` y la sección entera deja de
   * montarse— y se retiró. Donde aterriza de verdad quien acaba de reservarla es la cabecera de
   * identidad, que es la dueña de las direcciones públicas.
   */
  async expectClaimed(username: string): Promise<void> {
    await expect(
      this.page
        .getByTestId("account-identity")
        .getByRole("link", { name: new RegExp(`/u/${username}$`) }),
    ).toBeVisible();
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
