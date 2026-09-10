import { expect, type Locator, type Page, test } from "@playwright/test";
import { PUBLICATION_PILLARS } from "~/domain/entities/post/publicationPillars";

/**
 * Slice 1 de `listadosCompactos.feature`: los filtros de la búsqueda dejan la barra lateral y se
 * ponen encima de los resultados.
 *
 * El término es real del catálogo consultado el 2026-09-10: «proteína» devuelve más de 25
 * publicaciones, todas de Alimentación. No lo siembra la suite, y no hace falta que lo siembre:
 * ningún escenario de aquí afirma cuántas son, solo dónde quedan unas respecto de otras.
 *
 * Lo que las facetas **hacen** —contar, filtrar, viajar en la dirección— se prueba en
 * `busquedaFacetada.spec.ts` y no se repite aquí.
 */

const TERMINO = "proteína";

/** Lo que se mide: la caja de un elemento que tiene que estar en pantalla. */
async function caja(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  if (!box) throw new Error("El elemento no tiene caja: ¿está desplegado?");

  return box;
}

function primeraPublicacion(page: Page): Locator {
  return page.getByTestId("search-results").locator("article").first();
}

test.describe("Los filtros de la búsqueda, arriba", () => {
  test("Se leen antes que los resultados, no a su lado", async ({ page }) => {
    await page.goto(`/buscar?q=${encodeURIComponent(TERMINO)}`);

    const facetas = await caja(page.getByTestId("search-facets"));
    const publicacion = await caja(primeraPublicacion(page));

    /* Terminan por encima: es la diferencia entre leer los filtros y rodearlos. Antes compartían
       renglón con la primera tarjeta, que es lo que costaba 264 px de ancho. */
    expect(facetas.y + facetas.height).toBeLessThanOrEqual(publicacion.y);

    /* Y no le queda nada al lado: si algo siguiera ocupando la izquierda, la tarjeta empezaría más
       adentro que los filtros. Se mide contra los filtros y no contra un número, para que el día
       que el contenedor cambie de ancho la prueba siga diciendo lo mismo. */
    expect(Math.abs(publicacion.x - facetas.x)).toBeLessThanOrEqual(1);
  });

  test("Y en el teléfono caben en un renglón", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/buscar?q=${encodeURIComponent(TERMINO)}`);

    /* Los cuatro pilares en la misma altura. Es la promesa de una fila de chips, y es lo que antes
       no se cumplía: apilados costaban media pantalla antes del primer resultado. Se comparan entre
       ellos —no contra una altura fija— porque lo que importa es que compartan renglón. */
    const alturas = await Promise.all(
      PUBLICATION_PILLARS.map(async ({ key }) =>
        Math.round((await caja(page.getByTestId(`facet-pillar-${key}`))).y),
      ),
    );

    expect(new Set(alturas).size).toBe(1);

    await expect(primeraPublicacion(page)).toBeInViewport();
  });
});
