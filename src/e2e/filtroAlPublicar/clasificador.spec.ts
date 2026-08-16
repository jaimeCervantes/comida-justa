import { expect, test } from "@playwright/test";
import PublishPage from "../createPost/PublishPage";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { readEmbeddingBySlug } from "../testUtils/readEmbedding";
import { readPostRowBySlug } from "../testUtils/readPostRow";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";

/**
 * Slice 2 de `docs/features/filtro-al-publicar.md`: el clasificador que decide solo.
 *
 * Lo que NO se prueba aquí es si el prompt acierta: eso se midió aparte contra las 27 publicaciones
 * reales de la base (27 aceptadas, 0 falsos positivos) y lo vigilan las tablas del `.feature`.
 *
 * Lo que sí se prueba es **el cableado**, que es lo único que la calibración no puede ver: que la
 * revisión corre en `after()` sin bloquear el redirect, que escribe el estado, y sobre todo que el
 * indexado va **detrás** del veredicto — un vector es la puerta del chatbot, y dárselo a algo
 * rechazado sería abrirle la puerta de atrás.
 */
const MEDIA = "./src/e2e/dummies/post.jpg";

test.describe("When a publication goes through the classifier", () => {
  let dbSession: DbSession | undefined;
  let slug = "";

  test.beforeEach(async ({ page, browserName }) => {
    test.skip(!process.env.GEMINI_API_KEY, "GEMINI_API_KEY is not configured");
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    if (slug) await deleteOnePostBySlug(slug);
    if (dbSession?.id) await deleteSession(dbSession.id);
    slug = "";
  });

  test("Then something off topic is taken down by itself, and never indexed", async ({
    page,
  }) => {
    const publishPage = new PublishPage(page);

    await publishPage.stubStorageUpload();
    await publishPage.goToPublish();
    await publishPage.fillFields({
      title: "Vendo Nissan Tsuru 2015",
      description:
        "Motor en buen estado, cuatro llantas nuevas, papeles en regla. Facilidades de pago y se acepta cambio.",
      price: "45000",
      phone: "2781092116",
      file: MEDIA,
    });
    await publishPage.send();

    // Publicar NO espera al clasificador: el redirect llega igual, como el resto de los `after()`.
    await page.waitForURL(/\/vendo-nissan-tsuru/);
    slug = new URL(page.url()).pathname.replace(/^\//, "");

    await expect
      .poll(async () => (await readPostRowBySlug(slug))?.moderation_status, {
        timeout: 45_000,
        intervals: [1000, 2000, 3000],
      })
      .toBe("rejected");

    const row = await readPostRowBySlug(slug);
    expect(row?.moderation_reason).toBe("off_topic");

    /* El formulario publica `anuncio` por omisión, y a un anuncio NO se le toca `is_available`: el
       bot consulta `kind = 'producto' AND is_available`, así que nunca lo vio y escribir esa columna
       sería ensuciarla con un dato sin sentido. El caso del producto —donde sí se apaga— lo cubre
       `filtroAlPublicar.spec.ts`, que siembra uno. */
    expect(row?.kind).toBe("anuncio");
    expect(row?.is_available).toBe(true);

    /* Y no se le pagó a Gemini por vectorizarlo. Se afirma sobre `dimensions` y no sobre la fila:
       la de `post_translations` nace con la publicación —ahí viven título, slug y texto— y lo que
       tiene que faltar es el `embedding`, que es lo que la haría encontrable por el chatbot. */
    expect((await readEmbeddingBySlug(slug))?.dimensions ?? null).toBeNull();

    // Su autor lo sigue viendo, con el motivo: es el único aviso que da el sitio.
    await page.goto(`/${slug}`);
    await expect(page.getByTestId("moderation-notice")).toBeVisible();
  });

  test("Then a real product stays published and gets its embedding", async ({
    page,
  }) => {
    const publishPage = new PublishPage(page);

    await publishPage.stubStorageUpload();
    await publishPage.goToPublish();
    await publishPage.fillFields({
      title: "Dona Chocolate Keto de prueba",
      description:
        "Dona horneada sin azúcar añadida, endulzada con monk fruit. Harina de almendra y cacao puro.",
      price: "35",
      phone: "2781092116",
      file: MEDIA,
    });
    await publishPage.send();

    await page.waitForURL(/\/dona-chocolate-keto-de-prueba/);
    slug = new URL(page.url()).pathname.replace(/^\//, "");

    /* Se espera al vector y no al estado: el estado ya nace `published`, así que afirmarlo sin más
       pasaría igual aunque la revisión no hubiera corrido nunca. El embedding solo aparece DESPUÉS
       del veredicto, así que es la prueba de que la revisión corrió y salió bien. */
    await expect
      .poll(async () => (await readEmbeddingBySlug(slug))?.dimensions ?? null, {
        timeout: 60_000,
        intervals: [1000, 2000, 3000],
      })
      .toBe(768);

    const row = await readPostRowBySlug(slug);
    expect(row?.moderation_status).toBe("published");
    expect(row?.moderation_reason).toBeNull();

    await page.goto(`/${slug}`);
    await expect(page.getByTestId("moderation-notice")).toHaveCount(0);
  });
});
