import { expect, type Page, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";

// Slice 4 de docs/features/commerce/005-2026-09-04-cuenta-configurable.md.
// Escenarios @slice-4 de `cuentaConfigurable.feature` que no son @component.

function becomeSellerForm(page: Page) {
  return page.getByRole("form", { name: es.account.becomeSellerFormLabel });
}

test.describe("Cuando entro sin tienda abierta", () => {
  let dbSession: DbSession | undefined;

  test.beforeEach(async ({ page, browserName }) => {
    dbSession = await simulateLogin(page, browserName);
    await page.goto("/cuenta");
  });

  /* Este bloque NO abre tienda, así que no hay ninguna que borrar: la cuenta queda como estaba. */
  test.afterEach(async () => {
    if (dbSession?.id) {
      await deleteSession(dbSession.id);
    }
  });

  /* El «Cancelar» llevaba a "/". No cancelaba nada —el alta es un formulario, no un asistente de
     varios pasos— y estaba a un centímetro del único botón que esta pantalla quiere que se pulse. */
  test("Entonces el alta no ofrece ninguna salida fuera de la cuenta", async ({
    page,
  }) => {
    const form = becomeSellerForm(page);

    await expect(form).toBeVisible();
    await expect(form.getByRole("link")).toHaveCount(0);

    const botones = form.getByRole("button");

    await expect(botones).toHaveCount(1);
    await expect(botones).toHaveText(es.account.becomeSellerSubmit);
  });

  /* Apilados y no en dos columnas: en columnas pesaban lo mismo, así que la pantalla ofrecía dos
     decisiones sin relación al mismo nivel. El orden es el que ya enumera la lista de pendientes. */
  test("Entonces abrir la tienda va antes que reservar la dirección personal", async ({
    page,
  }) => {
    const titulos = await page
      .getByRole("heading", { level: 2 })
      .allTextContents();

    expect(titulos.indexOf(es.account.becomeSellerTitle)).toBeGreaterThan(-1);
    expect(titulos.indexOf(es.account.becomeSellerTitle)).toBeLessThan(
      titulos.indexOf(es.account.usernameTitle),
    );
  });

  /* Lo que no cambia: la lista de pendientes sigue diciendo por dónde empezar, y su primer paso es
     el mismo bloque que ahora manda en la pantalla. */
  test("Y la lista de pendientes sigue reclamando la tienda como primer paso", async ({
    page,
  }) => {
    const pasos = page.getByTestId("setup-checklist-item");

    await expect(pasos.first()).toContainText(es.account.setupStepStore);
    await expect(pasos.first()).toHaveAttribute("data-done", "false");
  });
});
