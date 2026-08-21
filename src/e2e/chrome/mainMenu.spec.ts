import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";

/**
 * Slice 2 de `docs/features/platform/007-2026-08-21-chrome-v2.md`.
 *
 * Qué ruta pertenece a qué sección lo prueba Vitest sobre `activeMenuSection`
 * (`src/presentation/chrome/Header/menuItems.test.ts`): es aritmética sobre la plantilla interna y
 * no necesita navegador. Aquí se prueba lo que **solo** se ve en el navegador — que la marca llega
 * al enlace real, que un lector de pantalla la oye, y que el menú del teléfono no contradice al de
 * escritorio.
 *
 * La suite corre en español (`playwright.config.ts` fija `locale: "es-MX"`).
 */
const BARRA = "desktop-menu";

test.describe("La barra principal marca en qué sección estás", () => {
  test("En una página de pilar, «4 Pilares» se anuncia como la página actual", async ({
    page,
  }) => {
    await page.goto("/pilares/alimentacion");

    const barra = page.getByTestId(BARRA);
    const actual = barra.locator('a[aria-current="page"]');

    await expect(actual).toHaveCount(1);
    await expect(actual).toContainText(es.nav.pillarsMenu);
  });

  test("Y en el inicio la marca se la lleva «Comunidad»", async ({ page }) => {
    await page.goto("/");

    const actual = page.getByTestId(BARRA).locator('a[aria-current="page"]');

    await expect(actual).toHaveCount(1);
    await expect(actual).toContainText(es.nav.communityMenu);
  });

  /*
   * La píldora dice "estás en esta sección del menú", no "esto se le parece". El carrito no es una
   * sección, así que ninguna se marca — y eso es una respuesta, no un olvido.
   */
  test("Pero en el carrito no marca ninguna, porque no es una sección del menú", async ({
    page,
  }) => {
    await page.goto("/carrito");

    await expect(
      page.getByTestId(BARRA).locator('a[aria-current="page"]'),
    ).toHaveCount(0);
  });
});

test.describe("«4 Pilares» lleva los cuatro colores de la rampa", () => {
  test("Enseña cuatro puntos, y son decorativos para un lector de pantalla", async ({
    page,
  }) => {
    await page.goto("/");

    const puntos = page.getByTestId(BARRA).getByTestId("nav-pillar-dots");

    /*
     * `aria-hidden` es lo que hace legítimo que los cuatro colores vayan juntos: ningún punto
     * identifica a un pilar concreto —quien nombra es la etiqueta «4 Pilares»—, así que quien no
     * distingue los tonos, o no los ve en absoluto, no se pierde nada.
     */
    await expect(puntos).toHaveAttribute("aria-hidden", "true");
    await expect(puntos.locator("span")).toHaveCount(4);
  });
});

test.describe("El menú del teléfono dice lo mismo que el de escritorio", () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test("En «/productos», «Comunidad» aparece como la sección actual", async ({
    page,
  }) => {
    await page.goto("/productos");

    await page.getByRole("button", { name: es.nav.openMenu }).click();

    const menu = page.getByTestId("mobile-menu");
    const actual = menu.locator('a[aria-current="page"]');

    await expect(actual).toHaveCount(1);
    await expect(actual).toContainText(es.nav.communityMenu);
  });
});
