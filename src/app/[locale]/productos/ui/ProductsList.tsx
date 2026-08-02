import { useTranslations } from "next-intl";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import type { Post } from "~/infra/types/Posts";
import CardForList from "~/infra/UI/components/CardForList/CardForList";
import Pagination from "~/infra/UI/components/Pagination";

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
}: ProductsListProps) {
  const t = useTranslations("products");

  if (products.length === 0) {
    return (
      <p data-testid="products-empty">
        {t("empty", { brand: PUBLIC_BRAND_NAME })}
      </p>
    );
  }

  return (
    <>
      <section
        data-testid="products-grid"
        className="grid grid-flow-dense gap-4 pt-6 max-sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
      >
        {products.map((product: Post) => (
          <CardForList {...product} key={product.id} />
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
