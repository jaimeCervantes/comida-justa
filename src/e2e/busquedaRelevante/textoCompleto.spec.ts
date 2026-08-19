import { expect, type Page, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slices 1 y 2 de `docs/features/search/003-2026-08-07-busqueda-semantica.md`.
 *
 * Los tres defectos que la búsqueda por `ILIKE '%término%'` tenía, medidos contra la base antes de
 * este cambio: `pán` devolvía 0 resultados, `panes` devolvía 0 —y `pan` devolvía 10—, y `pan` en
 * inglés traía «panela» y «Pancakes» por emparejar dentro de otras palabras.
 *
 * **El término tiene que ser único**, como en `ordenDeterminista.spec.ts`: buscar palabras reales
 * competiría contra las 23 publicaciones de la base y el escenario no podría afirmar nada.
 */
const RAIZ = `zarzaperico${Date.now()}`;

async function resultTitles(page: Page): Promise<string[]> {
  const headings = await page.getByRole("heading").allInnerTexts();

  return headings.filter((text) => text.includes("E2E"));
}

test.describe("Cuando alguien escribe el término con otra forma", () => {
  const slug = testSlug("texto-completo");
  const title = `E2E Buñuelos de ${RAIZ}`;

  test.beforeAll(async () => {
    await seedPost({
      slug,
      title,
      kind: "producto",
      origin: null,
      content: `Postre con ${RAIZ} fresco.`,
    });
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(slug);
  });

  test("Entonces el plural encuentra el singular", async ({ page }) => {
    /* `ILIKE '%buñuelos%'` no encontraba «buñuelo», y al revés tampoco: sin lematización, cada
       forma de una palabra era una palabra distinta. La configuración `spanish` de Postgres las
       reduce a la misma raíz. */
    await page.goto(`/buscar?q=${encodeURIComponent("buñuelo")}&page=1`);

    expect(await resultTitles(page)).toContain(title);
  });

  test("Entonces el acento de más no lo hace desaparecer", async ({ page }) => {
    /* Escribir `Buñuélos` devolvía cero. El diccionario español normaliza los diacríticos por su
       cuenta, así que **no hizo falta instalar `unaccent`** en la base compartida. */
    await page.goto(`/buscar?q=${encodeURIComponent("buñuélos")}&page=1`);

    expect(await resultTitles(page)).toContain(title);
  });

  test("Entonces las mayúsculas siguen dando igual", async ({ page }) => {
    await page.goto(`/buscar?q=${encodeURIComponent("BUÑUELOS")}&page=1`);

    expect(await resultTitles(page)).toContain(title);
  });
});

test.describe("Cuando el término cae dentro de otra palabra", () => {
  const slug = testSlug("sin-subcadenas");
  const title = `E2E Panela artesanal ${RAIZ}`;

  test.beforeAll(async () => {
    await seedPost({
      slug,
      title,
      kind: "producto",
      origin: null,
      content: `Endulzante de caña. Referencia ${RAIZ}.`,
    });
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(slug);
  });

  /**
   * El defecto que la medición destapó: `%pan%` emparejaba «panela» y «Pancakes». Cuanto más corto
   * el término, peor la precisión — y «pan» es de lo más buscado en un catálogo de comida.
   */
  test("Entonces no sale por emparejar a medias", async ({ page }) => {
    await page.goto("/buscar?q=pan&page=1");

    expect(await resultTitles(page)).not.toContain(title);
  });

  test("Pero sí sale cuando se busca la palabra entera", async ({ page }) => {
    await page.goto("/buscar?q=panela&page=1");

    expect(await resultTitles(page)).toContain(title);
  });
});

test.describe("Cuando alguien busca en un idioma sin traducir", () => {
  const slug = testSlug("solo-espanol");
  const title = `E2E Cajeta de ${RAIZ}`;

  test.beforeAll(async () => {
    /* Se siembra solo en español, que es como nace toda publicación: la traducción llega después,
       en un `after()`, y puede tardar o fallar. */
    await seedPost({
      slug,
      title,
      kind: "producto",
      origin: null,
      content: `Dulce de leche con ${RAIZ}.`,
    });
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(slug);
  });

  /**
   * Antes el filtro era `t.locale = ${locale}` a secas, sin respaldo: una publicación sin fila `en`
   * era **invisible** al buscar en inglés, aunque su ficha se abriera sin problema. Con el catálogo
   * entero en español, buscar en inglés devolvía cero resultados para todo.
   */
  test("Entonces aparece igual, con su texto en español", async ({ page }) => {
    await page.goto(`/en/search?q=${RAIZ}&page=1`);

    expect(await resultTitles(page)).toContain(title);
  });

  test("Y en español sigue apareciendo, claro", async ({ page }) => {
    await page.goto(`/buscar?q=${RAIZ}&page=1`);

    expect(await resultTitles(page)).toContain(title);
  });
});
