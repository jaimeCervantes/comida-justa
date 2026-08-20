import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { parsePublicationPillar } from "~/domain/entities/post/publicationPillars";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { readFollowState } from "~/infra/dataAccess/follows/readFollowState";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { storeHref, storePath } from "../../../../cuenta/storePath";
import { getStoreByHandle } from "../../data";
import { buildStoreMetadata } from "../../metadata";
import StoreCatalog from "../../ui/StoreCatalog";
import StoreHeader from "../../ui/StoreHeader";

type Props = {
  params: Promise<{ locale: string; slug: string; page: string }>;
  searchParams: Promise<{ pillar?: string }>;
};

function parsePage(value: string): number | null {
  const page = parseInt(value, 10);
  return Number.isNaN(page) || page < 1 ? null : page;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, page: pageStr } = await params;
  const page = parsePage(pageStr);
  const seller = page
    ? await createSellerRepository().findByHandle(slug)
    : null;

  return seller && page ? buildStoreMetadata(seller, page) : {};
}

export default async function StorePaginatedPage({
  params,
  searchParams,
}: Props) {
  const { slug, locale: rawLocale, page: pageStr } = await params;
  const { pillar } = await searchParams;
  const locale = resolveLocale(rawLocale);
  const currentPillar = parsePublicationPillar(pillar);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("store");
  const page = parsePage(pageStr);

  if (!page) {
    notFound();
  }

  const store = await getStoreByHandle(
    slug,
    page,
    locale,
    viewerId,
    currentPillar,
  );

  if (!store || (store.catalog.length === 0 && page > 1)) {
    notFound();
  }

  return (
    <main className="p-4">
      <StoreHeader
        seller={store.seller}
        ownerUsername={store.ownerUsername}
        distanceMeters={store.distanceMeters}
        follow={
          await readFollowState(
            { kind: "seller", sellerId: store.seller.id },
            viewerId,
          )
        }
        canFollow={Boolean(viewerId)}
        isOwner={Boolean(viewerId) && store.seller.userId === viewerId}
        path={storePath(slug, locale)}
      />

      <StoreCatalog
        viewerId={viewerId}
        catalog={store.catalog}
        handle={slug}
        currentPage={page}
        totalPages={store.totalPages}
        currentPillar={currentPillar}
      />

      <div className="text-center mt-4">
        <Link href={storeHref(slug)} className="text-highlight hover:underline">
          {t("backToStore")}
        </Link>
      </div>
    </main>
  );
}
