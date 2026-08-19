import { expect, test } from "@playwright/test";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testStore } from "../testUtils/testSlug";
import SellerAccountPage from "./SellerAccountPage";
import StorePage from "./StorePage";

// Slice 6 de docs/features/commerce/001-2026-07-31-vendedores-y-tiendas.md.
// El teléfono de "Hazlo Sano" es el único ocupado en la base real.
const HAZLO_SANO_PHONE = "2781126948";

const DESCRIPTION = "Pan de masa madre horneado cada mañana.";
const WEBSITE = "https://panaderialaluz.mx";

test.describe("Cuando un vendedor corrige la ficha de su tienda", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería La Luz");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);

    const account = new SellerAccountPage(page);
    await account.goto();
    // Se da de alta sin descripción ni sitio web: son justo lo que este slice deja añadir después.
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);
  });

  test.afterEach(async () => {
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces su tienda muestra la descripción y el sitio web", async ({
    page,
  }) => {
    await page.goto("/cuenta");
    await fillProfile(page, { description: DESCRIPTION, url: WEBSITE });

    await expect(page.getByTestId("store-profile-saved")).toBeVisible();

    const storePage = new StorePage(page);
    await storePage.goto(store.handle);

    await expect(page.getByText(DESCRIPTION)).toBeVisible();
    await expect(page.getByTestId("store-url")).toHaveAttribute(
      "href",
      WEBSITE,
    );
  });

  test("Entonces el nombre cambia pero la dirección no se mueve", async ({
    page,
  }) => {
    const nuevoNombre = `${store.name} de Tezonapa`;

    await page.goto("/cuenta");
    await fillProfile(page, { name: nuevoNombre });
    await expect(page.getByTestId("store-profile-saved")).toBeVisible();

    // La MISMA dirección de siempre: los enlaces repartidos siguen vivos.
    const storePage = new StorePage(page);
    await storePage.goto(store.handle);

    await storePage.expectName(nuevoNombre);
  });

  test("Entonces guardar sin tocar el teléfono no se toma por duplicado", async ({
    page,
  }) => {
    await page.goto("/cuenta");
    await fillProfile(page, { description: DESCRIPTION });

    await expect(page.getByTestId("store-profile-saved")).toBeVisible();
    await expect(page.getByTestId("store-profile-error")).toHaveCount(0);
  });

  test("Entonces el teléfono de otra tienda se rechaza", async ({ page }) => {
    await page.goto("/cuenta");
    await fillProfile(page, { phone: HAZLO_SANO_PHONE });

    await expect(page.getByTestId("store-profile-error")).toContainText(
      /ya está registrado/i,
    );
  });
});

/** Rellena solo lo que el escenario cambia y envía la ficha. */
async function fillProfile(
  page: import("@playwright/test").Page,
  values: { name?: string; phone?: string; description?: string; url?: string },
): Promise<void> {
  const form = page.getByRole("form", { name: /edita la ficha de tu tienda/i });

  if (values.name) {
    await page
      .getByRole("textbox", { name: /nombre de tu tienda/i })
      .fill(values.name);
  }
  if (values.phone) {
    await page
      .getByRole("textbox", { name: /teléfono de contacto/i })
      .fill(values.phone);
  }
  if (values.url) {
    await page.getByRole("textbox", { name: /sitio web/i }).fill(values.url);
  }
  if (values.description) {
    await page
      .getByRole("textbox", { name: /qué vendes/i })
      .fill(values.description);
  }

  await form.getByRole("button", { name: /guardar ficha/i }).click();
}
