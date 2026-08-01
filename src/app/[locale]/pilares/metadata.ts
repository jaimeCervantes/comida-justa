import type { Metadata } from "next";
import { CANONICAL_URL, PUBLIC_BRAND_NAME } from "~/infra/constants";
import { PILLARS } from "./components/pilaresData";

export const PILLARS_TITLE = `Los 4 pilares de ${PUBLIC_BRAND_NAME}`;

export const PILLARS_DESCRIPTION =
  "Sueño y descanso, alimentación natural, movimiento y mente: los cuatro pilares sobre los que se construye una vida sana.";

export function buildPillarsOverviewMetadata(): Metadata {
  return pageMetadata(PILLARS_TITLE, PILLARS_DESCRIPTION, "/pilares");
}

/**
 * La metadata de un pilar sale de `PILLARS`, la misma constante que pinta la página: si mañana
 * cambia el texto de un pilar, su descripción en el buscador cambia con él.
 */
export function buildPillarMetadata(slug: string): Metadata {
  const pillar = PILLARS.find((item) => item.slug === slug);

  if (!pillar) return {};

  return pageMetadata(
    pillar.title,
    `${pillar.subtitle} ${pillar.description}`.slice(0, 300),
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
