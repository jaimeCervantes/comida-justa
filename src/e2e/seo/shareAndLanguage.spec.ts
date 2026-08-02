import { expect, test } from "@playwright/test";
import { alternateUrl, canonicalUrl, meta } from "../testUtils/metaTags";

// Slice 3 de docs/features/seo.md. Corre contra publicaciones que ya existen en el catálogo
// —una con foto y otra en video—, así que no siembra nada y no tiene nada que limpiar.
const CON_FOTO = "jugo-verde";
const EN_VIDEO = "la-clave-para-dormir-profundo";
const SITE = "http://localhost:3000";

test.describe("Cuando alguien comparte una publicación en video", () => {
  test("Entonces la vista previa lleva una imagen, no el archivo de video", async ({
    page,
  }) => {
    await page.goto(`/${EN_VIDEO}`);

    const image = await meta(page, "og:image");

    // Era el .mp4: WhatsApp mostraba un hueco gris en 8 de las 24 publicaciones.
    expect(image).not.toContain(".mp4");
    expect(image).toContain("logo.webp");
    expect(await meta(page, "og:video")).toContain(".mp4");
    // Sin imagen propia, la tarjeta grande solo estira el logo.
    expect(await meta(page, "twitter:card")).toBe("summary");
  });
});

test.describe("Cuando alguien comparte una publicación con foto", () => {
  test("Entonces sigue viéndose su foto y la tarjeta grande", async ({
    page,
  }) => {
    await page.goto(`/${CON_FOTO}`);

    const image = await meta(page, "og:image");

    expect(image).toBeTruthy();
    expect(image).not.toContain("logo.webp");
    expect(await meta(page, "og:video")).toBeNull();
    expect(await meta(page, "twitter:card")).toBe("summary_large_image");
  });
});

test.describe("Cuando un rastreador visita una página traducida", () => {
  const traducidas = [
    { ruta: "/nosotros", es: "/nosotros", en: "/en/about" },
    { ruta: "/en/about", es: "/nosotros", en: "/en/about" },
    { ruta: "/productos", es: "/productos", en: "/en/products" },
    {
      ruta: "/condiciones-de-servicio",
      es: "/condiciones-de-servicio",
      en: "/en/terms-of-service",
    },
  ];

  for (const { ruta, es, en } of traducidas) {
    test(`Entonces ${ruta} es canónica de sí misma y declara su pareja`, async ({
      page,
    }) => {
      await page.goto(ruta);

      const esperado = ruta.startsWith("/en") ? en : es;

      expect(await canonicalUrl(page)).toBe(`${SITE}${esperado}`);
      expect(await alternateUrl(page, "es")).toBe(`${SITE}${es}`);
      expect(await alternateUrl(page, "en")).toBe(`${SITE}${en}`);
      // Quien llega sin pedir idioma se queda en el que se sirve sin prefijo.
      expect(await alternateUrl(page, "x-default")).toBe(`${SITE}${es}`);
    });
  }
});

test.describe("Cuando un rastreador visita una publicación en inglés", () => {
  test("Entonces apunta al español y no declara pareja de idiomas", async ({
    page,
  }) => {
    await page.goto(`/en/${CON_FOTO}`);

    // El contenido sale de `post_translations`, que hoy solo tiene filas en español.
    expect(await canonicalUrl(page)).toBe(`${SITE}/${CON_FOTO}`);
    expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBe(
      0,
    );
  });
});

test.describe("Cuando un rastreador lee las directivas del sitio", () => {
  test("Entonces se le pide la vista previa de imagen grande", async ({
    page,
  }) => {
    await page.goto(`/${CON_FOTO}`);

    expect(await meta(page, "robots")).toContain("max-image-preview:large");
  });

  test("Entonces la búsqueda sigue pidiendo no ser indexada", async ({
    page,
  }) => {
    await page.goto("/buscar");

    const robots = await meta(page, "robots");

    expect(robots).toContain("noindex");
    // La directiva heredada no debe colarse en una página que pide lo contrario.
    expect(robots).not.toContain("max-image-preview");
  });
});
