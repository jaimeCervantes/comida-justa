import { expect, test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 3 de `docs/features/ubicacion-fresca.md`.
 *
 * Hasta ahora, en cuanto el sitio sabía dónde estabas la sección se quedaba muda: el aviso
 * desaparecía y **no quedaba nada en su lugar**. La cookie duraba un año, así que una ubicación
 * equivocada no se podía corregir sin ir a borrarla a las herramientas del navegador.
 *
 * Las mismas cuatro rutas que recorre `locationNotice.spec.ts` para el caso contrario.
 */
const RUTAS = ["/", "/productos", "/negocios-locales", "/productores-locales"];

const TIENDA = testStore("Panadería La Luz");
const VISITOR = coordinatesAtKm(2 - 0.35);

/** Dos horas: lo bastante viejo para que el chip tenga algo que decir sobre su antigüedad. */
const HACE_DOS_HORAS = Date.now() - 2 * 60 * 60 * 1000;

const cookieCon = (baseURL: string | undefined, stamp: number | null) => ({
  name: VISITOR_LOCATION_COOKIE,
  value: `${VISITOR.latitude},${VISITOR.longitude}${stamp ? `,${stamp}` : ""}`,
  url: baseURL ?? "http://localhost:3000",
});

test.describe("Cuando el sitio ya sabe dónde está quien mira", () => {
  const slug = testSlug("pan-con-chip");

  test.beforeAll(async () => {
    await seedStore(TIENDA, 2);
    await seedPost({
      title: `E2E Pan con chip ${Date.now()}`,
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
      await page.context().addCookies([cookieCon(baseURL, HACE_DOS_HORAS)]);

      await page.goto(ruta);

      await expect(page.getByTestId("location-chip")).toBeVisible();
      await expect(page.getByTestId("refresh-location")).toBeVisible();
      // Y no se le repite el aviso de que no sabemos dónde está, porque sí lo sabemos.
      await expect(page.getByTestId("location-notice")).toHaveCount(0);
    });
  }

  test("Y le dice desde cuándo es el dato que está usando", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([cookieCon(baseURL, HACE_DOS_HORAS)]);

    await page.goto("/productos");

    await expect(page.getByTestId("location-age")).toHaveText(/hace 2 horas/i);
  });

  /*
   * Una cookie del formato anterior no trae fecha. El chip tiene que aparecer igual —es la salida
   * para corregirla, y quien la tiene es justo quien más la necesita— pero sin inventarse una
   * antigüedad que nadie sabe.
   */
  test("Y con una cookie del formato anterior, no se inventa la antigüedad", async ({
    page,
    baseURL,
  }) => {
    await page.context().addCookies([cookieCon(baseURL, null)]);

    await page.goto("/productos");

    await expect(page.getByTestId("location-chip")).toBeVisible();
    await expect(page.getByTestId("location-age")).toHaveCount(0);
  });

  test("Pero sin ubicación se le sigue explicando por qué no hay distancias", async ({
    page,
  }) => {
    await page.goto("/productos");

    await expect(page.getByTestId("location-notice")).toBeVisible();
    await expect(page.getByTestId("location-chip")).toHaveCount(0);
  });
});
