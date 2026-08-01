import { expect, type Page } from "@playwright/test";

/**
 * Acciones sobre el idioma activo del sitio.
 *
 * Solo mira **direcciones**, nunca textos: en el slice 0 la interfaz sigue escrita en español
 * dentro del TSX, así que afirmar "dice Products" sería afirmar algo que el slice 1 todavía no
 * construye. Lo que este slice promete es que el idioma no se pierde al navegar.
 */
export default class LocalePage {
  constructor(private readonly page: Page) {}

  async openInEnglish(path = ""): Promise<void> {
    await this.page.goto(`/en${path}`);
  }

  /** El enlace del menú principal de escritorio, que hoy sigue rotulado en español. */
  async openProductsFromMainMenu(): Promise<void> {
    await this.page
      .getByRole("navigation")
      .getByRole("link", { name: "Productos", exact: true })
      .click();
  }

  async expectPathname(expected: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${expected}/?$`));
  }
}
