import { test, expect } from "@playwright/test";
import UnifiedCatalogPage from "./UnifiedCatalogPage";
import {
  simulateLogin,
  deleteSession,
  type DbSession,
} from "../testUtils/simulateLogin";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { readPostRowBySlug } from "../testUtils/readPostRow";

// Slice 1 de docs/features/catalogo-unificado.md — esquema unificado y categoría al publicar.
// Escenarios en src/e2e/unifiedCatalog/unifiedCatalog.feature.
const adminEmail = (process.env.HAZLO_SANO_ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)[0];

const stamp = Date.now();
const publishedSlug = `jugo-verde-${stamp}`;
const seededWithoutCategorySlug = `pan-de-masa-madre-natural-${stamp}`;

test.describe("When a product is published with a category", () => {
  // El navegador de Playwright pide `en-US` por defecto y next-intl detecta el idioma: la URL
  // sin prefijo se serviría en inglés. Un visitante hispanohablante es lo que describe el
  // escenario, así que el contexto declara su idioma en vez de asumirlo.
  test.use({ locale: "es-MX" });

  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(!adminEmail, "HAZLO_SANO_ADMIN_EMAILS is not configured");
    dbSession = await simulateLogin(page, browserName, { email: adminEmail });
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(publishedSlug);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Then the detail shows its label, and in English it reads Juices", async ({
    page,
  }) => {
    const publishPage = new UnifiedCatalogPage(page);

    await publishPage.stubStorageUpload();
    await publishPage.goto();
    await publishPage.fill({
      title: `Jugo Verde ${stamp}`,
      description: "Espinaca, apio, pepino y limón. Sin azúcar añadida.",
      price: "40",
      phone: "2781126948",
      file: "./src/e2e/dummies/post.jpg",
      kind: "producto",
      origin: "hazlo_sano_propio",
      category: "alimentacion",
      subCategory: "jugos",
    });
    await publishPage.submit();

    await page.waitForURL(`/${publishedSlug}`);
    await expect(publishPage.categoryTag()).toHaveText("Jugos");

    // Escenario: "The label follows the visitor's locale, never the database".
    // localePrefix es 'as-needed', así que el inglés vive bajo /en.
    await page.goto(`/en/${publishedSlug}`);
    await expect(publishPage.categoryTag()).toHaveText("Juices");

    const row = await readPostRowBySlug(publishedSlug);
    expect(row?.category).toBe("alimentacion");
    expect(row?.sub_category).toBe("jugos");
    expect(row?.is_available).toBe(true);
  });

  test("Then the category selectors only exist for a product", async ({ page }) => {
    const publishPage = new UnifiedCatalogPage(page);

    await publishPage.goto();
    await publishPage.expectCategorySelectorsHidden();

    await page
      .getByRole("combobox", { name: /tipo de publicación/i })
      .selectOption("producto");

    await expect(
      page.getByRole("combobox", { name: /^categoría/i }),
    ).toBeVisible();
  });
});

test.describe("When a publication has no category", () => {
  test.beforeEach(async () => {
    await seedPost({
      title: `Pan de Masa Madre Natural ${stamp}`,
      slug: seededWithoutCategorySlug,
      kind: "producto",
      origin: "hazlo_sano_propio",
      price: 96,
    });
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(seededWithoutCategorySlug);
  });

  test("Then its card is listed with no category label", async ({ page }) => {
    await page.goto("/productos");

    const card = page
      .getByRole("article")
      .filter({ hasText: `Pan de Masa Madre Natural ${stamp}` });

    await expect(card).toBeVisible();
    await expect(card.getByTestId("category-tag")).toHaveCount(0);
  });

  // Corrida de escritorio del escenario "Publications created before the unified schema
  // keep working": los campos nuevos quedan en su valor por defecto, no rompen nada.
  test("Then the new columns keep their defaults", async () => {
    const row = await readPostRowBySlug(seededWithoutCategorySlug);

    expect(row).not.toBeNull();
    expect(row?.kind).toBe("producto");
    expect(row?.is_available).toBe(true);
    expect(row?.category).toBeNull();
    expect(row?.sub_category).toBeNull();
    expect(row?.seller_id).toBeNull();
    expect(row?.external_url).toBeNull();
  });
});
