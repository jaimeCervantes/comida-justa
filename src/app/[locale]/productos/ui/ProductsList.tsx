import { useTranslations } from "next-intl";
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

type ProductsListProps = {
  products: Post[];
  currentPage: number;
  totalPages: number;
  currentPillar: PublicationPillar | null;
  /** Si el listado está filtrado a lo que tiene promoción vigente (`?promocion=1`). */
  onSale?: boolean;
};

/**
 * Lo que la dirección tiene que conservar al paginar o al cambiar un filtro. El pilar y la
 * promoción se suman: «En promoción» dentro de un pilar es lo rebajado de ese pilar.
 */
function listingQuery(
  pillar: PublicationPillar | null,
  onSale: boolean,
): Record<string, string> | undefined {
  const query: Record<string, string> = {};

  if (pillar) query[PUBLICATION_PILLAR_QUERY_PARAM] = pillar;
  if (onSale) query[ON_SALE_QUERY_PARAM] = "1";

  return Object.keys(query).length > 0 ? query : undefined;
}

/** El listado desde la página 1, con la promoción puesta o quitada: con otro filtro, otra cuenta. */
function productsHref(
  pillar: PublicationPillar | null,
  onSale: boolean,
): AppHref {
  return {
    pathname: "/productos",
    query: listingQuery(pillar, onSale),
  } as AppHref;
}

/**
 * El interruptor «En promoción». Un enlace y no una casilla, como `facet-only-available` en la
 * búsqueda: el filtro vive en la dirección, así que se comparte y vuelve con el botón de atrás.
 */
function OnSaleFilter({
  pillar,
  onSale,
}: {
  pillar: PublicationPillar | null;
  onSale: boolean;
}) {
  const t = useTranslations("products");

  return (
    <div className="pt-4">
      <Link
        href={productsHref(pillar, !onSale)}
        aria-pressed={onSale}
        data-testid="products-on-sale-filter"
        className={cn(
          FILTER_CHIP,
          onSale
            ? "border-pw-green bg-pw-green text-white"
            : "border-separator bg-surface-elevation-1 text-text-base hover:bg-surface-elevation-2",
        )}
      >
        {t("onSaleFilter")}
      </Link>
    </div>
  );
}

export default function ProductsList({
  products,
  currentPage,
  totalPages,
  viewerId,
  currentPillar,
  onSale = false,
}: ProductsListProps & { viewerId?: string | null }) {
  const t = useTranslations("products");
  const pillarT = useTranslations("publicationPillars");

  /* Vacío por el filtro no es un catálogo vacío: invitar a publicar sería contestar otra pregunta.
     Se dice que ahora no hay ofertas y se ofrece el camino de vuelta, con el interruptor a la vista
     para quitarlo. */
  if (products.length === 0 && onSale) {
    return (
      <>
        <OnSaleFilter pillar={currentPillar} onSale />
        <EmptyState
          testId="products-on-sale-empty"
          className="mt-4"
          title={t("emptyOnSale")}
          action={
            <Link
              href={productsHref(currentPillar, false)}
              className={buttonVariants({ color: "green", size: "sm" })}
            >
              {t("seeAll")}
            </Link>
          }
        >
          {t("emptyOnSaleBody")}
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
      <OnSaleFilter pillar={currentPillar} onSale={onSale} />

      <section data-testid="products-grid" className={`${CARD_MASONRY} pt-6`}>
        {products.map((product: Post) => (
          <CardForList {...product} viewerId={viewerId} key={product.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/productos/page/[page]"
        query={listingQuery(currentPillar, onSale)}
      />
    </>
  );
}
