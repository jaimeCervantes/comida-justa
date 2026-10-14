import { expect, type Page } from "@playwright/test";
import es from "~/i18n/messages/es.json";

const t = es.outreach;

/**
 * Borra desde una pantalla de edición: pulsa «Borrar …», confirma y espera a la lista.
 *
 * El primer botón solo abre la pregunta, y llega del servidor como HTML normal: hasta que React no
 * engancha su `onClick`, pulsarlo no abre nada y no falla nada. `toPass` reintenta la pareja —pulsar
 * y ver la confirmación—, como `openWhenHydrated`. Si la pregunta ya se abrió, el botón ya no está y
 * solo se comprueba: pulsarlo otra vez no tendría qué pulsar.
 *
 * Se espera al encabezado de la lista y no a la lista: al borrar lo último, la página dice que no
 * hay nada en vez de pintar una lista vacía.
 */
export async function deleteAndConfirm(
  page: Page,
  trigger: string,
  listHeading: string,
): Promise<void> {
  const region = page.getByTestId("outreach-delete");
  const ask = region.getByRole("button", { name: trigger });
  const confirm = region.getByRole("button", { name: t.confirmDelete });

  await expect(async () => {
    if (await ask.isVisible()) await ask.click({ timeout: 1_000 });
    await expect(confirm).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });

  await confirm.click();
  await expect(
    page.getByRole("heading", { level: 1, name: listHeading, exact: true }),
  ).toBeVisible();
}
