import { useTranslations } from "next-intl";
import { ONLY_AVAILABLE_QUERY_PARAM } from "~/domain/entities/post/catalogFilters";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import type { Post } from "~/infra/types/Posts";
import { CARD_MASONRY } from "~/presentation/design_system/surfaces/cardList";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";
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
  currentPillar,
  term,
  onlyAvailable = false,
}: {
  catalog: Post[];
  handle: string;
  currentPage: number;
  totalPages: number;
  currentPillar: PublicationPillar | null;
  /** Lo que se está buscando ahora mismo, ya normalizado. Vacío = no se está filtrando. */
  term: string;
  /** `?disponibles=1`. Sin él, el catálogo enseña también lo agotado, con su insignia. */
  onlyAvailable?: boolean;
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
  const query = listingQuery({
    [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar,
    [ONLY_AVAILABLE_QUERY_PARAM]: onlyAvailable ? "1" : undefined,
    q: term,
  });

  const controls = (
    <>
      <StoreSearchField
        handle={handle}
        term={term}
        currentPillar={currentPillar}
        onlyAvailable={onlyAvailable}
      />
      <ListingFilterBar
        pathname="/tienda/[slug]"
        params={params}
        query={{ q: term }}
        currentPillar={currentPillar}
        onlyAvailable={onlyAvailable}
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
            : onlyAvailable
              ? filtersT("nothingInStock")
              : publicationPillarEmptyMessage({
                  currentPillar,
                  fallback: t("empty"),
                  t: pillarT,
                })}
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
