import { expect, type Page, test } from "@playwright/test";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "~/e2e/testUtils/simulateLogin";
import {
  closeHabitChallengeWindow,
  deleteHabitChallengeTestData,
  readHabitChallengeWindow,
} from "./testData";

const SLEEP_PILLAR = "/pilares/sueno";
const PILLARS_OVERVIEW = "/pilares";
const JOIN = "Empezar Del atardecer al amanecer";
const REJOIN = "Continuar con mi semana de descanso";

/**
 * Lo que promete la práctica es que la semana vuelve.
 *
 * Ninguna aserción fija un día del calendario: la ventana la calcula el servidor con el reloj real,
 * así que una prueba que dijera «meta 5» pasaría los lunes y fallaría los jueves. Lo que se afirma
 * son las relaciones que valen cualquier día — la meta cabe en la ventana, el calendario tiene
 * tantos días como dice el contador — y esas no se caen al pasar la medianoche del domingo.
 */
test.describe("La semana que vuelve", () => {
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

  test("a closed week invites me into the current one instead of painting the old days", async ({
    page,
  }) => {
    await joinThePractice(page);
    const closed = await closeHabitChallengeWindow();

    await page.goto(SLEEP_PILLAR);
    await expect(page.getByText("Tu semana anterior ya cerró")).toBeVisible();
    await expect(page.getByTestId("challenge-day")).toHaveCount(0);
    await expect(page.getByRole("button", { name: REJOIN })).toBeVisible();

    await page.getByRole("button", { name: REJOIN }).click();

    await expect(page.getByTestId("challenge-day").first()).toBeVisible();
    const reopened = await readHabitChallengeWindow();
    expect(reopened.startDate).not.toBe(closed.startDate);
    expect(reopened.endDate).not.toBe(closed.endDate);
  });

  test("the goal always fits inside the window it belongs to", async ({
    page,
  }) => {
    await joinThePractice(page);

    const days = await page.getByTestId("challenge-day").count();
    const goal = await readWeeklyGoal(page);

    expect(goal.total).toBe(days);
    expect(goal.target).toBeGreaterThanOrEqual(1);
    expect(goal.target).toBeLessThanOrEqual(days);
  });

  /**
   * Aquí no se afirma que la meta vuelva a cero.
   *
   * La ventana nueva se abre **hoy**, así que si uno se reincorpora el mismo día en que practicó
   * —lo que pasa siempre en esta prueba— la repetición cae dentro de ella y el contador dice «1 de
   * 1» con toda la razón. Que la meta solo cuente la ventana vigente se afirma en
   * `habitChallengeUseCase.test.ts`, que sí puede mover el reloj a la semana siguiente. Escribirlo
   * aquí sería una prueba que pasa los lunes.
   */
  test("rejoining keeps the points already earned", async ({ page }) => {
    await joinThePractice(page);
    await recordOneRepetition(page);
    await expect(page.getByText("10 puntos").first()).toBeVisible();

    await closeHabitChallengeWindow();
    await page.goto(SLEEP_PILLAR);
    await page.getByRole("button", { name: REJOIN }).click();

    await expect(page.getByTestId("challenge-day").first()).toBeVisible();
    await expect(page.getByText("10 puntos").first()).toBeVisible();
  });

  /**
   * El pulso se afirma como **diferencia**, no como número.
   *
   * Cuánta gente practica esta semana lo decide la comunidad, así que un `toContainText("4")` diría
   * una cosa hoy y otra mañana. Lo que sí es una promesa es que aportar suma uno: se lee el pulso
   * antes, aporta la cuenta de pruebas, y se lee después.
   */
  test("the weekly pulse counts one more when someone shares their practice", async ({
    page,
  }) => {
    await page.goto(PILLARS_OVERVIEW);
    const before = await readWeeklyPulse(page);

    await joinThePractice(page);
    await recordOneRepetition(page);
    await page
      .getByRole("button", { name: "Aportar mis repeticiones al jardín" })
      .click();

    await page.goto(PILLARS_OVERVIEW);
    expect(await readWeeklyPulse(page)).toBe(before + 1);
  });

  test("a week with nobody says so instead of faking participants", async ({
    page,
  }) => {
    await page.goto(PILLARS_OVERVIEW);
    const pulse = page.getByTestId("community-habit-garden-week");

    await expect(pulse).toBeVisible();
    /* El texto sigue al número, sea cual sea: con gente los nombra, y sin gente invita en vez de
       enseñar un cero suelto. Es la misma regla que la sección local de un pilar vacío. */
    const practitioners = await readWeeklyPulse(page);
    await expect(pulse).toContainText(
      practitioners === 0 ? /nadie/i : new RegExp(String(practitioners)),
    );
  });
});

/** El pulso publica su número en un atributo para poder compararlo sin leer la redacción. */
async function readWeeklyPulse(page: Page): Promise<number> {
  const value = await page
    .getByTestId("community-habit-garden-week")
    .getAttribute("data-practitioners");
  const practitioners = Number(value);
  if (!Number.isInteger(practitioners)) {
    throw new Error(`The weekly pulse was not a number: ${value}`);
  }
  return practitioners;
}

async function joinThePractice(page: Page): Promise<void> {
  await page.goto(SLEEP_PILLAR);
  await expect(page).toHaveURL(/\/pilares\/sueno$/, { timeout: 30_000 });
  await page.getByRole("button", { name: JOIN }).click();
  await expect(page.getByTestId("challenge-day").first()).toBeVisible();
}

async function recordOneRepetition(page: Page): Promise<void> {
  await page
    .getByRole("checkbox", {
      name: "Estacioné mis dispositivos y bajé las luces",
    })
    .check();
  await page
    .getByRole("checkbox", {
      name: "Salí a recibir luz natural exterior al despertar",
    })
    .check();
  await page.getByRole("button", { name: "Completar mi primer ciclo" }).click();
}

/** «Meta de esta semana: 3 de 4 días», leída como los dos números que relaciona. */
async function readWeeklyGoal(
  page: Page,
): Promise<{ target: number; total: number }> {
  const text = await page
    .getByText(/Meta de esta semana:/)
    .first()
    .innerText();
  const match = text.match(/(\d+)\s+de\s+(\d+)/);
  if (!match) throw new Error(`The weekly goal was not readable in: ${text}`);
  return { target: Number(match[1]), total: Number(match[2]) };
}
