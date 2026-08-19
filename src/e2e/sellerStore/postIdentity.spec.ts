import { expect, test } from "@playwright/test";

/*
 * Slice 8 de `docs/features/commerce/001-2026-07-31-vendedores-y-tiendas.md`, escenarios "La publicación dice de quién es
 * antes de que haya que bajar" y "Las salidas del final también muestran de quién son".
 *
 * No siembra nada: "suero-natural" existe, la vende "Hazlo Sano" —que tiene logo— y la publicó
 * alguien con perfil reclamado. Es el mismo criterio que `seo/internalLinks.spec.ts`, que se apoya
 * en "jugo-verde".
 *
 * Las combinaciones de "qué se pinta y qué no" viven en `PostIdentity.test.tsx`, que no necesita
 * base: aquí solo se afirma lo que únicamente se ve de extremo a extremo, que el logo y el avatar
 * llegan desde la base hasta la página.
 */
const SUERO = "suero-natural";

test.describe("Cuando alguien abre una publicación de Hazlo Sano", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${SUERO}`);
  });

  test("Entonces sabe de quién es sin tener que bajar", async ({ page }) => {
    const identidad = page.getByTestId("post-identity");

    await expect(identidad).toBeVisible();

    const tienda = identidad.getByTestId("post-identity-store");
    await expect(tienda).toHaveAttribute("href", /\/tienda\/hazlo-sano$/);
    // El nombre no se lee en pantalla, pero el enlace tiene que llamarse de algo: su único hijo
    // visible es una imagen decorativa, y sin esto se anunciaría como "enlace" a secas.
    await expect(tienda).toHaveAccessibleName("Hazlo Sano");
    // El logo, por su envoltorio y no por el `<img>`: así la prueba no depende de que la imagen
    // haya terminado de cargar para afirmar que el hueco está y trae algo.
    await expect(tienda.getByTestId("post-identity-store-media")).toHaveCount(
      1,
    );

    const autor = identidad.getByTestId("post-identity-author");
    await expect(autor).toHaveAttribute("href", /\/u\//);
    await expect(autor).not.toHaveAccessibleName("");
    await expect(autor.getByTestId("post-identity-author-media")).toHaveCount(
      1,
    );
  });

  test("Y ya no ve la insignia que decía lo mismo que el logo", async ({
    page,
  }) => {
    // Acotado a la ficha para que la prueba diga solo lo suyo: las «relacionadas» son tarjetas y
    // deciden lo mismo por su cuenta, con la misma regla.
    await expect(
      page.getByTestId("post-detail").getByTestId("provenance-badge"),
    ).toHaveCount(0);
  });

  test("Y las salidas del final también muestran de quién son", async ({
    page,
  }) => {
    const tienda = page.getByTestId("post-link-store");
    await expect(tienda).toHaveAttribute("href", /\/tienda\/hazlo-sano$/);
    await expect(tienda.getByTestId("post-link-store-media")).toHaveCount(1);

    const autor = page.getByTestId("post-link-author");
    await expect(autor).toHaveAttribute("href", /\/u\//);
    await expect(autor.getByTestId("post-link-author-media")).toHaveCount(1);
  });
});

/*
 * Escenario "La tarjeta de un listado dice de qué tienda es".
 *
 * Va contra `/productos` y no contra el home porque ahí todo lo listado se vende, así que todo
 * tiene tienda: el escenario no depende de qué publicación caiga primero en la página.
 */
test.describe("Cuando alguien recorre el catálogo", () => {
  test("Entonces cada tarjeta dice de qué tienda es", async ({ page }) => {
    await page.goto("/productos");

    const tienda = page.getByTestId("card-store").first();

    await expect(tienda).toHaveAttribute("href", /\/tienda\//);
    // Se ve el logo y nada más, pero el enlace se llama como la tienda.
    await expect(tienda).not.toHaveAccessibleName("");
    await expect(tienda.getByTestId("card-store-media")).toHaveCount(1);
  });
});
