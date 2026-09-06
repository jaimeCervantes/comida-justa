import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "~/e2e/testUtils/simulateLogin";
import {
  adoptPracticeForSuite,
  deleteHabitChallengeTestData,
  readPracticeSharingForSuite,
  type SuiteProfileUsernameLease,
  seedPublicCelebrationForSuite,
  seedTodaySleepRepetition,
  useSuiteProfileUsername,
} from "./testData";

const HABITS = "/habitos";
const DARK_ROOM = "sleep-dark-room";
const MENTAL_UNLOAD = "sleep-mental-unload";

test.describe("Tablero semanal de prácticas", () => {
  let session: DbSession | null = null;

  test.beforeEach(async ({ page, browserName }) => {
    await deleteHabitChallengeTestData();
    session = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    await deleteHabitChallengeTestData();
    if (session) await deleteSession(session.sessionToken);
    session = null;
  });

  test("el avance semanal aparece antes de los retos y nombra el estado de hoy", async ({
    page,
  }) => {
    await adoptPracticeForSuite(DARK_ROOM);
    await seedTodaySleepRepetition();

    await page.goto(HABITS);

    await expect(summary(page)).toHaveText("1 de 4 pilares cuidados hoy");
    await expect(pillar(page, "sleep")).toHaveAttribute(
      "data-counted-today",
      "true",
    );
    for (const key of ["nutrition", "movement", "mindSpirit"]) {
      await expect(pillar(page, key)).toHaveAttribute(
        "data-counted-today",
        "false",
      );
    }
    await expect(progress(page)).toBeVisible();
    expect(
      await appearsBefore(
        progress(page),
        page.getByRole("link", { name: /Del atardecer al amanecer/ }).first(),
      ),
    ).toBe(true);
  });

  test("una práctica activa se puede marcar desde Hábitos", async ({
    page,
  }) => {
    await adoptPracticeForSuite(DARK_ROOM);

    await page.goto(HABITS);
    await practice(page, DARK_ROOM).getByTestId("practice-mark").click();

    await expect(summary(page)).toHaveText("1 de 4 pilares cuidados hoy");
    await expect(
      practice(page, DARK_ROOM).getByTestId("practice-done-today"),
    ).toContainText("Hoy ya cuenta");
  });

  test("el tablero no promete doble aporte para el mismo pilar", async ({
    page,
  }) => {
    await adoptPracticeForSuite(DARK_ROOM);
    await adoptPracticeForSuite(MENTAL_UNLOAD);
    await seedTodaySleepRepetition();

    await page.goto(HABITS);

    const mine = page.getByTestId("my-practices");
    await expect(mine.getByTestId("practice-mark")).toHaveCount(0);
    await expect(mine.getByTestId("practice-done-today")).toHaveCount(2);
    await expect(mine).toContainText("Un pilar suma una vez al día");
  });

  test("una práctica activa se puede compartir y retirar del perfil público", async ({
    page,
  }) => {
    await adoptPracticeForSuite(DARK_ROOM);

    await page.goto(HABITS);
    await expect(practice(page, DARK_ROOM)).toContainText("Privada");
    expect(await readPracticeSharingForSuite(DARK_ROOM)).toBe(false);

    await practice(page, DARK_ROOM)
      .getByTestId("practice-sharing-toggle")
      .click();

    await expect(practice(page, DARK_ROOM)).toContainText("Compartida");
    expect(await readPracticeSharingForSuite(DARK_ROOM)).toBe(true);

    await practice(page, DARK_ROOM)
      .getByTestId("practice-sharing-toggle")
      .click();

    await expect(practice(page, DARK_ROOM)).toContainText("Privada");
    expect(await readPracticeSharingForSuite(DARK_ROOM)).toBe(false);
  });
});

test.describe("Perfil público de prácticas", () => {
  let usernameLease: SuiteProfileUsernameLease | null = null;

  test.beforeEach(async () => {
    await deleteHabitChallengeTestData();
    usernameLease = await useSuiteProfileUsername();
  });

  test.afterEach(async () => {
    await deleteHabitChallengeTestData();
    if (usernameLease) await usernameLease.restore();
    usernameLease = null;
  });

  test("muestra sólo prácticas compartidas agrupadas por pilar", async ({
    page,
  }) => {
    await adoptPracticeForSuite(DARK_ROOM, true);
    await adoptPracticeForSuite(MENTAL_UNLOAD, false);

    await page.goto(`/u/${usernameLease?.username ?? "e2e-practicas-ana"}`);

    const sharedPractices = page.getByTestId("public-shared-practices");
    await expect(sharedPractices).toBeVisible();
    await expect(
      sharedPractices
        .getByTestId("public-shared-practices-pillar")
        .filter({ hasText: "Sueño" }),
    ).toBeVisible();
    await expect(sharedPractices).toContainText("Penumbra total");
    await expect(sharedPractices).toContainText("Cuándo:");
    await expect(sharedPractices).toContainText("Lo que basta:");
    await expect(sharedPractices).toContainText("Desde");
    await expect(sharedPractices).not.toContainText("La descarga mental");
    await expect(sharedPractices).not.toContainText(
      /puntos|ranking|campe[oó]n|primer lugar/i,
    );
  });
});

test.describe("Descubrimiento desde actividad pública", () => {
  let usernameLease: SuiteProfileUsernameLease | null = null;

  test.beforeEach(async () => {
    await deleteHabitChallengeTestData();
    usernameLease = await useSuiteProfileUsername();
  });

  test.afterEach(async () => {
    await deleteHabitChallengeTestData();
    if (usernameLease) await usernameLease.restore();
    usernameLease = null;
  });

  test("un alias visible en una celebración lleva al perfil público", async ({
    page,
  }) => {
    const username = usernameLease?.username ?? "e2e-practicas-ana";
    await adoptPracticeForSuite(DARK_ROOM, true);
    await seedPublicCelebrationForSuite();

    await page.goto("/pilares");
    await page
      .getByTestId("public-habit-profile-link")
      .filter({ hasText: username })
      .click();

    await expect(page).toHaveURL(`/u/${username}`);
    await expect(page.getByTestId("public-shared-practices")).toContainText(
      "Penumbra total",
    );
  });
});

function progress(page: Page): Locator {
  return page.getByTestId("weekly-practice-progress");
}

function summary(page: Page): Locator {
  return page.getByTestId("weekly-practice-progress-summary");
}

function pillar(page: Page, key: string): Locator {
  return page.locator(
    `[data-testid="weekly-pillar-progress"][data-pillar="${key}"]`,
  );
}

function practice(page: Page, key: string): Locator {
  return page.locator(`[data-practice="${key}"]`);
}

async function appearsBefore(left: Locator, right: Locator): Promise<boolean> {
  const rightHandle = await right.elementHandle();
  if (!rightHandle) return false;
  return left.evaluate((leftNode, rightElement) => {
    const rightNode = rightElement as Element;
    return Boolean(
      leftNode.compareDocumentPosition(rightNode) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    );
  }, rightHandle);
}
