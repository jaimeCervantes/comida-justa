import { expect, type Locator, type Page, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import {
  claimUsernameFor,
  releaseUsername,
} from "../testUtils/claimTestUsername";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { seedStock } from "../testUtils/seedStock";
import { findSuiteUserId } from "../testUtils/suiteAccount";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slice 5 de `docs/features/catalog/005-2026-11-10-filtros-del-catalogo.md`: el perfil —y por tanto
 * «Mis publicaciones»— se busca por palabras, como la tienda.
 *
 * El perfil es el de la cuenta de la suite, con una dirección prestada y devuelta en `afterEach`.
 * Los títulos llevan una palabra de esta corrida y se busca por ella junto a «mermelada»: la cuenta
 * de la suite puede tener otras publicaciones de otras pruebas, y así ninguna se cuela.
 */
let token: string;
let username: string | null = null;
const seeded: string[] = [];

async function seed(name: string, piezas: number): Promise<string> {
  const title = `E2E ${name} ${token}`;
  const slug = testSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  seeded.push(slug);

  await seedPost({
    title,
    slug,
    kind: "producto",
    origin: "productor",
    price: 85,
  });
  await seedStock(slug, piezas);

  return title;
}

test.beforeEach(async () => {
  token = `perfilbusca${Date.now()}`;
  username = testSlug("perfil-que-se-busca");
  await claimUsernameFor(await findSuiteUserId(), username);
});

test.afterEach(async () => {
  if (username) {
    await releaseUsername(username);
    username = null;
  }
  for (const slug of seeded.splice(0)) await deleteOnePostBySlug(slug);
});

test.describe("Un solo conjunto de filtros: buscar en un perfil", () => {
  // Escenario "El perfil se busca por palabras y la búsqueda se combina con los filtros" (@slice-5)
  test("Se busca por palabras y la búsqueda se combina con los filtros", async ({
    page,
  }) => {
    const fresa = await seed("Mermelada de fresa", 5);
    const zarzamora = await seed("Mermelada de zarzamora", 0);
    const miel = await seed("Miel de abeja melipona", 5);

    await page.goto(`/u/${username}`);
    await page.getByTestId("profile-search").fill(`mermelada ${token}`);

    await expect(page).toHaveURL(/q=/);
    await expect(card(page, fresa)).toBeVisible();
    await expect(card(page, zarzamora)).toBeVisible();
    await expect(card(page, miel)).toHaveCount(0);

    await page
      .getByTestId("listing-filters")
      .getByTestId("filter-only-available")
      .click();

    await expect(page).toHaveURL(/disponibles=1/);
    await expect(page).toHaveURL(/q=/);
    await expect(card(page, fresa)).toBeVisible();
    await expect(card(page, zarzamora)).toHaveCount(0);
  });

  // Escenario "Buscar y no encontrar no dice que el perfil esté vacío" (@slice-5)
  test("Buscar y no encontrar no dice que el perfil esté vacío", async ({
    page,
  }) => {
    await seed("Mermelada de fresa", 5);

    await page.goto(`/u/${username}`);
    await page.getByTestId("profile-search").fill(`gazpacho ${token}`);

    await expect(page.getByTestId("profile-empty")).toHaveText(
      es.profile.nothingFound,
    );
  });
});

function card(page: Page, title: string): Locator {
  return page
    .getByTestId("profile-publications")
    .locator("article")
    .filter({ hasText: title });
}
