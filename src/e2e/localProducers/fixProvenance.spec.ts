import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { readPostRowBySlug } from "../testUtils/readPostRow";
import { type SeedPostInput, seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug } from "../testUtils/testSlug";

/**
 * Slice 2 de `docs/features/productores-locales.md`.
 *
 * El slice 1 dejó un camino sin retorno: quien declaraba mal su procedencia no podía corregirla
 * desde ninguna pantalla, ni siquiera siendo admin. Esto lo cierra.
 */
test.describe("Cuando alguien declaró mal de dónde viene su producto", () => {
  let dbSession: DbSession | undefined;
  const post = {
    title: `E2E Pan de masa madre ${Date.now()}`,
    slug: testSlug("pan-de-masa-madre-mal-declarado"),
    kind: "producto",
    origin: "reventa_cercana",
    price: 96,
  } satisfies SeedPostInput;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
    await seedPost(post);
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(post.slug);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces la corrige desde la edición y el resto no se mueve", async ({
    page,
  }) => {
    await page.goto(`/editar/${post.slug}`);

    await expect(page.locator("#origin")).toHaveValue("reventa_cercana");

    await page.locator("#origin").selectOption("productor");
    await page.getByRole("button", { name: /guardar cambios/i }).click();

    // El slug no se mueve al editar: los enlaces repartidos siguen vivos.
    await page.waitForURL(`/${post.slug}`);

    const row = await readPostRowBySlug(post.slug);
    expect(row?.origin).toBe("productor");
    await expect(page.getByRole("heading", { name: post.title })).toBeVisible();
  });

  /* Mismas reglas que al publicar: corregir no es una puerta trasera para la marca de la casa. */
  test("Pero no se le ofrecen las procedencias de Hazlo Sano", async ({
    page,
  }) => {
    await page.goto(`/editar/${post.slug}`);

    const opciones = page.locator("#origin option");

    await expect(opciones.filter({ hasText: /hazlo sano/i })).toHaveCount(0);
    await expect(
      opciones.filter({ hasText: "Yo lo hago o lo cultivo" }),
    ).toHaveCount(1);
  });
});
