import { expect, type Locator, type Page } from "@playwright/test";
import { ABOUT_TITLE } from "~/app/[locale]/nosotros/metadata";

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
