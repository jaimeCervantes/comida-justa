import { expect, type Page, test } from "@playwright/test";

/*
 * Los escenarios `@slice-9` de src/e2e/design-system/design-system.feature.
 *
 * Lo reportó el usuario abriendo el home en el teléfono: el feed aparecía en varias columnas
 * apretadas y de golpe se convertía en una. `MasonryColumns` corregía el reparto en un
 * `useLayoutEffect`, y eso solo protege los renders POSTERIORES a la hidratación: el primer pintado
 * es el HTML del servidor, que el teléfono dibuja mucho antes de que llegue el JavaScript.
 */

/** Un teléfono y un escritorio, con las columnas que caben en cada uno. */
const PANTALLAS = [
  { nombre: "un teléfono", ancho: 390, alto: 844, columnas: 1 },
  { nombre: "un escritorio", ancho: 1280, alto: 900, columnas: 3 },
] as const;

/** Sin al menos tres tarjetas no se distinguen tres columnas de dos, y el escenario no dice nada. */
const MINIMO_PARA_DISTINGUIR_COLUMNAS = 3;

/**
 * Las coordenadas horizontales distintas que ocupan las tarjetas del feed: cuántas columnas se ven.
 *
 * Se mide la caja y no las clases a propósito. Un test que afirmara `columns-[300px]` pasaría
 * igual aunque el CSS no llegara a aplicarse, y lo que se reportó es dónde acaban las tarjetas.
 *
 * Se mide **dentro del feed** y no en toda la página: el inicio también pinta las celebraciones de
 * la comunidad, que son `<article>` y viven en su propia fila de dos columnas. Contarlas aquí
 * convertía «el feed sale en tres columnas» en «la página tiene cinco posiciones distintas», que no
 * es lo que nadie reportó ni lo que este escenario defiende.
 */
async function columnasVisibles(page: Page): Promise<number[]> {
  const tarjetas = page.getByTestId("feed-masonry").getByRole("article");
  const cuantas = await tarjetas.count();
  const izquierdas = new Set<number>();

  for (let indice = 0; indice < cuantas; indice++) {
    const caja = await tarjetas.nth(indice).boundingBox();
    if (caja) izquierdas.add(Math.round(caja.x));
  }

  return [...izquierdas].sort((una, otra) => una - otra);
}

/**
 * El home tal como se ve **antes de que llegue el JavaScript**: se bloquean los paquetes de Next,
 * así que React nunca hidrata y en pantalla queda el HTML del servidor.
 *
 * Se bloquean las peticiones en lugar de usar `javaScriptEnabled: false` porque así el contexto
 * conserva JavaScript para Playwright, y sobre todo porque es literalmente el caso reportado: la
 * página ya se ve y sus scripts todavía no llegaron. Intentar pillar ese instante con los scripts
 * cargando de verdad sería una carrera, y un test intermitente no defiende nada.
 */
async function abrirSinScripts(page: Page): Promise<void> {
  await page.route(/\/_next\/.*\.js(\?.*)?$/, (route) => route.abort());
  await page.goto("/");
}

/**
 * El home ya hidratado, esperando a que el reparto del cliente haya tomado su decisión.
 *
 * La espera es distinta según el ancho, y las dos afirman algo: en escritorio las columnas
 * repartidas por el cliente **aparecen** —`toHaveCount` reintenta, así que esa espera es la prueba
 * de que hidrató—, y en un teléfono **no aparecen nunca**, porque con una sola columna CSS ya hace
 * exactamente lo que haría el reparto y `MasonryColumns` deja el DOM en paz.
 */
async function abrirHidratada(page: Page, columnas: number): Promise<void> {
  await page.goto("/");
  await page.getByRole("article").first().waitFor();
  await page.waitForLoadState("networkidle");

  await expect(page.getByTestId("masonry-column")).toHaveCount(
    columnas === 1 ? 0 : columnas,
  );
}

test.describe("Cuando alguien abre el home y el JavaScript todavía no llega", () => {
  for (const pantalla of PANTALLAS) {
    test(`Entonces en ${pantalla.nombre} las tarjetas ya salen en ${pantalla.columnas} columna(s)`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: pantalla.ancho,
        height: pantalla.alto,
      });
      await abrirSinScripts(page);

      const publicadas = await page
        .getByTestId("feed-masonry")
        .getByRole("article")
        .count();
      test.skip(
        publicadas < MINIMO_PARA_DISTINGUIR_COLUMNAS,
        "el home no tiene publicaciones suficientes para distinguir columnas",
      );

      expect(await columnasVisibles(page)).toHaveLength(pantalla.columnas);
    });
  }
});

test.describe("Cuando el JavaScript termina de llegar", () => {
  for (const pantalla of PANTALLAS) {
    test(`Entonces en ${pantalla.nombre} ninguna tarjeta cambia de columna`, async ({
      page,
      context,
    }) => {
      const medidas = { width: pantalla.ancho, height: pantalla.alto };

      await page.setViewportSize(medidas);
      await abrirSinScripts(page);

      const publicadas = await page
        .getByTestId("feed-masonry")
        .getByRole("article")
        .count();
      test.skip(
        publicadas < MINIMO_PARA_DISTINGUIR_COLUMNAS,
        "el home no tiene publicaciones suficientes para distinguir columnas",
      );

      const antesDeHidratar = await columnasVisibles(page);

      /* Otra pestaña, esta sin bloquear nada: el `page.route` de arriba vive solo en `page`. */
      const hidratada = await context.newPage();
      await hidratada.setViewportSize(medidas);
      await abrirHidratada(hidratada, pantalla.columnas);

      expect(await columnasVisibles(hidratada)).toEqual(antesDeHidratar);
      await hidratada.close();
    });
  }
});
