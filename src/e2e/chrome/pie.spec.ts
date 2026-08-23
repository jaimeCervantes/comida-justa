import { expect, type Locator, test } from "@playwright/test";
import { PUBLICATION_PILLARS } from "~/domain/entities/post/publicationPillars";

/**
 * El pie, en un navegador de verdad y **en los dos temas**.
 *
 * Lo que se comprueba aquí y no en una prueba de componente es lo que solo existe compilado: en
 * Tailwind v4 una clase mal escrita no falla, desaparece, así que `bg-surface-elevation-1` podría
 * estar en el `class` y no pintar nada. Ya pasó una vez —el texto del pie quedó a 1.10 de contraste
 * sobre su propio fondo—, y por eso se mide el color resultante y no el nombre de la clase.
 *
 * Y se mide **en relación**, nunca contra un hex: que el pie se distinga del cuerpo y que su texto
 * se lea encima. Un `toBe("rgb(...)")` se caería el día que el token se afine, sin que nada esté
 * mal — y además cambia con el tema, que es precisamente lo que ahora se quiere.
 */

/** Luminancia relativa de un `rgb(...)`, para comparar dos colores sin escribir ninguno. */
function luminance(color: string): number {
  const [r, g, b] = (color.match(/\d+/g) ?? ["0", "0", "0"]).map(Number);
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);

  return (hi + 0.05) / (lo + 0.05);
};

const background = (locator: Locator): Promise<string> =>
  locator.evaluate((node) => getComputedStyle(node).backgroundColor);

/**
 * Los dos escenarios que tienen que valer igual en claro y en oscuro.
 *
 * Se declaran una vez y se ejecutan en los dos temas: si se copiaran, la copia oscura se quedaría
 * atrás en el primer cambio, que es exactamente la clase de prueba que este repo dejó de escribir.
 */
function laDivisionSeVe() {
  test("Entonces el pie se distingue del contenido", async ({ page }) => {
    await page.goto("/");

    const pie = page.locator("footer");
    await expect(pie).toBeAttached();

    const delPie = await background(pie);
    const delCuerpo = await background(page.locator("body"));

    /* Distinto fondo **y** un filo arriba: con solo uno de los dos, el cierre depende de que el
       monitor distinga dos grises vecinos. */
    expect(delPie).not.toBe(delCuerpo);
    await expect(pie).toHaveCSS("border-top-style", "solid");
    expect(
      Number.parseFloat(
        await pie.evaluate((n) => getComputedStyle(n).borderTopWidth),
      ),
    ).toBeGreaterThan(0);
  });

  test("Entonces su texto se lee sobre ese fondo", async ({ page }) => {
    await page.goto("/");

    const pie = page.locator("footer");
    const tinta = await pie
      .locator("p")
      .first()
      .evaluate((node) => getComputedStyle(node).color);

    expect(contrast(tinta, await background(pie))).toBeGreaterThanOrEqual(4.5);
  });
}

test.describe("Con el tema claro", () => {
  test.use({ colorScheme: "light" });
  laDivisionSeVe();
});

test.describe("Con el tema oscuro", () => {
  test.use({ colorScheme: "dark" });
  laDivisionSeVe();
});

test.describe("Cuando alguien llega al final de cualquier página", () => {
  test("Entonces los cuatro pilares llevan a su página", async ({ page }) => {
    await page.goto("/");

    for (const pilar of PUBLICATION_PILLARS) {
      const enlace = page.getByTestId(`footer-pillar-${pilar.key}`);

      await expect(enlace).toHaveAttribute("href", /\/pilares|\/pillars/);
      /* Con su número, que es lo que distingue Movimiento de Mente para quien no separa sus verdes. */
      await expect(enlace).toContainText(String(pilar.number));
    }
  });
});
