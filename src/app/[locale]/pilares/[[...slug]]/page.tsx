import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
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
  const { slug } = await params;

  if (!slug || slug.length === 0) return buildPillarsOverviewMetadata();

  return buildPillarMetadata(slug[0]);
}

export default async function PilaresPage({ params }: Props) {
  const { slug, locale: rawLocale } = await params;
  setRequestLocale(resolveLocale(rawLocale));

  if (!slug || slug.length === 0) {
    return <PilaresOverviewPage />;
  }

  const pillarSlug = slug[0];

  switch (pillarSlug) {
    case "sueno":
      return <SuenoPage />;
    case "alimentacion":
      return <AlimentacionPage />;
    case "movimiento":
      return <MovimientoPage />;
    case "mente-espiritu":
      return <MenteEspirituPage />;
    default:
      return notFound();
  }
}
