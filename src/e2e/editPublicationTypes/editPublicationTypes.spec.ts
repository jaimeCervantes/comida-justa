import { expect, type Page, test } from "@playwright/test";
import { formatCommunityDateTimeLocal } from "~/domain/schedule/localDateTime";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { readPostRowBySlug } from "../testUtils/readPostRow";
import { seedPost } from "../testUtils/seedPost";
import { readRoute, seedRoute } from "../testUtils/seedRoute";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug } from "../testUtils/testSlug";

async function save(page: Page): Promise<void> {
  await page.getByRole("button", { name: /guardar cambios/i }).click();
}

async function appearsBefore(
  page: Page,
  firstTestId: string,
  secondTestId: string,
): Promise<boolean> {
  return page.evaluate(
    ([first, second]) => {
      const firstElement = document.querySelector(`[data-testid="${first}"]`);
      const secondElement = document.querySelector(`[data-testid="${second}"]`);

      if (!firstElement || !secondElement) return false;

      return Boolean(
        firstElement.compareDocumentPosition(secondElement) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      );
    },
    [firstTestId, secondTestId],
  );
}

test.describe("Editing publications with type-specific fields", () => {
  let dbSession: DbSession | undefined;
  const seeded: string[] = [];

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    for (const slug of seeded.splice(0)) {
      await deleteOnePostBySlug(slug);
    }

    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  test("Then an event loads and saves its dates", async ({ page }) => {
    const slug = testSlug("rodada-nocturna-editable");
    seeded.push(slug);

    await seedPost({
      title: "E2E Rodada nocturna editable",
      slug,
      kind: "evento",
      origin: null,
      price: null,
      startsAt: new Date("2027-09-05T00:30:00Z"),
      endsAt: new Date("2027-09-05T02:00:00Z"),
    });

    await page.goto(`/editar/${slug}`);

    await expect(page.getByLabel(/tipo de publicaci/i)).toHaveValue("evento");
    await expect(page.getByLabel(/cuándo empieza/i)).toHaveValue(
      "2027-09-04T18:30",
    );
    await expect(page.getByLabel(/cuándo termina/i)).toHaveValue(
      "2027-09-04T20:00",
    );

    await page.getByLabel(/cuándo empieza/i).fill("2027-09-05T07:15");
    await page.getByLabel(/cuándo termina/i).fill("2027-09-05T09:00");
    await save(page);
    await page.waitForURL(`/${slug}`);

    const row = await readPostRowBySlug(slug);

    expect(row?.kind).toBe("evento");
    expect(formatCommunityDateTimeLocal(row?.starts_at as Date | string)).toBe(
      "2027-09-05T07:15",
    );
    expect(formatCommunityDateTimeLocal(row?.ends_at as Date | string)).toBe(
      "2027-09-05T09:00",
    );
  });

  /**
   * The route survives an edit that never mentions it.
   *
   * This is the one that fails silently, which is why it gets the browser. Until this slice
   * `/editar/[slug]` did not even mount the route field, so an event could not change or drop its
   * GPX — the only way out was deleting the publication and making it again, losing its address,
   * its comments and its age.
   *
   * The trap the field had to avoid is the opposite one: an empty file input means "I did not
   * upload anything", and if that erased the route, an event would lose its track every time its
   * owner fixed a typo in the title. Dropping it needs a word of its own, and that arithmetic is
   * asserted in Vitest; what a browser adds here is that the whole round trip leaves the row alone.
   */
  test("Then editing an event keeps the route it already had", async ({
    page,
  }) => {
    const slug = testSlug("rodada-con-recorrido");
    seeded.push(slug);

    const postId = await seedPost({
      title: "E2E Rodada con recorrido",
      slug,
      kind: "evento",
      origin: null,
      price: null,
      startsAt: new Date("2027-09-05T00:30:00Z"),
    });
    const seededRoute = await seedRoute(postId);

    await page.goto(`/editar/${slug}`);

    /* The field says what is already there. Without this the screen would claim the event has no
       route, and whoever edits the title would believe they lost it. */
    await expect(page.getByTestId("route-existing")).toContainText("8.2 km");

    await page
      .getByLabel(/título de la publicación/i)
      .fill("E2E Rodada del sábado");
    await save(page);
    await page.waitForURL(`/${slug}`);

    const stored = await readRoute(postId);

    expect(stored).toEqual(seededRoute);
  });

  test("Then a service loads and saves price and duration", async ({
    page,
  }) => {
    const slug = testSlug("sesion-de-respiracion-editable");
    seeded.push(slug);

    await seedPost({
      title: "E2E Sesion de respiracion editable",
      slug,
      kind: "servicio",
      origin: null,
      price: 350,
      durationMinutes: 45,
    });
    expect(await readPostRowBySlug(slug)).toMatchObject({
      kind: "servicio",
      duration_minutes: 45,
    });

    await page.goto(`/editar/${slug}`);

    await expect(page.getByLabel(/tipo de publicaci/i)).toHaveValue("servicio");
    await expect(page.getByLabel(/^precio/i)).toHaveValue("350");
    await expect(page.getByLabel(/cu[aá]nto dura/i)).toHaveValue("45");
    await expect(page.getByLabel(/tel[eé]fono/i)).toHaveValue("2781092116");

    await page.getByLabel(/^precio/i).fill("420");
    await page.getByLabel(/cu[aá]nto dura/i).fill("60");
    await page.getByLabel(/tel[eé]fono/i).fill("2781126948");
    expect(
      await page
        .getByRole("form", { name: /edita tu publicación/i })
        .evaluate((form) =>
          Array.from(
            (form as HTMLFormElement).querySelectorAll<
              HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >(":invalid"),
          ).map((field) => ({
            name: field.name,
            id: field.id,
            message: field.validationMessage,
          })),
        ),
    ).toEqual([]);
    await save(page);
    await page.waitForURL(`/${slug}`);

    const row = await readPostRowBySlug(slug);

    expect(row?.kind).toBe("servicio");
    expect(Number(row?.price)).toBe(420);
    expect(row?.duration_minutes).toBe(60);
    expect(row?.contact_phone).toBe("2781126948");
  });
});

test.describe("Service schedule placement", () => {
  test("Then the schedule picker appears after the share action and before comments", async ({
    page,
  }) => {
    await page.goto("/descanso-reparador");

    await expect(page.getByTestId("share-post-trigger")).toBeVisible();
    await expect(page.getByTestId("slot-picker")).toBeVisible();
    await expect(page.getByTestId("comments")).toBeVisible();

    await expect
      .poll(() => appearsBefore(page, "share-post-trigger", "slot-picker"))
      .toBe(true);
    await expect
      .poll(() => appearsBefore(page, "slot-picker", "comments"))
      .toBe(true);
  });
});
