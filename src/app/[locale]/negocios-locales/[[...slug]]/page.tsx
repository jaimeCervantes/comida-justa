import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { resolveLocale } from "~/i18n/routing";
import type { AlternateHref } from "~/infra/UI/metadata/alternates";
import DirectorySection from "../../directorio/DirectoryPage";
import { listDirectory } from "../../directorio/data";
import { buildDirectoryMetadata } from "../../directorio/metadata";

type Props = {
  params: Promise<{ locale: string; slug?: string[] }>;
};

/** La sección no tiene hijas: `/negocios-locales/loquesea` es un 404, no la misma página. */
function ensureNoChildRoute(slug: string[] | undefined): void {
  if (slug && slug.length > 0) notFound();
}

/** El destino de la propia sección. Sin `as const`: `params.slug` tiene que ser un arreglo mutable. */
const HREF: AlternateHref = {
  pathname: "/negocios-locales/[[...slug]]",
  params: { slug: [] },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale: rawLocale } = await params;
  ensureNoChildRoute(slug);

  const locale = resolveLocale(rawLocale);
  const { total } = await listDirectory("businesses");

  return buildDirectoryMetadata("businesses", HREF, locale, total === 0);
}

export default async function NegociosLocalesPage({ params }: Props) {
  const { slug, locale: rawLocale } = await params;
  ensureNoChildRoute(slug);

  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  return <DirectorySection kind="businesses" />;
}
