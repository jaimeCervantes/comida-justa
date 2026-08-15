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

/**
 * Cuántas páginas del catálogo se recorren como mucho.
 *
 * **Ningún escenario puede fijar en qué página cae un producto.** El tamaño de página cambia con el
 * entorno —9 en local, 4 en CI, que corre sin ningún `.env`— y el catálogo crece: "Jugo Verde"
 * estaba en la primera página hasta que se sembró una segunda tienda con dos productos, y a partir
 * de ahí el escenario se ponía rojo por dónde quedó el producto, no por lo que prueba. Se recorre
 * hasta encontrarlo, y el tope solo existe para que un fallo no se convierta en un bucle.
 */
const MAX_PAGINAS_DEL_CATALOGO = 6;

function urlDePagina(numero: number): string {
  return numero === 1 ? "/productos" : `/productos/page/${numero}`;
}

/**
 * Abre esa página del catálogo y espera a que sus tarjetas estén pintadas. `false` si no existe.
 *
 * La espera no es de adorno: `count()` **no espera a nada**, así que sin ella se cuenta sobre una
 * página a medio pintar y la tarjeta buscada "no está" aunque llegue medio segundo después. El
 * escenario original no lo necesitaba porque `expect(...).toHaveAttribute` sí espera.
 */
async function abrirPaginaDelCatalogo(
  page: Page,
  numero: number,
): Promise<boolean> {
  const response = await page.goto(urlDePagina(numero));

  // Pasada la última página, la ruta responde 404: ahí se acaba el catálogo.
  if (response?.status() === 404) return false;

  await page.getByTestId("media-image-sized").first().waitFor();

  return true;
}

/** La imagen dentro de la tarjeta de esa publicación, en un listado. */
function cardImage(page: Page, title: string): Locator {
  return page
    .locator("article")
    .filter({ hasText: title })
    .getByTestId("media-image-sized");
}

/** Abre el catálogo por donde esté esa publicación y devuelve su imagen. */
async function abrirCatalogoCon(page: Page, title: string): Promise<Locator> {
  for (let numero = 1; numero <= MAX_PAGINAS_DEL_CATALOGO; numero++) {
    if (!(await abrirPaginaDelCatalogo(page, numero))) break;

    const image = cardImage(page, title);

    if ((await image.count()) > 0) return image;
  }

  throw new Error(
    `No se encontró "${title}" en las primeras ${MAX_PAGINAS_DEL_CATALOGO} ` +
      "páginas de /productos. ¿Sigue publicado y disponible?",
  );
}

/**
 * El alto pintado de cada imagen con dimensiones conocidas del listado.
 *
 * Se recorre el catálogo entero en vez de fijar dos productos concretos: lo que se afirma no es qué
 * productos hay, sino que **conviven formas distintas**.
 */
async function alturasDelListado(page: Page): Promise<number[]> {
  const alturas: number[] = [];

  for (let numero = 1; numero <= MAX_PAGINAS_DEL_CATALOGO; numero++) {
    if (!(await abrirPaginaDelCatalogo(page, numero))) break;

    for (const imagen of await page.getByTestId("media-image-sized").all()) {
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
    const image = await abrirCatalogoCon(page, VERTICAL.title);

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
