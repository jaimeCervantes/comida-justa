import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * Slice 1 de `docs/features/platform/003-2026-08-08-dimensiones-de-media.md`, **conectado tarde**.
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
 *
 * **Ningún escenario nombra una publicación ni una página**, y esto costó dos intentos:
 *
 * 1. Fijar el producto y su página. Se sembró una segunda tienda, el producto se corrió de sitio y
 *    el escenario se puso rojo por dónde quedó, no por lo que prueba.
 * 2. Recorrer el catálogo hasta encontrar ese producto. Es la misma trampa con más pasos: el
 *    recorrido preguntaba con `count()`, que **no espera a nada**, así que una página aún a medio
 *    pintar contestaba cero y el producto se quedaba atrás para siempre —«no se encontró en las
 *    primeras 6 páginas» cuando estaba en la segunda—. Y el tope de páginas es una fecha de
 *    caducidad: el catálogo crece y el tamaño de página cambia con el entorno (9 en local, 4 en CI,
 *    que corre sin ningún `.env`).
 *
 * Así que se mira **la primera página, la que siempre existe**, y se afirma de las fotos que salgan
 * en ella lo que la funcionalidad promete de cualquiera: que el hueco pintado tiene la forma del
 * archivo. Publicar más no mueve nada de sitio porque ya no hay ningún sitio fijado.
 */
const CATALOGO = "/productos";

/** Las dos formas que conviven en el catálogo real: 5 verticales y 4 apaisadas por página. */
const RATIO_MINIMO_ENTRE_FORMAS = 1.4;

/**
 * Cuánto puede alejarse el hueco pintado de la proporción que declara el archivo.
 *
 * No es cero por el redondeo a píxeles: una columna de 300 px pintando un 1200x1600 da 400 px de
 * alto, pero el ancho real lleva decimales. Un 2% distingue de sobra «guarda la proporción» de lo
 * que hacía el fallo original, que metía cualquier foto en un cuadrado —un 36% de recorte—.
 */
const TOLERANCIA_DE_PROPORCION = 0.02;

/** Una foto del listado que sí declara sus dimensiones, con lo que hace falta para juzgarla. */
type FotoDelListado = {
  imagen: Locator;
  /** A dónde lleva su tarjeta. Es como se abre la ficha de **esa misma** foto, sin nombrarla. */
  ficha: string;
  /** Lo que dice el archivo, en los atributos `width`/`height`. */
  declarada: { ancho: number; alto: number };
  /** Lo que ocupa de verdad en la pantalla. */
  pintada: { ancho: number; alto: number };
};

/**
 * Abre el catálogo y espera a que sus fotos estén pintadas.
 *
 * La espera es `toBeVisible` y no `count() > 0` a propósito: las aserciones de Playwright
 * reintentan y `count()` es una foto fija del momento en que se llama. Toda la fragilidad de la
 * versión anterior salía de preguntar sin esperar.
 *
 * Se espera una imagen **con** dimensiones, que es justo lo que estos escenarios miden. Si ningún
 * camino de lectura las entregara —la regresión que se persigue—, aquí no habría ninguna y el
 * fallo diría exactamente eso.
 */
async function abrirCatalogo(page: Page): Promise<void> {
  await page.goto(CATALOGO);

  await expect(page.getByTestId("media-image-sized").first()).toBeVisible();
}

/** Las fotos con dimensiones de la primera página, medidas. */
async function fotosDelListado(page: Page): Promise<FotoDelListado[]> {
  const fotos: FotoDelListado[] = [];

  for (const imagen of await page.getByTestId("media-image-sized").all()) {
    const caja = await imagen.boundingBox();

    if (!caja) continue;

    fotos.push({
      imagen,
      // El enlace que envuelve la foto en la tarjeta: el mismo que sigue quien pincha.
      ficha:
        (await imagen.locator("xpath=ancestor::a[1]").getAttribute("href")) ??
        "",
      declarada: {
        ancho: Number(await imagen.getAttribute("width")),
        alto: Number(await imagen.getAttribute("height")),
      },
      pintada: { ancho: caja.width, alto: caja.height },
    });
  }

  return fotos;
}

/**
 * La primera foto vertical del catálogo, sea cual sea.
 *
 * Si un día la primera página no trae ninguna, el fallo lo dice con esas palabras: es una
 * condición de los datos, no una regresión de la funcionalidad, y conviene no confundirlas.
 */
async function primeraFotoVertical(page: Page): Promise<FotoDelListado> {
  await abrirCatalogo(page);

  const fotos = await fotosDelListado(page);
  const vertical = fotos.find(
    (foto) => foto.declarada.alto > foto.declarada.ancho,
  );

  if (!vertical) {
    throw new Error(
      `Ninguna de las ${fotos.length} fotos con dimensiones de ${CATALOGO} es vertical. ` +
        "El escenario necesita una para medirla; esto es un dato del catálogo, no un fallo del sitio.",
    );
  }

  return vertical;
}

/** Cuánto se aleja el hueco pintado de la forma del archivo, en tanto por uno. */
function desvioDeProporcion(foto: FotoDelListado): number {
  const declarada = foto.declarada.alto / foto.declarada.ancho;
  const pintada = foto.pintada.alto / foto.pintada.ancho;

  return Math.abs(pintada / declarada - 1);
}

test.describe("Cuando una foto vertical sale en un listado", () => {
  test("Entonces se enseña entera, con la proporción del archivo", async ({
    page,
  }) => {
    const foto = await primeraFotoVertical(page);

    /* El hueco pintado guarda la proporción del archivo: más alto que ancho, no un cuadrado
       recortado. El testid ya distingue los dos tratos —`sized` significa que se declararon las
       dimensiones reales, y `unsized` que se cayó al cuadrado de 1000x1000 con `object-cover`—,
       pero declararlas no basta: lo que se afirma aquí es lo que se ve. */
    expect(foto.pintada.alto).toBeGreaterThan(foto.pintada.ancho);
    expect(desvioDeProporcion(foto)).toBeLessThan(TOLERANCIA_DE_PROPORCION);
  });

  test("Entonces la misma foto también se enseña entera en su ficha", async ({
    page,
  }) => {
    // «La misma» de verdad: se entra por el enlace de su tarjeta, no por un slug escrito aquí.
    const foto = await primeraFotoVertical(page);

    await page.goto(foto.ficha);

    const enLaFicha = page
      .getByTestId("post-detail")
      .getByTestId("media-image-sized");

    await expect(enLaFicha).toHaveAttribute(
      "width",
      String(foto.declarada.ancho),
    );
    await expect(enLaFicha).toHaveAttribute(
      "height",
      String(foto.declarada.alto),
    );
  });
});

test.describe("Cuando en un listado conviven formas distintas", () => {
  test("Entonces no todas las tarjetas miden lo mismo de alto", async ({
    page,
  }) => {
    await abrirCatalogo(page);

    const alturas = (await fotosDelListado(page)).map(
      (foto) => foto.pintada.alto,
    );

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
