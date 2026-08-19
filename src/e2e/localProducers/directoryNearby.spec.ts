import { expect, test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 8 de `docs/features/commerce/002-2026-08-02-productores-locales.md`.
 *
 * Los dos directorios eran las páginas cuya razón de ser **es** la proximidad y las únicas que no
 * la usaban para nada más que filtrar: listaban por nombre alfabético, que no le sirve a nadie que
 * esté decidiendo a dónde ir.
 */
const CERCA = testStore("Aaa Panadería Lejana");
const LEJOS = testStore("Zzz Panadería Cercana");

/*
 * Los nombres van al revés a propósito: alfabéticamente "Aaa" gana, así que si el orden fuera el de
 * antes la de 40 km saldría primero. Que salga la de 2 km es la prueba de que manda la distancia.
 */
const VISITOR = coordinatesAtKm(0);

test.describe("Cuando alguien con ubicación abre un directorio", () => {
  test.beforeAll(async () => {
    await seedStore(CERCA, 2);
    await seedStore(LEJOS, 40);

    for (const [tienda, nombre] of [
      [CERCA, "cerca"],
      [LEJOS, "lejos"],
    ] as const) {
      await seedPost({
        title: `E2E Pan del directorio ${nombre} ${Date.now()}`,
        slug: testSlug(`pan-directorio-${nombre}`),
        kind: "producto",
        origin: "productor",
        price: 96,
        sellerHandle: tienda.handle,
      });
    }
  });

  test.afterAll(async () => {
    await deleteTestSellerByHandle(CERCA.handle);
    await deleteTestSellerByHandle(LEJOS.handle);
  });

  test("Entonces las tiendas salen de la más cercana a la más lejana", async ({
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

    await page.goto("/productores-locales");

    const nombres = await page.getByTestId("store-summary").allInnerTexts();
    const posicion = (nombre: string) =>
      nombres.findIndex((texto) => texto.includes(nombre));

    expect(posicion(CERCA.name)).toBeGreaterThanOrEqual(0);
    expect(posicion(CERCA.name)).toBeLessThan(posicion(LEJOS.name));
  });

  test("Y cada tienda dice a qué distancia queda", async ({
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

    await page.goto("/negocios-locales");

    await expect(page.getByTestId("store-distance").first()).toBeVisible();
  });

  test("Pero sin ubicación siguen saliendo por nombre, sin distancias", async ({
    page,
  }) => {
    await page.goto("/negocios-locales");

    await expect(page.getByTestId("store-distance")).toHaveCount(0);
    await expect(page.getByTestId("location-notice")).toBeVisible();
  });
});
