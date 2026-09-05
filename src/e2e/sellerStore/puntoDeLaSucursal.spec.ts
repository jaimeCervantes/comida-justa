import { expect, type Page, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { readBranchesByHandle } from "../testUtils/readBranches";
import { seedBranch } from "../testUtils/seedBranch";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testStore } from "../testUtils/testSlug";
import SellerAccountPage from "./SellerAccountPage";
import StorePage from "./StorePage";

// Slice 1 de docs/features/commerce/006-2026-09-04-punto-de-la-sucursal.md.

const SUCURSAL = "Sucursal Centro";

function checkPointLink(page: Page) {
  return page.getByTestId("branch-check-point");
}

test.describe("Cuando quiero comprobar dónde quedó mi sucursal", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería La Luz");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);

    const account = new SellerAccountPage(page);
    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);

    await seedBranch(store.handle, SUCURSAL);
    await page.reload();
  });

  test.afterEach(async () => {
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  /**
   * Se compara contra **lo que PostGIS tiene guardado**, no contra una cadena escrita a mano.
   *
   * Es lo que hace que este escenario diga algo: si la lista armara el enlace con el `map_url` que
   * pegó el vendedor —que es justo lo que hacía antes— las coordenadas no coincidirían y la prueba
   * lo cazaría. Afirmar una URL literal pasaría igual con el enlace equivocado.
   */
  test("Entonces el enlace lleva al punto que la base tiene guardado", async ({
    page,
  }) => {
    const [guardada] = await readBranchesByHandle(store.handle);

    await expect(checkPointLink(page)).toHaveAttribute(
      "href",
      `https://www.google.com/maps?q=${guardada.latitude},${guardada.longitude}`,
    );
  });

  /* Son dos enlaces distintos a propósito: uno abre lo que pegué, el otro lo que se guardó. Que
     coincidan o no es precisamente lo que se viene a comprobar. */
  test("Y convive con el «Ver en el mapa», que sigue llevando a lo que pegué", async ({
    page,
  }) => {
    const [guardada] = await readBranchesByHandle(store.handle);
    const pegado = page.getByRole("link", { name: es.branches.seeOnMap });

    await expect(pegado).toHaveAttribute("href", guardada.mapUrl);
    await expect(checkPointLink(page)).toHaveAttribute("target", "_blank");
  });

  /* Es una herramienta de quien administra la tienda. A un visitante no le sirve de nada saber
     dónde cree la base que está. */
  test("Y a un visitante de la tienda no se le ofrece esa comprobación", async ({
    page,
  }) => {
    const storePage = new StorePage(page);
    await storePage.goto(store.handle);

    /* Acotado al renglón y no por texto suelto: `seedBranch` repite el nombre dentro de la
       dirección, así que `getByText` encontraba dos nodos y rompía en modo estricto. Un
       `data-testid` en el contenedor es más barato que un `exact: true` que alguien olvida. */
    await expect(
      page.getByTestId("branch-item").filter({ hasText: SUCURSAL }),
    ).toBeVisible();
    await expect(checkPointLink(page)).toHaveCount(0);
  });
});
