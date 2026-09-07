import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "~/e2e/testUtils/simulateLogin";
import { stubStorageUpload } from "~/e2e/testUtils/stubStorageUpload";
import {
  adoptPracticeForSuite,
  countPracticeEvidencePostsForSuite,
  deleteHabitChallengeTestData,
  type SuiteProfileUsernameLease,
  seedTodaySleepRepetition,
  useSuiteProfileUsername,
} from "./testData";

const HABITS = "/habitos";
const HOME = "/";
const DARK_ROOM = "sleep-dark-room";
const PHOTO = "./src/e2e/dummies/post.jpg";

test.describe("Prácticas como publicaciones", () => {
  let session: DbSession | null = null;
  let usernameLease: SuiteProfileUsernameLease | null = null;

  test.beforeEach(async ({ page, browserName }) => {
    await deleteHabitChallengeTestData();
    session = await simulateLogin(page, browserName);
    await stubStorageUpload(page);
  });

  test.afterEach(async () => {
    await deleteHabitChallengeTestData();
    if (session) await deleteSession(session.sessionToken);
    if (usernameLease) await usernameLease.restore();
    session = null;
    usernameLease = null;
  });

  test("una práctica con evidencia se publica en el feed", async ({ page }) => {
    await adoptPracticeForSuite(DARK_ROOM);

    await publishPracticeEvidence(page);

    await expect(
      page.getByText("Tu práctica ya está publicada."),
    ).toBeVisible();
    await expect(page.getByTestId("practice-evidence-link")).toHaveAttribute(
      "href",
      /\/practica-sleep-dark-room-/,
    );

    await page.goto(HOME);

    const card = practicePostCard(page);
    await expect(card).toBeVisible();
    await expect(card).toContainText("Practiqué Penumbra total");
    await expect(card).toContainText("Sueño");
    await expect(card).toContainText("Práctica");
    await expect(card.getByTestId("practice-post-start")).toHaveAttribute(
      "href",
      "/practicas",
    );
    await expect(card.locator("img")).toHaveCount(1);
  });

  test("el formulario de evidencia nace configurado por la práctica", async ({
    page,
  }) => {
    await adoptPracticeForSuite(DARK_ROOM);

    await page.goto(HABITS);
    const form = await openEvidenceForm(page);

    await expect(form).toContainText("Penumbra total");
    await expect(form).toContainText("Sueño");
    await expect(form).toContainText("La oscuridad es la única señal");
    await expect(form.getByLabel("Foto o video de tu práctica")).toBeVisible();
    await expect(form.getByLabel("Nota opcional")).toBeVisible();
    await expect(form).not.toContainText(
      /tipo de publicaci[oó]n|precio|cu[aá]ndo empieza|duraci[oó]n|tel[eé]fono/i,
    );
  });

  test("la evidencia permite repetir el mismo pilar el mismo día", async ({
    page,
  }) => {
    await adoptPracticeForSuite(DARK_ROOM);
    await seedTodaySleepRepetition();

    await publishPracticeEvidence(page, "Primer registro con foto.");
    await publishPracticeEvidence(page, "Segundo registro con foto.");

    expect(await countPracticeEvidencePostsForSuite(DARK_ROOM)).toBe(2);
    await expect(
      practice(page, DARK_ROOM).getByTestId("practice-done-today"),
    ).toContainText("Un pilar suma una vez al día");
  });

  test("un check-in simple no crea publicación social", async ({ page }) => {
    await adoptPracticeForSuite(DARK_ROOM);

    await page.goto(HABITS);
    await practice(page, DARK_ROOM).getByTestId("practice-mark").click();

    await expect(
      practice(page, DARK_ROOM).getByTestId("practice-done-today"),
    ).toContainText("Hoy ya cuenta");
    expect(await countPracticeEvidencePostsForSuite(DARK_ROOM)).toBe(0);
  });

  test("el feed distingue una práctica de una venta o evento", async ({
    page,
  }) => {
    usernameLease = await useSuiteProfileUsername();
    await adoptPracticeForSuite(DARK_ROOM);

    const postHref = await publishPracticeEvidence(page);
    if (session) await deleteSession(session.sessionToken);
    session = null;
    await page.context().clearCookies();

    await page.goto(HOME);

    const card = practicePostCard(page);
    await expect(card).toBeVisible();
    await expect(card).toContainText("Práctica");
    await expect(card.getByTestId("card-author-profile")).toHaveAttribute(
      "href",
      `/u/${usernameLease.username}`,
    );
    await expect(card.getByTestId("practice-post-start")).toHaveAttribute(
      "href",
      "/practicas",
    );
    await expect(card.getByTestId("add-to-cart")).toHaveCount(0);
    await expect(card.getByTestId("card-book-service")).toHaveCount(0);
    await expect(card.getByTestId("whatsapp-order")).toHaveCount(0);

    await page.goto(postHref);

    const detail = page.getByTestId("post-detail");
    await expect(detail.getByTestId("practice-detail-context")).toContainText(
      "Práctica saludable",
    );
    await expect(detail.getByTestId("practice-detail-start")).toHaveAttribute(
      "href",
      "/practicas",
    );
    await expect(detail.getByTestId("post-identity-author")).toHaveAttribute(
      "href",
      `/u/${usernameLease.username}`,
    );
    await expect(detail.getByTestId("add-to-cart")).toHaveCount(0);
    await expect(detail.getByTestId("whatsapp-order")).toHaveCount(0);
    await expect(detail.getByTestId("event-attendance-toggle")).toHaveCount(0);
    await expect(
      detail.getByTestId("event-attendance-confirm-signin"),
    ).toHaveCount(0);
    await expect(detail.locator("a[href^='tel:']")).toHaveCount(0);
    await expect(detail).not.toContainText(/\$\d/);
  });
});

async function publishPracticeEvidence(
  page: Page,
  note = "Hoy apagué pantallas y dejé el cuarto en penumbra.",
): Promise<string> {
  await page.goto(HABITS);
  const form = await openEvidenceForm(page);
  await form.getByLabel("Foto o video de tu práctica").setInputFiles(PHOTO);
  await expect(form.getByTestId("media-uploaded")).toBeVisible({
    timeout: 45_000,
  });
  await form.getByLabel("Nota opcional").fill(note);
  await form.getByRole("button", { name: "Publicar práctica" }).click();
  await expect(page.getByText("Tu práctica ya está publicada.")).toBeVisible({
    timeout: 45_000,
  });
  const href = await page
    .getByTestId("practice-evidence-link")
    .getAttribute("href");
  if (!href) throw new Error("La práctica publicada no expuso su enlace.");
  return href;
}

async function openEvidenceForm(page: Page): Promise<Locator> {
  const item = practice(page, DARK_ROOM);
  await item.getByText("Publicar evidencia").click();
  const form = item.getByTestId("practice-evidence-form");
  await expect(form).toBeVisible();
  return form;
}

function practice(page: Page, key: string): Locator {
  return page.locator(`[data-practice="${key}"]`);
}

function practicePostCard(page: Page): Locator {
  return page
    .getByRole("article")
    .filter({ hasText: "Practiqué Penumbra total" })
    .first();
}
