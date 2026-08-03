import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import StoresMap from "~/presentation/location/StoresMap";
import { getProducts } from "../../data";
import { buildProductsMetadata } from "../../metadata";
import ProductsList from "../../ui/ProductsList";

type Props = {
  params: Promise<{ locale: string; page: string }>;
};

function parsePage(value: string): number | null {
  const page = parseInt(value, 10);
  return Number.isNaN(page) || page < 1 ? null : page;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page: pageStr, locale } = await params;
  const page = parsePage(pageStr);

  return page ? buildProductsMetadata(resolveLocale(locale), page) : {};
}

export default async function ProductosPaginatedPage({ params }: Props) {
  const { page: pageStr, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("products");
  const tDistance = await getTranslations("distance");
  const page = parsePage(pageStr);

  if (!page) {
    notFound();
  }

  const { products, totalPages, nothingNearby, visitor, storesToMap } =
    await getProducts(page, locale);

  if (products.length === 0 && page > 1) {
    notFound();
  }

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

      {visitor ? <StoresMap visitor={visitor} stores={storesToMap} /> : null}

      <ProductsList
        products={products}
        currentPage={page}
        totalPages={totalPages}
      />

      <div className="text-center mt-4">
        <Link href="/productos" className="text-pw-lightgreen hover:underline">
          {t("backToList")}
        </Link>
      </div>
    </main>
  );
}
