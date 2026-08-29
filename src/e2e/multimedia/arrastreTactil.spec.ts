import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { MediaTray } from "../testUtils/mediaTray";
import { dragWithFinger } from "../testUtils/pointerDrag";
import { mediaFileName, readPostMediaBySlug } from "../testUtils/readPostMedia";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug } from "../testUtils/testSlug";

/**
 * Reordering the files of a publication **with a finger**, in a real browser.
 *
 * This is the one drag scenario that leaves jsdom, and it is on purpose that it is the touch one.
 * The slice-4 tray shipped a drag that only worked with a mouse: HTML5 drag and drop is a
 * desktop-only API, no mobile browser emits it for a finger, and the component test could not tell
 * — `fireEvent.dragStart` always fires. The gesture that was broken is the gesture that gets the
 * browser.
 *
 * It asserts `post_media` and not only the tray, because the order is what the listing card, the
 * cart and the WhatsApp bot read with `ORDER BY sort_order LIMIT 1`. Three thumbnails swapping on
 * screen prove the gesture; the row proves it survived the save.
 */
test.use({
  hasTouch: true,
  isMobile: true,
  viewport: { width: 390, height: 844 },
});

test.describe("Given the owner of a publication editing it from a phone", () => {
  let dbSession: DbSession | undefined;
  const seeded: string[] = [];

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    for (const slug of seeded.splice(0)) await deleteOnePostBySlug(slug);
    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  test("Then holding a photo and dragging it to the front makes it the cover", async ({
    page,
  }) => {
    const slug = testSlug("ensalada-griega-tactil");
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

    await dragWithFinger(page, tray.items().nth(2), tray.items().nth(0));

    /* On screen first: if this fails, the gesture never happened, and asserting the database next
       would report it as a save bug. The address is what tells the three seeded files apart. */
    await expect(async () => {
      expect(await trayOrder(tray)).toEqual([
        "seed-2.jpg",
        "seed-0.jpg",
        "seed-1.jpg",
      ]);
    }).toPass({ timeout: 5_000 });

    await page.getByRole("button", { name: /guardar cambios/i }).click();
    await page.waitForURL(`/${slug}`);

    /* A move, not a swap with position 1: the other two keep their relative order. A swap would
       have stored `seed-2, seed-1, seed-0`. */
    expect(
      (await readPostMediaBySlug(slug)).map((file) => mediaFileName(file.url)),
    ).toEqual(["seed-2.jpg", "seed-0.jpg", "seed-1.jpg"]);
  });
});

/** The file names in the tray, in the order the thumbnails are shown. */
async function trayOrder(tray: MediaTray): Promise<string[]> {
  return tray.items().evaluateAll((nodes) =>
    nodes.map((node) => {
      const source = decodeURIComponent(
        node.querySelector("img")?.getAttribute("src") ?? "",
      );

      return source.split("/").pop()?.split("?")[0] ?? "?";
    }),
  );
}
