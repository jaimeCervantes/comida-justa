import { expect, type Locator, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";

type Box = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>;

async function visibleBox(locator: Locator): Promise<Box> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();

  if (!box) throw new Error("El elemento visible no tiene una caja medible");

  return box;
}

const sections = [es.nav.communityMenu, es.nav.pillarsMenu] as const;

test.describe("La sección abierta del menú principal", () => {
  for (const section of sections) {
    test(`${section} mantiene juntas todas sus piezas`, async ({ page }) => {
      await page.goto("/nosotros");

      const menu = page.getByTestId("desktop-menu");
      const openButton = menu.getByRole("button", {
        name: `Abrir el submenú de ${section}`,
        exact: true,
      });
      const control = openButton.locator("..");

      await openButton.click();

      const label = await visibleBox(control.getByTestId("section-label"));
      const greenCaret = await visibleBox(openButton.locator("svg"));
      const whiteIndicator = await visibleBox(
        control.getByTestId("submenu-indicator"),
      );
      const submenu = await visibleBox(menu.getByTestId("desktop-submenu"));
      const controlBox = await visibleBox(control);

      const titleToCaret = greenCaret.x - (label.x + label.width);
      expect(titleToCaret).toBeGreaterThanOrEqual(0);
      expect(titleToCaret).toBeLessThanOrEqual(8);

      const controlCenter = controlBox.x + controlBox.width / 2;
      const indicatorCenter = whiteIndicator.x + whiteIndicator.width / 2;
      expect(Math.abs(indicatorCenter - controlCenter)).toBeLessThanOrEqual(2);

      const indicatorToSubmenu =
        submenu.y - (whiteIndicator.y + whiteIndicator.height);
      expect(Math.abs(indicatorToSubmenu)).toBeLessThanOrEqual(1);
    });
  }
});
