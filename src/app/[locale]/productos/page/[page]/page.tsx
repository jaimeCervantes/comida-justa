import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { parsePublicationPillar } from "~/domain/entities/post/publicationPillars";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { Heading } from "~/presentation/design_system/typography/Heading";
import StoresMap from "~/presentation/location/StoresMap";
import { getProducts } from "../../data";
import { buildProductsMetadata } from "../../metadata";
import ProductsList from "../../ui/ProductsList";

type Props = {
  params: Promise<{ locale: string; page: string }>;
  searchParams: Promise<{ pillar?: string }>;
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

export default async function ProductosPaginatedPage({
  params,
  searchParams,
}: Props) {
  const { page: pageStr, locale: rawLocale } = await params;
  const { pillar } = await searchParams;
  const locale = resolveLocale(rawLocale);
  const currentPillar = parsePublicationPillar(pillar);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("products");
  const tDistance = await getTranslations("distance");
  const page = parsePage(pageStr);

  if (!page) {
    notFound();
  }

  const { products, totalPages, nothingNearby, visitor, storesToMap } =
    await getProducts(page, locale, currentPillar);

  if (products.length === 0 && page > 1) {
    notFound();
  }

  return (
    <main>
      <Heading level={1} className="mb-2">
        {t("title")}
      </Heading>

      <p className="mb-2">{t("description")}</p>

      {nothingNearby ? (
        <p
          data-testid="nothing-nearby"
          className="mb-2 text-sm text-text-support"
        >
          {tDistance("nothingNearby")}
        </p>
      ) : null}

      {/* El aviso de ubicación vive ahora en `NearbyBar`, en el chrome. */}
      {visitor ? <StoresMap visitor={visitor} stores={storesToMap} /> : null}

      <ProductsList
        viewerId={viewerId}
        products={products}
        currentPage={page}
        totalPages={totalPages}
        currentPillar={currentPillar}
      />

      <div className="text-center mt-4">
        <Link href="/productos" className="text-highlight hover:underline">
          {t("backToList")}
        </Link>
      </div>
    </main>
  );
}
