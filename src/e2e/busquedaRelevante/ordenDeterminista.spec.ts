import { expect, type Page, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slice 1 de `docs/features/busqueda-relevante.md`.
 *
 * La suite no tenía ni un spec de comportamiento sobre `/buscar` —los de `seo/` tocan la ruta pero
 * solo miran metadatos—, y por eso nadie había notado que la consulta no llevaba `ORDER BY`.
 *
 * **El término tiene que ser único.** Buscar "pan" competiría contra las 23 publicaciones reales de
 * la base y el escenario no podría afirmar posiciones. Se usa un token inventado que solo llevan
 * las publicaciones que siembra este archivo.
 */
const TOKEN = `zarzaperico${Date.now()}`;

/**
 * Los títulos de los resultados, en el orden en que salen.
 *
 * Cada tarjeta pinta su título en un encabezado y el orden del DOM es el del listado, igual que en
 * `nearbyFirst.spec.ts`. Se descarta el `h1` de la página, que no es un resultado.
 */
async function resultTitles(page: Page): Promise<string[]> {
  const headings = await page.getByRole("heading").allInnerTexts();

  return headings.filter((text) => text.includes("E2E"));
}

test.describe("Cuando alguien busca algo concreto", () => {
  const enElTitulo = testSlug("token-en-el-titulo");
  const soloEnElTexto = testSlug("token-solo-en-el-texto");

  const titles = {
    enElTitulo: `E2E Pan de ${TOKEN}`,
    soloEnElTexto: `E2E Mermelada de zarzamora ${Date.now()}`,
  };

  test.beforeAll(async () => {
    /*
     * El orden de siembra importa, y es al revés de lo que parece.
     *
     * El de menor relevancia —el que solo coincide en el texto— se siembra **el último**, así que
     * es el más reciente. Como el desempate es `created_at DESC`, un orden que ignorase el ranking
     * lo pondría **primero**. Solo si la relevancia manda de verdad sale segundo.
     *
     * Sembrarlo al principio habría hecho el escenario infalsificable: saldría segundo por fecha
     * aunque el ranking no existiera, que es exactamente el fallo que este archivo persigue.
     */
    await seedPost({
      title: titles.enElTitulo,
      slug: enElTitulo,
      kind: "producto",
      origin: "productor",
      price: 96,
    });

    await seedPost({
      title: titles.soloEnElTexto,
      slug: soloEnElTexto,
      kind: "producto",
      origin: "productor",
      price: 60,
      content: `Una mermelada que va muy bien con ${TOKEN} tostado.`,
    });
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(enElTitulo);
    await deleteOnePostBySlug(soloEnElTexto);
  });

  /*
   * El fallo que motivó todo esto: sin `ORDER BY`, el orden lo decidía el planner y podía cambiar
   * entre ejecuciones. Dos búsquedas seguidas es lo mínimo que lo detecta.
   */
  test("Entonces la misma búsqueda dos veces da el mismo orden", async ({
    page,
  }) => {
    await page.goto(`/buscar?q=${TOKEN}`);
    const primera = await resultTitles(page);

    await page.goto(`/buscar?q=${TOKEN}`);
    const segunda = await resultTitles(page);

    expect(primera.length).toBeGreaterThan(1);
    expect(segunda).toEqual(primera);
  });

  test("Y lo que coincide en el título va antes que lo que solo coincide en el texto", async ({
    page,
  }) => {
    await page.goto(`/buscar?q=${TOKEN}`);

    const titulos = await resultTitles(page);

    expect(titulos[0]).toContain(TOKEN);
    expect(titulos[1]).toContain("Mermelada de zarzamora");
  });

  test("Y sin coincidencias no se inventa ningún resultado", async ({
    page,
  }) => {
    await page.goto("/buscar?q=xyzzyningunacoincidencia");

    expect(await resultTitles(page)).toHaveLength(0);
  });
});
