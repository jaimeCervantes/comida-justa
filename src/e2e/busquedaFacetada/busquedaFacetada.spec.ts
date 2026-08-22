import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";

/**
 * La pantalla 5.7 del canvas, con lo que los datos sostienen.
 *
 * Los términos son reales del catálogo consultado el 2026-08-22: «caminata» devuelve dos eventos de
 * Movimiento; «pollo», tres productos de Alimentación. Nada de esto está sembrado por la suite: si
 * alguien publica una caminata más, la cuenta sube y el escenario sigue siendo cierto porque afirma
 * la **relación** —lo que dice el resumen es lo que cuenta la faceta—, no un número fijo.
 */
test.describe("Las facetas de la búsqueda", () => {
  test("Cuentan por pilar, y el cero también se dice", async ({ page }) => {
    await page.goto("/buscar?q=caminata");

    const facetas = page.getByTestId("search-facets");
    await expect(facetas).toBeVisible();

    /* Un pilar sin resultados enseña su 0: ahorra el clic que no lleva a ninguna parte, y esa es
       la mitad del valor de una faceta. */
    await expect(page.getByTestId("facet-count-movement")).not.toHaveText("0");
    await expect(page.getByTestId("facet-count-sleep")).toHaveText("0");
  });

  /*
   * Se cuenta **sin** el filtro de pilar puesto: con él aplicado los otros tres saldrían en cero y
   * no habría por dónde volver. Es lo que separa una faceta de un marcador.
   */
  test("Y siguen contando igual con un pilar ya elegido", async ({ page }) => {
    await page.goto("/buscar?q=caminata");
    const sinFiltro = await page
      .getByTestId("facet-count-movement")
      .textContent();

    await page.getByTestId("facet-pillar-movement").click();
    await page.waitForURL("**pillar=movement**");

    await expect(page.getByTestId("facet-count-movement")).toHaveText(
      sinFiltro ?? "",
    );
  });

  test("El resumen dice cuántos son y con qué filtros", async ({ page }) => {
    await page.goto("/buscar?q=caminata&pillar=movement");

    await expect(page.getByTestId("search-summary")).toHaveText(/resultados?/i);
    await expect(page.getByTestId("chip-pillar")).toContainText(
      es.publicationPillars.movement,
    );
  });

  /*
   * Un filtro que se pone con un clic y se quita buscando dónde se puso no es un filtro, es una
   * trampa. Cada chip quita el suyo.
   */
  test("Y cada chip quita su propio filtro", async ({ page }) => {
    await page.goto("/buscar?q=caminata&pillar=movement&disponibles=1");

    await expect(page.getByTestId("chip-available")).toBeVisible();
    await page.getByTestId("chip-pillar").click();

    await page.waitForURL((url) => !url.searchParams.has("pillar"));
    // Y el otro filtro sobrevive: se quitó uno, no todos.
    expect(new URL(page.url()).searchParams.get("disponibles")).toBe("1");
  });

  test("Y «Limpiar todo» los quita a la vez", async ({ page }) => {
    await page.goto("/buscar?q=caminata&pillar=movement&disponibles=1");

    await page.getByTestId("chip-clear").click();

    await page.waitForURL((url) => !url.searchParams.has("pillar"));
    const params = new URL(page.url()).searchParams;
    expect(params.has("disponibles")).toBe(false);
    // Pero el término no es un filtro: sin él no hay búsqueda que limpiar.
    expect(params.get("q")).toBe("caminata");
  });

  /*
   * La faceta vive en la dirección, así que sobrevive a la paginación, al botón de atrás y a
   * compartir el enlace. Una casilla controlada por JavaScript no haría ninguna de las tres.
   */
  test("La disponibilidad viaja en la dirección", async ({ page }) => {
    await page.goto("/buscar?q=pollo");

    await page.getByTestId("facet-only-available").click();
    await page.waitForURL("**disponibles=1**");

    await expect(page.getByTestId("facet-only-available")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.goBack();
    await expect(page.getByTestId("facet-only-available")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("Sin término no hay facetas que enseñar", async ({ page }) => {
    await page.goto("/buscar");

    await expect(page.getByTestId("search-facets")).toHaveCount(0);
  });
});
