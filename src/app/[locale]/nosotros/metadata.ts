import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CANONICAL_URL, PUBLIC_BRAND_NAME } from "~/infra/constants";

/** Metadata de la página de marca; el canónico vive en `/nosotros`, sin prefijo de locale. */
export async function buildAboutMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");

  const title = `${t("metaTitle", { brand: PUBLIC_BRAND_NAME })} - ${t("metaTitleSuffix")}`;
  const description = t("metaDescription", { brand: PUBLIC_BRAND_NAME });

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
      canonical: `${CANONICAL_URL}/nosotros`,
    },
  };
}
