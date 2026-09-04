import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { readPostRowBySlug } from "../testUtils/readPostRow";
import { type SeedPostInput, seedPost } from "../testUtils/seedPost";
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

/**
 * La tienda de los escenarios es **sembrada y con dueño propio**.
 *
 * No `Hazlo Sano`: sus 418 productos repartirían lo sembrado por veintiuna páginas ordenadas
 * alfabéticamente, y cada aserción dependería de en qué página cayó. Y el dueño no es la cuenta de
 * la suite porque colgarle una tienda rompe los seis escenarios que empiezan dándose de alta.
 */
const PANEL_OWNER_EMAIL = "danielsrodroguez@gmail.com";

/** La tienda real, para lo único que sólo ella puede demostrar: que 418 productos paginan. */
const REAL_STORE_OWNER_EMAIL = "jaime.cervantes.ve@gmail.com";

const PAGE_SIZE = 20;

test.describe("Panel de inventario de la tienda", () => {
  const sessions: DbSession[] = [];
  const seeded: string[] = [];
  let store: ReturnType<typeof testStore> | null = null;

  test.afterEach(async () => {
    for (const slug of seeded.splice(0)) {
      await deleteOnePostBySlug(slug);
    }

    if (store) {
      await deleteTestSellerByHandle(store.handle);
      store = null;
    }

    for (const session of sessions.splice(0)) {
      await deleteSession(session.sessionToken);
    }
  });

  /** Una tienda de prueba con dueño, lista para que su dueño abra el panel. */
  async function openStore(): Promise<string> {
    store = testStore("Panaderia con inventario");
    await seedStore(store, null, await findUserIdByEmail(PANEL_OWNER_EMAIL));

    return store.handle;
  }

  /** Un producto de esa tienda. Lo publica la cuenta de la suite, que **no** es su dueña. */
  async function seed(
    title: string,
    overrides: Partial<SeedPostInput> = {},
  ): Promise<string> {
    const slug = testSlug(title.toLowerCase().replace(/\s+/g, "-"));
    seeded.push(slug);

    await seedPost({
      title,
      slug,
      kind: "producto",
      origin: "hazlo_sano_propio",
      price: 40,
      sellerHandle: store?.handle,
      ...overrides,
    });

    return slug;
  }

  test("La tienda ve su inventario en una tabla", async ({
    page,
    browserName,
  }) => {
    await openStore();
    await seed("E2E Dona Chocolate Keto");
    await seed("E2E Jugo Verde");

    sessions.push(
      await simulateLogin(page, browserName, { email: PANEL_OWNER_EMAIL }),
    );

    const panel = new InventoryPanel(page);
    await panel.open();

    // Los publicó otra cuenta y aun así están: el inventario es de la tienda.
    await expect(panel.rows).toHaveCount(2);
    await expect(panel.row("E2E Dona Chocolate Keto")).toBeVisible();
    await expect(panel.row("E2E Jugo Verde")).toBeVisible();
  });

  test("Corrijo un número sin salir de la tabla", async ({
    page,
    browserName,
  }) => {
    await openStore();
    const slug = await seed("E2E Dona Chocolate Keto");

    sessions.push(
      await simulateLogin(page, browserName, { email: PANEL_OWNER_EMAIL }),
    );

    const panel = new InventoryPanel(page);
    await panel.open();
    await panel.save("E2E Dona Chocolate Keto", "12");

    await expect(panel.stockOf("E2E Dona Chocolate Keto")).toHaveValue("12");

    // Y donde de verdad importa: la publicación, que es lo que lee el resto del sitio.
    expect(await readPostRowBySlug(slug)).toMatchObject({
      stock_quantity: 12,
      is_available: true,
    });
  });

  const SCOPE_CASES = [
    { scope: "all" as const, expected: ["agotado", "con", "sin"] },
    { scope: "out" as const, expected: ["agotado"] },
    { scope: "untracked" as const, expected: ["sin"] },
  ];

  for (const { scope, expected } of SCOPE_CASES) {
    test(`Filtro "${scope}" enseña ${expected.length} de los tres`, async ({
      page,
      browserName,
    }) => {
      await openStore();
      const agotado = await seed("E2E Agotado");
      const con = await seed("E2E Con existencias");
      await seed("E2E Sin inventario");

      await seedStock(agotado, 0);
      await seedStock(con, 5);

      sessions.push(
        await simulateLogin(page, browserName, { email: PANEL_OWNER_EMAIL }),
      );

      const panel = new InventoryPanel(page);
      await panel.open(scope);

      await expect(panel.rows).toHaveCount(expected.length);
    });
  }

  test("El inventario es de los productos, no de todo lo publicado", async ({
    page,
    browserName,
  }) => {
    await openStore();
    await seed("E2E Dona Chocolate Keto");
    await seed("E2E Sesion de respiracion", {
      kind: "servicio",
      origin: null,
      durationMinutes: 45,
    });
    await seed("E2E Rodada nocturna", {
      kind: "evento",
      origin: null,
      price: null,
      startsAt: new Date("2027-09-05T00:30:00Z"),
    });
    await seed("E2E Aviso de la comunidad", {
      kind: "anuncio",
      origin: null,
      price: null,
    });

    sessions.push(
      await simulateLogin(page, browserName, { email: PANEL_OWNER_EMAIL }),
    );

    const panel = new InventoryPanel(page);
    await panel.open();

    await expect(panel.rows).toHaveCount(1);
    await expect(panel.row("E2E Dona Chocolate Keto")).toBeVisible();
  });

  /**
   * Contra la tienda real y **sin escribir nada**: 418 productos es justo lo que ningún sembrado
   * razonable reproduce, y es el número por el que este panel existe. Se afirma la regla —cabe una
   * página y hay paso a la siguiente—, no cuántos productos tiene hoy `Hazlo Sano`.
   */
  test("La tabla no mete el catálogo entero en una página", async ({
    page,
    browserName,
  }) => {
    sessions.push(
      await simulateLogin(page, browserName, { email: REAL_STORE_OWNER_EMAIL }),
    );

    const panel = new InventoryPanel(page);
    await panel.open();

    expect((await panel.titles()).length).toBeLessThanOrEqual(PAGE_SIZE);
    await expect(panel.nextPage).toBeVisible();

    const firstOfPageOne = await panel.rows.first().innerText();
    await panel.nextPage.click();

    /* Sobre el renglón y no sobre la lista entera: `expect(locator)` reintenta hasta que el DOM
       cambia, y leer los títulos a mano justo después del clic los lee antes de que la navegación
       del cliente haya traído la página siguiente. */
    await expect(panel.rows.first()).not.toHaveText(firstOfPageOne);
    expect((await panel.titles()).length).toBeLessThanOrEqual(PAGE_SIZE);
  });

  test("El menú lleva al inventario solo si hay tienda", async ({
    page,
    browserName,
  }) => {
    await openStore();
    sessions.push(
      await simulateLogin(page, browserName, { email: PANEL_OWNER_EMAIL }),
    );

    await page.goto("/cuenta");
    const nav = page.getByTestId("account-nav");
    await expect(nav.getByRole("link", { name: /inventario/i })).toBeVisible();
  });

  test("Sin tienda no se ofrece el inventario ni se enseña una tabla vacía", async ({
    page,
    browserName,
  }) => {
    // La cuenta de la suite no tiene tienda: es el caso tal cual, sin sembrar nada.
    sessions.push(await simulateLogin(page, browserName));

    await page.goto("/cuenta");
    await expect(
      page
        .getByTestId("account-nav")
        .getByRole("link", { name: /inventario/i }),
    ).toBeHidden();

    const panel = new InventoryPanel(page);
    await panel.open();

    await expect(panel.needsStore).toBeVisible();
    await expect(panel.rows).toHaveCount(0);
  });
});
