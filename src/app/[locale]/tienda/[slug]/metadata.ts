import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { Seller } from "~/domain/entities/seller/types";
import { resolveLocale } from "~/i18n/routing";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";

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
     y `/en/store/…` en inglés, y se declara la pareja para que no parezcan dos tiendas distintas.
     Concatenar `/page/N` a mano dejaría de valer en cuanto el segmento cambie de nombre. */
  const locale = resolveLocale(await getLocale());
  const handle = seller.handle ?? "";
  const alternates = localizedAlternates(
    page && page > 1
      ? {
          pathname: "/tienda/[slug]/page/[page]",
          params: { slug: handle, page: String(page) },
        }
      : { pathname: "/tienda/[slug]", params: { slug: handle } },
    locale,
  );

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates?.canonical?.toString(),
      images: seller.logoUrl ? [{ url: seller.logoUrl }] : undefined,
    },
  };
}
