import { expect, test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 1 de `docs/features/platform/007-2026-08-21-chrome-v2.md`.
 *
 * El control para corregir la ubicación estaba escrito seis veces —una por página— y en la ruta de
 * entrada no estaba escrito ninguna: el commit `8b4d9bf` dejó de montar `HomeHero`, que era quien lo
 * llevaba en el home. Ninguna prueba lo vio porque `chip.spec.ts` recorría solo tres rutas.
 *
 * Ahora lo lleva el chrome (`NearbyBar`), así que la afirmación es la contraria y más fuerte: está
 * en **todas** las rutas, y en cada una **una sola vez**.
 */
const TIENDA = testStore("Panadería La Luz");
const SUCURSAL_KM = 2;
const VISITOR = coordinatesAtKm(SUCURSAL_KM - 0.35);

/** Dos horas: lo bastante viejo para que el chip tenga algo que decir sobre su antigüedad. */
const HACE_DOS_HORAS = Date.now() - 2 * 60 * 60 * 1000;

/**
 * Las que montaban el aviso a mano, las dos que nunca lo tuvieron, y `/` — la que lo perdió.
 * `/carrito` entra por ser la prueba de que esto es chrome y no una lista de rutas de catálogo.
 */
const RUTAS = [
  "/",
  "/productos",
  "/categoria/jugos",
  "/productores-locales",
  "/negocios-locales",
  "/pilares/alimentacion",
  "/buscar",
  "/carrito",
];

const cookieCon = (baseURL: string | undefined) => ({
  name: VISITOR_LOCATION_COOKIE,
  value: `${VISITOR.latitude},${VISITOR.longitude},${HACE_DOS_HORAS}`,
  url: baseURL ?? "http://localhost:3000",
});

test.describe("Cuando el sitio ya sabe dónde está quien mira", () => {
  const slug = testSlug("pan-de-la-barra");

  test.beforeAll(async () => {
    await seedStore(TIENDA, SUCURSAL_KM);
    await seedPost({
      title: `E2E Pan de la barra ${Date.now()}`,
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

  for (const ruta of RUTAS) {
    test(`Entonces "${ruta}" le deja corregir su ubicación`, async ({
      page,
      baseURL,
    }) => {
      await page.context().addCookies([cookieCon(baseURL)]);

      await page.goto(ruta);

      await expect(page.getByTestId("nearby-bar")).toBeVisible();
      await expect(page.getByTestId("location-chip")).toBeVisible();
      await expect(page.getByTestId("refresh-location")).toBeVisible();
      // Y no se le repite el aviso de que no sabemos dónde está, porque sí lo sabemos.
      await expect(page.getByTestId("location-notice")).toHaveCount(0);
    });
  }

  /*
   * El motivo por el que los seis avisos de página se retiraron en vez de convivir con la barra: en
   * `/productos` el mismo control habría aparecido dos veces en la misma pantalla.
   */
  test("Y el control aparece una sola vez, no una por sitio que lo montaba", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([cookieCon(baseURL)]);

    await page.goto("/productos");

    await expect(page.getByTestId("location-chip")).toHaveCount(1);
    await expect(page.getByTestId("refresh-location")).toHaveCount(1);
  });

  test("Y le dice desde cuándo es el dato que está usando", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([cookieCon(baseURL)]);

    await page.goto("/");

    await expect(page.getByTestId("location-age")).toHaveText(/hace 2 horas/i);
  });
});

test.describe("Cuando no sabe dónde está", () => {
  test("Entonces el home hereda el aviso, no el chip", async ({ page }) => {
    await page.goto("/");

    const aviso = page.getByTestId("location-notice");

    await expect(aviso).toBeVisible();
    await expect(aviso.getByTestId("share-location")).toBeVisible();
    await expect(page.getByTestId("location-chip")).toHaveCount(0);
  });

  /*
   * `sellerCta` solo existe dentro de `LocationNotice`. Al retirar el aviso de las seis páginas,
   * si la barra no lo hubiera recogido habría desaparecido del sitio entero.
   */
  test("Y la invitación a abrir tienda viaja con él", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("seller-location-cta")).toBeVisible();
  });
});

test.describe("La búsqueda del header", () => {
  /*
   * Era "Buscar...". Es el único renglón del header que puede enseñar de qué va el catálogo, y los
   * ejemplos salen de publicaciones que existen de verdad en la base.
   */
  test("Dice qué buscar, con cosas que existen en el catálogo", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByPlaceholder(/suero natural/i).first()).toBeVisible();
  });
});
