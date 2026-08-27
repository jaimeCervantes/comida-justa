import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";

/**
 * El conmutador de tema del pie, en un navegador de verdad.
 *
 * Lo que solo se ve aquí y no en `ThemeToggle.test.tsx`: que el `<html>` nace **ya** con el
 * atributo correcto —lo escribe `RootLayout` leyendo la cookie, antes del primer pintado— y que la
 * elección sobrevive una recarga completa. Un test de componente monta el árbol una vez; esto
 * comprueba las dos peticiones reales que hacen falta para que no haya parpadeo.
 *
 * No hay `.feature` nuevo para esto: es un único comportamiento autocontenido, igual que
 * `pie.spec.ts` de al lado, y no una serie de escenarios de un roadmap.
 */

const boton = (page: import("@playwright/test").Page) =>
  page.getByTestId("theme-toggle");

test.describe("Sin preferencia guardada", () => {
  test.use({ colorScheme: "dark" });

  test("el sitio sigue al sistema operativo, sin atributo forzado", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    /* El sistema pidió oscuro: la piel del sitio tiene que reflejarlo aunque nadie haya tocado el
       botón, que es justo lo que la media query de `colors.css` ya resolvía antes de este slice. */
    const fondo = await page
      .locator("body")
      .evaluate((n) => getComputedStyle(n).backgroundColor);

    expect(fondo).not.toBe("rgb(255, 255, 255)");
  });
});

test.describe("El ciclo del botón", () => {
  test("un clic rota automático → claro → oscuro → automático, y lo escribe en el DOM", async ({
    page,
  }) => {
    await page.goto("/");
    const html = page.locator("html");
    const button = boton(page);

    await expect(html).not.toHaveAttribute("data-theme");
    /* El nombre accesible describe a dónde lleva el próximo clic, no el estado actual — es lo
       mismo que ya afirma `ThemeToggle.test.tsx`; aquí solo se confirma una vez que sale igual
       compilado, con el catálogo real. */
    await expect(button).toHaveAccessibleName(es.footer.theme.switchTo.light);

    await button.click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect(button).toHaveAccessibleName(es.footer.theme.switchTo.dark);

    await button.click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(button).toHaveAccessibleName(es.footer.theme.switchTo.system);

    await button.click();
    await expect(html).not.toHaveAttribute("data-theme");
  });

  test("la elección sobrevive una recarga completa: el servidor ya la aplica", async ({
    page,
  }) => {
    await page.goto("/");
    await boton(page).click(); // → light
    await boton(page).click(); // → dark

    await page.reload();

    /* Si el servidor no leyera la cookie, este `reload` volvería a "automático" — que es
       exactamente el defecto que un script de cliente-solo no habría cazado. */
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(boton(page)).toBeVisible();
  });
});
