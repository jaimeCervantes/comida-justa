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
    home: "/",
    cta: es.habitCommunity.invitation.cta,
    destination: /\/pilares\/?$/,
    heading: overviewHeading(es.pillarsOverview.heading),
  },
  {
    locale: "inglés",
    home: "/en",
    cta: en.habitCommunity.invitation.cta,
    destination: /\/en\/pillars\/?$/,
    heading: overviewHeading(en.pillarsOverview.heading),
  },
] as const;

test.describe("La invitación a practicar del inicio", () => {
  for (const { locale, home, cta, destination, heading } of invitations) {
    test(`en ${locale} lleva al hub de los cuatro pilares`, async ({
      page,
    }) => {
      await page.goto(home);

      await page
        .getByTestId("community-practice-invitation")
        .getByRole("link", { name: cta })
        .click();

      await expect(page).toHaveURL(destination);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    });
  }

  /* El jardín cuenta lo que la comunidad lleva hecho y el feed es otra conversación. La invitación
     solo hace su trabajo entre los dos: pegada al número que la motiva y antes de que la portada
     cambie de tema. */
  test("se lee entre la actividad de la comunidad y el feed", async ({
    page,
  }) => {
    await page.goto("/");

    const sequence = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll(
          '[data-testid="community-habit-garden"], #community-celebrations-title, [data-testid="community-practice-invitation"], [data-testid="feed-masonry"]',
        ),
      ).map((node) => node.getAttribute("data-testid") ?? node.id),
    );

    const invitation = sequence.indexOf("community-practice-invitation");
    expect(invitation).toBeGreaterThan(
      sequence.indexOf("community-habit-garden"),
    );
    expect(invitation).toBeLessThan(sequence.indexOf("feed-masonry"));

    /* Las celebraciones dependen de que alguien haya compartido un hito: si la comunidad todavía
       no publicó ninguno, la lista no se pinta y no hay orden que afirmar. */
    const celebrations = sequence.indexOf("community-celebrations-title");
    if (celebrations !== -1) {
      expect(invitation).toBeGreaterThan(celebrations);
    }
  });
});
