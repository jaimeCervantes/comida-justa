import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { getHazloSanoProducts } from "../../data";
import {
  buildProductsMetadata,
  PRODUCTS_DESCRIPTION,
  PRODUCTS_TITLE,
} from "../../metadata";
import ProductsList from "../../ui/ProductsList";

type Props = {
  params: Promise<{ locale: string; page: string }>;
};

function parsePage(value: string): number | null {
  const page = parseInt(value, 10);
  return Number.isNaN(page) || page < 1 ? null : page;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page: pageStr } = await params;
  const page = parsePage(pageStr);

  return page ? buildProductsMetadata(page) : {};
}

export default async function ProductosPaginatedPage({ params }: Props) {
  const { page: pageStr, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const page = parsePage(pageStr);

  if (!page) {
    notFound();
  }

  const { products, totalPages } = await getHazloSanoProducts(page, locale);

  if (products.length === 0 && page > 1) {
    notFound();
  }

  return (
    <main>
      <h1 className="text-xl font-bold mb-2">{PRODUCTS_TITLE}</h1>

      <p className="mb-2">{PRODUCTS_DESCRIPTION}</p>

      <ProductsList
        products={products}
        currentPage={page}
        totalPages={totalPages}
      />

      <div className="text-center mt-4">
        <Link href="/productos" className="text-pw-lightgreen hover:underline">
          Volver a los productos
        </Link>
      </div>
    </main>
  );
}
