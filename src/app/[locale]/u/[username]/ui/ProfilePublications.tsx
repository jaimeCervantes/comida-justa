import { useTranslations } from "next-intl";
import {
  type ListingFilterState,
  listingFilterParams,
  NO_LISTING_FILTERS,
} from "~/domain/entities/post/listingFilters";
import type { Post } from "~/infra/types/Posts";
import { CARD_MASONRY } from "~/presentation/design_system/surfaces/cardList";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";
import { filteredEmptyMessage } from "~/presentation/post/ListingFilters/filteredEmptyMessage";
import ListingFilterBar from "~/presentation/post/ListingFilters/ListingFilterBar";
import ListingSearchField from "~/presentation/post/ListingFilters/ListingSearchField";
import { listingQuery } from "~/presentation/post/ListingFilters/listingQuery";
import { publicationPillarEmptyMessage } from "~/presentation/post/publicationPillarEmptyMessage";

export default function ProfilePublications({
  publications,
  username,
  currentPage,
  totalPages,
  viewerId,
  filters = NO_LISTING_FILTERS,
  term = "",
}: {
  publications: Post[];
  username: string;
  currentPage: number;
  totalPages: number;
  /** Pilar, existencia y promoción. Los anuncios y eventos no se agotan. */
  filters?: ListingFilterState;
  /** Lo que se está buscando, ya normalizado. Vacío = no se está buscando. */
  term?: string;
  /** Quién mira: decide si sus propias publicaciones le ofrecen editar y marcar agotado. */
  viewerId?: string | null;
}) {
  const t = useTranslations("profile");
  const filtersT = useTranslations("listingFilters");
  const pillarT = useTranslations("publicationPillars");
  const params = { username };
  /* El mismo buscador que la tienda: «Mis publicaciones» es este perfil visto por su dueño, y con
     decenas de publicaciones encontrar una era recorrer páginas. */
  const filterBar = (
    <div className="mt-4">
      <ListingSearchField
        pathname="/u/[username]"
        params={params}
        term={term}
        filters={filters}
        labels={{
          placeholder: t("searchPlaceholder"),
          label: t("searchLabel"),
        }}
        testId="profile-search"
      />
      <ListingFilterBar
        pathname="/u/[username]"
        params={params}
        query={{ q: term }}
        filters={filters}
      />
    </div>
  );

  if (publications.length === 0) {
    return (
      <>
        {filterBar}
        <p data-testid="profile-empty" className="pt-4">
          {/* Buscar y no encontrar no es lo mismo que no haber publicado nada. */}
          {term
            ? t("nothingFound")
            : (filteredEmptyMessage(filters, filtersT) ??
              publicationPillarEmptyMessage({
                currentPillar: filters.currentPillar,
                fallback: t("empty"),
                t: pillarT,
              }))}
        </p>
      </>
    );
  }

  return (
    <>
      {filterBar}
      <section
        data-testid="profile-publications"
        className={`${CARD_MASONRY} pt-6`}
      >
        {publications.map((post: Post) => (
          <CardForList {...post} viewerId={viewerId} key={post.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/u/[username]/page/[page]"
        params={params}
        query={listingQuery({ ...listingFilterParams(filters), q: term })}
      />
    </>
  );
}
