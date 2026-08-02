import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { Seller } from "~/domain/entities/seller/types";
import { getPathname } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
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
  /* La canónica se arma con la ruta **del idioma que se está sirviendo**: `/tienda/…` en español
     y `/en/store/…` en inglés. Concatenar `/page/N` a mano dejaría de valer en cuanto el segmento
     cambie de nombre, así que la paginada también se resuelve por `getPathname`. */
  const locale = resolveLocale(await getLocale());
  const handle = seller.handle ?? "";
  const canonical =
    page && page > 1
      ? getPathname({
          href: {
            pathname: "/tienda/[slug]/page/[page]",
            params: { slug: handle, page: String(page) },
          },
          locale,
        })
      : storePath(handle, locale);

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
