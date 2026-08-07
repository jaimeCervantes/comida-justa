"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "~/i18n/navigation";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import type { Post } from "~/infra/types/Posts";
import CardForList from "~/presentation/post/CardForList/CardForList";

// Este componente maneja la carga dinámica del lado del cliente
export default function PostsWithLoadMore({
  initialPosts,
  totalPosts,
  initialPage = PAGINATION_INIT_PAGE,
  totalPages = Math.ceil(totalPosts / PAGINATION_PAGE_SIZE),
  locale,
  viewerId,
}: {
  initialPosts: Post[];
  /** Quién mira: decide si sus propias publicaciones le ofrecen editar y marcar agotado. */
  viewerId?: string | null;

  totalPosts: number;
  initialPage?: number;
  totalPages: number;
  /** Viaja al endpoint para que las páginas siguientes traigan la etiqueta en el mismo idioma. */
  locale: string;
}) {
  const t = useTranslations("feed");
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialPosts.length < totalPosts);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMorePosts = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const nextPage = currentPage + 1;

      const response = await fetch(
        `/api/posts/page/${nextPage}/pageSize/${PAGINATION_PAGE_SIZE}?locale=${encodeURIComponent(locale)}`,
      );
      const data = await response.json();

      if (data.posts && data.posts.length > 0) {
        setPosts((prevPosts) => [...prevPosts, ...data.posts]);
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
  }, [currentPage, hasMore, loading, locale]);

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
      <section className="grid grid-flow-dense gap-4 pt-6 max-sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {posts.length === 0 ? (
          <p>{t("empty")}</p>
        ) : (
          posts.map((post: Post) => {
            return <CardForList {...post} viewerId={viewerId} key={post.id} />;
          })
        )}
      </section>

      <div ref={loaderRef} className="flex justify-center mt-8 py-4">
        {loading ? (
          <p className="text-gray-500">{t("loadingMore")}</p>
        ) : hasMore ? (
          <button
            type="button"
            onClick={loadMorePosts}
            className="bg-pw-lightgreen text-white px-5 py-2 rounded-full hover:bg-pw-green transition-colors"
          >
            {t("loadMore")}
          </button>
        ) : (
          posts.length > initialPosts.length && (
            <p className="text-gray-500">{t("noMore")}</p>
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
