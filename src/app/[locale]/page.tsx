import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { hasLocale } from git;
import { routing } from '~/i18n/routing';
import { getMultiplePosts } from "~/infrastructure/dataAccess/getMultiplePosts";
import { mapPostsToCards } from "~/infrastructure/UI/mappers/posts/mapPostsToCards";
import PostsWithLoadMore from "~/app/(home)/PostsWithLoadMore";
import { CANONICAL_URL, PAGINATION_PAGE_SIZE, PAGINATION_INIT_PAGE } from '~/infrastructure/constants';
import { generateSeo } from './publicar/generateSeo';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'home' });

  return generateSeo({
    title: t('title'),
    description: t('description'),
    mediaUrl: 'https://lh3.googleusercontent.com/a/ACg8ocLcEstYUNw2NCAt88O6caTmUPrMMU6ywjcGeLQFBDONk2B1Tg=s96-c',
    url: `${CANONICAL_URL}/${locale}`,
  });
}

async function getPosts() {
  const result = await getMultiplePosts(PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE);
  return { ...result, posts: mapPostsToCards(result.posts) };
}

export default async function Inicio({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const { posts, total, totalPages } = await getPosts();

  return (
    <main className="">
      <h1 className="text-xl font-bold mb-2">{t('h1')}</h1>
      <p className="mb-2">{t('p1')}</p>
      <p>{t('p2')}</p>
      <PostsWithLoadMore
        initialPosts={posts}
        totalPosts={total}
        totalPages={totalPages}
      />
    </main>
  );
}