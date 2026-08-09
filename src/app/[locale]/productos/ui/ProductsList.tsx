import { useTranslations } from "next-intl";
import type { Post } from "~/infra/types/Posts";
import { CARD_MASONRY } from "~/presentation/design_system/surfaces/cardList";
import Pagination from "~/presentation/navigation/Pagination";
import CardForList from "~/presentation/post/CardForList/CardForList";

export const PRODUCTS_BASE_PATH = "/productos/page";

type ProductsListProps = {
  products: Post[];
  currentPage: number;
  totalPages: number;
};

export default function ProductsList({
  products,
  currentPage,
  totalPages,
  viewerId,
}: ProductsListProps & { viewerId?: string | null }) {
  const t = useTranslations("products");

  if (products.length === 0) {
    return <p data-testid="products-empty">{t("empty")}</p>;
  }

  return (
    <>
      <section data-testid="products-grid" className={`${CARD_MASONRY} pt-6`}>
        {products.map((product: Post) => (
          <CardForList {...product} viewerId={viewerId} key={product.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname="/productos/page/[page]"
      />
    </>
  );
}
