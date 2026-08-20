import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { parsePublicationPillar } from "~/domain/entities/post/publicationPillars";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { PAGINATION_INIT_PAGE } from "~/infra/constants";
import LocationBanner from "~/presentation/location/LocationBanner";
import StoresMap from "~/presentation/location/StoresMap";
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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pillar?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const { pillar } = await searchParams;
  const locale = resolveLocale(rawLocale);
  const currentPillar = parsePublicationPillar(pillar);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("products");
  const tDistance = await getTranslations("distance");
  const {
    products,
    totalPages,
    nothingNearby,
    visitor,
    storesToMap,
    showSellerCta,
  } = await getProducts(PAGINATION_INIT_PAGE, locale, currentPillar);

  return (
    <main>
      <h1 className="text-xl font-bold mb-2">{t("title")}</h1>

      <p className="mb-2">{t("description")}</p>

      {nothingNearby ? (
        <p
          data-testid="nothing-nearby"
          className="mb-2 text-sm text-text-support"
        >
          {tDistance("nothingNearby")}
        </p>
      ) : null}

      {/* El banner va siempre: con ubicación es el chip que dice desde dónde se mide y deja
          corregirlo, y sin ella el aviso de por qué no hay distancias. El mapa es lo que sobra
          cuando no sabemos dónde estás —un mapa donde no te ves no ayuda a decidir—. */}
      <LocationBanner showSellerCta={showSellerCta} />

      {visitor ? <StoresMap visitor={visitor} stores={storesToMap} /> : null}

      <ProductsList
        viewerId={viewerId}
        products={products}
        currentPage={PAGINATION_INIT_PAGE}
        totalPages={totalPages}
        currentPillar={currentPillar}
      />
    </main>
  );
}
