import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import {
  deleteTestOutreachChannels,
  outreachChannelsTableExists,
  readOutreachPublications,
  seedOutreachChannel,
  seedOutreachPublication,
} from "../testUtils/outreachChannels";
import {
  deleteTestOutreachFooters,
  deleteTestOutreachTexts,
  outreachFootersTableExists,
  outreachTablesExist,
  seedOutreachFooter,
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
import { breadcrumbLink, readBreadcrumbs } from "./breadcrumbs";
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
import OutreachFooters from "./OutreachFooters";
import OutreachGroups from "./OutreachGroups";

/**
 * Slices 1 a 4 de `difusionEnGrupos.feature`: la publicación para grupos normales, los artículos
 * de compraventa que salen de ella, los grupos con el historial de dónde quedó cada cosa, y el ritmo
 * entre ellos.
 *
 * Nada de esto publica en Facebook —ninguna app puede ya—: se comprueba que el texto que se copia
 * es exactamente el que anuncia lo que hay hoy, al precio de hoy.
 */
const ADMIN_EMAIL = (process.env.HAZLO_SANO_ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)[0];

const t = es.outreach;

/** «Última vez aquí: hoy» y «…: nunca», como los escribe la página. */
const LAST_TODAY = t.lastPublished.replace("{when}", "hoy");
const LAST_NEVER = t.lastPublished.replace("{when}", t.whenNever);

/**
 * Un grupo de prueba con el marcador en el nombre, para que el barrido lo encuentre. La dirección es
 * inventada pero con la forma de una de verdad: nadie la abre, solo se compara.
 */
async function seedGroup(
  name: string,
  format: "post" | "listing",
): Promise<{ id: string; name: string; url: string }> {
  const testName = testOutreachName(name);
  const url = `https://www.facebook.com/groups/e2e-${testName.replace(/\W+/g, "-").toLowerCase()}`;
  const id = await seedOutreachChannel({
    name: testName,
    url,
    format,
    minDaysBetween: 7,
    notes: "",
  });

  return { id, name: testName, url };
}

test.describe("Difusión en grupos de Facebook", () => {
  const sessions: DbSession[] = [];
  const seeded: string[] = [];
  let breads: SeededBread[] = [];

  /* El kit lee los grupos y el historial desde el slice 3: sin la 0061 no se pinta ni el texto. */
  test.beforeAll(async () => {
    test.skip(
      !(await outreachTablesExist()) ||
        !(await outreachChannelsTableExists()) ||
        !(await outreachFootersTableExists()),
      "Las migraciones 0060 a 0062 de hazlo-sano-bot no están aplicadas en esta base",
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
    await deleteTestOutreachChannels();
    await deleteTestOutreachFooters();

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

  // --- Slice 3: los grupos y dónde quedó publicada ---------------------------------------

  test("Doy de alta un grupo con su tipo y su ritmo", async ({ page }) => {
    const groups = new OutreachGroups(page);
    const name = testOutreachName("Compra Venta Orizaba");
    const url = "https://www.facebook.com/groups/compraventaorizaba";

    await groups.openNew();
    await groups.fill({
      name,
      url,
      format: "listing",
      minDaysBetween: 7,
      notes: "Solo los sábados, con foto y precio",
    });
    await groups.save();

    await expect(groups.summary(name)).toHaveText("Compraventa · cada 7 días");
    await expect(groups.link(name)).toHaveAttribute("href", url);
    await expect(groups.link(name)).toHaveAttribute("target", "_blank");
  });

  test("El tipo del grupo decide en qué formato se ofrece", async ({
    page,
  }) => {
    const mamas = await seedGroup("Mamás de Orizaba", "post");
    const compraventa = await seedGroup("Compra Venta Orizaba", "listing");
    const admin = new OutreachAdmin(page);

    await admin.open(await seedMasaMadreText(breads));

    await expect(
      admin.channelLink(admin.groupPost(), mamas.name),
    ).toHaveAttribute("href", mamas.url);
    await expect(
      admin.channelLink(admin.listings(), compraventa.name),
    ).toHaveAttribute("href", compraventa.url);
    // Y no al revés: cada grupo aparece solo junto al formato que acepta.
    await expect(
      admin.channelLink(admin.groupPost(), compraventa.name),
    ).toHaveCount(0);
    await expect(admin.channelLink(admin.listings(), mamas.name)).toHaveCount(
      0,
    );
  });

  test("Marco en qué grupos normales quedó publicada, varios a la vez", async ({
    page,
  }) => {
    const mamas = await seedGroup("Mamás de Orizaba", "post");
    const emprendedores = await seedGroup("Emprendedores de Orizaba", "post");
    const id = await seedMasaMadreText(breads);
    const admin = new OutreachAdmin(page);
    await admin.open(id);
    await expect(admin.postChannelLast(mamas.name)).toHaveText(LAST_NEVER);

    await admin.markPostPublished([mamas.name, emprendedores.name]);

    for (const group of [mamas, emprendedores]) {
      await expect(admin.postChannelLast(group.name)).toHaveText(LAST_TODAY);
    }
    expect(await readOutreachPublications(id)).toEqual(
      expect.arrayContaining([
        { channelId: mamas.id, postId: null },
        { channelId: emprendedores.id, postId: null },
      ]),
    );
    expect(await readOutreachPublications(id)).toHaveLength(2);
  });

  test("Marco un artículo publicado en los grupos de compraventa que elegí en Facebook", async ({
    page,
  }) => {
    const compraventa = await seedGroup("Compra Venta Orizaba", "listing");
    const cordoba = await seedGroup("Vendo y Compro Córdoba", "listing");
    const chocolate = breadOf(breads, "chocolate");
    const natural = breadOf(breads, "natural");
    const admin = new OutreachAdmin(page);
    await admin.open(await seedMasaMadreText(breads));

    await admin.markListingPublished(chocolate.title, [
      compraventa.name,
      cordoba.name,
    ]);

    for (const group of [compraventa, cordoba]) {
      await expect(
        admin.listingChannelLast(chocolate.title, group.name),
      ).toHaveText(LAST_TODAY);
      await expect(
        admin.listingChannelLast(natural.title, group.name),
      ).toHaveText(LAST_NEVER);
    }
  });
  // --- Slice 3.1: migas de pan -------------------------------------------------------------

  test("Las migas de pan dicen dónde estoy y me suben un nivel", async ({
    page,
  }) => {
    const name = testOutreachName("Masa madre");
    const admin = new OutreachAdmin(page);
    await admin.open(await seedMasaMadreText(breads, name));

    expect(await readBreadcrumbs(page)).toBe(
      `${es.common.home} / ${t.listHeading} / ${name}`,
    );

    await breadcrumbLink(page, t.listHeading).click();

    await expect(page).toHaveURL(/\/admin\/difusion$/);
    await expect(
      page.getByRole("heading", { level: 1, name: t.listHeading }),
    ).toBeVisible();
  });

  test("Desde el alta de un grupo vuelvo a la lista de grupos", async ({
    page,
  }) => {
    await new OutreachGroups(page).openNew();

    expect(await readBreadcrumbs(page)).toBe(
      `${es.common.home} / ${t.listHeading} / ${t.groupsHeading} / ${t.newGroup}`,
    );

    await breadcrumbLink(page, t.groupsHeading).click();

    await expect(page).toHaveURL(/\/admin\/difusion\/grupos$/);
    await expect(
      page.getByRole("heading", { level: 1, name: t.groupsHeading }),
    ).toBeVisible();
  });

  // --- Slice 4: el ritmo -----------------------------------------------------------------

  test("Me dice a qué grupos ya les toca", async ({ page }) => {
    const mamas = await seedGroup("Mamás de Orizaba", "post");
    const emprendedores = await seedGroup("Emprendedores de Orizaba", "post");
    const id = await seedMasaMadreText(breads);
    await seedOutreachPublication({
      outreachTextId: id,
      channelId: mamas.id,
      postId: null,
      publishedAt: daysAgo(3),
    });
    await seedOutreachPublication({
      outreachTextId: id,
      channelId: emprendedores.id,
      postId: null,
      publishedAt: daysAgo(8),
    });
    const admin = new OutreachAdmin(page);

    await admin.open(id);

    await expect(admin.channelTurn(admin.groupPost(), mamas.name)).toHaveText(
      "Todavía no: en 4 días",
    );
    await expect(
      admin.channelTurn(admin.groupPost(), emprendedores.name),
    ).toHaveText(t.turnDue);
  });

  test("En compraventa me sugiere qué pan toca hoy en cada grupo", async ({
    page,
  }) => {
    const compraventa = await seedGroup("Compra Venta Orizaba", "listing");
    const id = await seedMasaMadreText(breads);
    for (const [key, days] of [
      ["natural", 2],
      ["semillas", 1],
    ] as const) {
      await seedOutreachPublication({
        outreachTextId: id,
        channelId: compraventa.id,
        postId: breadOf(breads, key).postId,
        publishedAt: daysAgo(days),
      });
    }
    const admin = new OutreachAdmin(page);

    await admin.open(id);

    await expect(admin.channelSuggestion(compraventa.name)).toHaveText(
      `Hoy toca: ${breadOf(breads, "arandanos").title}`,
    );
  });

  /* El conteo es de todo lo de hoy en la base compartida, incluidas las publicaciones reales que
     alguien haya marcado: por eso se afirma «10 o más de 10», no «exactamente 10». */
  test("Me avisa al llegar al tope del día, sin impedirme publicar", async ({
    page,
  }) => {
    const mamas = await seedGroup("Mamás de Orizaba", "post");
    const id = await seedMasaMadreText(breads);
    for (let i = 0; i < 10; i++) {
      await seedOutreachPublication({
        outreachTextId: id,
        channelId: mamas.id,
        postId: null,
        publishedAt: new Date(),
      });
    }
    const admin = new OutreachAdmin(page);

    await admin.open(id);

    await expect(admin.dailyPace()).toHaveText(
      /^Hoy ya llevas (1\d|[2-9]\d|\d{3,}) de 10\. .*mejor sigue mañana\.$/,
    );
    await expect(admin.markPostButton()).toBeEnabled();
  });

  // --- Slice 4.1: la pausa entre publicaciones -------------------------------------------

  /* El servidor de la suite corre sin `OUTREACH_PAUSE_MINUTES`, así que la pausa es la de omisión:
     10 minutos. Lo marcado se siembra justo antes de abrir, para que sea lo último de la base. */
  test("Me sugiere una pausa después de publicar", async ({ page }) => {
    const mamas = await seedGroup("Mamás de Orizaba", "post");
    const id = await seedMasaMadreText(breads);
    await seedOutreachPublication({
      outreachTextId: id,
      channelId: mamas.id,
      postId: null,
      publishedAt: new Date(),
    });
    const admin = new OutreachAdmin(page);

    await admin.open(id);

    await expect(admin.pauseNotice()).toHaveText(
      "Acabas de publicar: espera unos 10 minutos antes de la siguiente.",
    );
    await expect(admin.markPostButton()).toBeEnabled();
  });

  // --- Slice 5: el pie compartido y las versiones -----------------------------------------

  test("El pie es uno para todas las publicaciones que lo llevan", async ({
    page,
  }) => {
    const ubicacion = "📍 Ubicación: https://maps.app.goo.gl/rp6RjiBQniCgKmbr8";
    const footerId = await seedOutreachFooter({
      name: testOutreachName("Hazlo Sano"),
      body: `${ubicacion}\n📲 Pedidos WhatsApp: https://wa.me/522781126948`,
    });
    const ids = [
      await seedMasaMadreText(breads, testOutreachName("Masa madre"), {
        footerId,
      }),
      await seedMasaMadreText(
        breads,
        testOutreachName("Masa madre de temporada"),
        { footerId },
      ),
    ];
    const nuevo = `${ubicacion}\n📲 Pedidos WhatsApp: https://wa.me/522781000000`;
    const footers = new OutreachFooters(page);

    await footers.openEdit(footerId);
    await footers.replaceBody(nuevo);
    await footers.save();

    const admin = new OutreachAdmin(page);
    // El final del texto, con su renglón vacío delante: el pie va al último, como su propio párrafo.
    const ending = `\n\n${nuevo}`;
    for (const id of ids) {
      await admin.open(id);
      expect((await admin.readText()).slice(-ending.length)).toBe(ending);
    }
  });

  /* Los dos grupos de prueba llevan el marcador «E2E » y quedan juntos en la lista, que va por
     nombre: grupos vecinos reciben versiones distintas el mismo día. */
  test("Las versiones del texto se turnan entre grupos", async ({ page }) => {
    const mamas = await seedGroup("Mamás de Orizaba", "post");
    const emprendedores = await seedGroup("Emprendedores de Orizaba", "post");
    const id = await seedMasaMadreText(breads, undefined, {
      versions: ["Masa madre de verdad, hecha aquí. Pasa por el tuyo:"],
    });
    const admin = new OutreachAdmin(page);

    await admin.open(id);

    await expect(admin.versionTexts()).toHaveCount(2);
    for (const n of [1, 2]) {
      await expect(
        admin.groupPost().getByRole("button", { name: `Copiar versión ${n}` }),
      ).toBeVisible();
    }
    const turns = [
      await admin.versionTurn(mamas.name).textContent(),
      await admin.versionTurn(emprendedores.name).textContent(),
    ].sort();
    expect(turns).toEqual(["Le toca la versión 1", "Le toca la versión 2"]);
  });
});

/** Hace tantos días, a esta misma hora: los turnos se cuentan en días de calendario. */
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}
