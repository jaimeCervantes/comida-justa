import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { User } from "~/domain/entities/post/types";
import { auth } from "~/infra/auth";
import { PAGINATION_INIT_PAGE } from "~/infra/constants";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import BranchList from "~/infra/UI/components/BranchList/BranchList";
import { getStoreByHandle } from "./data";
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
  const { slug, locale } = await params;
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
      <StoreHeader seller={store.seller} ownerUsername={store.ownerUsername} />

      {store.branches.length > 0 ? (
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-2">Dónde encontrarnos</h2>
          <BranchList branches={store.branches} />
        </section>
      ) : null}

      <StoreCatalog
        catalog={store.catalog}
        handle={slug}
        currentPage={PAGINATION_INIT_PAGE}
        totalPages={store.totalPages}
      />
    </>
  );
}
