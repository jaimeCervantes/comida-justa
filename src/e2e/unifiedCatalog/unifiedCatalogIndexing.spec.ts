import { expect, test } from "@playwright/test";
import { EMBEDDING_DIMENSIONS } from "~/domain/entities/post/embedding";
import {
  createIndexPostEmbeddingUseCase,
  createPostEmbeddingRepository,
} from "~/infra/dataAccess/indexPostEmbedding/factory";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import {
  chatbotFindsPostBySlug,
  clearEmbeddingBySlug,
  readEmbeddingBySlug,
} from "../testUtils/readEmbedding";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testPost } from "../testUtils/testSlug";
import UnifiedCatalogPage from "./UnifiedCatalogPage";

// Slice 4 de docs/features/catalogo-unificado.md — embedding al publicar desde el sitio.
// Escenarios en src/e2e/unifiedCatalog/unifiedCatalog.feature.
const adminEmail = (process.env.HAZLO_SANO_ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)[0];

const published = testPost("Suero natural");
const publishedSlug = published.slug;
const pending = testPost("Electrolitos de frutos rojos");
const pendingSlug = pending.slug;

/**
 * El embedding se genera en `after()`, es decir después de que la respuesta salió: en el momento
 * del redirect la columna todavía está en null a propósito. Se espera a que aparezca en vez de
 * asumir un tiempo fijo.
 */
async function waitForEmbedding(slug: string, timeoutMs = 30_000) {
  await expect
    .poll(async () => (await readEmbeddingBySlug(slug))?.dimensions ?? null, {
      timeout: timeoutMs,
      intervals: [500, 1000, 2000],
      message: `la traducción "${slug}" nunca recibió su vector`,
    })
    .toBe(EMBEDDING_DIMENSIONS);
}

test.describe("When a product is published from the website", () => {
  test.use({ locale: "es-MX" });

  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(!adminEmail, "HAZLO_SANO_ADMIN_EMAILS is not configured");
    test.skip(!process.env.GEMINI_API_KEY, "GEMINI_API_KEY is not configured");
    dbSession = await simulateLogin(page, browserName, { email: adminEmail });
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(publishedSlug);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Then its embedding lands after the response, and the chatbot can find it", async ({
    page,
  }) => {
    const publishPage = new UnifiedCatalogPage(page);

    await publishPage.stubStorageUpload();
    await publishPage.goto();
    await publishPage.fill({
      title: published.title,
      description:
        "Agua, limón, sal de mar y un toque de miel. Sin colorantes.",
      price: "35",
      phone: "2781126948",
      file: "./src/e2e/dummies/post.jpg",
      kind: "producto",
      origin: "hazlo_sano_propio",
      category: "alimentacion",
      subCategory: "bebidas",
    });
    await publishPage.submit();

    // El redirect no espera al proveedor: la publicación ya existe cuando se ve el detalle.
    await page.waitForURL(`/${publishedSlug}`);
    expect(await readEmbeddingBySlug(publishedSlug)).not.toBeNull();

    await waitForEmbedding(publishedSlug);

    // La misma función SQL que consume el bot, con el vector recién guardado.
    expect(await chatbotFindsPostBySlug(publishedSlug)).toBe(true);
  });
});

test.describe("When a publication was left pending because the provider failed", () => {
  test.beforeEach(async () => {
    test.skip(!process.env.GEMINI_API_KEY, "GEMINI_API_KEY is not configured");
    await seedPost({
      title: pending.title,
      slug: pendingSlug,
      kind: "producto",
      origin: "hazlo_sano_propio",
      price: 35,
      category: "alimentacion",
      subCategory: "bebidas",
    });
    // `seedPost` escribe por el repositorio, que no indexa: es exactamente el estado que deja
    // un publicar con Gemini caído.
    await clearEmbeddingBySlug(pendingSlug);
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(pendingSlug);
  });

  test("Then the backfill indexes it and it stops being pending", async () => {
    const snapshot = await readEmbeddingBySlug(pendingSlug);

    expect(snapshot).not.toBeNull();
    expect(snapshot?.dimensions).toBeNull();

    const repository = createPostEmbeddingRepository();
    const pendingBefore = await repository.findPendingIndexing(500);
    expect(pendingBefore.map((ref) => ref.postId)).toContain(snapshot?.postId);

    const result = await createIndexPostEmbeddingUseCase().execute({
      postId: snapshot?.postId,
      locale: "es",
    });

    expect(result).toEqual({ indexed: true });
    expect((await readEmbeddingBySlug(pendingSlug))?.dimensions).toBe(
      EMBEDDING_DIMENSIONS,
    );

    const pendingAfter = await repository.findPendingIndexing(500);
    expect(pendingAfter.map((ref) => ref.postId)).not.toContain(
      snapshot?.postId,
    );

    expect(await chatbotFindsPostBySlug(pendingSlug)).toBe(true);
  });
});

test.describe("When an admin opens the products report", () => {
  test.use({ locale: "es-MX" });

  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(!adminEmail, "HAZLO_SANO_ADMIN_EMAILS is not configured");
    dbSession = await simulateLogin(page, browserName, { email: adminEmail });
  });

  test.afterEach(async () => {
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Then the panel names how many products the chatbot cannot see", async ({
    page,
  }) => {
    await page.goto("/admin/productos");

    const panel = page.getByTestId("indexing-status");

    await expect(panel).toBeVisible();
    await expect(page.getByTestId("indexing-count-pending")).toBeVisible();
    await expect(page.getByTestId("indexing-count-indexed")).toBeVisible();
    await expect(page.getByTestId("indexing-coverage")).toBeVisible();
  });
});
