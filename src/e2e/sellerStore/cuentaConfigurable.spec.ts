import { expect, type Page, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import {
  claimUsernameFor,
  releaseUsername,
} from "../testUtils/claimTestUsername";
import { completeStoreSetup } from "../testUtils/completeStoreSetup";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testStore } from "../testUtils/testSlug";
import SellerAccountPage from "./SellerAccountPage";

// Slice 1 de docs/features/commerce/005-2026-09-04-cuenta-configurable.md.
// Escenarios de `cuentaConfigurable.feature` etiquetados @slice-1 que no son @component.

const USERNAME = "e2e-cuenta-configurable";

function identity(page: Page) {
  return page.getByTestId("account-identity");
}

function setup(page: Page) {
  return page.getByTestId("account-setup");
}

/** El renglón de un paso, por su rótulo escrito — no por su posición en la lista. */
function step(page: Page, label: string) {
  return page.getByTestId("setup-checklist-item").filter({ hasText: label });
}

test.describe("Cuando abro mi cuenta con la tienda a medio configurar", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería La Luz");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);

    const account = new SellerAccountPage(page);
    await account.goto();
    // Sin descripción a propósito: es uno de los pasos que la lista tiene que reclamar.
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);
  });

  test.afterEach(async () => {
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  /* El único `h1` de la pantalla decía «Mi cuenta», que es lo mismo que el menú de la izquierda.
     Ahora nombra la tienda, que es lo único que esta página puede decir y el menú no. */
  test("Entonces la cabecera dice cuál es mi tienda y dónde vive", async ({
    page,
  }) => {
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(store.name);

    const enlace = identity(page).getByRole("link", {
      name: new RegExp(`/tienda/${store.handle}$`),
    });

    await expect(enlace).toHaveText(new RegExp(`^/tienda/${store.handle}$`));
    await expect(enlace).toHaveAttribute("target", "_blank");
  });

  test("Entonces la lista me dice qué me falta y a dónde ir", async ({
    page,
  }) => {
    await expect(setup(page)).toBeVisible();

    /* Abrir la tienda ya está hecho: se marca y deja de pedir nada. */
    const abierta = step(page, es.account.setupStepStore);
    await expect(abierta).toHaveAttribute("data-done", "true");
    await expect(abierta.getByRole("link")).toHaveCount(0);

    /* El logo no: se marca como pendiente y ofrece el camino al bloque que lo arregla. */
    const logo = step(page, es.account.setupStepLogo);
    await expect(logo).toHaveAttribute("data-done", "false");
    await expect(
      logo.getByRole("link", { name: es.account.setupGo }),
    ).toHaveAttribute("href", /#/);
  });

  test("Y el ancla de un pendiente lleva de verdad a su bloque", async ({
    page,
  }) => {
    await step(page, es.account.setupStepLogo)
      .getByRole("link", { name: es.account.setupGo })
      .click();

    /* El destino existe: sin `id` en la tarjeta, el enlace funcionaría y no llevaría a ningún
       sitio — un fallo silencioso que solo se ve mirando la pantalla. */
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: es.account.storeProfileTitle,
        exact: true,
      }),
    ).toBeInViewport();
  });
});

test.describe("Cuando además reservé mi dirección personal", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería del Sol");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);

    const account = new SellerAccountPage(page);
    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);

    await claimUsernameFor(dbSession.userId, USERNAME);
    await page.reload();
  });

  test.afterEach(async () => {
    await releaseUsername(USERNAME);
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces mis dos direcciones viven en la misma cabecera", async ({
    page,
  }) => {
    for (const [path, shareTestId] of [
      [`/tienda/${store.handle}`, "share-store-trigger"],
      [`/u/${USERNAME}`, "share-profile-trigger"],
    ]) {
      const enlace = identity(page).getByRole("link", {
        name: new RegExp(`${path}$`),
      });

      await expect(enlace).toHaveText(new RegExp(`^${path}$`));
      await expect(enlace).toHaveAttribute("target", "_blank");
      await expect(identity(page).getByTestId(shareTestId)).toBeVisible();
    }
  });

  /* Es la razón por la que `StoreCard` y la rama «ya reservada» de `UsernameSection` salieron de la
     página: subir las direcciones a la cabecera sin quitarlas de abajo las habría pintado dos
     veces. Se cuenta sobre la página entera, no dentro de la cabecera. */
  test("Y ninguna de las dos aparece dos veces en la página", async ({
    page,
  }) => {
    for (const path of [`/tienda/${store.handle}`, `/u/${USERNAME}`]) {
      await expect(
        page.getByRole("link", { name: new RegExp(`^${path}$`) }),
      ).toHaveCount(1);
    }
  });
});

test.describe("Cuando ya no me falta nada por configurar", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería del Amanecer");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);

    const account = new SellerAccountPage(page);
    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);

    await claimUsernameFor(dbSession.userId, USERNAME);
    await completeStoreSetup(store.handle);
    await page.reload();
  });

  test.afterEach(async () => {
    await releaseUsername(USERNAME);
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  /* Cinco marcas verdes permanentes son ruido con forma de logro: ocupan el sitio más valioso de la
     pantalla para no pedir nada. */
  test("Entonces la lista de pendientes desaparece", async ({ page }) => {
    await expect(setup(page)).toHaveCount(0);
  });

  test("Y la cabecera sigue enseñando mis dos direcciones", async ({
    page,
  }) => {
    await expect(identity(page)).toBeVisible();
    await expect(
      identity(page).getByRole("link", {
        name: new RegExp(`/tienda/${store.handle}$`),
      }),
    ).toBeVisible();
    await expect(
      identity(page).getByRole("link", { name: new RegExp(`/u/${USERNAME}$`) }),
    ).toBeVisible();
  });
});
