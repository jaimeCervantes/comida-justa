import { buildMetaDescription } from "./description";
import { absoluteUrl } from "./url";

export interface FeedItem {
  title: string;
  path: string;
  content?: string | null;
  publishedAt?: Date | null;
}

export interface RssFeedInput {
  baseUrl: string;
  title: string;
  description: string;
  language: string;
  items: readonly FeedItem[];
}

/**
 * Escapa lo que rompería el XML.
 *
 * El título y el texto los escribe la comunidad: un "&" o un "<" sueltos convierten el feed en un
 * documento inválido que ningún lector abre. Es el mismo cuidado que el `<` del JSON-LD, por el
 * mismo motivo.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * El feed de lo último que se publicó.
 *
 * Sirve a dos públicos que piden lo mismo por caminos distintos: quien sigue el sitio desde un
 * lector, y los rastreadores —de buscadores y de asistentes— que usan el feed para enterarse de lo
 * nuevo sin volver a recorrer el sitio entero.
 *
 * El enlace de cada entrada es también su `guid`: la dirección de una publicación no cambia, así
 * que identifica bien y evita que un lector muestre la misma entrada dos veces.
 */
export function buildRssFeed({
  baseUrl,
  title,
  description,
  language,
  items,
}: RssFeedInput): string {
  const home = absoluteUrl(baseUrl, "/");
  const feedUrl = absoluteUrl(baseUrl, "/rss.xml");

  const entries = items.map((item) => {
    const url = absoluteUrl(baseUrl, item.path);
    const summary = buildMetaDescription(item.content);
    const date = item.publishedAt?.toUTCString();

    return [
      "    <item>",
      `      <title>${escapeXml(item.title)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      summary ? `      <description>${escapeXml(summary)}</description>` : null,
      date ? `      <pubDate>${date}</pubDate>` : null,
      "    </item>",
    ]
      .filter((line) => line !== null)
      .join("\n");
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(home)}</link>
    <description>${escapeXml(description)}</description>
    <language>${escapeXml(language)}</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${entries.join("\n")}
  </channel>
</rss>
`;
}
