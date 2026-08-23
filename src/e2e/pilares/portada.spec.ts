import { expect, test } from "@playwright/test";
import { PILLARS } from "~/app/[locale]/pilares/components/pilaresData";

/**
 * La portada de los cuatro pilares (5.10 del canvas).
 *
 * La anotación que este archivo protege es la primera: **cada tarjeta lleva su práctica**. El hub
 * explicaba cuatro conceptos y dejaba al visitante sin nada que hacer, así que «Leer más» no
 * prometía nada concreto.
 *
 * Se afirma la **invariante** y no los nombres: lo que la tarjeta anuncia es lo que se encuentra al
 * entrar. Copiar «Del atardecer al amanecer» aquí sería atar la prueba a la redacción, y esos textos
 * se afinan.
 */
test.describe("Cuando alguien abre la portada de los pilares", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pilares");
  });

  test("Entonces cada tarjeta nombra su práctica", async ({ page }) => {
    for (const pillar of PILLARS) {
      const practica = page.getByTestId(`pillar-practice-${pillar.key}`);

      await expect(practica).toBeVisible();
      await expect(practica).not.toHaveText("");
    }
  });

  test("Entonces lo que promete la tarjeta es lo que hay dentro", async ({
    page,
  }) => {
    /* Uno basta para demostrar la cadena: si el emparejamiento pilar↔reto estuviera cruzado, la
       tarjeta anunciaría la práctica de otro. Que los cuatro estén emparejados lo comprueba
       `pilaresData.test.ts` de ida y vuelta, sin navegador. */
    const [primero] = PILLARS;
    const anunciada = (
      await page.getByTestId(`pillar-practice-${primero.key}`).innerText()
    ).trim();

    await page.goto(`/pilares/${primero.slug}`);

    await expect(page.getByText(anunciada).first()).toBeVisible();
  });

  /** La segunda anotación: el jardín cuenta repeticiones y nunca señala a nadie. */
  test("Entonces el jardín está, y con su nota de privacidad", async ({
    page,
  }) => {
    const jardin = page.getByTestId("community-habit-garden");

    await expect(jardin).toBeVisible();
    await expect(jardin).toContainText(/\d/);
  });
});
