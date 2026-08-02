import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CANONICAL_URL } from "~/infra/constants";

/** Metadata del listado de productos; `page` solo se refleja en el título y el canónico. */
export async function buildProductsMetadata(page?: number): Promise<Metadata> {
  const t = await getTranslations("products");

  const isFirstPage = !page || page === 1;
  const baseTitle = t("title");
  const title = isFirstPage
    ? baseTitle
    : t("pagedTitle", { title: baseTitle, page });
  const description = t("description");
  const canonical = isFirstPage
    ? `${CANONICAL_URL}/productos`
    : `${CANONICAL_URL}/productos/page/${page}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ["https://hazlosano.com/logo.webp"],
      type: "website",
    },
    alternates: {
      canonical,
    },
  };
}
