import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DEFAULT_SHARE_IMAGE, PUBLIC_BRAND_NAME } from "~/infra/constants";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";

/** Metadata de la página de marca; existe en los dos idiomas, así que cada uno es canónico del suyo. */
export async function buildAboutMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations("about");

  const title = `${t("metaTitle", { brand: PUBLIC_BRAND_NAME })} - ${t("metaTitleSuffix")}`;
  const description = t("metaDescription", { brand: PUBLIC_BRAND_NAME });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [DEFAULT_SHARE_IMAGE],
      type: "website",
    },
    alternates: localizedAlternates("/nosotros", locale),
  };
}
