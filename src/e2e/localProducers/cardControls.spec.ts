import { expect, test } from "@playwright/test";
import { VISITOR_LOCATION_COOKIE } from "~/infra/location/locationCookie";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { coordinatesAtKm, seedStore } from "../testUtils/seedStore";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug, testStore } from "../testUtils/testSlug";

/** Slice 7 de `docs/features/productores-locales.md`. */
test.describe("Cuando un vendedor mira su propio catálogo", () => {
  let dbSession: DbSession | undefined;
  const post = {
    title: `E2E Jugo Verde del listado ${Date.now()}`,
    slug: testSlug("jugo-verde-del-listado"),
    kind: "producto" as const,
    origin: "productor",
    price: 40,
  };

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
    await seedPost(post);
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(post.slug);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces marca agotado desde la tarjeta, sin abrir la publicación", async ({
    page,
  }) => {
    await page.goto("/");

    const tarjeta = page
      .locator("article, li")
      .filter({ hasText: post.title })
      .first();

    await tarjeta
      .getByRole("button", { name: /marcar agotado/i })
      .first()
      .click();

    // Se espera a que la propia tarjeta lo confirme —el botón pasa a ofrecer lo contrario— antes
    // de navegar: un `goto` inmediato adelanta a la acción del servidor y la prueba mide la
    // carrera en vez del comportamiento.
    await expect(
      tarjeta.getByRole("button", { name: /marcar disponible/i }).first(),
    ).toBeVisible();

    // El mismo dato, visto desde su página: no son dos verdades.
    await page.goto(`/${post.slug}`);
    await expect(page.getByTestId("sold-out-badge")).toBeVisible();
  });

  test("Pero quien solo mira no recibe esos controles", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");

    await expect(page.getByTestId("card-owner-controls")).toHaveCount(0);
  });
});

test.describe("Cuando el catálogo pinta el mapa", () => {
  const TIENDA = testStore("Panadería La Luz");
  const slug = testSlug("pan-bajo-el-submenu");
  const VISITOR = coordinatesAtKm(1.65);

  test.beforeAll(async () => {
    await seedStore(TIENDA, 2);
    await seedPost({
      title: `E2E Pan bajo el submenú ${Date.now()}`,
      slug,
      kind: "producto",
      origin: "productor",
      price: 96,
      sellerHandle: TIENDA.handle,
    });
  });

  test.afterAll(async () => {
    await deleteTestSellerByHandle(TIENDA.handle);
  });

  /*
   * Leaflet apila sus capas con z-index de 400 a 700. Sin un contexto de apilamiento propio esos
   * números compiten contra el `z-50` del header y ganan, así que el submenú quedaba por debajo del
   * mapa. Se comprueba en el navegador porque es exactamente donde se veía.
   */
  test("Entonces el submenú del header sigue quedando por encima", async ({
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

    await page.goto("/productos");
    await expect(page.getByTestId("stores-map")).toBeVisible({
      timeout: 15_000,
    });

    await page
      .getByRole("button", { name: /comunidad/i })
      .first()
      .click();

    const enlace = page
      .getByRole("link", { name: /productores locales/i })
      .first();

    await expect(enlace).toBeVisible();
    // Lo que de verdad importa: se puede pulsar, o sea que nada lo tapa.
    await enlace.click();
    await expect(page).toHaveURL(/productores-locales/);
  });
});
