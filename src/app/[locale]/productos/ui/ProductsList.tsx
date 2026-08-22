import { useTranslations } from "next-intl";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import { Link } from "~/i18n/navigation";
import type { Post } from "~/infra/types/Posts";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { EmptyState } from "~/presentation/design_system/feedback/EmptyState";
import { CARD_MASONRY } from "~/presentation/design_system/surfaces/cardList";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";
import PublicationPillarFilter from "~/presentation/post/PublicationPillarFilter";
import { publicationPillarEmptyMessage } from "~/presentation/post/publicationPillarEmptyMessage";

export const PRODUCTS_BASE_PATH = "/productos/page";

type ProductsListProps = {
  products: Post[];
  currentPage: number;
  totalPages: number;
  currentPillar: PublicationPillar | null;
};

export default function ProductsList({
  products,
  currentPage,
  totalPages,
  viewerId,
  currentPillar,
}: ProductsListProps & { viewerId?: string | null }) {
  const t = useTranslations("products");
  const pillarT = useTranslations("publicationPillars");

  if (products.length === 0) {
    return (
      <>
        <PublicationPillarFilter
          currentPillar={currentPillar}
          pathname="/productos"
        />
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
      </>
    );
  }

  return (
    <>
      <PublicationPillarFilter
        currentPillar={currentPillar}
        pathname="/productos"
      />
      <section data-testid="products-grid" className={`${CARD_MASONRY} pt-6`}>
        {products.map((product: Post) => (
          <CardForList {...product} viewerId={viewerId} key={product.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/productos/page/[page]"
        query={
          currentPillar
            ? { [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar }
            : undefined
        }
      />
    </>
  );
}
