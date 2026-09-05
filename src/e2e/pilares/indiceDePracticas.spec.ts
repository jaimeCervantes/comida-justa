import { expect, test } from "@playwright/test";

/**
 * El índice de las 45 prácticas (slice 2d de
 * `docs/features/wellbeing/027-2026-09-04-base-de-datos-de-practicas.md`).
 *
 * Lo que protege es la **promesa**: que las prácticas tienen casa, que cada una dice cuándo se hace,
 * y que la compartida aparece una sola vez. No se afirma cuántas hay ni cómo se llaman: eso depende
 * de lo que esté sembrado, y ampliar el catálogo no debería romper una prueba.
 */
const PILARES = ["sleep", "nutrition", "movement", "mindSpirit"] as const;

test.describe("Cuando alguien busca qué practicar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/practicas");
  });

  test("Entonces los cuatro pilares tienen sus prácticas", async ({ page }) => {
    for (const pillar of PILARES) {
      const seccion = page.getByTestId(`practices-${pillar}`);

      await expect(seccion).toBeVisible();
      expect(
        await seccion.getByTestId("practice-card").count(),
        pillar,
      ).toBeGreaterThan(0);
    }
  });

  test("Entonces cada práctica dice cuándo se hace", async ({ page }) => {
    /* La primera ley del producto: hacerlo obvio. Sin el ancla, una práctica es un consejo. Se
       comprueba sobre todas las tarjetas y no sobre una: la que se quede sin ancla al sembrarse es
       justo la que nadie miraría. */
    const tarjetas = page.getByTestId("practice-card");
    const total = await tarjetas.count();
    expect(total).toBeGreaterThan(0);

    for (let index = 0; index < total; index++) {
      await expect(tarjetas.nth(index)).toContainText("Cuándo");
    }
  });

  test("Entonces cada pilar dice quién es alguien que lo practica", async ({
    page,
  }) => {
    // La identidad es del pilar, no de la práctica: por eso no hay columna `identity`.
    for (const pillar of PILARES) {
      await expect(page.getByTestId(`practices-${pillar}`)).toContainText(
        "Soy una persona que",
      );
    }
  });

  test("Entonces una práctica compartida aparece una sola vez", async ({
    page,
  }) => {
    /* Respirar despacio sirve a Mente y a Sueño y está escrita una vez. Si la lista la repitiera
       por pilar, contaría como dos lo que es una — justo lo que el modelo N:N vino a arreglar. */
    const compartida = page.locator('[data-practice="mind-slow-breathing"]');

    await expect(compartida).toHaveCount(1);
    await expect(compartida).toContainText("También sirve a");
  });

  test("Entonces una práctica sin estudio lo dice en vez de callarlo", async ({
    page,
  }) => {
    const sinEstudio = page.locator('[data-practice="sleep-notice-clarity"]');

    await expect(sinEstudio).toContainText("Sin estudio");
  });

  test("Entonces se llega desde la portada de los pilares", async ({
    page,
  }) => {
    // Una página a la que sólo se llega escribiendo la URL no está entregada.
    await page.goto("/pilares");

    await page
      .getByRole("link", { name: /prácticas de los cuatro pilares/i })
      .click();

    await expect(page).toHaveURL(/\/practicas$/);
  });
});
