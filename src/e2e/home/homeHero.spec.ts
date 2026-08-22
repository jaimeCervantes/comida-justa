import { expect, test } from "@playwright/test";
import es from "~/i18n/messages/es.json";

/**
 * Slice 1 de `docs/features/platform/008-2026-08-21-home-v2.md`.
 *
 * El plural del rótulo y los destinos de los CTA los cubre Vitest
 * (`src/app/(home)/HomeHero.test.tsx`). Aquí se prueba lo que **solo** se ve en el navegador: que
 * el titular llega a la página con su tamaño y su tipografía de verdad.
 *
 * Importa porque ya falló en silencio: `text-display` se caía del `class` —tailwind-merge lo tomaba
 * por un color de texto— y el titular salía a 16px en una serif, sin que `tsc`, el build ni ninguna
 * prueba de componente lo vieran.
 */
test.describe("La portada del home", () => {
  test("Se presenta antes de enseñar el catálogo", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Cuidar tu salud/i,
    );
    await expect(page.getByText(/Tezonapa, Veracruz/)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: es.feed.latestHeading }),
    ).toBeVisible();
  });

  test("Y el titular se pinta al tamaño de portada, con la serif de la marca", async ({
    page,
  }) => {
    await page.goto("/");

    const titular = page.getByRole("heading", { level: 1 });
    const estilo = await titular.evaluate((node) => {
      const computed = getComputedStyle(node);

      return {
        fontSize: Number.parseFloat(computed.fontSize),
        fontFamily: computed.fontFamily,
      };
    });

    // `--fs-display` son 3.5rem = 56px. Lo que se comprueba es que no cayó al cuerpo.
    expect(estilo.fontSize).toBeGreaterThanOrEqual(40);
    expect(estilo.fontFamily).toMatch(/newsreader/i);
  });

  for (const [cta, destino] of [
    [es.home.browseCta, "/productos"],
    [es.home.publishCta, "/publicar"],
  ] as const) {
    test(`Y «${cta}» es un enlace a ${destino}`, async ({ page }) => {
      await page.goto("/");

      await expect(
        page.getByRole("link", { name: cta, exact: true }),
      ).toHaveAttribute("href", destino);
    });
  }
});
