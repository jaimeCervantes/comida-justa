import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import SellerAccountPage from "../sellerStore/SellerAccountPage";
import {
  claimUsernameFor,
  releaseUsername,
} from "../testUtils/claimTestUsername";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testStore } from "../testUtils/testSlug";

/**
 * La navegación interna del 5.15: siempre visible, cinco entradas y dos de ellas condicionadas.
 *
 * Por `data-testid` y no por rol+nombre: el menú principal del header también es un `<nav>` con
 * `aria-label`, y es el primero en el DOM — `getByRole("navigation", { name: … })` encontraba ese,
 * no este.
 */
function accountNav(page: import("@playwright/test").Page) {
  return page.getByTestId("account-nav");
}

// Slice 3 de docs/features/content/004-2026-08-08-compartir-y-cuenta.md.

test.describe("Cuando una vendedora abre su cuenta", () => {
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

  /* Había tres: el de la página, el de la tarjeta de la tienda y el del alta. Un lector de pantalla
     anunciaba tres títulos principales para una sola pantalla, y quien navega por encabezados no
     tenía forma de saber cuál era el de verdad. */
  test("Entonces la página tiene un solo título principal", async ({
    page,
  }) => {
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(es.account.heading);
  });

  test("Entonces cada bloque cuelga de ese título, en su propia tarjeta", async ({
    page,
  }) => {
    for (const title of [
      es.account.storeCardTitle,
      es.account.usernameTitle,
      es.account.storeProfileTitle,
      es.account.branchesHeading,
      es.account.addBranchTitle,
    ]) {
      /* `exact` no es opcional aquí: por omisión el nombre se compara por subcadena, y "Tu tienda"
         casaba también con "La ficha de tu tienda". */
      await expect(
        page.getByRole("heading", { level: 2, name: title, exact: true }),
      ).toBeVisible();
    }
  });

  /* Lo que se reparte va antes que lo que se edita: la dirección personal caía al final de la
     segunda columna, debajo del alta de sucursales. */
  test("Entonces lo que se comparte va antes que lo que se edita", async ({
    page,
  }) => {
    const headings = await page
      .getByRole("heading", { level: 2 })
      .allTextContents();

    expect(headings.indexOf(es.account.storeCardTitle)).toBeLessThan(
      headings.indexOf(es.account.storeProfileTitle),
    );
    expect(headings.indexOf(es.account.usernameTitle)).toBeLessThan(
      headings.indexOf(es.account.addBranchTitle),
    );
  });

  /* Quien vende sí necesita su agenda: es de lo poco que se revisa a diario. Sin dirección
     personal reclamada en este `beforeEach`, "Mis publicaciones" no tiene a dónde llevar y no debe
     ofrecerse — el mismo filtro que ya usa `UserMenu` para "Mi perfil". */
  test("Entonces la navegación ofrece la agenda, y todavía no las publicaciones", async ({
    page,
  }) => {
    const nav = accountNav(page);

    await expect(
      nav.getByRole("link", { name: es.nav.myAccount, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      nav.getByRole("link", { name: es.nav.myOrders }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: es.nav.schedule }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: es.nav.myHabits }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: es.nav.myPublications }),
    ).toHaveCount(0);
  });
});

test.describe("Cuando la navegación viaja a /pedidos y /cuenta/agenda", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería del Amanecer");

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

  /* No es la misma pantalla con otro título: es la misma sección. Si `/pedidos` dejara de montar
     `AccountNav`, quien llegó desde `/cuenta` perdería la navegación a mitad de camino. */
  test("Entonces /pedidos monta la misma navegación, con «Mis pedidos» activo", async ({
    page,
  }) => {
    await page.goto("/pedidos");
    const nav = accountNav(page);

    await expect(
      nav.getByRole("link", { name: es.nav.myOrders }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      nav.getByRole("link", { name: es.nav.myAccount, exact: true }),
    ).not.toHaveAttribute("aria-current", "page");
    await expect(
      nav.getByRole("link", { name: es.nav.schedule }),
    ).toBeVisible();
  });

  test("Entonces /cuenta/agenda monta la misma navegación, con «Mi agenda» activo", async ({
    page,
  }) => {
    await page.goto("/cuenta/agenda");
    const nav = accountNav(page);

    await expect(
      nav.getByRole("link", { name: es.nav.schedule }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      nav.getByRole("link", { name: es.nav.myOrders }),
    ).not.toHaveAttribute("aria-current", "page");
  });
});

test.describe("Cuando quien vende también reclamó su dirección personal", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería del Sol");
  const username = "e2e-cuenta-nav";

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);

    const account = new SellerAccountPage(page);
    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);

    await claimUsernameFor(dbSession.userId, username);
    await page.reload();
  });

  test.afterEach(async () => {
    await releaseUsername(username);
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces «Mis publicaciones» aparece, y lleva al perfil público", async ({
    page,
  }) => {
    const enlace = accountNav(page).getByRole("link", {
      name: es.nav.myPublications,
    });

    await expect(enlace).toBeVisible();
    await expect(enlace).toHaveAttribute("href", new RegExp(`/u/${username}$`));
  });
});

test.describe("Cuando alguien sin tienda abre su cuenta", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
    await page.goto("/cuenta");
  });

  test.afterEach(async () => {
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces también ve un solo título y dos bloques que explican qué gana", async ({
    page,
  }) => {
    await expect(page.locator("h1")).toHaveCount(1);

    await expect(
      page.getByRole("heading", {
        level: 2,
        name: es.account.becomeSellerTitle,
      }),
    ).toBeVisible();
    await expect(page.getByText(es.account.becomeSellerIntro)).toBeVisible();

    await expect(
      page.getByRole("heading", { level: 2, name: es.account.usernameTitle }),
    ).toBeVisible();
    await expect(page.getByText(es.account.usernameIntro)).toBeVisible();
  });

  /* Sin tienda, la agenda no sirve para nada: se oculta en vez de llevar a dar de alta lo que
     falta. Mis pedidos y Mis hábitos no dependen de vender, así que se ofrecen igual. */
  test("Entonces la navegación no ofrece agenda, y sí pedidos y hábitos", async ({
    page,
  }) => {
    const nav = accountNav(page);

    await expect(
      nav.getByRole("link", { name: es.nav.myOrders }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: es.nav.myHabits }),
    ).toBeVisible();
    await expect(nav.getByRole("link", { name: es.nav.schedule })).toHaveCount(
      0,
    );
  });
});
