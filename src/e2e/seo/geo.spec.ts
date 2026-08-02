import { expect, test } from "@playwright/test";

// Slice 7 de docs/features/seo.md. Todo se pide como documento: es como lo lee un rastreador.
const AGENTES = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"];

test.describe("Cuando un asistente lee robots.txt", () => {
  test("Entonces encuentra su nombre con permiso explícito", async ({
    request,
  }) => {
    const body = await (await request.get("/robots.txt")).text();

    for (const agente of AGENTES) {
      expect(body, `${agente} debería estar declarado`).toContain(
        `User-Agent: ${agente}`,
      );
    }

    /* El grupo propio hace que ignoren el de `*`, así que lo privado tiene que estar repetido:
       declarar los agentes y olvidar el Disallow les abriría /cuenta de par en par. Los grupos
       van separados por una línea en blanco. */
    const grupos = body
      .split(/\n\s*\n/)
      .filter((grupo) => grupo.includes("User-Agent:"));

    expect(grupos.length).toBeGreaterThan(1);

    for (const grupo of grupos) {
      expect(grupo).toContain("Allow: /");
      expect(grupo).toContain("Disallow: /cuenta");
      expect(grupo).toContain("Disallow: /admin/");
    }
  });
});

test.describe("Cuando un asistente pide el índice del sitio", () => {
  test("Entonces /llms.txt dice qué es y qué hay", async ({ request }) => {
    const response = await request.get("/llms.txt");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");

    const body = await response.text();

    expect(body.startsWith("# Hazlo Sano")).toBe(true);
    // La cita de la convención: la frase que dice qué es el sitio.
    expect(body).toContain("\n> ");
    // Los encabezados salen del catálogo, los mismos que ve un visitante en el menú.
    expect(body).toContain("## Publicaciones");
    expect(body).toContain("## Tiendas");
    expect(body).toContain("](http");
    expect(body).toContain("/jugo-verde)");
  });
});

test.describe("Cuando alguien sigue el sitio por un lector", () => {
  test("Entonces el feed trae lo último con su fecha", async ({ request }) => {
    const response = await request.get("/rss.xml");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/rss+xml");

    const xml = await response.text();

    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("/jugo-verde</link>");
    expect(xml).toContain("<pubDate>");
  });

  test("Entonces el inicio dice dónde está el feed", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.locator('link[type="application/rss+xml"]'),
    ).toHaveAttribute("href", /\/rss\.xml$/);
  });
});
