import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { readPostRowBySlug } from "../testUtils/readPostRow";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testPost, testSlug } from "../testUtils/testSlug";
import UnifiedCatalogPage from "./UnifiedCatalogPage";

// Slice 1 de docs/features/catalogo-unificado.md — esquema unificado y categoría al publicar.
// Escenarios en src/e2e/unifiedCatalog/unifiedCatalog.feature.
const adminEmail = (process.env.HAZLO_SANO_ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)[0];

const stamp = Date.now();
const published = testPost("Jugo Verde");
const publishedSlug = published.slug;
const seededWithoutCategorySlug = testSlug("pan-de-masa-madre-natural");

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
      title: published.title,
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

  /* Afirmaba lo contrario —que los selectores de categoría solo existían para un producto— y se
     quedó atrás cuando los anuncios empezaron a guardarse con categoría: sin ella no hay forma de
     saber a qué pilar pertenece un anuncio, y todos acababan solo en el feed general. No se vio
     porque este describe se salta sin `HAZLO_SANO_ADMIN_EMAILS`, que es justo lo que le faltaba al
     trabajo de GitHub. Lo que queda como propio de un producto es la procedencia. */
  test("Then the category is asked for both kinds, and the origin only for a product", async ({
    page,
  }) => {
    const publishPage = new UnifiedCatalogPage(page);

    await publishPage.goto();

    // El formulario abre en «anuncio», y ya pregunta la categoría.
    await publishPage.expectCategoryOffered();
    await expect(publishPage.origin()).toHaveCount(0);

    await page
      .getByRole("combobox", { name: /tipo de publicación/i })
      .selectOption("producto");

    await publishPage.expectCategoryOffered();
    await expect(publishPage.origin()).toBeVisible();
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
