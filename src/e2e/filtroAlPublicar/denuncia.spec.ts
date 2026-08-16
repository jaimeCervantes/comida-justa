import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { readPostRowBySlug } from "../testUtils/readPostRow";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { SUITE_ACCOUNT_EMAIL } from "../testUtils/suiteAccount";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slice 3 de `docs/features/filtro-al-publicar.md`: la denuncia de la comunidad.
 *
 * Lo que atrapa lo que el clasificador dejó pasar. La regla que decide el slice, y la que estos
 * escenarios protegen, es que **denunciar avisa pero no oculta**: si una denuncia bajara la
 * publicación, el botón sería un arma con la que cualquiera podría vaciar el catálogo.
 *
 * **Quien denuncia tiene que ser OTRA persona que quien publicó**, porque nadie se denuncia a sí
 * mismo. `seedPost` siembra siempre con la cuenta de la suite, así que el denunciante entra con la
 * de admin — que es la única segunda identidad que la suite tiene a mano.
 */
const adminEmail = (process.env.HAZLO_SANO_ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)[0];

/** Si admin y suite fueran la misma cuenta, el escenario no tendría dos personas que enfrentar. */
const hasTwoIdentities =
  Boolean(adminEmail) &&
  adminEmail.toLowerCase() !== SUITE_ACCOUNT_EMAIL.toLowerCase();

test.describe("When someone from the community reports a publication", () => {
  const slug = testSlug("jugo-verde-denunciable");
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(
      !hasTwoIdentities,
      "necesita una cuenta admin distinta de la de la suite",
    );

    await seedPost({
      title: "Jugo Verde denunciable",
      slug,
      kind: "producto",
      origin: "hazlo_sano_propio",
      price: 45,
    });

    // La publicación es de la cuenta de la suite; quien denuncia es otra persona.
    dbSession = await simulateLogin(page, browserName, { email: adminEmail });
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(slug);
    if (dbSession?.id) await deleteSession(dbSession.id);
    dbSession = undefined;
  });

  test("Then the post stays visible, and only the panel learns about it", async ({
    page,
  }) => {
    await page.goto(`/${slug}`);
    await page.getByTestId("report-reason").selectOption("spam");
    await page.getByTestId("report-submit").click();

    // Acuse de recibo: sin él, quien pulsa no sabría si su aviso llegó.
    await expect(page.getByTestId("report-done")).toBeVisible();

    /* Lo que decide el slice: la publicación NO se movió. Sigue publicada y sigue a la vista. */
    const row = await readPostRowBySlug(slug);
    expect(row?.moderation_status).toBe("published");
    expect(row?.is_available).toBe(true);

    await page.goto(`/${slug}`);
    await expect(page.getByTestId("moderation-notice")).toHaveCount(0);
  });

  test("Then the panel shows it with its count, and says it is still published", async ({
    page,
  }) => {
    await page.goto(`/${slug}`);
    await page.getByTestId("report-reason").selectOption("off_topic");
    await page.getByTestId("report-submit").click();
    await expect(page.getByTestId("report-done")).toBeVisible();

    const postId = String((await readPostRowBySlug(slug))?.id ?? "");

    await page.goto("/admin/moderacion");

    await expect(page.getByTestId(`moderation-row-${postId}`)).toBeVisible();
    await expect(
      page.getByTestId(`moderation-reports-${postId}`),
    ).toContainText("1");
    /* Y dice la verdad sobre su estado: sigue publicada, no "en revisión". */
    await expect(page.getByTestId(`moderation-status-${postId}`)).toHaveText(
      "Publicada",
    );
  });

  /* Es lo que hace que la cuenta signifique "cuánta gente distinta", que es todo lo que aporta. */
  test("Then reporting twice does not count twice", async ({ page }) => {
    await page.goto(`/${slug}`);
    await page.getByTestId("report-reason").selectOption("spam");
    await page.getByTestId("report-submit").click();
    await expect(page.getByTestId("report-done")).toBeVisible();

    await page.goto(`/${slug}`);
    await page.getByTestId("report-reason").selectOption("offensive");
    await page.getByTestId("report-submit").click();
    await expect(page.getByTestId("report-done")).toBeVisible();

    expect(await countReports(slug)).toBe(1);
  });
});

test.describe("When the one looking is the author", () => {
  const slug = testSlug("jugo-verde-propio");
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    await seedPost({
      title: "Jugo Verde propio",
      slug,
      kind: "producto",
      origin: "hazlo_sano_propio",
      price: 45,
    });

    // Sin correo se entra con la cuenta de la suite, que es la que sembró: o sea, su autor.
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(slug);
    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  /* Denunciarse a uno mismo no es un aviso; quien quiera bajar lo suyo lo edita o lo borra. */
  test("Then no report button is offered", async ({ page }) => {
    await page.goto(`/${slug}`);

    await expect(page.getByTestId("report-form")).toHaveCount(0);
  });
});

test.describe("When nobody is signed in", () => {
  const slug = testSlug("suero-natural-anonimo");

  test.beforeEach(async () => {
    await seedPost({
      title: "Suero natural anónimo",
      slug,
      kind: "producto",
      origin: "hazlo_sano_propio",
      price: 35,
    });
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(slug);
  });

  /* Sin identidad no hay a qué aplicarle el "una por persona", y la cuenta dejaría de significar
     cuánta gente distinta avisó. */
  test("Then no report button is offered", async ({ page }) => {
    await page.goto(`/${slug}`);

    await expect(page.getByTestId("report-form")).toHaveCount(0);
  });
});

async function countReports(slug: string): Promise<number> {
  const { db } = await import("~/infra/dataAccess/db/connection");
  const { sql } = await import("drizzle-orm");

  const result = await db.execute(sql`
    SELECT COUNT(*)::int AS n
    FROM post_reports r
    JOIN post_translations t ON t.post_id = r.post_id
    WHERE t.slug = ${slug}
  `);

  return Number((result.rows[0] as { n: number }).n);
}
