import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { meta } from "../testUtils/metaTags";
import { seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";

// Slice 1 de docs/features/community/001-2026-08-02-secciones-comunidad.md.
// "hazlo-sano" es la única tienda con dirección pública y hoy **ninguna** publicación tiene origen
// `productor`: por eso negocios lista y productores está vacía. El orden de los escenarios
// importa —el último siembra lo que los primeros afirman que no existe— y Playwright los corre en
// el orden del archivo.
const TIENDA = { handle: "hazlo-sano", name: "Hazlo Sano" };

test.describe("Cuando alguien busca dónde comprar", () => {
  test("Entonces negocios locales lista las tiendas de la comunidad", async ({
    page,
  }) => {
    await page.goto("/negocios-locales");

    const tarjeta = page.getByTestId("store-summary").filter({
      hasText: TIENDA.name,
    });

    await expect(tarjeta).toBeVisible();
    await expect(tarjeta.getByRole("link").first()).toHaveAttribute(
      "href",
      new RegExp(`/tienda/${TIENDA.handle}$`),
    );
  });

  test("Entonces la sección entra al sitemap", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();

    expect(xml).toContain("/negocios-locales<");
  });
});

test.describe("Cuando todavía nadie elabora lo que vende", () => {
  test("Entonces productores explica la sección en vez de enseñar una lista hueca", async ({
    page,
  }) => {
    await page.goto("/productores-locales");

    await expect(page.getByTestId("directory-empty")).toBeVisible();
    await expect(page.getByTestId("store-summary")).toHaveCount(0);
    // La página existe a propósito, pero vacía no es contenido que indexar.
    expect(await meta(page, "robots")).toContain("noindex");
  });

  test("Entonces la sección vacía no entra al sitemap", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();

    expect(xml).not.toContain("/productores-locales<");
  });
});

test.describe("Cuando una tienda publica algo que elabora", () => {
  const slug = testSlug("pan-de-la-casa");

  test.afterEach(async () => {
    await deleteOnePostBySlug(slug);
  });

  test("Entonces aparece en productores, y sigue estando en negocios", async ({
    page,
  }) => {
    await seedPost({
      title: `E2E Pan de la casa ${Date.now()}`,
      slug,
      kind: "producto",
      origin: "productor",
      sellerHandle: TIENDA.handle,
    });

    await page.goto("/productores-locales");
    await expect(
      page.getByTestId("store-summary").filter({ hasText: TIENDA.name }),
    ).toBeVisible();

    // Un productor también es un negocio del pueblo: los dos directorios se solapan a propósito.
    await page.goto("/negocios-locales");
    await expect(
      page.getByTestId("store-summary").filter({ hasText: TIENDA.name }),
    ).toBeVisible();

    const xml = await (await page.request.get("/sitemap.xml")).text();
    expect(xml).toContain("/productores-locales<");
  });
});
