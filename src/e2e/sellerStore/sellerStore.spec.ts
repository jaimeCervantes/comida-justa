import { expect, test } from "@playwright/test";
import PublishProductPage from "../publishProduct/PublishProductPage";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testPost, testStore } from "../testUtils/testSlug";
import SellerAccountPage from "./SellerAccountPage";
import StorePage from "./StorePage";

// Slice 1 de docs/features/vendedores-y-tiendas.md.
// La tienda que ya existe en la base compartida y contra la que se prueban las colisiones.
const HAZLO_SANO = {
  handle: "hazlo-sano",
  name: "Hazlo Sano",
  phone: "2781126948",
};

test.describe("Cuando una persona registrada abre su tienda", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería La Luz");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    // Se limpia aquí y no al final del test para que un fallo a media prueba no deje una
    // tienda de mentira publicada en la base que comparten tres repositorios.
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces su tienda queda en línea con su nombre y su teléfono", async ({
    page,
  }) => {
    const account = new SellerAccountPage(page);

    await account.goto();
    await account.fillAndSubmit({
      name: store.name,
      phone: store.phone,
      description: "Pan de masa madre horneado cada mañana.",
    });

    await account.expectStoreLink(store.handle);

    const storePage = new StorePage(page);
    await storePage.goto(store.handle);

    await storePage.expectName(store.name);
    await storePage.expectPhone(store.phone);
    // Recién abierta no tiene catálogo: se dice, en vez de pintar una rejilla vacía.
    await storePage.expectEmpty();
  });

  test("Y lo que publica después aparece en su catálogo", async ({ page }) => {
    const account = new SellerAccountPage(page);
    const { title, slug } = testPost("Pan de masa madre");

    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);

    const publishPage = new PublishProductPage(page);

    await publishPage.stubStorageUpload();
    await publishPage.goto();
    await publishPage.fill({
      title,
      description:
        "Hogaza de fermentación lenta, harina local y sal de mar. Horneada cada mañana.",
      price: "85",
      phone: store.phone,
      file: "./src/e2e/dummies/post.jpg",
      kind: "producto",
      // La panadería hornea lo que vende: un producto exige declararlo desde el slice 1 de
      // `docs/features/productores-locales.md`.
      origin: "productor",
    });
    await publishPage.submit();
    await page.waitForURL(`/${slug}`);

    const storePage = new StorePage(page);
    await storePage.goto(store.handle);

    await storePage.expectListed(title);

    await deleteOnePostBySlug(slug);
  });

  test("Y su cuenta deja de ofrecerle el alta", async ({ page }) => {
    const account = new SellerAccountPage(page);

    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);

    await account.goto();

    await account.expectStoreCard(store.name);
  });

  test("Y ve a dónde va a quedar mientras escribe el nombre", async ({
    page,
  }) => {
    const account = new SellerAccountPage(page);

    await account.goto();
    await page
      .getByRole("textbox", { name: /nombre de tu tienda/i })
      .fill("Tortillería El Sol");

    await account.expectHandlePreview("tortilleria-el-sol");
  });
});

test.describe("Cuando el alta choca con lo que ya existe", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  // Corrida de escritorio del Scenario Outline "El alta rechaza lo que la base no puede guardar
  // dos veces". Ambas filas protegen un índice único que ya existe en la base compartida.
  const collisions = [
    {
      reason: "el nombre ya está tomado",
      name: HAZLO_SANO.name,
      phone: "2789990022",
      message: /ya está ocupado/i,
    },
    {
      reason: "el teléfono ya está registrado",
      name: "Mi Changarro E2E",
      phone: HAZLO_SANO.phone,
      message: /ya está registrado/i,
    },
  ];

  for (const collision of collisions) {
    test(`Entonces lo explica cuando ${collision.reason}`, async ({ page }) => {
      const account = new SellerAccountPage(page);

      await account.goto();
      await account.fillAndSubmit({
        name: collision.name,
        phone: collision.phone,
      });

      await account.expectError(collision.message);
      // Sigue el formulario en pantalla: el alta no ocurrió.
      await account.expectFormVisible();
    });
  }
});

test.describe("Cuando un visitante abre una tienda", () => {
  test("Entonces la de Hazlo Sano ya lista lo que tenía vendedor", async ({
    page,
  }) => {
    const storePage = new StorePage(page);

    await storePage.goto(HAZLO_SANO.handle);

    await storePage.expectName(HAZLO_SANO.name);
    // Los 13 productos ya traían `seller_id`: la página los muestra sin migrar ningún dato.
    await storePage.expectListed("Suero natural");
    await storePage.expectListed("Jugo Verde");
  });

  test("Entonces una dirección que no existe responde 404", async ({
    page,
  }) => {
    const storePage = new StorePage(page);

    const status = await storePage.goto("no-existe");

    expect(status).toBe(404);
  });
});
