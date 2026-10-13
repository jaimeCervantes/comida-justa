import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { type AppLocale, resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";

/**
 * La entrada común de las cuatro páginas de difusión: fija el idioma y deja pasar solo al admin.
 *
 * 404 en vez de 403, como el resto de `/admin`: una página interna no tiene por qué revelar que
 * existe.
 */
export async function enterOutreachAdmin(
  rawLocale: string,
): Promise<AppLocale> {
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const session = await auth();

  if (!isAdmin(session?.user?.email)) notFound();

  return locale;
}

export async function outreachMetadata(): Promise<Metadata> {
  const t = await getTranslations("outreach");

  return {
    title: t("metaTitle", { brand: PUBLIC_BRAND_NAME }),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
  };
}
