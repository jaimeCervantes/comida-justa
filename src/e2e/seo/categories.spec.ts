import { expect, test } from "@playwright/test";
import { meta } from "../testUtils/metaTags";

// Slice 5 de docs/features/content/003-2026-08-01-seo.md. Corre contra la taxonomía real: `alimentacion` y `panaderia`
// tienen publicaciones; `abarrotes` está activa y vacía.
const CON_CONTENIDO = ["alimentacion", "panaderia"];
const VACIAS = ["abarrotes"];
const PAN = "pan-de-masa-madre-natural";

test.describe("Cuando un rastreador pide el sitemap", () => {
  test("Entonces encuentra las categorías con publicaciones y no las vacías", async ({
    request,
  }) => {
    const xml = await (await request.get("/sitemap.xml")).text();

    for (const key of CON_CONTENIDO) {
      expect(xml, `/categoria/${key} debería estar`).toContain(
        `/categoria/${key}<`,
      );
    }

    for (const key of VACIAS) {
      // Una lista vacía no es contenido: publicarla compite contra las que sí tienen algo.
      expect(xml, `/categoria/${key} no debería estar`).not.toContain(
        `/categoria/${key}<`,
      );
    }
  });
});

test.describe("Cuando un rastreador visita una categoría vacía", () => {
  test("Entonces pide no ser indexada, y la que tiene contenido no", async ({
    page,
  }) => {
    await page.goto("/categoria/abarrotes");
    expect(await meta(page, "robots")).toContain("noindex");

    await page.goto("/categoria/panaderia");
    expect(await meta(page, "robots")).not.toContain("noindex");
  });
});

test.describe("Cuando alguien abre una sub-categoría", () => {
  test("Entonces ve el camino y el buscador lo lee igual", async ({ page }) => {
    await page.goto("/categoria/panaderia");

    const breadcrumb = page.getByRole("navigation").filter({
      has: page.getByRole("link", { name: "Inicio" }),
    });

    await expect(
      breadcrumb.getByRole("link", { name: "Alimentación" }),
    ).toBeVisible();

    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const trail = blocks
      .map((block) => JSON.parse(block))
      .find((node) => node["@type"] === "BreadcrumbList");

    expect(trail).toBeDefined();

    const pasos = trail.itemListElement as Array<{ name: string }>;

    expect(pasos.map((paso) => paso.name)).toEqual([
      "Inicio",
      "Alimentación",
      "Panadería",
    ]);
  });
});

test.describe("Cuando alguien llega a una publicación desde un buscador", () => {
  test("Entonces la miga le deja subir al catálogo", async ({ page }) => {
    await page.goto(`/${PAN}`);

    const breadcrumb = page.getByRole("navigation").filter({
      has: page.getByRole("link", { name: "Inicio" }),
    });

    await expect(
      breadcrumb.getByRole("link", { name: "Panadería" }),
    ).toBeVisible();
    // El último paso es la página que se está viendo: se enseña, no se enlaza.
    await expect(
      breadcrumb.getByRole("link", { name: /Pan de Masa Madre Natural/i }),
    ).toHaveCount(0);
  });
});
