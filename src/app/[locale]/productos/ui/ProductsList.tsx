import { useTranslations } from "next-intl";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
import type { Post } from "~/infra/types/Posts";
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
        <p data-testid="products-empty" className="pt-4">
          {publicationPillarEmptyMessage({
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
