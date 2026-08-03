import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { readViewerId } from "~/infra/auth/readViewerId";
import { CANONICAL_URL, PAGINATION_INIT_PAGE } from "~/infra/constants";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import BranchList from "~/infra/UI/components/BranchList/BranchList";
import JsonLd from "~/presentation/seo/JsonLd";
import { storePath } from "../../cuenta/storePath";
import { getStoreByHandle } from "./data";
import { buildStoreStructuredData } from "./jsonLd";
import { buildStoreMetadata } from "./metadata";
import StoreCatalog from "./ui/StoreCatalog";
import StoreHeader from "./ui/StoreHeader";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seller = await createSellerRepository().findByHandle(slug);

  return seller ? buildStoreMetadata(seller) : {};
}

export default async function StorePage({ params }: Props) {
  const { slug, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
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
      <StoreHeader seller={store.seller} ownerUsername={store.ownerUsername} />

      {store.branches.length > 0 ? (
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2">{t("branchesHeading")}</h2>
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
      />
    </>
  );
}
