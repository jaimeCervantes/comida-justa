import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DEFAULT_SHARE_IMAGE, PUBLIC_BRAND_NAME } from "~/infra/constants";
import {
  type AlternateHref,
  localizedAlternates,
} from "~/infra/UI/metadata/alternates";
import { PILLARS } from "./components/pilaresData";

export async function buildPillarsOverviewMetadata(
  locale: string,
): Promise<Metadata> {
  const t = await getTranslations("pillarsOverview");

  return pageMetadata(
    t("metaTitle", { brand: PUBLIC_BRAND_NAME }),
    t("metaDescription"),
    pillarHref([]),
    locale,
  );
}

/**
 * La metadata de un pilar sale del catálogo, el mismo que pinta la página: si mañana cambia el
 * texto de un pilar, su descripción en el buscador cambia con él —y ahora también su idioma—.
 */
export async function buildPillarMetadata(
  slug: string,
  locale: string,
): Promise<Metadata> {
  const pillar = PILLARS.find((item) => item.slug === slug);

  if (!pillar) return {};

  const tPillars = await getTranslations("pillars");
  const tPages = await getTranslations("pillarPages");

  const subtitle = tPages(`${pillar.key}.subtitle`);
  const description = tPillars(`${pillar.key}.cardDescription`);

  return pageMetadata(
    tPillars(`${pillar.key}.title`),
    `${subtitle} ${description}`.slice(0, 300),
    pillarHref([pillar.slug]),
    locale,
  );
}

/** Los pilares son una ruta catch-all: el segmento viaja en `params`, vacío en la portada. */
function pillarHref(slug: string[]): AlternateHref {
  return { pathname: "/pilares/[[...slug]]", params: { slug } };
}

function pageMetadata(
  title: string,
  description: string,
  href: AlternateHref,
  locale: string,
): Metadata {
  const fullTitle = `${title} | ${PUBLIC_BRAND_NAME}`;
  const alternates = localizedAlternates(href, locale);

  return {
    title: fullTitle,
    description,
    alternates,
    openGraph: {
      title: fullTitle,
      description,
      url: alternates?.canonical?.toString(),
      type: "article",
      images: [DEFAULT_SHARE_IMAGE],
    },
  };
}
