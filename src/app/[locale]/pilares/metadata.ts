import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CANONICAL_URL, PUBLIC_BRAND_NAME } from "~/infra/constants";
import { PILLARS } from "./components/pilaresData";

export async function buildPillarsOverviewMetadata(): Promise<Metadata> {
  const t = await getTranslations("pillarsOverview");

  return pageMetadata(
    t("metaTitle", { brand: PUBLIC_BRAND_NAME }),
    t("metaDescription"),
    "/pilares",
  );
}

/**
 * La metadata de un pilar sale del catálogo, el mismo que pinta la página: si mañana cambia el
 * texto de un pilar, su descripción en el buscador cambia con él —y ahora también su idioma—.
 */
export async function buildPillarMetadata(slug: string): Promise<Metadata> {
  const pillar = PILLARS.find((item) => item.slug === slug);

  if (!pillar) return {};

  const tPillars = await getTranslations("pillars");
  const tPages = await getTranslations("pillarPages");

  const subtitle = tPages(`${pillar.key}.subtitle`);
  const description = tPillars(`${pillar.key}.cardDescription`);

  return pageMetadata(
    tPillars(`${pillar.key}.title`),
    `${subtitle} ${description}`.slice(0, 300),
    `/pilares/${pillar.slug}`,
  );
}

function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const fullTitle = `${title} | ${PUBLIC_BRAND_NAME}`;
  const url = `${CANONICAL_URL}${path}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      type: "article",
      images: ["/logo.webp"],
    },
  };
}
