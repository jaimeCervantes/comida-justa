import { describe, expect, it } from "vitest";
import { buildRssFeed } from "./rss";

const BASE = "https://hazlosano.com";

const feed = {
  baseUrl: BASE,
  title: "Hazlo Sano",
  description: "Lo que publica la comunidad.",
  language: "es",
  items: [
    {
      title: "Jugo Verde",
      path: "/jugo-verde",
      content: "Nopal, apio, piña y perejil.",
      publishedAt: new Date("2026-07-25T12:00:00.000Z"),
    },
  ],
};

describe("buildRssFeed", () => {
  it("declara el canal con su enlace propio", () => {
    const xml = buildRssFeed(feed);

    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain(`<link>${BASE}/</link>`);
    expect(xml).toContain(`href="${BASE}/rss.xml"`);
  });

  it("publica cada entrada con su enlace, su resumen y su fecha", () => {
    const xml = buildRssFeed(feed);

    expect(xml).toContain("<title>Jugo Verde</title>");
    expect(xml).toContain(`<link>${BASE}/jugo-verde</link>`);
    expect(xml).toContain(
      "<description>Nopal, apio, piña y perejil.</description>",
    );
    expect(xml).toContain("<pubDate>Sat, 25 Jul 2026 12:00:00 GMT</pubDate>");
  });

  it("usa la dirección como identificador permanente", () => {
    expect(buildRssFeed(feed)).toContain(
      `<guid isPermaLink="true">${BASE}/jugo-verde</guid>`,
    );
  });

  // El título lo escribe la comunidad: un "&" suelto invalida el documento entero.
  it.each([
    ["Pan & Café", "Pan &amp; Café"],
    ["<script>alert(1)</script>", "&lt;script&gt;alert(1)&lt;/script&gt;"],
    ['Pan "artesanal"', "Pan &quot;artesanal&quot;"],
  ])("escapa %j en el título", (title, expected) => {
    const xml = buildRssFeed({
      ...feed,
      items: [{ title, path: "/pan" }],
    });

    expect(xml).toContain(`<title>${expected}</title>`);
  });

  it("omite fecha y resumen cuando la publicación no los tiene", () => {
    const xml = buildRssFeed({
      ...feed,
      items: [{ title: "Sin datos", path: "/sin-datos" }],
    });

    expect(xml).not.toContain("<pubDate>");
    expect(xml).not.toContain("<description>Sin datos");
  });

  it("sigue siendo un documento válido sin publicaciones", () => {
    const xml = buildRssFeed({ ...feed, items: [] });

    expect(xml).toContain("<channel>");
    expect(xml).toContain("</rss>");
    expect(xml).not.toContain("<item>");
  });
});
