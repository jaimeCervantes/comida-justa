import { expect, type Page, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import { seedStock } from "../testUtils/seedStock";
import { seedStore } from "../testUtils/seedStore";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { findUserIdByEmail } from "../testUtils/suiteAccount";
import { testSlug, testStore } from "../testUtils/testSlug";
import { InventoryPanel } from "./InventoryPanel";

/** El dueño de la tienda sembrada: no la cuenta de la suite, que es quien publica. */
const STORE_OWNER_EMAIL = "danielsrodroguez@gmail.com";

/** Lo que se teclea. Dos productos lo comparten y un tercero no, que es toda la prueba. */
const TERMINO = "masa madre";

let store: ReturnType<typeof testStore>;
const sessions: DbSession[] = [];
const seeded: string[] = [];

async function seed(title: string, stock: number | null): Promise<string> {
  const slug = testSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  seeded.push(slug);

  await seedPost({
    title: `E2E ${title}`,
    slug,
    kind: "producto",
    origin: "hazlo_sano_propio",
    price: 40,
    sellerHandle: store.handle,
  });

  if (stock !== null) await seedStock(slug, stock);

  return slug;
}

/** Teclea en un buscador y espera a que la lista deje de contener lo que ya no encaja. */
async function search(page: Page, testId: string, term: string) {
  await page.getByTestId(testId).fill(term);
}

test.beforeEach(async () => {
  store = testStore("Tienda que se busca");
  await seedStore(store, null, await findUserIdByEmail(STORE_OWNER_EMAIL));
});

test.afterEach(async () => {
  for (const slug of seeded.splice(0)) await deleteOnePostBySlug(slug);
  await deleteTestSellerByHandle(store.handle);
  for (const s of sessions.splice(0)) await deleteSession(s.sessionToken);
});

test.describe("Buscar dentro del inventario", () => {
  test("Encuentro un producto sin paginar a ciegas", async ({
    page,
    browserName,
  }) => {
    await seed("Pan de Masa Madre Natural", 6);
    await seed("Jugo Verde", 3);

    sessions.push(
      await simulateLogin(page, browserName, { email: STORE_OWNER_EMAIL }),
    );

    const panel = new InventoryPanel(page);
    await panel.open();
    await expect(panel.rows).toHaveCount(2);

    // Sin pulsar Enter: el campo dispara solo.
    await search(page, "inventory-search", TERMINO);

    await expect(panel.rows).toHaveCount(1);
    await expect(panel.row("Pan de Masa Madre Natural")).toBeVisible();

    // El término viaja en la dirección, así que recargar no lo pierde.
    await expect(page).toHaveURL(/q=masa\+madre|q=masa%20madre/);
    await page.reload();
    await expect(panel.rows).toHaveCount(1);
  });

  test("Buscar y filtrar por ámbito se combinan", async ({
    page,
    browserName,
  }) => {
    await seed("Pan de Masa Madre Natural", 0);
    await seed("Pan de Masa Madre con Semillas", 6);
    await seed("Jugo Verde", 0);

    sessions.push(
      await simulateLogin(page, browserName, { email: STORE_OWNER_EMAIL }),
    );

    const panel = new InventoryPanel(page);
    await panel.open("out");
    await expect(panel.rows).toHaveCount(2);

    await search(page, "inventory-search", TERMINO);

    // De los dos agotados, solo el que además coincide.
    await expect(panel.rows).toHaveCount(1);
    await expect(panel.row("Pan de Masa Madre Natural")).toBeVisible();
  });

  test("Una búsqueda sin resultados no dice que la tienda esté vacía", async ({
    page,
    browserName,
  }) => {
    await seed("Pan de Masa Madre Natural", 6);

    sessions.push(
      await simulateLogin(page, browserName, { email: STORE_OWNER_EMAIL }),
    );

    const panel = new InventoryPanel(page);
    await panel.open();
    await search(page, "inventory-search", "gazpacho");

    await expect(panel.rows).toHaveCount(0);
    await expect(panel.empty).toBeVisible();
    /* La frase distingue «no hay nada con ese filtro» de «aquí no hay nada», que se arreglan de
       maneras opuestas: borrando el término o poniéndose a publicar. */
    await expect(panel.empty).not.toContainText(
      /no hay productos que mostrar/i,
    );
  });
});

test.describe("Buscar dentro de una tienda", () => {
  /** Sin sesión: el catálogo es público y buscar dentro de él no es administrar. */
  test("Cualquiera puede buscar en el catálogo", async ({ page }) => {
    await seed("Pan de Masa Madre Natural", 6);
    await seed("Jugo Verde", 3);

    await page.goto(`/tienda/${store.handle}`);

    const cards = page.getByTestId("store-catalog").locator("article");
    await expect(cards).toHaveCount(2);

    await search(page, "store-search", TERMINO);

    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText("Pan de Masa Madre Natural");
  });

  test("Sin resultados lo dice sin negar que la tienda tenga catálogo", async ({
    page,
  }) => {
    await seed("Pan de Masa Madre Natural", 6);

    await page.goto(`/tienda/${store.handle}`);
    await search(page, "store-search", "gazpacho");

    await expect(page.getByTestId("store-empty")).toBeVisible();
  });

  /* Sin JavaScript el `<form method="get">` sigue sirviendo: es lo que hace que Enter funcione y
     que la pantalla no dependa del disparo automático. */
  test("Enter también busca", async ({ page }) => {
    await seed("Pan de Masa Madre Natural", 6);
    await seed("Jugo Verde", 3);

    await page.goto(`/tienda/${store.handle}`);
    await page.getByTestId("store-search").fill(TERMINO);
    await page.getByTestId("store-search").press("Enter");

    await expect(page).toHaveURL(/q=/);
    await expect(
      page.getByTestId("store-catalog").locator("article"),
    ).toHaveCount(1);
  });
});
