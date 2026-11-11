import { useTranslations } from "next-intl";
import {
  BRAND_QUERY_PARAM,
  ONLY_AVAILABLE_QUERY_PARAM,
  STORE_QUERY_PARAM,
} from "~/domain/entities/post/catalogFilters";
import { ON_SALE_QUERY_PARAM } from "~/domain/entities/post/promotion";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { type AppHref, Link } from "~/i18n/navigation";
import type { Post } from "~/infra/types/Posts";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { EmptyState } from "~/presentation/design_system/feedback/EmptyState";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import { CARD_MASONRY } from "~/presentation/design_system/surfaces/cardList";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";
import {
  CHIP_ON,
  FILTER_CHIP,
} from "~/presentation/post/ListingFilters/filterChip";
import { listingQuery as mergeListingQuery } from "~/presentation/post/ListingFilters/listingQuery";
import { publicationPillarEmptyMessage } from "~/presentation/post/publicationPillarEmptyMessage";

export const PRODUCTS_BASE_PATH = "/productos/page";

/**
 * Los filtros del catálogo que viajan en la dirección, además del pilar: `?promocion=1`,
 * `?marca=…`, `?tienda=…` y `?disponibles=1`. Se suman entre sí y con el pilar.
 *
 * «En promoción» y «Solo con existencia» no se pintan aquí sino en la barra de cercanía del chrome,
 * junto al pilar; esta lista solo los necesita para conservarlos al paginar y al quitar la marca.
 */
export type CatalogFilters = {
  onSale: boolean;
  brand: string | null;
  store: string | null;
  onlyAvailable?: boolean;
};

const NO_FILTERS: CatalogFilters = { onSale: false, brand: null, store: null };

type ProductsListProps = {
  products: Post[];
  currentPage: number;
  totalPages: number;
  currentPillar: PublicationPillar | null;
  filters?: CatalogFilters;
};

/** Lo que la dirección tiene que conservar al paginar o al cambiar un filtro. */
function listingQuery(
  pillar: PublicationPillar | null,
  filters: CatalogFilters,
): Record<string, string> | undefined {
  return mergeListingQuery({
    [PUBLICATION_PILLAR_QUERY_PARAM]: pillar,
    [ON_SALE_QUERY_PARAM]: filters.onSale ? "1" : undefined,
    [BRAND_QUERY_PARAM]: filters.brand,
    [STORE_QUERY_PARAM]: filters.store,
    [ONLY_AVAILABLE_QUERY_PARAM]: filters.onlyAvailable ? "1" : undefined,
  });
}

/** El listado desde la página 1 con otros filtros: con otro filtro, otra cuenta. */
function productsHref(
  pillar: PublicationPillar | null,
  filters: CatalogFilters,
): AppHref {
  return {
    pathname: "/productos",
    query: listingQuery(pillar, filters),
  } as AppHref;
}

/**
 * La marca o la tienda con la que se llegó —desde un slide del carrusel de ofertas—, con su ✕ para
 * quitarla. No es un filtro que se elija, así que no está en la barra.
 *
 * «En promoción» vivía aquí; desde el slice 4 de
 * `docs/features/catalog/005-2026-11-10-filtros-del-catalogo.md` está en la barra de cercanía del
 * chrome, junto al pilar y a «Solo con existencia», como en el resto de los listados.
 */
function FilterChips({
  pillar,
  filters,
  storeName,
}: {
  pillar: PublicationPillar | null;
  filters: CatalogFilters;
  /** El nombre de la tienda filtrada, si se sabe; si no, su handle. */
  storeName: string | null;
}) {
  const t = useTranslations("products");
  const storeLabel = filters.store ? (storeName ?? filters.store) : null;
  const groupLabel = filters.brand ?? storeLabel;

  if (!groupLabel) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-4">
      {groupLabel ? (
        <Link
          href={productsHref(pillar, { ...filters, brand: null, store: null })}
          aria-label={t("removeFilter", { label: groupLabel })}
          data-testid="products-group-filter"
          className={cn(FILTER_CHIP, CHIP_ON, "gap-2")}
        >
          {groupLabel}
          <span aria-hidden>✕</span>
        </Link>
      ) : null}
    </div>
  );
}

export default function ProductsList({
  products,
  currentPage,
  totalPages,
  viewerId,
  currentPillar,
  filters = NO_FILTERS,
}: ProductsListProps & { viewerId?: string | null }) {
  const t = useTranslations("products");
  const filtersT = useTranslations("listingFilters");
  const pillarT = useTranslations("publicationPillars");
  const filtered =
    filters.onSale ||
    filters.brand !== null ||
    filters.store !== null ||
    Boolean(filters.onlyAvailable);
  const storeName = filters.store
    ? (products.find((product) => product.seller?.handle === filters.store)
        ?.seller?.name ?? null)
    : null;
  const chips = (
    <FilterChips
      pillar={currentPillar}
      filters={filters}
      storeName={storeName}
    />
  );

  /* Vacío por el filtro no es un catálogo vacío: invitar a publicar sería contestar otra pregunta.
     Se dice que ahora no hay ofertas y se ofrece el camino de vuelta, con el interruptor a la vista
     para quitarlo. */
  if (products.length === 0 && filtered) {
    return (
      <>
        {chips}
        <EmptyState
          testId="products-on-sale-empty"
          className="mt-4"
          title={
            filters.onSale
              ? t("emptyOnSale")
              : filters.onlyAvailable && !filters.brand && !filters.store
                ? filtersT("nothingInStock")
                : t("emptyFiltered")
          }
          action={
            <Link
              href={productsHref(currentPillar, NO_FILTERS)}
              className={buttonVariants({ color: "green", size: "sm" })}
            >
              {t("seeAll")}
            </Link>
          }
        >
          {filters.onSale ? t("emptyOnSaleBody") : null}
        </EmptyState>
      </>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        testId="products-empty"
        className="mt-4"
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
    );
  }

  return (
    <>
      {chips}

      <section data-testid="products-grid" className={`${CARD_MASONRY} pt-6`}>
        {products.map((product: Post) => (
          <CardForList {...product} viewerId={viewerId} key={product.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/productos/page/[page]"
        query={listingQuery(currentPillar, filters)}
      />
    </>
  );
}
