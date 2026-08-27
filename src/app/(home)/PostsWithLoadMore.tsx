"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { Link } from "~/i18n/navigation";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import type { Post } from "~/infra/types/Posts";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { EmptyState } from "~/presentation/design_system/feedback/EmptyState";
import MasonryColumns from "~/presentation/design_system/surfaces/MasonryColumns";
import CardForList from "~/presentation/post/CardForList/CardForList";
import { publicationPillarEmptyMessage } from "~/presentation/post/publicationPillarEmptyMessage";

type PostsPageResponse = {
  posts?: Post[];
  nextPage: number | null;
};

async function readPostsPage(response: Response): Promise<PostsPageResponse> {
  if (!response.ok) {
    throw new Error(`GET /api/posts failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      `GET /api/posts did not return JSON (${contentType || "no content-type"})`,
    );
  }

  return (await response.json()) as PostsPageResponse;
}

/**
 * El feed del home: la primera página la pinta el servidor y el resto la pide este componente.
 *
 * **Quien lo monta tiene que darle una `key` con `measuredFrom(visitor)`.** Lo que acumula en
 * `posts` es una copia de cliente de datos del servidor, y `useState` no vuelve a mirar sus props:
 * sin esa `key`, corregir la ubicación repintaba el chip de arriba y dejaba las tarjetas midiendo
 * desde donde estabas antes. La `key` es lo que hace que el feed empiece de nuevo justo cuando
 * empezar de nuevo es lo correcto, y solo entonces.
 */
export default function PostsWithLoadMore({
  initialPosts,
  totalPosts,
  initialPage = PAGINATION_INIT_PAGE,
  totalPages = Math.ceil(totalPosts / PAGINATION_PAGE_SIZE),
  locale,
  viewerId,
  currentPillar,
}: {
  initialPosts: Post[];
  /** Quién mira: decide si sus propias publicaciones le ofrecen editar y marcar agotado. */
  viewerId?: string | null;

  totalPosts: number;
  initialPage?: number;
  totalPages: number;
  /** Viaja al endpoint para que las páginas siguientes traigan la etiqueta en el mismo idioma. */
  locale: string;
  currentPillar: PublicationPillar | null;
}) {
  const t = useTranslations("feed");
  const pillarT = useTranslations("publicationPillars");
  /**
   * Una sola lista, otra vez.
   *
   * Estuvo partida en tandas —una por petición— para esquivar la multi-columna de CSS, que reparte
   * de nuevo TODAS las tarjetas al añadir y hacía subir lo ya visto. Eso lo arreglaba, pero dejaba
   * una costura con huecos cada nueve tarjetas, que es lo que se vio en pantalla.
   *
   * `MasonryColumns` da las dos cosas: reparte en el cliente, en orden y a la columna más corta, y
   * ese reparto **es estable al añadir** —colocar la número diez no puede cambiar dónde quedaron
   * las nueve anteriores—. Así que la lista vuelve a ser plana y no hay costura que enseñar.
   */
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialPosts.length < totalPosts);
  const loaderRef = useRef<HTMLDivElement>(null);

  function updatePostAvailability(postId: string, isAvailable: boolean): void {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        String(post.id) === postId ? { ...post, isAvailable } : post,
      ),
    );
  }

  const loadMorePosts = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const nextPage = currentPage + 1;

      const query = new URLSearchParams({ locale });
      if (currentPillar) {
        query.set(PUBLICATION_PILLAR_QUERY_PARAM, currentPillar);
      }
      const response = await fetch(
        `/api/posts/page/${nextPage}/pageSize/${PAGINATION_PAGE_SIZE}?${query.toString()}`,
      );
      const data = await readPostsPage(response);
      const newPosts = data.posts ?? [];

      if (newPosts.length > 0) {
        setPosts((prevPosts) => [...prevPosts, ...newPosts]);
        setCurrentPage(nextPage);
        setHasMore(data.nextPage !== null);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      // i18n-ignore: mensaje de consola para quien depura, no lo ve un visitante.
      console.error("Error cargando más publicaciones:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, hasMore, loading, locale, currentPillar]);

  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const current = loaderRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loading && hasMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(current);

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [loading, hasMore, loadMorePosts]);

  return (
    <>
      {posts.length === 0 ? (
        <EmptyState
          testId="feed-empty"
          className="mt-3"
          title={publicationPillarEmptyMessage({
            currentPillar,
            fallback: t("empty"),
            t: pillarT,
          })}
          action={
            <Link
              href="/publicar"
              className={buttonVariants({ color: "green", size: "sm" })}
            >
              {t("emptyCta")}
            </Link>
          }
        >
          {t("emptyBody")}
        </EmptyState>
      ) : (
        <MasonryColumns className="pt-3" testId="feed-masonry">
          {posts.map((post: Post) => (
            <CardForList
              {...post}
              viewerId={viewerId}
              onAvailabilityChange={updatePostAvailability}
              key={post.id}
            />
          ))}
        </MasonryColumns>
      )}

      <div ref={loaderRef} className="flex justify-center mt-8 py-4">
        {loading ? (
          <p className="text-text-support">{t("loadingMore")}</p>
        ) : hasMore ? (
          /* Rellenaba con `bg-pw-lightgreen` y texto blanco: 2.35:1, la mitad del mínimo AA, en el
             control más pulsado del home. El par primario está medido en los dos temas. */
          <button
            type="button"
            onClick={loadMorePosts}
            className="focus-ring bg-button-primary-bg text-button-primary-text hover:bg-button-primary-hover min-h-12 px-5 py-2 rounded-full font-semibold transition-colors"
          >
            {t("loadMore")}
          </button>
        ) : (
          // "No hay más" solo tiene sentido para quien llegó hasta aquí cargando algo.
          posts.length > initialPosts.length && (
            <p className="text-text-support">{t("noMore")}</p>
          )
        )}
      </div>

      {/* Enlaces de paginación ocultos para SEO */}
      <nav aria-label={t("paginationLabel")} className="sr-only">
        <ul>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <li key={`page-${page}`}>
              <Link
                href={{
                  pathname: "/page/[page]",
                  params: { page: String(page) },
                  query: currentPillar
                    ? { [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar }
                    : undefined,
                }}
              >
                {t("page", { page })}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
