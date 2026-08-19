import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { readPostRowBySlug } from "../testUtils/readPostRow";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug } from "../testUtils/testSlug";
import ModerationPanelPage from "./ModerationPanelPage";

/**
 * Slice 1 de `docs/features/platform/005-2026-08-16-filtro-al-publicar.md`: el interruptor.
 *
 * Sin IA todavía. Lo que se prueba es que un admin pueda bajar algo desde la web y que eso
 * desaparezca de TODAS las lecturas —que son nueve— y no solo del feed.
 *
 * El recorrido tiene dos mitades y la prueba las respeta: se **baja desde la publicación**, que es
 * donde el admin se topa con el problema, y se **restituye desde el panel**, que es la bandeja de
 * lo que ya no está publicado.
 */
const adminEmail = (process.env.HAZLO_SANO_ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)[0];

test.describe("When an admin takes a publication down", () => {
  const slug = testSlug("dona-chocolate-keto");
  let postId = "";
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(!adminEmail, "HAZLO_SANO_ADMIN_EMAILS is not configured");

    postId = await seedPost({
      title: "Dona Chocolate Keto",
      slug,
      kind: "producto",
      origin: "hazlo_sano_propio",
      price: 35,
      category: "alimentacion",
      subCategory: "panaderia",
    });

    dbSession = await simulateLogin(page, browserName, { email: adminEmail });
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(slug);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Then it leaves every listing, and the chatbot switch goes off too", async ({
    page,
  }) => {
    const moderation = new ModerationPanelPage(page);

    // Nace publicada: la migración no cambia lo que le pasa a quien publica.
    expect((await readPostRowBySlug(slug))?.moderation_status).toBe(
      "published",
    );

    await moderation.gotoPost(slug);
    await moderation.rejectFromPost("off_topic");

    /* Se espera al estado en vez de leerlo una vez: `networkidle` puede resolverse con la carga de
       la propia ficha y no con la respuesta de la acción, y entonces la lectura llega antes que la
       escritura. Los otros dos casos no lo notaban porque navegan por el medio. */
    await expect
      .poll(async () => (await readPostRowBySlug(slug))?.moderation_status)
      .toBe("rejected");

    const row = await readPostRowBySlug(slug);
    expect(row?.moderation_reason).toBe("off_topic");

    /* El bot no conoce `moderation_status`: consulta `kind = 'producto' AND is_available`. Bajar un
       producto tiene que apagarle ese interruptor o lo seguiría ofreciendo. */
    expect(row?.is_available).toBe(false);

    /* La búsqueda por texto ya no la encuentra. Se afirma sobre el SLUG y no sobre el título: "Dona
       Chocolate Keto" existe de verdad en el catálogo y sigue publicada, así que buscar por título
       encuentra la real —correctamente— y la aserción se caía por un acierto del código. El slug
       lleva el prefijo de `testSlug`, así que solo puede ser la sembrada. */
    await page.goto(`/buscar?q=${encodeURIComponent("Dona Chocolate Keto")}`);
    await expect(page.locator(`a[href*="${slug}"]`)).toHaveCount(0);

    // El sitemap tampoco la publica.
    const sitemap = await page.request.get("/sitemap.xml");
    expect(await sitemap.text()).not.toContain(slug);
  });

  test("Then a visitor gets a 404 but the notice explains it to whoever can see it", async ({
    page,
    browserName,
  }) => {
    const moderation = new ModerationPanelPage(page);

    await moderation.gotoPost(slug);
    await moderation.rejectFromPost("off_topic");

    // El admin la sigue viendo: es quien decide, y necesita poder mirarla.
    await moderation.gotoPost(slug);
    await expect(page.getByTestId("moderation-notice")).toBeVisible();
    await expect(page.getByTestId("moderation-notice")).toHaveAttribute(
      "data-status",
      "rejected",
    );

    if (dbSession?.id) {
      await deleteSession(dbSession.id);
      dbSession = undefined;
    }
    await page.context().clearCookies();

    const anonymous = await page.goto(`/${slug}`);
    expect(anonymous?.status()).toBe(404);

    dbSession = await simulateLogin(page, browserName, { email: adminEmail });
  });

  test("Then it shows up in the panel, and approving puts it back everywhere", async ({
    page,
  }) => {
    const moderation = new ModerationPanelPage(page);

    await moderation.gotoPost(slug);
    await moderation.rejectFromPost("spam");

    // La bandeja existe justamente para esto: lo bajado, para poder deshacerlo.
    await moderation.gotoPanel();
    await moderation.expectPanelVisible();
    await expect(moderation.row(postId)).toBeVisible();

    await moderation.approveFromPanel(postId);

    const row = await readPostRowBySlug(slug);
    expect(row?.moderation_status).toBe("published");
    expect(row?.moderation_reason).toBeNull();
    // Restituir vuelve a ofrecerlo al bot; si no, seguiría mudo sin que nadie entienda por qué.
    expect(row?.is_available).toBe(true);

    await moderation.gotoPost(slug);
    await expect(page.getByTestId("moderation-notice")).toHaveCount(0);
  });
});

test.describe("When a non-admin opens the moderation panel", () => {
  let dbSession: DbSession | undefined;

  test.afterEach(async () => {
    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  test("Then the page does not exist for them", async ({
    page,
    browserName,
  }) => {
    dbSession = await simulateLogin(page, browserName);

    const response = await page.goto("/admin/moderacion");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("link", { name: "Moderación" })).toHaveCount(0);
  });
});

test.describe("When a non-admin opens someone else's publication", () => {
  const slug = testSlug("suero-natural");
  let dbSession: DbSession | undefined;

  test.beforeEach(async () => {
    await seedPost({
      title: "Suero natural",
      slug,
      kind: "producto",
      origin: "hazlo_sano_propio",
      price: 35,
    });
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(slug);
    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  /* El interruptor no se le ofrece a quien no puede accionarlo. El gate real está en la acción,
     que vuelve a comprobar `isAdmin`; esto es que además no se vea. */
  test("Then no moderation control is offered", async ({
    page,
    browserName,
  }) => {
    dbSession = await simulateLogin(page, browserName);

    await page.goto(`/${slug}`);

    await expect(page.getByTestId("moderation-reject")).toHaveCount(0);
    await expect(page.getByTestId("moderation-reason")).toHaveCount(0);
  });
});
