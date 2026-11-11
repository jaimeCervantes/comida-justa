import { useTranslations } from "next-intl";
import { ONLY_AVAILABLE_QUERY_PARAM } from "~/domain/entities/post/catalogFilters";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { type AppHref, Link } from "~/i18n/navigation";
import type { Post } from "~/infra/types/Posts";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { EmptyState } from "~/presentation/design_system/feedback/EmptyState";
import { CARD_MASONRY } from "~/presentation/design_system/surfaces/cardList";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";
import ListingFilterBar from "~/presentation/post/ListingFilters/ListingFilterBar";
import { listingQuery } from "~/presentation/post/ListingFilters/listingQuery";
import { publicationPillarEmptyMessage } from "~/presentation/post/publicationPillarEmptyMessage";

type CategoryPostsProps = {
  posts: Post[];
  categoryKey: string;
  label: string;
  currentPage: number;
  totalPages: number;
  currentPillar: PublicationPillar | null;
  /** `?disponibles=1`. */
  onlyAvailable?: boolean;
};

export default function CategoryPosts({
  posts,
  categoryKey,
  label,
  currentPage,
  totalPages,
  viewerId,
  currentPillar,
  onlyAvailable = false,
}: CategoryPostsProps & { viewerId?: string | null }) {
  const t = useTranslations("category");
  const pillarT = useTranslations("publicationPillars");
  const params = { key: categoryKey };
  const query = listingQuery({
    [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar,
    [ONLY_AVAILABLE_QUERY_PARAM]: onlyAvailable ? "1" : undefined,
  });
  const filters = (
    <ListingFilterBar
      pathname="/categoria/[key]"
      params={params}
      currentPillar={currentPillar}
      onlyAvailable={onlyAvailable}
      className="mt-4"
    />
  );

  /* Vacío por el filtro no es una categoría vacía: invitar al catálogo completo sería contestar otra
     pregunta. Lo agotado sigue ahí, así que el camino de vuelta es esta misma categoría sin el
     filtro —con el pilar que se eligió—. */
  if (posts.length === 0 && onlyAvailable) {
    return (
      <>
        {filters}
        <EmptyState
          testId="category-empty-only-available"
          className="mt-4"
          title={t("emptyOnlyAvailable", { category: label })}
          action={
            <Link
              href={
                {
                  pathname: "/categoria/[key]",
                  params,
                  query: listingQuery(query, {
                    [ONLY_AVAILABLE_QUERY_PARAM]: undefined,
                  }),
                } as AppHref
              }
              className={buttonVariants({ color: "default", size: "sm" })}
            >
              {t("seeAllCategory")}
            </Link>
          }
        >
          {t("emptyOnlyAvailableBody")}
        </EmptyState>
      </>
    );
  }

  if (posts.length === 0) {
    return (
      <>
        {filters}
        <EmptyState
          testId="category-empty"
          className="mt-4"
          title={publicationPillarEmptyMessage({
            currentPillar,
            fallback: t("empty", { category: label }),
            t: pillarT,
          })}
          action={
            <Link
              href="/productos"
              /* `default` y no `white`: la tarjeta del vacío ya es blanca, y el relleno blanco
                 dejaba el botón sin silueta. */
              className={buttonVariants({ color: "default", size: "sm" })}
            >
              {t("emptyCta")}
            </Link>
          }
        >
          {t("emptyBody")}
        </EmptyState>
      </>
    );
  }

  return (
    <>
      {filters}
      <section data-testid="category-grid" className={`${CARD_MASONRY} pt-6`}>
        {posts.map((post: Post) => (
          <CardForList {...post} viewerId={viewerId} key={post.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/categoria/[key]/page/[page]"
        params={params}
        query={query}
      />
    </>
  );
}
