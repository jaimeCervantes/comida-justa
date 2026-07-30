import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import {
  cleanupTestCategories,
  countTestCategories,
  testCategoryKey,
} from "../testUtils/testCategories";
import AdminCatalogPage from "./AdminCatalogPage";

/**
 * Slice 5 — administrar el catálogo sin migración.
 *
 * Es el único slice que **escribe** en la taxonomía desde el sitio, así que estos escenarios son
 * los que faltaban por recorrer en un navegador: el dominio y las acciones ya estaban cubiertos,
 * pero nadie comprobaba que agregar una categoría se viera en `/publicar`.
 *
 * Las categorías creadas llevan el prefijo `e2e_` para poder barrerlas aunque una corrida muera.
 */
const adminEmail = (process.env.HAZLO_SANO_ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)[0];

const PARENT = "alimentacion";

test.describe("When an admin manages the category catalog", () => {
  let dbSession: DbSession | undefined;
  const seededSlugs: string[] = [];

  test.beforeAll(async () => {
    // Barre lo que haya quedado de corridas anteriores antes de empezar.
    await cleanupTestCategories();
  });

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(!adminEmail, "HAZLO_SANO_ADMIN_EMAILS is not configured");
    dbSession = await simulateLogin(page, browserName, { email: adminEmail });
  });

  test.afterEach(async () => {
    for (const slug of seededSlugs.splice(0)) {
      await deleteOnePostBySlug(slug);
    }
    await cleanupTestCategories();

    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test.afterAll(async () => {
    // Que un residuo no pase inadvertido: ya ocurrió una vez y rompió el golden del backend.
    expect(await countTestCategories()).toBe(0);
  });

  // Escenario "A new sub-category becomes available without deploying" (@slice-5)
  test("Then a new sub-category is offered by /publicar without a deployment", async ({
    page,
  }) => {
    const key = testCategoryKey("conservas");
    const catalog = new AdminCatalogPage(page);

    await catalog.goto();
    await catalog.expectOnPage();

    await catalog.addSubCategory({
      parentKey: PARENT,
      key,
      labelEs: "Conservas E2E",
      labelEn: "E2E Preserves",
    });

    await expect(catalog.created()).toContainText(key);
    await expect(catalog.row(key)).toBeVisible();
    await expect(catalog.state(key)).toHaveText("activa");

    // Lo que importa: aparece en el formulario de publicar sin desplegar nada.
    await page.goto("/publicar");
    await page.selectOption("#kind", "producto");
    await page.selectOption("#category", PARENT);

    await expect(
      page.locator("#subCategory option", { hasText: "Conservas E2E" }),
    ).toHaveCount(1);
  });

  // Escenario "Deactivating a category hides it from the form but not from its products" (@slice-5)
  test("Then deactivating hides it from the form, but its products keep their label", async ({
    page,
  }) => {
    const key = testCategoryKey("temporada");
    const slug = `producto-de-temporada-${Date.now()}`;
    const catalog = new AdminCatalogPage(page);

    await catalog.goto();
    await catalog.addSubCategory({
      parentKey: PARENT,
      key,
      labelEs: "Temporada E2E",
      labelEn: "E2E Season",
    });
    await expect(catalog.row(key)).toBeVisible();

    // Una publicación que ya usa esa categoría: es la que no debe perder su etiqueta.
    seededSlugs.push(slug);
    await seedPost({
      title: `Producto de temporada ${Date.now()}`,
      slug,
      kind: "producto",
      origin: "hazlo_sano_propio",
      category: PARENT,
      subCategory: key,
    });

    await catalog.toggle(key).click();

    await expect(catalog.state(key)).toHaveText("inactiva");

    // Sale del selector...
    await page.goto("/publicar");
    await page.selectOption("#kind", "producto");
    await page.selectOption("#category", PARENT);
    await expect(
      page.locator("#subCategory option", { hasText: "Temporada E2E" }),
    ).toHaveCount(0);

    // ...pero la publicación que ya la tenía la sigue mostrando.
    await page.goto(`/${slug}`);
    await expect(page.getByTestId("category-tag")).toHaveText("Temporada E2E");
  });

  test("Then a deactivated category can be switched back on from the same page", async ({
    page,
  }) => {
    const key = testCategoryKey("reversible");
    const catalog = new AdminCatalogPage(page);

    await catalog.goto();
    await catalog.addSubCategory({
      parentKey: PARENT,
      key,
      labelEs: "Reversible E2E",
    });
    await expect(catalog.state(key)).toHaveText("activa");

    await catalog.toggle(key).click();
    await expect(catalog.state(key)).toHaveText("inactiva");

    await catalog.toggle(key).click();
    await expect(catalog.state(key)).toHaveText("activa");
  });

  // La base rechazaría estas claves, pero el error llegaría como un 500 sin explicación.
  test("Then a key the database would reject is explained before saving", async ({
    page,
  }) => {
    const catalog = new AdminCatalogPage(page);

    await catalog.goto();
    await catalog.addSubCategory({
      parentKey: PARENT,
      key: "Con Mayúsculas",
      labelEs: "Inválida",
    });

    await expect(catalog.fieldError(/minúsculas/i)).toBeVisible();
    await expect(catalog.created()).toHaveCount(0);
  });

  test("Then a key the catalog already has is refused", async ({ page }) => {
    const catalog = new AdminCatalogPage(page);

    await catalog.goto();
    await catalog.addSubCategory({
      parentKey: PARENT,
      key: "jugos",
      labelEs: "Otra",
    });

    await expect(catalog.fieldError(/ya existe/i)).toBeVisible();
  });
});

test.describe("When someone who is not an admin opens the catalog", () => {
  // 404 en vez de 403: una página interna no tiene por qué revelar que existe.
  test("Then the page answers 404, without revealing that it exists", async ({
    page,
  }) => {
    const response = await page.goto("/admin/catalogo");

    expect(response?.status()).toBe(404);
  });
});
