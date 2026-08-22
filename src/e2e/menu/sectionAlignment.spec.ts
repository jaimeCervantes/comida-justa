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

      /*
       * Lo que la prueba vigila es que **nada se despegue del control**: etiqueta, adorno y flecha
       * tienen que leerse como una sola píldora. Desde el slice 2 del chrome v2, «4 Pilares» lleva
       * los cuatro puntos de la rampa entre su etiqueta y su flecha, así que la última pieza antes
       * de la flecha ya no es siempre la etiqueta. Se mide desde donde termine la última pieza, que
       * es lo que la afirmación quería decir desde el principio.
       */
      const dots = control.getByTestId("nav-pillar-dots");
      const lastPiece =
        (await dots.count()) > 0 ? await visibleBox(dots) : label;
      const whiteIndicator = await visibleBox(
        control.getByTestId("submenu-indicator"),
      );
      const submenu = await visibleBox(menu.getByTestId("desktop-submenu"));
      const controlBox = await visibleBox(control);

      const titleToCaret = greenCaret.x - (lastPiece.x + lastPiece.width);
      expect(titleToCaret).toBeGreaterThanOrEqual(0);
      expect(titleToCaret).toBeLessThanOrEqual(8);

      /* Y los puntos, cuando los hay, tampoco se despegan de su etiqueta. */
      if (lastPiece !== label) {
        const labelToDots = lastPiece.x - (label.x + label.width);
        expect(labelToDots).toBeGreaterThanOrEqual(0);
        expect(labelToDots).toBeLessThanOrEqual(12);
      }

      const controlCenter = controlBox.x + controlBox.width / 2;
      const indicatorCenter = whiteIndicator.x + whiteIndicator.width / 2;
      expect(Math.abs(indicatorCenter - controlCenter)).toBeLessThanOrEqual(2);

      const indicatorToSubmenu =
        submenu.y - (whiteIndicator.y + whiteIndicator.height);
      expect(Math.abs(indicatorToSubmenu)).toBeLessThanOrEqual(1);

      const controlBottom = controlBox.y + controlBox.height;
      const controlToSubmenu = submenu.y - controlBottom;
      expect(controlToSubmenu).toBeCloseTo(8, 1);
      expect(whiteIndicator.y - controlBottom).toBeCloseTo(0, 1);
      expect(whiteIndicator.height).toBeCloseTo(controlToSubmenu, 1);

      const [indicatorColor, submenuColor] = await Promise.all([
        control
          .getByTestId("submenu-indicator")
          .evaluate((element) => getComputedStyle(element).backgroundColor),
        menu
          .getByTestId("desktop-submenu")
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      ]);
      expect(indicatorColor).toBe(submenuColor);
    });
  }
});
