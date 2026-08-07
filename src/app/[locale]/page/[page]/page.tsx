import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import {
  DEFAULT_SHARE_IMAGE,
  PAGINATION_INIT_PAGE,
  PAGINATION_PAGE_SIZE,
  PUBLIC_BRAND_NAME,
} from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { readVisitorLocation } from "~/infra/location/visitorLocation";
import type { Post } from "~/infra/types/Posts";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";

type Props = {
  params: Promise<{ locale: string; page: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page: pageStr, locale } = await params;
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
      // Antes era `/og-image.jpg`, que no existe en `public/`: cada página de la paginación
      // compartía una imagen 404.
      images: [DEFAULT_SHARE_IMAGE],
    },
    alternates: localizedAlternates(
      { pathname: "/page/[page]", params: { page: String(page) } },
      resolveLocale(locale),
    ),
  };
}

async function getPosts(page: number, locale: string) {
  const pageNum = Math.max(PAGINATION_INIT_PAGE, page);
  const postRepo = createPostQueryRepository();

  const result = await postRepo.getMultiplePosts(
    pageNum,
    PAGINATION_PAGE_SIZE,
    await readVisitorLocation(),
  );

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
  const viewerId = await readViewerId();
  const t = await getTranslations("feed");
  const page = parseInt(pageStr, 10);

  // Validar que la página sea válida
  if (Number.isNaN(page) || page < 1) {
    notFound();
  }

  const { posts, totalPages } = await getPosts(page, locale);

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
            return <CardForList {...post} viewerId={viewerId} key={post.id} />;
          })
        )}
      </section>

      {/* Esta paginación estaba copiada a mano aquí, con la misma ventana de 5 páginas, el mismo
          estilo y "Anterior"/"Siguiente" escritos en español dentro del TSX. Es lo que hace
          `Pagination`, así que se usa el componente. */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        pathname="/page/[page]"
      />

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
