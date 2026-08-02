import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getPathname } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { CANONICAL_URL, PUBLIC_BRAND_NAME } from "~/infra/constants";

/**
 * Metadata del catálogo de una categoría.
 *
 * El canónico se resuelve con `getPathname` para que apunte a la dirección **del idioma servido**
 * (`/categoria/panaderia` o `/en/category/panaderia`) en vez de concatenarse a mano.
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

  const path = isFirstPage
    ? getPathname({
        href: { pathname: "/categoria/[key]", params: { key } },
        locale,
      })
    : getPathname({
        href: {
          pathname: "/categoria/[key]/page/[page]",
          params: { key, page: String(page) },
        },
        locale,
      });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ["https://hazlosano.com/logo.webp"],
      type: "website",
    },
    alternates: { canonical: `${CANONICAL_URL}${path}` },
  };
}
