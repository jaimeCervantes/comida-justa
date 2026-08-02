import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { DirectoryKind } from "~/domain/entities/seller/directory";
import { DEFAULT_SHARE_IMAGE, PUBLIC_BRAND_NAME } from "~/infra/constants";
import {
  type AlternateHref,
  localizedAlternates,
} from "~/infra/UI/metadata/alternates";
import { NOINDEX_METADATA } from "~/infra/UI/metadata/noindex";

/**
 * Metadata de una sección del directorio.
 *
 * **Vacía pide `noindex`**, igual que una categoría sin publicaciones: la sección existe a
 * propósito —está en el menú y se llenará— pero una lista hueca no es contenido que competir con
 * las páginas que sí tienen algo. Vuelve al índice sola en cuanto haya una tienda.
 */
export async function buildDirectoryMetadata(
  kind: DirectoryKind,
  href: AlternateHref,
  locale: string,
  isEmpty: boolean,
): Promise<Metadata> {
  const t = await getTranslations("directory");

  const title =
    kind === "producers"
      ? t("producersMetaTitle", { brand: PUBLIC_BRAND_NAME })
      : t("businessesMetaTitle", { brand: PUBLIC_BRAND_NAME });
  const description =
    kind === "producers"
      ? t("producersMetaDescription")
      : t("businessesMetaDescription");

  return {
    title,
    description,
    ...(isEmpty ? NOINDEX_METADATA : {}),
    openGraph: {
      title,
      description,
      images: [DEFAULT_SHARE_IMAGE],
      type: "website",
    },
    alternates: localizedAlternates(href, locale),
  };
}
