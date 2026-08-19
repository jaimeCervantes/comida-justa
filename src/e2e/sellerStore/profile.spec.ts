import { expect, test } from "@playwright/test";
import {
  claimUsernameFor,
  findAnotherUserId,
  releaseUsername,
} from "../testUtils/claimTestUsername";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug, testStore } from "../testUtils/testSlug";
import ProfilePage from "./ProfilePage";
import SellerAccountPage from "./SellerAccountPage";

// Slice 4 de docs/features/commerce/001-2026-07-31-vendedores-y-tiendas.md.
// El `username` se reclama sobre una cuenta REAL (la suite no crea cuentas), así que lleva el
// prefijo `e2e-` y el barrido lo devuelve a NULL sin borrar a nadie.
// `testSlug` ya lleva su propio contador, así que dos llamadas nunca coinciden.
const testUsername = (name: string): string => testSlug(name);

test.describe("Cuando alguien reserva su dirección personal", () => {
  let dbSession: DbSession | undefined;
  const username = testUsername("perfil");
  const anuncio = {
    title: `E2E Aviso de la comunidad ${Date.now()}`,
    slug: testSlug("aviso-en-mi-perfil"),
    kind: "anuncio" as const,
    origin: null,
  };

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    await releaseUsername(username);
    await deleteOnePostBySlug(anuncio.slug);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces su perfil lista lo suyo, anuncios incluidos", async ({
    page,
  }) => {
    // `seedPost` publica como el mismo usuario que toma `simulateLogin`: el de la sesión.
    await seedPost(anuncio);

    const profile = new ProfilePage(page);

    await profile.gotoAccount();
    await profile.claim(username);
    await profile.expectClaimed(username);

    await profile.goto(username);

    // Un anuncio no es catálogo y aun así aparece: el perfil es la persona, no su tienda.
    await profile.expectPublicationListed(anuncio.title);
  });

  test("Entonces una dirección ya tomada se rechaza", async ({ page }) => {
    const otherUserId = await findAnotherUserId(dbSession?.userId ?? "");
    await claimUsernameFor(otherUserId, username);

    const profile = new ProfilePage(page);

    await profile.gotoAccount();
    await profile.claim(username);

    await profile.expectError(/ya está ocupado/i);
  });
});

test.describe("Cuando un vendedor tiene perfil y tienda", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería La Luz");
  const username = testUsername("panadera");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);

    const account = new SellerAccountPage(page);
    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);
  });

  test.afterEach(async () => {
    await releaseUsername(username);
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces cada página enlaza a la otra", async ({ page }) => {
    const profile = new ProfilePage(page);

    await profile.gotoAccount();
    await profile.claim(username);
    await profile.expectClaimed(username);

    await profile.goto(username);
    await profile.expectStoreLink();

    await page.goto(`/tienda/${store.handle}`);
    await expect(page.getByTestId("store-owner-link")).toBeVisible();
  });
});

test.describe("Cuando un visitante abre un perfil que no existe", () => {
  test("Entonces la respuesta es 404", async ({ page }) => {
    const status = await new ProfilePage(page).goto("no-existe");

    expect(status).toBe(404);
  });
});
