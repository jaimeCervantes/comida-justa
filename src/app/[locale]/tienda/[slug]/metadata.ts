import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Seller } from "~/domain/entities/seller/types";
import { CANONICAL_URL } from "~/infra/constants";
import { storePath } from "../../cuenta/storePath";

export async function buildStoreMetadata(
  seller: Seller,
  page?: number,
): Promise<Metadata> {
  const t = await getTranslations("store");
  const tCommon = await getTranslations("common");

  const title =
    page && page > 1
      ? tCommon("pagedName", { name: seller.name, page })
      : seller.name;
  /* La descripción que escribió el vendedor manda: está en su idioma y es suya. El texto del
     catálogo solo cubre el hueco de quien no ha puesto ninguna. */
  const description =
    seller.description ?? t("metaDescription", { name: seller.name });
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
