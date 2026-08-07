import { getTranslations } from "next-intl/server";
import { buildRssFeed } from "~/domain/seo/rss";
import { routing } from "~/i18n/routing";
import { CANONICAL_URL, PUBLIC_BRAND_NAME } from "~/infra/constants";
import { getLatestPosts } from "~/infra/dataAccess/seo/PostgresFeedRepository";

/** Lo último, no todo: un feed es para enterarse de lo nuevo, no para recorrer el archivo. */
const FEED_SIZE = 30;

/**
 * Se arma en cada petición, por lo mismo que el sitemap: una publicación nueva no puede esperar al
 * siguiente despliegue para aparecer.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  /* El feed va en español, y ahora es una **decisión** y no una consecuencia: desde el backfill de
     traducciones el contenido existe también en inglés. Un canal RSS declara un solo `language`, así
     que servir los dos idiomas pide un segundo canal (`/en/rss.xml`), no mezclarlos en este: un
     lector que se suscribe en español no quiere ver cada entrada dos veces. Queda pendiente. */
  const locale = routing.defaultLocale;
  const [posts, t] = await Promise.all([
    getLatestPosts(FEED_SIZE),
    getTranslations({ locale }),
  ]);

  const xml = buildRssFeed({
    baseUrl: CANONICAL_URL,
    title: PUBLIC_BRAND_NAME,
    description: t("feed.rssDescription"),
    language: locale,
    items: posts.map((post) => ({
      title: post.title,
      path: `/${post.slug}`,
      content: post.content,
      publishedAt: post.createdAt,
    })),
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Un lector que consulta cada pocos minutos no debe costar una consulta cada vez.
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
