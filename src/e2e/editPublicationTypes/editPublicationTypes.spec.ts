import { expect, type Page, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { readPostRowBySlug } from "../testUtils/readPostRow";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug } from "../testUtils/testSlug";

function localDateTimeInputValue(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const pad = (value: number): string => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function save(page: Page): Promise<void> {
  await page.getByRole("button", { name: /guardar cambios/i }).click();
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
      startsAt: new Date("2027-09-04T18:30:00"),
      endsAt: new Date("2027-09-04T20:00:00"),
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
    expect(localDateTimeInputValue(row?.starts_at as Date | string)).toBe(
      "2027-09-05T07:15",
    );
    expect(localDateTimeInputValue(row?.ends_at as Date | string)).toBe(
      "2027-09-05T09:00",
    );
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

    await page.getByLabel(/^precio/i).fill("420");
    await page.getByLabel(/cu[aá]nto dura/i).fill("60");
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
  });
});
