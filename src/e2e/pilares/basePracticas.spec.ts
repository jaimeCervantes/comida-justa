import { expect, test } from "@playwright/test";
import { PILLAR_PRACTICE_ANCHOR } from "~/presentation/habits/pillarPageAnchors";

/**
 * El slice 1 de `docs/features/wellbeing/027-2026-09-04-base-de-datos-de-practicas.md`.
 *
 * Lo que estos escenarios protegen es la **promesa**, no la redacción: que la bibliografía dejó de
 * ser una lista de URLs crudas y que un estudio dice qué práctica sostiene. Los títulos que sí se
 * escriben aquí son los de Crossref, que no se traducen ni se afinan — si alguno cambiara sería
 * porque el estudio cambió, y entonces la prueba tiene razón en fallar.
 *
 * No se afirma «hay 43 entradas»: el número depende de lo que esté sembrado hoy, y eso convertiría
 * cada ampliación de la bibliografía en un fallo. Se afirma la forma.
 */
const BIBLIOGRAFIA = "pillar-bibliography";

test.describe("Cuando alguien llega al final del pilar del descanso", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pilares/sueno");
  });

  test("Entonces cada estudio se presenta con su nombre y no como una URL", async ({
    page,
  }) => {
    const seccion = page.getByTestId(BIBLIOGRAFIA);
    await expect(seccion).toBeVisible();

    const enlaces = seccion.getByRole("link");
    expect(await enlaces.count()).toBeGreaterThan(0);

    /* Ninguna entrada enseña el resolutor como texto. Es exactamente lo que hacía la versión
       anterior —el DOI escrito dos veces, en el `href` y como etiqueta— y es lo que este slice
       vino a quitar. */
    await expect(seccion).not.toContainText("https://doi.org/");
  });

  test("Entonces el enlace sigue resolviendo el DOI", async ({ page }) => {
    const enlace = page
      .getByTestId(BIBLIOGRAFIA)
      .getByRole("link", { name: /Room Light/ });

    await expect(enlace).toHaveAttribute(
      "href",
      "https://doi.org/10.1210/jc.2010-2098",
    );
  });

  /**
   * El corazón del slice: el vínculo estudio → práctica vivía como comentario en `references.ts` y
   * ahora lo ve quien lee la página. Los tres pares son los que ese archivo ya documentaba.
   */
  const VINCULOS = [
    { titulo: /Room Light/, practica: "Atenuar la casa una hora antes" },
    { titulo: /thermal environment/, practica: "Un cuarto fresco y ventilado" },
    { titulo: /bedtime writing/, practica: "La descarga mental" },
  ];

  for (const { titulo, practica } of VINCULOS) {
    test(`Entonces el estudio de ${titulo.source} declara que sostiene «${practica}»`, async ({
      page,
    }) => {
      const entrada = page
        .getByTestId(BIBLIOGRAFIA)
        .getByRole("listitem")
        .filter({ has: page.getByRole("link", { name: titulo }) });

      await expect(entrada).toContainText(practica);
    });
  }

  test("Entonces el estudio que no sostiene ninguna práctica sigue en la lista", async ({
    page,
  }) => {
    /* «Sleep is essential to health» es la posición de la AASM: explica por qué existe el pilar, no
       qué hacer esta noche. Treinta de los cuarenta y tres son así, y esconderlos habría dejado la
       sección más limpia a costa de sugerir que toda la bibliografía respalda cada consejo. */
    const entrada = page
      .getByTestId(BIBLIOGRAFIA)
      .getByRole("listitem")
      .filter({ has: page.getByRole("link", { name: /essential to health/ }) });

    await expect(entrada).toBeVisible();
    await expect(entrada).not.toContainText("Sostiene:");
  });

  test("Entonces la práctica del pilar sigue funcionando como antes", async ({
    page,
  }) => {
    /* La migración no tocó `habit_challenge_progress`. Si el catálogo se hubiera llevado por delante
       el reto atómico, esta sección sería lo primero en desaparecer. */
    await expect(page.locator(`#${PILLAR_PRACTICE_ANCHOR}`)).toBeVisible();
  });
});

test.describe("Cuando alguien abre cualquiera de los otros pilares", () => {
  for (const slug of ["alimentacion", "movimiento", "mente-espiritu"]) {
    test(`Entonces «${slug}» también lee su bibliografía de la base`, async ({
      page,
    }) => {
      await page.goto(`/pilares/${slug}`);

      const seccion = page.getByTestId(BIBLIOGRAFIA);
      await expect(seccion).toBeVisible();
      await expect(seccion).not.toContainText("https://doi.org/");
    });
  }
});
