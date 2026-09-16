import { expect, test } from "@playwright/test";

/**
 * `feedbackLink.feature`. No hace falta sesión ni base: el enlace es estático, calculado en el
 * servidor a partir de una constante y del catálogo de mensajes.
 */
test.describe("Dado que abro el sitio", () => {
  test.describe("Y una ventana de escritorio", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/");
    });

    test("Entonces el icono de retroalimentación está en la cabecera, junto al carrito", async ({
      page,
    }) => {
      const link = page.getByTestId("feedback-link-header");

      await expect(link).toBeVisible();
      await expect(link).toHaveAccessibleName("¿Qué te hace falta?");
      await expect(link).toHaveAttribute(
        "href",
        /^https:\/\/wa\.me\/522781126948\?text=/,
      );
      await expect(link).toHaveAttribute("target", "_blank");

      // Vive al lado del carrito, no perdido en otra parte de la cabecera.
      const header = page.locator("header");
      const cart = header.getByTestId("cart-link");
      await expect(cart).toBeVisible();
    });
  });

  test.describe("Y una ventana de teléfono", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");
    });

    test("Entonces vive en el menú de hamburguesa, no como un icono de la cabecera", async ({
      page,
    }) => {
      await expect(page.getByTestId("feedback-link-header")).toBeHidden();

      await page.getByRole("button", { name: /abrir menú/i }).click();
      const link = page.getByTestId("feedback-link-mobile");

      await expect(link).toBeVisible();
      await expect(link).toHaveText("¿Qué te hace falta?");
      await expect(link).toHaveAttribute(
        "href",
        /^https:\/\/wa\.me\/522781126948\?text=/,
      );
    });

    test("Y la barra inferior sigue con sus cinco lugares de siempre", async ({
      page,
    }) => {
      await expect(page.getByTestId("bottom-nav").locator("li")).toHaveCount(5);
    });
  });

  test("Entonces el pie también ofrece el enlace, distinto del WhatsApp de contacto", async ({
    page,
  }) => {
    await page.goto("/");

    const feedback = page.getByTestId("feedback-link-footer");
    await expect(feedback).toBeVisible();
    await expect(feedback).toHaveText("💬 ¿Qué te hace falta?");
    await expect(feedback).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/522781126948\?text=/,
    );

    // El WhatsApp de contacto de siempre sigue ahí, sin que el nuevo lo reemplace.
    await expect(page.getByText("📱 WhatsApp Directo")).toBeVisible();
  });
});
