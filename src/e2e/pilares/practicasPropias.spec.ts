import { expect, test } from "@playwright/test";
import { sql } from "drizzle-orm";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "~/e2e/testUtils/simulateLogin";
import { findSuiteUserId } from "~/e2e/testUtils/suiteAccount";
import { db } from "~/infra/dataAccess/db/connection";

/**
 * Empezar y dejar una práctica del catálogo (slice 4 de
 * `docs/features/wellbeing/027-2026-09-04-base-de-datos-de-practicas.md`).
 *
 * Se practica sobre `sleep-mental-unload` porque es la que tiene la evidencia más clara y la que ya
 * usan las demás pruebas de este catálogo: si algún día se retira, estos escenarios lo dicen en vez
 * de pasar sobre una tarjeta que ya no está.
 */
const PRACTICA = "sleep-mental-unload";

/** Otra práctica del mismo pilar, para comprobar que el día se cuenta por pilar y no por práctica. */
const HERMANA = "sleep-dark-room";

async function deletePracticeAdoptions(): Promise<void> {
  const userId = await findSuiteUserId();
  await db.execute(sql`DELETE FROM user_practices WHERE user_id = ${userId}`);
  /* Las repeticiones cuelgan de `habit_challenge_progress` por clave compuesta, así que basta con
     borrar el progreso: el `ON DELETE CASCADE` se lleva las repeticiones y las celebraciones. */
  await db.execute(sql`
    DELETE FROM habit_challenge_progress WHERE user_id = ${userId}
  `);
}

async function countRepetitions(): Promise<number> {
  const userId = await findSuiteUserId();
  const result = await db.execute(sql`
    SELECT COUNT(*)::int AS n FROM habit_repetitions WHERE user_id = ${userId}
  `);
  return Number((result.rows[0] as { n: number }).n);
}

function cardFor(page: import("@playwright/test").Page, key: string) {
  return page.locator(`[data-practice="${key}"]`);
}

async function readAdoption(): Promise<{
  started_at: Date;
  stopped_at: Date | null;
  source: string;
} | null> {
  const userId = await findSuiteUserId();
  const result = await db.execute(sql`
    SELECT up.started_at, up.stopped_at, up.source
    FROM user_practices up
    JOIN practices p ON p.id = up.practice_id
    WHERE up.user_id = ${userId} AND p.key = ${PRACTICA}
  `);
  return (result.rows[0] as never) ?? null;
}

function card(page: import("@playwright/test").Page) {
  return page.locator(`[data-practice="${PRACTICA}"]`);
}

