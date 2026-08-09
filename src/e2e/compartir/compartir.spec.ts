import { expect, test } from "@playwright/test";
import ProfilePage from "../sellerStore/ProfilePage";
import SellerAccountPage from "../sellerStore/SellerAccountPage";
import { releaseUsername } from "../testUtils/claimTestUsername";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug, testStore } from "../testUtils/testSlug";
import SharePanel, { withoutNativeShare } from "./SharePanel";

// Slice 1 de docs/features/compartir-y-cuenta.md.
// La tienda y la dirección personal se siembran con prefijo `e2e-`: la tienda real de la base
// ("Hazlo Sano", de `jaime-cervantes`) es de una persona, y la suite no escribe sobre ella.

test.describe("Cuando una vendedora reparte su tienda", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería La Luz");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
    await withoutNativeShare(page);

    const account = new SellerAccountPage(page);
    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);
  });

  test.afterEach(async () => {
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces WhatsApp lleva su dirección y el nombre de su tienda", async ({
    page,
  }) => {
    const share = new SharePanel(page, "share-store");

    await share.open();

    await share.expectTargetCarries("whatsapp", {
      path: `/tienda/${store.handle}`,
      text: store.name,
    });
  });

  /* Facebook compone la publicación con las etiquetas Open Graph del destino y descarta cualquier
     texto que se le mande, así que solo tiene que llevar la dirección. */
  test("Entonces Facebook lleva la dirección, y sola", async ({ page }) => {
    const share = new SharePanel(page, "share-store");

    await share.open();

    await share.expectTargetCarries("facebook", {
      path: `/tienda/${store.handle}`,
    });

    const href = await page.getByTestId("share-facebook").getAttribute("href");
    expect(href).not.toContain(encodeURIComponent(store.name));
  });

  test("Entonces copiar el enlace lo deja en el portapapeles y lo confirma", async ({
    page,
  }) => {
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);

    const share = new SharePanel(page, "share-store");

    await share.open();
    await share.copyLink();

    await share.expectCopyConfirmed();
    expect(await share.readClipboard()).toContain(`/tienda/${store.handle}`);
  });
});

test.describe("Cuando alguien reparte su dirección personal", () => {
  let dbSession: DbSession | undefined;
  const username = testSlug("comparte");

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
    await withoutNativeShare(page);
  });

  test.afterEach(async () => {
    await releaseUsername(username);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces se comparte igual que la tienda", async ({ page }) => {
    const profile = new ProfilePage(page);

    await profile.gotoAccount();
    await profile.claim(username);
    await profile.expectClaimed(username);

    const share = new SharePanel(page, "share-profile");

    await share.open();

    await share.expectTargetCarries("whatsapp", { path: `/u/${username}` });
  });
});
