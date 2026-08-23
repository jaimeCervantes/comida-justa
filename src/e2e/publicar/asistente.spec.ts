import { expect, test } from "@playwright/test";
import { PUBLISH_STEPS } from "~/app/[locale]/publicar/publishSteps";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";

/**
 * La barra de pasos de `/publicar`.
 *
 * Se afirma **la relación**, no los píxeles: que la barra ocupa el ancho de su columna y que los
 * tres tramos se lo reparten. Un `toBe(32)` habría sido justo el defecto que esto viene a arreglar,
 * escrito otra vez en la prueba.
 */

/** Lo que se acepta de diferencia al comparar anchos: el redondeo a subpíxel del navegador. */
const TOLERANCE = 2;

test.describe("Dado alguien que abre /publicar", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
    await page.goto("/publicar");
  });

  test.afterEach(async () => {
    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  test("Entonces la barra de pasos ocupa el ancho del formulario", async ({
    page,
  }) => {
    const stepper = page.getByTestId("publish-stepper");
    const bar = stepper.getByRole("navigation");

    const form = await page.getByRole("form").first().boundingBox();
    const track = await bar.boundingBox();

    expect(form).not.toBeNull();
    expect(track).not.toBeNull();
    expect(
      Math.abs((track?.width ?? 0) - (form?.width ?? 0)),
    ).toBeLessThanOrEqual(TOLERANCE);
  });

  test("Entonces los tramos se reparten ese ancho a partes iguales", async ({
    page,
  }) => {
    const widths: number[] = [];

    for (const step of PUBLISH_STEPS) {
      const box = await page
        .getByTestId(`publish-step-${step.id}`)
        .boundingBox();
      widths.push(box?.width ?? 0);
    }

    expect(widths).toHaveLength(PUBLISH_STEPS.length);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(
      TOLERANCE,
    );
    /* Y cada uno es de verdad un tercio largo, no un punto: sin esto, tres puntos idénticos de
       32px pasarían la prueba de arriba. */
    expect(Math.min(...widths)).toBeGreaterThan(80);
  });
});
