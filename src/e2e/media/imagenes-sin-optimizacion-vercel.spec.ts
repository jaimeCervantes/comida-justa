import { expect, type Page, test } from "@playwright/test";

/**
 * Escenario en `src/e2e/media/imagenes-sin-optimizacion-vercel.feature`.
 *
 * El bug de producción ocurre en el HTML que genera `next/image`: si la imagen sale como
 * `/_next/image?...`, Vercel vuelve a pasar por Image Optimization y puede responder 402. Aquí se
 * mira el `src` real en navegador, no la config aislada.
 */

const STORAGE_HOSTS = [
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
] as const;

function isStorageImage(src: string): boolean {
  return STORAGE_HOSTS.some((host) => src.includes(host));
}

function isDirectStorageImage(src: string): boolean {
  return STORAGE_HOSTS.some((host) => src.startsWith(`https://${host}`));
}

async function storageImageSources(page: Page): Promise<string[]> {
  return page
    .locator("img")
    .evaluateAll((images) =>
      (images as HTMLImageElement[])
        .map((image) => image.currentSrc || image.src)
        .filter((src) =>
          ["firebasestorage.googleapis.com", "storage.googleapis.com"].some(
            (host) => src.includes(host),
          ),
        ),
    );
}

test("una imagen remota de Storage no se reescribe por /_next/image", async ({
  page,
}) => {
  await page.goto("/");

  await expect
    .poll(async () => (await storageImageSources(page)).length)
    .toBeGreaterThan(0);

  const sources = await storageImageSources(page);

  expect(sources.some(isStorageImage)).toBe(true);
  expect(sources.some(isDirectStorageImage)).toBe(true);
  expect(sources.every((src) => !src.includes("/_next/image"))).toBe(true);
});
