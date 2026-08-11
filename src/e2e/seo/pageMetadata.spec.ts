import { expect, test } from "@playwright/test";
import { canonicalUrl, meta } from "../testUtils/metaTags";

// Slice 2 de docs/features/seo.md.
// "Jugo Verde" existe en el catálogo con su imagen; no hace falta sembrar nada.
const JUGO_VERDE = { slug: "jugo-verde", title: "Jugo Verde" };

test.describe("Cuando alguien comparte una publicación", () => {
  test("Entonces el enlace lleva su título, su descripción y su imagen", async ({
    page,
  }) => {
    await page.goto(`/${JUGO_VERDE.slug}`);

    // Antes de este slice el título era "Hazlo Sano" para las 24 publicaciones.
    await expect(page).toHaveTitle(new RegExp(JUGO_VERDE.title, "i"));

    const description = await meta(page, "description");
    expect(description?.length).toBeGreaterThan(0);

    expect(await meta(page, "og:title")).toContain(JUGO_VERDE.title);
    expect(await meta(page, "og:image")).toBeTruthy();
    expect(await meta(page, "og:url")).toContain(`/${JUGO_VERDE.slug}`);

    expect(await canonicalUrl(page)).toContain(`/${JUGO_VERDE.slug}`);
  });
});

test.describe("Cuando un rastreador visita las secciones fijas", () => {
  test("Entonces cada pilar dice qué es", async ({ page }) => {
    await page.goto("/pilares/alimentacion");

    await expect(page).toHaveTitle(/alimentación/i);
    expect((await meta(page, "description"))?.length).toBeGreaterThan(0);

    await page.goto("/pilares");
    await expect(page).toHaveTitle(/4 pilares/i);
  });

  test("Entonces las prácticas se describen sin lenguaje interno", async ({
    page,
  }) => {
    const routes = [
      ["/habitos", /at[oó]mico|onboarding/i],
      ["/habitos/sueno", /at[oó]mico|onboarding/i],
      ["/habitos/alimentacion", /at[oó]mico|onboarding/i],
      ["/habitos/movimiento", /at[oó]mico|onboarding/i],
      ["/habitos/mente-espiritu", /at[oó]mico|onboarding/i],
      ["/en/habits", /atomic|onboarding/i],
      ["/en/habits/sleep", /atomic|onboarding/i],
      ["/en/habits/nutrition", /atomic|onboarding/i],
      ["/en/habits/movement", /atomic|onboarding/i],
      ["/en/habits/mind-spirit", /atomic|onboarding/i],
    ] as const;

    for (const [path, internalTerms] of routes) {
      await page.goto(path);
      expect(await meta(page, "description"), path).not.toMatch(internalTerms);
    }
  });
});

test.describe("Cuando un rastreador visita lo que no es contenido", () => {
  // `/publicar` no está en la lista porque sin sesión redirige a `/auth/signin`: probarla aquí
  // sería comprobar dos veces la misma página. Su `noindex` es una constante compartida.
  for (const path of ["/auth/signin", "/buscar"]) {
    test(`Entonces ${path} pide no ser indexada`, async ({ page }) => {
      await page.goto(path);

      const robots = await page
        .locator('meta[name="robots"]')
        .first()
        .getAttribute("content");

      expect(robots, `${path} debería declarar noindex`).toContain("noindex");
    });
  }
});
