import { expect, type Page, test } from "@playwright/test";
import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import PublishProductPage from "../publishProduct/PublishProductPage";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { readPostRowBySlug } from "../testUtils/readPostRow";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testPost, testSlug } from "../testUtils/testSlug";

/**
 * Slice 8 de `docs/features/commerce/004-2026-09-03-inventario-de-existencias.md`: las existencias
 * al publicar y al editar. Escenarios en `inventario.feature`.
 *
 * `seedPost` publica con la cuenta de la suite, y la misma sesión lo edita.
 */
let dbSession: DbSession | undefined;
let miel: { title: string; slug: string };

async function setStock(
  slug: string,
  stockQuantity: number | null,
  isAvailable = true,
): Promise<void> {
  await db.execute(sql`
    UPDATE posts SET stock_quantity = ${stockQuantity}, is_available = ${isAvailable}
    WHERE id IN (SELECT post_id FROM post_translations WHERE slug = ${slug})
  `);
}

async function editStock(page: Page, value: string): Promise<void> {
  await page.goto(`/editar/${miel.slug}`);
  await page.getByLabel(/existencias/i).fill(value);
  await page.getByRole("button", { name: /guardar cambios/i }).click();
}

test.beforeEach(async ({ page, browserName }) => {
  miel = {
    title: `E2E Miel de abeja 500 g ${Date.now()}`,
    slug: testSlug("miel-existencias"),
  };
  await seedPost({
    ...miel,
    kind: "producto",
    origin: "productor",
    price: 180,
  });
  dbSession = await simulateLogin(page, browserName);
});

test.afterEach(async () => {
  await deleteOnePostBySlug(miel.slug);
  if (dbSession?.id) await deleteSession(dbSession.id);
});

test.describe("Las existencias al editar", () => {
  for (const { antes, escribo, despues, disponible } of [
    { antes: 5, escribo: "12", despues: 12, disponible: true },
    { antes: 5, escribo: "0", despues: 0, disponible: false },
    /* Vacío deja de contar, y la disponibilidad se queda como estaba. */
    { antes: 5, escribo: "", despues: null, disponible: true },
    { antes: null, escribo: "3", despues: 3, disponible: true },
  ]) {
    test(`El vendedor cambia las existencias al editar: ${antes ?? "nulo"} → «${escribo}»`, async ({
      page,
    }) => {
      await setStock(miel.slug, antes);

      await editStock(page, escribo);
      await page.waitForURL(`/${miel.slug}`);

      const row = await readPostRowBySlug(miel.slug);
      expect(row?.stock_quantity).toBe(despues);
      expect(row?.is_available).toBe(disponible);
    });
  }

  test("Un número inválido no se guarda", async ({ page }) => {
    await setStock(miel.slug, 5);

    await editStock(page, "-2");

    await expect(
      page.getByText(/número entero de cero o más/i).first(),
    ).toBeVisible();
    expect((await readPostRowBySlug(miel.slug))?.stock_quantity).toBe(5);
  });
});

test.describe("Las existencias al publicar", () => {
  const { title, slug } = testPost("Miel de abeja con existencias");

  test.afterEach(async () => {
    await deleteOnePostBySlug(slug);
  });

  test("Un producto nuevo se publica con existencias", async ({ page }) => {
    const publishPage = new PublishProductPage(page);

    await publishPage.stubStorageUpload();
    await publishPage.goto();
    await publishPage.fill({
      title,
      description:
        "Miel multiflora de la sierra, cosechada a mano. Frasco de vidrio de medio kilo.",
      price: "180",
      phone: "2781092116",
      file: "./src/e2e/dummies/post.jpg",
      kind: "producto",
      origin: "productor",
      stockQuantity: "10",
    });
    await publishPage.submit();
    await page.waitForURL(`/${slug}`);

    const row = await readPostRowBySlug(slug);
    expect(row?.stock_quantity).toBe(10);
    expect(row?.is_available).toBe(true);
  });
});
