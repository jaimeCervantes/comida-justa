import { expect, test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 6 de `docs/features/productores-locales.md`.
 *
 * Dos afirmaciones: que los listados con intención local ponen distancias, y que **cuando no las
 * hay se dice por qué**. La segunda importa tanto como la primera — un listado sin distancias
 * parece roto si nadie aclara que la parte que falta es la del visitante.
 */
const CON_SUCURSAL = testStore("Panadería La Luz");
const SIN_SUCURSAL = testStore("Panadería Sin Domicilio");
const VISITOR = coordinatesAtKm(1.65);

const SECCIONES = ["/productos", "/negocios-locales", "/productores-locales"];

test.describe("Cuando alguien no ha compartido su ubicación", () => {
  for (const seccion of SECCIONES) {
    test(`Entonces "${seccion}" explica por qué no hay cercanía y ofrece compartirla`, async ({
      page,
    }) => {
      await page.goto(seccion);

      const aviso = page.getByTestId("location-notice");

      await expect(aviso).toBeVisible();
      await expect(aviso.getByTestId("share-location")).toBeVisible();
      // Quien no vende todavía necesita saber que vender aquí exige tienda con ubicación.
      await expect(aviso.getByTestId("seller-location-cta")).toBeVisible();
    });
  }
});

test.describe("Cuando el home ya sabe dónde está quien mira", () => {
  const slugs = {
    conSucursal: testSlug("anuncio-de-tienda-situada"),
    sinSucursal: testSlug("anuncio-de-tienda-sin-sucursal"),
    sinTienda: testSlug("anuncio-sin-tienda"),
  };

  test.beforeAll(async () => {
    await seedStore(CON_SUCURSAL, 2);
    await seedStore(SIN_SUCURSAL, null);

    // Un anuncio, no un producto: la distancia también aplica a lo que no se vende.
    await seedPost({
      title: `E2E Aviso de tienda situada ${Date.now()}`,
      slug: slugs.conSucursal,
      kind: "anuncio",
      origin: null,
      sellerHandle: CON_SUCURSAL.handle,
    });
    await seedPost({
      title: `E2E Aviso de tienda sin sucursal ${Date.now()}`,
      slug: slugs.sinSucursal,
      kind: "anuncio",
      origin: null,
      sellerHandle: SIN_SUCURSAL.handle,
    });
    await seedPost({
      title: `E2E Aviso sin tienda ${Date.now()}`,
      slug: slugs.sinTienda,
      kind: "anuncio",
      origin: null,
    });
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(slugs.sinTienda);
    await deleteTestSellerByHandle(CON_SUCURSAL.handle);
    await deleteTestSellerByHandle(SIN_SUCURSAL.handle);
  });

  test("Entonces el aviso desaparece y las publicaciones dicen su distancia", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([
      {
        name: VISITOR_LOCATION_COOKIE,
        value: `${VISITOR.latitude},${VISITOR.longitude}`,
        url: baseURL ?? "http://localhost:3000",
      },
    ]);

    await page.goto("/");

    // Ya no hay nada que explicar: lo que se pinta son las distancias.
    await expect(page.getByTestId("location-notice")).toHaveCount(0);
    await expect(page.getByTestId("store-distance").first()).toBeVisible();
  });

  /*
   * La regla que pidió el usuario: la distancia sale de la sucursal del vendedor, así que sin
   * tienda —o con tienda sin sucursal— no hay nada que medir y no se inventa nada.
   */
  test("Pero lo publicado sin tienda situada se queda sin distancia", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([
      {
        name: VISITOR_LOCATION_COOKIE,
        value: `${VISITOR.latitude},${VISITOR.longitude}`,
        url: baseURL ?? "http://localhost:3000",
      },
    ]);

    await page.goto(`/${slugs.sinTienda}`);
    await expect(page.getByTestId("store-distance")).toHaveCount(0);

    await page.goto(`/${slugs.sinSucursal}`);
    await expect(page.getByTestId("store-distance")).toHaveCount(0);

    // La misma publicación, pero de una tienda situada, sí la dice.
    await page.goto(`/${slugs.conSucursal}`);
    await expect(page.getByTestId("store-distance")).toBeVisible();
  });
});
