import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "~/i18n/routing";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { mapPostsToCards } from "~/infra/UI/mappers/posts/mapPostsToCards";
import PostsWithLoadMore from "~/app/(home)/PostsWithLoadMore";
import {
  CANONICAL_URL,
  PAGINATION_PAGE_SIZE,
  PAGINATION_INIT_PAGE,
} from "~/infra/constants";

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
      images: ["https://hazlosano.com/logo.webp"],
      type: "website",
    },
    alternates: {
      canonical: CANONICAL_URL,
    },
  };
}

async function getPosts() {
  const postRepo = createPostQueryRepository();

  const result = await postRepo.getMultiplePosts(
    PAGINATION_INIT_PAGE,
    PAGINATION_PAGE_SIZE,
  );

  return { ...result, posts: mapPostsToCards(result.posts) };
}

export default async function Inicio({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const { posts, total, totalPages } = await getPosts();

  return (
    <main className="">
      <h1 className="text-xl font-bold mb-2">{t("h1")}</h1>

      <p className="mb-2">{t("p1")}</p>

      <p>{t("p2")}</p>

      <PostsWithLoadMore
        initialPosts={posts}
        totalPosts={total}
        totalPages={totalPages}
      />
    </main>
  );
}
