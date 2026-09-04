import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  claimUsernameFor,
  releaseUsername,
} from "../testUtils/claimTestUsername";
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
import { findSuiteUserId, findUserIdByEmail } from "../testUtils/suiteAccount";
import { testSlug, testStore } from "../testUtils/testSlug";

/**
 * La tienda la posee **otra cuenta**, no la de la suite.
 *
 * Es lo que hace verificable la segunda vía: `seedPost` publica siempre con la cuenta de la suite,
 * así que la tienda queda con un catálogo que su dueño no escribió — exactamente el caso que el
 * slice 1 habilitó en la ficha y que este cierra en el listado.
 */
const STORE_OWNER_EMAIL = "danielsrodroguez@gmail.com";

let store: ReturnType<typeof testStore>;
const sessions: DbSession[] = [];
const seeded: string[] = [];
let borrowedUsername: string | null = null;

/**
 * La tarjeta de un producto dentro de un listado, sea el perfil o la tienda.
 *
 * Se localiza por `article` porque es lo que `Card` es —su `Container` por omisión— y por el
 * título, que es lo único que distingue una tarjeta de otra para quien mira. Ni una clase ni una
 * posición: las dos cambian con el diseño y el título no.
 */
function card(page: Page, title: string): Locator {
  return page.locator("article").filter({ hasText: title }).first();
}

async function seed(
  name: string,
  stock: number | null,
  overrides: Partial<SeedPostInput> = {},
): Promise<string> {
  const slug = testSlug(name);
  seeded.push(slug);

  await seedPost({
    title: `E2E ${name}`,
    slug,
    kind: "producto",
    origin: "hazlo_sano_propio",
    price: 40,
    sellerHandle: store.handle,
    ...overrides,
  });

  if (stock !== null) await seedStock(slug, stock);

  return slug;
}

test.beforeEach(async () => {
  store = testStore("Tienda de la tarjeta");
  await seedStore(store, null, await findUserIdByEmail(STORE_OWNER_EMAIL));
});

test.afterEach(async () => {
  if (borrowedUsername) {
    await releaseUsername(borrowedUsername);
    borrowedUsername = null;
  }

  for (const slug of seeded.splice(0)) await deleteOnePostBySlug(slug);
  await deleteTestSellerByHandle(store.handle);
  for (const s of sessions.splice(0)) await deleteSession(s.sessionToken);
});

test.describe("Las existencias se editan desde la tarjeta", () => {
  test("El dueño de la tienda recuenta lo que publicó otra persona", async ({
    page,
    browserName,
  }) => {
    const slug = await seed("dona-chocolate-keto", 5);

    sessions.push(
      await simulateLogin(page, browserName, { email: STORE_OWNER_EMAIL }),
    );

    await page.goto(`/tienda/${store.handle}`);

    const ficha = card(page, "E2E dona-chocolate-keto");
    const submit = ficha.getByTestId("stock-control").getByRole("button");

    await ficha.getByTestId("stock-input").fill("8");
    await submit.click();
    await expect(submit).toBeEnabled({ timeout: 30_000 });

    expect(await readPostRowBySlug(slug)).toMatchObject({ stock_quantity: 8 });
  });

  test("En la tarjeta tampoco conviven los dos mandos", async ({
    page,
    browserName,
  }) => {
    await seed("dona-con-cuenta", 12);
    await seed("jugo-sin-cuenta", null);

    sessions.push(
      await simulateLogin(page, browserName, { email: STORE_OWNER_EMAIL }),
    );

    await page.goto(`/tienda/${store.handle}`);

    const conCuenta = card(page, "E2E dona-con-cuenta");
    await expect(conCuenta.getByTestId("stock-input")).toHaveValue("12");
    await expect(
      conCuenta.getByRole("button", { name: /agotado|disponible/i }),
    ).toBeHidden();

    /* Y el que no lleva la cuenta conserva su interruptor de siempre, con el campo esperando el
       primer número. Es la garantía de que esto no cambia nada de lo ya publicado. */
    const sinCuenta = card(page, "E2E jugo-sin-cuenta");
    await expect(
      sinCuenta.getByRole("button", { name: /agotado/i }),
    ).toBeVisible();
    await expect(sinCuenta.getByTestId("stock-input")).toHaveValue("");
  });

  test("Agotar desde la tarjeta agota en todas partes", async ({
    page,
    browserName,
  }) => {
    const slug = await seed("dona-ultima", 1);

    sessions.push(
      await simulateLogin(page, browserName, { email: STORE_OWNER_EMAIL }),
    );

    await page.goto(`/tienda/${store.handle}`);

    const ficha = card(page, "E2E dona-ultima");
    const submit = ficha.getByTestId("stock-control").getByRole("button");

    await ficha.getByTestId("stock-input").fill("0");
    await submit.click();
    await expect(submit).toBeEnabled({ timeout: 30_000 });

    await page.goto(`/${slug}`);
    await expect(page.getByTestId("sold-out-badge")).toBeVisible();
    await expect(page.getByTestId("whatsapp-order")).toBeHidden();
  });

  test("A quien no administra no se le ofrece", async ({
    page,
    browserName,
  }) => {
    const slug = await seed("dona-ajena", 5);

    /* Un tercero: ni publicó (fue la cuenta de la suite) ni lleva la tienda (es de otra cuenta).
       Que el servidor lo rechace además si forja la acción lo prueba el caso de uso. */
    sessions.push(
      await simulateLogin(page, browserName, {
        email: "aliothzen@gmail.com",
      }),
    );

    await page.goto(`/tienda/${store.handle}`);

    const ficha = card(page, "E2E dona-ajena");
    await expect(ficha.getByTestId("stock-control")).toBeHidden();
    expect(await readPostRowBySlug(slug)).toMatchObject({ stock_quantity: 5 });
  });

  /* La cuenta de la suite no tiene dirección personal reservada, así que el escenario se la presta
     y la devuelve: es una cuenta real y tiene que quedar como estaba. */
  test("Quien publicó lo recuenta desde su propio perfil", async ({
    page,
    browserName,
  }) => {
    const slug = await seed("dona-del-perfil", 3);
    const username = testSlug("duena-del-catalogo");

    await claimUsernameFor(await findSuiteUserId(), username);
    borrowedUsername = username;

    sessions.push(await simulateLogin(page, browserName));
    await page.goto(`/u/${username}`);

    const ficha = card(page, "E2E dona-del-perfil");
    const submit = ficha.getByTestId("stock-control").getByRole("button");

    await ficha.getByTestId("stock-input").fill("7");
    await submit.click();
    await expect(submit).toBeEnabled({ timeout: 30_000 });

    expect(await readPostRowBySlug(slug)).toMatchObject({ stock_quantity: 7 });
  });
});
