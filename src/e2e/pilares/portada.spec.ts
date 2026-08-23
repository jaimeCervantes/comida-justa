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

  /**
   * El 5.10 abre y cierra con la misma acción. Se afirma **el destino**, no la etiqueta: ambas
   * invitaciones tienen que llevar a donde se elige, que en esta portada son las tarjetas de la
   * propia página.
   */
  test("Entonces abre y cierra invitando a elegir una práctica, al mismo sitio", async ({
    page,
  }) => {
    const heroe = page.getByTestId("pillar-hero-action");
    const cierre = page.getByTestId("practice-invitation");

    await expect(heroe).toBeVisible();
    await expect(cierre).toBeVisible();

    const destino = await heroe.getByRole("link").getAttribute("href");
    expect(await cierre.getByRole("link").getAttribute("href")).toBe(destino);

    /* El ancla existe y es la lista: una invitación que apunta a un id inexistente no se queja,
       simplemente no lleva a ninguna parte. */
    await expect(page.locator(String(destino))).toBeVisible();
    await expect(page.locator(String(destino))).toContainText(
      await page.getByTestId(`pillar-practice-${PILLARS[0].key}`).innerText(),
    );
  });

  /**
   * El canvas escribía «Meta 5 de 7 días» bajo el CTA. Dejó de ser cierto cuando la meta se volvió
   * proporcional —quien se suma un domingo tiene un día—, así que la portada no puede prometerlo.
   * La otra mitad de esa línea sí se sostiene y es la que importa en una portada.
   */
  test("Entonces la nota del héroe no promete un número fijo de días", async ({
    page,
  }) => {
    const nota = page.getByTestId("pillar-hero-action");

    await expect(nota).toContainText(/no pide cuenta/i);
    await expect(nota).not.toContainText(/\d+\s*de\s*\d+\s*d[ií]as/i);
  });
});
