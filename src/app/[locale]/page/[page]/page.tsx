import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import {
  CANONICAL_URL,
  PAGINATION_INIT_PAGE,
  PAGINATION_PAGE_SIZE,
  PUBLIC_BRAND_NAME,
} from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import type { Post } from "~/infra/types/Posts";
import CardForList from "~/infra/UI/components/CardForList/CardForList";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";

type Props = {
  params: Promise<{ locale: string; page: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page: pageStr } = await params;
  const postRepo = createPostQueryRepository();
  const totalPosts = await postRepo.getTotalPosts();
  const totalPages = Math.ceil(totalPosts / PAGINATION_PAGE_SIZE);
  const page = parseInt(pageStr, 10);
  // Si la página no existe, no generamos metadata (notFound se manejará en el componente)
  if (Number.isNaN(page) || page < 1 || page > totalPages) {
    return {};
  }

  const t = await getTranslations("feed");
  const title = t("pageTitle", { brand: PUBLIC_BRAND_NAME, page });
  const description = t("pageDescription", { page });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ["/og-image.jpg"],
    },
    alternates: {
      canonical: `${CANONICAL_URL}/page/${page}`,
    },
  };
}

async function getPosts(page: number, locale: string) {
  const pageNum = Math.max(PAGINATION_INIT_PAGE, page);
  const postRepo = createPostQueryRepository();

  const result = await postRepo.getMultiplePosts(pageNum, PAGINATION_PAGE_SIZE);

  return {
    ...result,
    posts: await mapPostsToCardsForLocale(result.posts, locale),
    totalPages: Math.ceil(result.total / PAGINATION_PAGE_SIZE),
  };
}

export default async function PaginatedPage({ params }: Props) {
  const { page: pageStr, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("feed");
  const page = parseInt(pageStr, 10);

  // Validar que la página sea válida
  if (Number.isNaN(page) || page < 1) {
    notFound();
  }

  const { posts, totalPages, nextPage, prevPage } = await getPosts(
    page,
    locale,
  );

  // Si la página no tiene contenido y está fuera de rango, mostrar 404
  if (posts.length === 0 && page > 1 && page > totalPages) {
    notFound();
  }

  return (
    <main>
      <h1 className="text-xl font-bold">
        {t("pageHeading", { brand: PUBLIC_BRAND_NAME })}
      </h1>

      <section className="grid grid-flow-dense gap-4 pt-6 max-sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {posts.length === 0 ? (
          <p>{t("emptyPage")}</p>
        ) : (
          posts.map((post: Post) => {
            return <CardForList {...post} key={post.id} />;
          })
        )}
      </section>

      {/* Paginación visible para SEO y usabilidad */}
      <nav
        aria-label={t("paginationLabel")}
        className="flex justify-center mt-8 space-x-4"
      >
        {prevPage && page > 1 && (
          <Link
            href={`/page/${prevPage}`}
            className="px-4 py-2 border rounded-full bg-white dark:text-black hover:bg-gray-300"
          >
            Anterior
          </Link>
        )}

        {/* Mostrar números de página para navegación */}
        <div className="flex space-x-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Crear un rango de páginas centrado en la actual cuando sea posible
            const pageNum =
              page <= 3
                ? i + 1
                : page > totalPages - 2
                  ? totalPages - 4 + i
                  : page - 2 + i;

            if (pageNum > 0 && pageNum <= totalPages) {
              return (
                <Link
                  key={`page-link-${pageNum}`}
                  href={`/page/${pageNum}`}
                  className={`px-4 py-2 border rounded-full ${
                    pageNum === page
                      ? "bg-pw-lightgreen text-white"
                      : "bg-white dark:text-black hover:bg-gray-300"
                  }`}
                >
                  {pageNum}
                </Link>
              );
            }
            return null;
          })}
        </div>

        {nextPage && (
          <Link
            href={`/page/${nextPage}`}
            className="px-4 py-2 border rounded-full bg-white dark:text-black hover:bg-gray-300"
          >
            Siguiente
          </Link>
        )}
      </nav>

      {/* Enlace para volver a la página principal si no estamos en ella */}
      {page > 0 && (
        <div className="text-center mt-4">
          <Link href="/" className="text-pw-lightgreen hover:underline">
            {t("backToHome")}
          </Link>
        </div>
      )}
    </main>
  );
}
