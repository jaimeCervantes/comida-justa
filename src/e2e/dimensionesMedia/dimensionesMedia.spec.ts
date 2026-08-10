import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * Slice 1 de `docs/features/dimensiones-de-media.md`, **conectado tarde**.
 *
 * Los dos escenarios de este archivo estaban escritos en el `.feature` desde aquella entrega y nunca
 * se llevaron a un spec: lo único que comprobaba `media-image-sized` eran tests de componente, donde
 * las dimensiones llegan como props. Por eso pasó inadvertido durante semanas que **ningún camino de
 * lectura las entregaba**: el listado las traía de la base y las tiraba al mapear, y la ficha ni
 * siquiera las seleccionaba. La foto se pintaba en un cuadrado con `object-cover` y a las verticales
 * —10 de las 15 imágenes— se les recortaba el 36%.
 *
 * Se usan publicaciones **reales**, no sembradas: ya tienen dimensiones en `post_media` y sus
 * imágenes cargan de verdad, así que se puede medir el hueco pintado y no solo leer atributos.
 * `seedPost` no escribe dimensiones, así que sembrar habría probado el caso contrario.
 */
const VERTICAL = {
  slug: "jugo-verde",
  title: "Jugo Verde",
  width: 1200,
  height: 1600,
};
/** Las dos formas que conviven en el catálogo real: 5 verticales y 4 apaisadas por página. */
const RATIO_MINIMO_ENTRE_FORMAS = 1.4;

/** La imagen dentro de la tarjeta de esa publicación, en un listado. */
function cardImage(page: Page, title: string): Locator {
  return page
    .locator("article")
    .filter({ hasText: title })
    .getByTestId("media-image-sized");
}

/**
 * El alto pintado de cada imagen con dimensiones conocidas del listado.
 *
 * Se recorren **las dos primeras páginas** en vez de fijar dos productos concretos: `/productos`
 * ordena por fecha y su tamaño de página cambia con el entorno —9 en local, 4 en CI, que corre sin
 * ningún `.env`—, así que nombrar un producto apaisado ataba el escenario a dónde cayó ese día. Lo
 * que se afirma no es qué productos hay, sino que **conviven formas distintas**.
 */
async function alturasDelListado(page: Page): Promise<number[]> {
  const alturas: number[] = [];

  for (const url of ["/productos", "/productos/page/2"]) {
    await page.goto(url);

    const imagenes = page.getByTestId("media-image-sized");

    for (const imagen of await imagenes.all()) {
      const box = await imagen.boundingBox();

      if (box?.height) alturas.push(box.height);
    }
  }

  return alturas;
}

test.describe("Cuando una foto vertical sale en un listado", () => {
  test("Entonces se enseña entera, con la proporción del archivo", async ({
    page,
  }) => {
    await page.goto("/productos");

    const image = cardImage(page, VERTICAL.title);

    /* El testid es el que distingue los dos tratos: `sized` significa que se declararon las
       dimensiones reales, y `unsized` que se cayó al cuadrado de 1000x1000 con `object-cover`. */
    await expect(image).toHaveAttribute("width", String(VERTICAL.width));
    await expect(image).toHaveAttribute("height", String(VERTICAL.height));

    // Y el hueco pintado guarda esa proporción: más alto que ancho, no un cuadrado recortado.
    const box = await image.boundingBox();

    expect(box).not.toBeNull();
    expect(box?.height ?? 0).toBeGreaterThan(box?.width ?? 0);
  });

  test("Entonces la misma foto también se enseña entera en su ficha", async ({
    page,
  }) => {
    await page.goto(`/${VERTICAL.slug}`);

    const image = page
      .getByTestId("post-detail")
      .getByTestId("media-image-sized");

    await expect(image).toHaveAttribute("width", String(VERTICAL.width));
    await expect(image).toHaveAttribute("height", String(VERTICAL.height));
  });
});

test.describe("Cuando en un listado conviven formas distintas", () => {
  test("Entonces no todas las tarjetas miden lo mismo de alto", async ({
    page,
  }) => {
    const alturas = await alturasDelListado(page);

    // Si esto falla, o no llegan las dimensiones o el catálogo perdió una de las dos formas.
    expect(alturas.length).toBeGreaterThan(1);

    /* Lo que se comprueba es que NO son todas iguales, que es exactamente lo que pasaba cuando las
       15 imágenes se declaraban 1000x1000: una rejilla de cuadrados. 4:3 contra 3:4 son 1.78x en
       teoría; se afirma 1.4 para dejar aire a que las columnas no midan lo mismo. */
    expect(Math.max(...alturas)).toBeGreaterThan(
      Math.min(...alturas) * RATIO_MINIMO_ENTRE_FORMAS,
    );
  });
});
