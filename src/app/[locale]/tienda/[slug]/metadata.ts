import type { Metadata } from "next";
import type { Seller } from "~/domain/entities/seller/types";
import { CANONICAL_URL } from "~/infra/constants";
import { storePath } from "../../cuenta/storePath";

export function buildStoreMetadata(seller: Seller, page?: number): Metadata {
  const title =
    page && page > 1 ? `${seller.name} — página ${page}` : seller.name;
  const description =
    seller.description ?? `Lo que vende ${seller.name}, en un solo lugar.`;
  const path = storePath(seller.handle ?? "");
  const canonical = page && page > 1 ? `${path}/page/${page}` : path;

  return {
    title,
    description,
    alternates: { canonical: `${CANONICAL_URL}${canonical}` },
    openGraph: {
      title,
      description,
      url: `${CANONICAL_URL}${canonical}`,
      images: seller.logoUrl ? [{ url: seller.logoUrl }] : undefined,
    },
  };
}
