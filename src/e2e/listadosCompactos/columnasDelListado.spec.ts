import { expect, type Page, test } from "@playwright/test";

/**
 * Slice 3 de `listadosCompactos.feature`: el listado reparte en las columnas que le quepan,
 * nunca más de cuatro.
 *
 * **Se cuentan posiciones, no clases ni anchos.** Lo que promete el slice es que las publicaciones
 * salgan repartidas en N columnas; cómo se consiga —multi-columna de CSS en el primer pintado,
 * reparto medido en el feed del inicio— es implementación, y cambiarla no debería costar una
 * prueba. Dos tarjetas están en la misma columna si empiezan en la misma coordenada.
 */

const TERMINO = "proteína";

async function columnasDelListado(page: Page): Promise<number> {
  const tarjetas = page.getByTestId("search-results").locator("article");
  await expect(tarjetas.first()).toBeVisible();

  const izquierdas = await tarjetas.evaluateAll((nodos) =>
    nodos.map((nodo) => Math.round(nodo.getBoundingClientRect().left)),
  );

  return new Set(izquierdas).size;
}

/*
 * Los anchos de ventana y lo que le toca a cada uno. La cuenta vive en `columnsFor`, con su corrida
 * de escritorio en `MasonryColumns.test.tsx`; esto comprueba que el navegador hace lo mismo que
 * dice esa cuenta.
 *
 * El teléfono girado está a propósito: es la misma pantalla del primer caso y le tocan tres. Si
 * alguien resolviera esto con puntos de corte por dispositivo en vez de por sitio disponible, ese
 * caso es el que lo delataría.
 */
const PANTALLAS = [
  { quien: "teléfono de pie", width: 390, height: 844, columnas: 1 },
  { quien: "el mismo teléfono girado", width: 844, height: 390, columnas: 3 },
  { quien: "tableta", width: 768, height: 1024, columnas: 3 },
  { quien: "escritorio", width: 1280, height: 900, columnas: 4 },
  { quien: "pantalla enorme", width: 2400, height: 900, columnas: 4 },
] as const;

test.describe("Las columnas de un listado", () => {
  for (const { quien, width, height, columnas } of PANTALLAS) {
    test(`En ${quien} (${width}x${height}) reparte en ${columnas}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto(`/buscar?q=${encodeURIComponent(TERMINO)}`);

      expect(await columnasDelListado(page)).toBe(columnas);
    });
  }
});
