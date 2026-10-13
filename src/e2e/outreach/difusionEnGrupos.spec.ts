import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import {
  deleteTestOutreachTexts,
  outreachTablesExist,
} from "../testUtils/outreachTexts";
import { readPostMediaBySlug } from "../testUtils/readPostMedia";
import { seedPrice } from "../testUtils/seedPrice";
import { seedStock } from "../testUtils/seedStock";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testOutreachName } from "../testUtils/testSlug";
import {
  breadOf,
  CLOSING,
  EXPECTED_TEXT,
  OPENING,
  type SeededBread,
  seedBreads,
  seedMasaMadreText,
} from "./masaMadre";
import OutreachAdmin from "./OutreachAdmin";

/**
 * Slices 1 y 2 de `difusionEnGrupos.feature`: la publicación para grupos normales y los
 * artículos de compraventa que salen de ella.
 *
 * Nada de esto publica en Facebook —ninguna app puede ya—: se comprueba que el texto que se copia
 * es exactamente el que anuncia lo que hay hoy, al precio de hoy.
 */
const ADMIN_EMAIL = (process.env.HAZLO_SANO_ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)[0];

const t = es.outreach;

test.describe("Difusión en grupos de Facebook", () => {
  const sessions: DbSession[] = [];
  const seeded: string[] = [];
  let breads: SeededBread[] = [];

  test.beforeAll(async () => {
    test.skip(
      !(await outreachTablesExist()),
      "La migración 0060 de hazlo-sano-bot no está aplicada en esta base",
    );
  });

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(!ADMIN_EMAIL, "HAZLO_SANO_ADMIN_EMAILS is not configured");

    breads = await seedBreads(seeded);
    sessions.push(
      await simulateLogin(page, browserName, { email: ADMIN_EMAIL }),
    );
  });

  test.afterEach(async () => {
    await deleteTestOutreachTexts();

    for (const slug of seeded.splice(0)) {
      await deleteOnePostBySlug(slug);
    }

    for (const session of sessions.splice(0)) {
      await deleteSession(session.sessionToken);
    }
  });

  test("Armo la publicación de masa madre y la lista sale de lo que hay", async ({
    page,
  }) => {
    const admin = new OutreachAdmin(page);
    await admin.openNew();
    const form = admin.form(t.newHeading);

    await admin.fillText(form, {
      name: testOutreachName("Masa madre"),
      opening: OPENING,
      closing: CLOSING,
    });
    for (const bread of breads) {
      await admin.addProduct(form, bread);
    }
    await admin.save(form);

    expect(await admin.readText()).toBe(EXPECTED_TEXT);
    await expect(admin.excluded()).toBeHidden();
  });

  test("Copiar deja el texto listo para pegar en Facebook", async ({
    page,
  }) => {
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);
    const admin = new OutreachAdmin(page);
    await admin.open(await seedMasaMadreText(breads));

    await admin.copyButton().click();

    await expect(admin.copyFeedback()).toHaveText(t.copied);
    expect(await admin.readClipboard()).toBe(await admin.readText());
  });

  test("Lo agotado no se anuncia y me dice por qué", async ({ page }) => {
    const id = await seedMasaMadreText(breads);
    await seedStock(breadOf(breads, "canela").slug, 0);
    const admin = new OutreachAdmin(page);

    await admin.open(id);

    expect(await admin.readText()).toContain("🌻 Semillas / Arándanos — $125");
    await expect(admin.excluded()).toContainText(
      `Canela: ${t.reasonOutOfStock}`,
    );
  });

  test("Un precio nuevo llega solo, sin tocar la publicación", async ({
    page,
  }) => {
    const id = await seedMasaMadreText(breads);
    await seedPrice(breadOf(breads, "natural").slug, 100);
    const admin = new OutreachAdmin(page);

    await admin.open(id);

    expect(await admin.readText()).toContain("🌾 Natural — $100");
  });

  test("Si no queda nada que anunciar, no hay qué copiar", async ({ page }) => {
    const id = await seedMasaMadreText(breads);
    for (const bread of breads) {
      await seedStock(bread.slug, 0);
    }
    const admin = new OutreachAdmin(page);

    await admin.open(id);

    await expect(admin.nothingToAnnounce()).toHaveText(t.nothingToAnnounce);
    await expect(admin.copyButton()).toBeHidden();
  });

  test("Corrijo una etiqueta y el texto la toma", async ({ page }) => {
    const id = await seedMasaMadreText(breads);
    const admin = new OutreachAdmin(page);
    await admin.openEdit(id);
    const form = admin.editForm();

    await admin.setItem(form, breadOf(breads, "chocolate").title, {
      label: "Chocolate",
    });
    await admin.save(form);

    expect(await admin.readText()).toContain("🍫 Chocolate — $136");
  });

  // --- Slice 2: artículos de compraventa y fotos ---------------------------------------------

  test("Cada pan disponible es un artículo de compraventa con su precio exacto", async ({
    page,
  }) => {
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);
    const id = await seedMasaMadreText(breads);
    await seedStock(breadOf(breads, "canela").slug, 0);
    const admin = new OutreachAdmin(page);

    await admin.open(id);

    expect(await admin.readListings()).toEqual([
      { title: breadOf(breads, "natural").title, price: "96" },
      { title: breadOf(breads, "semillas").title, price: "125" },
      { title: breadOf(breads, "arandanos").title, price: "125" },
      { title: breadOf(breads, "chocolate").title, price: "136" },
    ]);

    await admin.copyListingDescription();
    expect(await admin.readClipboard()).toBe(await admin.readText());
  });

  test("Copio el título y el precio de un artículo, cada uno por separado", async ({
    page,
  }) => {
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);
    const id = await seedMasaMadreText(breads);
    const chocolate = breadOf(breads, "chocolate");
    const admin = new OutreachAdmin(page);
    await admin.open(id);

    await admin.copyListingTitle(chocolate.title);
    await expect(
      admin.listing(chocolate.title).getByTestId("outreach-copy-feedback"),
    ).toHaveText(t.copiedShort);
    expect(await admin.readClipboard()).toBe(chocolate.title);

    await admin.copyListingPrice(chocolate.title);
    await expect.poll(() => admin.readClipboard()).toBe("136");
  });

  test("Las fotos de cada pan están a la mano para subirlas", async ({
    page,
  }) => {
    const id = await seedMasaMadreText(breads);
    const admin = new OutreachAdmin(page);

    await admin.open(id);

    for (const bread of breads) {
      const stored = await readPostMediaBySlug(bread.slug);
      const links = admin.listingPhotoLinks(bread.title);

      await expect(links).toHaveCount(stored.length);
      for (const [index, media] of stored.entries()) {
        await expect(links.nth(index)).toHaveAttribute("href", media.url);
        await expect(links.nth(index)).toHaveAttribute("target", "_blank");
      }
    }
  });

  test("Quien no es administrador no la encuentra", async ({
    page,
    browserName,
  }) => {
    const id = await seedMasaMadreText(breads);
    // Otra sesión en el mismo navegador: la de la suite, que no está en la lista de admins.
    await page.context().clearCookies();
    sessions.push(await simulateLogin(page, browserName));

    const response = await page.goto(`/admin/difusion/${id}`);

    expect(response?.status()).toBe(404);
    await expect(new OutreachAdmin(page).text()).toBeHidden();
  });
});
