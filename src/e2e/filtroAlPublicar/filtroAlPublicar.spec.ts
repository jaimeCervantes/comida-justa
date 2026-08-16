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
 * Slice 1 de `docs/features/filtro-al-publicar.md`: el interruptor.
 *
 * Sin IA todavía. Lo que se prueba es que un admin pueda bajar algo desde la web y que eso
 * desaparezca de TODAS las lecturas —que son nueve— y no solo del feed. El escenario del `.feature`
 * lleva una tabla con las nueve superficies justamente porque olvidar una es el fallo probable.
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
    const panel = new ModerationPanelPage(page);

    // Nace publicada: la migración no cambia lo que le pasa a quien publica.
    await expect
      .poll(async () => (await readPostRowBySlug(slug))?.moderation_status)
      .toBe("published");

    await panel.goto();
    await panel.expectVisible();
    await panel.reject(postId, "off_topic");

    const row = await readPostRowBySlug(slug);
    expect(row?.moderation_status).toBe("rejected");
    expect(row?.moderation_reason).toBe("off_topic");

    /* El bot no conoce `moderation_status`: consulta `kind = 'producto' AND is_available`. Bajar un
       producto tiene que apagarle ese interruptor o lo seguiría ofreciendo. */
    expect(row?.is_available).toBe(false);

    // La búsqueda por texto ya no la encuentra.
    await page.goto(`/buscar?q=${encodeURIComponent("Dona Chocolate Keto")}`);
    await expect(
      page.getByRole("link", { name: /Dona Chocolate Keto/i }),
    ).toHaveCount(0);

    // El sitemap tampoco la publica.
    const sitemap = await page.request.get("/sitemap.xml");
    expect(await sitemap.text()).not.toContain(slug);
  });

  test("Then a visitor gets a 404 but its owner still sees it, with the reason", async ({
    page,
    browserName,
  }) => {
    const panel = new ModerationPanelPage(page);

    await panel.goto();
    await panel.reject(postId, "off_topic");

    // El admin la sigue viendo: es quien decide, y necesita poder mirarla.
    await page.goto(`/${slug}`);
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

  test("Then approving it puts it back everywhere", async ({ page }) => {
    const panel = new ModerationPanelPage(page);

    await panel.goto();
    await panel.reject(postId, "spam");
    await panel.goto();
    await panel.approve(postId);

    const row = await readPostRowBySlug(slug);
    expect(row?.moderation_status).toBe("published");
    expect(row?.moderation_reason).toBeNull();
    // Restituir vuelve a ofrecerlo al bot; si no, seguiría mudo sin que nadie entienda por qué.
    expect(row?.is_available).toBe(true);

    await page.goto(`/${slug}`);
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
