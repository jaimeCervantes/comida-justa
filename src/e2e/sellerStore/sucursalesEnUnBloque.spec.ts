import {
  expect,
  type Page,
  type PlaywrightWorkerOptions,
  test,
} from "@playwright/test";
import es from "~/i18n/messages/es.json";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedBranch } from "../testUtils/seedBranch";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testStore } from "../testUtils/testSlug";
import SellerAccountPage from "./SellerAccountPage";

// Slice 2 de docs/features/commerce/005-2026-09-04-cuenta-configurable.md.
// Escenarios @slice-2 de `cuentaConfigurable.feature` que no son @component.

const SUCURSAL = "Sucursal Centro";

function branchesCard(page: Page) {
  return page.getByTestId("branches-card");
}

/** El campo que solo existe cuando el alta está desplegada. */
function branchNameField(page: Page) {
  return page.getByRole("textbox", { name: /nombre de la sucursal/i });
}

/** Abre la tienda de la suite y siembra las sucursales que pida el escenario. */
async function openStoreWith(
  page: Page,
  browserName: PlaywrightWorkerOptions["browserName"],
  store: { name: string; phone: string; handle: string },
  branches: string[],
): Promise<DbSession> {
  const session = await simulateLogin(page, browserName);

  const account = new SellerAccountPage(page);
  await account.goto();
  await account.fillAndSubmit({ name: store.name, phone: store.phone });
  await account.expectStoreLink(store.handle);

  for (const name of branches) {
    await seedBranch(store.handle, name);
  }

  await page.reload();

  return session;
}

test.describe("Cuando ya tengo una sucursal dada de alta", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería La Luz");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await openStoreWith(page, browserName, store, [SUCURSAL]);
  });

  test.afterEach(async () => {
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  /* Eran dos bloques en columnas distintas: la lista de un lado y el alta del otro, la misma tarea
     a media pantalla de distancia. */
  test("Entonces la sucursal y el botón de agregar otra están en la misma tarjeta", async ({
    page,
  }) => {
    const tarjeta = branchesCard(page);

    await expect(tarjeta).toContainText(SUCURSAL);
    await expect(tarjeta.getByTestId("add-branch-toggle")).toHaveText(
      new RegExp(es.account.addBranchOpen),
    );
  });

  test("Y el alta ya no es un bloque aparte de la página", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: es.account.addBranchTitle,
        exact: true,
      }),
    ).toHaveCount(0);
  });

  /* Cuatro campos y un botón de geolocalización permanentemente abiertos dominaban la tarjeta
     aunque ya tuvieras sucursales dadas de alta. */
  test("Entonces el alta arranca plegada, y se despliega al pedirla", async ({
    page,
  }) => {
    await expect(branchNameField(page)).toBeHidden();

    await branchesCard(page).getByTestId("add-branch-toggle").click();

    await expect(branchNameField(page)).toBeVisible();
  });
});

test.describe("Cuando todavía no tengo ninguna sucursal", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería del Alba");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await openStoreWith(page, browserName, store, []);
  });

  test.afterEach(async () => {
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  /* Plegarla aquí escondería la única acción de la tarjeta detrás de un clic de más, y quien no
     tiene ninguna viene justamente a dar de alta la primera. */
  test("Entonces el alta arranca desplegada", async ({ page }) => {
    await expect(branchNameField(page)).toBeVisible();
    await expect(
      branchesCard(page).getByTestId("add-branch-toggle"),
    ).toHaveText(new RegExp(es.account.addBranchOpenFirst));
  });
});