test.describe("Cuando alguien quiere llevar una práctica", () => {
  let session: DbSession | null = null;

  test.beforeEach(async ({ page, browserName }) => {
    await deletePracticeAdoptions();
    session = await simulateLogin(page, browserName);
    await page.goto("/practicas");
  });

  test.afterEach(async () => {
    await deletePracticeAdoptions();
    if (session) await deleteSession(session.sessionToken);
    session = null;
  });

  test("Entonces puede empezarla y la lista lo dice", async ({ page }) => {
    await card(page).getByTestId("practice-toggle").click();

    await expect(card(page).getByTestId("practice-adopted")).toBeVisible();
    expect((await readAdoption())?.stopped_at).toBeNull();
  });

  test("Y queda registrado por dónde entró", async ({ page }) => {
    // `source` no parte el modelo: la fila es de la persona y se ve igual desde los dos canales.
    await card(page).getByTestId("practice-toggle").click();
    await expect(card(page).getByTestId("practice-adopted")).toBeVisible();

    expect((await readAdoption())?.source).toBe("web");
  });

  test("Y puede dejarla sin que se borre lo que empezó", async ({ page }) => {
    /* Dejar una práctica es información, no un error que corregir: la fila se marca, no se
       elimina, para que volver reabra la misma y no invente una segunda. */
    await card(page).getByTestId("practice-toggle").click();
    await expect(card(page).getByTestId("practice-adopted")).toBeVisible();

    await card(page).getByTestId("practice-toggle").click();
    await expect(card(page).getByTestId("practice-adopted")).toHaveCount(0);

    const adoption = await readAdoption();
    expect(adoption).not.toBeNull();
    expect(adoption?.stopped_at).not.toBeNull();
  });

  test("Y al volver se reabre la misma, conservando desde cuándo la practica", async ({
    page,
  }) => {
    // Es la regla que atraviesa el producto: volver después de dejarlo vale más que fingir
    // perfección, y para premiarlo hay que saber que ya se había empezado antes.
    await card(page).getByTestId("practice-toggle").click();
    await expect(card(page).getByTestId("practice-adopted")).toBeVisible();
    const primera = (await readAdoption())?.started_at;

    await card(page).getByTestId("practice-toggle").click();
    await expect(card(page).getByTestId("practice-adopted")).toHaveCount(0);

    await card(page).getByTestId("practice-toggle").click();
    await expect(card(page).getByTestId("practice-adopted")).toBeVisible();

    const vuelta = await readAdoption();
    expect(vuelta?.stopped_at).toBeNull();
    expect(new Date(vuelta?.started_at as Date).getTime()).toBe(
      new Date(primera as Date).getTime(),
    );
  });

  test("Y la ve en «Mis hábitos», que es donde busca lo suyo", async ({
    page,
  }) => {
    await card(page).getByTestId("practice-toggle").click();
    await expect(card(page).getByTestId("practice-adopted")).toBeVisible();

    await page.goto("/habitos");
    const mias = page.getByTestId("my-practices");

    await expect(mias.locator(`[data-practice="${PRACTICA}"]`)).toBeVisible();
  });

  test("Y al dejarla desaparece de ahí, sin que la sección se esconda", async ({
    page,
  }) => {
    await page.goto("/habitos");
    const mias = page.getByTestId("my-practices");

    // Sin ninguna, la sección sigue estando e invita al catálogo: esconderla dejaría a quien no ha
    // empezado sin saber que existe.
    await expect(mias).toBeVisible();
    await expect(mias.locator(`[data-practice="${PRACTICA}"]`)).toHaveCount(0);
  });

  test("Y puede marcar que hoy la hizo", async ({ page }) => {
    await card(page).getByTestId("practice-toggle").click();
    await expect(card(page).getByTestId("practice-adopted")).toBeVisible();

    await card(page).getByTestId("practice-mark").click();

    await expect(card(page).getByTestId("practice-done-today")).toBeVisible();
    expect(await countRepetitions()).toBe(1);
  });

  test("Y el día se cuenta por pilar, no por practica", async ({ page }) => {
    /* La regla que sostiene toda la tabla del jardín: marcar doce prácticas de descanso un martes
       sigue siendo un día. Aquí se comprueba con dos prácticas del mismo pilar. */
    for (const key of [PRACTICA, HERMANA]) {
      await cardFor(page, key).getByTestId("practice-toggle").click();
      await expect(
        cardFor(page, key).getByTestId("practice-adopted"),
      ).toBeVisible();
    }

    await cardFor(page, PRACTICA).getByTestId("practice-mark").click();
    await expect(
      cardFor(page, PRACTICA).getByTestId("practice-done-today"),
    ).toBeVisible();

    // La hermana ya no ofrece marcar: su pilar ya cuenta hoy, y lo dice.
    await expect(
      cardFor(page, HERMANA).getByTestId("practice-mark"),
    ).toHaveCount(0);
    await expect(
      cardFor(page, HERMANA).getByTestId("practice-done-today"),
    ).toContainText("una vez al día");
    expect(await countRepetitions()).toBe(1);
  });

  test("Y marcar sólo se ofrece sobre lo que se lleva", async ({ page }) => {
    await expect(card(page).getByTestId("practice-mark")).toHaveCount(0);
  });
});

test.describe("Cuando alguien lee el catálogo sin entrar", () => {
  test("Entonces lo lee entero, y se le invita a entrar para llevarlas", async ({
    page,
  }) => {
    await page.goto("/practicas");

    await expect(card(page)).toBeVisible();
    await expect(card(page).getByTestId("practice-toggle")).toHaveCount(0);
    await expect(
      card(page).getByRole("link", { name: /Entrar para empezarla/ }),
    ).toBeVisible();
  });
});
