import { expect, type Locator, type Page } from "@playwright/test";
import es from "~/i18n/messages/es.json";

/**
 * Los dos desplegables que viven en la cabecera: el del idioma y el que cuelga del avatar.
 *
 * La suite corre en español (`playwright.config.ts` fija `locale: "es-MX"`), así que los botones se
 * buscan por el rótulo accesible que ve quien visita el sitio.
 */
export default class HeaderMenusPage {
  constructor(private readonly page: Page) {}

  async goto(path = "/"): Promise<void> {
    await this.page.goto(path);
  }

  languageMenu(): Locator {
    return this.page.getByTestId("language-menu");
  }

  userMenu(): Locator {
    return this.page.getByTestId("user-menu");
  }

  /**
   * Abre el conmutador de idioma, que **vive en el pie** desde el 5.16.
   *
   * Bajó del header por instrucción del canvas: la barra de arriba ya cargaba con búsqueda,
   * publicar y cuenta. Hay que desplazarse hasta él antes de pulsarlo, porque el pie está al final
   * de la página y Playwright no pulsa lo que no está a la vista.
   */
  async openLanguageMenu(): Promise<void> {
    const boton = this.page
      .locator("footer")
      .getByRole("button", { name: es.nav.changeLanguage });

    await boton.scrollIntoViewIfNeeded();
    await boton.click();

    await expect(this.languageMenu()).toBeVisible();
  }

  async openUserMenu(): Promise<void> {
    await this.page.getByRole("button", { name: es.nav.openUserMenu }).click();

    await expect(this.userMenu()).toBeVisible();
  }

  async chooseLanguage(label: string): Promise<void> {
    await this.languageMenu().getByText(label).click();
  }

  /**
   * Un toque en cualquier otra parte, que es lo que hace todo el mundo para cerrar un desplegable.
   *
   * Va por coordenadas y no por `locator.click()` a propósito. Un desplegable abierto de Radix es
   * modal: pone `pointer-events: none` en el cuerpo, así que Playwright consideraría que algo
   * intercepta el clic y la prueba fallaría por la razón equivocada. `mouse.click` dispara el
   * evento donde se le dice, sin comprobaciones — igual que un dedo.
   *
   * El punto está en el margen izquierdo, bajo la cabecera: ahí no hay ningún enlace, y que la
   * dirección no cambie es parte de lo que cada escenario afirma.
   */
  async clickOutside(): Promise<void> {
    await this.page.mouse.click(5, 300);
  }

  /**
   * Tocar un enlace del menú principal **teniendo un desplegable abierto**.
   *
   * Va por coordenadas por la misma razón que `clickOutside`, y además porque es lo único que
   * distingue este escenario del anterior: lo que se afirma no es que el desplegable se cierre
   * —eso ya pasaba— sino que el toque **llegue a su destino** en vez de gastarse en cerrarlo.
   */
  async clickLinkBehindTheMenu(label: string): Promise<void> {
    const link = this.page
      .getByRole("navigation")
      .getByRole("link", { name: label, exact: true })
      .first();
    const box = await link.boundingBox();

    if (!box) throw new Error(`No se encontró el enlace «${label}»`);

    await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }
}
