"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "~/i18n/navigation";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import type { Post } from "~/infra/types/Posts";
import { CARD_MASONRY } from "~/presentation/design_system/surfaces/cardList";
import CardForList from "~/presentation/post/CardForList/CardForList";

/**
 * El feed del home: la primera página la pinta el servidor y el resto la pide este componente.
 *
 * **Quien lo monta tiene que darle una `key` con `measuredFrom(visitor)`.** Lo que acumula en
 * `batches` es una copia de cliente de datos del servidor, y `useState` no vuelve a mirar sus props:
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
  /**
   * Las tandas, no una lista plana: cada elemento es **lo que devolvió una petición**.
   *
   * No es un detalle de estructura, es lo que arregla un fallo. El feed se pinta en columnas
   * (mampostería), y `column-fill: balance` —el comportamiento por omisión— **reparte de nuevo
   * TODAS las tarjetas cada vez que se añade una**. Con una lista plana, cargar la página
   * siguiente no colocaba lo nuevo al final: recolocaba lo viejo, y varias tarjetas subían por
   * encima de donde estaba mirando quien había hecho scroll. Lo recién cargado quedaba fuera de
   * su vista salvo que volviera hacia arriba.
   *
   * Una tanda por petición, cada una en su propio bloque de columnas, hace que añadir la siguiente
   * no toque a las anteriores: nada se mueve y lo nuevo aparece siempre debajo. El precio es una
   * costura entre tandas, donde las columnas vuelven a empezar.
   *
   * Se modela por petición y no cortando de nueve en nueve porque la última página trae menos, y
   * un corte por tamaño fijo se desalinearía justo ahí.
   */
  const [batches, setBatches] = useState<Post[][]>([initialPosts]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialPosts.length < totalPosts);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadedCount = batches.reduce((total, batch) => total + batch.length, 0);

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
        setBatches((prevBatches) => [...prevBatches, data.posts]);
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
      {loadedCount === 0 ? (
        <p className="pt-6">{t("empty")}</p>
      ) : (
        /* Un bloque de columnas por tanda. La `key` es el id de su primera publicación y no el
           índice: las tandas solo se añaden al final, así que ese id no cambia nunca, y con él
           React no vuelve a montar las tarjetas ya pintadas. */
        batches.map((batch, index) => (
          <section
            key={String(batch[0]?.id ?? index)}
            className={`${CARD_MASONRY} ${index === 0 ? "pt-6" : "pt-4"}`}
            data-testid="feed-batch"
          >
            {batch.map((post: Post) => (
              <CardForList {...post} viewerId={viewerId} key={post.id} />
            ))}
          </section>
        ))
      )}

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
          // "No hay más" solo tiene sentido para quien llegó hasta aquí cargando algo.
          batches.length > 1 && <p className="text-gray-500">{t("noMore")}</p>
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
