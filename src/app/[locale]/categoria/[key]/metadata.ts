import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
import { DEFAULT_SHARE_IMAGE, PUBLIC_BRAND_NAME } from "~/infra/constants";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";
import { NOINDEX_METADATA } from "~/infra/UI/metadata/noindex";

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
  { page, isEmpty = false }: { page?: number; isEmpty?: boolean } = {},
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
    /* Una categoría activa pero sin publicaciones responde 200 con una lista vacía. Existe a
       propósito —el menú la enseña y se llenará— pero no es contenido: pedirle al buscador que la
       indexe hoy es ofrecerle una página hueca que compite con las que sí tienen algo. Hoy son 4
       de 10 (`abarrotes`, `frutas_y_verduras`, `sueno_y_descanso`, `movimiento_y_ejercicio`), y en
       cuanto alguien publique en ellas vuelven solas al índice y al sitemap. */
    ...(isEmpty ? NOINDEX_METADATA : {}),
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
