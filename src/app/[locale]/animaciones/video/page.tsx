import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPathname } from "~/i18n/navigation";
import { PILLARS_OVERVIEW_HREF } from "~/i18n/routes";
import { resolveLocale } from "~/i18n/routing";
import { PRODUCTION_URL } from "~/infra/constants";
import {
  OVERVIEW_CAPTION_KEYS,
  OVERVIEW_CHIP_KEYS,
  PILLARS_OVERVIEW_SCRIPT,
} from "~/presentation/habits/animations/pillarsOverviewScript";
import SocialComposition from "~/presentation/habits/animations/social/SocialComposition";
import {
  isSocialCut,
  isSocialFormat,
} from "~/presentation/habits/animations/social/socialCuts";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * El estudio de exportación de la animación a video: `?pieza=sueno&formato=vertical`.
 *
 * **Solo existe en desarrollo** (404 en producción): la abre `scripts/animations/render-video.mjs`
 * con Playwright, que la lleva cuadro por cuadro y captura. La composición cubre la ventana entera
 * por encima del resto del sitio, que sigue montado debajo porque el `<html>` lo pone el layout de
 * idioma.
 */
export default async function AnimationVideoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pieza?: string; formato?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const { pieza = "completo", formato = "vertical" } = await searchParams;
  if (!isSocialCut(pieza) || !isSocialFormat(formato)) notFound();

  const t = await getTranslations({ locale, namespace: "pillarAnimations" });
  const captions = PILLARS_OVERVIEW_SCRIPT.map((scene) =>
    OVERVIEW_CAPTION_KEYS[scene.id].map((key) => String(t.raw(key))),
  );
  const chips = PILLARS_OVERVIEW_SCRIPT.map((scene) =>
    t(OVERVIEW_CHIP_KEYS[scene.id]),
  );
  const siteUrl = `${new URL(PRODUCTION_URL).host}${getPathname({
    locale,
    href: PILLARS_OVERVIEW_HREF,
  })}`;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-black">
      <SocialComposition
        cut={pieza}
        format={formato}
        captions={captions}
        chips={chips}
        outroTitle={t("social.outroTitle")}
        siteUrl={siteUrl}
      />
    </div>
  );
}
