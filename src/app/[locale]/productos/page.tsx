import type { Metadata } from "next";
import { PAGINATION_INIT_PAGE } from "~/infra/constants";
import { getHazloSanoProducts } from "./data";
import {
  buildProductsMetadata,
  PRODUCTS_DESCRIPTION,
  PRODUCTS_TITLE,
} from "./metadata";
import ProductsList from "./ui/ProductsList";

export async function generateMetadata(): Promise<Metadata> {
  return buildProductsMetadata();
}

export default async function ProductosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { products, totalPages } = await getHazloSanoProducts(
    PAGINATION_INIT_PAGE,
    locale,
  );

  return (
    <main>
      <h1 className="text-xl font-bold mb-2">{PRODUCTS_TITLE}</h1>

      <p className="mb-2">{PRODUCTS_DESCRIPTION}</p>

      <ProductsList
        products={products}
        currentPage={PAGINATION_INIT_PAGE}
        totalPages={totalPages}
      />
    </main>
  );
}
