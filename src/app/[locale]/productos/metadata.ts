import type { Metadata } from "next";
import { CANONICAL_URL, PUBLIC_BRAND_NAME } from "~/infra/constants";

export const PRODUCTS_TITLE = `Productos de ${PUBLIC_BRAND_NAME}`;

export const PRODUCTS_DESCRIPTION = `Productos que vende ${PUBLIC_BRAND_NAME}, propios y de reventa, con su procedencia visible.`;

/** Metadata del listado de productos; `page` solo se refleja en el título y el canónico. */
export function buildProductsMetadata(page?: number): Metadata {
  const isFirstPage = !page || page === 1;
  const title = isFirstPage
    ? PRODUCTS_TITLE
    : `${PRODUCTS_TITLE} - Página ${page}`;
  const canonical = isFirstPage
    ? `${CANONICAL_URL}/productos`
    : `${CANONICAL_URL}/productos/page/${page}`;

  return {
    title,
    description: PRODUCTS_DESCRIPTION,
    openGraph: {
      title,
      description: PRODUCTS_DESCRIPTION,
      images: ["https://hazlosano.com/logo.webp"],
      type: "website",
    },
    alternates: {
      canonical,
    },
  };
}
