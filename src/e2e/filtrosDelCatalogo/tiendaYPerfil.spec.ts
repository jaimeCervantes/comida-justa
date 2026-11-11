import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  claimUsernameFor,
  releaseUsername,
} from "../testUtils/claimTestUsername";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { seedStock } from "../testUtils/seedStock";
import { seedStore } from "../testUtils/seedStore";
import { findSuiteUserId, findUserIdByEmail } from "../testUtils/suiteAccount";
import { testPost, testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 2 de `docs/features/catalog/005-2026-11-10-filtros-del-catalogo.md`: la tienda enseña lo
 * agotado a quien visita y, como el perfil, monta la barra única.
 *
 * La tienda es de **otra cuenta** y no de la de la suite: así quien la abre sin sesión es un
 * visitante de verdad, y lo que antes se le escondía es justo lo que el escenario mira.
 */
const STORE_OWNER_EMAIL = "danielsrodroguez@gmail.com";

let store: ReturnType<typeof testStore>;
let borrowedUsername: string | null = null;
const seeded: string[] = [];

/** Un producto de la tienda de prueba —o de la cuenta de la suite, sin tienda— con sus piezas. */
async function seed(
  title: string,
  piezas: number,
  { inStore = true }: { inStore?: boolean } = {},
): Promise<string> {
  const post = testPost(title);
  seeded.push(post.slug);

  await seedPost({
    ...post,
    kind: "producto",
    origin: "productor",
    price: 85,
    ...(inStore ? { sellerHandle: store.handle } : {}),
  });
  await seedStock(post.slug, piezas);

  return post.title;
}

test.beforeEach(async () => {
  store = testStore("Tienda de las mermeladas");
  await seedStore(store, null, await findUserIdByEmail(STORE_OWNER_EMAIL));
});

test.afterEach(async () => {
  if (borrowedUsername) {
    await releaseUsername(borrowedUsername);
    borrowedUsername = null;
  }
  for (const slug of seeded.splice(0)) await deleteOnePostBySlug(slug);
  await deleteTestSellerByHandle(store.handle);
});

test.describe("Un solo conjunto de filtros: la tienda y el perfil", () => {
  // Escenario "La tienda enseña lo agotado a quien visita" (@slice-2)
  test("La tienda enseña lo agotado a quien visita", async ({ page }) => {
    const fresa = await seed("Mermelada de fresa", 5);
    const miel = await seed("Miel de abeja melipona", 0);

    await page.goto(`/tienda/${store.handle}`);

    await expect(card(page, "store-catalog", fresa)).toBeVisible();
    await expect(
      card(page, "store-catalog", miel).getByTestId("sold-out-badge"),
    ).toBeVisible();
    await expect(onlyAvailable(page)).toHaveAttribute("aria-pressed", "false");
  });

  // Escenario "En la tienda, el filtro y la búsqueda se combinan" (@slice-2)
  test("En la tienda, el filtro y la búsqueda se combinan", async ({
    page,
  }) => {
    const fresa = await seed("Mermelada de fresa", 5);
    const zarzamora = await seed("Mermelada de zarzamora", 0);
    const miel = await seed("Miel de abeja melipona", 5);

    await page.goto(`/tienda/${store.handle}?q=mermelada`);
    await expect(card(page, "store-catalog", zarzamora)).toBeVisible();

    await onlyAvailable(page).click();

    await expect(page).toHaveURL(/disponibles=1/);
    await expect(page).toHaveURL(/q=mermelada/);
    await expect(card(page, "store-catalog", fresa)).toBeVisible();
    await expect(card(page, "store-catalog", zarzamora)).toHaveCount(0);
    await expect(card(page, "store-catalog", miel)).toHaveCount(0);
  });

  // Escenario "En el perfil, el filtro deja fuera lo agotado" (@slice-2)
  test("En el perfil, el filtro deja fuera lo agotado", async ({ page }) => {
    const fresa = await seed("Mermelada de fresa", 5, { inStore: false });
    const miel = await seed("Miel de abeja melipona", 0, { inStore: false });
    const username = testSlug("perfil-de-mermeladas");

    await claimUsernameFor(await findSuiteUserId(), username);
    borrowedUsername = username;

    await page.goto(`/u/${username}`);
    await expect(card(page, "profile-publications", miel)).toBeVisible();

    await onlyAvailable(page).click();

    await expect(page).toHaveURL(/disponibles=1/);
    await expect(card(page, "profile-publications", fresa)).toBeVisible();
    await expect(card(page, "profile-publications", miel)).toHaveCount(0);
  });
});

function onlyAvailable(page: Page): Locator {
  return page
    .getByTestId("listing-filters")
    .getByTestId("filter-only-available");
}

function card(page: Page, grid: string, title: string): Locator {
  return page.getByTestId(grid).locator("article").filter({ hasText: title });
}
