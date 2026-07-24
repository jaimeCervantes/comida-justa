import CardForList from "~/infra/UI/components/CardForList/CardForList";
import Pagination from "~/infra/UI/components/Pagination";
import type { Post } from "~/infra/types/Posts";

export const PRODUCTS_BASE_PATH = "/productos/page";

export const PRODUCTS_EMPTY_MESSAGE =
  "Aún no hay productos de Hazlo Sano publicados.";

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
  if (products.length === 0) {
    return <p data-testid="products-empty">{PRODUCTS_EMPTY_MESSAGE}</p>;
  }

  return (
    <>
      <section
        data-testid="products-grid"
        className="grid grid-flow-dense gap-4 pt-6 max-sm:grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] sm:grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))]"
      >
        {products.map((product: Post) => (
          <CardForList {...product} key={product.id} />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={PRODUCTS_BASE_PATH}
      />
    </>
  );
}
