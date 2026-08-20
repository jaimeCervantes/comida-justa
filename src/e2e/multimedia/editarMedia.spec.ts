import { expect, type Page, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { MediaTray } from "../testUtils/mediaTray";
import { mediaFileName, readPostMediaBySlug } from "../testUtils/readPostMedia";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { stubStorageUpload } from "../testUtils/stubStorageUpload";
import { testSlug } from "../testUtils/testSlug";

/**
 * Editing the files of a publication that already exists.
 *
 * The publications are seeded straight through the write repository instead of being published from
 * the UI: what is under test is the **edit** path, and driving `/publicar` first would make an
 * editing bug look like an upload bug — and would double the runtime of every scenario here.
 *
 * Every assertion lands on `post_media` rather than on the tray alone. The tray showing two
 * thumbnails proves the browser dropped one; it says nothing about which row survived, and the row
 * is what the listing card, the cart and the bot read.
 */

/** The seeded files are told apart by their address: `seed-0.jpg`, `seed-1.jpg`, `seed-2.jpg`. */
async function storedFileNames(slug: string): Promise<string[]> {
  return (await readPostMediaBySlug(slug)).map((file) =>
    mediaFileName(file.url),
  );
}

async function save(page: Page): Promise<void> {
  await page.getByRole("button", { name: /guardar cambios/i }).click();
}

test.describe("Given the owner of a publication with several files", () => {
  let dbSession: DbSession | undefined;
  const seeded: string[] = [];

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    for (const slug of seeded.splice(0)) {
      await deleteOnePostBySlug(slug);
    }

    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  test("Then removing the middle file leaves the other two in order", async ({
    page,
  }) => {
    const slug = testSlug("crema-de-cacahuate");
    await seedPost({
      title: "E2E Crema de cacahuate artesanal",
      slug,
      kind: "producto",
      origin: "productor",
      price: 120,
      mediaCount: 3,
    });
    seeded.push(slug);

    const tray = new MediaTray(page);
    await page.goto(`/editar/${slug}`);

    /* The files it already has are on screen before anything is touched. Editing used to not show
       them at all, so this is the half of the slice that has no equivalent when publishing. */
    await expect(tray.items()).toHaveCount(3);
    await expect(tray.counter()).toContainText("3 de 10");

    await tray.remove(2).click();
    await expect(tray.items()).toHaveCount(2);

    await save(page);
    await page.waitForURL(`/${slug}`);

    const media = await readPostMediaBySlug(slug);

    /* No gap in the numbering: `sort_order` is the position in the publication, not the position the
       file used to hold. A `[0, 2]` here would leave the cart reading a cover that is not the first
       thumbnail on screen. */
    expect(media.map((file) => file.sortOrder)).toEqual([0, 1]);
    expect(media.map((file) => mediaFileName(file.url))).toEqual([
      "seed-0.jpg",
      "seed-2.jpg",
    ]);
  });

  test("Then an added file goes last, behind the ones already there", async ({
    page,
  }) => {
    const slug = testSlug("tonico-de-jengibre");
    await seedPost({
      title: "E2E Tonico de jengibre y curcuma",
      slug,
      kind: "producto",
      origin: "productor",
      price: 45,
      mediaCount: 2,
    });
    seeded.push(slug);

    const tray = new MediaTray(page);
    // Registered before the upload starts, i.e. before the file input is filled.
    await stubStorageUpload(page);
    await page.goto(`/editar/${slug}`);

    await expect(tray.items()).toHaveCount(2);

    await tray.filePicker().setInputFiles("./src/e2e/dummies/post.jpg");

    // Three in the tray is the upload having finished; waiting for the label would say the same
    // thing one step further from what the scenario is about.
    await expect(tray.items()).toHaveCount(3, { timeout: 45_000 });

    await save(page);
    await page.waitForURL(`/${slug}`);

    /* The two that were already there keep their positions. Appending is not a detail: `sort_order`
       0 is the cover, so a new file landing first would silently change the picture the listing
       card, the cart and the bot show for a product nobody meant to re-shoot. */
    expect(await storedFileNames(slug)).toEqual([
      "seed-0.jpg",
      "seed-1.jpg",
      "post.jpg",
    ]);
  });

  test("Then moving the third file up to the cover changes what the listing shows", async ({
    page,
  }) => {
    const slug = testSlug("ensalada-griega");
    await seedPost({
      title: "E2E Ensalada griega con queso feta",
      slug,
      kind: "producto",
      origin: "productor",
      price: 80,
      mediaCount: 3,
    });
    seeded.push(slug);

    const tray = new MediaTray(page);
    await page.goto(`/editar/${slug}`);

    await expect(tray.items()).toHaveCount(3);

    /* Two steps, because moving is one place at a time: the file at 3 goes to 2, and the second
       click is on its new position. Driving it the way a person does is the point — a helper that
       jumped straight to the front would test a shortcut the interface does not offer. */
    await tray.moveEarlier(3).click();
    await tray.moveEarlier(2).click();

    await save(page);
    await page.waitForURL(`/${slug}`);

    /* Promoted to the front, and the other two keep their relative order: this is a move, not a swap
       with position 1. A swap would have produced `seed-2, seed-1, seed-0`. */
    expect(await storedFileNames(slug)).toEqual([
      "seed-2.jpg",
      "seed-0.jpg",
      "seed-1.jpg",
    ]);

    // And the card in the listing is the reason the order matters at all.
    await page.goto("/");

    const card = page
      .getByRole("article")
      .filter({ hasText: "Ensalada griega con queso feta" })
      .first();

    await expect(card.locator("img").first()).toHaveAttribute(
      "src",
      /seed-2\.jpg/,
    );
  });

  test("Then removing the last file is refused instead of leaving none", async ({
    page,
  }) => {
    const slug = testSlug("guia-etiquetas");
    await seedPost({
      title: "E2E Guia como leer etiquetas",
      slug,
      kind: "anuncio",
      origin: null,
    });
    seeded.push(slug);

    const tray = new MediaTray(page);
    await page.goto(`/editar/${slug}`);

    await expect(tray.items()).toHaveCount(1);
    await tray.remove(1).click();
    await expect(tray.items()).toHaveCount(0);

    await save(page);

    /* Saving is refused where the person can still read why. A publication with no media does not
       fail here: it fails later, when someone opens its detail page and the render breaks — which is
       the same reason `globalSetup` documents that a media-less publication would stop the app from
       coming up.

       The message sits under the tray, not in the banner at the top: since the media error became a
       field error, it lands in the same slot the browser would use for the field it belongs to. The
       banner (`edit-post-error`) is now only for what no single field owns. */
    await expect(
      page.getByText("Sube al menos una imagen o un video."),
    ).toBeVisible();

    expect(await storedFileNames(slug)).toEqual(["seed.jpg"]);
  });
});
