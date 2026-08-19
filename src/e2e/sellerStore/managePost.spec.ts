import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { deleteTestSellerByHandle } from "../testUtils/deleteTestSeller";
import { readEmbeddingBySlug } from "../testUtils/readEmbedding";
import { readPostRowBySlug } from "../testUtils/readPostRow";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug, testStore } from "../testUtils/testSlug";
import SellerAccountPage from "./SellerAccountPage";
import StorePage from "./StorePage";

// Slice 5 de docs/features/commerce/001-2026-07-31-vendedores-y-tiendas.md.
const producto = () => ({
  title: `E2E Jugo Verde ${Date.now()}`,
  slug: testSlug("jugo-verde-del-vendedor"),
  kind: "producto" as const,
  origin: null,
  price: 40,
});

test.describe("Cuando un vendedor se queda sin existencias", () => {
  let dbSession: DbSession | undefined;
  const store = testStore("Panadería La Luz");
  const post = producto();

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);

    const account = new SellerAccountPage(page);
    await account.goto();
    await account.fillAndSubmit({ name: store.name, phone: store.phone });
    await account.expectStoreLink(store.handle);

    // Se siembra DESPUÉS de abrir la tienda para colgarla de su catálogo, como haría /publicar.
    await seedPost({ ...post, sellerHandle: store.handle });
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(post.slug);
    await deleteTestSellerByHandle(store.handle);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces lo marca agotado y deja de ofrecerse", async ({ page }) => {
    await page.goto(`/${post.slug}`);

    // Con existencias sí se puede pedir.
    await expect(page.getByTestId("whatsapp-order")).toBeVisible();

    await page
      .getByTestId("owner-controls")
      .getByRole("button", { name: /marcar agotado/i })
      .click();

    await expect(page.getByTestId("sold-out-badge")).toBeVisible();
    await expect(page.getByTestId("whatsapp-order")).toHaveCount(0);

    // Su dueño lo sigue viendo en la tienda: lo necesita para volver a ofrecerlo.
    const storePage = new StorePage(page);
    await storePage.goto(store.handle);
    await storePage.expectListed(post.title);

    // Un visitante cualquiera ya no: se le ofrece solo lo que hay.
    await page.context().clearCookies();
    await storePage.goto(store.handle);
    await storePage.expectNotListed(post.title);
  });
});

test.describe("Cuando alguien edita una publicación", () => {
  let dbSession: DbSession | undefined;
  const post = producto();
  const nuevoTitulo = `E2E Jugo Verde grande ${Date.now()}`;

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

  test("Entonces el texto cambia y la dirección se conserva", async ({
    page,
  }) => {
    await page.goto(`/editar/${post.slug}`);

    await page
      .getByRole("textbox", { name: /t[ií]tulo de la publicación/i })
      .fill(nuevoTitulo);
    await page
      .getByRole("textbox", { name: /descripci[oó]n/i })
      .fill("Ahora de 500 ml, con nopal, apio, piña y perejil.");
    // Este producto se sembró sin procedencia, como el que quedó de antes de la regla: la
    // pantalla de edición es justo por donde se pone al día (slice 2).
    await page.locator("#origin").selectOption("productor");
    await page.getByRole("button", { name: /guardar cambios/i }).click();

    // La dirección NO se mueve aunque el título cambie: los enlaces repartidos siguen vivos.
    await page.waitForURL(`/${post.slug}`);
    await expect(
      page.getByRole("heading", { name: nuevoTitulo }),
    ).toBeVisible();

    // Y la procedencia que le faltaba quedó guardada, sin que nadie entrara a la base.
    expect((await readPostRowBySlug(post.slug))?.origin).toBe("productor");

    // El vector se regenera en `after()`, después de la respuesta.
    if (process.env.GEMINI_API_KEY) {
      await expect
        .poll(async () => (await readEmbeddingBySlug(post.slug))?.dimensions, {
          timeout: 30_000,
          intervals: [500, 1000, 2000],
          message: "el texto cambió pero el vector nunca se regeneró",
        })
        .toBe(768);
    }
  });
});

test.describe("Cuando alguien abre la edición de una publicación ajena", () => {
  let dbSession: DbSession | undefined;
  const post = producto();

  test.beforeEach(async () => {
    await seedPost(post);
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(post.slug);
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Entonces responde 404 sin revelar que la pantalla existe", async ({
    page,
    browserName,
  }) => {
    // Se entra como el admin, que NO es quien sembró la publicación.
    const adminEmail = (process.env.HAZLO_SANO_ADMIN_EMAILS ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)[0];

    test.skip(!adminEmail, "HAZLO_SANO_ADMIN_EMAILS is not configured");
    dbSession = await simulateLogin(page, browserName, { email: adminEmail });

    const response = await page.goto(`/editar/${post.slug}`);

    expect(response?.status()).toBe(404);
  });
});
