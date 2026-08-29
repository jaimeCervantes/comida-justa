import type { Locator, Page } from "@playwright/test";

/**
 * Driving a real drag in a real browser, with a finger and with a mouse.
 *
 * This exists because the previous drag could not be driven at all. HTML5 drag and drop
 * (`draggable` + `dragstart`) is a desktop-only API — no mobile browser emits it for a finger — and
 * the tray's own scenarios said so and settled for jsdom, where `fireEvent.dragStart` always works.
 * A test that cannot fail is not a test: the tray shipped promising a gesture that did nothing on a
 * phone.
 *
 * Pointer events can be driven. `page.mouse` emits them natively, and a finger goes through CDP
 * (`page.touchscreen` only knows how to tap), so both entries are reachable from a spec.
 *
 * Coordinates are read after `scrollIntoViewIfNeeded`: `boundingBox()` is relative to the viewport,
 * so a control below the fold reports a `y` no pointer can reach — which is how a first attempt at
 * this ended up "proving" that dragging was broken when it was the probe aiming at empty space.
 */

/** How long the finger holds still before the tray reads it as a drag. Mirrors `TOUCH_HOLD_MS`. */
const HOLD_MS = 500;

interface Point {
  x: number;
  y: number;
}

async function centerOf(target: Locator): Promise<Point> {
  await target.scrollIntoViewIfNeeded();

  const box = await target.boundingBox();

  // i18n-ignore: read by whoever writes the spec, not by whoever visits the site.
  if (!box) throw new Error("El elemento no tiene caja: ¿está oculto?");

  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Press, move across in several steps, release. The steps matter: one jump is not a drag. */
export async function dragWithMouse(
  page: Page,
  from: Locator,
  to: Locator,
): Promise<void> {
  const origin = await centerOf(from);
  const target = await centerOf(to);

  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 12 });
  await page.mouse.up();
}

/**
 * A finger: touch down, **hold**, drag across, lift.
 *
 * The hold is the whole point. Without it the tray hands the gesture back to the page — that is
 * what lets someone scroll down a form whose thumbnails they happen to start the swipe on — so a
 * helper that skipped it would test the scroll, not the reorder.
 */
export async function dragWithFinger(
  page: Page,
  from: Locator,
  to: Locator,
): Promise<void> {
  const origin = await centerOf(from);
  const target = await centerOf(to);

  const cdp = await page.context().newCDPSession(page);
  const at = ({ x, y }: Point) => [{ x, y, radiusX: 10, radiusY: 10 }];

  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: at(origin),
  });

  await page.waitForTimeout(HOLD_MS);

  for (let step = 1; step <= 10; step += 1) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: at({
        x: origin.x + ((target.x - origin.x) * step) / 10,
        y: origin.y + ((target.y - origin.y) * step) / 10,
      }),
    });
    await page.waitForTimeout(30);
  }

  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });

  await cdp.detach();
}
