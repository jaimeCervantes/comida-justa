import { expect, type Locator, test } from "@playwright/test";
import { PUBLICATION_PILLARS } from "~/domain/entities/post/publicationPillars";

/**
 * El pie del 5.16, en un navegador de verdad.
 *
 * Lo que se comprueba aquí y no en una prueba de componente es lo que **solo existe compilado**: en
 * Tailwind v4 una clase mal escrita no falla, desaparece, así que `bg-surface-inverted` podría estar
 * en el `class` y no pintar nada. Se mide el color resultante, no el nombre de la clase.
 *
 * Y se mide **en relación**, no contra un hex: que el pie sea claramente más oscuro que el cuerpo de
 * la página, y que su texto contraste contra él. Un `toBe("rgb(16, 20, 16)")` se caería el día que
 * el token se afine, sin que nada esté mal.
 */

/** Luminancia relativa de un `rgb(...)`, para poder comparar dos fondos sin escribir ningún hex. */
function luminance(color: string): number {
  const [r, g, b] = (color.match(/\d+/g) ?? ["0", "0", "0"]).map(Number);
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

const background = (locator: Locator): Promise<string> =>
  locator.evaluate((node) => getComputedStyle(node).backgroundColor);

test.describe("Cuando alguien llega al final de cualquier página", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Entonces el pie cierra la página en oscuro", async ({ page }) => {
    const pie = page.locator("footer");
    const cuerpo = page.locator("body");

    await expect(pie).toBeAttached();

    const delPie = luminance(await background(pie));
    const delCuerpo = luminance(await background(cuerpo));

    /* Claramente más oscuro, no «un poco»: el pie tiene que leerse como otra superficie. */
    expect(delPie).toBeLessThan(delCuerpo / 2);
  });

  test("Entonces su texto se lee sobre ese fondo", async ({ page }) => {
    const pie = page.locator("footer");
    const tinta = await pie
      .locator("p")
      .first()
      .evaluate((node) => getComputedStyle(node).color);

    const contraste =
      (Math.max(luminance(tinta), luminance(await background(pie))) + 0.05) /
      (Math.min(luminance(tinta), luminance(await background(pie))) + 0.05);

    /* El mínimo AA. La pareja exacta la mide `invertedSurface.contrast.test.ts`; esto comprueba que
       lo medido es lo que de verdad llega al navegador. */
    expect(contraste).toBeGreaterThanOrEqual(4.5);
  });

  test("Entonces los cuatro pilares llevan a su página", async ({ page }) => {
    for (const pilar of PUBLICATION_PILLARS) {
      const enlace = page.getByTestId(`footer-pillar-${pilar.key}`);

      await expect(enlace).toHaveAttribute("href", /\/pilares|\/pillars/);
      /* Con su número, que es lo que distingue Movimiento de Mente para quien no separa sus verdes. */
      await expect(enlace).toContainText(String(pilar.number));
    }
  });
});
