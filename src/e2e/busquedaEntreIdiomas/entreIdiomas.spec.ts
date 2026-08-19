import { expect, type Page, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { seedTranslation } from "../testUtils/seedTranslation";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slice 1 de `docs/features/search/002-2026-08-07-busqueda-entre-idiomas.md`.
 *
 * El defecto, medido contra la base antes del cambio: los tres panes del catálogo tienen su fila
 * `en` con "Sourdough Bread" en el título, y `websearch_to_tsquery('english','bread')` los devuelve
 * con rank 0.696 / 0.669 / 0.608. Pero navegando en español la consulta filtraba
 * `t.locale IN ('es','es')`, así que esas filas ni entraban: "bread" devolvía **0 resultados**.
 *
 * **Los términos son inventados**, como en `textoCompleto.spec.ts`: palabras reales competirían
 * contra las 23 publicaciones de la base y ningún escenario podría afirmar una posición.
 */
const RAIZ_ES = `zarzaperico${Date.now()}`;
const RAIZ_EN = `quibbleworth${Date.now()}`;

async function resultTitles(page: Page): Promise<string[]> {
  const headings = await page.getByRole("heading").allInnerTexts();

  return headings.filter((text) => text.includes("E2E"));
}

test.describe("Cuando el término está en el otro idioma del sitio", () => {
  const slug = testSlug("entre-idiomas");
  const englishSlug = testSlug("cross-language");
  const tituloEs = `E2E Hogaza de ${RAIZ_ES}`;
  const tituloEn = `E2E ${RAIZ_EN} baking`;

  test.beforeAll(async () => {
    await seedPost({
      slug,
      title: tituloEs,
      kind: "producto",
      origin: null,
      content: `Hogaza de masa madre con ${RAIZ_ES}.`,
    });
    await seedTranslation({
      postSlug: slug,
      locale: "en",
      title: tituloEn,
      slug: englishSlug,
      content: `Sourdough baking with ${RAIZ_EN}.`,
    });
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(slug);
  });

  /* El caso que abrió este trabajo: la palabra está solo en la fila inglesa y quien busca está en
     español, donde `locale` y `fallbackLocale` son el mismo idioma y el filtro se cerraba sobre sí
     mismo. */
  test("Entonces el término inglés lo encuentra navegando en español", async ({
    page,
  }) => {
    await page.goto(`/buscar?q=${RAIZ_EN}&page=1`);

    expect(await resultTitles(page)).toContain(tituloEs);
  });

  /* Y se enseña en el idioma de quien busca, no en el que produjo la coincidencia: la fila que
     encontró el término es la inglesa, pero la tarjeta sale en español porque `hydrate` carga las
     dos y `resolvePostTranslation` elige. */
  test("Y se ve con su título en español, no con el que coincidió", async ({
    page,
  }) => {
    await page.goto(`/buscar?q=${RAIZ_EN}&page=1`);

    const titles = await resultTitles(page);
    expect(titles).toContain(tituloEs);
    expect(titles).not.toContain(tituloEn);
  });

  test("Entonces el término español lo encuentra navegando en inglés", async ({
    page,
  }) => {
    await page.goto(`/en/search?q=${RAIZ_ES}&page=1`);

    expect(await resultTitles(page)).toContain(tituloEn);
  });

  /**
   * Cada fila se analiza con el diccionario de **su** idioma, no con el de quien busca.
   *
   * `baking` / `bake` es el par que lo distingue, medido contra la base:
   *
   *   to_tsvector('english', 'baking') → 'bake'    ← encuentra "bake"
   *   to_tsvector('spanish', 'baking') → 'baking'  ← no lo encuentra
   *
   * Así que si esta prueba pasa, la fila inglesa se analizó con `english` pese a que quien busca
   * está en español. (El par obvio, `loaves` / `loaf`, no sirve: el lematizador inglés los deja en
   * `loav` y `loaf`, que son raíces distintas — Porter no sabe de plurales irregulares.)
   */
  test("Y la fila inglesa se lematiza en inglés aunque yo esté en español", async ({
    page,
  }) => {
    await page.goto(
      `/buscar?q=${encodeURIComponent(`${RAIZ_EN} bake`)}&page=1`,
    );

    expect(await resultTitles(page)).toContain(tituloEs);
  });

  /* `EXISTS` evitaba el duplicado antes; ahora lo evita el `JOIN LATERAL`, que agrega. Sin uno de
     los dos, una publicación cuyas dos filas coinciden saldría dos veces y el total la contaría
     dos veces. */
  test("Y una publicación que coincide en sus dos idiomas sale una sola vez", async ({
    page,
  }) => {
    /* "E2E" está en los dos títulos, así que el término coincide en la fila española y en la
       inglesa a la vez. */
    await page.goto(`/buscar?q=${RAIZ_ES}&page=1`);

    const titles = await resultTitles(page);
    expect(titles.filter((title) => title === tituloEs)).toHaveLength(1);
  });
});

test.describe("Cuando dos publicaciones coinciden en idiomas distintos", () => {
  const RAIZ = `flumberoot${Date.now()}`;
  const propioSlug = testSlug("coincide-en-espanol");
  const ajenoSlug = testSlug("coincide-en-ingles");
  const propioTitulo = `E2E Conserva de ${RAIZ}`;
  const ajenoTitulo = `E2E Mermelada casera ${Date.now()}`;
  const ajenoTituloEn = `E2E Homemade ${RAIZ} jam`;

  test.beforeAll(async () => {
    await seedPost({
      slug: propioSlug,
      title: propioTitulo,
      kind: "producto",
      origin: null,
      content: "Conserva artesanal en frasco de vidrio.",
    });
    await seedPost({
      slug: ajenoSlug,
      title: ajenoTitulo,
      kind: "producto",
      origin: null,
      content: "Mermelada artesanal en frasco de vidrio.",
    });
    await seedTranslation({
      postSlug: ajenoSlug,
      locale: "en",
      title: ajenoTituloEn,
      slug: testSlug("homemade-jam"),
      content: "Homemade jam in a glass jar.",
    });
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(propioSlug);
    await deleteOnePostBySlug(ajenoSlug);
  });

  /**
   * El orden conserva idioma aunque la búsqueda no: abrir la consulta a todas las traducciones no
   * puede hacer que lo que coincide en tu idioma quede detrás de lo que solo coincide en el otro.
   * Es lo que mantiene intacto el comportamiento de siempre para quien busca en español.
   */
  test("Entonces la que coincide en mi idioma sale primero", async ({
    page,
  }) => {
    await page.goto(`/buscar?q=${RAIZ}&page=1`);

    const titles = await resultTitles(page);
    expect(titles.indexOf(propioTitulo)).toBeGreaterThanOrEqual(0);
    expect(titles.indexOf(ajenoTitulo)).toBeGreaterThan(
      titles.indexOf(propioTitulo),
    );
  });

  /* Y en inglés se invierte, por el mismo motivo y sin una regla aparte. */
  test("Y navegando en inglés se invierte", async ({ page }) => {
    await page.goto(`/en/search?q=${RAIZ}&page=1`);

    const titles = await resultTitles(page);
    expect(titles.indexOf(ajenoTituloEn)).toBeGreaterThanOrEqual(0);
    expect(titles.indexOf(propioTitulo)).toBeGreaterThan(
      titles.indexOf(ajenoTituloEn),
    );
  });
});
