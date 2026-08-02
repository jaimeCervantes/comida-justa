import type { Page } from "@playwright/test";

/**
 * Lee una meta por `property` (Open Graph) o por `name` (las clásicas), y devuelve `null` cuando
 * no está.
 *
 * Lo segundo es el motivo de que esto exista: `page.locator(...).first().getAttribute()` sobre una
 * meta ausente **espera** hasta agotar el timeout en vez de devolver `null`, así que afirmar que
 * algo *no* se anuncia costaba 90 segundos y un falso rojo.
 */
export async function meta(page: Page, key: string): Promise<string | null> {
  for (const selector of [`meta[property="${key}"]`, `meta[name="${key}"]`]) {
    const locator = page.locator(selector);

    if ((await locator.count()) > 0) {
      return locator.first().getAttribute("content");
    }
  }

  return null;
}

export async function canonicalUrl(page: Page): Promise<string | null> {
  return page.locator('link[rel="canonical"]').getAttribute("href");
}

/** El `href` que declara la página para un idioma (`es`, `en`, `x-default`). */
export async function alternateUrl(
  page: Page,
  hreflang: string,
): Promise<string | null> {
  return page
    .locator(`link[rel="alternate"][hreflang="${hreflang}"]`)
    .getAttribute("href");
}
