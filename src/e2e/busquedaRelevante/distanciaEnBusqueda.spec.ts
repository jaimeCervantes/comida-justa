import { expect, type Page, test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 2 de `docs/features/search/001-2026-08-05-busqueda-relevante.md`.
 *
 * La búsqueda era la única sección sin cercanía, y no por falta de UI: usa el mismo `CardForList` y
 * `mapPostsToCards:62` ya leía `item.distanceMeters`. El hueco existía y llegaba siempre vacío
 * porque la consulta nunca la calculaba, y las páginas hacían `fetch` a su propia API —un viaje que
 * no reenvía cookies, así que la ubicación no llegaba nunca.
 *
 * El término es único para no competir con las 23 publicaciones reales de la base.
 */
const TOKEN = `pantufla${Date.now()}`;

const CERCA = testStore("Panadería La Luz");
const LEJOS = testStore("Panadería de Otro Estado");

/** El visitante, a 350 m de la tienda cercana; la lejana queda a 120 km. */
const VISITOR = coordinatesAtKm(2 - 0.35);

const visitorCookie = (baseURL: string | undefined) => ({
  name: VISITOR_LOCATION_COOKIE,
  value: `${VISITOR.latitude},${VISITOR.longitude},${Date.now()}`,
  url: baseURL ?? "http://localhost:3000",
});

async function resultTitles(page: Page): Promise<string[]> {
  const headings = await page.getByRole("heading").allInnerTexts();

  return headings.filter((text) => text.includes("E2E"));
}

test.describe("Cuando alguien con ubicación busca algo", () => {
  const slugs = {
    cerca: testSlug("token-tienda-cercana"),
    lejos: testSlug("token-tienda-lejana"),
    soloTexto: testSlug("token-solo-en-texto-cercano"),
  };
  const titles = {
    cerca: `E2E Pan cercano de ${TOKEN}`,
    lejos: `E2E Pan lejano de ${TOKEN}`,
    soloTexto: `E2E Mermelada cercana ${Date.now()}`,
  };

  test.beforeAll(async () => {
    await seedStore(CERCA, 2);
    await seedStore(LEJOS, 120);

    await seedPost({
      title: titles.lejos,
      slug: slugs.lejos,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: LEJOS.handle,
    });
    await seedPost({
      title: titles.cerca,
      slug: slugs.cerca,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: CERCA.handle,
    });
    /* Cercana pero de menor relevancia: el token solo aparece en su texto. Es la que prueba que la
       distancia no adelanta a la relevancia. */
    await seedPost({
      title: titles.soloTexto,
      slug: slugs.soloTexto,
      kind: "producto",
      origin: "productor",
      price: 60,
      sellerHandle: CERCA.handle,
      content: `Una mermelada que va muy bien con ${TOKEN} tostado.`,
    });
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(slugs.cerca);
    await deleteOnePostBySlug(slugs.lejos);
    await deleteOnePostBySlug(slugs.soloTexto);
    await deleteTestSellerByHandle(CERCA.handle);
    await deleteTestSellerByHandle(LEJOS.handle);
  });

  test("Entonces cada resultado dice a qué distancia está su tienda", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([visitorCookie(baseURL)]);

    await page.goto(`/buscar?q=${TOKEN}`);

    /* Centenas de metros: la siembra desplaza la latitud con 111.32 km por grado y PostGIS mide
       sobre el elipsoide, así que los ~350 m salen como 348. Se afirma la unidad, no la geodesia. */
    await expect(page.getByTestId("store-distance").first()).toHaveText(
      /^a 3\d\d m$/,
    );
  });

  test("Y entre dos igual de pertinentes, la cercana sale antes", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([visitorCookie(baseURL)]);

    await page.goto(`/buscar?q=${TOKEN}`);
    const titulos = await resultTitles(page);

    expect(titulos.indexOf(titles.cerca)).toBeLessThan(
      titulos.indexOf(titles.lejos),
    );
  });

  /*
   * La regla que separa una búsqueda de un listado. La mermelada está a 350 m y las dos panaderías
   * compiten desde 350 m y 120 km, pero el token solo está en su texto: tiene que salir la última
   * de las tres, por lejos que estén las otras.
   */
  test("Pero la relevancia sigue mandando sobre la distancia", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([visitorCookie(baseURL)]);

    await page.goto(`/buscar?q=${TOKEN}`);
    const titulos = await resultTitles(page);

    expect(titulos.indexOf(titles.soloTexto)).toBeGreaterThan(
      titulos.indexOf(titles.lejos),
    );
  });

  /* Esconder algo que alguien pidió por su nombre sería el peor fallo posible en una búsqueda. */
  test("Y lo que está a 120 km sale igual, no se esconde por lejos", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([visitorCookie(baseURL)]);

    await page.goto(`/buscar?q=${TOKEN}`);

    expect(await resultTitles(page)).toContain(titles.lejos);
  });

  test("Y sin ubicación no se inventa ninguna distancia, pero salen todos", async ({
    page,
  }) => {
    await page.goto(`/buscar?q=${TOKEN}`);

    await expect(page.getByTestId("store-distance")).toHaveCount(0);
    expect(await resultTitles(page)).toHaveLength(3);
  });
});
