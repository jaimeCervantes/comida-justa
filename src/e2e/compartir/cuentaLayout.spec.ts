import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import SellerAccountPage from "../sellerStore/SellerAccountPage";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testStore } from "../testUtils/testSlug";

// Slice 3 de docs/features/compartir-y-cuenta.md.

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
});
