import { expect, type Locator, type Page, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { type SeedPostInput, seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slice 2 de `listadosCompactos.feature`: la tarjeta deja de escribir lo que puede dibujar.
 *
 * El término es real del catálogo consultado el 2026-09-10: «proteína» devuelve más de 25
 * publicaciones, todas productos de Alimentación. Ningún escenario afirma cuántas son.
 */

const TERMINO = "proteína";

async function caja(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  if (!box) throw new Error("El elemento no tiene caja: ¿está desplegado?");

  return box;
}

/** El centro vertical, que es lo que decide si dos cosas comparten renglón. */
const centro = (box: { y: number; height: number }) => box.y + box.height / 2;

function primeraPublicacion(page: Page): Locator {
  return page.getByTestId("search-results").locator("article").first();
}

test.describe("La tarjeta de un listado", () => {
  test("Junta sus acciones en un renglón, y cada una conserva su nombre", async ({
    page,
  }) => {
    await page.goto(`/buscar?q=${encodeURIComponent(TERMINO)}`);
    const tarjeta = primeraPublicacion(page);

    /* Por el nombre y no por el texto pintado: es lo que oye quien navega escuchando, y es lo
       único que no puede perderse al quitar la palabra. Si el icono se quedara mudo, esto falla. */
    const carrito = tarjeta.getByRole("button", { name: es.cart.add });
    const apoyo = tarjeta.getByRole("link", {
      name: es.post.reactionSignIn,
    });

    const dosRenglones = Math.abs(
      centro(await caja(carrito)) - centro(await caja(apoyo)),
    );

    /* Comparten renglón. Antes cada acción caía en la suya —«Añadir al carrito» sola ocupa 172 px—
       y las tres se llevaban la mitad del alto de la tarjeta. Se mide contra la altura del propio
       botón y no contra un número suelto: lo que se afirma es que están a la misma altura, no
       cuánto miden. */
    expect(dosRenglones).toBeLessThan((await caja(carrito)).height / 2);
  });

  test("Y compartir se alcanza sin bajar hasta la firma", async ({ page }) => {
    await page.goto(`/buscar?q=${encodeURIComponent(TERMINO)}`);
    const tarjeta = primeraPublicacion(page);

    const compartir = await caja(tarjeta.getByTestId("card-share-trigger"));
    const titulo = await caja(tarjeta.getByRole("heading").first());

    /* Encima del título es, en esta tarjeta, encima de la imagen: no hay nada más ahí arriba.
       Se afirma contra el título y no contra la foto porque el título siempre está — una práctica
       sin evidencia enseña su pilar en vez de una imagen. */
    expect(compartir.y + compartir.height).toBeLessThanOrEqual(titulo.y);
  });
});

test.describe("Cuando quien publicó mira su propia tarjeta", () => {
  let dbSession: DbSession | undefined;
  const post = {
    title: `E2E Barra de Proteína del listado ${Date.now()}`,
    slug: testSlug("barra-de-proteina-del-listado"),
    kind: "producto",
    origin: "productor",
    price: 27,
  } satisfies SeedPostInput;

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

  test("Su menú comparte renglón con juntar al carrito", async ({ page }) => {
    await page.goto("/");

    const tarjeta = page
      .locator("article, li")
      .filter({ hasText: post.title })
      .first();

    const carrito = tarjeta.getByRole("button", { name: es.cart.add });
    const suyo = tarjeta
      .getByRole("button", { name: es.post.ownerMenu })
      .first();

    /* A la misma altura: es lo que separa un renglón de acciones de dos. Lo que cuelga del «⋯»
       —editar, agotar, recontar— no ocupa sitio hasta que alguien lo pide, que es la diferencia
       entre cobrarle ese alto a una persona por tarjeta o a todas las demás. */
    const alturas = await Promise.all(
      [carrito, suyo].map(async (accion) =>
        Math.round(centro(await caja(accion))),
      ),
    );

    expect(Math.max(...alturas) - Math.min(...alturas)).toBeLessThan(
      (await caja(carrito)).height / 2,
    );
  });

  test("Y quien solo mira no encuentra ese menú", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");

    await expect(page.getByTestId("card-owner-menu-trigger")).toHaveCount(0);
  });
});
