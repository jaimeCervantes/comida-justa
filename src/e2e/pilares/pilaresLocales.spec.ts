import { expect, test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 1 de `docs/features/pilares-locales.md` — `pilaresLocales.feature`.
 *
 * Las cuatro páginas de pilar ya hablaban de lo local, pero ese texto no enlazaba con nadie mientras
 * la base tenía tiendas ubicadas y publicaciones categorizadas por pilar. Esto verifica el tramo que
 * las une.
 *
 * **Se siembra bajo categorías reales** (`movimiento_y_ejercicio`), no bajo una `e2e_`: lo que se
 * prueba es justamente que la raíz del catálogo que le toca a cada pilar sea la correcta, y una
 * categoría inventada no probaría ese mapeo. Todo lo sembrado lleva el prefijo `e2e-` y cae en el
 * `afterAll`.
 */
const CERCA = testStore("Gimnasio del Barrio");
const LEJOS = testStore("Gimnasio Lejano");

/** Sin cookie el ancla es la comunidad; con ella, quien mira. Aquí se mira desde el ancla. */
const VISITANTE = coordinatesAtKm(0);

const PILARES = [
  { ruta: "/pilares/sueno", categoria: "sueno_y_descanso" },
  { ruta: "/pilares/alimentacion", categoria: "alimentacion" },
  { ruta: "/pilares/movimiento", categoria: "movimiento_y_ejercicio" },
  { ruta: "/pilares/mente-espiritu", categoria: "mente_y_espiritu" },
] as const;

test.describe("La seccion local de cada pilar", () => {
  /* Cada pilar declara su categoría aunque no tenga nada publicado: es donde una errata en el mapeo
     se escondería, porque una clave equivocada devuelve cero filas y eso se ve igual que "todavía
     no hay nadie". */
  for (const { ruta, categoria } of PILARES) {
    test(`Dado ${ruta}, entonces ofrece la categoria ${categoria}`, async ({
      page,
    }) => {
      await page.goto(ruta);

      await expect(page.getByTestId("pillar-local")).toHaveAttribute(
        "data-category",
        categoria,
      );
    });
  }

  test("Y vive debajo de la practica, sin desplazarla", async ({ page }) => {
    await page.goto("/pilares/alimentacion");

    const practica = await page.locator("#practica").boundingBox();
    const local = await page.getByTestId("pillar-local").boundingBox();

    expect(practica).not.toBeNull();
    expect(local).not.toBeNull();
    expect(local?.y ?? 0).toBeGreaterThan(practica?.y ?? 0);
  });
});

test.describe("Cuando el pilar tiene negocios cerca", () => {
  test("Entonces Alimentacion muestra a quien se le compra y ofrece el catalogo", async ({
    page,
  }) => {
    await page.goto("/pilares/alimentacion");

    const seccion = page.getByTestId("pillar-local");

    await expect(seccion.getByTestId("pillar-local-stores")).toContainText(
      "Hazlo Sano",
    );
    await expect(
      seccion.getByTestId("pillar-local-posts").getByTestId("card-facts"),
    ).not.toHaveCount(0);
    await expect(
      seccion.getByRole("link", { name: /Ver todo en/ }),
    ).toHaveAttribute("href", "/categoria/alimentacion");
  });
});

test.describe("Cuando todavia no hay nadie de ese pilar", () => {
  /* Sueño es el que ningún escenario siembra, así que es el único cuyo vacío es estable en una base
     compartida. Movimiento se usa más abajo justo porque ahí sí se siembra. */
  test("Entonces lo dice e invita a publicar, sin fingir una lista", async ({
    page,
  }) => {
    await page.goto("/pilares/sueno");

    const seccion = page.getByTestId("pillar-local");

    await expect(seccion.getByTestId("pillar-local-empty")).toBeVisible();
    await expect(seccion.getByTestId("pillar-local-stores")).toHaveCount(0);
    await expect(seccion.getByTestId("pillar-local-posts")).toHaveCount(0);
    await expect(
      seccion.getByRole("link", { name: /Publica tu negocio/ }),
    ).toHaveAttribute("href", "/publicar");
  });
});

test.describe("Cuando alguien publica bajo un pilar que estaba vacio", () => {
  test.beforeAll(async () => {
    await seedStore(CERCA, 2);
    await seedStore(LEJOS, 120);

    /* `subCategory` se deja fuera a propósito: las otras tres raíces no tienen hijas, y que se pueda
       publicar sin ella es lo que hace que la invitación del estado vacío no sea un callejón. */
    await seedPost({
      title: `E2E Clases de baile en la plaza ${Date.now()}`,
      slug: testSlug("clases-de-baile"),
      kind: "producto",
      origin: "productor",
      price: 150,
      category: "movimiento_y_ejercicio",
      sellerHandle: CERCA.handle,
    });

    await seedPost({
      title: `E2E Rutina de resistencia ${Date.now()}`,
      slug: testSlug("rutina-de-resistencia"),
      kind: "producto",
      origin: "productor",
      price: 150,
      category: "movimiento_y_ejercicio",
      sellerHandle: LEJOS.handle,
    });
  });

  test.afterAll(async () => {
    await deleteTestSellerByHandle(CERCA.handle);
    await deleteTestSellerByHandle(LEJOS.handle);
  });

  test("Entonces Movimiento se llena y Sueño sigue vacio", async ({ page }) => {
    await page.goto("/pilares/movimiento");
    await expect(page.getByTestId("pillar-local")).toContainText(
      "Clases de baile en la plaza",
    );

    await page.goto("/pilares/sueno");
    await expect(page.getByTestId("pillar-local-empty")).toBeVisible();
  });

  test("Y lo mas cercano va primero", async ({ page, baseURL }) => {
    await page.context().addCookies([
      {
        name: VISITOR_LOCATION_COOKIE,
        value: `${VISITANTE.latitude},${VISITANTE.longitude}`,
        url: baseURL ?? "http://localhost:3000",
      },
    ]);

    await page.goto("/pilares/movimiento");

    const tiendas = await page
      .getByTestId("pillar-local")
      .getByTestId("store-summary")
      .allInnerTexts();
    const posicion = (nombre: string) =>
      tiendas.findIndex((texto) => texto.includes(nombre));

    expect(posicion(CERCA.name)).toBeGreaterThanOrEqual(0);
    expect(posicion(CERCA.name)).toBeLessThan(posicion(LEJOS.name));
  });
});

test.describe("La seccion en ingles", () => {
  test("Entonces dice lo mismo sin perder el idioma en sus enlaces", async ({
    page,
  }) => {
    await page.goto("/en/pillars/sueno");

    await expect(page.getByTestId("pillar-local-empty")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Publish your business/ }),
    ).toHaveAttribute("href", "/en/publish");
  });
});
