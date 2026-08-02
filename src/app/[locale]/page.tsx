import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PostsWithLoadMore from "~/app/(home)/PostsWithLoadMore";
import { resolveLocale, routing } from "~/i18n/routing";
import {
  DEFAULT_SHARE_IMAGE,
  PAGINATION_INIT_PAGE,
  PAGINATION_PAGE_SIZE,
} from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";

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
    alternates: localizedAlternates("/", locale),
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
