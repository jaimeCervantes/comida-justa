import { devices, expect, type Page, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import ProfilePage from "../sellerStore/ProfilePage";
import SellerAccountPage from "../sellerStore/SellerAccountPage";
import { releaseUsername } from "../testUtils/claimTestUsername";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug, testStore } from "../testUtils/testSlug";

// Slice 2 de docs/features/content/004-2026-08-08-compartir-y-cuenta.md.
// La tienda y la dirección se siembran con prefijo `e2e-`: la única persona de la base que hoy
// tiene las dos ("Jaime Cervantes", `hazlo-sano` y `jaime-cervantes`) es real y no se toca.

const openAvatarMenu = (page: Page) =>
  page.getByRole("button", { name: es.nav.openUserMenu }).click();

/**
 * El desplegable del avatar, acotado.
 *
 * El menú móvil pinta lo mismo —el nombre, la `@dirección` y los atajos— y **el CSS solo lo
 * esconde**: sigue en el DOM. Sin acotar, buscar "Mi cuenta" en la página encuentra dos, y una de
 * ellas es "Mi cuenta y mi tienda" del bloque móvil. Es la misma trampa que documenta
 * `menu/mobileMenu.spec.ts` al revés.
 */
const avatarMenu = (page: Page) => page.getByTestId("user-menu");

/**
 * Cuánto se espera a que la navegación llegue a su destino.
 *
 * Los 5 s por omisión bastan con el spec corriendo solo, y **no** con la suite entera: `/u/<dir>` y
 * `/tienda/<handle>` listan publicaciones, o sea consultas y render, sobre un servidor que lleva
 * doscientos escenarios encima. Este mismo escenario pasó en dos corridas completas y falló en la
 * tercera —la más lenta, 11.4 min— sin que nada del código cambiara: no es que la navegación no
 * ocurra, es que no cabe en cinco segundos.
 *
 * El resto de la suite ya hace esto donde una página tarda (15 s en `postStoreMap`, 20 s en
 * `homeCards`, 30 s en `managePost`).
 */
const NAVIGATION_TIMEOUT = 20_000;

test.describe("Cuando una vendedora con tienda y perfil abre su avatar", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería La Luz");
  const username = testSlug("panadera");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);

    const account = new SellerAccountPage(page);
    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);

    const profile = new ProfilePage(page);
    await profile.claim(username);
    await profile.expectClaimed(username);
  });

  test.afterEach(async () => {
    await releaseUsername(username);
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces llega a su tienda sin pasar por su cuenta", async ({
    page,
  }) => {
    await page.goto("/");
    await openAvatarMenu(page);

    await page.getByTestId("menu-my-store").click();

    await expect(page).toHaveURL(new RegExp(`/tienda/${store.handle}$`), {
      timeout: NAVIGATION_TIMEOUT,
    });
  });

  test("Entonces llega a su perfil igual de rápido", async ({ page }) => {
    await page.goto("/");
    await openAvatarMenu(page);

    await page.getByTestId("menu-my-profile").click();

    await expect(page).toHaveURL(new RegExp(`/u/${username}$`), {
      timeout: NAVIGATION_TIMEOUT,
    });
  });

  /* Es lo que dice con qué identidad estás mirando el sitio, y es lo que ponen ahí Instagram,
     TikTok y X. */
  test("Entonces el menú dice quién es y con qué dirección", async ({
    page,
  }) => {
    await page.goto("/");
    await openAvatarMenu(page);

    await expect(avatarMenu(page).getByText(`@${username}`)).toBeVisible();
  });
});

test.describe("Cuando alguien sin tienda ni dirección abre su avatar", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  /* Es el caso de 20 de los 21 usuarios de la base: el menú no puede ofrecer una puerta a una
     página que todavía no existe. */
  test("Entonces solo se le ofrece su cuenta", async ({ page }) => {
    await page.goto("/");
    await openAvatarMenu(page);

    await expect(
      avatarMenu(page).getByRole("menuitem", {
        name: es.nav.myAccount,
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByTestId("menu-my-store")).toHaveCount(0);
    await expect(page.getByTestId("menu-my-profile")).toHaveCount(0);
  });
});

test.describe("Cuando la vendedora usa el teléfono", () => {
  test.use({ viewport: devices["Pixel 5"].viewport });

  let dbSession: DbSession | undefined;
  const store = testStore("Panadería La Luz");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);

    const account = new SellerAccountPage(page);
    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);
  });

  test.afterEach(async () => {
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces encuentra su tienda en el menú móvil", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: es.nav.openMenu }).click();

    const shortcut = page
      .getByTestId("mobile-menu")
      .getByTestId("mobile-my-store");

    await expect(shortcut).toBeVisible();

    await shortcut.click();

    await expect(page).toHaveURL(new RegExp(`/tienda/${store.handle}$`), {
      timeout: NAVIGATION_TIMEOUT,
    });
  });
});
