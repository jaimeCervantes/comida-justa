import { expect, test } from "@playwright/test";

/**
 * Slice 2 de `docs/features/platform/008-2026-08-21-home-v2.md`.
 *
 * La tarjeta del 5.2: el pilar encima de la foto —donde primero se mira— y el precio en la serif de
 * la marca. A qué pilar pertenece cada categoría lo prueba el dominio
 * (`publicationPillars.pillarForCategory.test.ts`); aquí se comprueba lo que solo se ve en el
 * navegador — que la insignia llega a la imagen y que el precio se pinta en serif.
 *
 * El precio importa porque estaba pisado: `CardForList` le pasaba `text-xl text-pw-green`, y con dos
 * tamaños en el `class` ganaba el que decidiera el orden del CSS, no el primitivo.
 */
test.describe("La tarjeta del feed", () => {
  test("Lleva el pilar encima de la foto, con su número", async ({ page }) => {
    await page.goto("/");

    const insignia = page.getByTestId("card-pillar").first();

    await expect(insignia).toBeVisible();
    // El número acompaña siempre al color: Movimiento y Mente contrastan 1.14 entre sí como tinta.
    await expect(insignia).toHaveText(/[1-4]/);
  });

  test("Y el precio se pinta en la serif de la marca, no en verde", async ({
    page,
  }) => {
    await page.goto("/");

    const precio = page.locator("article").getByText(/^\$/).first();
    const estilo = await precio.evaluate((node) => {
      const computed = getComputedStyle(node);

      return { fontFamily: computed.fontFamily, color: computed.color };
    });

    expect(estilo.fontFamily).toMatch(/newsreader/i);
    /* Tinta, no acento: el verde señala lo que lleva a algún sitio, y un precio no lleva a
       ninguno. `--text-base` en claro es #1b1e18. */
    expect(estilo.color).toBe("rgb(27, 30, 24)");
  });

  /* Los anuncios de la base van sin categoría: ahí no hay pilar que pintar, y no se inventa. */
  test("Pero se calla en lo que no tiene pilar", async ({ page }) => {
    await page.goto("/");

    const tarjetas = await page.locator("article").count();
    const insignias = await page.getByTestId("card-pillar").count();

    expect(tarjetas).toBeGreaterThan(0);
    expect(insignias).toBeLessThanOrEqual(tarjetas);
  });
});
