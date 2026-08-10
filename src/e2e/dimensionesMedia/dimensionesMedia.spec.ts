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
const APAISADA = {
  slug: "crema-de-cacahuate-natural",
  title: "Crema de Cacahuate Natural",
  width: 1600,
  height: 1200,
};

/** La imagen dentro de la tarjeta de esa publicación, en un listado. */
function cardImage(page: Page, title: string): Locator {
  return page
    .locator("article")
    .filter({ hasText: title })
    .getByTestId("media-image-sized");
}

async function renderedHeight(image: Locator): Promise<number> {
  await expect(image).toBeVisible();
  const box = await image.boundingBox();

  return box?.height ?? 0;
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
  test("Entonces la vertical ocupa bastante más alto que la apaisada", async ({
    page,
  }) => {
    await page.goto("/productos");

    const alturas = {
      vertical: await renderedHeight(cardImage(page, VERTICAL.title)),
      apaisada: await renderedHeight(cardImage(page, APAISADA.title)),
    };

    /* 4:3 contra 3:4 son 1.78x de diferencia en teoría; se afirma 1.4 para dejar aire al ancho de
       columna, que no es idéntico en todas. Lo que se comprueba es que NO son iguales — que es lo
       que pasaba cuando las dos se declaraban 1000x1000, y lo que hace que el listado parezca
       mampostería y no una rejilla con huecos. */
    expect(alturas.vertical).toBeGreaterThan(alturas.apaisada * 1.4);
  });
});
