import { expect, type Locator, test } from "@playwright/test";

/**
 * Escenarios en `src/e2e/chrome/header-glass-theme-toggle.feature`.
 *
 * El defecto vive en CSS compilado: `.glass` seguia la variante `dark:` de Tailwind, que responde
 * a `prefers-color-scheme`, pero no al `data-theme` que escribe `ThemeToggle`. Por eso se mide el
 * fondo computado en navegador real, sin afirmar un hex concreto de la paleta.
 */

function luminance(color: string): number {
  const [r, g, b] = (color.match(/\d+/g) ?? ["0", "0", "0"]).map(Number);
  const channel = (value: number): number => {
    const c = value / 255;

    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

const background = (locator: Locator): Promise<string> =>
  locator.evaluate((node) => getComputedStyle(node).backgroundColor);

const themeToggle = (page: import("@playwright/test").Page): Locator =>
  page.getByRole("banner").getByTestId("theme-toggle");

const chromeHeader = (page: import("@playwright/test").Page): Locator =>
  page.getByRole("banner");

test.describe("Con el sistema en tema claro", () => {
  test.use({ colorScheme: "light" });

  test("Entonces el tema oscuro forzado pinta una superficie oscura aunque el sistema este claro", async ({
    page,
  }) => {
    await page.goto("/");
    await themeToggle(page).click();
    await themeToggle(page).click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(luminance(await background(chromeHeader(page)))).toBeLessThan(0.2);
  });
});

test.describe("Con el sistema en tema oscuro", () => {
  test.use({ colorScheme: "dark" });

  test("Entonces el tema claro forzado pinta una superficie clara aunque el sistema este oscuro", async ({
    page,
  }) => {
    await page.goto("/");
    await themeToggle(page).click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(luminance(await background(chromeHeader(page)))).toBeGreaterThan(
      0.8,
    );
  });
});
