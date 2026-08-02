import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PostsWithLoadMore from "~/app/(home)/PostsWithLoadMore";
import { buildSiteJsonLd } from "~/domain/seo/jsonLd/site";
import { ensureAbsoluteUrl } from "~/domain/seo/url";
import { resolveLocale, routing } from "~/i18n/routing";
import {
  BRAND_SOCIAL_URLS,
  CANONICAL_URL,
  DEFAULT_SHARE_IMAGE,
  PAGINATION_INIT_PAGE,
  PAGINATION_PAGE_SIZE,
  PUBLIC_BRAND_NAME,
} from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";
import JsonLd from "~/presentation/seo/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      images: [DEFAULT_SHARE_IMAGE],
      type: "website",
    },
    alternates: {
      ...localizedAlternates("/", locale),
      /* El feed se anuncia desde el home: es donde lo buscan tanto un lector de RSS como los
         rastreadores que lo usan para enterarse de lo nuevo sin recorrer el sitio entero. */
      types: {
        "application/rss+xml": [
          { url: "/rss.xml", title: `${PUBLIC_BRAND_NAME} — publicaciones` },
        ],
      },
    },
  };
}

async function getPosts(locale: string) {
  const postRepo = createPostQueryRepository();

  const result = await postRepo.getMultiplePosts(
    PAGINATION_INIT_PAGE,
    PAGINATION_PAGE_SIZE,
  );

  return {
    ...result,
    posts: await mapPostsToCardsForLocale(result.posts, locale),
  };
}

export default async function Inicio({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  const { posts, total, totalPages } = await getPosts(locale);

  return (
    <main className="">
      {/* Quién publica el sitio. Va en el home y no en el layout: repetir la organización en cada
          página no la hace más creíble, y aquí es donde un rastreador entra primero. */}
      <JsonLd
        data={buildSiteJsonLd({
          siteUrl: CANONICAL_URL,
          brandName: PUBLIC_BRAND_NAME,
          logoUrl: ensureAbsoluteUrl(CANONICAL_URL, DEFAULT_SHARE_IMAGE),
          description: t("description"),
          sameAs: BRAND_SOCIAL_URLS,
          inLanguage: locale,
        })}
      />
      <h1 className="text-xl font-bold mb-2">{t("h1")}</h1>

      <p className="mb-2">{t("p1")}</p>

      <p>{t("p2")}</p>

      <PostsWithLoadMore
        initialPosts={posts}
        totalPosts={total}
        totalPages={totalPages}
        locale={locale}
      />
    </main>
  );
}
