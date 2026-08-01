import { expect, type Page } from "@playwright/test";

/**
 * Acciones sobre el idioma activo del sitio.
 *
 * El rótulo del menú se pide **en inglés** desde que el slice 1 extrajo el texto del header: que
 * exista un enlace llamado "Products" ya es parte de lo que se afirma, no un detalle del selector.
 */
export default class LocalePage {
  constructor(private readonly page: Page) {}

  async openInEnglish(path = ""): Promise<void> {
    await this.page.goto(`/en${path}`);
  }

  /** El enlace del menú principal de escritorio, rotulado en el idioma activo. */
  async openFromMainMenu(label: string): Promise<void> {
    await this.page
      .getByRole("navigation")
      .getByRole("link", { name: label, exact: true })
      .click();
  }

  async expectPathname(expected: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${expected}/?$`));
  }
}
