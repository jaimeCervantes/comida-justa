import { expect, type Locator, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";

/**
 * Escenarios en `src/e2e/chrome/theme-toggle-header.feature`.
 *
 * Hay varios `ThemeToggle` en la página a propósito: header, menú móvil y footer. Por eso todas las
 * búsquedas se hacen por región; un selector global volvería ambigua la prueba en cuanto el chrome
 * gane otra entrada al mismo control.
 */

const themeToggleIn = (region: Locator): Locator =>
  region.getByTestId("theme-toggle");

test.describe("ThemeToggle en el header", () => {
  test("el banner de escritorio lo expone y cambia el tema", async ({
    page,
  }) => {
    await page.goto("/");

    const headerToggle = themeToggleIn(page.getByRole("banner"));

    await expect(headerToggle).toHaveCount(1);
    await expect(headerToggle).toHaveAccessibleName(
      es.footer.theme.switchTo.light,
    );

    await headerToggle.click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("el footer conserva su propio conmutador", async ({ page }) => {
    await page.goto("/");

    await expect(themeToggleIn(page.locator("footer"))).toHaveCount(1);
  });
});

test.describe("ThemeToggle en el menú móvil", () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test("el panel móvil lo expone y cambia el tema", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: es.nav.openMenu }).click();

    const mobileMenuToggle = themeToggleIn(page.getByTestId("mobile-menu"));

    await expect(mobileMenuToggle).toHaveCount(1);
    await expect(mobileMenuToggle).toHaveAccessibleName(
      es.footer.theme.switchTo.light,
    );

    await mobileMenuToggle.click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});
