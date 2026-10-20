import { expect, type Page, test } from "@playwright/test";
import { InventoryPanel } from "../inventory/InventoryPanel";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { fillWhenHydrated } from "../testUtils/fillWhenHydrated";
import { seedPost } from "../testUtils/seedPost";
import { seedStore } from "../testUtils/seedStore";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { findUserIdByEmail } from "../testUtils/suiteAccount";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * Slice 1 de `docs/features/search/007-2026-10-20-busqueda-en-tienda-por-palabras.md`; los
 * escenarios son los de `busquedaEnTienda.feature`.
 */

/** El dueño de la tienda sembrada, como en `busquedaEnListas.spec.ts`. */
const STORE_OWNER_EMAIL = "danielsrodroguez@gmail.com";

const PROTEINA = "Proteína de Soya Aislada | Prosoy 90% 250 g";
const PAN = "Pan de masa madre de canela";
const AGUA = "Agua de piña con pepino";
const BARRA = "Barra de Proteína Sabor Moka — Pieza individual";

/**
 * El `Background`, en este orden: la barra es la más reciente y, sin buscar, va primero.
 *
 * Los títulos van sin la marca `E2E` porque el escenario del orden mira cómo **empiezan**. La tienda
 * sí la lleva, y las publicaciones se barren por su slug `e2e-…`.
 */
const CATALOG = [PROTEINA, PAN, AGUA, BARRA] as const;

let store: ReturnType<typeof testStore>;
const seeded: string[] = [];
const sessions: DbSession[] = [];

test.beforeEach(async () => {
  store = testStore("Tienda por palabras");
  await seedStore(store, null, await findUserIdByEmail(STORE_OWNER_EMAIL));

  for (const title of CATALOG) {
    const slug = testSlug("busqueda-en-tienda");
    seeded.push(slug);
    await seedPost({
      title,
      slug,
      kind: "producto",
      origin: "hazlo_sano_propio",
      price: 40,
      sellerHandle: store.handle,
    });
  }
});

test.afterEach(async () => {
  for (const slug of seeded.splice(0)) await deleteOnePostBySlug(slug);
  await deleteTestSellerByHandle(store.handle);
  for (const s of sessions.splice(0)) await deleteSession(s.sessionToken);
});

function cards(page: Page) {
  return page.getByTestId("store-catalog").locator("article");
}

/** Un visitante sin sesión busca en el catálogo de la tienda. */
async function searchStore(page: Page, written: string) {
  await page.goto(`/tienda/${store.handle}`);
  await expect(cards(page)).toHaveCount(CATALOG.length);
  await fillWhenHydrated(page.getByTestId("store-search"), written);
}

test.describe("Encuentro el producto con las palabras que recuerdo", () => {
  for (const { escrito, encuentra } of [
    { escrito: "masa madre", encuentra: PAN },
    { escrito: "canela masa", encuentra: PAN },
    { escrito: "madr canel", encuentra: PAN },
    { escrito: "pina", encuentra: AGUA },
    { escrito: "SOYA", encuentra: PROTEINA },
  ]) {
    test(`«${escrito}»`, async ({ page }) => {
      await searchStore(page, escrito);

      await expect(cards(page)).toHaveCount(1);
      await expect(cards(page).first()).toContainText(encuentra);
    });
  }
});

test("Todas las palabras, no cualquiera", async ({ page }) => {
  await searchStore(page, "canela pepino");

  await expect(page.getByTestId("store-empty")).toBeVisible();
  await expect(cards(page)).toHaveCount(0);
});

test("Primero lo que empieza con la primera palabra", async ({ page }) => {
  await page.goto(`/tienda/${store.handle}`);
  // Sin buscar, la barra va primero por ser la más reciente.
  await expect(cards(page).first()).toContainText(BARRA);

  await fillWhenHydrated(page.getByTestId("store-search"), "proteina");

  await expect(cards(page)).toHaveCount(2);
  await expect(cards(page).nth(0)).toContainText(PROTEINA);
  await expect(cards(page).nth(1)).toContainText(BARRA);
});

test("En el panel de inventario, igual", async ({ page, browserName }) => {
  sessions.push(
    await simulateLogin(page, browserName, { email: STORE_OWNER_EMAIL }),
  );

  const panel = new InventoryPanel(page);
  await panel.open();
  await expect(panel.rows).toHaveCount(CATALOG.length);

  await fillWhenHydrated(page.getByTestId("inventory-search"), "canela masa");

  await expect(panel.rows).toHaveCount(1);
  await expect(panel.row(PAN)).toBeVisible();
});
