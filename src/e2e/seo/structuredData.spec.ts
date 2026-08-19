import { expect, type Page, test } from "@playwright/test";

// Slice 4 de docs/features/content/003-2026-08-01-seo.md. Corre contra lo que ya existe en el catálogo: "Jugo Verde"
// (producto de 40, disponible), "La clave para dormir profundo" (anuncio en video) y la tienda
// "hazlo-sano" con su sucursal de Tezonapa. No siembra nada.
type JsonLdNode = Record<string, unknown>;

/** Todos los nodos de JSON-LD de la página, aplanando los documentos que traen un arreglo. */
async function structuredData(page: Page): Promise<JsonLdNode[]> {
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();

  return blocks.flatMap((block) => {
    const parsed = JSON.parse(block);

    return Array.isArray(parsed) ? parsed : [parsed];
  });
}

const nodeOfType = (
  nodes: JsonLdNode[],
  type: string,
): JsonLdNode | undefined => nodes.find((node) => node["@type"] === type);

test.describe("Cuando un buscador lee un producto", () => {
  test("Entonces encuentra su precio y su disponibilidad", async ({ page }) => {
    await page.goto("/jugo-verde");

    const product = nodeOfType(await structuredData(page), "Product");

    expect(product).toBeDefined();
    expect(product).toMatchObject({
      name: "Jugo Verde",
      offers: {
        "@type": "Offer",
        price: "40",
        priceCurrency: "MXN",
        availability: "https://schema.org/InStock",
      },
    });
    // La imagen tiene que ser pedible: en JSON-LD nadie resuelve una relativa.
    expect(String(product?.image)).toMatch(/^https?:\/\//);
  });
});

test.describe("Cuando un buscador lee un anuncio en video", () => {
  test("Entonces encuentra el artículo y el video por separado", async ({
    page,
  }) => {
    await page.goto("/la-clave-para-dormir-profundo");

    const nodes = await structuredData(page);

    expect(nodeOfType(nodes, "Article")).toMatchObject({
      headline: "La clave para dormir profundo",
    });

    const video = nodeOfType(nodes, "VideoObject");

    expect(String(video?.contentUrl)).toContain(".mp4");
    expect(video).toHaveProperty("uploadDate");
  });
});

test.describe("Cuando un buscador lee la tienda", () => {
  test("Entonces encuentra dónde está", async ({ page }) => {
    await page.goto("/tienda/hazlo-sano");

    const business = nodeOfType(await structuredData(page), "LocalBusiness");

    expect(business).toMatchObject({
      name: "Hazlo Sano",
      address: { "@type": "PostalAddress" },
      geo: { "@type": "GeoCoordinates" },
    });
    expect(business).toHaveProperty("telephone");
  });
});

test.describe("Cuando un rastreador no ejecuta JavaScript", () => {
  test("Entonces los datos ya vienen en el HTML del servidor", async ({
    request,
  }) => {
    // Es la comprobación que un navegador no puede hacer: en el DOM el script aparece igual
    // aunque lo hubiera puesto la hidratación, y quien rastrea suele leer solo esta respuesta.
    const html = await (await request.get("/jugo-verde")).text();

    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"Product"');
  });
});

test.describe("Cuando un buscador lee el inicio", () => {
  test("Entonces sabe quién publica el sitio", async ({ page }) => {
    await page.goto("/");

    const nodes = await structuredData(page);
    const organization = nodeOfType(nodes, "Organization");

    expect(organization).toMatchObject({ name: "Hazlo Sano" });
    expect(organization?.sameAs).toBeInstanceOf(Array);
    expect(nodeOfType(nodes, "WebSite")).toMatchObject({
      publisher: { "@id": organization?.["@id"] },
    });
  });
});
