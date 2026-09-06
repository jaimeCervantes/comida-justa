import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "~/e2e/testUtils/simulateLogin";
import {
  adoptPracticeForSuite,
  deleteHabitChallengeTestData,
  seedTodaySleepRepetition,
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
