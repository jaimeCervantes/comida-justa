import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DEFAULT_SHARE_IMAGE } from "~/infra/constants";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";

/**
 * Metadata del listado de productos; `page` se refleja en el título y en la dirección.
 *
 * La dirección de cada idioma la resuelve `pathnames` (`/productos` y `/en/products`), así que la
 * versión inglesa deja de declararse copia de la española.
 */
export async function buildProductsMetadata(
  locale: string,
  page?: number,
): Promise<Metadata> {
  const t = await getTranslations("products");

  const isFirstPage = !page || page === 1;
  const baseTitle = t("title");
  const title = isFirstPage
    ? baseTitle
    : t("pagedTitle", { title: baseTitle, page });
  const description = t("description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [DEFAULT_SHARE_IMAGE],
      type: "website",
    },
    alternates: localizedAlternates(
      isFirstPage
        ? "/productos"
        : {
            pathname: "/productos/page/[page]",
            params: { page: String(page) },
          },
      locale,
    ),
  };
}
