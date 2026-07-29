import { expect, test } from "@playwright/test";
import AboutPage from "./AboutPage";

// Slice 1 — `/info` became `/nosotros` and entered the main menu.
// No seeding: the page is static content, nothing is written to the database.
test.describe("When a visitor looks for what Hazlo Sano is", () => {
  test("Then the main menu leads to the brand page", async ({ page }) => {
    const aboutPage = new AboutPage(page);

    await page.goto("/");
    await aboutPage.openFromMainMenu();

    await aboutPage.expectOnAboutPage();
  });

  test("Then the old /info URL redirects permanently to /nosotros", async ({
    page,
  }) => {
    const aboutPage = new AboutPage(page);

    // Sin seguir la cadena: en el navegador, next-intl añade después su propio 307 hacia
    // `/en/...` cuando el Accept-Language no es español, y ese sería el último salto.
    // Lo que le importa a un buscador es el primero: un 308 (permanente) hacia `/nosotros`.
    const redirect = await page.request.get("/info", { maxRedirects: 0 });

    expect(redirect.status()).toBe(308);
    expect(redirect.headers()["location"]).toBe("/nosotros");

    await page.goto("/info");
    await aboutPage.expectOnAboutPage();
  });
});
