import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { readCommunityGarden } from "~/infra/habits/readCommunityGarden";
import { readRecentPublicCelebrations } from "~/infra/habits/readRecentPublicCelebrations";
import AlimentacionPage from "../components/AlimentacionPage";
import MenteEspirituPage from "../components/MenteEspirituPage";
import MovimientoPage from "../components/MovimientoPage";
import PilaresOverviewPage from "../components/PilaresOverviewPage";
import SuenoPage from "../components/SuenoPage";
import { buildPillarMetadata, buildPillarsOverviewMetadata } from "../metadata";

type Props = {
  params: Promise<{
    locale: string;
    slug?: string[];
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);

  if (!slug || slug.length === 0) return buildPillarsOverviewMetadata(locale);

  return buildPillarMetadata(slug[0], locale);
}

export default async function PilaresPage({ params }: Props) {
  const { slug, locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  if (!slug || slug.length === 0) {
    const viewerId = await readViewerId();
    const [celebrations, garden] = await Promise.all([
      readRecentPublicCelebrations(viewerId),
      readCommunityGarden(),
    ]);

    return (
      <PilaresOverviewPage
        celebrations={celebrations}
        garden={garden}
        viewerSignedIn={viewerId !== null}
      />
    );
  }

  const pillarSlug = slug[0];

  switch (pillarSlug) {
    case "sueno":
      return <SuenoPage locale={locale} />;
    case "alimentacion":
      return <AlimentacionPage locale={locale} />;
    case "movimiento":
      return <MovimientoPage locale={locale} />;
    case "mente-espiritu":
      return <MenteEspirituPage locale={locale} />;
    default:
      return notFound();
  }
}
