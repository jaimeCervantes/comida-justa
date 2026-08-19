import { expect, test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 4 de `docs/features/wellbeing/001-2026-08-05-ubicacion-fresca.md`.
 *
 * "En otro estado del país, y donde quiera, debe poder encontrar cosas sanas". El directorio de
 * productores medía su radio de 50 km desde un ancla fija en Veracruz, así que era una lista útil
 * para quien vive ahí e inservible para todos los demás.
 *
 * Ojo con el ancla al sembrar: la sucursal de Hazlo Sano está **exactamente** en ella, y hoy no hay
 * ninguna publicación con `origin = 'productor'` en la base. Por eso cada escenario siembra el
 * productor que necesita y lo borra al terminar.
 */
const LEJOS_DEL_ANCLA_KM = 300;

const PRODUCTOR_LEJANO = testStore("Panadería de Otro Estado");
const PRODUCTOR_EN_EL_ANCLA = testStore("Panadería del Pueblo");

const cookieEn = (
  baseURL: string | undefined,
  km: number,
): Parameters<
  import("@playwright/test").BrowserContext["addCookies"]
>[0][number] => {
  const { latitude, longitude } = coordinatesAtKm(km);

  return {
    name: VISITOR_LOCATION_COOKIE,
    value: `${latitude},${longitude},${Date.now()}`,
    url: baseURL ?? "http://localhost:3000",
  };
};

test.describe("Cuando quien mira está lejos del pueblo del sitio", () => {
  const slugLejano = testSlug("pan-de-otro-estado");
  const slugCercano = testSlug("pan-del-pueblo");

  test.beforeAll(async () => {
    await seedStore(PRODUCTOR_LEJANO, LEJOS_DEL_ANCLA_KM);
    await seedStore(PRODUCTOR_EN_EL_ANCLA, 2);

    await seedPost({
      title: `E2E Pan de otro estado ${Date.now()}`,
      slug: slugLejano,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: PRODUCTOR_LEJANO.handle,
    });
    await seedPost({
      title: `E2E Pan del pueblo ${Date.now()}`,
      slug: slugCercano,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: PRODUCTOR_EN_EL_ANCLA.handle,
    });
  });

  test.afterAll(async () => {
    await deleteOnePostBySlug(slugLejano);
    await deleteOnePostBySlug(slugCercano);
    await deleteTestSellerByHandle(PRODUCTOR_LEJANO.handle);
    await deleteTestSellerByHandle(PRODUCTOR_EN_EL_ANCLA.handle);
  });

  /*
   * El escenario que motivó la feature: un productor a 2 km de mí es local, aunque los dos estemos
   * a 300 km del pueblo donde nació el sitio.
   */
  test("Entonces un productor a su lado sí es local, aunque los dos estén lejos del ancla", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([cookieEn(baseURL, LEJOS_DEL_ANCLA_KM)]);

    await page.goto("/productores-locales");

    await expect(page.getByText(PRODUCTOR_LEJANO.name)).toBeVisible();
    // Y el del pueblo, que ahora queda a 300 km de quien mira, no cuenta como local suyo.
    await expect(page.getByText(PRODUCTOR_EN_EL_ANCLA.name)).toHaveCount(0);
    await expect(page.getByTestId("nothing-nearby")).toHaveCount(0);
  });

  /*
   * Sin este respaldo, el ancla móvil convertía "no hay nadie en tus 50 km" en una página en blanco,
   * que es el peor resultado: no distingue "no hay nadie cerca" de "esto está roto".
   */
  test("Y si no hay nadie en sus 50 km, ve lo que hay con el aviso de que queda lejos", async ({
    page,
    baseURL,
  }) => {
    // A 1000 km del ancla no tiene a ninguno de los dos productores dentro del radio.
    await page.context().addCookies([cookieEn(baseURL, 1000)]);

    await page.goto("/productores-locales");

    await expect(page.getByTestId("nothing-nearby")).toBeVisible();
    await expect(page.getByTestId("directory-empty")).toHaveCount(0);
    await expect(page.getByText(PRODUCTOR_EN_EL_ANCLA.name)).toBeVisible();
  });

  test("Pero sin ubicación, el ancla sigue siendo la de la comunidad", async ({
    page,
  }) => {
    await page.goto("/productores-locales");

    await expect(page.getByText(PRODUCTOR_EN_EL_ANCLA.name)).toBeVisible();
    await expect(page.getByText(PRODUCTOR_LEJANO.name)).toHaveCount(0);
    await expect(page.getByTestId("nothing-nearby")).toHaveCount(0);
  });

  /* El otro directorio no filtra por radio, así que el ancla no le cambia nada. */
  test("Y los negocios locales siguen listándose igual", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([cookieEn(baseURL, 1000)]);

    await page.goto("/negocios-locales");

    await expect(page.getByText(PRODUCTOR_LEJANO.name)).toBeVisible();
    await expect(page.getByText(PRODUCTOR_EN_EL_ANCLA.name)).toBeVisible();
    await expect(page.getByTestId("nothing-nearby")).toHaveCount(0);
  });
});
