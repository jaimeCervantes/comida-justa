import { expect, type Page, test } from "@playwright/test";

/**
 * Lo que se afirma aquí es **que la puerta lleva escrito el regreso**, no el viaje entero: el ida y
 * vuelta con Google no se puede conducir desde la suite —por eso `simulateLogin` inyecta la cookie
 * de sesión y se salta el consentimiento—. El tramo que queda fuera está cubierto por
 * `src/infra/auth/returnPath.test.ts` (qué destino se conserva) y por
 * `SignInOptions.test.tsx` (que la pantalla lo reenvía a next-auth).
 */

/** La puerta y el regreso, leídos de la dirección donde se acabe. */
function doorOf(page: Page): { screen: string; returnTo: string | null } {
  const url = new URL(page.url());

  return {
    screen: url.pathname,
    returnTo: url.searchParams.get("callbackUrl"),
  };
}

/** El regreso escrito en un enlace de la página, resuelto contra la dirección actual. */
async function returnToOf(page: Page, testId: string): Promise<string | null> {
  const href = await page.getByTestId(testId).getAttribute("href");

  return new URL(href ?? "", page.url()).searchParams.get("callbackUrl");
}

test.describe("When a private page turns a visitor away", () => {
  /* El idioma va **dentro** del destino: con `localePrefix: "as-needed"` el español va desnudo y
     solo el inglés se prefija, así que el regreso sin `/en` devolvería al otro idioma. */
  const PRIVATE_PAGES = [
    { route: "/pedidos", screen: "/auth/signin", returnTo: "/pedidos" },
    { route: "/en/orders", screen: "/en/auth/signin", returnTo: "/en/orders" },
    { route: "/publicar", screen: "/auth/signin", returnTo: "/publicar" },
    {
      route: "/en/publish",
      screen: "/en/auth/signin",
      returnTo: "/en/publish",
    },
  ];

  for (const { route, screen, returnTo } of PRIVATE_PAGES) {
    test(`Then ${route} sends to the sign-in screen remembering the way back`, async ({
      page,
    }) => {
      await page.goto(route);

      expect(doorOf(page)).toEqual({ screen, returnTo });
    });
  }
});

test.describe("When a visitor without a session wants to attend an event", () => {
  /* La misma publicación en los dos idiomas, y con slug propio en cada uno: es lo que hace que el
     prefijo importe — `/walk-to-la-luisa` sin `/en` delante no lleva a ninguna parte. */
  const EVENT = [
    { route: "/caminata-a-la-luisa", returnTo: "/caminata-a-la-luisa" },
    { route: "/en/walk-to-la-luisa", returnTo: "/en/walk-to-la-luisa" },
  ];

  for (const { route, returnTo } of EVENT) {
    test(`Then the door offered in ${route} comes back to it`, async ({
      page,
    }) => {
      await page.goto(route);

      const door = page
        .getByTestId("post-detail")
        .locator('a[href*="/auth/signin"]')
        .first();

      await expect(door).toBeVisible();
      expect(
        new URL(
          (await door.getAttribute("href")) ?? "",
          page.url(),
        ).searchParams.get("callbackUrl"),
      ).toBe(returnTo);
    });
  }
});

test.describe("When a visitor without a session wants to follow a store", () => {
  test("Then following offers the door back to the store", async ({ page }) => {
    await page.goto("/tienda/hazlo-sano");

    await expect(page.getByTestId("follow-signin")).toBeVisible();
    expect(await returnToOf(page, "follow-signin")).toBe("/tienda/hazlo-sano");
  });
});

test.describe("When a visitor signs in from the header", () => {
  /* El botón del encabezado está en todas las páginas y no sabe en cuál: el origen sale del
     `Referer` de su propia acción, que es la dirección real del navegador. */
  test("Then the sign-in screen remembers the page they were reading", async ({
    page,
  }) => {
    await page.goto("/caminata-a-la-luisa");

    await page
      .getByRole("banner")
      .getByRole("button", { name: "Iniciar sesión" })
      .click();

    await page.waitForURL(/auth\/signin/);

    expect(doorOf(page)).toEqual({
      screen: "/auth/signin",
      returnTo: "/caminata-a-la-luisa",
    });
  });
});
