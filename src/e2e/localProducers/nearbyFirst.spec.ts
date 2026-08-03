import { expect, test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 4 de `docs/features/productores-locales.md`.
 *
 * Tres publicaciones idénticas salvo por dónde está su tienda: cerca, lejos y sin tienda. El orden
 * en que salen es todo lo que hay que comprobar.
 */
const CERCA = testStore("Panadería La Luz");
const LEJOS = testStore("Panadería de Otro Estado");

/**
 * El visitante se planta a 350 m de la tienda cercana, y **no** en el ancla.
 *
 * En el ancla está la sucursal de Hazlo Sano, cuyos 13 productos quedarían a 0 m y llenarían
 * enteras las páginas de 4: el orden estaría bien y el escenario no podría verlo. Desde aquí, lo
 * sembrado a 350 m gana a los 13 que quedan a ~1.65 km, y el orden se lee en la primera página.
 */
const VISITOR = coordinatesAtKm(2 - 0.35);

const visitorCookie = (baseURL: string | undefined) => ({
  name: VISITOR_LOCATION_COOKIE,
  value: `${VISITOR.latitude},${VISITOR.longitude}`,
  url: baseURL ?? "http://localhost:3000",
});

test.describe("Cuando alguien con ubicación abre el catálogo", () => {
  const slugs = {
    cerca: testSlug("pan-cercano"),
    lejos: testSlug("pan-lejano"),
    sinTienda: testSlug("pan-sin-tienda"),
  };
  const titles = {
    cerca: `E2E Pan cercano ${Date.now()}`,
    lejos: `E2E Pan lejano ${Date.now()}`,
    sinTienda: `E2E Pan sin tienda ${Date.now()}`,
  };

  test.beforeAll(async () => {
    await seedStore(CERCA, 2);
    await seedStore(LEJOS, 120);

    await seedPost({
      title: titles.cerca,
      slug: slugs.cerca,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: CERCA.handle,
    });
    await seedPost({
      title: titles.lejos,
      slug: slugs.lejos,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: LEJOS.handle,
    });
    // Sin tienda: no tiene ubicación de ninguna clase, y aun así no puede desaparecer.
    await seedPost({
      title: titles.sinTienda,
      slug: slugs.sinTienda,
      kind: "producto",
      origin: "reventa_cercana",
      price: 96,
    });
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(slugs.sinTienda);
    await deleteTestSellerByHandle(CERCA.handle);
    await deleteTestSellerByHandle(LEJOS.handle);
  });

  test("Entonces lo cercano sale antes que lo lejano", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([visitorCookie(baseURL)]);
    await page.goto("/productos");

    // Cada tarjeta pinta su título en un encabezado; el orden del DOM es el del listado.
    const titulos = await page.getByRole("heading").allInnerTexts();
    const posicion = (title: string) =>
      titulos.findIndex((text) => text.includes(title));

    // Lo más cercano encabeza la primera página…
    expect(posicion(titles.cerca)).toBeGreaterThanOrEqual(0);
    // …y lo de 120 km ni siquiera llega a ella, que es el orden haciendo su trabajo.
    expect(posicion(titles.lejos)).toBe(-1);
  });

  test("Y la tarjeta dice a qué distancia está", async ({ page, baseURL }) => {
    await page.context().addCookies([visitorCookie(baseURL)]);
    await page.goto("/productos");

    // Centenas de metros, no la cifra al metro: la siembra desplaza la latitud con 111.32 km por
    // grado y PostGIS mide sobre el elipsoide, así que los ~350 m salen como 348. Lo que este
    // escenario afirma es la unidad y el orden de magnitud, no la geodesia.
    await expect(page.getByTestId("store-distance").first()).toHaveText(
      /^a 3\d\d m$/,
    );
  });

  test("Pero sin ubicación no se pinta ninguna distancia", async ({ page }) => {
    await page.goto("/productos");

    await expect(page.getByTestId("store-distance")).toHaveCount(0);
    await expect(page.getByTestId("nothing-nearby")).toHaveCount(0);
  });
});
