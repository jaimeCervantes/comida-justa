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

async function deletePracticeAdoptions(): Promise<void> {
  const userId = await findSuiteUserId();
  await db.execute(sql`DELETE FROM user_practices WHERE user_id = ${userId}`);
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
