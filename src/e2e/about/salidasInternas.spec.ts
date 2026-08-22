import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";

/**
 * `/nosotros` tenía **ocho enlaces y los ocho salían del sitio** —WhatsApp, TikTok, Facebook,
 * Instagram, Telegram y dos dominios—: contaba quiénes somos y despedía a quien se interesaba. Ni
 * un solo `<Link>` interno, así que quien terminaba de leer no tenía a dónde ir **dentro**.
 *
 * Es el mismo callejón que el slice 1 de `docs/features/platform/010-...` arregló en los estados
 * vacíos: decir qué falta sin decir qué hacer ahora.
 */
test.describe("La página de nosotros", () => {
  test("Ofrece dos puertas hacia dentro del sitio", async ({ page }) => {
    await page.goto("/nosotros");

    await expect(
      page.getByRole("link", { name: es.about.browseCta }),
    ).toHaveAttribute("href", "/productos");
    await expect(
      page.getByRole("link", { name: es.about.publishCta }),
    ).toHaveAttribute("href", "/publicar");
  });

  test("Y llevan de verdad al catálogo", async ({ page }) => {
    await page.goto("/nosotros");

    await page.getByRole("link", { name: es.about.browseCta }).click();
    await page.waitForURL("**/productos");

    await expect(
      page.getByRole("heading", { level: 1, name: es.products.title }),
    ).toBeVisible();
  });

  /*
   * El bloque de contacto del final se queda: pedir por WhatsApp o pasar por la sucursal es otra
   * intención, y sigue siendo válida. Lo que faltaba era la de quedarse.
   */
  test("Sin quitarle las salidas que ya tenía", async ({ page }) => {
    await page.goto("/nosotros");

    /* `exact` porque el pie lleva el mismo rótulo con un emoji delante —«📱 WhatsApp Directo»— y
       `getByRole` empareja por subcadena: sin esto resolvía dos elementos. */
    await expect(
      page.getByRole("link", { name: es.about.orderWhatsapp, exact: true }),
    ).toBeVisible();
  });
});
