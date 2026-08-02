import type { Branch, Seller } from "~/domain/entities/seller/types";
import { buildStoreJsonLd } from "~/domain/seo/jsonLd/store";
import type { JsonLdNode } from "~/domain/seo/jsonLd/types";
import { ensureAbsoluteUrl } from "~/domain/seo/url";
import { CANONICAL_URL } from "~/infra/constants";

/** Traduce la tienda y sus sucursales al vocabulario de schema.org. */
export function buildStoreStructuredData(
  seller: Seller,
  branches: readonly Branch[],
  canonical: string,
): JsonLdNode {
  return buildStoreJsonLd({
    url: canonical,
    name: seller.name,
    description: seller.description,
    phone: seller.phone,
    logoUrl: seller.logoUrl
      ? ensureAbsoluteUrl(CANONICAL_URL, seller.logoUrl)
      : null,
    website: seller.url,
    branches: branches.map((branch) => ({
      name: branch.name,
      address: branch.address,
      mapUrl: branch.mapUrl,
      latitude: branch.coordinates?.latitude ?? null,
      longitude: branch.coordinates?.longitude ?? null,
    })),
  });
}
