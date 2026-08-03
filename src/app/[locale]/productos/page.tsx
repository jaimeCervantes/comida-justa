import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
import { PAGINATION_INIT_PAGE } from "~/infra/constants";
import { getProducts } from "./data";
import { buildProductsMetadata } from "./metadata";
import ProductsList from "./ui/ProductsList";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildProductsMetadata(resolveLocale(locale));
}

export default async function ProductosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("products");
  const tDistance = await getTranslations("distance");
  const { products, totalPages, nothingNearby } = await getProducts(
    PAGINATION_INIT_PAGE,
    locale,
  );

  return (
    <main>
      <h1 className="text-xl font-bold mb-2">{t("title")}</h1>

      <p className="mb-2">{t("description")}</p>

      {nothingNearby ? (
        <p
          data-testid="nothing-nearby"
          className="mb-2 text-sm text-gray-600 dark:text-gray-400"
        >
          {tDistance("nothingNearby")}
        </p>
      ) : null}

      <ProductsList
        products={products}
        currentPage={PAGINATION_INIT_PAGE}
        totalPages={totalPages}
      />
    </main>
  );
}
