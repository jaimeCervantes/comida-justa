import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import { testSlug } from "../testUtils/testSlug";

// Slice 1 de docs/features/seo.md.
const seeded = {
  title: `E2E Publicación para el sitemap ${Date.now()}`,
  slug: testSlug("publicacion-para-el-sitemap"),
  kind: "producto" as const,
  origin: null,
};

test.describe("Cuando un rastreador pide el sitemap", () => {
  test.beforeEach(async () => {
    await seedPost(seeded);
  });

  test.afterEach(async () => {
    await deleteOnePostBySlug(seeded.slug);
  });

  test("Entonces encuentra lo que existe y no lo que no", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");

    expect(response.status()).toBe(200);

    const xml = await response.text();

    // Páginas fijas con contenido real.
    expect(xml).toContain("<loc>http://localhost:3000/</loc>");
    expect(xml).toContain("/productos<");
    expect(xml).toContain("/nosotros<");
    expect(xml).toContain("/pilares/alimentacion<");

    // Lo que hay en la base: la publicación recién sembrada y la tienda real.
    expect(xml).toContain(`/${seeded.slug}<`);
    expect(xml).toContain("/tienda/hazlo-sano<");
  });

  test("Entonces no lista los stubs que responden 404 ni lo privado", async ({
    request,
  }) => {
    const xml = await (await request.get("/sitemap.xml")).text();

    /* `/negocios-locales` y `/productores-locales` salieron de esta lista al entregarse: ya no son
       stubs, y ahora entran al sitemap **si tienen contenido**, que es lo que comprueba
       `directories.spec.ts`. Las otras cuatro secciones siguen siendo 404. */
    for (const path of [
      "/deportes",
      "/habitos",
      "/medio-ambiente",
      "/salud-infantil",
      "/cuenta",
      "/publicar",
      "/editar",
      "/admin",
    ]) {
      expect(xml, `${path} no debería estar en el sitemap`).not.toContain(
        `${path}<`,
      );
    }
  });

  test("Entonces las secciones excluidas siguen respondiendo 404 de verdad", async ({
    request,
  }) => {
    // Si algún día dejan de ser stubs, esta prueba falla y recuerda meterlas al sitemap.
    for (const path of ["/deportes", "/habitos", "/salud-infantil"]) {
      const response = await request.get(path);

      expect(response.status(), `${path} ya no es un stub`).toBe(404);
    }
  });
});

test.describe("Cuando un rastreador pide robots.txt", () => {
  test("Entonces se le permite el contenido y se le niega lo privado", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");

    expect(response.status()).toBe(200);

    const body = await response.text();

    expect(body).toContain("Allow: /");
    expect(body).toContain("Sitemap:");

    for (const path of ["/cuenta", "/editar/", "/admin/", "/api/", "/buscar"]) {
      expect(body).toContain(`Disallow: ${path}`);
    }
  });
});
