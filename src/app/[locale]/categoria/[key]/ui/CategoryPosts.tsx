import { useTranslations } from "next-intl";
import {
  hasActiveToggle,
  type ListingFilterState,
  listingFilterParams,
  NO_LISTING_FILTERS,
} from "~/domain/entities/post/listingFilters";
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
  /** Pilar, existencia y promoción. Ver `parseListingFilters`. */
  filters?: ListingFilterState;
};

export default function CategoryPosts({
  posts,
  categoryKey,
  label,
  currentPage,
  totalPages,
  viewerId,
  filters = NO_LISTING_FILTERS,
}: CategoryPostsProps & { viewerId?: string | null }) {
  const t = useTranslations("category");
  const filtersT = useTranslations("listingFilters");
  const pillarT = useTranslations("publicationPillars");
  const { currentPillar } = filters;
  const params = { key: categoryKey };
  const query = listingQuery(listingFilterParams(filters));
  const filterBar = (
    <ListingFilterBar
      pathname="/categoria/[key]"
      params={params}
      filters={filters}
      className="mt-4"
    />
  );

  /* Vacío por un interruptor no es una categoría vacía: invitar al catálogo completo sería contestar
     otra pregunta. Lo escondido sigue ahí, así que el camino de vuelta es esta misma categoría sin
     los interruptores —con el pilar que se eligió—. */
  if (posts.length === 0 && hasActiveToggle(filters)) {
    return (
      <>
        {filterBar}
        <EmptyState
          testId="category-empty-only-available"
          className="mt-4"
          title={
            filters.onSale
              ? filtersT("nothingOnSale")
              : t("emptyOnlyAvailable", { category: label })
          }
          action={
            <Link
              href={
                {
                  pathname: "/categoria/[key]",
                  params,
                  query: listingQuery(
                    listingFilterParams({
                      ...NO_LISTING_FILTERS,
                      currentPillar,
                    }),
                  ),
                } as AppHref
              }
              className={buttonVariants({ color: "default", size: "sm" })}
            >
              {t("seeAllCategory")}
            </Link>
          }
        >
          {filters.onSale ? null : t("emptyOnlyAvailableBody")}
        </EmptyState>
      </>
    );
  }

  if (posts.length === 0) {
    return (
      <>
        {filterBar}
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
      {filterBar}
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
