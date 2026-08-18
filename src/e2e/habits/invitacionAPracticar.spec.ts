import { expect, test } from "@playwright/test";
import en from "~/i18n/messages/en.json";
import es from "~/i18n/messages/es.json";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";

/**
 * El encabezado de la portada de pilares es texto rico (`<brand>{brandName}</brand>`).
 *
 * Se resuelve aquí en vez de escribir «Los 4 Pilares de Hazlo Sano» a mano para que el día que la
 * plantilla cambie falle esta prueba y no el sitio: si alguien reescribe la clave, esto deja de
 * encontrar el encabezado y lo dice.
 */
function overviewHeading(template: string): string {
  return template.replace("<brand>{brandName}</brand>", PUBLIC_BRAND_NAME);
}

const invitations = [
  {
    locale: "español",
    hub: "/pilares",
    heading: overviewHeading(es.pillarsOverview.heading),
  },
  {
    locale: "inglés",
    hub: "/en/pillars",
    heading: overviewHeading(en.pillarsOverview.heading),
  },
] as const;

test.describe("El hub de práctica de los cuatro pilares", () => {
  for (const { locale, hub, heading } of invitations) {
    test(`en ${locale} muestra el jardín comunitario`, async ({ page }) => {
      await page.goto(hub);

      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.getByTestId("community-habit-garden")).toBeVisible();
    });
  }

  /* El jardín cuenta lo que la comunidad lleva hecho; cuando además hay celebraciones públicas,
     el hub las presenta después de ese resumen colectivo. */
  test("muestra las celebraciones después de la actividad comunitaria", async ({
    page,
  }) => {
    await page.goto("/pilares");

    const sequence = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll(
          '[data-testid="community-habit-garden"], #community-celebrations-title',
        ),
      ).map((node) => node.getAttribute("data-testid") ?? node.id),
    );

    const garden = sequence.indexOf("community-habit-garden");
    expect(garden).toBeGreaterThanOrEqual(0);

    /* Las celebraciones dependen de que alguien haya compartido un hito: si la comunidad todavía
       no publicó ninguno, la lista no se pinta y no hay orden que afirmar. */
    const celebrations = sequence.indexOf("community-celebrations-title");
    if (celebrations !== -1) {
      expect(celebrations).toBeGreaterThan(garden);
    }
  });
});
