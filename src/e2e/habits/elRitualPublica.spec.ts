import { expect, type Page, test } from "@playwright/test";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "~/e2e/testUtils/simulateLogin";
import {
  adoptPracticeForSuite,
  countPracticeEvidencePostsForSuite,
  countSleepRepetitions,
  deleteHabitChallengeTestData,
} from "./testData";

/**
 * El ritual de un pilar publica cada día que se marca.
 *
 * Se usa el pilar de mente y espíritu a propósito: el de sueño ya lo conduce
 * `atomicSleepChallenge.spec.ts`, y dos suites empujando el mismo reto en la misma base compartida
 * se pisan el progreso.
 */
const MIND_PILLAR = "/pilares/mente-espiritu";
const MIND_RITUAL = "Presencia, paz y conexión local";
/** El prefijo de slug que `ritualPracticeSlug` le da a las publicaciones de este ritual. */
const MIND_RITUAL_SLUG_KEY = "ritual-mind-one-connection-v1";
/**
 * Una acción de servidor recién compilada tarda más que el plazo corto de `toBeVisible`, y aquí
 * además guarda la repetición y crea la publicación. Contar en la base antes de que termine deja la
 * acción en vuelo mientras el `afterEach` borra su progreso: el fallo aparece entonces en el
 * servidor y no en el escenario, que es donde cuesta reconocerlo.
 */
const SERVER_ACTION_TIMEOUT = 45_000;
/** Una práctica del catálogo, para el camino que no pasa por el ritual del pilar. */
const CATALOG_PRACTICE = {
  key: "sleep-mental-unload",
  title: "La descarga mental",
} as const;
/** Otra del **mismo** pilar: es la que prueba que la unidad de publicación es la práctica. */
const SAME_PILLAR_PRACTICE = { key: "sleep-dark-room" } as const;

test.describe("El ritual del pilar publica", () => {
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

  test("completar el día del ritual publica en el feed", async ({ page }) => {
    await startMindRitual(page);
    await expect(page.getByTestId("ritual-publish-note")).toBeVisible();

    await recordMindDay(page);
    await expectDayRecorded(page);

    expect(await countMindRitualPosts()).toBe(1);

    await page.goto("/");
    const card = page
      .getByRole("article")
      .filter({ hasText: `Practiqué ${MIND_RITUAL}` })
      .first();

    await expect(card).toBeVisible();
    await expect(card.getByTestId("practice-post-badge")).toBeVisible();
    await expect(card.getByTestId("practice-post-start")).toBeVisible();
    await expect(card.getByTestId("add-to-cart")).toHaveCount(0);
    await expect(card.getByTestId("card-book-service")).toHaveCount(0);
  });

  test("marcar una práctica del catálogo también publica", async ({ page }) => {
    await adoptPracticeForSuite(CATALOG_PRACTICE.key);

    await page.goto("/practicas");
    await markCatalogPractice(page, CATALOG_PRACTICE.key);

    expect(await countPracticeEvidencePostsForSuite(CATALOG_PRACTICE.key)).toBe(
      1,
    );

    await page.goto("/");
    await expect(
      page
        .getByRole("article")
        .filter({ hasText: `Practiqué ${CATALOG_PRACTICE.title}` })
        .first(),
    ).toBeVisible();
  });

  /**
   * La unidad del jardín es el pilar y el día; la de la publicación es la práctica y el día. Por eso
   * la segunda práctica del mismo pilar conserva su botón y deja su propia publicación, aunque el
   * conteo de repeticiones no vuelva a subir.
   */
  test("dos prácticas del mismo pilar el mismo día dan dos publicaciones", async ({
    page,
  }) => {
    await adoptPracticeForSuite(CATALOG_PRACTICE.key);
    await adoptPracticeForSuite(SAME_PILLAR_PRACTICE.key);

    await page.goto("/practicas");
    await markCatalogPractice(page, CATALOG_PRACTICE.key);
    await markCatalogPractice(page, SAME_PILLAR_PRACTICE.key);

    expect(await countPracticeEvidencePostsForSuite(CATALOG_PRACTICE.key)).toBe(
      1,
    );
    expect(
      await countPracticeEvidencePostsForSuite(SAME_PILLAR_PRACTICE.key),
    ).toBe(1);
    expect(await countSleepRepetitions()).toBe(1);
  });

  /**
   * El día contado desaparece de las fechas disponibles, así que el panel ya no ofrece el
   * formulario: desde el navegador no hay forma de marcarlo dos veces. La regla que impide la
   * segunda publicación si el intento llegara por otro camino se prueba en
   * `src/domain/habits/ritualPost.test.ts`.
   */
  test("el día ya contado deja de ofrecerse, así que no hay segundo marcado", async ({
    page,
  }) => {
    await startMindRitual(page);
    await recordMindDay(page);
    await expectDayRecorded(page);

    await page.goto(MIND_PILLAR);

    await expect(
      page.getByRole("checkbox", { name: "Abrí el día sin pantalla" }),
    ).toHaveCount(0);
    expect(await countMindRitualPosts()).toBe(1);
  });
});

async function startMindRitual(page: Page): Promise<void> {
  await page.goto(MIND_PILLAR);
  await expect(page).toHaveURL(/\/pilares\/mente-espiritu$/, {
    timeout: 30_000,
  });
  await page.getByRole("button", { name: `Empezar ${MIND_RITUAL}` }).click();
}

/**
 * Marca el día del ritual. El rótulo del botón cambia con el primer día ya registrado, así que se
 * pide por cualquiera de los dos en vez de asumir cuál toca.
 */
async function recordMindDay(page: Page): Promise<void> {
  await page
    .getByRole("checkbox", { name: "Abrí el día sin pantalla" })
    .check();
  await page
    .getByRole("checkbox", { name: "Le di presencia real a alguien" })
    .check();
  await page
    .getByRole("button", { name: /Registrar (mi primer día|este día)/ })
    .click();
}

/**
 * Espera a que el día quede registrado antes de mirar la base.
 *
 * «Primer paso» es la insignia común a los cuatro pilares, así que sirve de señal sin atarse al
 * texto de celebración de este ritual.
 */
async function expectDayRecorded(page: Page): Promise<void> {
  await expect(page.getByText("Primer paso")).toBeVisible({
    timeout: SERVER_ACTION_TIMEOUT,
  });
}

async function countMindRitualPosts(): Promise<number> {
  return countPracticeEvidencePostsForSuite(MIND_RITUAL_SLUG_KEY);
}

/** Marca una práctica del catálogo y espera a que la acción de servidor termine. */
async function markCatalogPractice(
  page: Page,
  practiceKey: string,
): Promise<void> {
  const card = page.locator(`[data-practice="${practiceKey}"]`);

  await card.getByTestId("practice-mark").click();
  await expect(card.getByTestId("practice-done-today")).toBeVisible({
    timeout: SERVER_ACTION_TIMEOUT,
  });
}
