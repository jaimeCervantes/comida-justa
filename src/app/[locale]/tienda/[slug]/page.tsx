import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { parsePublicationPillar } from "~/domain/entities/post/publicationPillars";
import type { User } from "~/domain/entities/post/types";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { readViewerId } from "~/infra/auth/readViewerId";
import { CANONICAL_URL, PAGINATION_INIT_PAGE } from "~/infra/constants";
import { readFollowState } from "~/infra/dataAccess/follows/readFollowState";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { Heading } from "~/presentation/design_system/typography/Heading";
import BranchList from "~/presentation/directory/BranchList/BranchList";
import JsonLd from "~/presentation/seo/JsonLd";
import { storePath } from "../../cuenta/storePath";
import { getStoreByHandle } from "./data";
import { buildStoreStructuredData } from "./jsonLd";
import { buildStoreMetadata } from "./metadata";
import StoreCatalog from "./ui/StoreCatalog";
import StoreHeader from "./ui/StoreHeader";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ pillar?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seller = await createSellerRepository().findByHandle(slug);

  return seller ? buildStoreMetadata(seller) : {};
}

export default async function StorePage({ params, searchParams }: Props) {
  const { slug, locale: rawLocale } = await params;
  const { pillar } = await searchParams;
  const locale = resolveLocale(rawLocale);
  const currentPillar = parsePublicationPillar(pillar);
  setRequestLocale(locale);
  const viewerId = await readViewerId();
  const t = await getTranslations("store");
  const session = await auth();

  // Se resuelve fuera de cualquier `<Suspense>`: una tienda inexistente debe salir con status 404
  // y no con un 200 que solo "parece" un 404.
  const store = await getStoreByHandle(
    slug,
    PAGINATION_INIT_PAGE,
    locale,
    (session?.user as User | undefined)?.id,
    currentPillar,
  );

  if (!store) {
    notFound();
  }

  return (
    <>
      {/* La canónica es la misma que declara la metadata: la tienda se identifica por una sola
          dirección aunque se sirva en dos idiomas. */}
      <JsonLd
        data={buildStoreStructuredData(
          store.seller,
          store.branches,
          `${CANONICAL_URL}${storePath(slug, locale)}`,
        )}
      />
      {/* El seguimiento se resuelve aquí y no dentro de la cabecera: es la página quien sabe quién
          mira. Van las dos lecturas juntas porque siempre se piden juntas. */}
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

      {store.branches.length > 0 ? (
        <section className="mb-6">
          <Heading level={2} size="xs" className="mb-2">
            {t("branchesHeading")}
          </Heading>
          <BranchList
            branches={store.branches}
            emptyMessage={t("noBranches")}
          />
        </section>
      ) : null}

      <StoreCatalog
        viewerId={viewerId}
        catalog={store.catalog}
        handle={slug}
        currentPage={PAGINATION_INIT_PAGE}
        totalPages={store.totalPages}
        currentPillar={currentPillar}
      />
    </>
  );
}
