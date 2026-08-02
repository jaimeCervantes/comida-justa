import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
import { DEFAULT_SHARE_IMAGE, PUBLIC_BRAND_NAME } from "~/infra/constants";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";

/**
 * Metadata del catálogo de una categoría.
 *
 * La dirección se resuelve por `pathnames` para que el canónico apunte al idioma servido
 * (`/categoria/panaderia` o `/en/category/panaderia`) y para declarar la pareja: la clave de la
 * categoría es la misma en los dos idiomas, lo que cambia es el segmento y la etiqueta.
 */
export async function buildCategoryMetadata(
  key: string,
  label: string,
  page?: number,
): Promise<Metadata> {
  const t = await getTranslations("category");
  const locale = resolveLocale(await getLocale());

  const isFirstPage = !page || page === 1;
  const baseTitle = t("metaTitle", {
    category: label,
    brand: PUBLIC_BRAND_NAME,
  });
  const title = isFirstPage
    ? baseTitle
    : t("pagedTitle", { title: baseTitle, page });
  const description = t("metaDescription", {
    category: label,
    brand: PUBLIC_BRAND_NAME,
  });

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
        ? { pathname: "/categoria/[key]", params: { key } }
        : {
            pathname: "/categoria/[key]/page/[page]",
            params: { key, page: String(page) },
          },
      locale,
    ),
  };
}
