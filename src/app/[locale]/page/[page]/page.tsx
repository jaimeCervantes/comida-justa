import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CANONICAL_URL,
  PAGINATION_INIT_PAGE,
  PAGINATION_PAGE_SIZE,
  PUBLIC_BRAND_NAME,
} from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import type { Post } from "~/infra/types/Posts";
import CardForList from "~/infra/UI/components/CardForList/CardForList";
import { mapPostsToCards } from "~/infra/UI/mappers/posts/mapPostsToCards";

type Props = {
  params: Promise<{ page: string }>;
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

  return {
    title: `${PUBLIC_BRAND_NAME} - Página ${page}`,
    description: `Explora nuestra selección de alimentos en la página ${page}. Comida saludable para ti y tu comunidad.`,
    openGraph: {
      title: `${PUBLIC_BRAND_NAME} - Página ${page}`,
      description: `Explora nuestra selección de alimentos en la página ${page}. Comida saludable para ti y tu comunidad.`,
      images: ["/og-image.jpg"],
    },
    alternates: {
      canonical: `${CANONICAL_URL}/page/${page}`,
    },
  };
}

async function getPosts(page: number) {
  const pageNum = Math.max(PAGINATION_INIT_PAGE, page);
  const postRepo = createPostQueryRepository();

  const result = await postRepo.getMultiplePosts(pageNum, PAGINATION_PAGE_SIZE);

  return {
    ...result,
    posts: mapPostsToCards(result.posts),
    totalPages: Math.ceil(result.total / PAGINATION_PAGE_SIZE),
  };
}

export default async function PaginatedPage({ params }: Props) {
  const { page: pageStr } = await params;
  const page = parseInt(pageStr, 10);

  // Validar que la página sea válida
  if (Number.isNaN(page) || page < 1) {
    notFound();
  }

  const { posts, totalPages, nextPage, prevPage } = await getPosts(page);

  // Si la página no tiene contenido y está fuera de rango, mostrar 404
  if (posts.length === 0 && page > 1 && page > totalPages) {
    notFound();
  }

  return (
    <main>
      <h1 className="text-xl font-bold">
        {PUBLIC_BRAND_NAME}: ¿Como evitar enfermedades, ahorrar tiempo y dinero,
        al mismo tiempo que apoyas al medio ambiente y a tu comunidad?
      </h1>

      <section className="grid grid-flow-dense gap-4 pt-6 max-sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {posts.length === 0 ? (
          <p>No hay comidas publicadas en esta página.</p>
        ) : (
          posts.map((post: Post) => {
            return <CardForList {...post} key={post.id} />;
          })
        )}
      </section>

      {/* Paginación visible para SEO y usabilidad */}
      <nav
        aria-label="Paginación"
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
            Volver a la página principal
          </Link>
        </div>
      )}
    </main>
  );
}
