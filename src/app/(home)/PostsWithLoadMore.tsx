"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import type { Post } from "~/infra/types/Posts";
import CardForList from "~/infra/UI/components/CardForList/CardForList";

// Este componente maneja la carga dinámica del lado del cliente
export default function PostsWithLoadMore({
  initialPosts,
  totalPosts,
  initialPage = PAGINATION_INIT_PAGE,
  totalPages = Math.ceil(totalPosts / PAGINATION_PAGE_SIZE),
}: {
  initialPosts: Post[];
  totalPosts: number;
  initialPage?: number;
  totalPages: number;
}) {
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
        `/api/posts/page/${nextPage}/pageSize/${PAGINATION_PAGE_SIZE}`,
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
      console.error("Error cargando más publicaciones:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, hasMore, loading]);

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
          <p>No hay comidas publicadas aún.</p>
        ) : (
          posts.map((post: Post) => {
            return <CardForList {...post} key={post.id} />;
          })
        )}
      </section>

      <div ref={loaderRef} className="flex justify-center mt-8 py-4">
        {loading ? (
          <p className="text-gray-500">Cargando más...</p>
        ) : hasMore ? (
          <button
            type="button"
            onClick={loadMorePosts}
            className="bg-pw-lightgreen text-white px-5 py-2 rounded-full hover:bg-pw-green transition-colors"
          >
            Cargar más
          </button>
        ) : (
          posts.length > initialPosts.length && (
            <p className="text-gray-500">
              No hay más publicaciones disponibles
            </p>
          )
        )}
      </div>

      {/* Enlaces de paginación ocultos para SEO */}
      <nav aria-label="Paginación" className="sr-only">
        <ul>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <li key={`page-${page}`}>
              <Link href={`/page/${page}`}>Página {page}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
