import { useTranslations } from "next-intl";
import {
  BRAND_QUERY_PARAM,
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
import { FILTER_CHIP } from "~/presentation/post/PublicationPillarFilter";
import { publicationPillarEmptyMessage } from "~/presentation/post/publicationPillarEmptyMessage";

export const PRODUCTS_BASE_PATH = "/productos/page";

/**
 * Los filtros del catálogo que viajan en la dirección, además del pilar: `?promocion=1`,
 * `?marca=…` y `?tienda=…`. Se suman entre sí y con el pilar.
 */
export type CatalogFilters = {
  onSale: boolean;
  brand: string | null;
  store: string | null;
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
  const query: Record<string, string> = {};

  if (pillar) query[PUBLICATION_PILLAR_QUERY_PARAM] = pillar;
  if (filters.onSale) query[ON_SALE_QUERY_PARAM] = "1";
  if (filters.brand) query[BRAND_QUERY_PARAM] = filters.brand;
  if (filters.store) query[STORE_QUERY_PARAM] = filters.store;

  return Object.keys(query).length > 0 ? query : undefined;
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

const CHIP_ON = "border-pw-green bg-pw-green text-white";
const CHIP_OFF =
  "border-separator bg-surface-elevation-1 text-text-base hover:bg-surface-elevation-2";

/**
 * Los filtros a la vista: el interruptor «En promoción» y, si se llegó con una marca o una tienda
 * —desde un slide del carrusel de ofertas—, esa marca o tienda con su ✕ para quitarla.
 *
 * Enlaces y no casillas, como `facet-only-available` en la búsqueda: el filtro vive en la
 * dirección, así que se comparte y vuelve con el botón de atrás.
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

  return (
    <div className="flex flex-wrap gap-2 pt-4">
      <Link
        href={productsHref(pillar, { ...filters, onSale: !filters.onSale })}
        aria-pressed={filters.onSale}
        data-testid="products-on-sale-filter"
        className={cn(FILTER_CHIP, filters.onSale ? CHIP_ON : CHIP_OFF)}
      >
        {t("onSaleFilter")}
      </Link>
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
  const pillarT = useTranslations("publicationPillars");
  const filtered =
    filters.onSale || filters.brand !== null || filters.store !== null;
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
          title={filters.onSale ? t("emptyOnSale") : t("emptyFiltered")}
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
