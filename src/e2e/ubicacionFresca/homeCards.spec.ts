import { expect, type Locator, type Page, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 5 de `docs/features/wellbeing/001-2026-08-05-ubicacion-fresca.md`.
 *
 * El slice 3 puso un chip para corregir la ubicación y el 2 la detección automática, pero en el
 * home no se notaba ninguno de los dos: `PostsWithLoadMore` copia `initialPosts` a `useState`, y
 * `useState` solo mira su valor inicial. La revalidación llegaba, el chip de arriba se repintaba
 * con "hace unos segundos" y las tarjetas de abajo seguían midiendo desde donde ya no estabas.
 *
 * Se prueba aquí y no en Vitest porque el fallo estaba en el cable entre la página y el componente
 * —quién le pone la `key`—, no dentro de ninguno de los dos.
 */
const TIENDA = testStore("Panadería La Luz");

/* La sucursal a 2 km del ancla; el visitante, encima de ella o a 40 km, según el momento. */
const SUCURSAL_KM = 2;
const ENCIMA_DE_LA_TIENDA = coordinatesAtKm(SUCURSAL_KM);
const A_CUARENTA_KM = coordinatesAtKm(SUCURSAL_KM + 40);

test.describe("Cuando alguien mira publicaciones con el permiso de ubicación dado", () => {
  const slug = testSlug("pan-del-feed");
  const title = `E2E Pan del feed ${Date.now()}`;

  /** El home es cronológico, así que esta es la primera tarjeta; se busca por título igual. */
  const tarjetaDelPan = (page: Page): Locator =>
    page.locator("article").filter({ hasText: title });

  test.beforeAll(async () => {
    await seedStore(TIENDA, SUCURSAL_KM);
    await seedPost({
      title,
      slug,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: TIENDA.handle,
    });
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(slug);
    await deleteTestSellerByHandle(TIENDA.handle);
  });

  test.use({ permissions: ["geolocation"] });

  test("Entonces la tarjeta estrena distancia sin que él recargue", async ({
    page,
    context,
  }) => {
    await context.setGeolocation(ENCIMA_DE_LA_TIENDA);

    /* Se entra sin cookie: la escribe el refrescador ya montada la página, y `revalidatePath`
       repinta. Es el paso que el feed se comía entero. */
    await page.goto("/");

    await expect(
      tarjetaDelPan(page).getByTestId("store-distance"),
    ).toContainText(/m|km/, { timeout: 20_000 });
  });

  /*
   * Iba a "/productos" porque el home no tenía chip: `HomeHero` lo llevaba y dejó de montarse en
   * 8b4d9bf. El escenario siempre dijo "desde el home"; ahora la ruta coincide con lo que afirma.
   */
  test("Y al corregirla desde el chip, esa misma tarjeta se corrige con ella", async ({
    page,
    context,
  }) => {
    await context.setGeolocation(ENCIMA_DE_LA_TIENDA);
    await page.goto("/");
    await expect(
      tarjetaDelPan(page).getByTestId("store-distance"),
    ).toContainText(/m|km/, { timeout: 20_000 });

    // Me fui a 40 km y se lo digo apretando el botón, que es para lo que está.
    await context.setGeolocation(A_CUARENTA_KM);
    await page.getByTestId("refresh-location").click();

    /* Los 40 km son los del ayudante, que usa 111.32 km por grado; `ST_Distance` mide sobre el
       elipsoide y a esta latitud salen 39.8. Lo que el escenario afirma es que la tarjeta pasó de
       metros a decenas de kilómetros sin recargar, no el segundo decimal. */
    await expect(tarjetaDelPan(page).getByTestId("store-distance")).toHaveText(
      /a 39\.\d km/,
      { timeout: 20_000 },
    );
  });
});
