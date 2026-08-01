import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { storePath } from "../../../../cuenta/storePath";
import { getStoreByHandle } from "../../data";
import { buildStoreMetadata } from "../../metadata";
import StoreCatalog from "../../ui/StoreCatalog";
import StoreHeader from "../../ui/StoreHeader";

type Props = {
  params: Promise<{ locale: string; slug: string; page: string }>;
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

export default async function StorePaginatedPage({ params }: Props) {
  const { slug, locale, page: pageStr } = await params;
  const page = parsePage(pageStr);

  if (!page) {
    notFound();
  }

  const store = await getStoreByHandle(slug, page, locale);

  if (!store || (store.catalog.length === 0 && page > 1)) {
    notFound();
  }

  return (
    <main className="p-4">
      <StoreHeader seller={store.seller} />

      <StoreCatalog
        catalog={store.catalog}
        handle={slug}
        currentPage={page}
        totalPages={store.totalPages}
      />

      <div className="text-center mt-4">
        <Link
          href={storePath(slug)}
          className="text-pw-lightgreen hover:underline"
        >
          Volver a la tienda
        </Link>
      </div>
    </main>
  );
}
