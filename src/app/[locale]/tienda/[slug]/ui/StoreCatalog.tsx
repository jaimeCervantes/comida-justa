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
import { listingQuery } from "~/presentation/post/ListingFilters/listingQuery";
import { publicationPillarEmptyMessage } from "~/presentation/post/publicationPillarEmptyMessage";
import StoreSearchField from "./StoreSearchField";

export default function StoreCatalog({
  catalog,
  handle,
  currentPage,
  totalPages,
  viewerId,
  viewerSellerId,
  filters = NO_LISTING_FILTERS,
  term,
}: {
  catalog: Post[];
  handle: string;
  currentPage: number;
  totalPages: number;
  /** Pilar, existencia y promoción. Sin `disponibles`, lo agotado sale con su insignia. */
  filters?: ListingFilterState;
  /** Lo que se está buscando ahora mismo, ya normalizado. Vacío = no se está filtrando. */
  term: string;
  /** Quién mira: decide si sus propias publicaciones le ofrecen editar y marcar agotado. */
  viewerId?: string | null;
  /**
   * La tienda de quien mira, cuando es **ésta**.
   *
   * Es la segunda vía de `canManagePost`: su dueño lleva el inventario de todo el catálogo, lo
   * escribiera quien lo escribiera. Nulo para cualquier visitante, incluido el dueño de otra tienda.
   */
  viewerSellerId?: string | null;
}) {
  const t = useTranslations("store");
  const filtersT = useTranslations("listingFilters");
  const pillarT = useTranslations("publicationPillars");
  const params = { slug: handle };
  /* Los filtros y la búsqueda viajan juntos: pasar de página, cambiar un filtro o buscar otra cosa
     no puede tirar lo que se estaba mirando. */
  const query = listingQuery({ ...listingFilterParams(filters), q: term });

  const controls = (
    <>
      <StoreSearchField handle={handle} term={term} filters={filters} />
      <ListingFilterBar
        pathname="/tienda/[slug]"
        params={params}
        query={{ q: term }}
        filters={filters}
      />
    </>
  );

  if (catalog.length === 0) {
    return (
      <>
        {controls}
        <p data-testid="store-empty" className="pt-4">
          {/* Buscar y no encontrar no es lo mismo que una tienda sin catálogo: lo primero se
              arregla borrando el término, lo segundo apagando el filtro y lo tercero publicando. */}
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
      {controls}
      <section data-testid="store-catalog" className={`${CARD_MASONRY} pt-6`}>
        {catalog.map((post: Post) => (
          <CardForList
            {...post}
            viewerId={viewerId}
            viewerSellerId={viewerSellerId}
            key={post.id}
          />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/tienda/[slug]/page/[page]"
        params={params}
        query={query}
      />
    </>
  );
}
