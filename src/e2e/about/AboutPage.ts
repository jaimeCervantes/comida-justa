import { expect, type Locator, type Page } from "@playwright/test";
import es from "~/i18n/messages/es.json";

/**
 * El título se lee del catálogo, no de la página.
 *
 * Antes se importaba `ABOUT_TITLE` de `~/app/[locale]/nosotros/metadata`, y eso se rompió cuando
 * ese módulo pasó a resolver su texto con `getTranslations`: la constante desapareció y el import
 * arrastraba `next-intl/server` al proceso de Playwright. El typecheck no lo vio porque
 * `tsconfig.json` excluye `src/e2e`.
 *
 * La suite corre en español (`playwright.config.ts` fija `locale: "es-MX"`), así que se afirma la
 * redacción española: es lo que ve el visitante al que este escenario representa.
 */
const ABOUT_TITLE = es.about.metaTitle.replace("{brand}", "Hazlo Sano");

/** Page object for the brand page (`/nosotros`), formerly `/info`. */
export default class AboutPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/nosotros");
  }

  /**
   * The mobile menu is rendered in a portal on `document.body`, so on a desktop viewport
   * the same link exists twice in the DOM. Scoping to `<header>` keeps the desktop nav.
   */
  mainMenuLink(): Locator {
    return this.page
      .locator("header")
      .getByRole("link", { name: "Nosotros", exact: true });
  }

  async openFromMainMenu() {
    await this.mainMenuLink().click();
  }

  heading(): Locator {
    return this.page.getByRole("heading", { level: 1, name: ABOUT_TITLE });
  }

  async expectOnAboutPage() {
    await expect(this.page).toHaveURL(/\/nosotros$/);
    await expect(this.heading()).toBeVisible();
  }
}
