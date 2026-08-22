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
/*
 * El proyecto corre en `Desktop Chrome` (1280px), que es donde la portada existe. En un teléfono se
 * esconde a propósito y eso tiene su propio bloque abajo.
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

  /*
   * El canvas pone ahí una «foto de portada, mercado local, 4:3» que no existe como archivo. En vez
   * de un marcador de posición, la portada enseña lo último que publicó la comunidad: una foto real
   * que cambia sola. El enlace va por slug y no por el `to` del mapper, que llega absoluto y haría
   * recargar la página entera.
   */
  test("Y enseña lo último publicado, con su foto y su enlace interno", async ({
    page,
  }) => {
    await page.goto("/");

    const cover = page.getByTestId("home-cover");

    await expect(cover).toBeVisible();
    await expect(cover).toHaveAttribute("href", /^\/[^/]/);
    await expect(cover.locator("img").first()).toBeVisible();

    // Y lleva de verdad ahí: se compara la dirección, no el texto del rótulo.
    const href = await cover.getAttribute("href");
    await cover.click();
    await page.waitForURL(`**${href}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
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

/**
 * **La portada es de escritorio.**
 *
 * En un teléfono, entre la barra de ubicación, el mensaje de la comunidad y una portada a pantalla
 * completa, la primera tarjeta caía por debajo del pliegue: el sitio se presentaba en vez de
 * enseñar lo que la gente vino a ver. Así que ahí no se pinta.
 */
test.describe("En un teléfono", () => {
  test.use({ viewport: { width: 390, height: 820 } });

  test("La portada no se ve, y los productos empiezan arriba", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("home-cover")).toBeHidden();

    /* Lo que importa no es que la portada falte, sino que la mercancía entre en la primera
       pantalla. 820 es el alto del viewport de esta prueba. */
    const primeraTarjeta = await page.locator("article").first().boundingBox();
    expect(primeraTarjeta?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(820);
  });

  /*
   * Esconder con CSS no evita descargar: el HTML que sale del servidor es el mismo para todos los
   * tamaños. Sin `loading="lazy"` —o con un `preload`— el teléfono se traía entera una foto que
   * nunca iba a ver. Lo que lo impide es que una imagen diferida dentro de un `display: none` no
   * tiene caja, así que el navegador ni la pide.
   */
  test("Y no se descarga la foto de una portada que no se ve", async ({
    page,
  }) => {
    const anchos: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("yoga-espalda")) {
        anchos.push(request.url().match(/[&?]w=(\d+)/)?.[1] ?? "?");
      }
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    /* Una sola: la de la tarjeta del feed, que sí se ve. En escritorio son dos —la portada y la
       tarjeta— porque ahí las dos están en pantalla. */
    expect(anchos.length).toBeLessThanOrEqual(1);
  });
});
