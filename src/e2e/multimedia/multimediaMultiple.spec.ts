import { expect, test } from "@playwright/test";
import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import PublishPage from "../createPost/PublishPage";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testPost } from "../testUtils/testSlug";

const DUMMIES = {
  first: "./src/e2e/dummies/post.jpg",
  second: "./src/e2e/dummies/post-2.jpg",
  third: "./src/e2e/dummies/post-3.jpg",
  video: "./src/e2e/dummies/post.mp4",
} as const;

/**
 * What actually landed in `post_media`, in `sort_order`.
 *
 * The assertion goes to the database and not only to the page because the order **is** the feature:
 * `sort_order` 0 is the cover that the listing card, the cart and the WhatsApp bot all read with
 * `ORDER BY sort_order LIMIT 1`. A gallery that looks right while the rows are shuffled would still
 * show the wrong cover everywhere else.
 */
async function storedMedia(
  slug: string,
): Promise<Array<{ sortOrder: number; type: string; url: string }>> {
  const result = await db.execute(sql`
    SELECT m.sort_order, m.type, m.url
    FROM post_media m
    JOIN post_translations t ON t.post_id = m.post_id
    WHERE t.slug = ${slug}
    ORDER BY m.sort_order
  `);

  return (
    result.rows as unknown as Array<{
      sort_order: number;
      type: string;
      url: string;
    }>
  ).map((row) => ({
    sortOrder: Number(row.sort_order),
    type: row.type,
    url: row.url,
  }));
}

test.describe("Given someone publishing a product with several files", () => {
  let dbSession: DbSession | undefined;
  const published: string[] = [];

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
    await page.goto("/publicar");
  });

  test.afterEach(async () => {
    for (const slug of published.splice(0)) {
      await deleteOnePostBySlug(slug);
    }

    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Then three files picked at once reach the publication in the order they were uploaded", async ({
    page,
  }) => {
    const publishPage = new PublishPage(page);
    const { title, slug } = testPost("Crema de cacahuate artesanal");

    await publishPage.stubStorageUpload();
    await publishPage.fillFields({
      title,
      description:
        "Cacahuate organico molido, sin azucar anadida. Ideal para el desayuno o pre-entreno.",
      price: "120",
      phone: "2781092116",
      file: [DUMMIES.first, DUMMIES.second, DUMMIES.third],
    });

    await expect(publishPage.trayItems()).toHaveCount(3);
    await expect(publishPage.trayCounter()).toContainText("3 de 10");

    await publishPage.send();
    await page.waitForURL(`/${slug}`);
    published.push(slug);

    const media = await storedMedia(slug);

    expect(media.map((file) => file.sortOrder)).toEqual([0, 1, 2]);
    expect(media.map((file) => file.type)).toEqual(["image", "image", "image"]);
    /* Three different addresses: the same one three times would mean the upload collapsed them,
       which is exactly what happened before the storage filename got a discriminator. */
    expect(new Set(media.map((file) => file.url)).size).toBe(3);
  });

  test("Then picking again adds to the tray instead of replacing it", async ({
    page,
  }) => {
    const publishPage = new PublishPage(page);
    const { title, slug } = testPost("Ensalada griega con queso feta");

    await publishPage.stubStorageUpload();
    await publishPage.fillFields({
      title,
      description:
        "Lechuga, tomate, pepino, aceitunas, cebolla morada y queso feta. Aderezo de limon y AOVE.",
      price: "80",
      phone: "2781092116",
      file: DUMMIES.first,
    });

    await expect(publishPage.trayItems()).toHaveCount(1);

    await publishPage.addFiles(DUMMIES.second);

    await expect(publishPage.trayItems()).toHaveCount(2);
    await expect(publishPage.trayCounter()).toContainText("2 de 10");

    await publishPage.send();
    await page.waitForURL(`/${slug}`);
    published.push(slug);

    expect(await storedMedia(slug)).toHaveLength(2);
  });

  test("Then removing the middle file renumbers the ones that stay", async ({
    page,
  }) => {
    const publishPage = new PublishPage(page);
    const { title, slug } = testPost("Tonico de jengibre y curcuma");

    await publishPage.stubStorageUpload();
    await publishPage.fillFields({
      title,
      description:
        "Receta casera para reforzar el sistema inmune. Jengibre fresco, curcuma, miel y limon.",
      price: "45",
      phone: "2781092116",
      file: [DUMMIES.first, DUMMIES.second, DUMMIES.third],
    });

    await expect(publishPage.trayItems()).toHaveCount(3);

    const urlsBefore = await publishPage
      .trayItems()
      .evaluateAll((items) =>
        items.map(
          (item) => item.querySelector("img,video")?.getAttribute("src") ?? "",
        ),
      );

    await publishPage.removeFile(2);

    await expect(publishPage.trayItems()).toHaveCount(2);
    await expect(publishPage.trayCounter()).toContainText("2 de 10");

    await publishPage.send();
    await page.waitForURL(`/${slug}`);
    published.push(slug);

    const media = await storedMedia(slug);

    /* No gap in the numbering: `sort_order` is the position in the publication, not the position in
       what the browser happened to upload. */
    expect(media.map((file) => file.sortOrder)).toEqual([0, 1]);
    expect(media[1].url).not.toBe(urlsBefore[1]);
  });

  test("Then a picture and a video live in the same publication", async ({
    page,
  }) => {
    const publishPage = new PublishPage(page);
    const { title, slug } = testPost("Reto 7 dias camina 5 minutos");

    await publishPage.stubStorageUpload();
    await publishPage.fillFields({
      title,
      description:
        "Empieza con solo 5 minutos al dia. Progresion guiada. Incluye checklist descargable.",
      price: "0",
      phone: "2781092116",
      file: [DUMMIES.first, DUMMIES.video],
    });

    await expect(publishPage.trayItems()).toHaveCount(2);

    await publishPage.send();
    await page.waitForURL(`/${slug}`);
    published.push(slug);

    /* The MIME is reduced to the category `post_media` stores, and it is reduced per file: a single
       `type` for the whole publication would make the detail page render the video as an image. */
    expect((await storedMedia(slug)).map((file) => file.type)).toEqual([
      "image",
      "video",
    ]);
  });

  test("Then publishing a single file behaves exactly as it did before", async ({
    page,
  }) => {
    const publishPage = new PublishPage(page);
    const { title, slug } = testPost("Guia como leer etiquetas");

    await publishPage.stubStorageUpload();
    await publishPage.fillFields({
      title,
      description:
        "Aprende a identificar azucares ocultos, grasas trans y aditivos en 10 minutos. PDF incluido.",
      price: "25",
      phone: "2781092116",
      file: DUMMIES.first,
    });

    await publishPage.send();
    await page.waitForURL(`/${slug}`);
    published.push(slug);

    const media = await storedMedia(slug);

    expect(media).toHaveLength(1);
    expect(media[0].sortOrder).toBe(0);
  });
});
